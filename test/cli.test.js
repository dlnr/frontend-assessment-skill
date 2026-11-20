import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(new URL("../bin/cli.js", import.meta.url));
const skillName = "frontend-assessment";
const companions = ["frontend-lighthouse", "frontend-performance"];

function write(file, content) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
}

function fixture(t) {
    const root = fs.mkdtempSync(
        path.join(os.tmpdir(), "frontend-assessment-cli-"),
    );
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const installer = path.join(root, "installer");
    const project = path.join(root, "project");
    const home = path.join(root, "home");
    const cli = path.join(installer, "bin", "cli.js");
    const source = path.join(installer, "skills", "SKILL.md");
    write(path.join(installer, "package.json"), '{"type":"module"}\n');
    fs.mkdirSync(path.dirname(cli), { recursive: true });
    fs.copyFileSync(cliPath, cli);
    fs.mkdirSync(project);
    fs.mkdirSync(home);
    write(
        source,
        `---\nname: ${skillName}\ndescription: Assess frontend health.\n---\nBundled assessment 📊\r\n`,
    );

    return {
        project,
        home,
        source,
        target: (base = project) =>
            path.join(base, ".agents", "skills", skillName, "SKILL.md"),
        companion: (name, base = project) =>
            path.join(base, ".agents", "skills", name),
        run(args = [], input = "") {
            const result = spawnSync(process.execPath, [cli, ...args], {
                cwd: project,
                env: { ...process.env, HOME: home, USERPROFILE: home },
                input,
                encoding: "utf8",
                timeout: 4000,
                killSignal: "SIGKILL",
            });
            assert.ifError(result.error);
            assert.equal(result.signal, null, result.stderr);
            return result;
        },
    };
}

function tree(directory, excludedFile) {
    return fs
        .readdirSync(directory, { withFileTypes: true })
        .filter((entry) => path.join(directory, entry.name) !== excludedFile)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((entry) => [
            entry.name,
            entry.isDirectory()
                ? tree(path.join(directory, entry.name), excludedFile)
                : fs
                      .readFileSync(path.join(directory, entry.name))
                      .toString("hex"),
        ]);
}

function assertInstalled(f, base = f.project) {
    assert.deepEqual(
        fs.readFileSync(f.target(base)),
        fs.readFileSync(f.source),
    );
}

function assertOnlyPrimaryInstalled(f, base = f.project) {
    assertInstalled(f, base);
    assert.deepEqual(fs.readdirSync(path.join(base, ".agents", "skills")), [
        skillName,
    ]);
    assert.deepEqual(fs.readdirSync(path.dirname(f.target(base))), [
        "SKILL.md",
    ]);
}

function seedPriorInstall(f, base = f.project) {
    write(f.target(base), "old primary\n");
    write(
        path.join(path.dirname(f.target(base)), "references", "custom.md"),
        "keep primary customization\n",
    );
    for (const name of companions) {
        write(path.join(f.companion(name, base), "SKILL.md"), `old ${name}\n`);
        write(
            path.join(f.companion(name, base), "references", "custom.md"),
            `keep ${name} customization\n`,
        );
    }
    write(
        path.join(base, ".agents", "skills", "other", "SKILL.md"),
        "keep another skill\n",
    );
    write(path.join(base, "keep.txt"), "keep unrelated project file\n");
}

function assertMigrationNote(result, names = companions) {
    assert.match(result.stdout, /Migration note/);
    assert.match(
        result.stdout,
        /Older standalone companions remain untouched and are no longer needed/,
    );
    for (const name of names) assert.ok(result.stdout.includes(name));
}

for (const [flag, scope] of [
    ["--project", "project"],
    ["-p", "project"],
    ["--global", "home"],
    ["-g", "home"],
]) {
    test(
        `fresh ${flag} install copies only the primary skill`,
        { timeout: 10000 },
        (t) => {
            const f = fixture(t);
            const result = f.run([flag]);
            assert.equal(result.status, 0, result.stderr);
            assertOnlyPrimaryInstalled(f, f[scope]);
            assert.deepEqual(
                tree(scope === "project" ? f.home : f.project),
                [],
            );
            assert.match(
                result.stdout,
                /Successfully installed frontend-assessment/,
            );
            assert.doesNotMatch(result.stdout, /Migration note|Overwrite/);
            for (const name of companions)
                assert.ok(!result.stdout.includes(name));
        },
    );
}

