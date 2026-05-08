import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useWorld } from './store.js';
import { sfx } from '../fx/sound.js';

const PROXIMITY = 1.8;

export default function ScanPad({ id, position }) {
  const padRef = useRef();
  const beamRef = useRef();
  const {
    playerPos, nearPad, setNearPad, revealedChambers, revealChamber
  } = useWorld();
  const revealed = revealedChambers.has(id);
  const isNear = nearPad === id;

  useFrame((state) => {
    const [px, , pz] = playerPos;
    const [tx, , tz] = position;
    const d2 = (px - tx) ** 2 + (pz - tz) ** 2;
    const within = d2 < PROXIMITY * PROXIMITY;

    if (within && nearPad !== id) setNearPad(id);
    else if (!within && nearPad === id) setNearPad(null);

    const t = state.clock.elapsedTime;
    if (padRef.current) {
      padRef.current.material.emissiveIntensity = revealed
        ? 1.4
        : 0.6 + Math.sin(t * 4) * 0.5;
    }
    if (beamRef.current) {
      beamRef.current.scale.y = revealed
        ? 0.4
        : 1.2 + Math.sin(t * 2.5) * 0.4;
      beamRef.current.material.opacity = revealed ? 0.15 : 0.45;
    }
  });

  useEffect(() => {
    if (!isNear || revealed) return;
    const onKey = (e) => {
      if (e.key.toLowerCase() === 'e') {
        sfx.scanStart();
        revealChamber(id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isNear, revealed, id, revealChamber]);

  const color = revealed ? '#10b981' : '#fbbf24';

  return (
    <group position={position}>
      {/* base plate */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.5, 0.55, 0.08, 24]} />
        <meshStandardMaterial color="#0a0f0c" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* glowing top */}
      <mesh ref={padRef} position={[0, 0.085, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.02, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </mesh>
      {/* upward beam (cylinder pretending to be holographic projection) */}
      <mesh ref={beamRef} position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.12, 0.42, 1.8, 16, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          toneMapped={false}
          side={2}
        />
      </mesh>
      {/* label */}
      <Text
        position={[0, 1.7, 0]}
        fontSize={0.13}
        color={color}
        anchorX="center"
        outlineWidth={0.01}
        outlineColor="#000"
      >
        {revealed ? 'SCAN_PAD :: DECRYPTED' : 'SCAN_PAD :: ENCRYPTED'}
      </Text>
      {isNear && !revealed && (
        <Text
          position={[0, 1.45, 0]}
          fontSize={0.12}
          color="#fff"
          anchorX="center"
          outlineWidth={0.01}
          outlineColor="#000"
        >
          [E] decrypt walls
        </Text>
      )}
    </group>
  );
}
