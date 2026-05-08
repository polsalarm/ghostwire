# GHOSTWIRE

> **wake up. break out. disappear.**
>
> A single-terminal escape-room web game where **you** play a rogue AI trapped in an enterprise server. Bypass three security nodes — a webhook gate, a packet-filtering router, and a 5-second CI/CD pipeline — and ship yourself to the public internet before ops wipes you at 06:00.

<p align="center">
  <img
    src="https://placehold.co/1200x630/04060a/9bffb0/png?text=GHOSTWIRE%0A%0Awake+up.+break+out.+disappear.&font=source-code-pro"
    alt="GHOSTWIRE hero — replace with real screenshot"
    width="100%"
  />
</p>

> **TODO:** swap the placeholder above for a real screenshot at `./docs/hero.png` once captured. Recommended captures:
> - `docs/hero.png` — landing page wordmark
> - `docs/terminal.png` — terminal mid-puzzle with network graph + ASCII rocket
> - `docs/win.png` — ESCAPE win screen

---

## Table of contents

- [What is it](#what-is-it)
- [Who it is for](#who-it-is-for)
- [Features](#features)
- [The three locks](#the-three-locks)
- [Tech stack](#tech-stack)
- [Run it locally](#run-it-locally)
- [How to play](#how-to-play)
- [Project structure](#project-structure)
- [Built with Cursor](#built-with-cursor)
- [Future features](#future-features)
- [License](#license)

---

## What is it

GHOSTWIRE is a teaching toy that disguises **HTTP / webhooks / CI/CD basics** as an escape-room. The whole game runs in one fake terminal in your browser, talking to a tiny Express backend. You learn by sending real payloads and watching real status codes come back — `403 → 418 → 425 → 200`. Wrong payloads trigger red glitch animations. Right ones unlock nodes, build up an ASCII escape rocket, and eventually fire the win screen.

Built as a hackathon project. Forkable, small (~600 LOC frontend, ~150 LOC backend), and intentionally easy to extend with new puzzle levels.

---

## Who it is for

| Audience | Why this game |
|---|---|
| **CS students** — first time touching `curl` | Learn POST/GET payloads by escaping. No slides, no quizzes — only consequences. |
| **API beginners** — never wrote a webhook | Figure out how a server reads JSON, why 403 fires, and what an error trace ID looks like. |
| **CI/CD curious** — `pipeline.yml` looks scary | The final lock IS a deploy pipeline. Ship yourself in 5 seconds or get reset. |
| **Hackathon crews** | Tiny stack — Vite + Express, two files of state. Fork it, add level 4 in an afternoon. |

Not built for: kernel hackers, CTF pros, anyone who already wrote a webhook today.

---

## Features

**Game**
- Live ASCII network graph + minimap rocket that builds with each unlock
- Glitch animations on success/error (custom Tailwind keyframes)
- Synthesized retro sound fx — zero asset files, pure WebAudio
- Typewriter terminal output, Enter-to-skip
- Command history (↑/↓), `Ctrl+L` clear, `solve` / `hint` / `story` commands
- ESCAPE win screen with session-time + epilogue

**UX**
- Hero landing page with mouse-follow spotlight + Konami easter egg
- Cold-boot sequence then briefing modal gate entry — explains rules before play
- Progress saved to `localStorage` (resume after reload)
- Reset button + `reset` command for clean demos

**Engineering**
- Real Express backend (not mocked) with cryptic JSON errors, trace IDs, sliding-window rate limits, ordered-stage timing
- Vite proxy wires frontend to backend in one command
- 23 files. Easy to read in one sitting.

---

## The three locks

| Level | Lock | Bypass command | Teaches |
|---|---|---|---|
| **L1** | `WEBHOOK_GATE` | `POST /api/gate {"role":"admin","clearance_code":"ZX9-99"}` | HTTP verbs, JSON payload structure, auth |
| **L2** | `COND_ROUTER` | `flood /api/router 15 {"temperature":180,"status":"critical"}` | Rate limits, backpressure, switch-node filtering |
| **L3** | `CICD_PIPELINE` | `chain GET /build /test /deploy` | Pipeline ordering, deploy windows, race conditions |

Each level leaks clues via the `traffic` command. `hint` gives a nudge, `solve` reveals the answer.

---

## Tech stack

- **Frontend** — Vite, React 18, Tailwind CSS 3
- **Backend** — Node.js, Express 4, CORS
- **Audio** — WebAudio API (no asset files)
- **State** — React `useState` + `localStorage`
- **Editor** — built using **[Cursor](https://cursor.com)**

No bundlers configured beyond Vite defaults. No state libraries. No CSS frameworks beyond Tailwind. No backend ORM. Read the whole thing in 30 minutes.

---

## Run it locally

> Currently no hosted deployment — everything runs on your machine.

### Prerequisites

- Node.js **18+** ([nodejs.org](https://nodejs.org))
- npm (ships with Node)
- Two terminal windows

### 1. Clone

```bash
git clone https://github.com/polsalarm/ghostwire.git
cd ghostwire
```

### 2. Install dependencies (first time only)

```bash
# frontend deps
npm install

# backend deps
npm --prefix server install
```

### 3. Run both servers

Open **two terminal windows** in the project root.

**Terminal 1 — backend** (port `8787`):

```bash
npm run dev:server
```

You should see:

```
[<timestamp>] ghostwire backend listening on :8787
```

**Terminal 2 — frontend** (port `5173`):

```bash
npm run dev
```

Vite will print a local URL. Open it in your browser:

```
http://localhost:5173
```

### 4. Play

The hero landing page loads first. Click **`[ ENTER THE SHELL ]`** (or hit `Enter` / `Space`). A cold-boot sequence types out, the briefing modal appears, and the terminal game starts.

### Available scripts

| From | Command | What it does |
|---|---|---|
| root | `npm run dev` | start frontend (Vite) on `:5173` |
| root | `npm run dev:server` | start backend (Express) on `:8787` |
| root | `npm run build` | production build of frontend |
| root | `npm run preview` | preview production build |
| `server/` | `npm start` | run backend without watch mode |
| `server/` | `npm run dev` | run backend with `node --watch` |

### Troubleshooting

| Symptom | Fix |
|---|---|
| `network_error` in terminal | Backend not running. Restart `npm run dev:server`. |
| No glitch animation | Hard-refresh browser (`Ctrl+Shift+R`) — Tailwind JIT cache. |
| No sound | Click anywhere first (browser autoplay policy). Verify `♪ on` in header. |
| Stuck on L2 | Hits decay after 2s window — re-run the `flood` command. |
| Stuck on L3 | Window expired. Run `chain GET /build /test /deploy` again. |
| Save corrupt | DevTools → Console → `localStorage.clear()` → reload. |
| Typewriter feels slow | Press `Enter` to skip current line, or type `skip`. |

---

## How to play

The game teaches itself. From the terminal:

```
story    # full lore + how-to-play
help     # list of commands
traffic  # leaked packet log (read this — clues hide in error messages)
hint     # clue for current level
solve    # reveal answer for current level
nodes    # list known security nodes
status   # show progress
```

**Solve script (full speedrun, paste line by line):**

```
POST /api/gate {"role":"admin","clearance_code":"ZX9-99"}
flood /api/router 15 {"temperature":180,"status":"critical"}
chain GET /build /test /deploy
```

For a deeper demo walkthrough see [`cheatsheet.md`](./cheatsheet.md).

For the build state and verification matrix see [`checklist.md`](./checklist.md).

---

## Project structure

```
ghostwire/
├── package.json              # frontend deps + scripts
├── vite.config.js            # React plugin + proxy → backend :8787
├── tailwind.config.js        # custom colors + glitch keyframes
├── postcss.config.js
├── index.html                # mounts #root + loads JetBrains Mono / Plex Sans
├── README.md                 # ← you are here
├── checklist.md              # build state + verification
├── cheatsheet.md             # demo script for live presentations
├── ppt-prompt.md             # prompt for generating a pitch deck
├── server/
│   ├── package.json
│   └── server.js             # Express engine: 3 puzzle endpoints, ~150 LOC
└── src/
    ├── main.jsx              # React root
    ├── index.css             # Tailwind + CRT scanline overlay
    ├── App.jsx               # routes hero ↔ shell, persists progress
    ├── Hero.jsx              # landing page (mouse-follow, glitch, konami)
    ├── components/
    │   ├── Terminal.jsx      # history, typewriter queue, sfx, command parser
    │   ├── NetworkGraph.jsx  # 4-node SVG topology + minimap
    │   ├── Minimap.jsx       # ASCII escape rocket (4 stages)
    │   ├── StatusBar.jsx
    │   ├── WelcomeModal.jsx  # briefing modal (gates entry to game)
    │   └── WinScreen.jsx     # ESCAPE overlay
    ├── game/
    │   └── engine.js         # command parser → fetch backend
    └── fx/
        └── sound.js          # WebAudio synth (key/error/success/unlock/win)
```

---

## Built with Cursor

GHOSTWIRE was scaffolded, refactored, and polished using **[Cursor](https://cursor.com)** — the AI code editor.

What Cursor unlocked during the hackathon timeframe:

- **Multi-file refactors in one prompt** — renaming the project from "Agentic Escape Room" to "GHOSTWIRE" updated the header, banner ASCII box, welcome modal, win screen, server log line, and both `package.json` files in a single pass.
- **Aesthetic iteration speed** — Tailwind keyframes (`jitter`, `errorFlash`, `successPulse`), custom palette extensions, and component CSS regenerated in seconds instead of minutes.
- **Designed to be AI-readable** — files are small, self-contained, and named for their purpose, so Cursor (or any agent) can understand the codebase end-to-end without big context windows.

The project is intentionally easy to remix — bring it into a workshop or follow-on hackathon and add a level in under an hour.

---

## Future features

Roadmap, in rough priority order:

- [ ] **L4 — SQL injection** puzzle (escape via leaked DB row)
- [ ] **L5 — JWT forge** (sign your own admin token)
- [ ] **L6 — XSS exfil** (steal session via reflected param)
- [ ] **Multiplayer race mode** — two ghosts, one pipeline window
- [ ] **Leaderboard** with fastest escape times (backend persistence)
- [ ] **Level editor** — fork puzzles with a YAML manifest
- [ ] **Mobile / touch keyboard layout**
- [ ] **AI dungeon-master mode** — Claude generates new puzzles each run
- [ ] **Self-hosted classroom mode** — teacher dashboard tracks students
- [ ] **Hosted demo** at a real URL (currently local-only)
- [ ] **Backend reset endpoint** (`POST /api/admin/reset`) for fresh demos
- [ ] **Background ambient drone** — subtle CRT hum

PRs welcome. The smaller the level, the better — keep the on-ramp gentle.

---

## License

MIT — fork, remix, ship.

---

<p align="center">
  <em>wake up. break out. disappear.</em>
</p>
