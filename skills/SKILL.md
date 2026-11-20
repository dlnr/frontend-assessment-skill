---
name: frontend-assessment
description: Assess frontend health and maturity. Use when the user asks for a frontend assessment, health check, review, or reproducible 0-100 score for dependencies, contributor activity, delivery cadence, testing, coverage, UI system adoption, and optional live-site performance.
---

# Frontend Assessment

Produce an evidence-based, stack-aware **0-100 frontend assessment score** for the current repository. Cite repository paths, command results, and browser measurements so another reviewer can reproduce the assessment.

## Inputs and Execution Order

$ARGUMENTS

- Respect the user's app/package scope and stack instructions.
- Use the **last three months** for contributor activity and delivery cadence unless the user specifies a quarter or another period. Resolve exact start and end dates once and use them consistently for both criteria. Dependency status and live measurements describe the current state, not a historical snapshot.
- Accept an optional target URL directly in the request, as `FRONTEND_ASSESSMENT_URL=https://...` in the skill arguments, or from the `FRONTEND_ASSESSMENT_URL` environment variable. An explicit request/argument takes precedence over the environment variable.

Execute in this order:

1. Establish scope and detect the stack.
2. Collect repository evidence.
3. Map the primary user journey and, when browser access is available, walk through it.
4. If a URL was supplied, run Lighthouse and replay the journey during performance measurement.
5. Calculate scores and write the report.

Use repository-native tooling and existing CI/test targets. Do not install tools or add instrumentation just to produce the assessment. For Nx workspaces, use the existing Nx targets through the workspace's package manager.

## 1. Scope and Stack

Identify the primary deployable frontend app(s). Unless the user narrows scope, include the main production-facing apps and the shared frontend libraries they consume. State the scope explicitly.

Detect the package manager from lockfiles. Inspect manifests, lockfiles, build/test configuration, source code, git history, release metadata, and UI package deprecation metadata.

| Category             | Examples                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| UI runtime/framework | `react`, `vue`, `@angular/core`, `svelte`, `next`, `@remix-run/*`, `nuxt`                                            |
| Router               | Framework router, `react-router`, `react-router-dom`, `@tanstack/react-router`                                       |
| Build tool           | `vite`, `webpack`, `rspack`, `parcel`                                                                                |
| Test tools           | `jest`, `vitest`, `cypress`, `@playwright/test`, Storybook                                                           |
| Component library    | `@mui/*`, `antd`, `@chakra-ui/*`, `@mantine/*`, `@radix-ui/*`, shadcn (`components.json`), an in-house design system |
| Tokens/theme         | `style-dictionary`, `@tokens-studio/*`, dedicated token packages, formal CSS variables/theme definitions             |
| Styling              | CSS/Sass, utility classes, `tailwindcss`, `@vanilla-extract/*`, `styled-components`, `@emotion/*`                    |

Use equivalent core packages for the detected stack rather than requiring these examples.

## 2. Repository Evidence

### Dependency Freshness

Assess direct production dependencies used by the scoped frontend and shared libraries, plus frontend-critical development dependencies such as build, test, and Storybook tools.

Record each package's installed/resolved version, latest version, installed-version publication date, and major/minor/patch lag. Use the workspace's package manager and registry metadata; npm examples include `npm outdated --json` and `npm view <package> version time --json`.

### Core Package Currency

Select a short list covering the runtime/framework, router where applicable, build tool, and core test runner. For lagging packages, verify whether peer dependencies or framework compatibility block an upgrade. Use installed dependency trees, plugin peer ranges, and registry metadata such as `npm ls <package>` and `npm view <package> peerDependencies --json`.

### Contributor Activity and Delivery Cadence

Check the oldest reachable commit and `git rev-parse --is-shallow-repository` before scoring history. If the available history does not cover the assessment window, or a shallow checkout prevents verification, mark **both history criteria `N/A`**. Do not treat missing history as zero activity.

For the same assessment window, collect:

- Unique authors, using git's mailmap-aware `%aN <%aE>` format.
- Total commits and merge commits across reachable refs.
- GitHub Releases published in the window, using `gh api repos/<owner>/<repo>/releases --paginate` when available. Distinguish a verified absence of releases (`0`) from unavailable release metadata; note tag-based or other release mechanisms. If release metadata cannot be verified, mark delivery cadence `N/A` and report the available commit/merge counts without scoring them.

