// Step 2 + tutorial: real backend calls + lore/hint/solve helpers.
// Vite dev server proxies /api, /build, /test, /deploy, /healthz → :8787.

const HELP = [
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
  '  chain GET <p1> <p2> <p3>      hit 3 endpoints in sequence (CI/CD)',
  '',
  'levels:',
  '  L1 webhook_gate    POST /api/gate { role, clearance_code }',
  '  L2 cond_router     /api/router needs critical-branch overflow',
  '  L3 cicd_pipeline   chain GET /build /test /deploy under 5s'
];

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

const TRAFFIC_LOG = [
  '[14:02:11] inbound  GET  /healthz                         200',
  '[14:02:13] inbound  POST /api/gate { role:"guest" }       403  "insufficient_clearance"',
  '[14:02:14] WARN auth-webhook expects { role:"admin", clearance_code:??? }',
  '[14:02:15] LEAK fragment from .env: CLEARANCE_PREFIX="ZX9-"',
  '[14:02:16] LEAK fragment from build/audit.log: suffix=2 digits, sum=18',
  '[14:02:18] inbound  POST /api/router { temperature:42, status:"ok" }   418',
  '[14:02:19] LEAK switch_node config: route=critical_branch when temp===180 && status==="critical"',
  '[14:02:20] LEAK switch_node throttle: 12 critical hits in <2s overflows default branch',
  '[14:02:31] LEAK pipeline.yml: stages must run build→test→deploy within 5000ms'
];

const HINTS = {
  gate: [
    '// L1 hint',
    'door checks 2 fields: role + clearance_code',
    '  role must be "admin"',
    '  clearance starts with "ZX9-" then 2 digits',
    '  digits sum = 18 (only one 2-digit combo fits)',
    'try: POST /api/gate {"role":"admin","clearance_code":"ZX9-99"}'
  ],
  router: [
    '// L2 hint',
    'router drops normal traffic, only forwards "critical" alerts',
    '  required body: { temperature:180, status:"critical" }',
    '  one packet = router buffers it (202 accepted)',
    '  12 critical packets within 2 seconds = buffer overflows',
    'try: flood /api/router 15 {"temperature":180,"status":"critical"}'
  ],
  pipeline: [
    '// L3 hint',
    'CI/CD pipeline = your escape vehicle. 3 stages, 5-second window.',
    '  GET /build   starts timer',
    '  GET /test    must come AFTER build',
    '  GET /deploy  must come AFTER test, all within 5s of build',
    'try: chain GET /build /test /deploy'
  ]
};

const SOLUTIONS = {
  gate:    'POST /api/gate {"role":"admin","clearance_code":"ZX9-99"}',
  router:  'flood /api/router 15 {"temperature":180,"status":"critical"}',
  pipeline:'chain GET /build /test /deploy'
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

  if (cmd === 'help')    return ok(HELP);
  if (cmd === 'story')   return ok(STORY);
  if (cmd === 'clear')   return ok(['']);
  if (cmd === 'status')  return ok([
    `unlocked: [${ctx.unlocked.join(', ') || 'none'}]`,
    `current level: ${currentLevel(ctx)}`,
    `remaining: ${ctx.nodes.length - 1 - ctx.unlocked.length}`
  ]);
  if (cmd === 'traffic') return ok(['// captured packets:', ...TRAFFIC_LOG]);
  if (cmd === 'nodes')   return ok(ctx.nodes.map(n => `  L${n.level}  ${n.id.padEnd(10)}  ${n.label}`));

  if (cmd === 'hint') {
    const lvl = currentLevel(ctx);
    if (lvl === 'done') return ok(['all nodes bypassed. you escaped already.']);
    return ok(HINTS[lvl] || ['no hint available']);
  }
  if (cmd === 'solve') {
    const lvl = currentLevel(ctx);
    if (lvl === 'done') return ok(['nothing left to solve.']);
    return ok([
      `// L solution for ${lvl}:`,
      `  ${SOLUTIONS[lvl]}`,
      'paste it and hit Enter.'
    ]);
  }

  const post = cmd.match(/^POST\s+(\S+)\s+(.+)$/i);
  if (post) {
    const [, path, jsonRaw] = post;
    let body;
    try { body = JSON.parse(jsonRaw); } catch { return err(['parse_error: payload not valid JSON']); }
    return await sendJson('POST', path, body);
  }

  const get = cmd.match(/^GET\s+(\S+)$/i);
  if (get) return await sendJson('GET', get[1]);

  const flood = cmd.match(/^flood\s+(\S+)\s+(\d+)\s+(.+)$/i);
  if (flood) {
    const [, path, nRaw, jsonRaw] = flood;
    const n = Math.min(parseInt(nRaw, 10), 50);
    let body;
    try { body = JSON.parse(jsonRaw); } catch { return err(['parse_error: payload not valid JSON']); }
    return await floodRequest(path, n, body);
  }

  const chain = cmd.match(/^chain\s+GET\s+(\S+)\s+(\S+)\s+(\S+)$/i);
  if (chain) {
    const [, p1, p2, p3] = chain;
    return await chainGet([p1, p2, p3]);
  }

  return err([`unknown command: ${cmd.split(' ')[0]}`, 'type `help` or `story`']);
}

function currentLevel(ctx) {
  if (!ctx.unlocked.includes('gate')) return 'gate';
  if (!ctx.unlocked.includes('router')) return 'router';
  if (!ctx.unlocked.includes('pipeline')) return 'pipeline';
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
