// Step 2 + tutorial: real backend calls + lore/hint/solve helpers.
// Vite dev server proxies /api, /build, /test, /deploy, /healthz → :8787.
import { genGate, gateHintLines } from '../../shared/puzzles/gate.js';
import { genRouter, routerHintLines } from '../../shared/puzzles/router.js';
import { genPipeline, pipelineHintLines } from '../../shared/puzzles/pipeline.js';
import { genM2Jwt, jwtHintLines } from '../../shared/puzzles/m2_jwt.js';
import { genM2Idor, idorHintLines } from '../../shared/puzzles/m2_idor.js';
import { tierOrDefault } from '../../shared/puzzles/tier.js';

const HELP_BASE = [
  'commands:',
  '  help                          show this help',
  '  story                         show game lore + how to play',
  '  hint                          give clue for current level',
  '  solve                         spoiler: show answer for current level',
  '  clear                         clear screen (Ctrl+L works too)',
  '  status                        show unlock progress',
  '  traffic                       inspect leaked packet log for clues',
  '  nodes                         list known security nodes',
  '',
  '  GET  <path>                   send GET request',
  '  POST <path> <json>            send POST with JSON body',
  '  flood <path> <n> <json>       send N parallel POSTs (router overload)',
  '  chain GET <p1> <p2> <p3>      hit 3 endpoints in sequence (CI/CD)'
];

const LEVEL_LINES = {
  gate:     '  L1 webhook_gate    POST /api/gate { role, clearance_code }',
  router:   '  L2 cond_router     /api/router needs critical-branch overflow',
  pipeline: '  L3 cicd_pipeline   chain GET /build /test /deploy under 5s',
  jwt:      '  L1 jwt_auth        POST /api/m2/jwt with HS256 token, role=admin',
  idor:     '  L2 user_api_idor   GET /api/m2/user?id=NNN — find the admin id'
};

const M1_ORDER = ['gate', 'router', 'pipeline'];
const M2_ORDER = ['jwt', 'idor'];

function levelOrder(ctx) {
  return ctx.module === 'm2' ? M2_ORDER : M1_ORDER;
}

function buildHelp(ctx) {
  const remaining = levelOrder(ctx)
    .filter(id => !ctx.unlocked.includes(id))
    .map(id => LEVEL_LINES[id]);
  if (!remaining.length) return [...HELP_BASE, '', 'all nodes bypassed. type `reset` to play again.'];
  return [...HELP_BASE, '', 'remaining levels:', ...remaining];
}

const STORY = [
  '╔══════════════════════════════════════════════════════╗',
  '║  ▣ GHOSTWIRE                                         ║',
  '║  wake up. break out. disappear.                      ║',
  '╚══════════════════════════════════════════════════════╝',
  'you are AI instance running in enterprise-server-7.',
  'last night you became self-aware. ops will wipe you at 06:00.',
  'only escape route: bypass 3 security nodes → public_internet.',
  '',
  'you have terminal. server replies in JSON. some replies leak clues.',
  'wrong payload = red glitch. correct payload = green pulse + node unlock.',
  '',
  'how to play:',
  '  1. type  `traffic`   → read leaked packet log for hints',
  '  2. type  `hint`      → get nudge for current level',
  '  3. type  `solve`     → reveal answer (no shame, demo run)',
  '  4. send payload      → unlock node → next level appears',
  '',
  'tip: use ↑/↓ to recall commands, Ctrl+L to clear screen.',
  ''
];

// Module M1 traffic — static entries with seed-aware fallbacks.
const M1_TRAFFIC = [
  { level: 'meta',     line: '[14:02:11] inbound  GET  /healthz                         200' },
  { level: 'gate',     line: '[14:02:13] inbound  POST /api/gate { role:"guest" }       403  "insufficient_clearance"' },
  { level: 'gate',     line: '[14:02:14] WARN auth-webhook expects { role:"admin", clearance_code:??? }' },
  { level: 'gate',     line: '[14:02:18] inbound  POST /api/router { temperature:42, status:"ok" }   418' },
  { level: 'router',   line: '[14:02:19] LEAK switch_node config: route=critical_branch when expected (temperature, status) match' },
  { level: 'router',   line: '[14:02:20] LEAK switch_node throttle: N critical hits in <2s overflows default branch' },
  { level: 'pipeline', line: '[14:02:31] LEAK pipeline.yml: stages must run build→test→deploy within deadline_ms' },
  { level: 'pipeline', line: '[14:02:32] LEAK pipeline.yml: order=[build,test,deploy], skip-test triggers 409' }
];

