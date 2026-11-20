---
name: frontend-assessment
description: Assess frontend health and maturity. Use when the user asks for a frontend assessment, health check, review, or reproducible 0-100 score for dependencies, contributor activity, delivery cadence, testing, coverage, and UI system adoption. Coordinates separate Lighthouse audit and journey performance skills when a target URL is supplied.
---

# Frontend Assessment

Produce an evidence-based, stack-aware **0-100 frontend assessment score** for the current repository and return the complete report directly in your response. Cite repository paths, command results, and browser measurements so another reviewer can reproduce the assessment.

**Keep the assessed project read-only and the assessment output-only.** Do not create, modify, or delete files or directories in it, including ignored or untracked files. Do not write reports, notes (such as `history-tests.md`), helper scripts, test fixtures, diagrams, screenshots, traces, or other assessment artifacts into the project. Keep analysis and intermediate evidence in memory/tool responses, and include diagrams and findings inline in the final response. Omit optional file-output arguments. If a browser tool requires artifact storage, use tool-managed temporary storage outside the assessed project; if that is not possible, skip the affected measurement and disclose the limitation. Do not remove pre-existing files.

## Inputs and Execution Order

$ARGUMENTS

- Respect the user's app/package scope and stack instructions.
- Use the **last three months** for contributor activity and delivery cadence unless the user specifies a quarter or another period. Resolve exact start and end dates once and use them consistently for both criteria. Dependency status and live measurements describe the current state, not a historical snapshot.
- Accept an optional target URL directly in the request, as `FRONTEND_ASSESSMENT_URL=https://...` in the skill arguments, or from the `FRONTEND_ASSESSMENT_URL` environment variable. An explicit request/argument takes precedence over the environment variable.

Execute in this order:

1. Establish scope and detect the stack.
2. Collect repository evidence.
3. Map the primary user journey and, when browser access is available, walk through it.
4. If a URL was supplied, invoke `frontend-lighthouse` for audits and `frontend-performance` for a separate journey trace. Follow the capability and fallback procedure in section 4; neither workflow depends on the other's success.
5. Calculate scores and return the report in the response; do not save it to a file.

Use repository-native tooling for evidence collection, but **do not execute the assessed project's test suites or coverage commands**, including unit, integration, component, end-to-end, and visual/Storybook tests. Do not trigger them indirectly through package scripts, Nx targets, or CI workflows. Inspect existing test/CI configuration and artifacts instead. Do not add instrumentation or install tools into the assessed project. The only tooling exception is an explicitly authorized standalone Lighthouse run outside the project, as specified by `frontend-lighthouse`. Optional browser walkthroughs, audits, and traces follow sections 3-4; they do not authorize running project test suites.

## 1. Scope and Stack

Identify the primary deployable frontend app(s). Unless the user narrows scope, include the main production-facing apps and the shared frontend libraries they consume. State the scope explicitly.

Detect the package manager from lockfiles. Inspect manifests, lockfiles, build/test configuration, source code, git history, release metadata, and UI package deprecation metadata.

| Category             | Examples                                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| UI runtime/framework | `react`, `vue`, `@angular/core`, `svelte`, `next`, `@remix-run/*`, `nuxt`                                             |
| Router               | Framework router, `react-router`, `react-router-dom`, `@tanstack/react-router`                                        |
| Build tool           | `vite`, `webpack`, `rspack`, `parcel`                                                                                 |
| Test tools           | `jest`, `vitest`, `cypress`, `@playwright/test`, Storybook                                                            |
| Component library    | Third-party or in-house UI components verified in production renders/templates, including locally owned components    |
| Tokens/theme         | Shared semantic tokens/theme definitions in stylesheets, source modules, configuration, or dedicated packages         |
| Styling              | Global or scoped stylesheets, utility classes, CSS Modules, preprocessors, CSS-in-JS, inline styles, generated styles |

These are discovery hints, not an allowlist. Use equivalent core packages for the detected stack rather than requiring these examples. Discover the UI system from rendered source usage rather than recognizing particular package names.

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

Identify configured unit, integration, component, end-to-end, and visual/Storybook checks by inspecting scripts, configuration, CI definitions, and representative test files only. Classify layers by what the tests exercise, not by runner or package names; no particular test framework is required. Do not run test suites, generate coverage, or trigger CI. Distinguish configured test layers from existing execution results, and do not claim tests pass or fail without cited results. State in the report that project tests were not executed as part of the assessment; non-execution alone does not mean tests are absent or failing.

