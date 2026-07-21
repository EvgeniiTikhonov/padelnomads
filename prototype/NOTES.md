# NOTES — Padel Nomads Clickable Prototype v0.1

Built against **PRD v1.4** using the Cursor build brief. Front-end only, mock data, no backend.
Where the PRD leaves questions open (§20), the prototype adopts the defaults below.

## Defaults chosen for open questions (PRD §20)

| Question | Prototype default |
| --- | --- |
| Authentication method | Fully mocked. A dev role-switcher ("Prototype: view as…") in the top-right replaces auth; `/login` offers outcome presets (approved / pending / rejected / banned / admin). The chosen role persists across page reloads (localStorage); all other data resets to seed state on reload. |
| Self-registration for games | Enabled behind `ALLOW_SELF_REGISTER` flag (default **on**) in `src/data/provider.ts`, plus admin add. |
| Waitlist | `Waitlisted` status and waitlist section shown; **no auto-promotion** logic. |
| Leaderboard points | Stored on the player, updated when admin publishes results (`22 − 2×position`, min 2, in the prototype). No scoring engine. |
| Format-specific scoring rules | Not implemented; single points-by-position entry for all formats. |
| Membership benefits | Hardcoded content (`/app/benefits`). |
| Proof of skill | Filename captured only; "View proof" opens a placeholder dialog. |
| Game deletion | Soft delete (`deleted` flag) with confirmation dialog; hidden from all lists. |
| Admin levels | Single admin level, no sub-roles. |
| Karma decay / multiplier | Config toggles exist on `/admin/karma` but are non-binding. Decay default **off** per PRD §14.5. |
| Migrated players' starting karma | Imported shells seeded at 100. |
| WhatsApp integration path | Not applicable (no real sends). All WhatsApp-triggering actions show a "(simulated)" toast, per the brief. |

## Deviations / flags

- **Brand logos**: official mark lives at `public/brand/logo.png` (black) and `logo-white.png` (white). The `Logo` component uses the white mark by default for the dark UI.
- **Application form name field**: PRD §6.1 does not list "Name" as a form field, but §9.2 requires the
  admin list to show "Applicant name, if collected". The form therefore includes an optional Name input.
- **Karma on decline**: declining participation less than 24h/4h before start applies the −15/−25 penalty
  immediately (PRD §14.3), so the demo shows the karma flow end-to-end.
- **Live-game roster edits**: attendance/payment/position marking is enabled while a game is Live; publishing
  results completes the game, awards points, applies +2 on-time karma, and notifies participants (PRD §16.13).
- **Analytics (§21)**: seven admin dashboards + support per-player diagnostics rendered with lightweight CSS
  bar charts and mock numbers, no chart library.
- **Duplicate queue**: one high-confidence seeded pair (Katerina Smirnova / Kate Smirnova). Merge moves phones,
  participations and points to the survivor and logs a `PlayerMergeLog`; undo is simulated.
- **Landing Instagram carousel**: Instagram blocks unauthenticated media scraping, so the bottom carousel uses
  curated padel community photos in `public/brand/instagram/` that link out to
  [instagram.com/padel_nomads](https://www.instagram.com/padel_nomads/). Swap those files for a real export
  from the account when available; no Meta API token is wired in this prototype.

## Demo walkthrough (maps to Definition of Done → PRD MVP Success Criteria)

1. **Apply as a visitor** → `/apply`, submit → routed to `/status` as **Pending**. *(Criteria: new user can apply)*
2. **Switch to Admin** → Applications → newest pending application → **Approve** → simulated WhatsApp welcome toast. Try the blacklist-flagged application (Boris Lebedev) to see the override dialog. *(Admin can approve/reject; blacklist enforcement)*
3. **Switch to Player** → dashboard shows next-2-weeks games, rank, karma indicator → open *Tuesday Americano* → **Confirm / Cannot play**. *(Members view games; confirm participation; platform reflects response)*
4. **Leaderboard** → banned player (Boris) absent; own row highlighted. **Profile** → karma tier, plain-language history, phones (add with fake OTP), WhatsApp consent toggles. *(Leaderboard + profile criteria)*
5. **Admin → Games → Create game** → fill form incl. WhatsApp reminder/confirmation options → add players (see karma-restricted override for Igor/Sara, banned block for Boris, overbooking override) → **Start game** → mark attendance/payment/positions → **Publish results** → leaderboard updates, karma +2 events, notifications. *(Create/manage/live/results criteria)*
6. **Admin → Offers** → toggle/edit, **Send via WhatsApp** → segment picker → simulated send. *(Offers criteria)*
7. **Admin → Players / WhatsApp / Karma / Analytics** → populated stub consoles: directory + player card + ban, duplicates merge, import wizard, template registry, delivery dashboard, inbound inbox, consent manager, karma overview/config, 7 dashboards + support diagnostics. *(Player management, karma, telemetry criteria)*
8. All screens usable at 375 px wide (bottom tab bar for the player area).
