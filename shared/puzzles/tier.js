// Difficulty tiers. Score multiplier applied on the server in run/finish.
// Lower score = better rank, so multiplier < 1 makes a HARDENED run beat
// an equivalent STORY run.

export const TIERS = {
  story:    { id: 'story',    label: 'STORY',    mul: 1.00, timerMs: 0,      hint: 'full',     solve: true  },
  hardened: { id: 'hardened', label: 'HARDENED', mul: 0.70, timerMs: 60_000, hint: 'location', solve: false },
  ghost:    { id: 'ghost',    label: 'GHOST',    mul: 0.40, timerMs: 60_000, hint: 'none',     solve: false }
};

export function isTier(t) {
  return typeof t === 'string' && Object.prototype.hasOwnProperty.call(TIERS, t);
}

export function tierOrDefault(t) {
  return isTier(t) ? TIERS[t] : TIERS.story;
}
