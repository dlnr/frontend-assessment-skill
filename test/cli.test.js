import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(new URL("../bin/cli.js", import.meta.url));
const skills = [
    { name: "frontend-assessment", source: "SKILL.md" },
    { name: "frontend-lighthouse", source: "frontend-lighthouse/SKILL.md" },
    { name: "frontend-performance", source: "frontend-performance/SKILL.md" },
];

function write(file, content) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
}

function fixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "frontend-skills-cli-"));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const installer = path.join(root, "installer");
    const project = path.join(root, "project");
    const home = path.join(root, "home");
    const cli = path.join(installer, "bin", "cli.js");
    write(path.join(installer, "package.json"), '{"type":"module"}\n');
    fs.mkdirSync(path.dirname(cli), { recursive: true });
    fs.copyFileSync(cliPath, cli);
    fs.mkdirSync(project);
    fs.mkdirSync(home);
    for (const { name, source } of skills) {
        write(
            path.join(installer, "skills", source),
            `---\nname: ${name}\n---\nBundled ${name} 📊\n`,
        );
    }

    return {
        project,
        home,
        source: (skill) => path.join(installer, "skills", skill.source),
        target: (skill, base = project) =>
            path.join(base, ".agents", "skills", skill.name, "SKILL.md"),
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

function tree(directory) {
    return fs
        .readdirSync(directory, { withFileTypes: true })
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((entry) => [
            entry.name,
            entry.isDirectory()
                ? tree(path.join(directory, entry.name))
                : fs
                      .readFileSync(path.join(directory, entry.name))
                      .toString("hex"),
        ]);
}

function assertInstalled(f, base = f.project) {
    for (const skill of skills) {
        assert.deepEqual(
            fs.readFileSync(f.target(skill, base)),
            fs.readFileSync(f.source(skill)),
        );
    }
}

test(
    "project install copies all three skill sources to their mapped destinations",
    { timeout: 10000 },
    (t) => {
        const f = fixture(t);
        const result = f.run(["--project"]);
        assert.equal(result.status, 0, result.stderr);
        assertInstalled(f);
        assert.deepEqual(tree(f.home), []);
        for (const { name } of skills) assert.ok(result.stdout.includes(name));
    },
);

test(
    "real bundled skills have valid metadata and install byte-for-byte",
    { timeout: 10000 },
    (t) => {
        const f = fixture(t);
        for (const skill of skills) {
            const source = fileURLToPath(
                new URL(`../skills/${skill.source}`, import.meta.url),
            );
            const content = fs.readFileSync(source, "utf8");
            const metadata = content.match(
                /^---\r?\nname: ([a-z0-9]+(?:-[a-z0-9]+)*)\r?\ndescription: ([^\r\n]+)\r?\n---/,
            );
            assert.ok(metadata, `Missing skill metadata: ${skill.source}`);
            assert.equal(metadata[1], skill.name);
            assert.ok(metadata[1].length <= 64);
            assert.ok(metadata[2].length <= 1024);
            fs.copyFileSync(source, f.source(skill));
        }
        const result = f.run(["--project"]);
        assert.equal(result.status, 0, result.stderr);
        assertInstalled(f);
    },
);

test(
    "global install uses an isolated home and leaves the project untouched",
    { timeout: 10000 },
    (t) => {
        const f = fixture(t);
        const result = f.run(["-g"]);
        assert.equal(result.status, 0, result.stderr);
        assertInstalled(f, f.home);
        assert.deepEqual(tree(f.project), []);
    },
);

for (const [label, input, scope] of [
    ["project selection", "2\n", "project"],
    ["default global selection", "\n", "home"],
]) {
    test(`interactive install supports ${label}`, { timeout: 10000 }, (t) => {
        const f = fixture(t);
        const result = f.run([], input);
        assert.equal(result.status, 0, result.stderr);
        assert.match(
            result.stdout,
            /Where would you like to install all three skills/,
        );
        for (const { name } of skills) assert.ok(result.stdout.includes(name));
        assertInstalled(f, f[scope]);
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

test(
    "legacy --update replaces the primary and adds both missing companions",
    { timeout: 10000 },
    (t) => {
        const f = fixture(t);
        write(f.target(skills[0]), "legacy primary\n");
        const result = f.run(["--project", "--update"]);
        assert.equal(result.status, 0, result.stderr);
        assertInstalled(f);
        assert.doesNotMatch(result.stdout, /Overwrite/);
    },
);

test(
    "update replaces all bundled skill files but preserves unrelated files",
    { timeout: 10000 },
    (t) => {
        const f = fixture(t);
        const unrelated = [];
        for (const skill of skills) {
            write(f.target(skill), `old ${skill.name}\n`);
            const extra = path.join(
                path.dirname(f.target(skill)),
                "references",
                "custom.md",
            );
            write(extra, `Keep ${skill.name}\n`);
            unrelated.push([extra, fs.readFileSync(extra)]);
        }
        const otherSkill = path.join(
            f.project,
            ".agents",
            "skills",
            "other",
            "SKILL.md",
        );
        write(otherSkill, "Keep another skill\n");
        unrelated.push([otherSkill, fs.readFileSync(otherSkill)]);

        const result = f.run(["-p", "-u"]);
        assert.equal(result.status, 0, result.stderr);
        assertInstalled(f);
        assert.doesNotMatch(result.stdout, /Overwrite/);
        for (const [file, content] of unrelated)
            assert.deepEqual(fs.readFileSync(file), content);
    },
);

for (const companionsExist of [false, true]) {
    test(
        `update without primary rejects without writes (companions: ${companionsExist})`,
        { timeout: 10000 },
        (t) => {
            const f = fixture(t);
            write(path.join(f.project, "keep.txt"), "preserve me\n");
            if (companionsExist) {
                for (const skill of skills.slice(1))
                    write(f.target(skill), "existing companion\n");
            }
            const before = tree(f.project);
            const result = f.run(["--project", "--update"]);
            assert.equal(result.status, 1, result.stdout);
            assert.match(result.stderr, /No installed skill found to update/);
            assert.deepEqual(tree(f.project), before);
            assert.deepEqual(tree(f.home), []);
        },
    );
}

for (const skill of skills) {
    for (const answer of ["n\n", "\n"]) {
        test(
            `declining a ${skill.name} collision with ${JSON.stringify(answer)} preserves everything`,
            { timeout: 10000 },
            (t) => {
                const f = fixture(t);
                write(f.target(skill), "existing skill: must not change\n");
                write(
                    path.join(path.dirname(f.target(skill)), "custom.md"),
                    "keep this too\n",
                );
                const before = tree(f.project);
                const result = f.run(["--project"], answer);
                assert.equal(result.status, 0, result.stderr);
                assert.equal(
                    (result.stdout.match(/Overwrite existing files/g) || [])
                        .length,
                    1,
                );
                assert.ok(result.stdout.includes(f.target(skill)));
                assert.match(result.stdout, /cancelled/);
                assert.deepEqual(tree(f.project), before);
                assert.deepEqual(tree(f.home), []);
            },
        );
    }
}

test(
    "normal install asks once for all collisions and accepts confirmation",
    { timeout: 10000 },
    (t) => {
        const f = fixture(t);
        for (const skill of skills)
            write(f.target(skill), `old ${skill.name}\n`);
        const extra = path.join(path.dirname(f.target(skills[1])), "custom.md");
        write(extra, "keep\n");
        const result = f.run(["--project"], " YeS \n");
        assert.equal(result.status, 0, result.stderr);
        assert.equal(
            (result.stdout.match(/Overwrite existing files/g) || []).length,
            1,
        );
        for (const skill of skills)
            assert.ok(result.stdout.includes(f.target(skill)));
        assertInstalled(f);
        assert.equal(fs.readFileSync(extra, "utf8"), "keep\n");
    },
);

for (const skill of skills) {
    for (const invalidSource of ["missing", "directory"]) {
        test(
            `${invalidSource} ${skill.name} source fails before any destination writes`,
            { timeout: 10000 },
            (t) => {
                const f = fixture(t);
                fs.unlinkSync(f.source(skill));
                if (invalidSource === "directory")
                    fs.mkdirSync(f.source(skill));
                const before = tree(f.project);
                const result = f.run(["--project"]);
                assert.equal(result.status, 1, result.stdout);
                assert.ok(result.stderr.includes(f.source(skill)));
                assert.deepEqual(tree(f.project), before);
                assert.deepEqual(tree(f.home), []);
            },
        );
    }
}

test(
    "invalid companion source during update preserves every installed file",
    { timeout: 10000 },
    (t) => {
        const f = fixture(t);
        for (const skill of skills)
            write(f.target(skill), `old ${skill.name}\n`);
        fs.unlinkSync(f.source(skills[2]));
        const before = tree(f.project);
        const result = f.run(["--project", "--update"]);
        assert.equal(result.status, 1, result.stdout);
        assert.deepEqual(tree(f.project), before);
    },
);

for (const help of ["--help", "-h"]) {
    test(
        `${help} explains all skills and update requirements without sources or writes`,
        { timeout: 10000 },
        (t) => {
            const f = fixture(t);
            for (const skill of skills) fs.unlinkSync(f.source(skill));
            const result = f.run([help]);
            assert.equal(result.status, 0, result.stderr);
            for (const { name } of skills)
                assert.ok(result.stdout.includes(name));
            assert.match(result.stdout, /--global/);
            assert.match(result.stdout, /--project/);
            assert.match(result.stdout, /--update/);
            assert.match(result.stdout, /add missing companions/);
            assert.match(
                result.stdout,
                /Requires an existing frontend-assessment\/SKILL\.md/,
            );
            assert.deepEqual(tree(f.project), []);
            assert.deepEqual(tree(f.home), []);
        },
    );
}
