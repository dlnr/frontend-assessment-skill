#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRIMARY_SKILL_NAME = "frontend-assessment";
const SKILL_SOURCES = [
    { name: PRIMARY_SKILL_NAME, source: "../skills/SKILL.md" },
    {
        name: "frontend-lighthouse",
        source: "../skills/frontend-lighthouse/SKILL.md",
    },
    {
        name: "frontend-performance",
        source: "../skills/frontend-performance/SKILL.md",
    },
];

const args = process.argv.slice(2);

function printHelp() {
    console.log(`
Frontend Assessment Skills Installer

Installs three skills together:
  frontend-assessment, frontend-lighthouse, frontend-performance

Usage:
  npx frontend-assessment-skill [options]

Options:
  -g, --global     Install all three skills globally to ~/.agents/skills
  -p, --project    Install all three skills locally to .agents/skills
  -u, --update     Replace bundled skill files without prompting; add missing companions
                    Requires an existing frontend-assessment/SKILL.md
  -h, --help       Show this help message
`);
}

async function run() {
    if (args.includes("-h") || args.includes("--help")) {
        printHelp();
        process.exit(0);
    }

    const skills = [];
    for (const { name, source } of SKILL_SOURCES) {
        const sourcePath = path.resolve(__dirname, source);
        try {
            skills.push({ name, content: fs.readFileSync(sourcePath) });
        } catch (err) {
            console.error(
                `\n❌ Error: Unable to read source skill file at ${sourcePath}: ${err.message}\n`,
            );
            process.exit(1);
        }
    }

    console.log("\n=========================================");
    console.log(" 📊 Frontend Assessment Skills Installer");
    console.log("=========================================\n");
    console.log(`Skills: ${skills.map(({ name }) => name).join(", ")}\n`);

    const updateMode = args.includes("-u") || args.includes("--update");
    let targetScope = null;

    if (args.includes("-g") || args.includes("--global")) {
        targetScope = "global";
    } else if (args.includes("-p") || args.includes("--project")) {
        targetScope = "project";
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    try {
        if (!targetScope) {
            console.log("Where would you like to install all three skills?");
            console.log("  1) Globally (~/.agents/skills)");
            console.log("  2) In current project folder (.agents/skills)");
            console.log("  3) Cancel\n");

            const answer =
                (
                    await rl.question("Select an option (1-3) [default: 1]: ")
                ).trim() || "1";

            if (answer === "1") {
                targetScope = "global";
            } else if (answer === "2") {
                targetScope = "project";
            } else {
                console.log("\nInstallation cancelled.\n");
                process.exit(0);
            }
        }

        const targetRoot = path.join(
            targetScope === "global" ? os.homedir() : process.cwd(),
            ".agents",
            "skills",
        );
        const targets = skills.map((skill) => ({
            ...skill,
            targetFile: path.join(targetRoot, skill.name, "SKILL.md"),
        }));
        const targetFile = targets[0].targetFile;
        const skillExists = fs.existsSync(targetFile);

        if (updateMode && !skillExists) {
            console.error(
                `\n❌ No installed skill found to update at ${targetFile}`,
            );
            console.error("   Run without --update to install it first.\n");
            process.exit(1);
        }

        const collisions = targets.filter(({ targetFile }) =>
            fs.existsSync(targetFile),
        );
        if (collisions.length > 0 && !updateMode) {
            const overwrite = (
                await rl.question(
                    `\n⚠️  Bundled skill files already exist at:\n   ${collisions.map(({ targetFile }) => targetFile).join("\n   ")}\n   Overwrite existing files and install all three skills? (y/N): `,
                )
            )
                .trim()
                .toLowerCase();

            if (overwrite !== "y" && overwrite !== "yes") {
                console.log(
                    "\nInstallation cancelled. All files left untouched.\n",
                );
                process.exit(0);
            }
        }

        for (const { targetFile, content } of targets) {
            fs.mkdirSync(path.dirname(targetFile), { recursive: true });
            fs.writeFileSync(targetFile, content);
        }

        const action = updateMode ? "updated" : "installed";
        console.log(`\n✅ Successfully ${action} all three skills!`);
        for (const { name, targetFile } of targets) {
            console.log(`   ${name}: ${targetFile}`);
        }
        console.log();
        console.log(
            "You can now run frontend assessments, Lighthouse audits, and performance investigations in your AI agent (e.g. Zed, Claude) by prompting:",
        );
        console.log('   "Give me a frontend assessment of this repository"');
        console.log('   "Run a Lighthouse audit of this site"');
        console.log('   "Investigate frontend performance on this site"\n');
    } catch (err) {
        console.error("\n❌ Installation failed:", err.message, "\n");
        process.exit(1);
    } finally {
        rl.close();
    }
}

run();
