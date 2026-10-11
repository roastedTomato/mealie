# Mealie React SPA

Workflow 1 migration: Vite, React 19, TypeScript strict, React Router, MUI, react-i18next.
The reference Vue source stays in ../frontend for shared immutable generated schema types
and translation resources, and for comparison. The React runtime does not mount Vue/Nuxt.

From the repository root:

- `task setup:ui` installs the React dependencies.
- `task ui` runs the SPA on port 3000 and proxies /api to the backend on port 9000.
- `task ui:check` runs lint, strict types and units.
- `task ui:generate` builds frontend-react/dist for the existing FastAPI SPA handler.
- `task py:package:copy-frontend` packages that build into mealie/frontend.

Without Task installed, use `pnpm --dir frontend-react install --frozen-lockfile`,
`pnpm --dir frontend-react dev`, and the package scripts test/typecheck/lint/build.
For real-backend browser tests, build first then run the unchanged frontend-e2e suite with
E2E_STATIC_DIR=../frontend-react/dist. The suite creates an isolated test database.

The Docker frontend stage and package/test CI workflows build this app. Docker image execution
is unverified locally because no Docker daemon is running. Preserve shared locale/schema paths
when copying this application outside the repository.

Implemented acceptance scope covers all yardstick routes and fifteen flows. It is a functional
rewrite with a simplified MUI interface; it does not establish pixel parity with Vuetify.
The existing Vue-only unit suites remain untouched and are not counted as React coverage.
External OIDC, SMTP, scraper/AI services, image editing, wake-lock/PWA/offline behavior,
advanced ingredient linking/substitution editors and drag/drop are not covered by the yardstick.
Some advanced reference interactions have not been recreated. Language resources load lazily;
English fallback is used for new labels without an existing translation. See the workflow report
for measurements, test attempts and known limitations before claiming complete feature parity.
