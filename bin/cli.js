#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_NAME = "frontend-assessment";
const SOURCE_PATH = path.resolve(__dirname, "../skills/SKILL.md");
const LEGACY_COMPANIONS = ["frontend-lighthouse", "frontend-performance"];

const args = process.argv.slice(2);

function printHelp() {
    console.log(`
Frontend Assessment Skill Installer

Installs the unified frontend-assessment skill, including Lighthouse and performance guidance.

Usage:
  npx frontend-assessment-skill [options]

Options:
  -g, --global     Install the skill globally to ~/.agents/skills
  -p, --project    Install the skill locally to .agents/skills
  -u, --update     Replace only frontend-assessment/SKILL.md without prompting
                    Requires an existing frontend-assessment/SKILL.md
  -h, --help       Show this help message

Older standalone companions remain untouched and are no longer needed.
`);
}

async function run() {
    if (args.includes("-h") || args.includes("--help")) {
        printHelp();
        process.exit(0);
    }

    let content;
    try {
        content = fs.readFileSync(SOURCE_PATH);
    } catch (err) {
        console.error(
            `\n❌ Error: Unable to read source skill file at ${SOURCE_PATH}: ${err.message}\n`,
        );
        process.exit(1);
    }

    console.log("\n=========================================");
    console.log(" 📊 Frontend Assessment Skill Installer");
    console.log("=========================================\n");
    console.log(`Skill: ${SKILL_NAME}\n`);

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
            console.log("Where would you like to install frontend-assessment?");
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
        const targetFile = path.join(targetRoot, SKILL_NAME, "SKILL.md");
        const companions = LEGACY_COMPANIONS.filter((name) =>
            fs.existsSync(path.join(targetRoot, name)),
        );
        if (companions.length > 0) {
            console.log(
                `\nℹ️  Migration note: Older standalone companions remain untouched and are no longer needed: ${companions.join(", ")}.`,
            );
            console.log(
                "   frontend-assessment now includes Lighthouse and performance guidance.\n",
            );
        }
        const skillExists = fs.existsSync(targetFile);

        if (updateMode && !skillExists) {
            console.error(
                `\n❌ No installed skill found to update at ${targetFile}`,
            );
            console.error("   Run without --update to install it first.\n");
            process.exit(1);
        }

        if (skillExists && !updateMode) {
            const overwrite = (
                await rl.question(
                    `\n⚠️  Skill file already exists at:\n   ${targetFile}\n   Overwrite existing file? (y/N): `,
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

        fs.mkdirSync(path.dirname(targetFile), { recursive: true });
        fs.writeFileSync(targetFile, content);

        const action = updateMode ? "updated" : "installed";
        console.log(`\n✅ Successfully ${action} ${SKILL_NAME}!`);
        console.log(`   ${targetFile}`);
        console.log();
        console.log(
            "Run the complete assessment with one prompt in your AI agent (e.g. Zed, Claude):",
        );
        console.log(
            '   "Run a complete frontend assessment with FRONTEND_ASSESSMENT_URL=https://example.com, including Lighthouse audits, journey tracing, and one consolidated verdict"\n',
        );
    } catch (err) {
        console.error("\n❌ Installation failed:", err.message, "\n");
        process.exit(1);
    } finally {
        rl.close();
    }
}

run();