test(
    "real bundled main source has valid metadata and installs byte-for-byte",
    { timeout: 10000 },
    (t) => {
        const f = fixture(t);
        const source = fileURLToPath(
            new URL("../skills/SKILL.md", import.meta.url),
        );
        const content = fs.readFileSync(source, "utf8");
        const metadata = content.match(
            /^---\r?\nname: ([a-z0-9]+(?:-[a-z0-9]+)*)\r?\ndescription: ([^\r\n]+)\r?\n---/,
        );
        assert.ok(metadata, "Missing main skill metadata");
        assert.equal(metadata[1], skillName);
        assert.ok(metadata[1].length <= 64);
        assert.ok(metadata[2].length <= 1024);
        assert.match(content, /Modern Web Guidance Check/);
        assert.match(content, /Modern web guidance\s+\|\s+10/);
        assert.match(content, /110 points/);
        assert.match(content, /no production UI can be verified/);
        fs.copyFileSync(source, f.source);
        const result = f.run(["--project"]);
        assert.equal(result.status, 0, result.stderr);
        assertOnlyPrimaryInstalled(f);
        assert.deepEqual(fs.readFileSync(f.target()), fs.readFileSync(source));
        assert.deepEqual(tree(f.home), []);
    },
);

for (const [label, input, scope] of [
    ["project selection", "2\n", "project"],
    ["global selection", "1\n", "home"],
    ["default global selection", "\n", "home"],
]) {
    test(`interactive install supports ${label}`, { timeout: 10000 }, (t) => {
        const f = fixture(t);
        const result = f.run([], input);
        assert.equal(result.status, 0, result.stderr);
        assert.match(
            result.stdout,
            /Where would you like to install frontend-assessment/,
        );
        assertOnlyPrimaryInstalled(f, f[scope]);
        assert.deepEqual(tree(scope === "project" ? f.home : f.project), []);
    });
}

test("interactive cancellation writes nothing", { timeout: 10000 }, (t) => {
    const f = fixture(t);
    const result = f.run([], "3\n");
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /cancelled/);
    assert.deepEqual(tree(f.project), []);
    assert.deepEqual(tree(f.home), []);
});

for (const [scope, flags] of [
    ["project", ["--project", "--update"]],
    ["home", ["-g", "-u"]],
]) {
    test(
        `legacy primary-only ${scope} update creates no companions`,
        { timeout: 10000 },
        (t) => {
            const f = fixture(t);
            write(f.target(f[scope]), "legacy primary\n");
            const result = f.run(flags);
            assert.equal(result.status, 0, result.stderr);
            assertOnlyPrimaryInstalled(f, f[scope]);
            assert.doesNotMatch(result.stdout, /Overwrite|Migration note/);
            assert.match(
                result.stdout,
                /Successfully updated frontend-assessment/,
            );
            assert.deepEqual(
                tree(scope === "project" ? f.home : f.project),
                [],
            );
        },
    );

    test(
        `prior three-skill ${scope} update preserves companions and custom files`,
        { timeout: 10000 },
        (t) => {
            const f = fixture(t);
            const base = f[scope];
            seedPriorInstall(f, base);
            const before = tree(base, f.target(base));
            const result = f.run(flags);
            assert.equal(result.status, 0, result.stderr);
            assertInstalled(f, base);
            assert.deepEqual(tree(base, f.target(base)), before);
            assert.doesNotMatch(result.stdout, /Overwrite/);
            assertMigrationNote(result);
            assert.deepEqual(
                tree(scope === "project" ? f.home : f.project),
                [],
            );
        },
    );
}

for (const scope of ["project", "home"]) {
    for (const companionsExist of [false, true]) {
        test(
            `missing primary ${scope} update writes nothing (companions: ${companionsExist})`,
            { timeout: 10000 },
            (t) => {
                const f = fixture(t);
                const base = f[scope];
                write(path.join(base, "keep.txt"), "preserve me\n");
                write(
                    path.join(path.dirname(f.target(base)), "custom.md"),
                    "a primary directory alone is not an installed skill\n",
                );
                if (companionsExist) {
                    for (const name of companions) {
                        write(
                            path.join(f.companion(name, base), "SKILL.md"),
                            "existing companion\n",
                        );
                    }
                }
                const before = tree(base);
                const result = f.run([
                    scope === "project" ? "--project" : "--global",
                    "--update",
                ]);
                assert.equal(result.status, 1, result.stdout);
                assert.match(
                    result.stderr,
                    /No installed skill found to update/,
                );
                assert.deepEqual(tree(base), before);
                assert.deepEqual(
                    tree(scope === "project" ? f.home : f.project),
                    [],
                );
                if (companionsExist) assertMigrationNote(result);
            },
        );
    }
}

for (const answer of ["n\n", "\n"]) {
    test(
        `normal overwrite declined with ${JSON.stringify(answer)} preserves everything`,
        { timeout: 10000 },
        (t) => {
            const f = fixture(t);
            seedPriorInstall(f);
            const before = tree(f.project);
            const result = f.run(["--project"], answer);
            assert.equal(result.status, 0, result.stderr);
            assert.equal(
                (result.stdout.match(/Overwrite existing file/g) || []).length,
                1,
            );
            assert.ok(result.stdout.includes(f.target()));
            assert.match(result.stdout, /cancelled/);
            assert.deepEqual(tree(f.project), before);
            assert.deepEqual(tree(f.home), []);
            assertMigrationNote(result);
        },
    );
}

