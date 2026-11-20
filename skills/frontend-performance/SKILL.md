---
name: frontend-performance
description: Measure frontend performance with Chrome DevTools journey traces and report LCP, INP, CLS, and bottlenecks. Use for Core Web Vitals diagnostics, interaction performance, or the diagnostic part of a frontend assessment. Does not generate a Lighthouse category score.
---

# Frontend Performance

Record and analyze a verified user journey, keeping page-load and interaction diagnostics separate from Lighthouse audits. Run independently or supply diagnostics to `frontend-assessment`. Use `frontend-lighthouse` for actual Lighthouse category scores; trace measurements never substitute for that score.

## Inputs and Safety

$ARGUMENTS

- Accept a target URL, an ordered replay plan (routes, safe actions, expected states), device/settings, and any existing Lighthouse/field evidence. Reuse the parent assessment's verified journey rather than inventing another. When invoked independently, ask for a missing URL and inspect the app/source to prepare and walk through a representative journey before recording.
- Keep the assessed project read-only and return findings inline. Do not create reports, notes, screenshots, traces, or scripts in the project. Omit optional file-output arguments; required artifacts must use tool-managed temporary storage outside the project. If that is impossible, skip the affected measurement and disclose why.
- Do not install tools, add instrumentation, run project tests or coverage, or start project services. If Chrome DevTools MCP or trace capabilities are unavailable, explain the limitation and report existing evidence with its provenance instead of substituting an unapproved browser/tool.
- For authentication challenges, ask the user to sign in manually in the MCP-controlled browser and wait for confirmation. Verify the intended page in that same session. Never request credentials or bypass access controls. Discard affected measurements if they redirect to authentication and rerun only after access is restored.
- Do not send messages, upload files, make purchases, mutate shared data, or perform other consequential submissions without explicit authorization. Record skipped steps and reasons; do not treat these safety exclusions as measurement-tool failures. If all interactions are blocked, report the safe navigation scope rather than claiming the whole journey was measured.

## Journey Trace

1. Inspect available tools and verify trace support independently of Lighthouse support. Missing Lighthouse Performance does not prevent tracing, and a successful Lighthouse audit does not prove a trace was recorded.
2. Walk through the verified safe steps, record the ordered replay plan and expected page states, and return to the entry point. Preserve authentication storage/cookies.
3. For an interaction-spanning Chrome DevTools trace, call `performance_start_trace` with `reload: false` and `autoStop: false` when these options are exposed. A default auto-stopping navigation trace may end before interactions. Start the recording before the navigation whose load metrics are needed, then navigate to the entry URL and replay the safe actions in order. Keep the trace running through them and explicitly call `performance_stop_trace` when finished, including when a replay step fails. Do not silently use a load-only trace as a journey trace.
4. Record completed/skipped/blocked steps and actual URLs. Capture measurement date, tool/browser versions where available, device/viewport, CPU/network throttling, and cache settings. Use consistent settings for comparable runs and disclose deviations.
5. Inspect tool-provided performance insights and associate bottlenecks with the relevant navigation or interaction. Keep each page/navigation's measurements distinct in multi-page traces; do not combine unrelated pages into synthetic LCP, INP, or CLS values. If a metric is not exposed, report `N/A` rather than infer it from unrelated timings.

## Metric Breakdown (Diagnostic Only)

| Metric | Good | Needs improvement | Poor |
| ------ | ---- | ----------------- | ---- |
| LCP | <= 2.5 s | > 2.5 s and <= 4 s | > 4 s |
| INP | <= 200 ms | > 200 ms and <= 500 ms | > 500 ms |
| CLS | <= 0.1 | > 0.1 and <= 0.25 | > 0.25 |

- Report values with units and sources; CLS is unitless. Keep lab/trace results separate from representative field data.
- Rate field INP only from representative field data (typically the 75th percentile across visits). A lab interaction latency or trace-reported INP candidate is a diagnostic, not representative field INP. Mark unavailable field INP `N/A` and put available lab interaction timings in separately labeled rows. Never substitute Total Blocking Time (TBT) for INP.
- List individual metric scores only when the source provides them. Convert tool-provided 0-1 metric scores to 0-100 and label the scale. Otherwise give a threshold rating where applicable, not an invented numeric score.
- Lighthouse navigation Performance does not use INP. LCP/INP/CLS alone do not reconstruct its category score. These diagnostics add no assessment points, and their absence does not remove a valid Lighthouse score or weight.
- Existing Lighthouse metric evidence may supplement the trace: label its audited page, date, settings, and source rather than presenting it as trace output. An unavailable trace must not suppress valid Lighthouse findings.

## Required Output

Return the following inline, or provide it to the parent assessment:

1. Trace status and scope, settings, source, actual pages, and the completed/skipped replay steps with reasons. Distinguish tool failures, authentication blocks, and intentional safety exclusions.
2. A diagnostic table, with separate rows/pages where necessary:

| Metric | Value and units | Individual score (0-100) | Threshold rating | Source / Page / Limitations |
| ------ | --------------- | -----------------------: | ---------------- | --------------------------- |
| LCP | ... | ... | ... | ... |
| INP (field) | ... | ... | ... | ... |
| CLS | ... | ... | ... | ... |

3. Separately labeled lab interaction diagnostics when captured; do not fill the field INP row with lab values.
4. Evidence-backed bottlenecks and prioritized recommendations tied to the measured pages/actions. Do not claim code fixes or measured improvements unless they were separately requested and verified.

Do not invent a Lighthouse Performance score or change the frontend assessment's rubric or denominator. This skill can complete even when `frontend-lighthouse` has no Performance category score.
