# Padel Nomads — static HTML prototype

Exportable, fully static build of the clickable Next.js prototype. No Node.js runtime is required to view it — only a static file server.

## Quick start

From the repository root:

```bash
npx serve html-prototype
```

Then open the printed URL (usually `http://localhost:3000`).

Any static host works (GitHub Pages folder, Netlify drop, S3, nginx, etc.). Serve this folder as the site root so asset paths like `/_next/...` resolve correctly.

## What’s included

- Public landing, apply, login, and status flows
- Player area (games, leaderboard, profile, public player profiles, offers)
- Admin area (games day scoring, players / verified levels, applications, etc.)
- Seeded mock data — interactive in the browser; state resets on full reload

## Regenerating this folder

After changing the Next.js app in `prototype/`:

```bash
cd prototype
npm install
npm run export:html
```

That rebuilds `prototype/out/` and copies it to `html-prototype/`.

## Note

This is a front-end-only mock. It is not the production API (`backend/`) or the Vite app (`frontend/`).
