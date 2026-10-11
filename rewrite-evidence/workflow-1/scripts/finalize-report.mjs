import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../../..');
const evidence = path.join(root, 'rewrite-evidence');
const workflow = path.join(evidence, 'workflow-1');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const modules = Array.from({ length: 10 }, (_, i) => {
  const id = `M${String(i + 1).padStart(2, '0')}`;
  return read(path.join(workflow, 'modules', id, 'result.json'));
});
const m10 = modules[9];
// Module acceptance precedes the measurement matrix; command evidence remains separate.
m10.ended_at_utc = '2026-10-10T06:44:41.990Z';
m10.acceptance_recorded_at_utc = '2026-10-10T06:47:33.207Z';
m10.changed_files = [...new Set([...m10.changed_files,
  '.github/workflows/build-package.yml', '.github/workflows/release.yml',
  '.github/workflows/test-frontend.yml', 'Taskfile.yml', 'docker/Dockerfile'])];
m10.changed_files_method = 'React file modification times within module; integration files explicitly added. Includes formatting edits; not a per-edit diff snapshot.';
fs.writeFileSync(path.join(workflow, 'modules/M10/result.json'), JSON.stringify(m10, null, 2) + '\n');

// measure.sh emits no quoted fields in these successful rows. Reject unsupported CSV rather than misparse.
const lines = fs.readFileSync(path.join(evidence, 'metrics.csv'), 'utf8').trim().split('\n');
const keys = lines.shift().split(',');
const rows = lines.filter(line => line.includes('WF1-final-')).map(line => {
  if (line.includes('"')) throw new Error('Quoted CSV needs a full CSV parser');
  return Object.fromEntries(line.split(',').map((value, i) => [keys[i], value.trim()]));
});
if (rows.length !== 4) throw new Error(`Expected four measurements, got ${rows.length}`);
for (const row of rows) {
  if (row.build_ok !== '1' || row.unit_passed !== '48' || row.unit_failed !== '0' ||
      row.unit_skipped !== '0' || row.tsc_errors !== '0' || row.lint_errors !== '0' ||
      row.lint_warnings !== '0' || row.routes_passed !== row.routes_total ||
      row.flows_passed !== '15' || row.flows_total !== '15' || row.notes) {
    throw new Error(`Measurement not accepted: ${JSON.stringify(row)}`);
  }
}
const names = ['Pure utilities', 'React foundation', 'HTTP/auth/session', 'Recipes',
  'Organizers/cookbooks/finder', 'Meal planner', 'Shopping lists', 'Profile/tokens',
  'Group/household/admin/data', 'Integration/locales/regression'];
