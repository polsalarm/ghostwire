// Tiny WebAudio FX. No assets — synthesized beeps.
// All sounds gated behind first user interaction (browser autoplay policy).

let ctx = null;
let muted = false;

function ac() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) ctx = new Ctor();
  }
  if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone({ freq = 440, dur = 0.08, type = 'square', gain = 0.05, sweep = 0 }) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (sweep) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(40, freq + sweep), c.currentTime + dur
    );
  }
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + dur);
}

// Short noise burst — used for footsteps and scan whirs.
function noise({ dur = 0.08, gain = 0.04, lowpass = 1200, type = 'lowpass' } = {}) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = lowpass;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  src.connect(filter).connect(g).connect(c.destination);
  src.start();
  src.stop(c.currentTime + dur);
}

export const sfx = {
  key:     () => tone({ freq: 880 + Math.random() * 60, dur: 0.03, gain: 0.025 }),
  submit:  () => tone({ freq: 520, dur: 0.06, gain: 0.04 }),
  error:   () => {
    tone({ freq: 220, dur: 0.12, gain: 0.06, sweep: -120 });
    setTimeout(() => tone({ freq: 160, dur: 0.16, gain: 0.06, sweep: -80 }), 80);
  },
  success: () => {
    tone({ freq: 660, dur: 0.08, gain: 0.05 });
    setTimeout(() => tone({ freq: 880, dur: 0.08, gain: 0.05 }), 80);
    setTimeout(() => tone({ freq: 1320, dur: 0.14, gain: 0.05 }), 160);
  },
  unlock:  () => {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => tone({ freq: f, dur: 0.12, gain: 0.06, type: 'triangle' }), i * 90)
    );
  },
  win:     () => {
    [392, 523, 659, 784, 1046, 1318].forEach((f, i) =>
      setTimeout(() => tone({ freq: f, dur: 0.18, gain: 0.07, type: 'triangle' }), i * 120)
    );
  },

  // ── 3D world sfx ────────────────────────────────────────────
  // alternating-foot footstep — call on a cadence while moving
  step:    () => {
    noise({ dur: 0.07, gain: 0.04, lowpass: 600 });
    tone({ freq: 90 + Math.random() * 30, dur: 0.05, gain: 0.025, type: 'sine', sweep: -30 });
  },
  // SCAN_PAD pulse: rising whir + ping
  scanStart: () => {
    tone({ freq: 220, dur: 0.4, gain: 0.06, type: 'sawtooth', sweep: 660 });
    noise({ dur: 0.4, gain: 0.025, lowpass: 2200 });
    setTimeout(() => tone({ freq: 1480, dur: 0.18, gain: 0.07, type: 'triangle' }), 380);
    setTimeout(() => tone({ freq: 1976, dur: 0.22, gain: 0.06, type: 'triangle' }), 460);
  },
  // door slide open: low rumble + servo whine
  doorOpen: () => {
    tone({ freq: 70, dur: 0.6, gain: 0.08, type: 'sawtooth', sweep: 30 });
    noise({ dur: 0.6, gain: 0.04, lowpass: 800 });
    setTimeout(() => tone({ freq: 320, dur: 0.4, gain: 0.04, type: 'square', sweep: -180 }), 120);
  },
  // E-prompt blip: single short ping when interacting
  interact: () => {
    tone({ freq: 1320, dur: 0.05, gain: 0.05, type: 'triangle' });
    setTimeout(() => tone({ freq: 1760, dur: 0.04, gain: 0.04, type: 'triangle' }), 40);
  },
  // disconnect from a terminal
  disconnect: () => {
    tone({ freq: 880, dur: 0.08, gain: 0.04, type: 'square', sweep: -360 });
  },

  toggleMute(value) {
    muted = value === undefined ? !muted : !!value;
    return muted;
  },
  isMuted: () => muted
};
