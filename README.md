# Frontend Assessment Skill

One installable AI agent skill for Zed, Claude, and other agent systems that produces an evidence-based **0-100 frontend health and maturity score**. `frontend-assessment` covers repository evidence, inspection of test/coverage evidence, the primary user journey, optional Lighthouse audits, and journey performance traces in one workflow and one consolidated report. No companion skills or separate invocations are required.

## Installation

Run the installer and choose a scope:

```bash
npx frontend-assessment-skill
```

- **Global** (`~/.agents/skills/frontend-assessment/`): available across projects.
- **Project** (`.agents/skills/frontend-assessment/`): available only in the current repository.

The installer copies one self-contained `SKILL.md`.

Or select the scope with a flag:

```bash
# Install globally
npx frontend-assessment-skill --global

# Install in the current project
npx frontend-assessment-skill --project
```

### Updating

Use `@latest` and `--update` to replace the installed skill without an overwrite prompt:

```bash
# Update the global installation
npx frontend-assessment-skill@latest --update --global

# Update the current project's installation
npx frontend-assessment-skill@latest --update --project
```

Updating requires an existing `frontend-assessment/SKILL.md` and replaces that file, including local customizations. Run without `--update` for a fresh installation; overwriting an existing skill requires confirmation. All other files are preserved. If upgrading from the former three-skill installation, old companion directories are left untouched to protect customizations, but they are no longer required or invoked; the installer reports their presence.

## Usage

Once installed, ask your agent:

> Perform a frontend health assessment of this repository.

The default contributor activity and delivery window is **the last three months**. Override the scope or period explicitly:

> Run a frontend assessment for Q3 2025, focusing on the web-app package.

Dependency status and live measurements describe the current state, even when a historical assessment window is selected.

### Optional Live-Site Audits and Performance

Supply a URL in your assessment request:

> Assess this repository with FRONTEND_ASSESSMENT_URL=https://example.com and include live-site performance.

A URL directly in the request or the `FRONTEND_ASSESSMENT_URL` environment variable also works; an explicit request takes precedence. These are assessment inputs, not installer flags.

**Chrome DevTools MCP** supports the browser walkthrough and journey tracing. Lighthouse capabilities are checked separately; some MCP `lighthouse_audit` tools explicitly exclude Performance. The workflow is:

1. Inspect the repository and map the primary user journey.
2. Walk through the journey in the browser and record its routes, safe actions, and expected page states.
3. Run all supported Lighthouse categories **after the walkthrough**. If Performance is unsupported, retain accessibility/SEO/best-practices results and offer a Lighthouse JSON report import or an explicitly authorized standalone Lighthouse run before finalizing its optional score as unavailable.
4. Record the safe journey in a separate trace within the same assessment. Keep the recording running through interactions, then explicitly stop it. A missing Lighthouse score does not prevent tracing, and a missing trace does not invalidate a Lighthouse score.
5. Return one report containing repository findings, test/coverage evidence, Lighthouse results, and journey diagnostics, followed by one verdict synthesizing all available results. Keep measurement sources, dates, settings, pages, and completed/skipped steps explicit. Only a validated Lighthouse Performance category score earns optional assessment points; other audit scores and diagnostics still inform the verdict.

**Authentication and safety:** If the walkthrough or a measurement encounters login or SSO, the agent pauses for you to sign in manually in the browser used for that run and waits for confirmation. A standalone Chrome session does not automatically share MCP authentication. Measurements interrupted by authentication are discarded and rerun after access is restored; login/error-page results are not scored as the target app. Do not send credentials to the agent. Sending messages, uploading files, purchases, and other consequential submissions require explicit authorization; these safety exclusions are reported separately from tool limitations.

**Fallbacks and unavailable data:** When the required Performance category is unsupported, the agent asks once whether you want to provide a Lighthouse JSON report or authorize a standalone run, and waits for your choice. Standalone tooling may require a separately approved temporary download and Chrome session; all caches, profiles, and output must remain outside the assessed project. No project dependencies are installed or changed, and no third-party audit service is used without permission. Imported reports are validated against the intended page and labeled with their original date/settings. If you decline or the fallback is blocked, only the missing score is `N/A` and its optional weight is excluded—not scored zero. Supported audits and traces are still reported independently. Missing individual metrics do not change an available Lighthouse score.

## Assessment Criteria and Scoring

The seven repository criteria total **100 points**:

| Criterion                     | Weight | Summary                                                                                                                 |
| ----------------------------- | -----: | ----------------------------------------------------------------------------------------------------------------------- |
| Dependency freshness          |     20 | Version lag and publication age of frontend dependencies, with an exception for latest packages with no recent releases |
| Core package currency         |     20 | Runtime, framework, router, build, and test-tool versions, accounting for verified compatibility blockers               |
| Contributor activity          |     10 | Unique contributors within the assessment window                                                                        |
| Delivery cadence              |     10 | Commits, merge commits, and releases within the same window                                                             |
| Test suite maturity           |     10 | Unit, integration, component, end-to-end, and visual/Storybook test layers                                              |
| Coverage                      |     10 | Measurable frontend application test coverage, not backend-only coverage                                                |
| UI system & component library |     20 | Consistent component-library, token/theme, and styling adoption, including maintenance and deprecation status           |