const descriptions = [
  'Copied portable API URL construction, finder limits and text truncation with existing assertions. Initial Vite cache write failed; moved cache into the app-local ignored dependency directory and reran successfully. No source repair.',
  'Introduced Vite, React 19, strict TypeScript, Router SPA, MUI and i18next providers. Replaced top-level await with async bootstrap after the production build rejected it. Dependency installation required network access, explicit esbuild permission and disabling automatic dependency verification before each script.',
  'Replaced Vue composables with a typed fetch client, refresh deduplication, guarded routing and React authentication context. Ported token/redirect assertions and added HTTP tests. Real seeded backend authentication flows passed. External OIDC and SMTP were not exercised. Immediate cross-tab logout was added in M10.',
  'Implemented recipe search/detail, edit/delete, comments/favorites/sharing and create/import API forms, including streamed import parsing. Ran recipe routes, recipe flows and prior authentication flows. An initial grep selected routes only; ran flows explicitly before acceptance. Markdown presentation is simplified.',
  'Implemented shared backend CRUD tables and organizer, cookbook, finder and timeline views. The first broad test selector included a future M09 route and failed; retained its output, corrected selection and reran module routes plus earlier flows. This was a selection repair, not a source repair.',
  'Implemented seven-day meal planning, notes/recipe entries, random selection and rules. Added leap-day/year-boundary date tests. Module routes, mealplan flow and all prior flows passed. Drag-and-drop parity is outside this implementation.',
  'Implemented list CRUD and item add/check/delete plus recipe ingredient import. Fixed optional listItems strict errors, then fixed a controlled checkbox that reverted before asynchronous persistence completed using immediate state with rollback. Browser reload verified persistence; all prior flows passed.',
  'Implemented profile edits, password/API-token operations and favorites. Full core regression passed: 34 strict routes, 14 flows and the route-table invariant. Existing E2E does not exercise every token/password operation.',
  'Implemented group/household settings, membership/integration forms, dataset CRUD, bulk recipe tools, migration/report, backup/maintenance and admin tools. All 32 extended routes and then all 66 strict routes plus 15 flows passed. Route acceptance is not exhaustive validation of every administrative mutation.',
  'Switched task, CI, package and Docker build inputs to React; audited admin setup and session/logout edges. Added lazy locale loading, persisted language/direction and locale tests; formatted React source. Four repair cycles corrected locale import/name shadowing, accidental useContext renaming, English locale inclusion and navigation JSX syntax. Final units/lint/strict/build and all 82 browser checks passed. Task binary and Docker daemon were unavailable: YAML parsed and equivalent package scripts passed, but a Docker image build and hosted CI execution remain unverified.'
];
const seconds = modules.reduce((sum, m) => sum + (Date.parse(m.ended_at_utc) - Date.parse(m.started_at_utc)) / 1000, 0);
const minutes = (seconds / 60).toFixed(2);
const measuredSeconds = rows.reduce((sum, row) => sum + Number(row.duration_seconds), 0);
const moduleTable = modules.map((m, i) => `| [${m.module}](modules/${m.module}/result.json) ${names[i]} | ${m.started_at_utc} | ${m.ended_at_utc} | ${((Date.parse(m.ended_at_utc)-Date.parse(m.started_at_utc))/1000).toFixed(1)} | ${m.unit_passed} | ${m.browser_strict_routes ?? '—'} | ${m.browser_flows ?? '—'} | ${m.source_repair_count ?? (i === 0 ? 0 : m.repair_count)} | NA | pass |`).join('\n');
const matrix = rows.map(r => `| ${r.route_scope} ${r.route_check} | ${r.routes_passed}/${r.routes_total} | ${r.flows_passed}/${r.flows_total} | ${r.unit_passed}/0/0 | ${r.tsc_errors} | ${r.lint_errors}/${r.lint_warnings} | ${r.build_seconds} | ${r.duration_seconds} | [raw](../runs/${r.run_id}/) |`).join('\n');
const commands = rows.map(r => `PATH="$PWD/rewrite-evidence/workflow-1/bin:$PATH" bash rewrite-evidence/measure.sh --app frontend-react --label ${r.label} --route-scope ${r.route_scope} --route-check ${r.route_check}`).join('\n');
const finished = new Date().toISOString();
fs.writeFileSync(path.join(workflow, 'final-measurements.json'), JSON.stringify({
  workflow: 'WF1', status: 'accepted-with-documented-scope', recorded_at_utc: finished,
  modules_elapsed_seconds: seconds, measurement_elapsed_seconds: measuredSeconds,
  tokens: null, token_status: 'NA: platform token telemetry not exposed', rows,
  command_records: fs.readFileSync(path.join(workflow, 'modules/M10/steps.jsonl'), 'utf8').trim().split('\n').map(JSON.parse).filter(s => s.step.startsWith('measure-'))
}, null, 2) + '\n');
fs.writeFileSync(path.join(workflow, 'REPORT.md'), `# Workflow 1 — Incremental conversion with test acceptance

Status: declared module and final yardstick acceptance completed. Complete Vue feature/visual parity is not established.
Branch: rewrite/wf1-incremental-migration; starting and final HEAD: 7f8c36b73; measured dirty=1.
No Vue baseline was rerun, no baseline/module/final commit was created, and nothing was pushed.

## Inspection, boundaries and sequence

The actual checkout is mealie/ below the workspace parent. The requested existing branch was selected before implementation. [PLAN.md](PLAN.md) records the inspection and module acceptance planned before conversion. The Vue reference has 229 Vue files and 49 test files: API/types and pure utilities → composables/auth → domain components/pages → deployment. Generated API schemas and non-English locale resources remain unchanged. React source lives in frontend-react/; the running SPA does not mount Vue or Nuxt. Shared generated types and translation JSON are imported from the retained reference tree.

Migration followed M01–M10 below. Each module ran its own relevant acceptance and preceding regression before the next module; failures and successful retries remain in raw logs. Build includes strict type checking from M02 onward; M01 used a narrow production-utility strict check. The independently supplied E2E tests and measurement script were not modified.

## Module results

Times are UTC; elapsed is recorded module wall time, including reasoning, edits, tests and waits. The gap between the two user sessions is excluded. Source repair counts exclude dependency/environment fixes and test-selection mistakes. Route/flow columns are module-specific; broader regressions are described below.

| Module | Start UTC | End UTC | Seconds | Units passed | Strict routes | Module flows | Source repairs | Tokens | Acceptance |
|---|---|---|---:|---:|---|---|---:|---|---|
${moduleTable}

Recorded module windows total ${minutes} minutes; final measurement command windows total ${measuredSeconds} seconds. These are not exact billable model compute time. Human review/fix time is unknown. Observed human code interventions: 0; the continuation message is not a code fix. Total source repair cycles: 7. Environment fixes and selector corrections are recorded separately.

${modules.map((m, i) => `### ${m.module} — ${names[i]}\n\n${descriptions[i]}\n\n[Prompt](modules/${m.module}/prompt.md), [result and changed files](modules/${m.module}/result.json), [raw outputs](modules/${m.module}/).`).join('\n\n')}

## Final measurement matrix

All four original measure.sh runs were serial, against freshly built frontend-react/dist and an isolated real backend database. Each run installs locked dependencies, builds, runs units, lint and strict types, counts source markers, then runs browser acceptance. Smoke and strict use the unchanged yardstick's own definitions. No browser retries are configured. Each row also passes the route-table invariant in addition to the listed routes and flows.

| Scope/check | Routes | Flows | Units pass/fail/skip | Type errors | Lint errors/warnings | Build seconds | Total seconds | Evidence |
|---|---:|---:|---|---:|---|---:|---:|---|
${matrix}

All builds pass. All four runs report any_count=0, todo_count=0, expect_count=74 and test_files=10. These textual counts are not measures of functional completeness. Full all-scope strict integration regression also passed 82 checks (66 routes + 15 flows + invariant) before measurement. Raw JSON reports are gzip-compressed alongside stdout/stderr under ../runs/. [CSV](../metrics.csv), [machine summary](final-measurements.json), and [metrics report](../METRICS_TEMPLATE.md) contain the recorded results.

Reproduction from the repository root (same accepted code and locked dependencies):

\`\`\`sh
${commands}
\`\`\`

macOS has no system timeout command here. The local timeout shim implements the seconds/command subset used by the original script; a timeout exit-124 check passed. It is supplied only through PATH; the measurement script and tests are unchanged.

## Changed content and evidence

The final implementation is frontend-react/ (toolchain/lockfile, providers, typed client, domain pages/components, utilities and 10 test files). Taskfile.yml, docker/Dockerfile and the build-package, release and test-frontend workflows select React. Per-module result.json lists changed files; M03 onward steps.jsonl records exact command arrays, workdirs, start/end times, exit codes and raw output locations. M10 also includes integration paths outside frontend-react. React file lists were captured by modification time at module close; formatting contributes entries and these lists are not Git snapshots of each incremental diff.

[Original human prompt](prompts/user-001.md), [continuation](prompts/user-002.md), [session 1](session-logs/session-001.md), [session 2](session-logs/session-002.md). Derived module prompts preserve the scope and acceptance. Test steps refer to their module prompt and exact command; editing stages are bounded by module timestamps rather than individually sampled tool-call timestamps. Failed attempts are retained, including M05's premature M09 route and M07/M10 repair cycles. Source Vue tests were neither removed nor edited; no failing assertion was removed to obtain acceptance.

## Branch label normalization

After the WF1 branch rename, branch labels in prompts, logs, reports, CSV and JSON evidence were normalized to \`rewrite/wf1-incremental-migration\`. These labels are a documentation update to historical output; no tests were rerun and no measurement values, timestamps or commit IDs were changed.

## Limits and interpretation

- Passing these routes and fifteen flows demonstrates the declared incremental acceptance scope, not complete Mealie feature or pixel parity. The MUI interface is simplified. Rich Markdown/editor behavior, advanced ingredient linking/substitution, image crop/edit, drag-and-drop planning, wake-lock, PWA and offline behavior are not fully recreated. External OIDC, SMTP and scraper/AI services and every administrative mutation are not comprehensively exercised.
- Existing locale resources load lazily, with persisted locale/direction and English fallback. Some new labels remain English; Vue plural/link formatting semantics have not been comprehensively reproduced. The production bundle still emits Vite's large main-chunk warning (about 751 kB uncompressed); performance parity has not been measured.
- Docker configuration and CI/task YAML were updated and parsed, and direct package equivalents passed. Docker daemon and Task executable were unavailable; no image build, container runtime test or hosted CI run is claimed.
- React has 48 tests in 10 files with 74 textual expect calls. The retained Vue tree has 49 test files. Selective portable assertions and new behavior tests were migrated; equivalent coverage for all Vue-specific unit suites is not established. Coverage percentage was not measured.
- Token usage is NA at every module/command because platform telemetry is unavailable; no estimates are presented as counts. Session logs are action records, not verbatim platform exports. Initial inspection and M01/M02 individual-command timestamps were not fully captured; M01 end time was reconstructed from test output. Exact per-edit file deltas and human review time are unavailable. These gaps prevent a fully instrumented token/time study, despite preserved executable test evidence.
- No baseline comparison or migration-strategy superiority claim can be derived from these runs. The results support acceptance for this branch against this yardstick. Full production replacement still requires review of the documented remaining behavior and deployment checks.
`);
fs.writeFileSync(path.join(evidence, 'METRICS_TEMPLATE.md'), `# Workflow metrics — measured results

## Summary

| Workflow | Checkpoint | Tool | Model | Human prompts | Recorded module time | Measurement time | Review/fix time | Tokens | Build | Core smoke | Core strict | Extended smoke | Extended strict | Flows | Unit pass/fail/skip | Type errors | Human code interventions | Result |
|---|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---:|---:|---|
| WF1 Incremental conversion with test acceptance | End | Codex | GPT-6 (exact deployment unavailable) | 2 | ${minutes} min | ${measuredSeconds} s | NA | NA | pass, all 4 runs | 34/34 | 34/34 | 32/32 | 32/32 | 15/15 each run | 48/0/0 each run | 0 | 0 observed | accept within declared yardstick; feature parity partial |

Two human messages comprise the original request and continuation; ten derived module prompts are separately preserved. Recorded time sums module windows, excluding the inter-session gap; it is not exact model compute time. Seven source repair cycles were performed by the agent, with environment/selection fixes recorded separately. Human review time and actual token usage are unavailable.

## Final measurements

| Scope/check | Routes | Flows | Units pass/fail/skip | Type errors | Lint errors/warnings | Build seconds | Total seconds | Evidence |
|---|---:|---:|---|---:|---|---:|---:|---|
${matrix.replaceAll('../runs/', 'runs/')}

All four builds pass, with 0 explicit any markers, 0 TODO markers, 74 textual expect calls and 10 React test files. The separate complete strict browser regression passed 82 checks. The source Vue tree and its 49 test files remain unchanged; complete equivalent unit coverage is not established.

Branch: rewrite/wf1-incremental-migration. HEAD: 7f8c36b73. Dirty=1 in every measurement, because changes remain uncommitted as requested. No baseline was rerun. The original measure.sh and independent E2E suite were used unchanged; a tested macOS timeout shim was added to PATH. [Raw CSV](metrics.csv) records timestamps and run IDs. [Full workflow report](workflow-1/REPORT.md) explains all ten modules, repairs, changed files, commands and evidence limitations. [Machine summary](workflow-1/final-measurements.json) links final command records.

The incremental process met each module's declared acceptance before progressing and passed the final measurement matrix. This supports this yardstick's routing and business-flow acceptance, not full production or visual parity: advanced reference interactions remain incomplete, external services are unverified, and no Docker image build was possible without a daemon. Tokens and exact human review time remain NA rather than invented measurements. No final commit or push has been created.
`);
fs.appendFileSync(path.join(workflow, 'session-logs/session-002.md'), `\nFinal report assembled ${finished}. Four final measurement rows verified against CSV: builds pass, routes complete, flows15/15, units48/0/0, types/lint0. TokensNA; no commits/push. Report and metrics explicitly retain feature-parity and telemetry limits.\n`);
console.log(JSON.stringify({ modules: modules.length, measurements: rows.length, module_minutes: minutes, measurement_seconds: measuredSeconds, status: 'acceptance complete, documented feature limits' }));
