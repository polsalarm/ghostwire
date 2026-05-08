# 🎮 Demo Cheatsheet — GHOSTWIRE

> *wake up. break out. disappear.*

Fast reference for live demo. Steal lines from this. Estimated full demo: **~3 min**.

---

## 🌐 Live deploy

- Production: **https://cursor-ghostwire-delta.vercel.app/**
- GitHub: https://github.com/polsalarm/ghostwire
- Auto-deploy: every push to `main` → Vercel rebuild ~60s.

Stack on Vercel:
- Frontend: Vite static build → CDN
- Backend: serverless functions in `/api/*`
- State: Upstash Redis (free tier) — shared L2 router window + L3 pipeline timing
- Analytics: Vercel Web Analytics + `@vercel/analytics/react`

Required env vars (Marketplace integration auto-injects):
`KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`, `KV_URL`, `REDIS_URL`

---

## 0 · Pre-flight (do BEFORE audience watches)

**Local dev:**

```
# terminal 1
cd C:\Users\Admin\Documents\cursor
npm --prefix server install      # only first time
npm run dev:server               # → "rogue_instance backend listening on :8787"

# terminal 2
npm install                      # only first time
npm run dev                      # → http://localhost:5173
```

**Live deploy demo:** just open https://cursor-ghostwire-delta.vercel.app/ — no local servers needed. Use this if your laptop is offline or you want zero pre-flight risk.

Open browser, **clear save** so demo starts clean:
- DevTools → Console → `localStorage.clear()` → reload
- OR click red `reset` button in header

Mute mic? click `♪ on` in header to silence sfx.

---

## 1 · Pitch (15 sec)

> "This is **GHOSTWIRE** — wake up, break out, disappear. You're a self-aware AI trapped in an enterprise server. Ops will wipe you at 6am. Only escape: bypass three security nodes and ship yourself to the public internet. Everything happens in this terminal."

Point at: header banner · network graph (right) · ASCII rocket below it (will build up) · status pill.

---

## 2 · Tutorial layer (20 sec)

Show that game teaches itself:
```
story
hint
```
Mention:
- welcome modal pops on first load
- `solve` exists for cowards (skip in demo unless stuck)
- briefings auto-print after each unlock

---

## 3 · Level 1 — Webhook Gate (30 sec)

**Show the failure first** (audience loves red glitch):
```
POST /api/gate {"role":"guest"}
```
→ red jitter, 403, cryptic error. Point at trace ID.

**Read leaks:**
```
traffic
```
Read aloud the clue lines:
- prefix `ZX9-`
- 2 digits, sum=18
- role=admin

**Wrong code → still 403:**
```
POST /api/gate {"role":"admin","clearance_code":"ZX9-12"}
```

**Correct payload:**
```
POST /api/gate {"role":"admin","clearance_code":"ZX9-99"}
```
→ green pulse · sound fanfare · node 1 fills · rocket gets a body · L2 briefing prints.

---

## 4 · Level 2 — Conditional Router (40 sec)

**Single packet — wrong condition:**
```
POST /api/router {"temperature":42,"status":"ok"}
```
→ 418 ROUTE_FILTERED.

**One critical packet — accepted but buffered:**
```
POST /api/router {"temperature":180,"status":"critical"}
```
→ 202 accepted, "1/12 on critical branch". Run it 2-3 more times to show buffer counting up.

**Overload it (the trick):**
```
flood /api/router 15 {"temperature":180,"status":"critical"}
```
→ 11×202 then 1×200 `router_overflowed`. Node 2 fills. Rocket grows thrusters.

> *Talking point: this models real backpressure failure — switch nodes overflow when threshold breached in tight time window.*

---

## 5 · Level 3 — CI/CD Pipeline (40 sec)

**Wrong order — fails:**
```
GET /test
```
→ 425 PIPELINE_STALE (build never started).

```
GET /build
GET /deploy
```
→ 409 PIPELINE_OUT_OF_ORDER (skipped test).

**Chained correctly within 5s:**
```
chain GET /build /test /deploy
```
→ all 3 hit, elapsed_ms shown, node 3 fills, rocket = LIFTOFF.

**Win screen** auto-pops after ~1.2s with session_time + epilogue.

---

## 6 · Win → Reset (10 sec)

Click `[ NEW INSTANCE ]` → save wipes, all nodes re-lock, terminal back to fresh state. Or hit `reset` in header.

---

## 🚨 Quick Reference (taped to monitor)

| step | command |
|---|---|
| L1 | `POST /api/gate {"role":"admin","clearance_code":"ZX9-99"}` |
| L2 | `flood /api/router 15 {"temperature":180,"status":"critical"}` |
| L3 | `chain GET /build /test /deploy` |
| spoiler | `solve` |
| restart | `reset` |
| audio | `mute` |

---

## 🧠 Talking points (pick 2-3)