UI-system assessment is **usage-first and brand-neutral**: the agent traces components from their imports to production renders/templates, including local wrappers and in-house systems, then verifies consumed styles and shared tokens. Installed packages and unused imports do not establish adoption. No particular styling tool or separate token package is required, and intentionally composed UI layers are not automatically treated as fragmentation. Reports cite inspected surfaces and sampling limitations.

An optional **Lighthouse Performance** criterion adds up to **20 points**:

```text
Lighthouse points = round(20 * lighthouse_performance_score / 100)
Frontend score = round(100 * earned_points / applicable_maximum)
```

The Lighthouse category score is on a 0-100 scale; for example, 90 earns **18/20 points**. It must come from an actual supported audit, an explicitly authorized standalone run, or a validated user-provided Lighthouse report—not a journey trace or other category scores. With all criteria available, the raw maximum is 120; the final score is still normalized to 100. Reports show both the normalized score and raw earned/applicable points.

- Insufficient or unverifiable git history makes both history criteria `N/A` and removes their combined 20-point weight.
- Unverifiable release metadata makes delivery cadence `N/A`, even if commit and merge counts are available.
- No URL or no Lighthouse category score excludes its 20-point weight.
- Apply the rubric's explicit zero-point outcomes, such as no automated tests or no measurable frontend coverage, rather than treating those findings as unavailable evidence.

### Performance Diagnostics

LCP, INP, and CLS are explanatory diagnostics, **not additional assessment points**. Reports list each value, its source, its individual score when the tool provides one, and its threshold rating. They do not reconstruct the Lighthouse category score from these three metrics.

| Metric                          | Good      | Needs improvement      | Poor     |
| ------------------------------- | --------- | ---------------------- | -------- |
| Largest Contentful Paint (LCP)  | <= 2.5 s  | > 2.5 s and <= 4 s     | > 4 s    |
| Interaction to Next Paint (INP) | <= 200 ms | > 200 ms and <= 500 ms | > 500 ms |
| Cumulative Layout Shift (CLS)   | <= 0.1    | > 0.1 and <= 0.25      | > 0.25   |

Lab/trace measurements are distinguished from field data. Field INP is marked `N/A` when representative data is unavailable; a scripted interaction or Total Blocking Time (TBT) is not a substitute. INP is not an input to Lighthouse's navigation Performance score.

The [single assessment skill](./skills/SKILL.md) contains the full rubric, Lighthouse fallback, tracing instructions, and diagnostic thresholds. The verdict considers every available Lighthouse category score and diagnostic finding, but only published scoring criteria affect the numerical score; unrelated scores are not averaged together.

### Project Tests and Coverage

**The assessment never runs project tests or coverage commands of any kind.** It inspects test source/configuration and existing results/coverage artifacts only, without invoking runners, package test scripts, Nx test targets, or local/remote CI. There is no test-execution opt-in. The assessment is stack-, framework-, and tooling-neutral; it does not require a particular test framework or implementation approach.

Use a single prompt:

> Run a complete frontend assessment of this repository with FRONTEND_ASSESSMENT_URL=https://example.com. Include every available Lighthouse category score and journey performance diagnostic, and use all available evidence in one final verdict. Inspect existing test and coverage evidence only; do not run project tests or generate coverage.

Reports distinguish configured test layers from existing recorded results, cite their dates/scope, and disclose unavailable or stale coverage. Non-execution is not treated as failure or an additional scoring penalty. The rubric's existing no-measurable-coverage outcome is unchanged. Lighthouse audits, safe browser walkthroughs, and performance traces remain separate live-site measurements; they do not invoke project test suites.

## Report Contents

Assessments are **read-only and output-only**: the complete report, including diagrams, is returned directly in the agent's response. No project tests are run, no coverage is generated, and there is no generated-artifact exception. Assessment reports, scratch notes such as `history-tests.md`, helper scripts, and browser artifacts are never written into the project. Required browser-tool artifacts must use temporary storage outside the project; otherwise the affected measurement is skipped and disclosed.

- Scope, assessment dates, detected stack, model(s) used, and evidence limitations.
- Normalized frontend score and an evidence-backed scoring table.
- A separate repository context score for age, complexity, and active developers; this does not affect the frontend score.
- UI-system and core-package status tables.
- Configured test layers and existing recorded test/coverage evidence, with explicit non-execution and evidence limitations.
- A Mermaid user-journey diagram with verified API endpoints associated with journey tasks.
- Separate optional Lighthouse audit and journey performance results **after the journey**, including independent statuses, evidence sources, diagnostic metrics, and limitations.
- Ranked pros and cons, followed by a consolidated verdict covering all observed results and highest-leverage improvements—not just the weighted score.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local development, testing, and the release workflow.

## License & Attribution

Licensed under the [MIT License](./LICENSE), copyright 2025 DLN Roozemond.

You may use, modify, and distribute this skill. Attribution to **DLN Roozemond** is required when redistributing it or including it in other packages, as detailed in the license.
