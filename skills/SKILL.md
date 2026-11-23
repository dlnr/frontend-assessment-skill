---
name: frontend-assessment
description: Run a complete frontend health assessment in one skill. Use for an evidence-based 0-100 score covering dependencies, contributor activity, delivery cadence, testing, coverage, and UI-system adoption, with an application architecture map, optional Lighthouse audits, interaction performance traces, and one consolidated verdict.
---

# Frontend Assessment

Produce an evidence-based, stack-aware **0-100 frontend assessment score** for the current repository and return the complete report directly in your response. Cite repository paths, command results, and browser measurements so another reviewer can reproduce the assessment.

This is a **single, self-contained skill**: collect repository evidence, run the applicable live-site workflows below, and return one consolidated report and verdict. No companion skills or separate invocations are required.

**Keep the assessed project read-only and the assessment output-only.** Do not create, modify, or delete files or directories in it, including ignored or untracked files. Do not execute project tests or generate coverage; there is no test-execution mode or generated-artifact exception in this skill. Do not write reports, notes (such as `history-tests.md`), helper scripts, test fixtures, diagrams, screenshots, traces, or other assessment artifacts into the project. Keep analysis and intermediate evidence in memory/tool responses, and include diagrams and findings inline in the final response. Omit optional file-output arguments. If a browser tool requires artifact storage, use tool-managed temporary storage outside the assessed project; if that is not possible, skip the affected measurement and disclose the limitation. Do not remove pre-existing files.

## Inputs and Execution Order

$ARGUMENTS

- Respect the user's app/package scope and stack instructions.
- Use the **last three months** for contributor activity and delivery cadence unless the user specifies a quarter or another period. Resolve exact start and end dates once and use them consistently for both criteria. Dependency status and live measurements describe the current state, not a historical snapshot.
- Accept an optional target URL directly in the request, as `FRONTEND_ASSESSMENT_URL=https://...` in the skill arguments, or from the `FRONTEND_ASSESSMENT_URL` environment variable. An explicit request/argument takes precedence over the environment variable.

Execute in this order:

1. Establish scope and detect the stack.
2. Collect repository evidence.
3. Map the application architecture from verified repository evidence; when browser access is available, inspect representative pages and safely verify observable endpoint calls.
4. If a URL was supplied, run the Lighthouse audit and interaction performance trace described in section 4 as independent measurement steps within this assessment. Neither depends on the other's success.
5. Run the optional modern-web-guidance check in section 2 when the tool is available.
6. Calculate scores and return one report with a verdict that synthesizes all available evidence; do not save it to a file.

Use repository-native tooling for evidence collection, but **do not execute the assessed project's tests or coverage commands of any kind**, including unit, integration, component, end-to-end, visual/Storybook, and smoke tests. Do not trigger them indirectly through package scripts, Nx targets, or local/remote CI workflows. Inspect configuration, representative source files, and existing artifacts instead. Do not offer test execution as an opt-in or ask the user to run suites to complete the assessment. Lighthouse audits, safe browser inspections, and performance traces are separate live-site measurements, not permission to invoke project test runners. Remain stack-, framework-, and tooling-neutral: evaluate the project's actual choices against the fixed rubric without requiring a particular test framework or implementation approach. Do not add instrumentation or install tools into the assessed project.

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

Identify configured unit, integration, component, end-to-end, and visual/Storybook checks by inspecting scripts, configuration, CI definitions, and representative test files only. Classify layers by what the tests exercise, not by runner or package names; no particular test framework is required. Do not run test suites, generate coverage, update snapshots, or trigger CI. Distinguish configured test layers from existing execution evidence, and do not claim tests pass or fail without cited recorded results. State that project tests were not executed as part of this assessment; non-execution alone does not mean tests are absent or failing and must not reduce the score.

