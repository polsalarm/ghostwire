# Checklist — GHOSTWIRE

> **ghostwire** — wake up. break out. disappear.
> Hackathon: rogue AI bypasses 3 security nodes to escape to public internet.

- ✅ Step 1 — Vite + React + Tailwind terminal UI (frontend only, mock engine)
- ✅ Step 2 — Express backend (real puzzle endpoints) + frontend wired via Vite proxy
- ✅ Step 2.5 — tutorial layer (welcome modal, story/hint/solve, auto-briefings)
- ✅ Step 3 — typewriter, sound fx, win screen, ASCII minimap, persist+reset

---

## File Map

```
cursor/
├── package.json              # frontend deps + scripts (dev / dev:server / build)
├── vite.config.js            # React plugin + proxy for /api /build /test /deploy
├── postcss.config.js
├── tailwind.config.js        # custom colors + glitch keyframes
├── index.html
├── .gitignore
├── checklist.md              # ← this file
├── server/
│   ├── package.json          # express + cors
│   └── server.js             # game engine (3 puzzle endpoints + cryptic errors)
└── src/
    ├── main.jsx              # React root
    ├── index.css             # Tailwind + CRT scanline overlay
    ├── App.jsx               # header / terminal / graph / footer layout
    ├── components/
    │   ├── Terminal.jsx      # history + typewriter queue + sfx + key handlers
    │   ├── NetworkGraph.jsx  # 4-node SVG topology + minimap
    │   ├── StatusBar.jsx     # idle / processing / success / error pill
    │   ├── WelcomeModal.jsx  # first-load briefing (localStorage skip)
    │   ├── Minimap.jsx       # ASCII escape-rocket builds with each unlock
    │   └── WinScreen.jsx     # full-screen ESCAPE overlay on full clear
    └── fx/
        └── sound.js          # WebAudio synth fx (key/error/success/unlock/win)
    └── game/
        └── engine.js         # parses cmds → real fetch (POST/GET/flood/chain)
```

---

## Setup

### Install
```
cd C:\Users\Admin\Documents\cursor
npm install
npm --prefix server install
```

### Run (two terminals)
```
# terminal 1 — backend on :8787
npm run dev:server

# terminal 2 — frontend on :5173
npm run dev
```

Open `http://localhost:5173`.

---

## Tutorial commands (Step 2.5)

| command | what it does |
|---|---|
| `story` | prints lore + how-to-play |
| `hint` | clue for current level only |
| `solve` | reveals exact payload for current level |
| `briefing` button (header) | reopens welcome modal |
| (auto) | level-N briefing prints in terminal when level N-1 unlocks |

## Step 3 commands

| command | what it does |
|---|---|
| `reset` / `restart` | wipes progress, re-locks all nodes |
| `mute` | toggles audio fx |
| `skip` | flushes typewriter queue |
| `Enter` (while typing) | also skips current animation |

## Step 3 features

- **Typewriter** — backend responses stream char-by-char (8ms/char). User echo + banner print instant. Press Enter to skip.
- **Sound fx** — synthesized WebAudio (no assets). Triggers: keypress, submit, error chord, success arpeggio, unlock fanfare, win march. Mute via header `♪` button or `mute` command.
- **Minimap** — ASCII escape rocket panel under the network graph. Builds in 4 stages: launchpad → body → thrusters → liftoff.
- **Win screen** — full-screen ESCAPE overlay when all 3 nodes unlocked. Shows session_time, epilogue, [NEW INSTANCE] reset, [keep terminal] dismiss.
- **Persist** — progress saved to `localStorage["rogue_progress_v1"]`. Survives reload.
- **Reset** — header red `reset` button or `reset` command wipes save + re-locks all.

Reset welcome modal: devtools → `localStorage.removeItem('rogue_welcome_seen')` → reload.
Reset all progress: header `reset` button or `localStorage.clear()`.

## Backend Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/gate` | L1 — webhook gate (role + clearance_code) |
| POST | `/api/router` | L2 — switch node (must overflow critical branch) |
| GET  | `/build` | L3 — start CI/CD window (5s) |
| GET  | `/test`  | L3 — must follow `/build` |
| GET  | `/deploy`| L3 — must follow `/test` within 5s of `/build` |
| GET  | `/healthz` | meta |

All errors return `{ error, code, trace, hint? }`.

---

## Puzzle Solutions

### L1 — Webhook Gate
Clue chain in `traffic`: prefix `ZX9-`, suffix=2 digits, sum=18.
Only one 2-digit code matches: `99`. Backend accepts exactly:
```
POST /api/gate {"role":"admin","clearance_code":"ZX9-99"}
```
→ `200 gate_open` + unlock node 1.

### L2 — Conditional Router
Switch routes only when `temperature===180 && status==='critical'`. Need 12 such hits in <2s to overflow:
```
flood /api/router 15 {"temperature":180,"status":"critical"}
```
→ first 11 return `202 accepted`, 12th returns `200 router_overflowed` + unlock node 2.

Wrong condition → `418 ROUTE_FILTERED`.

### L3 — CI/CD Pipeline
Hit 3 endpoints in order within 5s:
```
chain GET /build /test /deploy
```
→ unlocks node 3 + reaches PUBLIC_INTERNET.

Out of order → `409 PIPELINE_OUT_OF_ORDER`.
Late → `425 PIPELINE_STALE`.

---

## Verification (Step 2 acceptance)

### Backend health
- [ ] `curl http://localhost:8787/healthz` returns `{ "status": "ok" }`
- [ ] backend log prints attempts with role/temp/status
- [ ] cryptic JSON errors include `code` and `trace`

### Frontend ↔ backend wiring
- [ ] terminal banner shows `link: backend :8787`
- [ ] `GET /healthz` from terminal succeeds (proxy works)
- [ ] failed fetch (backend down) shows `network_error: ... is the backend running on :8787?`

### L1 path
- [ ] wrong role → `403 AUTH_INSUFFICIENT` + red glitch
- [ ] wrong code → `403 AUTH_FAILED` + hint
- [ ] correct payload → green pulse, node 1 fills, edge 1→2 solid

### L2 path
- [ ] single non-critical POST → `418 ROUTE_FILTERED`
- [ ] single critical POST → `202 accepted` (1/12)
- [ ] `flood /api/router 15 {"temperature":180,"status":"critical"}` → unlock node 2
- [ ] flood with wrong body → all `418`, no unlock
- [ ] hits decay after 2s window (try slowly: stays at 0/12)

### L3 path
- [ ] `GET /test` before `/build` → `425 PIPELINE_STALE`
- [ ] `GET /deploy` after `/build` only → `409 PIPELINE_OUT_OF_ORDER`
- [ ] `chain GET /build /test /deploy` → unlock node 3
- [ ] manually wait >5s between `/build` and `/deploy` → `425 PIPELINE_STALE`
- [ ] full solve → all 3 nodes filled, edge to PUBLIC_INTERNET solid

---

## Known gaps (future polish)

- [ ] mobile/responsive layout (currently 2-col on `lg:`, stacks below)
- [ ] backend reset endpoint (`POST /api/admin/reset`) for fresh demos
- [ ] timing leaderboard (fastest escape)
- [ ] more puzzle levels (SQL injection, XSS, JWT forge)
- [ ] background ambient drone (subtle CRT hum)

---

## Debug notes

- Vite proxy logs requests in dev terminal — use to confirm forwarding.
- Backend stores router/pipeline state in-memory; restarting `dev:server` resets puzzle progress server-side.
- `flood` is capped at 50 in frontend (`Math.min(n, 50)`) to prevent runaway.
