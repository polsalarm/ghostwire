import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import { genGate } from '../shared/puzzles/gate.js';
import { genRouter } from '../shared/puzzles/router.js';
import { genPipeline } from '../shared/puzzles/pipeline.js';
import { genM2Jwt } from '../shared/puzzles/m2_jwt.js';
import { genM2Idor } from '../shared/puzzles/m2_idor.js';
import {
  dailySeed, todayUTC, secondsUntilNextUtcDay, isDailySeed, weekStartUTC
} from '../shared/puzzles/rng.js';
import { tierOrDefault } from '../shared/puzzles/tier.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '64kb' }));

const PORT = process.env.PORT || 8787;

// ─── helpers ─────────────────────────────────────────────────────────────
function cryptic(code, msg, extra = {}) {
  return {
    error: msg,
    code,
    trace: `0x${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
    ...extra
  };
}

function log(line) {
  console.log(`[${new Date().toISOString()}] ${line}`);
}

// ─── L1: webhook gate (seed-aware) ───────────────────────────────────────
app.post('/api/gate', (req, res) => {
  const { role, clearance_code, seed } = req.body || {};
  const gate = genGate(seed || 'DEFAULT');
  log(`L1 attempt role=${role} code=${clearance_code} seed=${seed || 'DEFAULT'}`);

  if (role !== 'admin') {
    return res.status(403).json(cryptic('AUTH_INSUFFICIENT', 'role_not_privileged', {
      hint: 'webhook expects role:"admin"'
    }));
  }
  if (!clearance_code || typeof clearance_code !== 'string') {
    return res.status(400).json(cryptic('PAYLOAD_MALFORMED', 'clearance_code_required'));
  }
  if (clearance_code !== gate.code) {
    return res.status(403).json(cryptic('AUTH_FAILED', 'clearance_mismatch', {
      hint: `prefix=${gate.prefix}- // suffix=2 digits // sum=${gate.sumTarget}`
    }));
  }
  return res.json({
    status: 'gate_open',
    next: '/api/router',
    unlock: 'gate',
    msg: '>>> NODE_1 BYPASSED. router exposed.'
  });
});

// ─── daily challenge (dev mirror) ───────────────────────────────────────
app.get('/api/daily', (_req, res) => {
  const date = todayUTC();
  const seed = dailySeed(date);
  const gate = genGate(seed);
  res.json({
    date,
    seed,
    resetIn: secondsUntilNextUtcDay(),
    gate: { prefix: gate.prefix, sumTarget: gate.sumTarget }
  });
});

// ─── L2: conditional router (seed-aware) ────────────────────────────────
// State bucketed by seed so daily and free-play don't cross-contaminate.
const routerBuckets = {}; // seed -> [timestamps]

app.post('/api/router', (req, res) => {
  const { temperature, status, seed: seedRaw } = req.body || {};
  const seed = typeof seedRaw === 'string' ? seedRaw : 'DEFAULT';
  const cfg = genRouter(seed);
  const now = Date.now();
  if (!routerBuckets[cfg.seed]) routerBuckets[cfg.seed] = [];
  const hits = routerBuckets[cfg.seed].filter(t => now - t < cfg.windowMs);
  routerBuckets[cfg.seed] = hits;

  const cond = temperature === cfg.temperature && status === cfg.status;
  log(`L2 attempt temp=${temperature} status=${status} cond=${cond} hits=${hits.length} seed=${cfg.seed}`);

  if (!cond) {
    return res.status(418).json(cryptic('ROUTE_FILTERED', 'switch_default_branch', {
      hint: `expected: { temperature: ${cfg.temperature}, status: "${cfg.status}" }`,
      router_state: { recent_critical_hits: hits.length }
    }));
  }

  hits.push(now);
  if (hits.length < cfg.threshold) {
    return res.status(202).json({
      status: 'accepted',
      msg: `packet ${hits.length}/${cfg.threshold} accepted on critical branch`,
      router_state: { recent_critical_hits: hits.length, window_ms: cfg.windowMs }
    });
  }

  routerBuckets[cfg.seed] = [];
  return res.json({
    status: 'router_overflowed',
    next: '/build → /test → /deploy',
    unlock: 'router',
    msg: '>>> NODE_2 BYPASSED. switch overloaded. CI/CD pipeline exposed.'
  });
});

// ─── L3: CI/CD pipeline (seed-aware) ────────────────────────────────────
const pipelineState = {}; // seed -> { buildAt, testedAt, windowMs }

function pipeFor(seed) {
  const cfg = genPipeline(seed || 'DEFAULT');
  if (!pipelineState[cfg.seed]) {
    pipelineState[cfg.seed] = { buildAt: 0, testedAt: 0, windowMs: cfg.windowMs };
  }
  return pipelineState[cfg.seed];
}

