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

Branch: rewrite/wf1-incremental-migration. HEAD: 7f8c36b73. Dirty=1 in every measurement, because changes remain uncommitted as requested. No baseline was rerun. The original measure.sh and independent E2E suite were used unchanged; a tested macOS timeout shim was added to PATH. [Raw CSV](metrics.csv) records timestamps and run IDs. [Full workflow report](workflow-1/REPORT.md) explains all ten modules, repairs, changed files, commands and evidence limitations. [Machine summary](workflow-1/final-measurements.json) links final command records.

The incremental process met each module's declared acceptance before progressing and passed the final measurement matrix. This supports this yardstick's routing and business-flow acceptance, not full production or visual parity: advanced reference interactions remain incomplete, external services are unverified, and no Docker image build was possible without a daemon. Tokens and exact human review time remain NA rather than invented measurements. No final commit or push has been created.
