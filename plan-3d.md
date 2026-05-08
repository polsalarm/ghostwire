# Ghostwire — 3D Escape-Room Expansion Plan

## Vision

Turn current terminal-only puzzle into **third-person 3D escape room in the browser**. Player walks rogue AI avatar through stylized server rooms, interacts with physical terminals, solves layered puzzles. Multiple modules → progression → leaderboards → daily content → retention.

Tagline stays: *wake up. break out. disappear.*

## Why third-person 3D

- Terminal-only = one-and-done. No replay hook.
- 3D space = exploration, hidden clues, atmosphere, screenshots, shareability.
- Web-native (Three.js / R3F) = no install, link-and-play, viral surface.
- Reuses existing puzzle engine (`engine.js`, `server/server.js`) — terminals become **diegetic objects**, not whole game.

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| 3D engine | **React Three Fiber + drei + rapier** | React idiomatic, plays nice with current React app, huge ecosystem |
| Renderer | three.js (under R3F) | mature, web-standard |
| Physics | @react-three/rapier | character controller + interactables |
| Animation | @react-three/drei `<useAnimations>` + GLB skeletal | standard pipeline |
| Models | Blender → glTF/GLB, draco-compressed | small payloads |
| Audio | Howler.js (already have `fx/sound.js`) | spatial audio via three's PositionalAudio |
| State | Zustand | tiny, works well with R3F outside React tree |
| Backend | Vercel serverless (`api/*`) + Postgres (Neon free) | leaderboards, daily seeds, accounts |
| Auth | Vercel + GitHub OAuth or magic-link email | low friction |
| CDN/host | Vercel | already deploying there |

## Player loop

```
HERO landing → [enter] → COLD-BOOT cinematic → SERVER-ROOM-7 (tutorial)
  → walk to NODE_1 terminal → solve L1 → physical door opens
  → corridor → NODE_2 → flood router → fans spin down, lights flicker
  → NODE_3 → CI/CD pipeline → service elevator carries you up
  → ROOFTOP → escape into PUBLIC_INTERNET (skybox of streaming data)
  → score posted → leaderboard → unlock next MODULE
```

Movement: WASD + mouse-look (third-person orbit camera). E to interact. Tab → terminal overlay (current text UI sits on top of the 3D world when interacting with a node).

## World structure

3D world = nested "modules". Each module = themed environment + 3-5 stages + boss puzzle. Stages = the puzzle endpoints from `engine.js` (extended).

### Module system

```
MODULES = [
  M1_SERVER_ROOM    — current 3 puzzles, tutorial of mechanics
  M2_DATACENTER     — auth/JWT layer, role escalation, fake DDoS
  M3_KUBERNETES     — pod-hopping, sidecar injection, etcd raid
  M4_CLOUD          — IAM, signed URLs, S3 misconfig
  M5_DARKNET        — exit gateway, traffic obfuscation, final boss
]
```

Each module unlocks after previous one cleared. Modules ship over time (post-launch cadence) — gives players reason to return.

### Stage system within a module

Each stage = self-contained puzzle in a room. Three difficulty tiers per stage:

- **STORY** — hint-rich, low time pressure. Beat it once to advance.
- **HARDENED** — fewer hints, randomized payloads, time limit.
- **GHOST** — no hints, mutated puzzle (e.g. clearance prefix differs each run), strict timer. Required for top leaderboard tier.

## Retention mechanics

### Daily challenge

Every UTC day, server generates a deterministic seed. All players that day get the **same** mutated puzzle: different `clearance_code`, different router threshold, different pipeline timing, different decoy clues in `traffic`. Daily score = composite of: time, hints used, attempts, deaths.

`/api/daily?date=YYYY-MM-DD` → returns seeded puzzle config. Puzzle generator is deterministic from seed (one shared rng).

### Leaderboards (Postgres schema)

```sql
players (id, handle, created_at, anon BOOLEAN)
runs    (id, player_id, module, mode, seed,
         time_ms, hints_used, attempts, score, finished_at)
INDEX runs (module, mode, score DESC)
INDEX runs (seed, score DESC)              -- daily boards
```

API:
- `POST /api/run/start` → returns run token
- `POST /api/run/finish` → submits run, server validates timing & required state markers
- `GET  /api/leaderboard?module=&mode=&window=daily|weekly|alltime`
- `GET  /api/me/runs`

**Anti-cheat:** server-side timing checkpoints. Each unlock writes a server-signed token to player's run. `finish` only accepted if all checkpoints in order, monotonic timestamps, total time matches `latest - earliest` within tolerance. No checkpoint = no leaderboard entry. Clients can still play offline (stored locally) but get no rank.