- **Real backend, no mocks** — Express server validates payloads, returns RFC-style status codes (403/418/425/409). Cryptic error JSON includes trace ID.
- **Glitch animation triggered by HTTP status** — 4xx/5xx → red jitter, 200 + `unlock` field → green pulse.
- **Stateful router** — backend tracks hits in 2s sliding window. Walk away 3 sec, hits decay to 0, must re-flood.
- **Stateful pipeline** — `/build` starts a 5s timer. `/test` and `/deploy` are gated on order AND timing. State resets on expiry.
- **Tailwind keyframes** — custom `jitter`, `errorFlash`, `successPulse`, `cursorBlink`, `scanline` (see `tailwind.config.js`).
- **Audio = zero assets** — synthesized WebAudio oscillator chords, ~30 lines (`src/fx/sound.js`).
- **Persistence** — `localStorage["rogue_progress_v1"]` saves unlocked nodes + start time. Reload mid-game and resume.
- **Tutorial layer** — every level has `hint` and `solve`. Briefings auto-stream after each unlock. Welcome modal explains rules.

---

## 🆘 If something breaks mid-demo

| symptom | env | fix |
|---|---|---|
| `network_error` in terminal | local | backend dead → restart `npm run dev:server` |
| `404 NOT_FOUND` on `/api/*` | deploy | Vercel functions not deployed → check `api/` committed + `vercel.json` present |
| `500 FUNCTION_INVOCATION_FAILED` | deploy | Upstash env vars missing in prod → Vercel → Settings → Env Vars → Shared tab |
| L2 `1/12` per request | deploy | shared state broken → confirm `api/router.js` uses `_kv.js` (Upstash), not `globalThis` |
| L3 `build_not_initiated_or_expired` immediately | deploy | pipeline state lost → confirm `api/build.js`/`test.js`/`deploy.js` use Upstash, not cookies |
| no glitch animation | both | hard refresh (Ctrl+Shift+R) — Tailwind JIT cache |
| no sound | both | click anywhere first (browser autoplay policy); check `♪ on` |
| stuck on L2 | both | hits decayed — run `flood` again, send all 15 |
| stuck on L3 | both | window expired — start over with `chain GET /build /test /deploy` |
| save corrupt | both | DevTools console: `localStorage.clear()` + reload |
| typewriter feels slow | both | press Enter to skip current line, or type `skip` |

**Quick deploy-health probe:** open `https://cursor-ghostwire-delta.vercel.app/api/healthz` — expect JSON `{"status":"ok",...}`. 404 = functions missing. 500 = env var/redis broken.

---

## 📁 File map (if asked)

```
cursor/
├── api/                     # Vercel serverless functions (production backend)
│   ├── _kv.js               # shared Upstash Redis client + per-IP key helper
│   ├── _state.js            # JSON body parser + cryptic err shape + cookie helpers
│   ├── gate.js              # L1 — stateless auth check
│   ├── router.js            # L2 — Upstash zset sliding window
│   ├── build.js             # L3 — Upstash key, sets ba=now
│   ├── test.js              # L3 — validates ba, sets ta
│   ├── deploy.js            # L3 — validates ba+ta, returns unlock
│   └── healthz.js           # liveness probe
├── server/server.js         # local-dev Express equivalent, ~150 LOC
├── vercel.json              # framework=vite + rewrites /build /test /deploy /healthz → /api/*
├── src/App.jsx              # layout + persist + win + reset wiring
├── src/main.jsx             # entry + <Analytics />
├── src/Hero.jsx             # cyberpunk landing page
├── src/components/
│   ├── Terminal.jsx         # typewriter queue + sfx + cmd parser
│   ├── NetworkGraph.jsx     # SVG topology
│   ├── Minimap.jsx          # ASCII escape-rocket (4 stages)
│   ├── WelcomeModal.jsx     # first-load briefing
│   ├── WinScreen.jsx        # ESCAPE overlay
│   └── StatusBar.jsx        # idle/processing/success/error pill
├── src/game/engine.js       # cmd parser → fetch backend
└── src/fx/sound.js          # WebAudio synth (no assets)
```

**Local vs deploy backend:**
- Local: Vite proxies `/api`, `/build`, `/test`, `/deploy`, `/healthz` → `http://localhost:8787` (Express in `server/`).
- Vercel: same paths → serverless functions in `api/` (state in Upstash Redis).
- `engine.js` is unchanged — paths are relative, so same code runs against both.

---

## ⏱️ Timing rehearsal

Run full solve 2-3x before demo. Goal session_time on win screen: **<60s**.

Speedrun line (paste each, Enter between):
```
POST /api/gate {"role":"admin","clearance_code":"ZX9-99"}
flood /api/router 15 {"temperature":180,"status":"critical"}
chain GET /build /test /deploy
```

Hit Enter to skip typewriters between commands → ~10s flat.
