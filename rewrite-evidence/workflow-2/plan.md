# WF2 approved plan

User requested parallel migration with one main agent and two implementation agents, independent worktrees, module tests and regression, failure repair until acceptance, integration records, wall and cumulative agent time, tokens, prompts, logs, file lists, final core/extended × smoke/strict measurements and METRICS_TEMPLATE.md update. User approved saving/pushing WF1 and creating a separate WF2 branch, then requested completion of WF2. WF1 saved at 47a176ed1 and pushed; WF2 starts at 7f8c36b73. Existing WF1 code is not a migration input.

Main: Vite/React/strict TS, API/auth, MUI UI and theme, i18n, routes, account, all admin/group/household management, deployment, integration and measurements.
Agent recipes: food recipe CRUD/import/comments/sharing/favorites, organizers, cookbooks, finder/timeline. Only src/features/recipes/** plus own evidence.
Agent planning: shopping lists/items and meal planning/rules. Only src/features/planning/** plus own evidence.
Shared interface requests go to main. Agent-owned exports provide route objects; main registers them. Generated types and non-English source translations are read-only.

Start/end UTC timestamps use ISO-8601; user timezone Pacific/Auckland. Workflow wall time starts 2026-10-11T01:49:38Z (completion authorization), preparatory earlier chat and push wait reported separately. Cumulative work sums main and worker active windows, overlapping by design; no claim of CPU time. Tokens are null when telemetry unavailable. Each test uses run.mjs to record exact command, timestamps, exit and full output. Event log records integration/repair/conflict and human intervention separately. Worktrees preserve patch and final manifests; final integration remains uncommitted.

## Timing/token correction after telemetry recovery

Local platform rollout metadata subsequently recovered. `final/telemetry.json` and each `agents/*/platform-events.jsonl` now provide authoritative active turn windows and token counts. Workflow wall time starts at first main task start (original planning request), including human waits and WF1 preservation; implementation wall time starts at the completion-authorized turn. Cumulative time sums active main and worker turns, excludes user pauses and worker idle gap, includes test/tool waits. Automatic approval reviewers are excluded. Historical command records with tokens:null mean per-command attribution unavailable; aggregate agent usage is available. Only operational metadata is exported, without model reasoning, system prompts or account data.