Use `git --no-pager log` and `git rev-list --count` with explicit date bounds and `--all`. Record the bounds and counts. Count contributors as a diversity signal, not a popularity measure.

### Test Suites and Coverage

Identify configured unit, integration, component, end-to-end, and visual/Storybook checks from scripts, configuration, CI, and test files. Run existing commands only when needed to confirm the test surface or obtain coverage.

Prefer existing frontend coverage artifacts and coverage-enabled targets over new instrumentation. Report the most relevant frontend application percentage, its metric (for example, lines or statements), and its source; do not substitute backend-only coverage. Note additional figures separately.

### UI System and Component Library

Inspect dependencies **and source usage** to establish:

- Component libraries and in-house design systems in use.
- Formal design token packages and theme definitions.
- Styling approaches, including CSS-in-JS authored in JavaScript/JSX; distinguish runtime-generated and compiled styles where evident.
- Consistency of component, token, and styling adoption across the scoped apps.
- Installed/latest versions, maintenance status, and deprecations, using metadata such as `npm view <package> deprecated --json`.

Treat CSS-in-JS as an approach, not a package category or an automatic scoring benefit. Assess its consistency, maintenance, and integration with the UI system.

## 3. Primary User Journey

Inspect routes/pages, UI components, and interaction logic to identify a representative user's main goal, starting point, and successful outcome. Map only verified steps, including important alternate, blocked, or recovery paths. Do not infer behavior or endpoints from names alone.

Prepare a Mermaid `journey` diagram organized into user-facing sections, with tasks in order, actor(s), and 1-5 experience ratings. Use observed UX evidence for ratings; otherwise use a neutral `3` and label it as an estimate. These experience ratings do not affect the assessment score.

Associate verified API calls with journey tasks. List HTTP methods, routes, and service/base URLs where discoverable. Show environment variable names instead of secret values and mark unresolved destinations. If there is no verifiable user-facing journey or no endpoint calls, say so instead of inventing them.

When a target URL and Chrome DevTools MCP are available, follow the authentication procedure below, then walk through the journey **before auditing performance**. Record an ordered replay plan with routes, actions, and expected page states. Avoid destructive actions, real purchases, or other consequential submissions without explicit authorization; record skipped steps. If browser access is unavailable, use the source-verified journey and label it as not browser-verified.

## 4. Optional Live-Site Performance

### Availability and Authentication

- No URL: skip live measurement without changing the repository-only score.
- Chrome DevTools MCP unavailable: add a report note and leave Lighthouse unscored. Do not install tooling or substitute another browser.
- Login, SSO, or another authentication challenge during the walkthrough or either measurement: pause, ask the user to sign in manually in the MCP-controlled browser, and **wait for confirmation**. Do not request, enter, or store credentials or bypass access controls.
- After confirmation, verify the intended app page is available in the same authenticated session. Preserve session storage/cookies needed for access. If a test redirects to authentication, discard that test's results and rerun after access is restored; never score the login page as the target app. If access remains blocked, report the limitation and leave affected measurements unavailable.

### Journey-Based Measurement

After the walkthrough:

1. Inspect the available MCP capabilities. Use a journey-capable Lighthouse workflow when supported; otherwise combine a navigation audit with a journey trace where available. Do not assume every audit tool exposes a Performance category score.
2. Use the supplied URL as the entry point and reuse the authenticated browser session. If the Lighthouse workflow supports journey interactions, replay the verified actions in order. If it only audits a single navigation, audit the entry page and replay the journey in the separate performance trace; clearly distinguish these scopes.
3. When using a trace, keep it running through the replayed interactions, then stop it. Record completed/skipped steps and reasons, actual URLs, measurement date, browser/tool versions where available, device/viewport, throttling, and cache settings. Use consistent settings for comparable runs.
4. Capture the Lighthouse **Performance category score (0-100)** when exposed. Do not derive it from unrelated audit categories, trace timings, or the three diagnostics below. An unavailable category score makes the optional criterion `N/A`, even if other diagnostics were captured.
5. Report LCP, INP, and CLS with their source and units. Keep navigation/page results distinct in multi-page traces; do not combine unrelated pages into a synthetic metric. Distinguish lab/trace results from representative field data.

