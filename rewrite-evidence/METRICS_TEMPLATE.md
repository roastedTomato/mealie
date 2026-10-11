# Workflow metrics — measured results

## Summary

| Workflow | Checkpoint | Tool | Model | Human prompts | Recorded module time | Measurement time | Review/fix time | Tokens | Build | Core smoke | Core strict | Extended smoke | Extended strict | Flows | Unit pass/fail/skip | Type errors | Human code interventions | Result |
|---|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---:|---:|---|
| WF1 Incremental conversion with test acceptance | End | Codex | GPT-6 (exact deployment unavailable) | 2 | 32.00 min | 162 s | NA | NA | pass, all 4 runs | 34/34 | 34/34 | 32/32 | 32/32 | 15/15 each run | 48/0/0 each run | 0 | 0 observed | accept within declared yardstick; feature parity partial |

Two human messages comprise the original request and continuation; ten derived module prompts are separately preserved. Recorded time sums module windows, excluding the inter-session gap; it is not exact model compute time. Seven source repair cycles were performed by the agent, with environment/selection fixes recorded separately. Human review time and actual token usage are unavailable.

## Final measurements

| Scope/check | Routes | Flows | Units pass/fail/skip | Type errors | Lint errors/warnings | Build seconds | Total seconds | Evidence |
|---|---:|---:|---|---:|---|---:|---:|---|
| core smoke | 34/34 | 15/15 | 48/0/0 | 0 | 0/0 | 5 | 42 | [raw](runs/20261010T064710Z-frontend-react-WF1-final-core-smoke/) |
| core strict | 34/34 | 15/15 | 48/0/0 | 0 | 0/0 | 6 | 41 | [raw](runs/20261010T064805Z-frontend-react-WF1-final-core-strict/) |
| extended smoke | 32/32 | 15/15 | 48/0/0 | 0 | 0/0 | 5 | 40 | [raw](runs/20261010T065033Z-frontend-react-WF1-final-extended-smoke/) |
| extended strict | 32/32 | 15/15 | 48/0/0 | 0 | 0/0 | 5 | 39 | [raw](runs/20261010T065126Z-frontend-react-WF1-final-extended-strict/) |

All four builds pass, with 0 explicit any markers, 0 TODO markers, 74 textual expect calls and 10 React test files. The separate complete strict browser regression passed 82 checks. The source Vue tree and its 49 test files remain unchanged; complete equivalent unit coverage is not established.

Branch: rewrite/frontend-react-migration. HEAD: 7f8c36b73. Dirty=1 in every measurement, because changes remain uncommitted as requested. No baseline was rerun. The original measure.sh and independent E2E suite were used unchanged; a tested macOS timeout shim was added to PATH. [Raw CSV](metrics.csv) records timestamps and run IDs. [Full workflow report](workflow-1/REPORT.md) explains all ten modules, repairs, changed files, commands and evidence limitations. [Machine summary](workflow-1/final-measurements.json) links final command records.

The incremental process met each module's declared acceptance before progressing and passed the final measurement matrix. This supports this yardstick's routing and business-flow acceptance, not full production or visual parity: advanced reference interactions remain incomplete, external services are unverified, and no Docker image build was possible without a daemon. Tokens and exact human review time remain NA rather than invented measurements. No final commit was created during the measured WF1 experiment.

## WF2 — Parallel migration with multiple agents

| Field | Measured result |
|---|---|
| Branch / base | `rewrite/wf2-parallel-migration` / `7f8c36b73`; uncommitted final source pinned by hash + patch |
| Tool / model | Codex / gpt-6.1-sol (local turn metadata) |
| Workflow wall time to final acceptance | 19.05 min; from WF2 completion authorization; migration experiment only |
| Implementation wall time after completion authorization | 19.05 min |
| All-agent cumulative active task time | 32.87 min; includes overlapping worker/tool/test time, excludes idle gaps |
| Final measurement time | 149 s (included above) |
| Parallel completed modules | 2; main + 2 workers in independent worktrees |
| Human prompts / worker prompts | 2 specification/execution messages; 2 initial worker + 1 follow-up; coordination events separately logged |
| Human code interventions / approval interventions | 0 / 0 |
| Integration fix cycles | 2: source/test type fix 1; validation sequencing fix 1 |
| Merge / runtime route conflicts | 0 / 0; one potential route ownership overlap resolved before integration |
| Input / cached input subset / output tokens | 17,352,443 / 17,088,000 / 76,139 |
| Total tokens (input + output, includes repeated cached context) | 17,428,582 |
| Uncached input + output (separate explanatory measure) | 340,582 |
| Token measurement cutoff | 2026-10-11T02:11:00.985780+00:00; later report/final reply tokens excluded; per-agent checkpoints in telemetry |
| Full strict integration | 82/82 (66 routes + 15 flows + invariant) |
| Every final run | build pass; units 20/0/0; type errors 0; lint 0/0; any/todo 0/0 |
| Test pass rate | 100% per final route/flow/unit suite; not code coverage |
| Acceptance | selected migration yardstick accepted; feature parity partial; Docker/hosted CI not exercised |
| Evidence | [WF2 report](workflow-2/REPORT.md), [machine results](workflow-2/final/measurements.json), [telemetry](workflow-2/final/telemetry.json) |

| Scope / check | Routes | Flows | Unit pass/fail/skip | Type errors | Lint errors/warnings | Build seconds | Run seconds | Evidence |
|---|---:|---:|---|---:|---|---:|---:|---|
| core smoke | 34/34 | 15/15 | 20/0/0 | 0 | 0/0 | 3 | 37 | [raw](runs/20261011T020427Z-frontend-react-WF2-final-core-smoke/) |
| core strict | 34/34 | 15/15 | 20/0/0 | 0 | 0/0 | 3 | 38 | [raw](runs/20261011T020555Z-frontend-react-WF2-final-core-strict/) |
| extended smoke | 32/32 | 15/15 | 20/0/0 | 0 | 0/0 | 3 | 37 | [raw](runs/20261011T020701Z-frontend-react-WF2-final-extended-smoke/) |
| extended strict | 32/32 | 15/15 | 20/0/0 | 0 | 0/0 | 3 | 37 | [raw](runs/20261011T020759Z-frontend-react-WF2-final-extended-strict/) |


### Comparison with WF1

| Measure | WF1 incremental | WF2 parallel |
|---|---|---|
| User wall time to acceptance | NA in comparable form | 19.05 min |
| Implementation wall time | NA in comparable form | 19.05 min |
| Recorded work time | 32.00 min module windows, single agent | 32.87 min active turns summed over three agents; different instrumentation |
| Final measurement time | 162 s | 149 s |
| Token usage | NA | 17,428,582 incl cached input; 340,582 uncached input + output |
| Parallel worker modules | 0 | 2 |
| Core smoke / strict | 34/34 / 34/34 | 34/34 / 34/34 |
| Extended smoke / strict | 32/32 / 32/32 | 32/32 / 32/32 |
| Flows per measurement | 15/15 | 15/15 |
| Units per measurement | 48/0/0 | 20/0/0 |
| Type errors | 0 | 0 |
| Integration fixes | not separately instrumented; 7 source repair cycles in WF1 report | 2 cycles as defined above |
| Merge conflicts | sequential workflow, no parallel merge | 0 actual |
| Human code interventions | 0 observed | 0 |

WF1 and WF2 have different unit counts and timing/token instrumentation. Passing both yardsticks does not prove equal coverage, full feature parity, or workflow superiority. WF2 reuses only dependency lock/cache and comparison evidence. No baseline rerun or baseline commit.
