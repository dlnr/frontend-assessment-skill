# Contributing to Frontend Assessment Skill

Thank you for your interest in contributing to the **Frontend Assessment Skill**! This document provides instructions for setting up your local environment, making changes, testing, and the release process.

---

## Project Structure

This project is a lightweight, zero-dependency package containing one self-contained AI agent skill and a Node.js CLI installer:

```
frontend-assessment-skill/
├── .github/
│   └── workflows/
│       └── publish.yml      # Automated npm publishing workflow
├── bin/
│   └── cli.js               # CLI installer script (Node.js ESM)
├── skills/
│   └── SKILL.md             # Full assessment, Lighthouse, tracing, and rubric
├── test/
│   └── cli.test.js          # Isolated installer regression tests
├── LICENSE
├── package.json
└── README.md
```

- **`skills/SKILL.md`**: Contains all repository assessment, test/coverage evidence inspection, Lighthouse audit, journey tracing, scoring, and consolidated report/verdict instructions. There are no companion-skill dependencies.
- **`bin/cli.js`**: Installs only `frontend-assessment/SKILL.md` under global (`~/.agents/skills/`) or project-level (`.agents/skills/`) storage. `--update` requires the existing skill and replaces only its `SKILL.md`. Old companion directories from a three-skill installation are detected and reported but never modified or deleted.

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

    _(No `npm install` is necessary as this project has zero runtime/build dependencies)._

---

## Local Development & Testing

### 1. Testing the CLI Installer

For development of this package, run the dependency-free automated installer tests (temporary projects and homes only). These maintainer checks are not part of the frontend assessment skill; the assessment never runs the assessed project's tests or generates coverage:

```bash
npm test
```

You can also test the CLI installer locally without publishing to npm:

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
3. Invoke the single skill with sample prompts:
    - _"Perform a frontend health assessment of this repository"_
    - _"Run a frontend assessment for Q3 2025 focusing on the web-app package"_
    - _"Run a complete frontend assessment with FRONTEND_ASSESSMENT_URL=https://example.com and include Lighthouse audits and journey tracing"_
    - _"Run a complete frontend assessment using existing test/coverage evidence only, without running project tests or generating coverage, and use all available evidence in the final verdict"_
4. Check that:
    - The criteria scores and total 1-100 score calculate properly.
    - The markdown tables and breakdown formats match the desired structure.
    - The agent accurately adheres to edge-case instructions (e.g., handling monorepos, missing coverage, deprecated UI libraries).
    - UI-system findings trace imported components to production renders/templates, including aliases, re-exports, wrappers, and framework registration/auto-imports; unused imports and story/test-only usage do not count as production adoption.
    - A maintained in-house component system with consumed semantic CSS-variable tokens can earn the same UI-system score as a third-party equivalent without a recognized styling brand or dedicated token package.
    - Intentionally composed component/styling layers are distinguished from competing implementations, and sampled findings state their scope rather than claiming application-wide adoption.
    - An MCP audit excluding Performance still reports supported categories and marks unsupported categories `N/A` with exact reasons.
    - Journey traces stay active through replayed interactions, stop explicitly, and remain independent of Lighthouse availability; lab interaction timings are never substituted for field INP or a category score.
    - Authentication blocks, tool failures, and skipped consequential actions are reported as distinct limitations; the assessed project stays read-only with no generated test/coverage artifact exception.
    - The skill is self-contained and does not invoke or require companion skills. Its report contains one verdict synthesizing all available evidence, while keeping numerical weights unchanged.
    - Assessments only inspect test configuration/source and existing recorded test/coverage evidence. They never run project tests or coverage commands, directly or indirectly, and never offer execution as an opt-in. No particular framework or implementation approach is required; non-execution is not a failure or an extra scoring penalty.

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
3. Publish a GitHub Release for that tag (or run the workflow manually via `workflow_dispatch`).
4. The GitHub Actions workflow will publish the package to npm using GitHub OIDC.

> Important: the job uses the GitHub Actions environment `npm stage publish`. This must exactly match the environment configured for the package in npm Trusted Publishing.

### Manual Publishing (Fallback)

If manual publishing is required from a local machine:

```bash
# Ensure you are logged in with publishing permissions
npm login

# Publish with public access
npm publish --access public
```

CI publishing should not use an npm token; it should rely on GitHub OIDC / npm Trusted Publishing.