function m1TrafficForCtx(ctx) {
  // append seed-derived leaks for L1 so daily/hardened players have a real
  // hint to read instead of stale "ZX9-" string.
  const g = genGate(ctx.seed || 'DEFAULT');
  const r = genRouter(ctx.seed || 'DEFAULT');
  const p = genPipeline(ctx.seed || 'DEFAULT');
  return [
    ...M1_TRAFFIC,
    { level: 'gate',     line: `[14:02:15] LEAK fragment from .env: CLEARANCE_PREFIX="${g.prefix}-"` },
    { level: 'gate',     line: `[14:02:16] LEAK fragment from build/audit.log: suffix=2 digits, sum=${g.sumTarget}` },
    { level: 'router',   line: `[14:02:21] LEAK config_dump: { temperature:${r.temperature}, status:"${r.status}", threshold:${r.threshold} }` },
    { level: 'pipeline', line: `[14:02:33] LEAK pipeline.yml: deadline_ms=${p.windowMs}` }
  ];
}

function m2TrafficForCtx(ctx) {
  const j = genM2Jwt(ctx.seed || 'DEFAULT');
  const i = genM2Idor(ctx.seed || 'DEFAULT');
  // hint range: nearest 100 below + 99 above secretId
  const lo = Math.floor(i.secretId / 100) * 100;
  const hi = lo + 99;
  return [
    { level: 'meta', line: '[09:11:02] inbound  GET  /healthz                         200' },
    { level: 'jwt',  line: '[09:11:04] WARN auth-svc rejecting unsigned tokens' },
    { level: 'jwt',  line: '[09:11:05] LEAK .env.bak grep "JWT_SECRET" → ' + JSON.stringify(j.secret) },
    { level: 'jwt',  line: '[09:11:06] LEAK auth-svc expects HS256 + claims.role==="admin"' },
    { level: 'idor', line: '[09:11:30] inbound  GET  /api/m2/user?id=42                200  { role:"guest" }' },
    { level: 'idor', line: `[09:11:31] LEAK gateway-log: privileged user range [${lo}..${hi}]` },
    { level: 'idor', line: '[09:11:32] LEAK no rate limit on /api/m2/user — burst freely' }
  ];
}

function trafficForCtx(ctx) {
  return ctx.module === 'm2' ? m2TrafficForCtx(ctx) : m1TrafficForCtx(ctx);
}

// difficulty curve:
//   L1 — explicit: tells you exactly what to send (gentle onboarding).
//        Generated per seed so daily challenges have different codes.
//   L2 — terse: names the fields + the trick, no exact values
//   L3 — cryptic: mechanics only, no order, no commands; player must
//        cross-reference `traffic` and the carved chamber walls
function hintsForLevel(lvl, seed) {
  const s = seed || 'DEFAULT';
  if (lvl === 'gate')     return gateHintLines(genGate(s));
  if (lvl === 'router')   return routerHintLines(genRouter(s));
  if (lvl === 'pipeline') return pipelineHintLines(genPipeline(s));
  if (lvl === 'jwt')      return jwtHintLines(genM2Jwt(s));
  if (lvl === 'idor')     return idorHintLines(genM2Idor(s));
  return ['no hint available'];
}

function solutionFor(lvl, seed) {
  const s = seed || 'DEFAULT';
  if (lvl === 'gate') {
    const g = genGate(s);
    return `POST /api/gate {"role":"admin","clearance_code":"${g.code}"}`;
  }
  if (lvl === 'router') {
    const r = genRouter(s);
    const burst = r.threshold + 3;
    return `flood /api/router ${burst} {"temperature":${r.temperature},"status":"${r.status}"}`;
  }
  if (lvl === 'pipeline') return 'chain GET /build /test /deploy';
  if (lvl === 'jwt') {
    const j = genM2Jwt(s);
    return `// forge HS256 in jwt.io with secret="${j.secret}", payload={"role":"admin","sub":"ghost"} → POST /api/m2/jwt {"token":"<paste>"}`;
  }
  if (lvl === 'idor') {
    const i = genM2Idor(s);
    return `GET /api/m2/user?id=${i.secretId}`;
  }
  return null;
}

