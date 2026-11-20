# Frontend Assessment Skill

An installable set of AI agent skills for Zed, Claude, and other agent systems that produces an evidence-based **0-100 frontend health and maturity score**. It assesses repository health, maps the primary user journey, and optionally runs separate Lighthouse audits and journey performance traces.

| Skill                  | Responsibility                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `frontend-assessment`  | Repository evidence, user journey, scoring, and the combined report                                         |
| `frontend-lighthouse`  | Lighthouse category audits, validated Performance scores, and report-import/authorized standalone fallbacks |
| `frontend-performance` | Journey traces, LCP/INP/CLS diagnostics, and performance bottlenecks; no synthetic Lighthouse score         |

## Installation

Run the installer and choose a scope:

```bash
npx frontend-assessment-skill
```

- **Global** (`~/.agents/skills/`): all three skills, available across projects.
- **Project** (`.agents/skills/`): all three skills, available only in the current repository.

Each skill is installed in its own named directory containing `SKILL.md`.

Or select the scope with a flag:

```bash
# Install globally
npx frontend-assessment-skill --global

# Install in the current project
npx frontend-assessment-skill --project
```

### Updating

Use `@latest` and `--update` to replace the bundled skills without an overwrite prompt:

```bash
# Update the global installation
npx frontend-assessment-skill@latest --update --global

# Update the current project's installation
npx frontend-assessment-skill@latest --update --project
```

Updating requires an existing `frontend-assessment/SKILL.md` and replaces all three bundled skill files, including local customizations. It adds missing companion skills when upgrading a legacy assessment-only installation and preserves unrelated files. Run without `--update` for a fresh installation; any existing bundled skill file requires overwrite confirmation.

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
3. Invoke `frontend-lighthouse` for the supported audit categories **after the walkthrough**. If Performance is unsupported, retain accessibility/SEO/best-practices results and offer a Lighthouse JSON report import or an explicitly authorized standalone Lighthouse run before finalizing its optional score as unavailable.
4. Independently invoke `frontend-performance` to record the safe journey in a trace. Keep the recording running through interactions, then explicitly stop it. A missing Lighthouse score does not prevent tracing, and a missing trace does not invalidate a Lighthouse score.
5. Report Lighthouse audit results and journey diagnostics in separate sections, including their sources, dates, settings, pages, and completed/skipped steps. Only a validated Lighthouse Performance category score earns optional assessment points.

The companion skills also work independently:

> Use frontend-lighthouse to audit https://example.com.

> Use frontend-performance to trace the main user journey at https://example.com.

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

See the [assessment rubric](./skills/SKILL.md), [Lighthouse workflow](./skills/frontend-lighthouse/SKILL.md), and [performance diagnostic thresholds and workflow](./skills/frontend-performance/SKILL.md) for full instructions. **The assessment does not run the assessed project's test suites or coverage commands**, directly or through package scripts, Nx targets, or CI workflows. It inspects test files, configuration, and existing reports/artifacts without requiring a particular test framework, installing tools, or adding instrumentation. Reports distinguish configured tests from recorded execution results and disclose when coverage is unavailable or stale. The existing no-measurable-coverage scoring rule remains unchanged. Optional browser walkthroughs and Lighthouse measurements are separate from project test execution.

## Report Contents

Assessments are **read-only and output-only**: the complete report, including diagrams, is returned directly in the agent's response. The assessment does not create, modify, or delete files in the assessed project, including reports, scratch notes such as `history-tests.md`, helper scripts, or browser artifacts. Required browser-tool artifacts must use temporary storage outside the project; otherwise the affected measurement is skipped and disclosed.

- Scope, assessment dates, detected stack, model(s) used, and evidence limitations.
- Normalized frontend score and an evidence-backed scoring table.
- A separate repository context score for age, complexity, and active developers; this does not affect the frontend score.
- UI-system and core-package status tables.
- A Mermaid user-journey diagram with verified API endpoints associated with journey tasks.
- Separate optional Lighthouse audit and journey performance results **after the journey**, including independent statuses, evidence sources, diagnostic metrics, and limitations.
- Ranked pros and cons, followed by a verdict and highest-leverage improvements.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local development, testing, and the release workflow.

## License & Attribution

Licensed under the [MIT License](./LICENSE), copyright 2025 DLN Roozemond.

You may use, modify, and distribute this skill. Attribution to **DLN Roozemond** is required when redistributing it or including it in other packages, as detailed in the license.