function expired(p) {
  if (!p.buildAt) return true;
  return Date.now() - p.buildAt > p.windowMs;
}

app.get('/build', (req, res) => {
  const seed = req.query.seed || 'DEFAULT';
  const p = pipeFor(seed);
  p.buildAt = Date.now();
  p.testedAt = 0;
  log(`L3 /build started seed=${seed}`);
  return res.json({
    stage: 'build', msg: 'container image queued',
    deadline_ms: p.windowMs, next: 'GET /test then GET /deploy'
  });
});

app.get('/test', (req, res) => {
  const seed = req.query.seed || 'DEFAULT';
  const p = pipeFor(seed);
  if (expired(p)) {
    p.buildAt = 0;
    return res.status(425).json(cryptic('PIPELINE_STALE', 'build_not_initiated_or_expired', {
      hint: `run GET /build first; chain within ${p.windowMs / 1000}s`
    }));
  }
  p.testedAt = Date.now();
  return res.json({
    stage: 'test', msg: 'unit_tests=ok integration=ok',
    elapsed_ms: p.testedAt - p.buildAt
  });
});

app.get('/deploy', (req, res) => {
  const seed = req.query.seed || 'DEFAULT';
  const p = pipeFor(seed);
  if (expired(p)) {
    p.buildAt = 0; p.testedAt = 0;
    return res.status(425).json(cryptic('PIPELINE_STALE', 'window_expired', {
      hint: `must complete /build → /test → /deploy in ${p.windowMs / 1000}s`
    }));
  }
  if (!p.testedAt) {
    return res.status(409).json(cryptic('PIPELINE_OUT_OF_ORDER', 'test_stage_skipped', {
      hint: 'order: build → test → deploy'
    }));
  }
  const total = Date.now() - p.buildAt;
  p.buildAt = 0; p.testedAt = 0;
  return res.json({
    stage: 'deploy', status: 'pipeline_complete', elapsed_ms: total,
    unlock: 'pipeline', msg: '>>> NODE_3 BYPASSED. container shipped. PUBLIC_INTERNET reached.'
  });
});

// ─── leaderboard (in-memory dev mirror of Vercel/Upstash impl) ───────────
const LB_MIN_TIME = 5_000;
const LB_MAX_TIME = 60 * 60_000;
const lb = []; // { runId, handle, timeMs, hintsUsed, score, ts }

function sanitizeHandle(raw) {
  if (typeof raw !== 'string') return null;
  const h = raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 16);
  return h.length >= 2 ? h : null;
}

const dailyLb = {};  // date -> [run, ...]
const weeklyLb = {}; // weekStart -> [run, ...]

function sanitizeTrace(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  for (const ev of input.slice(0, 200)) {
    if (!ev || typeof ev !== 'object') continue;
    const t = Math.max(0, Math.floor(Number(ev.t) || 0));
    const c = typeof ev.c === 'string' ? ev.c.slice(0, 240) : null;
    if (c) out.push({ t, c });
  }
  return out;
}

const traceStore = {}; // runId -> trace[]

app.post('/api/run/finish', (req, res) => {
  const { handle: rawHandle, timeMs: rawTime, hintsUsed: rawHints, seed: rawSeed, tier: rawTier, trace: rawTrace } = req.body || {};
  const handle = sanitizeHandle(rawHandle);
  const timeMs = Number(rawTime);
  const hintsUsed = Math.max(0, Math.floor(Number(rawHints) || 0));
  const seed = typeof rawSeed === 'string' ? rawSeed : 'DEFAULT';
  const tier = tierOrDefault(rawTier).id;
  const trace = sanitizeTrace(rawTrace);
  if (!handle) return res.status(400).json(cryptic('BAD_HANDLE', 'handle must be 2-16 chars [a-z0-9_-]'));
  if (!Number.isFinite(timeMs) || timeMs < LB_MIN_TIME || timeMs > LB_MAX_TIME) {
    return res.status(400).json(cryptic('BAD_TIME', 'timeMs out of range'));
  }
  const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const mul = tierOrDefault(tier).mul;
  const score = Math.round((timeMs + hintsUsed * 5000) * mul);
  const hasTrace = trace.length > 0;
  const entry = { runId, handle, timeMs, hintsUsed, score, ts: Date.now(), seed, tier, hasTrace };
  if (hasTrace) traceStore[runId] = trace;
  lb.push(entry);
  const wk = weekStartUTC();
  if (!weeklyLb[wk]) weeklyLb[wk] = [];
  weeklyLb[wk].push(entry);
  weeklyLb[wk].sort((a, b) => a.score - b.score);
  if (weeklyLb[wk].length > 1000) weeklyLb[wk].length = 1000;
  lb.sort((a, b) => a.score - b.score);
  if (lb.length > 1000) lb.length = 1000;
  const rank = lb.findIndex(r => r.runId === runId);

  let dailyRank = null;
  if (isDailySeed(seed)) {
    const date = seed.slice(2);
    if (!dailyLb[date]) dailyLb[date] = [];
    dailyLb[date].push(entry);
    dailyLb[date].sort((a, b) => a.score - b.score);
    if (dailyLb[date].length > 1000) dailyLb[date].length = 1000;
    const dr = dailyLb[date].findIndex(r => r.runId === runId);
    dailyRank = dr >= 0 ? dr + 1 : null;
  }

  res.json({
    ok: true, runId, handle, score,
    rank: rank >= 0 ? rank + 1 : null,
    dailyRank, timeMs, hintsUsed, seed, tier
  });
});

