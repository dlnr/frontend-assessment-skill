---

name: frontend-assessment

description: Assess frontend health and maturity. USE WHEN the user asks for a "frontend assessment", "frontend health check", "frontend review", "frontend score", or wants a reproducible 1-100 score for dependency freshness, core package currency, contributor activity, delivery cadence, testing, coverage, and UI system & component library adoption.

---
---

# Frontend Assessment

Produce a reproducible **1-100 frontend assessment score** for the current repository.

## User Instructions

$ARGUMENTS

Respect any explicit scope, quarter, or stack instructions from the user. If the user does not provide a quarter, assess the **most recently completed calendar quarter**.

## Goal

Measure frontend health in a way that is:

- **reproducible**: use the same rubric every time
- **stack-aware**: evaluate the frontend framework/runtime actually in use
- **evidence-based**: do not guess; cite repo evidence and command output
- **portable**: works for monorepos, single-app repos, and different frontend stacks

## Assessment Scope

1. Identify the frontend surface being assessed.
   - In a monorepo, prefer the primary deployable frontend application(s).
   - If the repo contains multiple frontend apps and the user did not narrow scope, assess the main production-facing app(s) plus shared frontend libraries used by them.
   - State the scope explicitly in the report.
2. Detect the package manager from lockfiles and use the workspace-native tooling.
3. Prefer direct evidence from:
   - `package.json` and relevant app/library manifests
   - lockfiles
   - build/test/project configuration
   - git history
   - GitHub releases / PR metadata
   - UI system and design token package manifests & deprecation metadata

## Stack Detection

Detect the frontend stack first. Typical examples:

| Category | Candidate packages |
| --- | --- |
| UI runtime | `react`, `vue`, `angular`, `svelte` |
| App framework | `next`, `remix`, `@remix-run/*`, `gatsby`, `nuxt` |
| Router | `react-router`, `react-router-dom`, `@tanstack/router`, framework router |
| Build tool | `vite`, `webpack`, `rspack`, `parcel` |
| Test tools | `jest`, `vitest`, `cypress`, `playwright` |
| UI component library | `@mui/*`, `@chakra-ui/*`, `antd`, `@mantine/*`, `@radix-ui/*`, `shadcn` (`components.json`), `@carbon/*`, `@fluentui/*`, `react-bootstrap`, `@shoelace-style/*`, in-house/custom design system |
| Design tokens / Styling | `style-dictionary`, `@tokens-studio/*`, design token packages, `tailwindcss`, `@vanilla-extract/*`, `styled-components`, `@emotion/*`, CSS variables/theme tokens |

When a stack-specific package from the user's examples is not present, substitute the equivalent core package(s) for that stack.

## Data Collection

### 1. Dependency freshness

Assess direct dependencies that materially affect the frontend:

- production dependencies used by the frontend app(s)
- shared frontend libraries they consume
- dev dependencies only when they are frontend-critical (for example `vite`, `webpack`, `storybook`, `jest`, `vitest`, `playwright`, `cypress`)

Use existing package manager commands and registry metadata. Prefer:

- `npm outdated --json`
- `npm view <package> version time --json`
- lockfile/package manifest inspection

For each assessed package, determine:

- installed/resolved version
- latest published version
- publish date of installed/resolved version
- whether the package is behind latest major/minor/patch

### 2. Core package currency

Build a short list of core frontend packages for the detected stack. This should usually include:

- one runtime/framework package
- one router package if applicable
- one build tool package
- one test runner if the stack depends on it for core developer workflow

If a core package is not on the latest version, determine whether it is:

- intentionally blocked by a peer dependency or framework compatibility constraint
- simply behind with no clear blocker

Useful evidence sources:

- `npm view <package> peerDependencies --json`
- `npm ls <package>`
- framework/plugin package peer ranges

### 3. Contributor activity

Count unique contributors in the last 12 months from git history. Prefer:

```bash
git log --since="12 months ago" --format='%aN <%aE>' --all | sort -u
```

Use the unique author list count as the metric. This is a diversity signal, not a popularity contest.

### 4. Quarterly delivery cadence

For the assessed quarter, count:

- commits
- merges
- releases

Prefer:

```bash
git rev-list --count --since="<quarter-start>" --until="<quarter-end>" --all
git rev-list --count --merges --since="<quarter-start>" --until="<quarter-end>" --all
gh api repos/<owner>/<repo>/releases --paginate
```

Use GitHub Releases where available. If there are no GitHub releases, record `0` and note if the repo appears to release by tags or another mechanism.

### 5. Test suites

Determine whether the application uses automated tests and which layers exist:

- unit
- integration
- component
- e2e
- visual/storybook checks

Use repo configuration and scripts first. Only run existing test commands when needed to discover coverage or confirm a configured test surface.

### 6. Coverage

Prefer existing coverage artifacts or CI/test configuration over inventing new instrumentation:

- `coverage/` directories
- CI settings
- `jest` / `vitest` / `nyc` / `cypress` coverage configuration
- existing `--coverage` scripts

If multiple coverage figures exist, report the most relevant frontend application coverage and note any additional figures.

### 7. UI system and component library

Inspect the project dependencies and source code to identify and assess:

- **Detected component libraries**: Name all UI component libraries in use (e.g. `@mui/*`, `antd`, `@chakra-ui/*`, `@mantine/*`, `@radix-ui/*`, `shadcn`, `@carbon/*`, `@fluentui/*`, `react-bootstrap`, in-house component library, etc.).
- **Detected design tokens / theme libraries**: Identify design token packages and formal theme tokens (e.g. `style-dictionary`, `@tokens-studio/*`, dedicated token packages, CSS variables/theme definitions).
- **Consistency**: Verify whether a **single component library** is used consistently across the application, or if multiple competing UI libraries are mixed.
- **Deprecation check**: Check if any detected UI library or token package is deprecated using `npm view <package> deprecated --json` or known deprecation status.
- **Adoption & version currency**: Evaluate if the component library and design system are actively used across the app and on supported versions.