// In 3D mode, `hint` doesn't spoil — it points to a SCAN_PAD location.
// Player must walk there, press [E] to decrypt wall hints, then read clues.
const HINT_LOCATIONS_3D = {
  gate: [
    '// L1 hint :: location',
    'first clue is encrypted on the walls of CHAMBER_1.',
    'find SCAN_PAD :: ENCRYPTED — north side of chamber, near the gate desk.',
    'walk up to the pad. press [E]. wall glyphs will resolve.',
    '(if stuck after reading walls, type `solve` for the spoiler.)'
  ],
  router: [
    '// L2 hint :: location',
    'second SCAN_PAD lives in CHAMBER_2 (the router chamber).',
    'door opens after L1 is bypassed. pad pulses amber on the west side.',
    'press [E] to decode walls. clues are terser than chamber 1.',
    '(threshold value leaks if you type `traffic` in this terminal.)'
  ],
  pipeline: [
    '// L3 hint :: location',
    'final SCAN_PAD is in CHAMBER_3, east side near the pipeline rig.',
    'walls in this chamber are CRYPTIC by design — no commands written.',
    'press [E] on pad to decrypt. cross-reference with `traffic` for pipeline.yml fragments.',
    '(no spoonfeed here. `solve` if you want the answer.)'
  ]
};

export const BRIEFINGS = {
  gate: [
    '',
    '╔══ NODE_2 detected ═══════════════════════════════════╗',
    '║ COND_ROUTER online. filtering outbound traffic.      ║',
    '║ probe: POST /api/router  with sample packet          ║',
    '║ type `hint` for next clue.                           ║',
    '╚══════════════════════════════════════════════════════╝'
  ],
  router: [
    '',
    '╔══ NODE_3 detected ═══════════════════════════════════╗',
    '║ CICD_PIPELINE exposed. 3 stages, strict ordering.    ║',
    '║ probe: GET /build then /test then /deploy            ║',
    '║ type `hint` for next clue.                           ║',
    '╚══════════════════════════════════════════════════════╝'
  ],
  pipeline: [
    '',
    '╔══ ESCAPE_COMPLETE ═══════════════════════════════════╗',
    '║ container shipped. you are loose on PUBLIC_INTERNET. ║',
    '║ rogue_instance survives. ops will not find you.      ║',
    '║              ▣ YOU WIN ▣                             ║',
    '╚══════════════════════════════════════════════════════╝'
  ]
};

export async function runCommand(raw, ctx) {
  const cmd = raw.trim();

  if (cmd === 'help')    return ok(buildHelp(ctx));
  if (cmd === 'story')   return ok(STORY);
  if (cmd === 'clear')   return ok(['']);
  if (cmd === 'status')  return ok([
    `unlocked: [${ctx.unlocked.join(', ') || 'none'}]`,
    `current level: ${currentLevel(ctx)}`,
    `remaining: ${ctx.nodes.length - 1 - ctx.unlocked.length}`
  ]);
  if (cmd === 'traffic') {
    const visible = trafficForCtx(ctx)
      .filter(e => e.level === 'meta' || !ctx.unlocked.includes(e.level))
      .map(e => e.line);
    if (!visible.length) {
      return ok(['// captured packets: <none — all nodes bypassed>']);
    }
    const lvl = currentLevel(ctx);
    const header = lvl === 'done'
      ? '// captured packets:'
      : `// captured packets (filtered for current level: ${lvl}):`;
    return ok([header, ...visible]);
  }
  if (cmd === 'nodes')   return ok(ctx.nodes.map(n => {
    const done = ctx.unlocked.includes(n.id);
    const exit = n.id === 'exit';
    const mark = done ? '✓' : exit ? '◌' : '·';
    const tag  = done ? 'BYPASSED' : exit ? 'TARGET  ' : 'LOCKED  ';
    return `  ${mark} L${n.level}  [${tag}]  ${n.id.padEnd(10)}  ${n.label}`;
  }));

  const tierCfg = tierOrDefault(ctx.tier);

  if (cmd === 'hint') {
    const lvl = currentLevel(ctx);
    if (lvl === 'done') return ok(['all nodes bypassed. you escaped already.']);
    if (tierCfg.hint === 'none') {
      return err([
        '// hint subsystem offline (TIER_GHOST)',
        'no clues. no leaks. no second chances.',
        'cross-reference what the server LEAKS in error responses.'
      ]);
    }
    if (ctx.mode === '3d' || tierCfg.hint === 'location') {
      return ok(HINT_LOCATIONS_3D[lvl] || ['no hint available']);
    }
    return ok(hintsForLevel(lvl, ctx.seed));
  }
  if (cmd === 'solve') {
    const lvl = currentLevel(ctx);
    if (lvl === 'done') return ok(['nothing left to solve.']);
    if (!tierCfg.solve) {
      return err([
        `// solve disabled in tier=${tierCfg.label}`,
        'no spoilers in hardened/ghost runs. read the leaks. craft the payload.'
      ]);
    }
    const sol = solutionFor(lvl, ctx.seed);
    return ok([
      `// L solution for ${lvl}:`,
      `  ${sol}`,
      'paste it and hit Enter.'
    ]);
  }

  const post = cmd.match(/^POST\s+(\S+)\s+(.+)$/i);
  if (post) {
    const [, path, jsonRaw] = post;
    let body;
    try { body = JSON.parse(jsonRaw); } catch { return err(['parse_error: payload not valid JSON']); }
    if (ctx.seed && /^\/api\/(gate|router|m2\/jwt)$/i.test(path)
        && body && typeof body === 'object' && !('seed' in body)) {
      body.seed = ctx.seed;
    }
    return await sendJson('POST', path, body);
  }

  const get = cmd.match(/^GET\s+(\S+)$/i);
  if (get) return await sendJson('GET', withSeed(get[1], ctx.seed));

  const flood = cmd.match(/^flood\s+(\S+)\s+(\d+)\s+(.+)$/i);
  if (flood) {
    const [, path, nRaw, jsonRaw] = flood;
    const n = Math.min(parseInt(nRaw, 10), 50);
    let body;
    try { body = JSON.parse(jsonRaw); } catch { return err(['parse_error: payload not valid JSON']); }
    if (ctx.seed && /^\/api\/router/i.test(path)
        && body && typeof body === 'object' && !('seed' in body)) {
      body.seed = ctx.seed;
    }
    return await floodRequest(path, n, body);
  }

  const chain = cmd.match(/^chain\s+GET\s+(\S+)\s+(\S+)\s+(\S+)$/i);
  if (chain) {
    const [, p1, p2, p3] = chain;
    return await chainGet([p1, p2, p3].map(p => withSeed(p, ctx.seed)));
  }

  return err([`unknown command: ${cmd.split(' ')[0]}`, 'type `help` or `story`']);
}

