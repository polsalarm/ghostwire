import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function ServerRack({ position }) {
  const blink = useRef([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    blink.current.forEach((m, i) => {
      if (!m) return;
      const phase = (t * 1.5 + i * 0.7) % 2;
      m.material.emissiveIntensity = phase < 0.1 ? 2.5 : 0.3;
    });
  });

  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[1, 2.4, 1]} />
        <meshStandardMaterial color="#0a0f0c" />
      </mesh>
      {/* blinking LEDs */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh
          key={i}
          ref={(m) => (blink.current[i] = m)}
          position={[0.51, 0.4 + i * 0.35, 0]}
        >
          <boxGeometry args={[0.04, 0.08, 0.08]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={0.3}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
