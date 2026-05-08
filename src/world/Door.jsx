import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorld } from './store.js';
import { sfx } from '../fx/sound.js';

export default function Door({ position, requires, width = 3, height = 3 }) {
  const ref = useRef();
  const open = useWorld(s => requires ? s.unlocked.includes(requires) : true);
  const wasOpen = useRef(open);

  useEffect(() => {
    if (open && !wasOpen.current) sfx.doorOpen();
    wasOpen.current = open;
  }, [open]);

  useFrame((_state, dt) => {
    if (!ref.current) return;
    const target = open ? height + 0.05 : 0;
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, target, 4, dt);
  });

  const color = open ? '#10b981' : '#ef4444';

  return (
    <group position={position}>
      {/* door frame markers */}
      <mesh position={[-(width / 2 + 0.2), height / 2, 0]}>
        <boxGeometry args={[0.2, height + 0.4, 0.4]} />
        <meshStandardMaterial color="#0a0f0c" emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[width / 2 + 0.2, height / 2, 0]}>
        <boxGeometry args={[0.2, height + 0.4, 0.4]} />
        <meshStandardMaterial color="#0a0f0c" emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, height + 0.3, 0]}>
        <boxGeometry args={[width + 0.6, 0.2, 0.4]} />
        <meshStandardMaterial color="#0a0f0c" emissive={color} emissiveIntensity={0.3} />
      </mesh>
      {/* sliding door slab */}
      <group ref={ref} position={[0, 0, 0]}>
        <mesh position={[0, height / 2, 0]} castShadow>
          <boxGeometry args={[width, height, 0.15]} />
          <meshStandardMaterial color="#0c1f15" emissive={color} emissiveIntensity={0.45} />
        </mesh>
      </group>
    </group>
  );
}
