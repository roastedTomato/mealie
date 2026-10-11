Continue Workflow 3. M03: migrate typed HTTP transport, cookie session hydration, login/logout,
refresh deduplication, protected routes, admin navigation permissions, registration and password
recovery. Keep generated backend types unchanged. The existing auth flows require a real
recipe-list landing and an admin site settings read view, so implement those read slices here;
M04/M09 will extend their business interactions. Acceptance before M04: all five unchanged auth
flows, four public auth strict routes, full React unit regression, strict types, lint and build.
Preserve original safe-redirect and token-timing unit assertions where portable. Record every
command and failure/retest. Do not repeat baseline or create commits. No fabricated token counts.