### Metric Breakdown (Diagnostic Only)

| Metric | Good      | Needs improvement      | Poor     |
| ------ | --------- | ---------------------- | -------- |
| LCP    | <= 2.5 s  | > 2.5 s and <= 4 s     | > 4 s    |
| INP    | <= 200 ms | > 200 ms and <= 500 ms | > 500 ms |
| CLS    | <= 0.1    | > 0.1 and <= 0.25      | > 0.25   |

List each metric's value, individual score when provided by the tool, and threshold rating. Convert tool-provided 0-1 metric scores to 0-100 and label the scale. If no numeric score is provided, report the threshold rating rather than inventing a numeric score.

Rate INP only from representative field data (typically the 75th percentile across visits). A lab interaction can be reported as a diagnostic but does not establish field INP; mark unavailable field INP `N/A`. Never substitute Total Blocking Time (TBT) for INP. Explain that INP is not an input to Lighthouse's navigation Performance score, and the LCP/INP/CLS breakdown alone does not reconstruct that score.

These diagnostics add **no assessment points**. Missing individual metrics do not change an available Lighthouse category score or its weight.

## 5. Scoring

The repository criteria total **100 points**. Add the optional **20-point Lighthouse criterion** only when a URL was supplied and its Performance category score was obtained through Chrome DevTools MCP. Exclude both history weights when the assessment window cannot be verified.

Calculate `applicable_maximum` as the sum of weights for scored criteria, then `normalized_score = round(100 * earned_points / applicable_maximum)`. Report both the normalized score and raw earned/applicable points. For example, the maximum is 100 (80 without history), or 120 (100 without history) when Lighthouse is scored; exclude any other criterion marked `N/A` as well. Unavailable evidence is not a measured zero, but apply explicit rubric outcomes such as no measurable coverage found. If no criterion can be scored, report the assessment as unavailable instead of dividing by zero.

| Criterion                           | Weight | Scoring                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------- | -----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency freshness                |     20 | `round(20 * fresh_ratio)`. A package is fresh if it is latest or at most one minor behind within the same major, and its installed version was published within 183 days. Treat latest packages with no releases in 183 days as current rather than stale. `fresh_ratio` is the share of assessed packages meeting these rules.                                                                                                                                         |
| Core package currency               |     20 | `20`: all latest or latest compatible, with compatibility blockers verified and documented. Otherwise: `15` for patch/minor-only lag; `8` for exactly one unblocked one-major lag and no larger lag; `0` for multiple unblocked one-major lags or any unblocked lag of more than one major. Do not count verified latest-compatible packages as unblocked lag.                                                                                                          |
| Contributors, assessment window     |     10 | `10`: >= 4 contributors; `8`: 3; `6`: 2; `3`: 1; `0`: none. `N/A` if history is insufficient.                                                                                                                                                                                                                                                                                                                                                                           |
| Delivery cadence, assessment window |     10 | Add commits (`>=50`: 4; `20-49`: 3; `5-19`: 2; `1-4`: 1; `0`: 0), merges (`>=15`: 3; `5-14`: 2; `1-4`: 1; `0`: 0), and releases (`>=2`: 3; `1`: 2; `0`: 0). `N/A` if history is insufficient or release metadata cannot be verified.                                                                                                                                                                                                                                    |
| Test suite maturity                 |     10 | `10`: unit plus integration/e2e/component tests across meaningful flows; `7`: at least two test layers; `4`: one automated layer; `0`: no automated tests found.                                                                                                                                                                                                                                                                                                        |
| Coverage                            |     10 | `10`: >= 80%; `8`: >= 70% and < 80%; `6`: >= 60% and < 70%; `3`: >= 40% and < 60%; `1`: > 0% and < 40%; `0`: zero or no measurable frontend coverage found.                                                                                                                                                                                                                                                                                                             |
| UI system & component library       |     20 | `20`: one modern component library, formal tokens, and consistent maintained styling; `15`: one consistent library with tokens/theme and minor lag or isolated deviations; `10`: one library without formal tokens, or a custom design system without a token library; `5`: competing libraries/styling systems, or a deprecated library with migration underway; `0`: primary UI is deprecated/unmaintained, severely fragmented, or lacks a component library/tokens. |
| Lighthouse Performance (optional)   |     20 | `round(20 * lighthouse_performance_score / 100)`. No separate points for LCP, INP, or CLS. `N/A` if no URL, MCP access, or category score.                                                                                                                                                                                                                                                                                                                              |

