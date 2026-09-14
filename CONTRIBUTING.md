# Contributing to Frontend Assessment Skill

Thank you for your interest in contributing to the **Frontend Assessment Skill**! This document provides instructions for setting up your local environment, making changes, testing, and the release process.

---

## Project Structure

This project is a lightweight, zero-dependency package containing an AI agent skill and a Node.js CLI installer:

```
frontend-assessment-skill/
├── .github/
│   └── workflows/
│       └── publish.yml      # Automated npm publishing workflow
├── bin/
│   └── cli.js               # CLI installer script (Node.js ESM)
├── skills/
│   └── SKILL.md             # The core AI Agent Skill specification & rubric
├── LICENSE
├── package.json
└── README.md
```

- **`skills/SKILL.md`**: Contains the full prompt instructions, scoring formula, weights, and rubric used by AI agents (e.g. Zed, Claude) to perform frontend assessments.
- **`bin/cli.js`**: The interactive and scripted installer invoked when users run `npx frontend-assessment-skill`. It copies `skills/SKILL.md` into either global (`~/.agents/skills/frontend-assessment/`) or project-level (`.agents/skills/frontend-assessment/`) skill directories.

---

## Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **Git**: For version control
- **Zed Editor** (or another AI agent platform supporting Agent Skills) for testing skill outputs

### Setup

1. Fork and clone the repository:

   ```bash
   git clone https://github.com/dlnr/frontend-assessment-skill.git
   cd frontend-assessment-skill
   ```

2. Verify your Node.js version:

   ```bash
   node --version
   ```

   *(No `npm install` is necessary as this project has zero runtime/build dependencies).*

---

## Local Development & Testing

### 1. Testing the CLI Installer

You can test the CLI installer locally without publishing to npm:

```bash
# Test the help output
node bin/cli.js --help

# Test interactive installation
node bin/cli.js

# Test non-interactive flags
node bin/cli.js --project
node bin/cli.js --global

# Test local npx execution from the repository root
npx .
npx . --help
```

### 2. Testing Skill Changes in AI Agents

When editing `skills/SKILL.md`:

1. Install your local version to test it:
   ```bash
   node bin/cli.js --project
   # or
   node bin/cli.js --global
   ```
2. Open a frontend repository in Zed.
3. Invoke the skill with sample prompts:
   - *"Perform a frontend health assessment of this repository"*
   - *"Run a frontend assessment for Q3 2025 focusing on the web-app package"*
4. Check that:
   - The criteria scores and total 1-100 score calculate properly.
   - The markdown tables and breakdown formats match the desired structure.
   - The agent accurately adheres to edge-case instructions (e.g., handling monorepos, missing coverage, deprecated UI libraries).

---

## Contribution Workflow

1. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes**:
   - Keep CLI changes minimal, fast, and dependency-free.
   - Ensure skill rubric instructions remain deterministic, objective, and reproducible.
3. **Commit your changes**:
   - Write clear, descriptive commit messages.
4. **Push and open a Pull Request**:
   - Push your branch to GitHub and open a Pull Request against `main`.
   - Describe the motivation and provide examples of before/after agent output if modifying `SKILL.md`.

---

## Publishing & Releases

Publishing to npm is automated via GitHub Actions (`.github/workflows/publish.yml`).

### Release Process (Maintainers)

1. Bump the version in `package.json` according to [Semantic Versioning](https://semver.org/):
   ```bash
   npm version patch # or minor / major
   ```
2. Push the version commit and tag to `main`:
   ```bash
   git push origin main --tags
   ```
3. The GitHub Actions workflow will detect the new version, create npm provenance, and publish the package to the npm registry.

### Manual Publishing (Fallback)

If manual publishing is required:

```bash
# Ensure you are logged in with publishing permissions
npm login

# Publish with public access and provenance
npm publish --provenance --access public
```
