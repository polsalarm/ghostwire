// Capture player commands + timestamps so a finished run can be replayed
// later as a "ghost". Single global instance; App.jsx starts it on each
// fresh run and snapshots into the win submission.

const MAX_EVENTS = 200;
const MAX_TEXT_LEN = 240;

const state = {
  startedAt: 0,
  events: [],
  active: false
};

export function startRecording() {
  state.startedAt = Date.now();
  state.events = [];
  state.active = true;
}

export function stopRecording() {
  state.active = false;
}

export function recordCommand(text) {
  if (!state.active) return;
  if (state.events.length >= MAX_EVENTS) return;
  if (typeof text !== 'string') return;
  const t = Math.max(0, Date.now() - state.startedAt);
  state.events.push({ t, c: text.slice(0, MAX_TEXT_LEN) });
}

export function snapshot() {
  // shallow copy so later mutation can't corrupt a captured trace
  return state.events.map(e => ({ ...e }));
}

export function isActive() {
  return state.active;
}