Use only existing frontend coverage artifacts or published CI reports. Report the most relevant frontend application percentage, its metric (for example, lines or statements), its source, and its date/commit where available; flag stale or unclear scope rather than presenting it as current. Do not substitute backend-only coverage or infer coverage from test counts. If no measurable frontend coverage is available, state that it was not generated and apply the rubric's existing no-measurable-coverage outcome. Note additional figures separately.

### Modern Web Guidance Check

When `modern-web-guidance` is available, run a quick, targeted audit of production UI code; this is a source review, not a project test, and it must not run the assessed project's test or coverage commands. Inspect a small representative sample of the same production routes/components already used for the UI-system assessment. Search for 2-5 concrete UI/platform capabilities evident in that sample (for example, semantic controls, forms, dialogs/popovers, responsive layout, or custom elements) using focused, action-oriented 2-5 word queries; retrieve the matching guides and applicable broad guidance before scoring. Use `pnpx modern-web-guidance@latest` when pnpm is available, otherwise `npx -y modern-web-guidance@latest`, then follow the current `search`/`retrieve` commands and pinned skill-version instructions. Search first; rephrase once if results are weak, and use `list` only as a final broad fallback. Request network permission first when the environment requires approval. Do not install anything into the assessed project or upload its source to an external service. If network/tool access is unavailable, no production UI can be verified, or no relevant guide can be found after one focused rephrase, mark this criterion `N/A` and exclude its weight.

Score only applicable, verifiable guidance against the production source and rendered behavior where browser evidence is already available. Prefer semantically appropriate native components and APIs when they satisfy the need; assess custom components on correct behavior, accessibility, responsive adaptation, and required compatibility fallbacks. Do not reward adoption of the newest feature or penalize a deliberate, documented alternative solely for not using it. Cite sampled paths, retrieved guide IDs, specific matched or violated recommendations, and coverage limitations; do not claim conformance beyond the sample. This criterion is independent of test-suite maturity and Lighthouse scores.

### UI System and Component Library

Use **components actually rendered in production source** as the primary evidence of UI-system adoption, not a list of recognized dependencies or styling brands:

1. Inspect representative routes/pages and shared UI across each scoped app. Trace component imports to their use in JSX, render functions, or framework templates. Follow aliases, namespace imports, barrel re-exports, local wrappers, and framework registration/auto-import configuration where needed to identify the underlying source. Distinguish shared UI primitives from layout, routing, and domain components; not every imported component belongs to a design system.
2. Group verified rendered UI components by their originating package or local shared component system. Exclude unused/type-only imports and test/story/demo-only usage from production adoption evidence. An installed dependency or an import alone does not establish adoption. Record unresolved dynamic components rather than guessing their origin.
3. Inspect the styles and token/theme definitions consumed by those components and their callers. Include stylesheet imports, global styles, classes, scoped styles, inline styles, and CSS-in-JS authored in source; distinguish runtime-generated and compiled styles where evident. Verify shared semantic token definitions and their consumption, whether stored in CSS variables, source modules, configuration, or a package. Rendered component imports alone do not establish styling or token consistency.
4. Assess consistency across the inspected production surfaces. Cite representative render/template paths, component origins, and style/token usage, and state the sampling scope and unresolved cases. Use existing tooling and source inspection; do not install a parser. If reporting adoption counts or percentages, define the unit and denominator and label sampled results; do not present raw import counts as application-wide adoption.
5. For discovered external packages, record installed/latest versions, maintenance status, and deprecations using metadata such as `npm view <package> deprecated --json`. For locally owned systems, assess maintenance from repository evidence and mark registry version/deprecation fields `N/A`.

Treat all styling approaches neutrally; CSS-in-JS is an approach, not a package category or an automatic scoring benefit. A maintained in-house system and formal tokens defined without a dedicated package qualify equally to third-party equivalents. Multiple packages or styling techniques are not inherently fragmentation: distinguish intentionally composed layers from competing, inconsistent implementations of the same UI roles. Separately, count actual UI rendering frameworks per deployable app, not meta-frameworks, routers, build tools, or styling systems as additional UI frameworks. Concurrently shipping more than one distinct UI rendering framework in the same deployable app is a fragmentation signal and caps the UI-system score at 5/20, even when some tokens or styles are shared. Assess frameworks in separate deployable apps independently; do not apply this penalty solely because a monorepo contains different frameworks for different apps. Exclude unused, test-only, or fully retired migration runtimes.

