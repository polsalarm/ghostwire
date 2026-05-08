# Ghostwire — Phase Roadmap

Living tracker. Tick boxes as items ship. Source of truth for what's done vs queued. Pairs with `plan-3d.md` (strategy) and `cheatsheet.md` (demo runbook).

Last updated: 2026-05-09.
Live: https://cursor-ghostwire-delta.vercel.app/

---

## Phase 0 — Foundation (leaderboard on terminal game)

> *Goal: ship retention value before any 3D work.*

- [x] Vercel deploy: api/* serverless functions
- [x] Upstash Redis (free) wired via Marketplace integration
- [x] L1/L2/L3 endpoints stable on serverless (cookies → redis state)
- [x] `POST /api/run/finish` (handle validation, rate limit, score formula)
- [x] `GET /api/leaderboard` (top 100 alltime, edge-cached 10s)
- [x] WinScreen: handle input → submit → show rank + top 50 table
- [x] Hint/solve usage tracked in localStorage
- [x] Local server.js mirrors endpoints for `npm run dev:server`
- [x] Vercel Analytics package wired (`<Analytics />` in main.jsx)
- [ ] Rotate exposed Upstash token (user pasted in chat earlier — verify done)
- [ ] Vercel Analytics enabled in dashboard (code shipped; verify toggle on)
- [ ] Geo-IP / country flag column on leaderboard
- [ ] Daily / weekly leaderboard tabs (alltime done; window=daily not implemented)
- [ ] Server-side checkpoint tokens (anti-cheat hardening — current = trust-client + rate limit)
- [ ] Account model: anonymous-first claimable handles

---

## Phase 1 — 3D shell (M1 SERVER_ROOM)

> *Goal: walkable 3D escape room around existing puzzles.*

- [x] R3F + drei + zustand stack, lazy-loaded (`#3d` route)
- [x] Code-split: terminal-only path stays 63KB gzip
- [x] Single room geometry (20×30, walls, floor grid, ceiling, fog)
- [x] Character controller (WASD/arrows + mouse-drag orbit camera)
- [x] Axis-by-axis collision sliding against barriers
- [x] 3 chambers physically gated by walls + sliding doors
- [x] Door slide animation + emissive red→green on unlock
- [x] Computer-style Terminal3D props (bezel monitor, keyboard, mouse, chair, tower, blinking LED)
- [x] Walk + E + opens existing Terminal as overlay
- [x] Auto-disconnect 2.5s after unlock + world banner pointing to next node
- [x] Already-unlocked terminals refuse re-entry
- [x] WallHints with progressive difficulty (explicit / terse / cryptic)
- [x] SCAN_PAD mechanic — encrypted glyphs decrypt on E press
- [x] `hint` command in 3D mode returns location not content
- [x] sfx: footsteps (cadence-gated), scan whir, door rumble, interact ping, disconnect blip
- [x] HUD: top-left run state, top-right exit, bottom-center prompts, scanline overlay
- [x] In-shell "◉ 3D MODE" button + `#3d` URL hash + hashchange listener
- [ ] Real CRT shader pass (`@react-three/postprocessing` — currently HUD overlay only)
- [ ] Modeled GLB assets (replace box geometry: chair, monitor, server racks, cables)
- [ ] Audio: positional 3D audio (drei `<PositionalAudio>` per terminal)
- [ ] Hero page "ENTER 3D" button (currently only via shell button or URL)
- [ ] Win sequence as 3D camera fly-through to exit (still modal)
- [ ] Auto-quality: drop shadows / pixel-ratio when fps falls below 30
- [ ] Reset clears `revealedChambers` zustand state on game reset

---

## Phase 2 — Puzzle mutation + daily challenge

> *Goal: replayability. Daily seeded puzzle = #1 retention hook.*

### 2a — Mutation engine

- [ ] `shared/puzzles/rng.js` — mulberry32 + helpers (pick, pickDigitsThatSumTo)
- [ ] `shared/puzzles/gate.js` — generator: prefix, sumTarget, decoy clues
- [ ] `shared/puzzles/router.js` — generator: threshold, temp value, status string
- [ ] `shared/puzzles/pipeline.js` — generator: stage order, count, window
- [ ] Server validates against generator (client never sees the answer for ranked modes)
- [ ] Existing static puzzle = `seed=DEFAULT` for backward compat
- [ ] Refactor `engine.js` HINTS to read from generator output

### 2b — Daily challenge ⭐ NEXT

- [ ] `GET /api/daily?date=YYYY-MM-DD` returns today's seeded puzzle config
- [ ] Daily leaderboard zset key: `gw:lb:daily:YYYY-MM-DD`
- [ ] Daily run finish writes to both alltime + daily zsets
- [ ] WinScreen tab toggle: ALLTIME | DAILY | WEEKLY
- [ ] Hero page banner: "today's puzzle resets in HH:MM"
- [ ] Streak counter (localStorage + server) — daily play increments

### 2c — Difficulty tiers

- [ ] STORY tier (default — current, hint-rich)
- [ ] HARDENED tier — 60s timer, no `solve`, mutated payloads
- [ ] GHOST tier — no hints, mutated, leaderboard-only entry
- [ ] Tier-select screen on module entry
- [ ] Score multiplier per tier (×1, ×1.5, ×3)

### 2d — Ghost replays

- [ ] `runRecorder.js` — capture input events + timestamps
- [ ] Compress trace, upload to Upstash (or R2 / Vercel Blob)
- [ ] Replay UI on leaderboard rows ("watch run")
- [ ] Race-against-ghost mode in speedrun

---

## Phase 3 — Module 2 (DATACENTER)

> *Goal: new content. New puzzles, new environment, module-select UI.*

- [ ] Module-select screen — list M1, M2 with progress
- [ ] M2 puzzle: JWT tampering (decode → modify role → re-sign with leaked secret)
- [ ] M2 puzzle: IDOR (predict / iterate user IDs)
- [ ] M2 puzzle: rate-limit bypass (header rotation, IP spoof)
- [ ] M2 puzzle: prototype pollution (JSON body trick)
- [ ] M2 puzzle: header smuggling (CL.TE / TE.CL)
- [ ] M2 3D environment (datacenter chambers, props, lighting)
- [ ] M2 module-specific lore / briefing
- [ ] Per-module progress tracking in localStorage + server
- [ ] M2 added to module-select screen

---

## Phase 4 — Accounts + cosmetics

> *Goal: identity, status, FOMO loops.*

- [ ] Magic-link email auth (Resend free tier)
- [ ] OR GitHub OAuth (Vercel built-in)
- [ ] "Claim handle" flow: anonymous run → sign in → migrate
- [ ] Cosmetic: avatar skin (8+ options) — unlocked by completing modules
- [ ] Cosmetic: terminal theme (CRT green, amber, purple, mono) — daily-streak unlocks
- [ ] Cosmetic: leaderboard title flair (ghost, phantom, sysadmin, kernel-panic)
- [ ] Streak persistence on account
- [ ] Seasonal reset infrastructure (6-week windows, cron via Upstash schedule)
- [ ] Top 1% per season → unique title

---

## Phase 5 — Endless + Co-op

> *Goal: long-tail engagement.*

- [ ] Endless mode: procedurally chain stages from cleared modules
- [ ] Modifier escalation per ring (shorter timer, decoys, new packet types)
- [ ] Endless leaderboard (longest run)
- [ ] Co-op session: 2 players share run id
- [ ] Co-op puzzle design: terminal-seat player + floor-walker player
- [ ] Voice/text chat overlay (skip if too heavy — text only first)
- [ ] Spectator link: read-only watch mode

---

## Cross-cutting

- [ ] Mobile spectator + leaderboard view
- [ ] Mobile full-play (touch controls — VR-style joystick + tap-interact)
- [ ] Custom domain (`ghostwire.io` or similar) — optional, $10/yr
- [ ] Open-source decision on puzzle generators (community-made levels)
- [ ] Anti-cheat hardening: server-issued checkpoint tokens + run-token validation
- [ ] Rate-limit tightening per route (currently router/run-finish only)
- [ ] Postgres migration if Redis hash retention exceeds free tier
- [ ] Performance budget enforcement (Lighthouse CI on Vercel)
- [ ] README / cheatsheet updates per phase
- [ ] WelcomeModal mention 3D mode + scan pads

---

## ⭐ Next slice — Phase 2b: Daily challenge

Highest retention/effort ratio. ~1-2 days. Single shippable cycle.

**Order of operations:**

1. `shared/puzzles/rng.js` — mulberry32 deterministic RNG
2. `shared/puzzles/gate.js` — minimal generator. Day 0 prefix/sum still works (back-compat). Daily uses seed.
3. `GET /api/daily` — returns `{ seed, date, gate: { prefix, sumTarget } }` (only gate randomized at first; router/pipeline keep static for v1)
4. `POST /api/run/finish` — accept `seed` field. If seed = today's daily, also `zadd gw:lb:daily:YYYY-MM-DD`
5. `GET /api/leaderboard?window=daily` returns daily zset
6. WinScreen — tab toggle ALLTIME | DAILY (highlight your row in both)
7. Hero page — "today's daily challenge: HH:MM until reset · streak: N"
8. Streak: increment on first daily-mode finish per UTC day; reset on missed day

**Deferred to 2b-v2:**
- Router + pipeline mutation
- Weekly board
- Streak title rewards

Ship after each step. Don't batch the whole phase.

---

## Status legend

- [x] = done + deployed
- [ ] = queued
- ⭐ = next focus