## Scoring Rubric

Score each criterion independently and sum to **100**.

| Criterion                           | Weight | How to score                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------- | -----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency freshness                |     20 | `score = round(20 * fresh_ratio)` where `fresh_ratio` is the share of assessed packages that are both on latest version **or** at most one minor behind **and** whose installed version is not older than 183 days. If a package has had no release in the last 183 days at all, treat it as neutral rather than stale if the installed version is latest. |
| Core package currency               |     20 | `20` all core packages latest or latest compatible and blockers are documented; `15` only minor lag or documented peer/framework blockers; `8` one core package is one major behind without blocker; `0` multiple core packages are one major behind or any core package is more than one major behind without blocker.                                    |
| Contributors, last 12 months        |     10 | `10` >= 4 contributors; `8` 3 contributors; `6` 2 contributors; `3` 1 contributor; `0` 0 contributors. Cap at 10 so very large teams do not dominate the score.                                                                                                                                                                                            |
| Quarterly commits, merges, releases |     10 | Score three sub-parts and add them: commits `0-4` (`>=50` = 4, `20-49` = 3, `5-19` = 2, `1-4` = 1, `0` = 0), merges `0-3` (`>=15` = 3, `5-14` = 2, `1-4` = 1, `0` = 0), releases `0-3` (`>=2` = 3, `1` = 2, `0` = 0).                                                                                                                                      |
| Test suite maturity                 |     10 | `10` unit plus integration/e2e/component coverage across meaningful app flows; `7` at least two test layers; `4` one automated test layer only; `0` no automated tests found.                                                                                                                                                                              |
| Coverage                            |     10 | `10` >= 80%; `8` 70-79%; `6` 60-69%; `3` 40-59%; `1` 1-39%; `0` no measurable coverage found. Use the most relevant frontend coverage number, not backend-only coverage.                                                                                                                                                                                   |
| UI system & component library       |     20 | `20` single modern component library used consistently across the app + formal design system & token library adoption, non-deprecated; `15` single component library used consistently with design tokens/theme system (minor version lag or isolated deviations); `10` single component library without formal tokens OR custom design system without token library; `5` mixed/competing component libraries (fragmented UI) OR deprecated library with migration underway; `0` deprecated/unmaintained UI library as primary UI, severe library fragmentation, or no component library/tokens. |

## Important Scoring Rules

1. **Do not make up evidence.**
2. **Do not average away major problems.** If a core package is badly outdated, reflect that sharply.
3. **Do not over-penalize stable packages** that are latest even if the ecosystem has been quiet for more than 6 months.
4. **Penalize deprecated and fragmented UI libraries.** Using deprecated UI packages or mixing multiple competing component libraries directly reduces the UI system score.
5. **Reward consistent single component library and design token usage.** Full points require a single unified component library paired with a design system and token library.
6. **Keep the rubric fixed.** If you must diverge, explain exactly why.
7. **Factor in when calculating the score** the age of the repository, complexity and number of developers active in the repo. 

## Required Output

Return the assessment in this structure:

### Scope

- repository / app(s) assessed
- quarter assessed
- detected stack
- detected UI system & component library: `<names of detected libraries or "None">`
- detected design tokens / theme library: `<names of detected token packages or "None">`

### Score summary

`Frontend assessment score: <total>/100`

### Scoring table

| Criterion | Weight | Evidence | Score | Notes |
| --- | ---: | --- | ---: | --- |
| Dependency freshness | 20 | ... | ... | ... |
| Core package currency | 20 | ... | ... | ... |
| Contributors, last 12 months | 10 | ... | ... | ... |
| Quarterly commits, merges, releases | 10 | ... | ... | ... |
| Test suite maturity | 10 | ... | ... | ... |
| Coverage | 10 | ... | ... | ... |
| UI system & component library | 20 | ... (Names of used component libraries & token libraries, consistency status, and deprecation status) | ... | ... |
| **Total** | **100** |  | **<total>** |  |

### UI system & component library status

Include a breakdown of detected UI and design token packages:

| Library / Package | Role (Component library / Tokens / Styling) | Installed version | Latest version | Deprecated? | Consistency & Notes |
| --- | --- | --- | --- | --- | --- |

### Core package status

Include a compact table for the detected core packages:

| Package | Current | Latest | Status | Blocked by dependency? |
| --- | --- | --- | --- | --- |

### Top 10 pros and cons

Use exactly 10 ranked rows:

| Rank | Pro | Con |
| ---: | --- | --- |
| 1 | ... | ... |
| 2 | ... | ... |
| 3 | ... | ... |
| 4 | ... | ... |
| 5 | ... | ... |
| 6 | ... | ... |
| 7 | ... | ... |
| 8 | ... | ... |
| 9 | ... | ... |
| 10 | ... | ... |

### Verdict

End with:

- one short paragraph explaining what drove the score
- one short paragraph naming the highest-leverage improvements

## Behavior Notes

- Prefer repository-native commands and existing CI/test scripts.
- Do not install new tooling just to produce the assessment.
- For Nx workspaces, use `npm nx` / `npx nx` and existing targets rather than bypassing Nx.
- Keep the result concise, but include enough evidence that another reviewer can reproduce the score.