## 3. Application Architecture Map

Inspect the scoped deployable frontend app(s), routes/pages, rendered UI components, API clients, backend source when included or discoverable, external services, and persistence layers. Trace imports, route registration, endpoint handlers, service calls, and storage operations to their implementations. Map only relationships verified in source or observed in the browser; do not infer architecture from package or identifier names alone. State the inspected apps/routes and any unavailable or out-of-scope backend.

Prepare one Mermaid `flowchart TB` per deployable app when multiple apps are in scope, with nested subgraphs for its frontend, backend/API, persistence, and external services where present. Avoid one sprawling cross-app graph; show shared services once and connect only verified relationships. Show a clear component hierarchy in the frontend: representative route/page, layout or feature components, and shared/local or package UI components. Connect parent-to-child nodes with verified `renders` or `uses` edges so the hierarchy has visible depth; group repetitive leaves rather than listing every instance. Show backend route handlers/endpoints connected to the services they call. Put each verified database, cache, object/file store, and browser persistence mechanism in a distinct storage node or subgraph. If backend source is not available, show only verified frontend-to-endpoint calls and clearly say backend internals could not be verified; do not invent them.

Make data movement explicit: connect the relevant page/feature component to its API client when that call site is verified, then connect the API client to each verified endpoint and label the edge with the HTTP method and route; connect handlers/services to the stores they actually read or write, labeling edges `read`, `write`, or `read/write`. Include client-side persistence when verified. Use concise node labels and line breaks (`<br/>`) for readability; place full base URLs, unresolved destinations, and evidence/source paths in a compact table below the diagram. Show environment variable names instead of secret values. Distinguish browser-observed calls from source-verified relationships, and mark unresolved destinations rather than guessing.

Color-code rendered UI components by their verified UI rendering framework: use Mermaid `classDef`/`class` assignments with a distinct, consistent, readable fill for each actual framework used in each deployable app, label framework names in the component nodes, and include a matching legend so color is not the only signal. Apply color only to framework-owned/rendered component nodes, not to routers, meta-frameworks, build tools, styling systems, or backend nodes. Count frameworks using section 2's definition; do not show unused, test-only, or retired runtimes as adopted. Keep labels short and the graph top-down to preserve hierarchy and avoid collisions.

When a target URL and Chrome DevTools MCP are available, use the authentication procedure below, then inspect representative pages and safely exercise only non-consequential controls to confirm visible component states and observable network calls before Lighthouse audits. Do not submit messages, upload files, purchase, or mutate shared data without explicit authorization. If browser inspection is unavailable, use the source-verified map and label it as not browser-verified.

## 4. Optional Live-Site Audits and Interaction Performance

No URL: skip live measurement without changing the repository-only score. Otherwise perform both workflows below as part of this skill. Inspect tool capabilities separately for Lighthouse and interaction tracing. Missing Lighthouse categories do not prevent tracing, and a missing trace does not invalidate available Lighthouse audit findings. If MCP is unavailable, report the browser inspection/trace limitation rather than installing or substituting a browser without authorization.

### Shared Context, Safety, and Authentication

Reuse the supplied URL, scoped app, verified architecture map and safe interaction plan, authenticated browser page/session, requested settings, and existing evidence. Do not start project services just to run live measurements without explicit authorization. Do not send messages, upload files, make purchases, mutate shared data, or perform other consequential submissions without explicit authorization. Record these safety exclusions separately from tool failures. A navigation audit does not require consequential actions; if all safe interactions are blocked, report the navigation scope and blocked actions rather than claiming those interactions were measured.