Use only existing frontend coverage artifacts or published CI reports. Report the most relevant frontend application percentage, its metric (for example, lines or statements), its source, and its date/commit where available; flag stale or unclear scope rather than presenting it as current. Do not substitute backend-only coverage or infer coverage from test counts. If no measurable frontend coverage is available, state that it was not generated and apply the rubric's existing no-measurable-coverage outcome. Note additional figures separately.

### UI System and Component Library

Use **components actually rendered in production source** as the primary evidence of UI-system adoption, not a list of recognized dependencies or styling brands:

1. Inspect representative routes/pages and shared UI across each scoped app. Trace component imports to their use in JSX, render functions, or framework templates. Follow aliases, namespace imports, barrel re-exports, local wrappers, and framework registration/auto-import configuration where needed to identify the underlying source. Distinguish shared UI primitives from layout, routing, and domain components; not every imported component belongs to a design system.
2. Group verified rendered UI components by their originating package or local shared component system. Exclude unused/type-only imports and test/story/demo-only usage from production adoption evidence. An installed dependency or an import alone does not establish adoption. Record unresolved dynamic components rather than guessing their origin.
3. Inspect the styles and token/theme definitions consumed by those components and their callers. Include stylesheet imports, global styles, classes, scoped styles, inline styles, and CSS-in-JS authored in source; distinguish runtime-generated and compiled styles where evident. Verify shared semantic token definitions and their consumption, whether stored in CSS variables, source modules, configuration, or a package. Rendered component imports alone do not establish styling or token consistency.
4. Assess consistency across the inspected production surfaces. Cite representative render/template paths, component origins, and style/token usage, and state the sampling scope and unresolved cases. Use existing tooling and source inspection; do not install a parser. If reporting adoption counts or percentages, define the unit and denominator and label sampled results; do not present raw import counts as application-wide adoption.
5. For discovered external packages, record installed/latest versions, maintenance status, and deprecations using metadata such as `npm view <package> deprecated --json`. For locally owned systems, assess maintenance from repository evidence and mark registry version/deprecation fields `N/A`.

Treat all styling approaches neutrally; CSS-in-JS is an approach, not a package category or an automatic scoring benefit. A maintained in-house system and formal tokens defined without a dedicated package qualify equally to third-party equivalents. Multiple packages or styling techniques are not inherently fragmentation: distinguish intentionally composed layers from competing, inconsistent implementations of the same UI roles.

## 3. Primary User Journey

Inspect routes/pages, UI components, and interaction logic to identify a representative user's main goal, starting point, and successful outcome. Map only verified steps, including important alternate, blocked, or recovery paths. Do not infer behavior or endpoints from names alone.

Prepare a Mermaid `journey` diagram organized into user-facing sections, with tasks in order, actor(s), and 1-5 experience ratings. Use observed UX evidence for ratings; otherwise use a neutral `3` and label it as an estimate. These experience ratings do not affect the assessment score.

Associate verified API calls with journey tasks. List HTTP methods, routes, and service/base URLs where discoverable. Show environment variable names instead of secret values and mark unresolved destinations. If there is no verifiable user-facing journey or no endpoint calls, say so instead of inventing them.

When a target URL and Chrome DevTools MCP are available, follow the authentication procedure below, then walk through the journey **before auditing performance**. Record an ordered replay plan with routes, actions, and expected page states. Avoid destructive actions, real purchases, or other consequential submissions without explicit authorization; record skipped steps. If browser access is unavailable, use the source-verified journey and label it as not browser-verified.

## 4. Optional Live-Site Audits and Performance

No URL: skip both live workflows without changing the repository-only score. Otherwise load the two companion skills through the agent's skill discovery mechanism. The installer places `frontend-lighthouse` and `frontend-performance` alongside `frontend-assessment`; each is also independently invokable. If a companion is missing, disclose that limitation and ask the user to update the installation rather than assume its instructions or silently omit it.

### Shared Context and Authentication

Pass both skills the supplied URL, scoped app, verified journey/replay plan, completed/skipped steps, authenticated browser page/session, requested settings, and relevant existing evidence. Keep the assessed project read-only and output results inline.

For login/SSO during the walkthrough or a measurement, pause, ask the user to sign in manually in the browser used for that run, and wait for confirmation. Verify the app page, preserve necessary storage, and discard/rerun results interrupted by authentication. Never score a login/error page as the app or request/store credentials. A standalone browser does not automatically share MCP authentication. Safety exclusions for consequential actions are separate from audit/trace availability.

### Lighthouse Audit: `frontend-lighthouse`

Run the supported Lighthouse categories after the walkthrough. The companion checks actual capabilities: an MCP `lighthouse_audit` tool may explicitly exclude Performance while still producing accessibility, SEO, and best-practices results. Retain those results; do not claim the entire audit failed because its Performance category is missing.

