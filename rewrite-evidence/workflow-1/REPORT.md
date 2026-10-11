# Workflow 1 — Incremental conversion with test acceptance

Status: declared module and final yardstick acceptance completed. Complete Vue feature/visual parity is not established.
Branch: rewrite/frontend-react-migration; starting and final HEAD: 7f8c36b73; measured dirty=1.
No Vue baseline was rerun, no baseline/module/final commit was created, and nothing was pushed.

## Inspection, boundaries and sequence

The actual checkout is mealie/ below the workspace parent. The requested existing branch was selected before implementation. [PLAN.md](PLAN.md) records the inspection and module acceptance planned before conversion. The Vue reference has 229 Vue files and 49 test files: API/types and pure utilities → composables/auth → domain components/pages → deployment. Generated API schemas and non-English locale resources remain unchanged. React source lives in frontend-react/; the running SPA does not mount Vue or Nuxt. Shared generated types and translation JSON are imported from the retained reference tree.

Migration followed M01–M10 below. Each module ran its own relevant acceptance and preceding regression before the next module; failures and successful retries remain in raw logs. Build includes strict type checking from M02 onward; M01 used a narrow production-utility strict check. The independently supplied E2E tests and measurement script were not modified.

## Module results

Times are UTC; elapsed is recorded module wall time, including reasoning, edits, tests and waits. The gap between the two user sessions is excluded. Source repair counts exclude dependency/environment fixes and test-selection mistakes. Route/flow columns are module-specific; broader regressions are described below.

| Module | Start UTC | End UTC | Seconds | Units passed | Strict routes | Module flows | Source repairs | Tokens | Acceptance |
|---|---|---|---:|---:|---|---|---:|---|---|
| [M01](modules/M01/result.json) Pure utilities | 2026-10-09T21:01:48Z | 2026-10-09T21:02:39Z | 51.0 | 12 | — | — | 0 | NA | pass |
| [M02](modules/M02/result.json) React foundation | 2026-10-09T21:03:26Z | 2026-10-09T21:05:53Z | 147.0 | 15 | — | — | 1 | NA | pass |
| [M03](modules/M03/result.json) HTTP/auth/session | 2026-10-10T06:15:59.819Z | 2026-10-10T06:21:08.029Z | 308.2 | 40 | 4/4 | 5/5 | 0 | NA | pass |
| [M04](modules/M04/result.json) Recipes | 2026-10-10T06:21:08.060Z | 2026-10-10T06:24:42.672Z | 214.6 | 43 | 14/14 | 4/4 | 0 | NA | pass |
| [M05](modules/M05/result.json) Organizers/cookbooks/finder | 2026-10-10T06:24:42.713Z | 2026-10-10T06:28:39.059Z | 236.3 | 43 | 8/8 | 1/1 | 0 | NA | pass |
| [M06](modules/M06/result.json) Meal planner | 2026-10-10T06:28:39.096Z | 2026-10-10T06:30:07.482Z | 88.4 | 46 | 4/4 | 1/1 | 0 | NA | pass |
| [M07](modules/M07/result.json) Shopping lists | 2026-10-10T06:30:07.523Z | 2026-10-10T06:32:35.804Z | 148.3 | 46 | 2/2 | 2/2 | 2 | NA | pass |
| [M08](modules/M08/result.json) Profile/tokens | 2026-10-10T06:32:35.848Z | 2026-10-10T06:36:05.406Z | 209.6 | 46 | 4/4 | 1/1 | 0 | NA | pass |
| [M09](modules/M09/result.json) Group/household/admin/data | 2026-10-10T06:36:05.450Z | 2026-10-10T06:38:02.504Z | 117.1 | 46 | 32/32 | 1/1 | 0 | NA | pass |
| [M10](modules/M10/result.json) Integration/locales/regression | 2026-10-10T06:38:02.545Z | 2026-10-10T06:44:41.990Z | 399.4 | 48 | 66/66 | 15/15 | 4 | NA | pass |

Recorded module windows total 32.00 minutes; final measurement command windows total 162 seconds. These are not exact billable model compute time. Human review/fix time is unknown. Observed human code interventions: 0; the continuation message is not a code fix. Total source repair cycles: 7. Environment fixes and selector corrections are recorded separately.

### M01 — Pure utilities

Copied portable API URL construction, finder limits and text truncation with existing assertions. Initial Vite cache write failed; moved cache into the app-local ignored dependency directory and reran successfully. No source repair.

[Prompt](modules/M01/prompt.md), [result and changed files](modules/M01/result.json), [raw outputs](modules/M01/).

### M02 — React foundation

