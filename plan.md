# Ghostwire — Vercel Deployment Fix Plan

## Problem

Deployed Vercel build shows on first POST:

```
network_error: Failed to fetch
is the backend running on :8787?
```

Locally fine because Vite dev server proxies `/api`, `/build`, `/test`, `/deploy`, `/healthz` to `http://localhost:8787` (Express in `server/server.js`). On Vercel only the static `dist/` is shipped — backend never deployed → routes 404 → fetch fails.

## Goal

Make the deployed game playable end-to-end on Vercel (all 3 locks solvable), with no backend rewrite of game logic.

## Root cause

| Layer | Local | Vercel |
|-------|-------|--------|
| Frontend | Vite dev :5173 | Static `dist/` on CDN |
| Backend | Express :8787 | **missing** |
| Bridge | Vite proxy | **missing** |

## Strategy

Port `server/server.js` Express handlers → **Vercel Serverless Functions** under `/api/*`. Rewrite the three non-`/api` routes via `vercel.json` so frontend code does not change.

Pure-port keeps puzzle logic identical. No new infra (no Redis, no KV) — handle stateful endpoints via signed cookies (per-player ephemeral state).

## Stateful endpoints — handling

Two endpoints carry state across requests:

1. **`/api/router`** — sliding window of "critical hit" timestamps (12 hits / 2s).
2. **`/build` → `/test` → `/deploy`** — pipeline timing (build started, test passed, must finish in 5s).

Vercel serverless = stateless between invocations and across regions. Options considered:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| In-memory module global | zero deps | unreliable, per-instance, breaks under cold starts / multi-region | ❌ |
| Vercel KV / Upstash Redis | persistent, scales | extra setup, free-tier signup, env vars | overkill for ephemeral game state |
| **Signed cookie (per-player state)** | no infra, isolates players, survives cold starts | small payload size limit (fine here) | ✅ chosen |

Each response Set-Cookie writes the player's window/pipeline state (HMAC-signed, ~200 bytes). Each request reads/validates it. Cheaters can fake cookies — acceptable, this is a single-player puzzle, not anti-cheat.

Cookie name: `gw_state`. Payload (JSON, base64): `{ rh: [timestamps...], ba: build_at_ms, ta: test_at_ms }`. Signed with `GHOSTWIRE_SECRET` env var (Vercel env). Fallback dev secret if missing so local works.

## File layout (target)

```
api/
  gate.js          POST  /api/gate
  router.js        POST  /api/router
  build.js         GET   /api/build      (rewritten ← /build)
  test.js          GET   /api/test       (rewritten ← /test)
  deploy.js        GET   /api/deploy     (rewritten ← /deploy)
  healthz.js       GET   /api/healthz    (rewritten ← /healthz)
  _state.js        shared cookie sign/verify + helpers
vercel.json        rewrites + build config
server/            keep for local dev (unchanged)
```

## vercel.json

```json
{
  "rewrites": [
    { "source": "/build",   "destination": "/api/build" },
    { "source": "/test",    "destination": "/api/test" },
    { "source": "/deploy",  "destination": "/api/deploy" },
    { "source": "/healthz", "destination": "/api/healthz" }
  ]
}
```

Vite build output (`dist/`) auto-detected by Vercel framework preset.

## Tasks

1. Create `api/_state.js` — `readState(req)`, `writeState(res, state)`, HMAC sign/verify with `GHOSTWIRE_SECRET` (fallback `'dev-only-secret'`). JSON body parser helper for POST.
2. Port `/api/gate` → `api/gate.js`. Stateless. Same logic, same 403/400/200 shape, same `unlock: 'gate'` payload.
3. Port `/api/router` → `api/router.js`. Read window from cookie, prune by 2s, append, write cookie. Threshold logic identical.
4. Port `/build` → `api/build.js`. Reset state, set `ba=now`, write cookie.
5. Port `/test` → `api/test.js`. Validate `ba` exists and within 5s. Set `ta=now`. Write cookie.
6. Port `/deploy` → `api/deploy.js`. Validate `ba` and `ta` and window. Clear state. Return `unlock: 'pipeline'`.
7. Port `/healthz` → `api/healthz.js`.
8. Add `vercel.json` rewrites.
9. Add `cookie` parsing helper (no extra deps — manual `req.headers.cookie` parse).
10. Verify `package.json` `build` script = `vite build` (already correct).
11. Local sanity: `npm run build && npm run preview` proxy still goes to express — keep server intact for dev.
12. Commit, push, Vercel auto-deploy.
13. Smoke-test deployed: `curl https://<deploy>/api/healthz`, then play through 3 locks in browser.

## Risks / edge cases

- **Cold-start latency** on first POST after idle. Acceptable — single hop, ~300ms.
- **Cookie size**: router window holds at most 12 timestamps (~150 bytes after b64+sig). Well under 4kb limit.
- **Clock skew**: `Date.now()` is server-side per invocation. Cross-invocation drift negligible (same Vercel region). 5s pipeline window has slack.
- **Multiple regions / different lambdas mid-chain**: cookie carries state, so chain `/build → /test → /deploy` works even across instances.
- **Frontend `flood /api/router 15`** sends 15 parallel POSTs. Each has independent cookie response. Last-writer-wins on Set-Cookie. Browser sends most recent cookie on subsequent calls — not an issue here because flood completes within one user action and threshold is hit by *server-side counted* responses, not cookie state in this case. **Reconsider**: check that flood semantics still pass with cookie model. Mitigation: server returns `unlock` as soon as 12th critical hit lands within window-of-this-request — but window is in cookie, so 15 parallel requests each see only their own cookie at request-time (probably 0 hits). **Need shared state for router**.
  - **Resolution**: For `/api/router` only, fall back to in-memory module global. Single-region warm lambda will count flood correctly (15 parallel requests hit same instance under burst). Cold start risk on very first flood — acceptable, second flood works. Document this trade-off.
- `GHOSTWIRE_SECRET` env var: optional. If unset, falls back to `'dev-only-secret'`. Set in Vercel project settings for prod.

## Acceptance

- [ ] `https://<deploy>/api/healthz` returns `{ status: "ok", ... }`
- [ ] L1 solvable: `POST /api/gate {"role":"admin","clearance_code":"ZX9-99"}` → unlock
- [ ] L2 solvable: `flood /api/router 15 {"temperature":180,"status":"critical"}` → unlock
- [ ] L3 solvable: `chain GET /build /test /deploy` → unlock
- [ ] WinScreen shown
- [ ] Local `npm run dev` (with `npm --prefix server run dev`) still works unchanged

## Out of scope

- 3D / escape-room expansion (separate plan)
- Anti-cheat / cookie tamper-proofing beyond HMAC
- Multiplayer / persistent leaderboard