for (const answer of ["y\n", " YeS \n"]) {
    test(
        `normal overwrite accepted with ${JSON.stringify(answer)} changes only the primary`,
        { timeout: 10000 },
        (t) => {
            const f = fixture(t);
            seedPriorInstall(f);
            const before = tree(f.project, f.target());
            const result = f.run(["-p"], answer);
            assert.equal(result.status, 0, result.stderr);
            assert.equal(
                (result.stdout.match(/Overwrite existing file/g) || []).length,
                1,
            );
            assert.ok(result.stdout.includes(f.target()));
            assertInstalled(f);
            assert.deepEqual(tree(f.project, f.target()), before);
            assert.deepEqual(tree(f.home), []);
            assertMigrationNote(result);
        },
    );
}

test(
    "companions alone do not trigger overwrite confirmation",
    { timeout: 10000 },
    (t) => {
        const f = fixture(t);
        for (const name of companions) {
            write(path.join(f.companion(name), "SKILL.md"), `keep ${name}\n`);
        }
        const before = companions.map((name) => tree(f.companion(name)));
        const result = f.run(["--project"]);
        assert.equal(result.status, 0, result.stderr);
        assertInstalled(f);
        assert.deepEqual(
            companions.map((name) => tree(f.companion(name))),
            before,
        );
        assert.deepEqual(fs.readdirSync(path.dirname(f.target())), [
            "SKILL.md",
        ]);
        assert.doesNotMatch(result.stdout, /Overwrite/);
        assertMigrationNote(result);
        assert.deepEqual(tree(f.home), []);
    },
);

test(
    "an empty legacy companion directory is detected and preserved",
    { timeout: 10000 },
    (t) => {
        const f = fixture(t);
        fs.mkdirSync(f.companion(companions[0]), { recursive: true });
        const result = f.run(["--project"]);
        assert.equal(result.status, 0, result.stderr);
        assertInstalled(f);
        assert.deepEqual(tree(f.companion(companions[0])), []);
        assert.equal(fs.existsSync(f.companion(companions[1])), false);
        assertMigrationNote(result, [companions[0]]);
        assert.deepEqual(tree(f.home), []);
    },
);

for (const invalidSource of ["missing", "directory"]) {
    for (const mode of ["fresh", "overwrite", "update"]) {
        test(
            `${invalidSource} source preflight preserves data during ${mode}`,
            { timeout: 10000 },
            (t) => {
                const f = fixture(t);
                if (mode !== "fresh") seedPriorInstall(f);
                write(
                    path.join(f.project, "keep.txt"),
                    "preserve project data\n",
                );
                write(path.join(f.home, "keep.txt"), "preserve home data\n");
                fs.unlinkSync(f.source);
                if (invalidSource === "directory") fs.mkdirSync(f.source);
                const projectBefore = tree(f.project);
                const homeBefore = tree(f.home);
                const result = f.run(
                    mode === "update"
                        ? ["--project", "--update"]
                        : ["--project"],
                    "yes\n",
                );
                assert.equal(result.status, 1, result.stdout);
                assert.match(result.stderr, /Unable to read source skill file/);
                assert.ok(result.stderr.includes(f.source));
                assert.doesNotMatch(result.stdout, /Overwrite/);
                assert.deepEqual(tree(f.project), projectBefore);
                assert.deepEqual(tree(f.home), homeBefore);
            },
        );
    }
}

for (const help of ["--help", "-h"]) {
    test(
        `${help} explains the unified skill without requiring a source or writing files`,
        { timeout: 10000 },
        (t) => {
            const f = fixture(t);
            fs.rmSync(path.dirname(f.source), { recursive: true });
            const result = f.run([help]);
            assert.equal(result.status, 0, result.stderr);
            assert.match(result.stdout, /Frontend Assessment Skill Installer/);
            assert.match(result.stdout, /unified frontend-assessment skill/);
            assert.match(result.stdout, /--global/);
            assert.match(result.stdout, /--project/);
            assert.match(result.stdout, /--update/);
            assert.match(
                result.stdout,
                /Replace only frontend-assessment\/SKILL\.md/,
            );
            assert.match(
                result.stdout,
                /Requires an existing frontend-assessment\/SKILL\.md/,
            );
            assert.match(
                result.stdout,
                /Older standalone companions remain untouched and are no longer needed/,
            );
            assert.doesNotMatch(
                result.stdout,
                /all three|add missing companions/,
            );
            assert.deepEqual(tree(f.project), []);
            assert.deepEqual(tree(f.home), []);
        },
    );
}
