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

To refresh an existing installation, use `@latest` and `--update` with `--global` or `--project`. Updating replaces the installed `SKILL.md` without a confirmation prompt; it does not install the skill if it is not already present.

### Command-line flags (non-interactive)

```bash
# Install globally
npx frontend-assessment-skill --global

# Install in current project directory
npx frontend-assessment-skill --project

# Update the globally installed skill to the latest package version
npx frontend-assessment-skill@latest --update --global

# Update the skill installed in the current project
npx frontend-assessment-skill@latest --update --project
```

---

## How to Use

Once installed, simply ask your agent in Zed (or your agent tool of choice):

> _"Perform a frontend health assessment of this repository"_

Or specify quarters/scopes:

> _"Run a frontend assessment for Q3 2025 focusing on the web-app package"_

For an optional live-site performance assessment, include `FRONTEND_ASSESSMENT_URL=https://example.com`. After walking through the primary user journey, the skill uses Chrome DevTools MCP for Lighthouse Performance and Core Web Vitals when available, replaying the journey's route changes and actions during the measured session where possible. The Lighthouse category score is worth up to 20 optional points, with LCP, INP, and CLS shown as a non-additive breakdown. Unavailable Lighthouse scores are noted and excluded from scoring. If the site requires authentication, the assessment pauses for you to sign in manually and confirm before testing continues.

---

## What It Evaluates

The skill calculates a strict, reproducible score (0–100) across 7 repository criteria. When a target URL is supplied and the Lighthouse Performance score is available through Chrome DevTools MCP, it adds up to 20 optional points based on that total Lighthouse score. LCP, INP, and CLS are listed as diagnostic score/rating breakdowns, not additional points; unavailable Lighthouse scores are noted and excluded.

| Criterion                         | Weight | Summary                                                                                                     |
| --------------------------------- | :----: | ----------------------------------------------------------------------------------------------------------- |
| **Dependency freshness**          |   20   | Share of dependencies on latest/minor version and updated within 183 days                                   |
| **Core package currency**         |   20   | Currency of core runtime, framework, router, build, and test tools                                          |
| **Contributor diversity**         |   10   | Unique contributors in the last 12 months (diversity signal)                                                |
| **Quarterly delivery cadence**    |   10   | Commits, merges, and releases during the assessed quarter                                                   |
| **Test suite maturity**           |   10   | Presence of unit, integration, component, and e2e test layers                                               |
| **Coverage**                      |   10   | Frontend code test coverage percentage                                                                      |
| **UI system & component library** |   20   | Adoption of a single consistent component library, formal design tokens, and non-deprecated UI dependencies |

---

## Contributing

Contributions are welcome! Please refer to [CONTRIBUTING.md](./CONTRIBUTING.md) for local development setup, testing instructions, and the release workflow.

---

## License & Attribution

This project is licensed under the [MIT License](./LICENSE) &copy; 2025 DLN Roozemond.

You are free to use, modify, and distribute this skill. When redistributing or including this skill in other packages, attribution to **DLN Roozemond** is required as detailed in the `LICENSE`.