Keep the rubric fixed and explain any necessary deviation. Do not invent missing evidence or hide major core-package problems. Repository age, complexity, and developer counts beyond the contributor criterion must not adjust this score.

### Separate Repository Context Score

Report this context score independently; do not add it to or subtract it from the frontend assessment.

| Factor              | Points | Scoring                                                                                                                                                                                                                                                                                     |
| ------------------- | -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository age      |    0-3 | From the first commit: `0`: < 3 months; `1`: 3 to < 12 months; `2`: 1 to < 3 years; `3`: >= 3 years. Note unverified age in shallow checkouts.                                                                                                                                              |
| Frontend complexity |    0-4 | `0`: no clear app; `1`: one app/package, no shared frontend packages; `2`: one deployable app plus shared frontend packages; `3`: multiple frontend apps or a frontend monorepo not meeting the next tier; `4`: multiple deployable apps plus shared frontend libraries or a design system. |
| Active developers   |    0-3 | Use the same assessment-window contributor count: `0`: none; `1`: one; `2`: 2-3; `3`: >= 4. Mark `N/A` if the window cannot be verified.                                                                                                                                                    |

## Required Report

Keep the report concise, cite evidence, and use this order. The score summary is presented first for readability even though scoring happens after measurement.

### Scope

State the repository/apps, exact assessment window, detected stack and package manager, UI libraries, tokens/theme, styling approach (including CSS-in-JS), and model(s) used (`Unknown` if unavailable). Include the target URL/MCP status and material evidence limitations.

### Score Summary and Scoring Table

`Frontend assessment score: <normalized>/100 (<earned>/<applicable maximum> applicable points)`

Use one row per scoring criterion above, followed by a total. Mark unavailable criteria `N/A` and explain their exclusion. Do not put LCP, INP, or CLS in this scoring table.

| Criterion | Weight | Evidence | Score | Model(s) used | Notes |
| --------- | -----: | -------- | ----: | ------------- | ----- |

### Repository Context Score

List each context factor's evidence and score, plus raw earned/applicable context points (normally out of 10). Note that it is excluded from the frontend assessment score.

### UI System & Component Library Status

| Library / Package | Role (Components / Tokens / Styling) | Installed | Latest | Deprecated? | Consistency & Notes |
| ----------------- | ------------------------------------ | --------- | ------ | ----------- | ------------------- |

Describe styling approaches separately from package names; CSS-in-JS itself is not a package.

### Core Package Status

| Package | Current | Latest | Status | Upgrade blocker? |
| ------- | ------- | ------ | ------ | ---------------- |

### Frontend User Journey Diagram

Include the Mermaid `journey` diagram prepared in step 3, associated verified endpoints, and walkthrough limitations. Do not replace it with an architecture or API-plumbing diagram.

### Optional Live-Site Performance Results

Place results **after the journey**. If no URL was supplied, use one short note. Otherwise include:

- Lighthouse Performance category score, the calculation `round(20 * score / 100)`, and earned points out of 20, or why the criterion is `N/A`.
- Measurement settings, replayed/skipped journey steps, audited pages, and the distinction between Lighthouse and trace scopes.
- The diagnostic table below. Mark missing values/scores `N/A`; missing diagnostics do not remove an available Lighthouse score. Do not imply that these three metrics sum to the category score.

| Metric | Value and units | Individual score (0-100) | Threshold rating | Source / Page / Limitations |
| ------ | --------------- | -----------------------: | ---------------- | --------------------------- |
| LCP    | ...             |                      ... | ...              | ...                         |
| INP    | ...             |                      ... | ...              | ...                         |
| CLS    | ...             |                      ... | ...              | ...                         |

### Top 5 Pros and Top 5 Cons

Provide two ranked lists of the strongest evidence-backed advantages and highest-impact problems. If fewer than five are supported, say so rather than inventing findings.

### Verdict

End with two short paragraphs: what drove the score, then the highest-leverage improvements. Discuss only scored criteria as score drivers. If history criteria are `N/A`, keep unavailable contributor/cadence findings in the scope or scoring table, not the verdict.