If no tool exposes the required Performance category, the companion must offer a user-provided Lighthouse JSON report or an explicitly authorized standalone Lighthouse run and wait for the user's choice before finalizing `N/A`. Do not repeat a fallback question already answered. No unapproved tool downloads, separate browser launches, or third-party audit services are allowed. A provided report or authorized standalone run can supply the score when its target, category value, and provenance are validated; disclose its source, date, and settings rather than label it an MCP result.

Only an actual, valid Lighthouse **Performance category score (0-100)** can earn the optional weight. Preserve measured zero as zero. Missing/invalid scores remain `N/A` after a declined or blocked fallback, with the exact reason. Other category scores and trace timings cannot substitute for it.

### Journey Trace: `frontend-performance`

Independently replay the verified safe journey in a Chrome DevTools performance trace. Keep the recording running through the actions and explicitly stop it; a default auto-stopping navigation trace may end before interactions. Run this workflow even when Lighthouse Performance is unavailable, provided tracing is supported. Conversely, an unavailable trace must not suppress a valid Lighthouse result.

Use the companion's LCP/INP/CLS thresholds and evidence rules. Keep per-page/navigation results distinct, label lab interaction timings separately from field INP, and never substitute TBT for INP. Diagnostics add no assessment points and cannot reconstruct Lighthouse's category score. Missing diagnostics do not remove an available Lighthouse score or its weight.

For both workflows, record actual URLs, measurement date, tool/browser versions where available, device/viewport, throttling, cache/storage settings, scope, completed/skipped actions, and specific limitations. Distinguish navigation audits, imported reports, and journey traces in the final report.

## 5. Scoring

The repository criteria total **100 points**. Add the optional **20-point Lighthouse criterion** only when a URL was supplied and `frontend-lighthouse` obtained a validated Performance category score through a supported audit tool, an explicitly authorized standalone run, or a user-provided Lighthouse report. Cite its source, date, and settings; do not require a separate journey trace to score it. Exclude both history weights when the assessment window cannot be verified.

Calculate `applicable_maximum` as the sum of weights for scored criteria, then `normalized_score = round(100 * earned_points / applicable_maximum)`. Report both the normalized score and raw earned/applicable points. For example, the maximum is 100 (80 without history), or 120 (100 without history) when Lighthouse is scored; exclude any other criterion marked `N/A` as well. Unavailable evidence is not a measured zero, but apply explicit rubric outcomes such as no measurable coverage found. If no criterion can be scored, report the assessment as unavailable instead of dividing by zero.

| Criterion                           | Weight | Scoring                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------- | -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dependency freshness                |     20 | `round(20 * fresh_ratio)`. A package is fresh if it is latest or at most one minor behind within the same major, and its installed version was published within 183 days. Treat latest packages with no releases in 183 days as current rather than stale. `fresh_ratio` is the share of assessed packages meeting these rules.                                                                                                                                                                                                            |
| Core package currency               |     20 | `20`: all latest or latest compatible, with compatibility blockers verified and documented. Otherwise: `15` for patch/minor-only lag; `8` for exactly one unblocked one-major lag and no larger lag; `0` for multiple unblocked one-major lags or any unblocked lag of more than one major. Do not count verified latest-compatible packages as unblocked lag.                                                                                                                                                                             |
| Contributors, assessment window     |     10 | `10`: >= 4 contributors; `8`: 3; `6`: 2; `3`: 1; `0`: none. `N/A` if history is insufficient.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Delivery cadence, assessment window |     10 | Add commits (`>=50`: 4; `20-49`: 3; `5-19`: 2; `1-4`: 1; `0`: 0), merges (`>=15`: 3; `5-14`: 2; `1-4`: 1; `0`: 0), and releases (`>=2`: 3; `1`: 2; `0`: 0). `N/A` if history is insufficient or release metadata cannot be verified.                                                                                                                                                                                                                                                                                                       |
| Test suite maturity                 |     10 | `10`: unit plus integration/e2e/component tests across meaningful flows; `7`: at least two test layers; `4`: one automated layer; `0`: no automated tests found.                                                                                                                                                                                                                                                                                                                                                                           |
| Coverage                            |     10 | `10`: >= 80%; `8`: >= 70% and < 80%; `6`: >= 60% and < 70%; `3`: >= 40% and < 60%; `1`: > 0% and < 40%; `0`: zero or no measurable frontend coverage found.                                                                                                                                                                                                                                                                                                                                                                                |
| UI system & component library       |     20 | Score verified production usage, equally for third-party and in-house systems. `20`: a cohesive maintained component system, formal shared tokens, and consistent styling; `15`: a consistent system with tokens/theme and minor lag or isolated deviations; `10`: a shared component system without formal tokens; `5`: competing, inconsistently adopted component/styling systems, or a deprecated system with migration underway; `0`: primary UI is deprecated/unmaintained, severely fragmented, or lacks a shared component system. |
| Lighthouse Performance (optional)   |     20 | `round(20 * lighthouse_performance_score / 100)`. No separate points for LCP, INP, or CLS. `N/A` if no URL or no validated category score after the offered fallback. Other audit categories and traces do not add points.                                                                                                                                                                                                                                                                                                                 |