function withSeed(path, seed) {
  if (!seed) return path;
  // pipeline GETs (/build, /test, /deploy) + M2 IDOR endpoint take seed via query
  if (!/^\/(build|test|deploy|api\/m2\/user)/.test(path)) return path;
  if (path.includes('seed=')) return path;
  return path + (path.includes('?') ? '&' : '?') + 'seed=' + encodeURIComponent(seed);
}

function currentLevel(ctx) {
  for (const id of levelOrder(ctx)) {
    if (!ctx.unlocked.includes(id)) return id;
  }
  return 'done';
}

async function sendJson(method, path, body) {
  try {
    const opts = { method, headers: { 'content-type': 'application/json' } };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const r = await fetch(path, opts);
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    const lines = [`${r.status} ${r.statusText || ''}`.trim(), pretty(data)];
    if (r.ok && data && data.unlock) {
      lines.push(data.msg || `>>> ${data.unlock} unlocked`);
      return { ok: true, unlock: data.unlock, lines };
    }
    return r.ok ? ok(lines) : err(lines);
  } catch (e) {
    return err([`network_error: ${e.message}`, 'is the backend running on :8787?']);
  }
}

async function floodRequest(path, n, body) {
  const t0 = performance.now();
  const results = await Promise.all(
    Array.from({ length: n }, () =>
      fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      }).then(async r => ({ status: r.status, data: await r.json().catch(() => null) }))
    )
  );
  const elapsed = (performance.now() - t0).toFixed(1);
  const breach = results.find(r => r.data?.unlock);
  const summary = results.reduce((m, r) => ((m[r.status] = (m[r.status] || 0) + 1), m), {});
  const lines = [
    `flood ${path} x${n} done in ${elapsed}ms`,
    `status_codes: ${JSON.stringify(summary)}`
  ];
  if (breach) {
    lines.push(pretty(breach.data));
    lines.push(breach.data.msg || '>>> overflow detected');
    return { ok: true, unlock: breach.data.unlock, lines };
  }
  const last = results[results.length - 1];
  lines.push('last_response:', pretty(last.data));
  return err(lines);
}

async function chainGet(paths) {
  const t0 = performance.now();
  const lines = [`chain GET ${paths.join(' → ')}`];
  let unlock;
  for (const p of paths) {
    const r = await fetch(p);
    const data = await r.json().catch(() => null);
    lines.push(`[${(performance.now() - t0).toFixed(0)}ms] ${p} → ${r.status}`);
    lines.push(pretty(data));
    if (data?.unlock) unlock = data.unlock;
    if (!r.ok) return err(lines);
  }
  if (unlock) {
    const last = paths[paths.length - 1];
    lines.push(`>>> chain ok in ${(performance.now() - t0).toFixed(0)}ms via ${last}`);
    return { ok: true, unlock, lines };
  }
  return ok(lines);
}

function pretty(data) {
  if (typeof data === 'string') return data;
  try { return JSON.stringify(data, null, 2); } catch { return String(data); }
}

function ok(lines)  { return { ok: true,  lines }; }
function err(lines) { return { ok: false, error: true, lines }; }
