#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_NAME = 'frontend-assessment';
const SOURCE_SKILL_PATH = path.resolve(__dirname, '../skills/SKILL.md');

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
Frontend Assessment Skill Installer

Usage:
  npx frontend-assessment-skill [options]

Options:
  -g, --global     Install globally to ~/.agents/skills/frontend-assessment
  -p, --project    Install locally to .agents/skills/frontend-assessment
  -h, --help       Show this help message
`);
}

async function run() {
  if (args.includes('-h') || args.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  if (!fs.existsSync(SOURCE_SKILL_PATH)) {
    console.error(`\n❌ Error: Source skill file not found at ${SOURCE_SKILL_PATH}\n`);
    process.exit(1);
  }

  console.log('\n=========================================');
  console.log(' 📊 Frontend Assessment Skill Installer');
  console.log('=========================================\n');

  let targetScope = null;

  if (args.includes('-g') || args.includes('--global')) {
    targetScope = 'global';
  } else if (args.includes('-p') || args.includes('--project')) {
    targetScope = 'project';
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    if (!targetScope) {
      console.log('Where would you like to install the skill?');
      console.log('  1) Globally (~/.agents/skills/frontend-assessment)');
      console.log('  2) In current project folder (.agents/skills/frontend-assessment)');
      console.log('  3) Cancel\n');

      const answer = (await rl.question('Select an option (1-3) [default: 1]: ')).trim() || '1';

      if (answer === '1') {
        targetScope = 'global';
      } else if (answer === '2') {
        targetScope = 'project';
      } else {
        console.log('\nInstallation cancelled.\n');
        process.exit(0);
      }
    }

    const targetDir =
      targetScope === 'global'
        ? path.join(os.homedir(), '.agents', 'skills', SKILL_NAME)
        : path.join(process.cwd(), '.agents', 'skills', SKILL_NAME);

    const targetFile = path.join(targetDir, 'SKILL.md');

    if (fs.existsSync(targetFile)) {
      const overwrite = (
        await rl.question(`\n⚠️  Skill already exists at:\n   ${targetFile}\n   Overwrite? (y/N): `)
      ).trim().toLowerCase();

      if (overwrite !== 'y' && overwrite !== 'yes') {
        console.log('\nInstallation cancelled. Existing file left untouched.\n');
        process.exit(0);
      }
    }

    fs.mkdirSync(targetDir, { recursive: true });
    fs.copyFileSync(SOURCE_SKILL_PATH, targetFile);

    console.log(`\n✅ Successfully installed "${SKILL_NAME}" skill!`);
    console.log(`   Location: ${targetFile}\n`);
    console.log('You can now run frontend assessments in your AI agent (e.g. Zed, Claude) by prompting:');
    console.log('   "Give me a frontend assessment of this repository"\n');
  } catch (err) {
    console.error('\n❌ Installation failed:', err.message, '\n');
    process.exit(1);
  } finally {
    rl.close();
  }
}

run();
