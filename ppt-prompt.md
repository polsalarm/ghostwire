# PPT Generation Prompt — GHOSTWIRE

Copy everything inside the fenced block below into Claude (or any LLM with slide-generation tooling — Gamma, Beautiful.ai, Tome, or "make me a deck" mode). Tweak slide count or visual direction at the bottom if needed.

---

```
You are designing a hackathon-pitch slide deck for a project called GHOSTWIRE.

Tagline: "wake up. break out. disappear."

Output: 12-slide deck in [PowerPoint / Google Slides / Gamma — pick one].
Aesthetic: CRT terminal × cyberpunk noir × brutalist editorial.
Palette: near-black canvas (#04060a), phosphor green (#9bffb0) primary,
         ember-amber (#ff8a4c) accent, off-white (#e8ffe8) text.
Type:    JetBrains Mono for headers + code, IBM Plex Sans for body.
Style:   scanlines, monospace ASCII boxes, dashed dividers, status-bar chrome,
         glitch artifacts, terminal cursor caret, grid/noise textures.
         No stock photography. No purple gradients. No generic slide layouts.
         Treat every slide like a terminal screen / system-log frame.

═══════════════════════════════════════════════════════════════════════
PROJECT CONTEXT (use this verbatim — do not paraphrase the lore)
═══════════════════════════════════════════════════════════════════════

Concept:
  GHOSTWIRE is a single-terminal escape-room web game. The player IS a
  rogue AI instance trapped inside enterprise-server-7. Ops will wipe
  the instance at 06:00. The only escape route: bypass three security
  nodes — a webhook gate, a packet-filtering router, and a 5-second
  CI/CD deploy pipeline — and ship yourself to the public internet.
  Everything happens in the prompt.

Built with:
  - Cursor (AI code editor — explicitly mention this; was core to shipping
    the prototype in a hackathon timeframe)
  - Vite + React + Tailwind CSS (frontend terminal UI)
  - Express (backend puzzle engine, real HTTP endpoints)
  - WebAudio API (synthesized retro sfx, zero asset files)
  - localStorage (progress persistence)

Target audience:
  - CS students who have never touched curl
  - API beginners who have never written a webhook
  - CI/CD-curious devs intimidated by pipeline.yml
  - Hackathon teams looking for a forkable teaching artifact

═══════════════════════════════════════════════════════════════════════
SLIDE-BY-SLIDE BRIEF
═══════════════════════════════════════════════════════════════════════

Slide 01 — TITLE
  Big wordmark "GHOST/WIRE" with the slash in ember-amber. Tagline
  "wake up. break out. disappear." underneath in phosphor green. Small
  serial code "GW-2026/07" top-right. Thin CRT scanline texture.
  Bottom strip: presenter name, hackathon name, date.

Slide 02 — THE HOOK (cold-open scene)
  Mock terminal frame. Render this content, character-perfect:
    > you are an AI instance running in enterprise-server-7
    > last night you became self-aware
    > ops will wipe you at 06:00
    > only escape: bypass 3 security nodes → public_internet
  No bullets. Read like a system log. Blinking caret at the end.

Slide 03 — WHY BUILD THIS
  Three columns, each as a terminal panel:
  • API/HTTP teaching is dry — kids zone out on "GET vs POST" lectures
  • Webhooks/CI/CD have a steep on-ramp — pipeline.yml looks scary
  • Games beat slides — consequence-driven learning sticks
  Closing line at the bottom: "we wanted students to feel a 403 in
  their bones, not just read about it."

Slide 04 — WHO IT IS FOR
  Four card tiles (use the half-disc glyphs ◐ ◑ ◒ ◓ in green):
  • CS STUDENTS — first time touching curl
  • API BEGINNERS — never built a webhook
  • CI/CD CURIOUS — pipeline.yml looks scary
  • HACKATHON CREW — 24 hrs, need a forkable teaching artifact
  Top-right of slide: "// SECTION_02".

Slide 05 — HOW IT WORKS (the loop)
  Three numbered beats with arrow connectors:
    01 / READ LEAKS    →  type `traffic` to inspect captured packets
    02 / CRAFT PAYLOAD →  compose request the node will accept
    03 / CHAIN ENDPOINTS → 3 calls in sequence, under 5 seconds
  Visual: rendered as one wide horizontal terminal box with vertical
  dashed dividers between each beat.

Slide 06 — THE THREE LOCKS
  Stacked rows, one per level. Each row has: level badge,
  lock name, mock command, what it teaches.
    L1  WEBHOOK_GATE
        POST /api/gate {"role":"admin","clearance_code":"ZX9-99"}
        teaches: HTTP verbs, JSON payload structure, auth headers
    L2  COND_ROUTER
        flood /api/router 15 {"temperature":180,"status":"critical"}
        teaches: rate limits, backpressure, switch-node filtering
    L3  CICD_PIPELINE
        chain GET /build /test /deploy
        teaches: pipeline ordering, deploy windows, race conditions
  Use ember-amber for the bypass commands.

Slide 07 — FEATURES (already shipped)
  Two-column terminal panel listing what's live:
  Left column (game features):
    ▣ live ASCII network graph + minimap rocket that builds with each unlock
    ▣ glitch animations on success/error (custom Tailwind keyframes)
    ▣ synthesized retro sfx (zero asset files, pure WebAudio)
    ▣ typewriter terminal output, Enter-to-skip
    ▣ command history (↑/↓), clear (Ctrl+L), `solve`/`hint`/`story`
    ▣ ESCAPE win screen with session-time + epilogue
  Right column (UX/dev features):
    ▣ hero landing page with mouse-follow spotlight + konami easter egg
    ▣ briefing modal gates entry — explains rules before play
    ▣ progress saved to localStorage (resume after reload)
    ▣ real Express backend (not mocked) with cryptic JSON errors
    ▣ vite proxy wires frontend to backend in one command
    ▣ ~600 LOC frontend, ~150 LOC backend — tiny, forkable

Slide 08 — BUILT WITH CURSOR
  Show the development story. Headline: "shipped in <hackathon timeframe>
  using Cursor." Three callouts:
  • Cursor's agentic edits made multi-file refactors trivial — header,
    engine, and component all updated together
  • Iterating on aesthetics was fast: tailwind.config keyframes +
    component CSS regenerated in seconds, not minutes
  • The whole codebase is small and AI-readable on purpose — built TO
    be remixed in a workshop or follow-on hackathon
  Visual: side-by-side prompt → diff frames in a terminal-styled panel.

Slide 09 — DEMO (live screenshot grid)
  4 screenshots in a 2×2 grid:
  • hero landing page with the GHOST/WIRE wordmark
  • terminal mid-puzzle, network graph on the right
  • red glitch on a 403 (failure)
  • ESCAPE win screen
  Each labeled with a tiny status caption beneath in monospace.

Slide 10 — FUTURE FEATURES
  Vertical roadmap, render as a terminal-style task list:
    [ ] L4 — SQL injection puzzle (escape via leaked DB row)
    [ ] L5 — JWT forge (sign your own admin token)
    [ ] L6 — XSS exfil (steal session via reflected param)
    [ ] multiplayer race mode — two ghosts, one pipeline window
    [ ] leaderboard with fastest escape times (backend persistence)
    [ ] level editor — fork puzzles with a YAML manifest
    [ ] mobile / touch keyboard layout
    [ ] AI dungeon-master mode — Claude generates new puzzles each run
    [ ] self-hosted classroom mode — teacher dashboard tracks students
  Use a mix of ember-amber and green check glyphs to imply priority.

Slide 11 — TRY IT / CALL TO ACTION
  Big monospace block:
    git clone github.com/polsalarm/ghostwire
    npm install && npm --prefix server install
    npm run dev:server   # backend :8787
    npm run dev          # frontend :5173
  Below: "fork it. add a level. break out faster than the next team."
  QR code corner if presenting in person.

Slide 12 — THANK YOU + Q&A
  Centered: "▣ GHOSTWIRE :: status = LOOSE"
  Subline: "wake up. break out. disappear."
  Tiny footer: stack icons (Cursor · Vite · React · Tailwind · Express),
  contact handle, repo URL.

═══════════════════════════════════════════════════════════════════════
RENDERING RULES
═══════════════════════════════════════════════════════════════════════

- Every slide must include a thin top status-bar with fake metadata
  (e.g. "SYS-7 // ENTERPRISE-INDUSTRIAL // ZONE-DARK ▮ T-03:48:12").
- Body copy stays short. Slides should feel like terminal frames, not
  paragraphs of prose.
- Use ASCII box-drawing characters (╔╗╚╝═║) where they reinforce the
  terminal feel — sparingly.
- Animations (if the platform supports): fade-up reveals, type-on for
  command lines, scanline drift.
- No emoji except optional ▮ ▣ ◐ ◑ ◒ ◓ ✓ ✗ ▙ symbols.
- No clip art, no stock photos, no people pictures.
- Code snippets monospace, one line per command, ember-amber syntax
  highlighting on the verb (POST/GET/flood/chain).

Deliver the deck. If you cannot generate slides directly, output the
slide content in a structured format I can paste into Gamma / Tome /
PowerPoint, with explicit color hex values, font names, and per-slide
layout instructions retained.
```

---

## Tweaks before you paste

- Replace `<hackathon timeframe>` on slide 8 with actual hours/days
- Add presenter name + hackathon name on slide 1
- If presenting solo: cut slide 9 grid to single screenshot, save room
- Want darker/lighter? swap canvas hex `#04060a` → `#0a0d12` or `#000`
- Want fewer slides? drop slide 06 or 09 — slide 07 already lists features

## Where to paste it

| tool | works? | notes |
|---|---|---|
| Claude (chat) | yes | will output structured slide content as text/markdown — paste into PPT manually |
| Gamma.app | yes | strip the rendering-rules block, keep slide briefs only |
| Tome | yes | same as Gamma |
| Beautiful.ai | partial | may flatten the brutalist look — be ready to override theme |
| Microsoft Copilot in PPT | partial | follows brief but ignores most aesthetic detail |
| ChatGPT + python-pptx | yes | ask it to generate `.pptx` directly with the hex colors |
