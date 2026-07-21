# Padel Nomads — Clickable Prototype v0.1

Front-end-only, fully navigable prototype of the Padel Nomads MVP platform (PRD v1.4).
Realistic mock data, no backend, no real auth, no real WhatsApp — every side effect is simulated with a toast.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui + lucide-react
- React Context (`MockDataProvider`) for in-memory session + data mutations

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 and use the **"Prototype: view as…"** dropdown (top-right) to switch between
Visitor, Player (approved/pending/rejected/banned), and Admin.

## Static HTML export

```bash
npm run export:html
```

Writes a fully static site to `../html-prototype/` (committed in the repo). Serve it with:

```bash
npx serve ../html-prototype
```

## Where things live

- `src/types/` — domain types mirroring PRD §15 (field names = future API contract)
- `src/data/mock.ts` — seed data (~40 players, 12 games, applications, offers, karma events, WhatsApp logs…)
- `src/data/provider.tsx` — in-memory store + mutations (approve, create game, publish results, ban, merge…)
- `src/app/` — routes: public (`/`, `/apply`, `/login`, `/status`), player (`/app/*`), admin (`/admin/*`)
- `NOTES.md` — defaults chosen for PRD open questions + demo walkthrough
