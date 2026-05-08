import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorld } from './store.js';

// Camera waypoints from spawn-end of room → through chambers → into exit panel.
// Triggered after pipeline unlock; runs ~5s, then signals onDone() so the
// WinScreen can pop.
const WAYPOINTS = [
  { pos: [0, 4, 14], look: [0, 1.5, 6],   dur: 0.0 }, // spawn area, looking south
  { pos: [0, 3, 6],  look: [0, 1.5, -2],  dur: 1.2 }, // through chamber 1 door
  { pos: [0, 2.5, -2],look:[0, 1.5, -10], dur: 1.2 }, // through chamber 2 door
  { pos: [0, 2, -10],look:[0, 1.5, -14],  dur: 1.2 }, // through chamber 3 door
  { pos: [0, 1.7, -13],look:[0, 1.5, -14.5], dur: 1.0 }, // closing on exit panel
  { pos: [0, 1.55, -14.4],look:[0, 1.5, -14.49], dur: 0.8 } // touch exit
];

const TOTAL_MS = WAYPOINTS.reduce((s, w) => s + w.dur, 0) * 1000;

export default function Flythrough({ onDone }) {
  const { camera } = useThree();
  const tStart = useRef(0);
  const fired = useRef(false);
  const flythrough = useWorld(s => s.flythrough);

  useFrame((_state, _dt) => {
    if (!flythrough) {
      tStart.current = 0;
      fired.current = false;
      return;
    }
    if (!tStart.current) tStart.current = performance.now();
    const elapsed = (performance.now() - tStart.current) / 1000;

    // find the segment we're currently in
    let acc = 0;
    let segIdx = 0;
    for (let i = 1; i < WAYPOINTS.length; i++) {
      if (elapsed < acc + WAYPOINTS[i].dur) {
        segIdx = i;
        break;
      }
      acc += WAYPOINTS[i].dur;
      segIdx = i;
    }

    const a = WAYPOINTS[Math.max(0, segIdx - 1)];
    const b = WAYPOINTS[segIdx];
    const segT = b.dur > 0 ? Math.min(1, (elapsed - acc) / b.dur) : 1;
    // ease-in-out
    const e = segT < 0.5 ? 2 * segT * segT : 1 - Math.pow(-2 * segT + 2, 2) / 2;

    camera.position.x = THREE.MathUtils.lerp(a.pos[0], b.pos[0], e);
    camera.position.y = THREE.MathUtils.lerp(a.pos[1], b.pos[1], e);
    camera.position.z = THREE.MathUtils.lerp(a.pos[2], b.pos[2], e);
    const lx = THREE.MathUtils.lerp(a.look[0], b.look[0], e);
    const ly = THREE.MathUtils.lerp(a.look[1], b.look[1], e);
    const lz = THREE.MathUtils.lerp(a.look[2], b.look[2], e);
    camera.lookAt(lx, ly, lz);

    if (elapsed * 1000 >= TOTAL_MS && !fired.current) {
      fired.current = true;
      onDone?.();
    }
  });

  return null;
}

export const FLYTHROUGH_MS = TOTAL_MS;