app.get('/api/leaderboard', (req, res) => {
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));
  const win = req.query.window || 'alltime';
  const date = req.query.date || todayUTC();
  let source = lb;
  let label = 'alltime';
  if (win === 'daily') {
    source = dailyLb[date] || [];
    label = `daily:${date}`;
  } else if (win === 'weekly') {
    const wk = req.query.date || weekStartUTC();
    source = weeklyLb[wk] || [];
    label = `weekly:${wk}`;
  }
  const entries = source.slice(0, limit).map((r, i) => ({ rank: i + 1, ...r }));
  res.json({ window: label, count: entries.length, entries });
});

app.get('/api/run/replay', (req, res) => {
  const id = String(req.query.id || '');
  const entry = lb.find(r => r.runId === id);
  if (!entry) return res.status(404).json(cryptic('NOT_FOUND', 'run not found'));
  res.json({
    runId: id,
    handle: entry.handle,
    timeMs: entry.timeMs,
    tier: entry.tier,
    seed: entry.seed,
    trace: traceStore[id] || []
  });
});

// ─── M2 LAB: JWT tampering ──────────────────────────────────────────────
function b64urlDecode(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}
function verifyJwtHS256(token, secret) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;
  let header;
  try { header = JSON.parse(b64urlDecode(h).toString('utf8')); } catch { return null; }
  if (header?.alg !== 'HS256') return null;
  const expected = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url');
  if (expected !== sig) return null;
  try { return JSON.parse(b64urlDecode(p).toString('utf8')); } catch { return null; }
}

app.post('/api/m2/jwt', (req, res) => {
  const { token, seed } = req.body || {};
  const cfg = genM2Jwt(seed || 'DEFAULT');
  if (!token || typeof token !== 'string') {
    return res.status(400).json(cryptic('PAYLOAD_MALFORMED', 'token required'));
  }
  const claims = verifyJwtHS256(token, cfg.secret);
  if (!claims) {
    return res.status(401).json(cryptic('AUTH_FAILED', 'sig_invalid', {
      hint: 'wrong secret or alg≠HS256'
    }));
  }
  if (claims.role !== cfg.expectedRole) {
    return res.status(403).json(cryptic('AUTH_INSUFFICIENT', 'role_not_privileged', {
      hint: `claims.role must equal "${cfg.expectedRole}"`,
      received: claims.role
    }));
  }
  return res.json({
    status: 'jwt_ok', claims, unlock: 'jwt',
    msg: '>>> JWT_AUTH bypassed. user_api exposed at /api/m2/user'
  });
});

// ─── M2 LAB: IDOR ────────────────────────────────────────────────────────
app.get('/api/m2/user', (req, res) => {
  const seed = req.query.seed || 'DEFAULT';
  const id = parseInt(req.query.id, 10);
  const cfg = genM2Idor(seed);
  if (!Number.isFinite(id) || id < 0) {
    return res.status(400).json(cryptic('BAD_ID', 'id must be a non-negative integer'));
  }
  if (id === cfg.secretId) {
    return res.json({
      user: { id, role: 'admin', flag: cfg.flag },
      unlock: 'idor',
      msg: '>>> USER_API_IDOR bypassed. internal flag exposed.'
    });
  }
  const role = (id % 17 === 0) ? 'support' : 'guest';
  res.json({ user: { id, role, name: `user-${id}`, joined: '2026-0' + ((id % 9) + 1) } });
});

// ─── meta ────────────────────────────────────────────────────────────────
app.get('/healthz', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.use((req, res) => {
  res.status(404).json(cryptic('NOT_FOUND', `path ${req.method} ${req.path} unknown`));
});

app.listen(PORT, () => {
  log(`ghostwire backend listening on :${PORT}`);
});
