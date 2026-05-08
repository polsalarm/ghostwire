# Ghostwire — Manual Test Guide

Live deploy: **https://cursor-ghostwire-delta.vercel.app/**

This file lists every shippable surface and the exact steps to verify it. Pair with `roadmap.md` for what's expected to exist.

---

## Quick smoke

```
curl https://cursor-ghostwire-delta.vercel.app/api/healthz
```
→ `{"status":"ok","uptime":...,"runtime":"vercel-serverless"}`

---

## Phase 0 — Leaderboard

1. Open hero → CONFIGURE RUN → MODULE=M1, MODE=TERMINAL, TIER=STORY, DAILY off → ENTER.
2. Solve all 3 locks (see M1 below).
3. WinScreen pops → enter handle (2-16 chars `[a-z0-9_-]`) → submit run.
4. Verify:
   - `RUN ACCEPTED` card with handle, alltime rank, score.
   - Top-50 table renders, your row highlighted with green-glow background.
5. Hard-refresh, replay, verify rank changes.
6. Server smoke:
   ```
   curl "https://cursor-ghostwire-delta.vercel.app/api/leaderboard?window=alltime&limit=10"
   ```

---

## Phase 1 — 3D shell (M1 only)

1. Hero → MODULE=M1, MODE=3D ROOM, TIER=STORY → ENTER.
2. Confirm:
   - Spawns in chamber 1 (back of room, near gate desk).
   - WASD/arrows + mouse-drag camera. Footstep sfx triggers on move.
   - SCAN_PAD pulses amber. Walk close → "[E] decrypt" prompt → press E → scan whir → glyph walls decode.
   - Walk to gate terminal → "[E] interact" prompt → press E → terminal overlay opens.
   - Solve gate (`POST /api/gate {"role":"admin","clearance_code":"ZX9-99"}`).
   - Banner "NODE_1 BYPASSED · walk to NODE_2..." appears, overlay auto-closes after 2.5s.
   - Door slides up with rumble sfx; previously closed wall now passable.
3. Repeat for L2 router, L3 pipeline.
4. After pipeline unlock: camera leaves player, glides through 3 doors to exit panel (~5.4s flythrough), then WinScreen pops.
5. CRT effects visible: bloom on emissives, scanlines, vignette, faint chromatic aberration. Auto-quality drops effects + DPR if fps < 40.
6. HUD top-right shows tier badge + timer (when applicable) + exit button.

---

## Phase 2a/2b — Mutation + daily

1. Hero → DAILY checkbox on (shows reset countdown). ENTER.
2. Header chip: `◇ DAILY YYYY-MM-DD`.
3. `traffic` shows seed-derived leaks (different `CLEARANCE_PREFIX`, different threshold/temp/status, different `deadline_ms`).
4. `hint` for L1 displays the seeded prefix + sumTarget.
5. Solve. Submit. WinScreen tab toggles ALLTIME / WEEKLY / DAILY. Daily tab populates.
6. Streak counter increments (🔥 N).
7. Smoke:
   ```
   curl https://cursor-ghostwire-delta.vercel.app/api/daily
   ```
   → `{"date":"...","seed":"d:...","resetIn":N,"gate":{...},"router":{...},"pipeline":{...}}`

---

## Phase 2c — Tiers

| Tier | Multiplier | Timer | Hint | Solve |
|------|-----------|-------|------|-------|
| STORY | ×1.0 | ∞ | full | ✅ |
| HARDENED | ×0.7 | 60s | location-only | ❌ |
| GHOST | ×0.4 | 60s | refused | ❌ |

1. Hero → TIER=HARDENED → ENTER. Header shows `▲ HARDENED` + `⏱ M:SS` rose timer.
2. `hint` shows location pointer ("look at chamber X SCAN_PAD"), not full text.
3. `solve` returns `solve disabled in tier=HARDENED`.
4. Wait 60s without solving → ExpiredModal: "RUN EXPIRED · ops detected you · no leaderboard entry". `[ NEW INSTANCE ]` resets.
5. Re-enter HARDENED, solve all 3 fast → submit. Score = ~21000 (~30s × 0.7).
6. Try GHOST — `hint` returns `hint subsystem offline (TIER_GHOST)`.

---

## Phase 2d — Ghost replays

