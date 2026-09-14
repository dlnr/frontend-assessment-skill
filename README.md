# Frontend Assessment Skill

An installable AI Agent Skill for Zed, Claude, and other agent systems that produces a reproducible **1-100 frontend health and maturity assessment score** for any repository.

## Installation

Run via `npx`:

```bash
npx frontend-assessment-skill
```

The installer will prompt you to choose where to install the skill:
1. **Globally** (`~/.agents/skills/frontend-assessment`) — Available across all your projects in Zed / AI agents.
2. **Project folder** (`.agents/skills/frontend-assessment`) — Installed only in the current repository.

### Command-line flags (non-interactive)

```bash
# Install globally
npx frontend-assessment-skill --global

# Install in current project directory
npx frontend-assessment-skill --project
```

---

## How to Use

Once installed, simply ask your agent in Zed (or your agent tool of choice):

> *"Perform a frontend health assessment of this repository"*

Or specify quarters/scopes:

> *"Run a frontend assessment for Q3 2025 focusing on the web-app package"*

---

## What It Evaluates

The skill calculates a strict, reproducible score (0–100) across 7 criteria:

| Criterion | Weight | Summary |
| --- | :---: | --- |
| **Dependency freshness** | 20 | Share of dependencies on latest/minor version and updated within 183 days |
| **Core package currency** | 20 | Currency of core runtime, framework, router, build, and test tools |
| **Contributor diversity** | 10 | Unique contributors in the last 12 months (diversity signal) |
| **Quarterly delivery cadence** | 10 | Commits, merges, and releases during the assessed quarter |
| **Test suite maturity** | 10 | Presence of unit, integration, component, and e2e test layers |
| **Coverage** | 10 | Frontend code test coverage percentage |
| **UI system & component library** | 20 | Adoption of a single consistent component library, formal design tokens, and non-deprecated UI dependencies |

---

## Development & Publishing

### 1. Local Testing

To test the CLI installer locally before publishing:

```bash
# Test help output
node bin/cli.js --help

# Test interactive installation
node bin/cli.js

# Test npx invocation locally in the package root
npx .
```

### 2. Versioning & Git Setup

Initialize your git repository and prepare a release:

```bash
git init
git add .
git commit -m "Initial release of frontend-assessment-skill"
```

### 3. Publishing to npm (via GitHub Actions)

This repository includes a GitHub Actions workflow (`.github/workflows/publish.yml`) that automatically publishes to npm when a GitHub Release is published, with support for npm provenance.

1. Create an **Access Token** on [npmjs.com](https://www.npmjs.com) (Automation token or Granular Access Token with Read and write access to packages).
2. Add it as a secret in your GitHub repository:
   - Navigate to **Settings > Secrets and variables > Actions**
   - Create a new repository secret named `NPM_TOKEN` with your npm token value.
3. To publish a release:
   - Update `version` in `package.json` (e.g. `npm version patch`)
   - Push commits and tags to GitHub
   - Create and publish a new Release in GitHub (e.g. `v1.0.0`)
   - The workflow will automatically publish the package with npm provenance enabled.

Alternatively, you can manually trigger the workflow from the **Actions** tab in GitHub.

---

## License & Attribution

This project is licensed under the [MIT License](./LICENSE) &copy; 2025 DLN Roozemond.

You are free to use, modify, and distribute this skill. When redistributing or including this skill in other packages, attribution to **DLN Roozemond** is required as detailed in the `LICENSE`.