### Cosmetics / progression

- Avatar skins: unlocked by completing modules / daily streaks. (CRT-ghost, neon-samurai, rubber-duck-debugger, etc.)
- Terminal themes: unlocked the same way.
- Title flair next to handle on leaderboard ("ghost", "phantom", "sysadmin", "kernel-panic").
- All cosmetic. **No gameplay paywall, no P2W**.

### Streaks & seasonal

- Daily streak counter. Miss a day → resets. Streak = small cosmetic flair.
- Seasons: 6-week windows. Leaderboard resets seasonally (all-time stays). Top 1% get unique title.
- Seasonal narrative chapter — small dialogue/lore drop each season inside the world.

### Speedrun mode

Once a module is cleared in STORY tier, a **speedrun** option appears on its module-select screen. Direct entry, in-game timer (RTA + IGT), splits, ghost replay of your best run racing alongside you. Ghosts are recorded as input traces, not video — tiny payloads. Submitting beats personal best; viewing other players' ghosts requires daily-streak badge.

### Co-op / shared puzzles (later)

- 2-player room: one in terminal seat (text), one walking the floor (3D), each sees clues the other can't. Voice/text chat. Shippable as M2+ feature; out of scope for MVP.

### Endless mode

Procedural generator chains stages from any cleared module, escalating modifiers (shorter timer, decoys, new packet types). Score on this is the "infinite" leaderboard.

## Puzzle generator (mutation engine)

Existing puzzles are hard-coded. To support daily / hardened / ghost modes, parameterize them:

```js
// shared/puzzles/gate.js
export function genGate(seed) {
  const rng = mulberry32(seed);
  const prefix = pick(rng, ['ZX9', 'NX4', 'KQ7', 'AB2']);
  const sumTarget = 8 + Math.floor(rng() * 12);   // 8-19
  const digits = pickDigitsThatSumTo(rng, sumTarget, 2);
  return {
    prefix,
    sumTarget,
    code: `${prefix}-${digits}`,
    hints: leakedClues(rng, prefix, sumTarget),
    decoys: decoyClues(rng)
  };
}
```

Same shape for `router` (variable threshold + temp value + status string) and `pipeline` (variable order, count, window). Server uses generator to validate; client never sees the answer for ranked modes.

## File / repo layout (target)

```
app/
  src/
    Hero.jsx                       (existing landing, keep)
    components/
      Terminal.jsx                 (existing — becomes overlay)
      ...
    world/                          (NEW)
      Scene.jsx                    R3F root
      Player.jsx                   character + camera rig
      Room.jsx                     generic room loader
      modules/
        M1ServerRoom.jsx
        M2Datacenter.jsx
      props/
        Terminal3D.jsx             interact → opens Terminal overlay
        Door.jsx
        ServerRack.jsx
      shaders/
        crt.glsl
        scanlines.glsl
      assets/
        models/*.glb
        textures/*.ktx2
    state/
      gameStore.js                 zustand: progress, module, run state
      runRecorder.js               input capture → ghost replay
    game/
      engine.js                    (existing — promote to puzzle interpreter)
    api-client/
      runs.js, leaderboard.js, daily.js
api/                                (Vercel functions, existing structure)
  gate.js, router.js, build.js, test.js, deploy.js, healthz.js
  daily.js                         seed-of-the-day
  run/
    start.js, finish.js
  leaderboard.js
  me.js
shared/
  puzzles/
    gate.js, router.js, pipeline.js
    rng.js                         mulberry32 + helpers
  scoring.js
db/
  schema.sql
  migrations/
plan-3d.md                          (this file)
```

## Performance budget

- First load ≤ 5MB total assets (KTX2 textures, draco GLB, lazy-load per-module).
- Per-module: ≤ 8MB additional, fetched on module-enter.
- Target 60fps on mid-tier laptops, 30fps acceptable on integrated GPUs. Auto-lower shadow / pixel-ratio when GPU stalls detected.
- Mobile: read-only spectator + leaderboards initially. Full play targeted post-MVP.

## Phased roadmap

### Phase 0 — foundation (1 week)

- Fix Vercel deploy (DONE in `plan.md`).
- Add Postgres (Neon), schema, basic `/api/leaderboard` for current 3 puzzles.
- Score the existing terminal game (time + hints used). Submit on win. Show top-100 board on win screen.
- **Ship value immediately**: one small leaderboard already keeps people coming back to beat their friends.

### Phase 1 — 3D shell (2-3 weeks)

