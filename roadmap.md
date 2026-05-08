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
- [x] Real CRT shader pass via `@react-three/postprocessing` (Bloom + ChromaticAberration + Scanline + Noise + Vignette)
- [x] Hero page TERMINAL / 3D ROOM toggle
- [x] Win sequence as 3D camera fly-through to exit (6 waypoints, ~5.4s, then modal)
- [ ] Modeled GLB assets (replace box geometry: chair, monitor, server racks, cables)
- [ ] Audio: positional 3D audio (drei `<PositionalAudio>` per terminal)
- [ ] Auto-quality: drop shadows / pixel-ratio when fps falls below 30
- [ ] Reset clears `revealedChambers` zustand state on game reset

---

## Phase 2 — Puzzle mutation + daily challenge

> *Goal: replayability. Daily seeded puzzle = #1 retention hook.*

### 2a — Mutation engine

- [x] `shared/puzzles/rng.js` — mulberry32 + FNV-1a + UTC date helpers
- [x] `shared/puzzles/gate.js` — generator: prefix, sumTarget, code
- [x] `shared/puzzles/router.js` — generator: threshold, temperature, status
- [x] `shared/puzzles/pipeline.js` — generator: windowMs
- [x] Server validates against generator (api/{gate,router,build,test,deploy})
- [x] Existing static puzzle = `seed='DEFAULT'` for backward compat
- [x] `engine.js` HINTS + SOLUTIONS read from generator output
- [ ] Decoy clues in TRAFFIC_ENTRIES that update with seed
- [ ] Pipeline stage-order randomization (currently only window mutates)

### 2b — Daily challenge ✅

- [x] `GET /api/daily` returns today's seed + gate/router/pipeline configs
- [x] Daily leaderboard zset: `gw:lb:daily:YYYY-MM-DD` (14d retention)
- [x] Run finish writes alltime + daily zsets when seed is daily
- [x] WinScreen ALLTIME ↔ DAILY tab toggle (your row highlighted in both)
- [x] Hero amber `◇ PLAY DAILY [date]` button + UTC reset countdown
- [x] Streak counter (localStorage v1) — bumped on daily-mode submission
- [x] Header chip "◇ DAILY YYYY-MM-DD" when in daily mode
- [x] Stale-day auto-reset: opening with old daily seed flips to free-play
- [x] Weekly leaderboard tab (Mon-anchored, 21d retention) + tier filter chips
- [ ] Server-side streak tracking (currently client-only)

### 2c — Difficulty tiers ✅

- [x] STORY tier (default — full hints, no timer, ×1.0)
- [x] HARDENED tier — 60s timer, no `solve`, hint=location, ×0.7
- [x] GHOST tier — 60s timer, hint disabled, ×0.4
- [x] Hero tier-select buttons (STORY / HARDENED / GHOST)
- [x] Score multiplier baked into `score = (timeMs + 5s/hint) * tier.mul`
- [x] Tier badge in run hash + leaderboard rows (▲ hardened, ◆ ghost)
- [x] Header chip + WinScreen tier display
- [x] ExpiredModal when 60s timer hits zero (forfeits run, no leaderboard entry)
- [ ] Per-tier filter on leaderboard (single list with badges shipped; filter not yet)
- [ ] Daily challenge tier-select (currently always STORY when daily clicked from Hero)

### 2d — Ghost replays ✅

- [x] `src/runRecorder.js` — capture commands + ms-since-start, caps 200 events / 240 chars
- [x] Trace stored as JSON in run hash; `hasTrace` flag in leaderboard rows
- [x] `GET /api/run/replay?id=...` returns trace + metadata
- [x] `ReplayModal` — typewriter playback with 1×/2×/4× speed picker, gap clamping
- [x] Replay button (▶) on every leaderboard row with a stored trace
- [ ] Race-against-ghost mode (live ghost overlay during your run — future)
- [ ] Compression (currently raw JSON; ~1-2KB per typical run is fine, no rush)

---

## Phase 3 — Module 2 (DATACENTER) ⚙️ in progress (v1 shipped)

> *Goal: new content. New puzzles, new environment, module-select UI.*

- [x] `shared/modules/registry.js` — module table (m1 live, m2 preview)
- [x] Hero module-picker buttons (M1 / M2 [preview])
- [x] M2 puzzle: JWT tampering (HS256 + leaked secret + role=admin claim)
- [x] M2 puzzle: IDOR (GET /api/m2/user?id=NNN, magic id → flag)
- [x] Per-module run-hash field, sanitized server-side
- [x] App + Terminal + WorldShell propagate module through engine ctx
- [x] Module-aware traffic + hints + solutions
- [ ] M2 puzzle: rate-limit bypass (header rotation, IP spoof)
- [ ] M2 puzzle: prototype pollution (JSON body trick)
- [ ] M2 puzzle: header smuggling (CL.TE / TE.CL)
- [ ] M2 3D environment (datacenter chambers, props, lighting) — currently terminal-only
- [ ] M2 module-specific lore / briefing
- [ ] Per-module leaderboard filter (currently single board, module field stored)

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
