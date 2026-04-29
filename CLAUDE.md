# Friday Admin Dashboard (FAD)

Ops cockpit for Friday Retreats — guest messaging, reservations, ops, finance, HR, analytics. Next.js static-export + Express backend. Part of FridayOS.

## Active branch

**Working branch is `fad-rebuild`, not `main`.** Commit FAD work to `fad-rebuild`. `main` exists but lags.

## Stack

- Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- Static export: `output: 'export'` — no SSR. Deploy target `/var/www/friday-dashboard/`
- Express backend (lightweight: API proxy + static)
- Postgres 15 (shared with GMS)
- Auth: JWT (custom)

## Structure

```
.
├── frontend/             # Next.js 14 App Router (primary)
│   ├── src/app/
│   │   ├── fad/          # Dashboard shell + module routes
│   │   ├── approve/      # WhatsApp owner-approval flow
│   │   └── reset-password/
│   ├── src/components/   # Shared UI
│   └── src/lib/          # Utilities, hooks
├── backend/              # Express API + static
└── docs/                 # progressive disclosure (see below)
```

## Commands

```bash
# Frontend (cd frontend)
npm run dev       # next dev → port 3000
npm run build     # next build → generates out/
npm run start     # next start

# Backend (cd backend)
npm run dev       # nodemon server.js
npm run build     # tsc
npm test          # jest
```

## Conventions

- Commit messages: `feat:`, `fix:`, `docs:`, sprint-prefixed (`s7-c1: ...`)
- App Router: each route is a folder with `page.tsx`. FAD components live in `src/app/fad/_components/`
- Tailwind utility-first. No per-component CSS files; use `fad.css` for global overrides
- `tsconfig.json` has `ignoreBuildErrors: true` — DON'T rely on it; fix types properly

## Key facts (always relevant)

- **Cleaning Fee = net pass-through** (VAT optimization). Never model as revenue.
- **Static export limits:** no API routes in `frontend/`, no `next/image` optimization without config, no dynamic routes with params unless `generateStaticParams`.
- **`entity_id` = FR/FI/S divisions.** FR is the only legal entity currently.
- **WhatsApp owner-approvals route via `approve/`** — primary channel for owner consent.

## Reference docs (progressive disclosure)

In-repo, fetch on demand:

- `@docs/architecture.md` — **Read when:** adding modules, pages, components, or API integrations
- `@docs/gotchas.md` — **Read when:** debugging unexpected behavior or hitting framework edges
- `@docs/finance-schema.md` — **Read when:** working on Finance module
- `@docs/deploy.md` — **Read when:** deploying or troubleshooting deploy

Notion (via connector):

- **Atlas §4 (GMS architecture)** — `34c43ca8849281b9a10de9f264141c37` — for FAD-GMS integration
- **Friday Code Index** — `35143ca88492810d9a73d46b0101c436` — for module-specific deep dives

## Verification

Before declaring any change complete:

1. `npm run build` in `frontend/` — verify chunk hashes change vs. last deploy (stale cached JS is a real failure mode)
2. Visual sweep on dev server, desktop + mobile, all states — full UI checks per `~/.claude/CLAUDE.md` "UI verification" (moves here when 2+ frontend projects exist)
3. Update relevant `@docs/*.md` if architecture, schema, or contract changed