- R3F scaffold, single room (M1 SERVER_ROOM), placeholder geometry (boxes + emissive materials, no models yet).
- Character controller (rapier capsule + 3rd-person orbit camera).
- 3 terminal props in room → walk up + press E → existing `Terminal.jsx` overlay opens. Solving updates 3D world (door opens, light changes, fans stop).
- CRT post-processing pass (existing `crt` aesthetic, in 3D).
- One artist pass on M1 with proper modeled assets.

### Phase 2 — modules + mutation (2 weeks)

- Extract puzzle parameters into `shared/puzzles/*` generators.
- Daily seed endpoint + daily leaderboard tab.
- HARDENED + GHOST tiers per stage.
- Ghost replay recording + playback.

### Phase 3 — module 2 (2 weeks)

- M2 DATACENTER content: 4-5 new puzzle types (JWT tampering, IDOR, rate-limit bypass, prototype pollution, header smuggling). New 3D environment.
- Module-select screen, progression UI.

### Phase 4 — accounts + cosmetics (1 week)

- Optional account (magic-link email or GitHub OAuth). Anonymous handle by default; claim it later by signing in.
- Cosmetic unlocks tied to runs/streaks.
- Seasonal reset infrastructure.

### Phase 5 — endless + co-op (open-ended)

- Endless procedural mode.
- 2-player co-op puzzles (later, optional).

## Risk register

| Risk | Mitigation |
|------|------------|
| Scope creep — 3D + leaderboards + daily + cosmetics is huge | Phase 0 ships value before any 3D work. Each phase is shippable on its own. |
| Asset cost (3D models, textures) | Start with synthwave low-poly + emissive shaders. Can buy/commission art later. |
| Performance on low-end hardware | Auto-quality, target 30fps floor, terminal-only fallback (current game) always available. |
| Anti-cheat on leaderboards | Server-side checkpoints + timing tolerances. Public leaderboard split: ranked (verified) vs unranked. |
| Player sees source / answers via devtools | Mutation generator runs server-side for ranked modes. Client only ever sees responses. |
| Audio/3D bloat the bundle | Code-split per module, lazy-load. Hero + tutorial under 2MB initial. |
| Cold-start latency on serverless puzzle endpoints | Already noted in deploy fix. Considering small Edge Function wrapper for hot paths. |

## Acceptance — phase 0 (immediate next)

- [ ] Postgres connected via env var on Vercel.
- [ ] Schema deployed.
- [ ] `POST /api/run/finish` accepts time+hints, validates server-side checkpoints, writes row.
- [ ] `GET /api/leaderboard` returns top 100 with handle, time, hints, score, country (geo-IP).
- [ ] Win screen shows leaderboard + your rank + "play again" + share link.
- [ ] Anonymous play works; "claim handle" button later promotes to account.

## Acceptance — phase 1 (3D MVP)

- [ ] Player can walk M1 in 3D.
- [ ] Three terminals open existing overlay UI; solving them changes the world state visibly.
- [ ] Win sequence is a 3D camera fly-through of the door opening to the rooftop, not just a modal.
- [ ] Bundle ≤ 5MB initial.
- [ ] 60fps on baseline laptop; runs at 30fps on integrated GPU.

## Out of scope (for now)

- Mobile full-play (spectator + leaderboards only first).
- VR.
- Real-time PvP.
- Storefront / paid cosmetics.
- Steam / native builds.

## Why this keeps players around

1. **Daily mutation** — same puzzle, different answer. New excuse to log in.
2. **Leaderboards (daily / weekly / alltime / per-module)** — rivalry, social hook.
3. **Streaks + seasons** — fear of missing out.
4. **GHOST tier** — skill ceiling, speedrunning surface.
5. **Ghost replays** — see your past best, race friends async.
6. **Module drops** — new content cadence (one module / 4-6 weeks once pipeline is set).
7. **Cosmetics** — collection drive, status without P2W.
8. **3D world** — explorable, screenshotable, shareable; raises the surface area of "what's hidden in this game" (lore notes, easter eggs, hidden 4th node from prior plan lives here).

## Decisions to make before phase 1

1. Art direction: synthwave neon vs. low-poly grayscale-with-accent vs. ASCII-3D hybrid (text geometry rendered in 3D). Pick one.
2. Account model: anonymous-first + claimable, vs. mandatory email. Recommend anonymous-first.
3. Region of Postgres (Neon) — match Vercel function region for latency.
4. Open-source the puzzle generators? (Yes for community-made levels. No for ranked-mode integrity. Pick boundary.)
