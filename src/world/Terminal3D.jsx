import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useWorld } from './store.js';
import { sfx } from '../fx/sound.js';

const PROXIMITY = 2.6;

const META = {
  gate:     { label: 'NODE_1  WEBHOOK_GATE',  color: '#10b981' },
  router:   { label: 'NODE_2  COND_ROUTER',   color: '#f59e0b' },
  pipeline: { label: 'NODE_3  CICD_PIPELINE', color: '#3b82f6' }
};

export default function Terminal3D({ id, position, rotation = [0, 0, 0] }) {
  const ref = useRef();
  const screenRef = useRef();
  const ledRef = useRef();
  const { unlocked, nearTerminal, setNearTerminal, openTerminal, playerPos } = useWorld();
  const isUnlocked = unlocked.includes(id);
  const isNear = nearTerminal === id;
  const meta = META[id] || { label: id, color: '#10b981' };

  useFrame((state) => {
    const [px, , pz] = playerPos;
    const [tx, , tz] = position;
    const d2 = (px - tx) ** 2 + (pz - tz) ** 2;
    const within = d2 < PROXIMITY * PROXIMITY;

    if (within && nearTerminal !== id) setNearTerminal(id);
    else if (!within && nearTerminal === id) setNearTerminal(null);

    const t = state.clock.elapsedTime;
    if (screenRef.current) {
      const baseI = isUnlocked ? 1.6 : 1.1;
      screenRef.current.material.emissiveIntensity = baseI + Math.sin(t * 3 + position[0]) * 0.18;
    }
    if (ledRef.current) {
      const blink = isUnlocked
        ? 2.5
        : (Math.sin(t * 2.5 + position[2]) > 0.7 ? 2.5 : 0.4);
      ledRef.current.material.emissiveIntensity = blink;
    }
  });

  // E-key handler when near and still locked
  useEffect(() => {
    if (!isNear || isUnlocked) return;
    const onKey = (e) => {
      if (e.key.toLowerCase() === 'e') {
        sfx.interact();
        openTerminal(id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isNear, isUnlocked, id, openTerminal]);

  const screenColor = isUnlocked ? '#10b981' : meta.color;
  const accent = isUnlocked ? '#10b981' : meta.color;

  return (
    <group ref={ref} position={position} rotation={rotation}>
      {/* desk slab */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 0.08, 1.1]} />
        <meshStandardMaterial color="#111714" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* desk legs */}
      {[[-0.9, 0.2, -0.5], [0.9, 0.2, -0.5], [-0.9, 0.2, 0.5], [0.9, 0.2, 0.5]].map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <boxGeometry args={[0.06, 0.4, 0.06]} />
          <meshStandardMaterial color="#0a0f0c" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* tower / PC case under desk */}
      <mesh position={[-0.7, 0.25, -0.3]} castShadow>
        <boxGeometry args={[0.25, 0.45, 0.45]} />
        <meshStandardMaterial color="#0a0f0c" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* tower power LED */}
      <mesh ref={ledRef} position={[-0.58, 0.4, -0.3]}>
        <boxGeometry args={[0.02, 0.04, 0.04]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1} toneMapped={false} />
      </mesh>
      {/* tower vent slots */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-0.58, 0.15 + i * 0.06, -0.3]}>
          <boxGeometry args={[0.005, 0.02, 0.32]} />
          <meshStandardMaterial color="#000" />
        </mesh>
      ))}

      {/* monitor stand */}
      <mesh position={[0, 0.55, 0.05]} castShadow>
        <boxGeometry args={[0.18, 0.25, 0.18]} />
        <meshStandardMaterial color="#0a0f0c" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.46, 0.05]} castShadow>
        <boxGeometry args={[0.45, 0.04, 0.3]} />
        <meshStandardMaterial color="#0a0f0c" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* monitor bezel */}
      <mesh position={[0, 1.1, 0.0]} rotation={[-0.08, 0, 0]} castShadow>
        <boxGeometry args={[1.6, 1.05, 0.08]} />
        <meshStandardMaterial color="#080d0a" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* screen — sits in bezel */}
      <mesh ref={screenRef} position={[0, 1.1, 0.045]} rotation={[-0.08, 0, 0]}>
        <planeGeometry args={[1.42, 0.88]} />
        <meshStandardMaterial
          color={screenColor}
          emissive={screenColor}
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
      {/* monitor brand bar */}
      <mesh position={[0, 0.55, 0.045]} rotation={[-0.08, 0, 0]}>
        <planeGeometry args={[0.4, 0.04]} />
        <meshBasicMaterial color="#10b981" toneMapped={false} />
      </mesh>

      {/* keyboard */}
      <mesh position={[0, 0.46, 0.42]} rotation={[-0.05, 0, 0]} castShadow>
        <boxGeometry args={[1.0, 0.04, 0.32]} />
        <meshStandardMaterial color="#0a0f0c" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* keycap rows (decorative) */}
      {Array.from({ length: 4 }).map((_, row) =>
        Array.from({ length: 12 }).map((_, col) => (
          <mesh
            key={`${row}-${col}`}
            position={[-0.45 + col * 0.082, 0.49, 0.32 + row * 0.062]}
            rotation={[-0.05, 0, 0]}
          >
            <boxGeometry args={[0.06, 0.018, 0.05]} />
            <meshStandardMaterial color="#1a2620" />
          </mesh>
        ))
      )}

      {/* mouse */}
      <mesh position={[0.65, 0.46, 0.4]} castShadow>
        <boxGeometry args={[0.12, 0.04, 0.18]} />
        <meshStandardMaterial color="#0a0f0c" metalness={0.3} roughness={0.6} />
      </mesh>

      {/* chair (simple) */}
      <group position={[0, 0, 0.9]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.6, 0.08, 0.55]} />
          <meshStandardMaterial color="#0a0f0c" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.95, 0.25]} castShadow>
          <boxGeometry args={[0.55, 0.85, 0.08]} />
          <meshStandardMaterial color="#0a0f0c" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
          <meshStandardMaterial color="#0a0f0c" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* glowing label hovering above */}
      <Text
        position={[0, 1.95, 0]}
        fontSize={0.18}
        color={screenColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.012}
        outlineColor="#000"
      >
        {meta.label}{isUnlocked ? '  [BYPASSED]' : '  [LOCKED]'}
      </Text>

      {/* proximity prompt */}
      {isNear && !isUnlocked && (
        <Text
          position={[0, 1.7, 0]}
          fontSize={0.13}
          color="#ffffff"
          anchorX="center"
          outlineWidth={0.012}
          outlineColor="#000"
        >
          [E] interact
        </Text>
      )}
    </group>
  );
}
