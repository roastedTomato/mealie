# Shared requests and resolutions

1. Recipes requested login/account harness: main-authored new React account pages copied privately for worker testing and removed from delivery. Main token creation response type fixed centrally; worker workaround excluded.
2. Recipe group/data organizer routes overlapped main registration boundary: worker removed group/data routes from recipeRoutes; main registers explicit categories/tags/tools with exported Organizers manage component. No runtime route conflict or merge conflict occurred.
3. Main supplied shared useText hook and worker switched title/control text to existing Vue catalog-key mapping; main integrates hook, worker patch excludes it. Planning has no shared change request.
4. Main follow-up requested cookbook CRUD and favorite toggle before accepting recipes. Worker added four unit tests, repaired modal error visibility, and repeated 29 browser checks. Prompts and test outputs preserved.

Independent foundation snapshot and worker patches establish ownership; central App/theme/auth/API/types/i18n/package/lock/config files were never accepted from worker harnesses. Main formatting after integration is explicit in changed-files.txt and source manifests.
