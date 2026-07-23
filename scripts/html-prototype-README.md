# Padel Nomads — static HTML prototype

Clickable mock of the Padel Nomads app. No Node app build required — only a static file server.

## Share with friends (easiest)

1. Send them **`Padel-Nomads-prototype.zip`** (repo root) or this whole `html-prototype/` folder.
2. They unzip it, then in a terminal:

```bash
cd html-prototype   # or whatever the unzipped folder is called
npx serve .
```

3. Open the URL printed in the terminal (usually `http://localhost:3000`) on phone or computer.

**Or** drag the unzipped folder onto [Netlify Drop](https://app.netlify.com/drop) / similar and share the public link — no install needed on their side.

> Do not open `index.html` by double-clicking. Asset paths are absolute (`/_next/...`), so a tiny local server (or a static host) is required.

## What’s included

- Public landing, apply, login, and status flows
- Player area (games, leaderboard, profile, offers, notifications)
- Admin area (games, court distribution, players / levels, applications, etc.)
- Seeded mock data — interactive in the browser; state resets on full reload

## Regenerating this folder

After changing the Next.js app in `prototype/`:

```bash
cd prototype
npm install
npm run export:html
```

That rebuilds `prototype/out/`, copies it to `html-prototype/`, and refreshes the share zip at the repo root.

## Note

This is a front-end-only mock. It is not the production API (`backend/`) or the Vite app (`frontend/`).
