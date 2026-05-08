import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorld } from './store.js';
import { blocked } from './barriers.js';
import { sfx } from '../fx/sound.js';

const STEP_INTERVAL = 0.36; // seconds between footsteps

const SPEED = 4.5;
const CAM_DIST = 6;
const CAM_HEIGHT = 3.5;
const ROOM_BOUNDS = { minX: -9, maxX: 9, minZ: -14, maxZ: 14 };

const KEYS = { w: false, a: false, s: false, d: false };

function bindKeys() {
  const down = (e) => {
    const k = e.key.toLowerCase();
    if (k in KEYS) KEYS[k] = true;
    if (e.key === 'ArrowUp') KEYS.w = true;
    if (e.key === 'ArrowDown') KEYS.s = true;
    if (e.key === 'ArrowLeft') KEYS.a = true;
    if (e.key === 'ArrowRight') KEYS.d = true;
  };
  const up = (e) => {
    const k = e.key.toLowerCase();
    if (k in KEYS) KEYS[k] = false;
    if (e.key === 'ArrowUp') KEYS.w = false;
    if (e.key === 'ArrowDown') KEYS.s = false;
    if (e.key === 'ArrowLeft') KEYS.a = false;
    if (e.key === 'ArrowRight') KEYS.d = false;
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
  };
}

export default function Player() {
  const ref = useRef();
  const camYaw = useRef(0);
  const camPitch = useRef(0.25);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const stepClock = useRef(0);
  const { camera, gl } = useThree();
  const setPlayerPos = useWorld(s => s.setPlayerPos);

  useEffect(() => bindKeys(), []);

  useEffect(() => {
    const dom = gl.domElement;
    const onDown = (e) => { dragging.current = true; last.current = { x: e.clientX, y: e.clientY }; };
    const onUp = () => { dragging.current = false; };
    const onMove = (e) => {
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      camYaw.current -= dx * 0.005;
      camPitch.current = Math.max(-0.4, Math.min(0.9, camPitch.current + dy * 0.003));
    };
    dom.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => {
      dom.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, [gl]);

  useFrame((state, dt) => {
    if (!ref.current) return;
    const fwd = (KEYS.w ? 1 : 0) - (KEYS.s ? 1 : 0);
    const right = (KEYS.d ? 1 : 0) - (KEYS.a ? 1 : 0);

    if (fwd || right) {
      const yaw = camYaw.current;
      const dx = (Math.sin(yaw) * fwd - Math.cos(yaw) * right) * SPEED * dt;
      const dz = (Math.cos(yaw) * fwd + Math.sin(yaw) * right) * SPEED * dt;
      const p = ref.current.position;
      const u = useWorld.getState().unlocked;

      // axis-by-axis collision so player slides along walls
      const tryX = THREE.MathUtils.clamp(p.x + dx, ROOM_BOUNDS.minX, ROOM_BOUNDS.maxX);
      const wasBlocked = blocked(tryX, p.z, u);
      if (!wasBlocked) p.x = tryX;
      const tryZ = THREE.MathUtils.clamp(p.z + dz, ROOM_BOUNDS.minZ, ROOM_BOUNDS.maxZ);
      const wasBlockedZ = blocked(p.x, tryZ, u);
      if (!wasBlockedZ) p.z = tryZ;

      // footstep cadence (only if actually moved)
      const moved = (!wasBlocked && (dx !== 0)) || (!wasBlockedZ && (dz !== 0));
      if (moved) {
        stepClock.current += dt;
        if (stepClock.current >= STEP_INTERVAL) {
          stepClock.current = 0;
          sfx.step();
        }
      } else {
        stepClock.current = STEP_INTERVAL; // step immediately when starting to move again
      }

      // face movement direction
      const targetRot = Math.atan2(dx, dz);
      ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, targetRot, 12, dt);
    } else {
      stepClock.current = STEP_INTERVAL;
    }

    // 3rd-person orbit camera
    const p = ref.current.position;
    const yaw = camYaw.current;
    const pitch = camPitch.current;
    const cx = p.x - Math.sin(yaw) * Math.cos(pitch) * CAM_DIST;
    const cz = p.z - Math.cos(yaw) * Math.cos(pitch) * CAM_DIST;
    const cy = p.y + CAM_HEIGHT + Math.sin(pitch) * CAM_DIST * 0.5;
    camera.position.lerp({ x: cx, y: cy, z: cz }, 1 - Math.exp(-dt * 8));
    camera.lookAt(p.x, p.y + 1.0, p.z);

    setPlayerPos([p.x, p.y, p.z]);
  });

  return (
    <group ref={ref} position={[0, 0, 12]}>
      {/* body */}
      <mesh position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.4, 1.0, 8, 16]} />
        <meshStandardMaterial color="#0c1f15" emissive="#10b981" emissiveIntensity={0.5} />
      </mesh>
      {/* "head" / glowing core */}
      <mesh position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={2.5} />
      </mesh>
      {/* ground glow disc */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.8, 32]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}