Introduced Vite, React 19, strict TypeScript, Router SPA, MUI and i18next providers. Replaced top-level await with async bootstrap after the production build rejected it. Dependency installation required network access, explicit esbuild permission and disabling automatic dependency verification before each script.

[Prompt](modules/M02/prompt.md), [result and changed files](modules/M02/result.json), [raw outputs](modules/M02/).

### M03 — HTTP/auth/session

Replaced Vue composables with a typed fetch client, refresh deduplication, guarded routing and React authentication context. Ported token/redirect assertions and added HTTP tests. Real seeded backend authentication flows passed. External OIDC and SMTP were not exercised. Immediate cross-tab logout was added in M10.

[Prompt](modules/M03/prompt.md), [result and changed files](modules/M03/result.json), [raw outputs](modules/M03/).

### M04 — Recipes

Implemented recipe search/detail, edit/delete, comments/favorites/sharing and create/import API forms, including streamed import parsing. Ran recipe routes, recipe flows and prior authentication flows. An initial grep selected routes only; ran flows explicitly before acceptance. Markdown presentation is simplified.

[Prompt](modules/M04/prompt.md), [result and changed files](modules/M04/result.json), [raw outputs](modules/M04/).

### M05 — Organizers/cookbooks/finder

Implemented shared backend CRUD tables and organizer, cookbook, finder and timeline views. The first broad test selector included a future M09 route and failed; retained its output, corrected selection and reran module routes plus earlier flows. This was a selection repair, not a source repair.

[Prompt](modules/M05/prompt.md), [result and changed files](modules/M05/result.json), [raw outputs](modules/M05/).

### M06 — Meal planner

Implemented seven-day meal planning, notes/recipe entries, random selection and rules. Added leap-day/year-boundary date tests. Module routes, mealplan flow and all prior flows passed. Drag-and-drop parity is outside this implementation.

[Prompt](modules/M06/prompt.md), [result and changed files](modules/M06/result.json), [raw outputs](modules/M06/).

### M07 — Shopping lists

Implemented list CRUD and item add/check/delete plus recipe ingredient import. Fixed optional listItems strict errors, then fixed a controlled checkbox that reverted before asynchronous persistence completed using immediate state with rollback. Browser reload verified persistence; all prior flows passed.

[Prompt](modules/M07/prompt.md), [result and changed files](modules/M07/result.json), [raw outputs](modules/M07/).

### M08 — Profile/tokens

Implemented profile edits, password/API-token operations and favorites. Full core regression passed: 34 strict routes, 14 flows and the route-table invariant. Existing E2E does not exercise every token/password operation.

[Prompt](modules/M08/prompt.md), [result and changed files](modules/M08/result.json), [raw outputs](modules/M08/).

### M09 — Group/household/admin/data

Implemented group/household settings, membership/integration forms, dataset CRUD, bulk recipe tools, migration/report, backup/maintenance and admin tools. All 32 extended routes and then all 66 strict routes plus 15 flows passed. Route acceptance is not exhaustive validation of every administrative mutation.

[Prompt](modules/M09/prompt.md), [result and changed files](modules/M09/result.json), [raw outputs](modules/M09/).

### M10 — Integration/locales/regression

Switched task, CI, package and Docker build inputs to React; audited admin setup and session/logout edges. Added lazy locale loading, persisted language/direction and locale tests; formatted React source. Four repair cycles corrected locale import/name shadowing, accidental useContext renaming, English locale inclusion and navigation JSX syntax. Final units/lint/strict/build and all 82 browser checks passed. Task binary and Docker daemon were unavailable: YAML parsed and equivalent package scripts passed, but a Docker image build and hosted CI execution remain unverified.

[Prompt](modules/M10/prompt.md), [result and changed files](modules/M10/result.json), [raw outputs](modules/M10/).

## Final measurement matrix

All four original measure.sh runs were serial, against freshly built frontend-react/dist and an isolated real backend database. Each run installs locked dependencies, builds, runs units, lint and strict types, counts source markers, then runs browser acceptance. Smoke and strict use the unchanged yardstick's own definitions. No browser retries are configured. Each row also passes the route-table invariant in addition to the listed routes and flows.

| Scope/check | Routes | Flows | Units pass/fail/skip | Type errors | Lint errors/warnings | Build seconds | Total seconds | Evidence |
|---|---:|---:|---|---:|---|---:|---:|---|
| core smoke | 34/34 | 15/15 | 48/0/0 | 0 | 0/0 | 5 | 42 | [raw](../runs/20261010T064710Z-frontend-react-WF1-final-core-smoke/) |
| core strict | 34/34 | 15/15 | 48/0/0 | 0 | 0/0 | 6 | 41 | [raw](../runs/20261010T064805Z-frontend-react-WF1-final-core-strict/) |
| extended smoke | 32/32 | 15/15 | 48/0/0 | 0 | 0/0 | 5 | 40 | [raw](../runs/20261010T065033Z-frontend-react-WF1-final-extended-smoke/) |
| extended strict | 32/32 | 15/15 | 48/0/0 | 0 | 0/0 | 5 | 39 | [raw](../runs/20261010T065126Z-frontend-react-WF1-final-extended-strict/) |