1. Submit any run. WinScreen leaderboard rows show `▶` button on entries with traces.
2. Click ▶ → loads via `/api/run/replay?id=...` → modal types every command in original cadence.
3. Speed picker 1× / 2× / 4×. Click outside or "close" exits.
4. Smoke:
   ```
   curl "https://cursor-ghostwire-delta.vercel.app/api/leaderboard?limit=5"
   ```
   Each entry has `hasTrace` bool. Pick one with `true`, then:
   ```
   curl "https://cursor-ghostwire-delta.vercel.app/api/run/replay?id=<runId>"
   ```
   Returns `{ trace: [{t,c}, ...] }`.

---

## Phase 3 — M2 DATACENTER (5 puzzles)

Hero → MODULE=M2 → MODE auto-flips to TERMINAL (no 3D yet) → ENTER.

Header chip: `[M2 DATACENTER]` cyan. Run hash carries `module:m2`.

### L1 — JWT_AUTH

```
traffic
```
Look for `LEAK .env.bak grep "JWT_SECRET" → "<secret>"`.

Forge HS256 token with that secret + `{"role":"admin","sub":"ghost"}`. Easy way: run locally:
```
node -e "
const c=require('node:crypto');
const e=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const h=e({alg:'HS256',typ:'JWT'}),p=e({role:'admin',sub:'ghost'});
console.log(h+'.'+p+'.'+c.createHmac('sha256','hunter2').update(h+'.'+p).digest('base64url'));
"
```
(replace `hunter2` with seeded secret)

Submit:
```
POST /api/m2/jwt {"token":"<paste>"}
```
→ 200 `jwt_ok` → unlock.

### L2 — USER_API_IDOR

```
traffic
```
shows privileged range `[NNN0..NNN9]`. Iterate:
```
GET /api/m2/user?id=NNNN
```
Hit secret id → 200 with `role:"admin"` + `flag:"GW{idor_*}"` → unlock.

### L3 — THROTTLE_BYPASS

```
traffic
```
`config: target_unique_ids=N`. Send N unique client_ids:
```
POST /api/m2/throttle {"client_id":"bot-001"}
POST /api/m2/throttle {"client_id":"bot-002"}
...
POST /api/m2/throttle {"client_id":"bot-00N"}
```
Last one returns `unlock: ratelimit`.

### L4 — PROTO_POLLUTION

```
traffic
```
shows `if (config.<flagKey>) → bypass`. Send:
```
POST /api/m2/checkout {"item":"x","__proto__":{"<flagKey>":true}}
```
→ `unlock: proto`.

### L5 — HEADER_SMUGGLING

```
traffic
```
shows magic host (e.g. `admin.internal`). Send:
```
smug X-Forwarded-Host=admin.internal
```
→ `unlock: smug` → ESCAPE_COMPLETE.

### Verify

- WinScreen → DAILY/WEEKLY/ALLTIME tabs all populate.
- **module filter chips** ALL / M1 / M2 — clicking M2 hides M1 runs.
- Each row shows `M1` or `M2` cyan badge prefix.

---

## Cross-cutting

- **Reset** button (red, header) wipes localStorage save, restarts from L1.
- **Mute** button (♪) toggles all sfx.
- **Briefing** button reopens welcome modal.
- **Hash routes**: `#shell` jumps directly into shell, `#3d` into 3D, no hash = hero.
- **Esc** in 3D closes terminal overlay (with disconnect blip sfx).
- **`reset` / `restart`** typed in terminal = same as button.
- **Stale daily seed** auto-flips to free-play on mount.
- **Persistence**: refresh mid-run resumes (timer recomputed from `startedAt`).

---

## Known gaps (not bugs)

- M2 has no 3D environment yet — Hero forces TERMINAL when M2 selected.
- GLB models for terminals/chairs not yet imported; geometry is box-primitives + emissive materials.
- Streak is client-side localStorage only; clearable via DevTools.
- No account system; handles aren't owned, anyone can submit any handle.
- Anti-cheat is rate-limit + sane-bounds only — clients can submit fake `timeMs`.

---

## Failure modes worth verifying

| Symptom | Where to look |
|---------|---------------|
| `submit_error: leaderboard_unavailable` | DevTools → Network → `/api/run/finish` response. Check `hasUrl` + `hasToken` + `detail` fields. Likely Upstash quota or env var drift. |
| 3D shell black screen | Hard refresh; check console for R3F version mismatch (must be `@react-three/fiber@^8`, `@react-three/drei@^9`). |
| `network_error: Failed to fetch` | Backend not deployed or path mismatch. Hit `/api/healthz` directly. |
| Door doesn't open after L1 | Esc-close overlay first. Door anim binds to `unlocked` array sync; check `useWorld.getState().unlocked` in console. |
| Timer stuck at 0:00 in HARDENED | `localStorage` had stale `startedAt`. Click reset, re-enter from hero. |