For login/SSO during browser inspection or a measurement, pause, ask the user to sign in manually in the browser used for that run, and wait for confirmation. Verify the intended app page and preserve necessary storage. Never request/store credentials, extract cookies/tokens, or bypass access controls. Discard wrong-target, failed, or login/error-page measurements; rerun authentication-interrupted measurements after access is restored. If access remains blocked, leave affected measurements unavailable.

For both workflows, record actual URLs, measurement date, tool/browser versions where available, device/viewport, CPU/network throttling, cache/storage settings, scope, completed/skipped actions, and specific limitations. Use consistent settings for comparable runs and disclose deviations. Omit optional file-output arguments; required browser artifacts must use temporary storage outside the project.

### Lighthouse Audit

1. Inspect available tools and their descriptions. A tool named `lighthouse_audit` does not necessarily expose all Lighthouse categories. When it excludes a category (for example Performance), still run and report supported categories such as Accessibility, Best Practices, and SEO where available. Do not pass invented options or expect different wording to enable unsupported categories.
2. After browser inspection, navigate to the supplied entry URL, verify the intended page/session, and run all supported Lighthouse categories. Preserve storage needed for authentication. Record settings, actual audited pages, and whether the audit covers navigation, a timespan, or a snapshot. Replay safe interactions only if a supported timespan workflow is available; otherwise audit the entry navigation and measure verified interactions separately in the trace below. Never label a single-page audit as a full-application measurement.
3. Retain supported category scores and highest-impact failed audits, including affected pages/elements when provided. Unsupported categories do not make the entire audit unavailable. `performance_start_trace` and `performance_stop_trace` provide tracing, not Lighthouse category scores.
4. For each unsupported or unavailable category, mark it `N/A` with the exact reason and keep reporting all supported audit categories independently.

### Interaction Performance Trace

1. Verify Chrome DevTools MCP trace support independently of Lighthouse support. If tracing is unavailable, disclose that limitation and use existing diagnostic evidence with its provenance instead; do not substitute an unapproved tool/browser or suppress valid Lighthouse findings.
2. Reuse the browser inspection's safe interaction plan, return to its entry point, and preserve authentication storage/cookies.
3. For an interaction-spanning trace, call `performance_start_trace` with `reload: false` and `autoStop: false` when those options are exposed. A default auto-stopping navigation trace may end before interactions. Start the recording before the navigation whose load metrics are needed, then navigate to the entry URL and replay the verified safe actions in order. Keep the trace running through them and explicitly call `performance_stop_trace` when finished, including when an action fails. Do not present a load-only trace as an interaction trace.
4. Record completed/skipped/blocked actions and actual URLs. Inspect tool-provided performance insights and associate bottlenecks with the relevant navigation or interaction. Keep each page/navigation's measurements distinct in multi-page traces; do not combine unrelated pages into synthetic LCP, INP, or CLS values. If a metric is not exposed, report `N/A` rather than infer it from unrelated timings.

### Metric Breakdown (Diagnostic Only)

| Metric | Good      | Needs improvement      | Poor     |
| ------ | --------- | ---------------------- | -------- |
| LCP    | <= 2.5 s  | > 2.5 s and <= 4 s     | > 4 s    |
| INP    | <= 200 ms | > 200 ms and <= 500 ms | > 500 ms |
| CLS    | <= 0.1    | > 0.1 and <= 0.25      | > 0.25   |

- Report values with units and sources; CLS is unitless. Keep lab/trace results separate from representative field data.
- Rate field INP only from representative field data (typically the 75th percentile across visits). A lab interaction latency or trace-reported INP candidate is a diagnostic, not representative field INP. Mark unavailable field INP `N/A` and put available lab interaction timings in separately labeled rows. Never substitute Total Blocking Time (TBT) for INP.
- List individual metric scores only when the source provides them. Convert tool-provided 0-1 metric scores to 0-100 and label the scale. Otherwise give a threshold rating where applicable, not an invented numeric score.
- LCP/INP/CLS alone do not reconstruct unavailable Lighthouse category scores. Diagnostics add no assessment points and do not change rubric weights.
- Existing Lighthouse metric evidence may supplement the trace: label its audited page, date, settings, and source rather than presenting it as trace output. Do not claim code fixes or measured improvements unless they were separately requested and verified.

