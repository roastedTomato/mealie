# Mealie React SPA — Workflow 2

Independent migration on `rewrite/wf4-parallel-migration` from `7f8c36b73`.
Vite, React 19, strict TypeScript, React Router SPA, MUI and react-i18next.

```sh
pnpm install --frozen-lockfile
pnpm dev          # port 3000; /api proxies to backend on 9000
pnpm typecheck
pnpm lint
pnpm test
pnpm build        # dist/index.html served by FastAPI in production
```

`src/shared` and `src/auth` are main-owned. Features export route objects;
`App.tsx` registers public/authenticated/admin routes centrally. API calls return
parsed bodies and propagate typed HTTP errors; no Vue runtime is imported.
Generated TypeScript contracts and existing locale JSON remain read-only in the
retained `frontend/app` tree. English interpolation is adapted to i18next; other
locales load lazily. New strings fall back to English where no source key exists.

See `rewrite-evidence/workflow-4/contracts.md`, `plan.md` and final report for
ownership, executable acceptance evidence and remaining feature/deployment limits.
Passing the selected route/flow yardstick does not establish complete Vue parity.
