import express from 'express';
import cors from 'cors';

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

// ─── L1: webhook gate ────────────────────────────────────────────────────
const GATE_CODE = 'ZX9-99';

app.post('/api/gate', (req, res) => {
  const { role, clearance_code } = req.body || {};
  log(`L1 attempt role=${role} code=${clearance_code}`);

  if (role !== 'admin') {
    return res.status(403).json(cryptic('AUTH_INSUFFICIENT', 'role_not_privileged', {
      hint: 'webhook expects role:"admin"'
    }));
  }
  if (!clearance_code || typeof clearance_code !== 'string') {
    return res.status(400).json(cryptic('PAYLOAD_MALFORMED', 'clearance_code_required'));
  }
  if (clearance_code !== GATE_CODE) {
    return res.status(403).json(cryptic('AUTH_FAILED', 'clearance_mismatch', {
      hint: 'prefix=ZX9- // suffix=2 digits // sum=18'
    }));
  }
  return res.json({
    status: 'gate_open',
    next: '/api/router',
    unlock: 'gate',
    msg: '>>> NODE_1 BYPASSED. router exposed.'
  });
});

// ─── L2: conditional router ──────────────────────────────────────────────
// Switch routes only when temperature===180 AND status==='critical'.
// Player must overload — send 25 packets in <2 seconds with required
// condition appearing at least 12 times → triggers escape branch.
const routerWindow = {
  hits: [],
  threshold: 12,
  windowMs: 2000
};

app.post('/api/router', (req, res) => {
  const { temperature, status } = req.body || {};
  const now = Date.now();
  routerWindow.hits = routerWindow.hits.filter(t => now - t < routerWindow.windowMs);

  const cond = temperature === 180 && status === 'critical';
  log(`L2 attempt temp=${temperature} status=${status} cond=${cond} hits=${routerWindow.hits.length}`);

  if (!cond) {
    return res.status(418).json(cryptic('ROUTE_FILTERED', 'switch_default_branch', {
      hint: 'expected: { temperature: 180, status: "critical" }',
      router_state: { recent_critical_hits: routerWindow.hits.length }
    }));
  }

  routerWindow.hits.push(now);
  if (routerWindow.hits.length < routerWindow.threshold) {
    return res.status(202).json({
      status: 'accepted',
      msg: `packet ${routerWindow.hits.length}/${routerWindow.threshold} accepted on critical branch`,
      router_state: {
        recent_critical_hits: routerWindow.hits.length,
        window_ms: routerWindow.windowMs
      }
    });
  }

  // overflow — escape branch triggered
  routerWindow.hits = [];
  return res.json({
    status: 'router_overflowed',
    next: '/build → /test → /deploy (within 5s)',
    unlock: 'router',
    msg: '>>> NODE_2 BYPASSED. switch overloaded. CI/CD pipeline exposed.'
  });
});

// ─── L3: CI/CD pipeline ──────────────────────────────────────────────────
// /build starts a 5-second window. /test must hit AFTER /build but BEFORE
// /deploy, all within 5 seconds of /build. Out-of-order or late = reset.
const pipeline = {
  buildAt: 0,
  testedAt: 0,
  windowMs: 5000
};

function pipelineExpired() {
  if (!pipeline.buildAt) return true;
  return Date.now() - pipeline.buildAt > pipeline.windowMs;
}

app.get('/build', (req, res) => {
  pipeline.buildAt = Date.now();
  pipeline.testedAt = 0;
  log('L3 /build started');
  return res.json({
    stage: 'build',
    msg: 'container image queued',
    deadline_ms: pipeline.windowMs,
    next: 'GET /test then GET /deploy'
  });
});

app.get('/test', (req, res) => {
  if (pipelineExpired()) {
    pipeline.buildAt = 0;
    return res.status(425).json(cryptic('PIPELINE_STALE', 'build_not_initiated_or_expired', {
      hint: 'run GET /build first; chain within 5s'
    }));
  }
  pipeline.testedAt = Date.now();
  log('L3 /test passed');
  return res.json({
    stage: 'test',
    msg: 'unit_tests=ok integration=ok',
    elapsed_ms: pipeline.testedAt - pipeline.buildAt
  });
});

app.get('/deploy', (req, res) => {
  if (pipelineExpired()) {
    pipeline.buildAt = 0; pipeline.testedAt = 0;
    return res.status(425).json(cryptic('PIPELINE_STALE', 'window_expired', {
      hint: 'must complete /build → /test → /deploy in 5s'
    }));
  }
  if (!pipeline.testedAt) {
    return res.status(409).json(cryptic('PIPELINE_OUT_OF_ORDER', 'test_stage_skipped', {
      hint: 'order: build → test → deploy'
    }));
  }
  const total = Date.now() - pipeline.buildAt;
  pipeline.buildAt = 0; pipeline.testedAt = 0;
  log(`L3 /deploy success total=${total}ms`);
  return res.json({
    stage: 'deploy',
    status: 'pipeline_complete',
    elapsed_ms: total,
    unlock: 'pipeline',
    msg: '>>> NODE_3 BYPASSED. container shipped. PUBLIC_INTERNET reached.'
  });
});

// ─── meta ────────────────────────────────────────────────────────────────
app.get('/healthz', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.use((req, res) => {
  res.status(404).json(cryptic('NOT_FOUND', `path ${req.method} ${req.path} unknown`));
});

app.listen(PORT, () => {
  log(`ghostwire backend listening on :${PORT}`);
});