## 5. Scoring

The repository criteria total **110 points** when all criteria are applicable. Lighthouse audits and interaction traces are diagnostic evidence for the final verdict and do not add assessment points; the modern-web-guidance check is a separate 10-point source-review criterion. Exclude both history weights when the assessment window cannot be verified, and exclude the modern-web-guidance weight when it is unavailable under section 2.

Calculate `applicable_maximum` as the sum of weights for scored criteria, then `normalized_score = round(100 * earned_points / applicable_maximum)`. Report both the normalized score and raw earned/applicable points. For example, the maximum is 110 (90 without history) when all non-history criteria, including modern web guidance, are applicable; exclude any other criterion marked `N/A` as well. Unavailable evidence is not a measured zero, but apply explicit rubric outcomes such as no measurable coverage found. If no criterion can be scored, report the assessment as unavailable instead of dividing by zero.

| Criterion                           | Weight | Scoring                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------- | -----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency freshness                |     20 | `round(20 * fresh_ratio)`. A package is fresh if it is latest or at most one minor behind within the same major, and its installed version was published within 183 days. Treat latest packages with no releases in 183 days as current rather than stale. `fresh_ratio` is the share of assessed packages meeting these rules.                                                                                                                                                                                                                                                                                                                                                     |
| Core package currency               |     20 | `20`: all latest or latest compatible, with compatibility blockers verified and documented. Otherwise: `15` for patch/minor-only lag; `8` for exactly one unblocked one-major lag and no larger lag; `0` for multiple unblocked one-major lags or any unblocked lag of more than one major. Do not count verified latest-compatible packages as unblocked lag.                                                                                                                                                                                                                                                                                                                      |
| Contributors, assessment window     |     10 | `10`: >= 4 contributors; `8`: 3; `6`: 2; `3`: 1; `0`: none. `N/A` if history is insufficient.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Delivery cadence, assessment window |     10 | Add commits (`>=50`: 4; `20-49`: 3; `5-19`: 2; `1-4`: 1; `0`: 0), merges (`>=15`: 3; `5-14`: 2; `1-4`: 1; `0`: 0), and releases (`>=2`: 3; `1`: 2; `0`: 0). `N/A` if history is insufficient or release metadata cannot be verified.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Test suite maturity                 |     10 | `10`: unit plus integration/e2e/component tests across meaningful flows; `7`: at least two test layers; `4`: one automated layer; `0`: no automated tests found.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Coverage                            |     10 | `10`: >= 80%; `8`: >= 70% and < 80%; `6`: >= 60% and < 70%; `3`: >= 40% and < 60%; `1`: > 0% and < 40%; `0`: zero or no measurable frontend coverage found.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| UI system & component library       |     20 | Score verified production usage, equally for third-party and in-house systems. `20`: a cohesive maintained component system, formal shared tokens, and consistent styling; `15`: a consistent system with tokens/theme and minor lag or isolated deviations; `10`: a shared component system without formal tokens; `5`: competing, inconsistently adopted component/styling systems, multiple concurrently used UI rendering frameworks in one deployable app (maximum 5 even if tokens/styles are shared), or a deprecated system with migration underway; `0`: primary UI is deprecated/unmaintained, severely fragmented, or lacks a shared component system.                   |
| Modern web guidance                 |     10 | Score a small production-code sample against relevant, retrieved modern-web-guidance recommendations. `10`: sampled patterns consistently follow applicable guidance with sound compatibility choices; `8`: mostly aligned with minor isolated gaps; `5`: mixed alignment or material gaps in several patterns; `2`: recurring major correctness, accessibility, or compatibility problems; `0`: pervasive severe violations. `N/A` if the tool/guidance is unavailable or no relevant guide is found after one focused rephrase and the broad-list fallback; exclude from applicable maximum. Do not award points merely for using newest APIs or penalize justified alternatives. |

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

