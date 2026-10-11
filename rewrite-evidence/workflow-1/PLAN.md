# Workflow 1 — Incremental conversion with test acceptance

Repository: mealie. Branch: rewrite/wf1-incremental-migration. Starting HEAD: 7f8c36b73.
No baseline run or baseline commit. No module commits. Final commit decision deferred.

## Inspection

The workspace parent is not a Git repository. The actual checkout initially used
fix/3858-migration-duplicates-and-images; switched to the user-specified existing branch.
An untracked empty METRICS_TEMPLATE.md was preserved at
/private/tmp/COMPX574-original-empty-METRICS_TEMPLATE-20261010.md before switching.
The target branch already supplies the measurement script and independent E2E yardstick.
Frontend: Nuxt 4 / Vue 3 / Vuetify, 229 Vue files and 49 unit test files.
Boundaries: lib/api (generated types and HTTP clients), pure lib utilities,
composables (Vue state/auth), global/Layout/Domain components, pages, middleware,
plugins, locale resources. Keep generated types unchanged and non-English locales untouched.
React implementation lives in frontend-react; frontend stays as the behavioral reference.

## Ordered modules and acceptance (defined before implementation)

| Module | Scope | Acceptance |
|---|---|---|
| M01 | Pure API URL, finder limit and text utilities | Preserved unit assertions all pass; strict source typecheck |
| M02 | Vite, React 19, strict TS, Router SPA, MUI, i18n, shell | Build/lint/types and provider/navigation/language tests |
| M03 | HTTP API, auth/session, permissions, public auth pages | Unit tests + auth flows + related strict routes |
| M04 | Recipe browsing/search/detail/share/comment/create/import | Unit tests + recipes flows + related strict routes |
| M05 | Categories/tags/tools/cookbooks/finder | Unit tests + organize flow + related strict routes |
| M06 | Meal planner/settings | Unit tests + mealplan flow + related strict routes |
| M07 | Shopping lists/items | Unit tests + shopping flows + related strict routes |
| M08 | Profile/preferences/API tokens | Unit tests + profile flow + related strict routes |
| M09 | Group/household/data/admin/report/migration pages | Unit tests + admin flow + extended strict routes |
| M10 | Production/task/container integration | Complete regression + final measurement matrix |

Every module also runs accepted preceding React unit tests, strict types and build once
M02 introduces the build. Run corresponding browser tests against the real seeded backend;
select module routes by the existing E2E test titles, without editing the yardstick.
Failures are fixed and rerun within the same module; blocked tests do not count as passes.
M01 ports pure behavior only; it does not claim to migrate any Vue page or establish a React UI.

## Evidence

- prompts/user-001.md: original human prompt; modules/Mxx/prompt.md: derived step instructions.
- session-logs/session-001.md: human-readable action record (not a verbatim platform transcript).
- modules/Mxx/result.json: times, files, commands, repair count, acceptance, tokens and limitations.
- modules/Mxx/*.log: raw stdout/stderr, including failed attempts.
- REPORT.md: accumulated module results and remaining work.
- ../METRICS_TEMPLATE.md: fill final measured numbers only when all modules are complete.

Tokens: NA unless an authoritative session export is available. Per-step token counters and
verbatim platform transcripts are not exposed through current tools. Do not fabricate them.
Times are captured in UTC; user timezone is Pacific/Auckland. Human review time is unknown.

## Final measurements (after M10)

Run rewrite-evidence/measure.sh with --app frontend-react and each combination:
--route-scope core --route-check smoke
--route-scope core --route-check strict
--route-scope extended --route-check smoke
--route-scope extended --route-check strict

Give each a distinct WF1 label. Copy actual CSV values into METRICS_TEMPLATE.md.
Uncommitted code is intentional under the user instruction; preserve dirty=1.