Keep the rubric fixed and explain any necessary deviation. Do not invent missing evidence or hide major core-package problems. Repository age, complexity, and developer counts beyond the contributor criterion must not adjust this score.

### Separate Repository Context Score

Report this context score independently; do not add it to or subtract it from the frontend assessment.

| Factor              | Points | Scoring                                                                                                                                                                                                                                                                                     |
| ------------------- | -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository age      |    0-3 | From the first commit: `0`: < 3 months; `1`: 3 to < 12 months; `2`: 1 to < 3 years; `3`: >= 3 years. Note unverified age in shallow checkouts.                                                                                                                                              |
| Frontend complexity |    0-4 | `0`: no clear app; `1`: one app/package, no shared frontend packages; `2`: one deployable app plus shared frontend packages; `3`: multiple frontend apps or a frontend monorepo not meeting the next tier; `4`: multiple deployable apps plus shared frontend libraries or a design system. |
| Active developers   |    0-3 | Use the same assessment-window contributor count: `0`: none; `1`: one; `2`: 2-3; `3`: >= 4. Mark `N/A` if the window cannot be verified.                                                                                                                                                    |

## Required Report

Return the entire report inline in your response, not as a file or a link to a generated report. Keep it concise, cite evidence, and use this order. The score summary is presented first for readability even though scoring happens after measurement.

### Scope

State the repository/apps, exact assessment window, detected stack and package manager, UI libraries, tokens/theme, styling approach (including CSS-in-JS), and model(s) used (`Unknown` if unavailable). Include the target URL, separate Lighthouse audit and performance-trace availability, imported/standalone evidence sources where applicable, and material evidence limitations.

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

Describe styling approaches separately from package names; CSS-in-JS itself is not a package. Include locally owned component/token systems with registry fields marked `N/A`. Cite representative production render/template usage, traced component origins, and consumed style/token definitions. State the inspected apps/routes and any sampling or resolution limitations; distinguish installed-but-unused packages from adopted systems.

### Core Package Status

| Package | Current | Latest | Status | Upgrade blocker? |
| ------- | ------- | ------ | ------ | ---------------- |

### Frontend User Journey Diagram

Include the Mermaid `journey` diagram prepared in step 3, associated verified endpoints, and walkthrough limitations. Do not replace it with an architecture or API-plumbing diagram.

### Optional Lighthouse Audit Results

Place results **after the journey**. If no URL was supplied, use one short note covering both live workflows. Otherwise include:

- Audit status, supported category scores/findings (including non-Performance categories), audited pages, source (MCP, authorized standalone, or imported report), date, scope, and measurement settings.
- Lighthouse Performance category score, the calculation `round(20 * score / 100)`, and earned points out of 20, or the exact reason it is `N/A` and the fallback decision. Do not describe a supported non-Performance audit as unavailable.

### Optional Journey Performance Results

When a URL was supplied, report trace status independently of Lighthouse, with measurement settings, actual pages, and completed/skipped journey steps and reasons. Distinguish safety exclusions from tool failures and authentication blocks.

Include the diagnostic table below using `frontend-performance`'s evidence rules. Mark missing values/scores `N/A`; missing diagnostics do not remove an available Lighthouse score. Label field INP explicitly and report lab interaction timings separately. Keep pages and Lighthouse/trace scopes distinct. Do not imply that these three metrics sum to the category score.

| Metric | Value and units | Individual score (0-100) | Threshold rating | Source / Page / Limitations |
| ------ | --------------- | -----------------------: | ---------------- | --------------------------- |
| LCP    | ...             |                      ... | ...              | ...                         |
| INP    | ...             |                      ... | ...              | ...                         |
| CLS    | ...             |                      ... | ...              | ...                         |

### Top 5 Pros and Top 5 Cons

Provide two ranked lists of the strongest evidence-backed advantages and highest-impact problems. If fewer than five are supported, say so rather than inventing findings.

### Verdict

End with two short paragraphs: what drove the score, then the highest-leverage improvements. Discuss only scored criteria as score drivers. If history criteria are `N/A`, keep unavailable contributor/cadence findings in the scope or scoring table, not the verdict.
