import React from 'react';
import { Text } from '@react-three/drei';
import { useWorld } from './store.js';

// Carved hints on the chamber walls.
// Each hint belongs to a chamber id ('gate' | 'router' | 'pipeline').
// Until that chamber's SCAN_PAD is decrypted, the text renders as
// glyph-noise. After decryption it shows the real clue.
//
// Difficulty curve:
//   chamber 1 (gate)     — explicit
//   chamber 2 (router)   — terse: terms only, no exact value
//   chamber 3 (pipeline) — cryptic: mechanic only, no order, no commands

const HINT_GLOW = '#10b981';
const NOISE_GLYPHS = '▓▒░█▌▐■□◆◇◈◉◐◑◒◓◔◕';

function scramble(text, seed) {
  let s = seed;
  let out = '';
  for (const ch of text) {
    if (ch === ' ' || ch === '\n') { out += ch; continue; }
    s = (s * 9301 + 49297) % 233280;
    out += NOISE_GLYPHS[s % NOISE_GLYPHS.length];
  }
  return out;
}

function CarvedText({ position, rotation, text, size = 0.16, color = HINT_GLOW, chamber, idx = 0 }) {
  const revealedChambers = useWorld(s => s.revealedChambers);
  const revealed = !chamber || revealedChambers.has(chamber);
  const display = revealed ? text : scramble(text, idx + 1 + (chamber?.length || 0));
  const c = revealed ? color : '#3a3f3a';

  return (
    <Text
      position={position}
      rotation={rotation}
      fontSize={size}
      color={c}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.005}
      outlineColor="#000"
      maxWidth={6}
      textAlign="center"
    >
      {display}
    </Text>
  );
}

export default function WallHints() {
  return (
    <group>
      {/* ── Chamber 1 — GATE. EASY ──────────────────────────────── */}
      <CarvedText chamber="gate" idx={0} position={[-9.85, 2.0, 11]} rotation={[0, Math.PI / 2, 0]}
        text="// L1 :: WEBHOOK_GATE" size={0.22} />
      <CarvedText chamber="gate" idx={1} position={[-9.85, 1.6, 11]} rotation={[0, Math.PI / 2, 0]}
        text='door checks { role, clearance_code }' />
      <CarvedText chamber="gate" idx={2} position={[-9.85, 1.3, 11]} rotation={[0, Math.PI / 2, 0]}
        text='role MUST be "admin"' />
      <CarvedText chamber="gate" idx={3} position={[9.85, 1.6, 11]} rotation={[0, -Math.PI / 2, 0]}
        text='clearance prefix = ZX9-' />
      <CarvedText chamber="gate" idx={4} position={[9.85, 1.3, 11]} rotation={[0, -Math.PI / 2, 0]}
        text='suffix = 2 digits whose sum = 18' />
      <CarvedText chamber="gate" idx={5} position={[0, 1.6, 14.85]} rotation={[0, Math.PI, 0]}
        text='POST /api/gate { role, clearance_code }' size={0.18} />
      <CarvedText chamber="gate" idx={6} position={[0, 1.2, 14.85]} rotation={[0, Math.PI, 0]}
        text='only one (a, b) ∈ [0..9]² satisfies a+b=18' size={0.14} color="#0a8e60" />

      {/* ── Chamber 2 — ROUTER. MEDIUM ──────────────────────────── */}
      <CarvedText chamber="router" idx={0} position={[-9.85, 2.0, 0]} rotation={[0, Math.PI / 2, 0]}
        text="// L2 :: COND_ROUTER" size={0.22} color="#f59e0b" />
      <CarvedText chamber="router" idx={1} position={[-9.85, 1.6, 0]} rotation={[0, Math.PI / 2, 0]}
        text='switch forwards CRITICAL alerts only' color="#f59e0b" />
      <CarvedText chamber="router" idx={2} position={[-9.85, 1.3, 0]} rotation={[0, Math.PI / 2, 0]}
        text='look for { temperature, status }' color="#f59e0b" />
      <CarvedText chamber="router" idx={3} position={[9.85, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]}
        text='single packet = buffered, not routed' color="#f59e0b" />
      <CarvedText chamber="router" idx={4} position={[9.85, 1.3, 0]} rotation={[0, -Math.PI / 2, 0]}
        text='burst of N within 2s overflows the buffer' color="#f59e0b" />
      <CarvedText chamber="router" idx={5} position={[0, 1.6, 3.85]} rotation={[0, Math.PI, 0]}
        text='HINT: read `traffic` — the threshold leaks there' size={0.14} color="#a06010" />

      {/* ── Chamber 3 — PIPELINE. HARD ──────────────────────────── */}
      <CarvedText chamber="pipeline" idx={0} position={[-9.85, 2.0, -8]} rotation={[0, Math.PI / 2, 0]}
        text="// L3 :: CICD_PIPELINE" size={0.22} color="#3b82f6" />
      <CarvedText chamber="pipeline" idx={1} position={[-9.85, 1.6, -8]} rotation={[0, Math.PI / 2, 0]}
        text='3 stages. order matters. clock matters.' color="#3b82f6" />
      <CarvedText chamber="pipeline" idx={2} position={[-9.85, 1.3, -8]} rotation={[0, Math.PI / 2, 0]}
        text='stale = 425. wrong order = 409.' color="#3b82f6" />
      <CarvedText chamber="pipeline" idx={3} position={[9.85, 1.6, -8]} rotation={[0, -Math.PI / 2, 0]}
        text='one stage starts the timer' color="#3b82f6" />
      <CarvedText chamber="pipeline" idx={4} position={[9.85, 1.3, -8]} rotation={[0, -Math.PI / 2, 0]}
        text='another ships. the third must come between.' color="#3b82f6" />
      <CarvedText chamber="pipeline" idx={5} position={[0, 1.5, -4.15]} rotation={[0, Math.PI, 0]}
        text='LEAKED: pipeline.yml restored from `traffic`' size={0.14} color="#1e4ea0" />
      <CarvedText chamber="pipeline" idx={6} position={[0, 1.2, -4.15]} rotation={[0, Math.PI, 0]}
        text='deadline ≤ 5 seconds end-to-end' size={0.13} color="#1e4ea0" />

      {/* exit chamber tease — always visible */}
      <CarvedText position={[0, 2.2, -14.4]} rotation={[0, 0, 0]}
        text="PUBLIC_INTERNET" size={0.32} />
      <CarvedText position={[0, 1.7, -14.4]} rotation={[0, 0, 0]}
        text="// you are not supposed to be here" size={0.13} color="#0a8e60" />
    </group>
  );
}
