# Padel Nomads

A closed, curated digital platform for the Padel Nomads padel community. This repository
contains the MVP work split into two apps:

- **`frontend/`** — React + Vite + TypeScript + Tailwind. Includes a fully interactive,
  self-contained **prototype** of the MVP (public landing, application/onboarding, member
  area, and admin area) backed by an in-browser mock data store, so it runs with no backend.
- **`backend/`** — Express + Prisma (PostgreSQL) API scaffolding (auth, applications, games,
  leaderboard, offers, uploads, stats).

## Frontend prototype

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

The frontend prototype demonstrates the full MVP scope and user flows. The backend provides
the API/data foundation to back those flows in a future iteration.
