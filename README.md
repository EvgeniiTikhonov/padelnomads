# Padel Nomads

A closed, curated digital platform for the Padel Nomads padel community. This repository
contains the MVP work split into:

- **`html-prototype/`** — **Static HTML export** of the clickable prototype. Open with
  `npx serve html-prototype` (no Node app build required to view).
- **`prototype/`** — Next.js source for that clickable prototype (mock data, admin scoring,
  verified levels, public profiles, leaderboard). Run with `cd prototype && npm run dev`.
  Regenerate the static export with `npm run export:html`.
- **`frontend/`** — React + Vite + TypeScript + Tailwind app (also includes an older
  in-browser mock prototype).
- **`backend/`** — Express + Prisma (PostgreSQL) API scaffolding (auth, applications, games,
  leaderboard, offers, uploads, stats).

## Static HTML prototype (easiest to share)

Send friends **`Padel-Nomads-prototype.zip`** (13 MB), or the `html-prototype/` folder.

They unzip and run:

```bash
cd html-prototype
npx serve .
```

Or drag the folder onto [Netlify Drop](https://app.netlify.com/drop) for a public link.

See `html-prototype/README.md` for details. Regenerate with `cd prototype && npm run export:html`.

## Next.js clickable prototype

```bash
cd prototype
npm install
npm run dev
```

Open `http://localhost:3000`. Use the top-right **Prototype: view as…** switcher for
Visitor / Player / Admin.

## Frontend (Vite)

```bash
cd frontend
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`). On the **Log in** page use the
one-click demo accounts:

- **Admin** — manage applications, games, players, offers, and results
- **Approved player** — full member area (dashboard, games, leaderboard, profile, offers)
- **Pending applicant** — application status screen

Prototype data is seeded into `localStorage`; clearing site data resets it.

### Tech
- React 18, React Router 6, TanStack Query
- Tailwind CSS (Syne + Montserrat type system, black/white minimalist design)
- Vite 5, TypeScript

## Backend (API scaffolding)

```bash
cd backend
npm install
cp .env.example .env   # configure DATABASE_URL etc.
npm run db:generate
npm run db:push
npm run dev
```

Requires a PostgreSQL database. See `backend/prisma/schema.prisma` for the data model.

## Project status

The Next.js / HTML prototype demonstrates the full MVP scope and user flows. The backend
provides the API/data foundation to back those flows in a future iteration.