All builds pass. All four runs report any_count=0, todo_count=0, expect_count=74 and test_files=10. These textual counts are not measures of functional completeness. Full all-scope strict integration regression also passed 82 checks (66 routes + 15 flows + invariant) before measurement. Raw JSON reports are gzip-compressed alongside stdout/stderr under ../runs/. [CSV](../metrics.csv), [machine summary](final-measurements.json), and [metrics report](../METRICS_TEMPLATE.md) contain the recorded results.

Reproduction from the repository root (same accepted code and locked dependencies):

```sh
PATH="$PWD/rewrite-evidence/workflow-1/bin:$PATH" bash rewrite-evidence/measure.sh --app frontend-react --label WF1-final-core-smoke --route-scope core --route-check smoke
PATH="$PWD/rewrite-evidence/workflow-1/bin:$PATH" bash rewrite-evidence/measure.sh --app frontend-react --label WF1-final-core-strict --route-scope core --route-check strict
PATH="$PWD/rewrite-evidence/workflow-1/bin:$PATH" bash rewrite-evidence/measure.sh --app frontend-react --label WF1-final-extended-smoke --route-scope extended --route-check smoke
PATH="$PWD/rewrite-evidence/workflow-1/bin:$PATH" bash rewrite-evidence/measure.sh --app frontend-react --label WF1-final-extended-strict --route-scope extended --route-check strict
```

macOS has no system timeout command here. The local timeout shim implements the seconds/command subset used by the original script; a timeout exit-124 check passed. It is supplied only through PATH; the measurement script and tests are unchanged.

## Changed content and evidence

The final implementation is frontend-react/ (toolchain/lockfile, providers, typed client, domain pages/components, utilities and 10 test files). Taskfile.yml, docker/Dockerfile and the build-package, release and test-frontend workflows select React. Per-module result.json lists changed files; M03 onward steps.jsonl records exact command arrays, workdirs, start/end times, exit codes and raw output locations. M10 also includes integration paths outside frontend-react. React file lists were captured by modification time at module close; formatting contributes entries and these lists are not Git snapshots of each incremental diff.

[Original human prompt](prompts/user-001.md), [continuation](prompts/user-002.md), [session 1](session-logs/session-001.md), [session 2](session-logs/session-002.md). Derived module prompts preserve the scope and acceptance. Test steps refer to their module prompt and exact command; editing stages are bounded by module timestamps rather than individually sampled tool-call timestamps. Failed attempts are retained, including M05's premature M09 route and M07/M10 repair cycles. Source Vue tests were neither removed nor edited; no failing assertion was removed to obtain acceptance.

## Limits and interpretation

- Passing these routes and fifteen flows demonstrates the declared incremental acceptance scope, not complete Mealie feature or pixel parity. The MUI interface is simplified. Rich Markdown/editor behavior, advanced ingredient linking/substitution, image crop/edit, drag-and-drop planning, wake-lock, PWA and offline behavior are not fully recreated. External OIDC, SMTP and scraper/AI services and every administrative mutation are not comprehensively exercised.
- Existing locale resources load lazily, with persisted locale/direction and English fallback. Some new labels remain English; Vue plural/link formatting semantics have not been comprehensively reproduced. The production bundle still emits Vite's large main-chunk warning (about 751 kB uncompressed); performance parity has not been measured.
- Docker configuration and CI/task YAML were updated and parsed, and direct package equivalents passed. Docker daemon and Task executable were unavailable; no image build, container runtime test or hosted CI run is claimed.
- React has 48 tests in 10 files with 74 textual expect calls. The retained Vue tree has 49 test files. Selective portable assertions and new behavior tests were migrated; equivalent coverage for all Vue-specific unit suites is not established. Coverage percentage was not measured.
- Token usage is NA at every module/command because platform telemetry is unavailable; no estimates are presented as counts. Session logs are action records, not verbatim platform exports. Initial inspection and M01/M02 individual-command timestamps were not fully captured; M01 end time was reconstructed from test output. Exact per-edit file deltas and human review time are unavailable. These gaps prevent a fully instrumented token/time study, despite preserved executable test evidence.
- No baseline comparison or migration-strategy superiority claim can be derived from these runs. The results support acceptance for this branch against this yardstick. Full production replacement still requires review of the documented remaining behavior and deployment checks.