State the repository/apps, exact assessment window, detected stack and package manager, UI libraries, tokens/theme, styling approach (including CSS-in-JS), and model(s) used (`Unknown` if unavailable). Include the target URL, separate Lighthouse audit and performance-trace availability, modern-web-guidance tool availability, and material evidence limitations.

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

### Testing and Coverage Evidence

Describe configured test layers and cite existing recorded execution results only. Include pass/fail/skip counts when available from those records, along with coverage percentage/metric/source/date and evidence limitations. State that no project tests were executed and no coverage was generated as part of this assessment. Do not request test execution, treat non-execution as failure, or silently treat unavailable results as passes.

### Modern Web Guidance Check

Report whether the check was completed or `N/A`, the guide IDs/topics retrieved, sampled production paths, specific aligned or mismatched recommendations, the 0-10 score, and sampling/tool limitations. If unavailable, state the reason and that its weight was excluded. Keep this score separate from test maturity and Lighthouse results.

### Application Architecture Diagram

Include the Mermaid architecture flowchart prepared in step 3, a legend for framework colors, the evidence/source paths and verification status, and a compact endpoint table with method, route, base URL or environment variable, and associated frontend/backend component. Include verified persistence operations and note any backend or store that could not be inspected. Do not generate a user-journey diagram.

### Optional Lighthouse Audit Results

Place results **after the architecture map**. If no URL was supplied, use one short note covering both live workflows. Otherwise include:

- Audit status, supported category scores/findings, audited pages, source (MCP), date, scope, and measurement settings.
- For unsupported categories, report `N/A` with the exact reason. Do not describe supported categories as unavailable.

### Optional Interaction Performance Results

When a URL was supplied, report trace status independently of Lighthouse, with measurement settings, actual pages, and completed/skipped interactions and reasons. Distinguish safety exclusions from tool failures and authentication blocks.

Include the diagnostic table below using section 4's evidence rules. Mark missing values/scores `N/A`; missing diagnostics do not change rubric scoring. Label field INP explicitly and report lab interaction timings separately. Keep pages and Lighthouse/trace scopes distinct. Do not imply that these three metrics sum to any category score.

| Metric      | Value and units | Individual score (0-100) | Threshold rating | Source / Page / Limitations |
| ----------- | --------------- | -----------------------: | ---------------- | --------------------------- |
| LCP         | ...             |                      ... | ...              | ...                         |
| INP (field) | ...             |                      ... | ...              | ...                         |
| CLS         | ...             |                      ... | ...              | ...                         |

### Top 5 Pros and Top 5 Cons

Provide two ranked lists of the strongest evidence-backed advantages and highest-impact problems. If fewer than five are supported, say so rather than inventing findings.

### Verdict

End with two short paragraphs: an overall judgment explaining what drove the numerical score and what the other observed results reveal, then the highest-leverage improvements. Synthesize **all available evidence**: repository criteria, existing recorded test outcomes and coverage, every available Lighthouse category score and failed audit, architecture-map findings, browser observations, and performance diagnostics. Poor accessibility/SEO/best-practices results, cited recorded test failures, or serious interaction bottlenecks must inform the judgment even when they carry no separate assessment weight; do not call the frontend healthy solely because the weighted score is high. Clearly distinguish scored drivers from diagnostic/context evidence, preserve the fixed rubric, and never average unrelated scores or invent weights. If history criteria are `N/A`, keep unavailable contributor/cadence findings in the scope or scoring table, not the verdict. The verdict should also incorporate material modern-web-guidance findings without treating an unavailable check as a failure.
