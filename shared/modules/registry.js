// Module = a themed collection of puzzles played as a single run.
// `nodes` shape matches what App.jsx + Terminal3D expect.

export const MODULES = {
  m1: {
    id: 'm1',
    label: 'M1 SERVER_ROOM',
    blurb: 'webhook gate · packet router · CI/CD pipeline',
    nodes: [
      { id: 'gate',     label: 'WEBHOOK_GATE',  level: 1 },
      { id: 'router',   label: 'COND_ROUTER',   level: 2 },
      { id: 'pipeline', label: 'CICD_PIPELINE', level: 3 },
      { id: 'exit',     label: 'PUBLIC_INTERNET', level: 4 }
    ],
    supports3D: true,
    status: 'live'
  },
  m2: {
    id: 'm2',
    label: 'M2 DATACENTER',
    blurb: 'JWT · IDOR · rate-limit · proto-pollute · header-smuggle',
    nodes: [
      { id: 'jwt',       label: 'JWT_AUTH',          level: 1 },
      { id: 'idor',      label: 'USER_API_IDOR',     level: 2 },
      { id: 'ratelimit', label: 'THROTTLE_BYPASS',   level: 3 },
      { id: 'proto',     label: 'PROTO_POLLUTION',   level: 4 },
      { id: 'smug',      label: 'HEADER_SMUGGLING',  level: 5 },
      { id: 'exit',      label: 'PUBLIC_INTERNET',   level: 6 }
    ],
    supports3D: false,    // 3D environment for M2 ships in a later cycle
    status: 'live'
  }
};

export function moduleOrDefault(id) {
  return MODULES[id] || MODULES.m1;
}

// Which lock id terminates the run for a module — used by App.onWin.
export function finalLevelOf(mod) {
  const cfg = moduleOrDefault(mod);
  const last = cfg.nodes[cfg.nodes.length - 2]; // the last non-exit node
  return last?.id;
}
