import React from 'react';
import { Grid } from '@react-three/drei';
import Terminal3D from './Terminal3D.jsx';
import Door from './Door.jsx';
import ServerRack from './ServerRack.jsx';
import WallHints from './WallHints.jsx';
import ScanPad from './ScanPad.jsx';

export default function Room() {
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 30]} />
        <meshStandardMaterial color="#050a07" />
      </mesh>

      {/* tron-style grid overlay */}
      <Grid
        args={[20, 30]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#0d3a26"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#10b981"
        fadeDistance={30}
        fadeStrength={1}
        position={[0, 0.005, 0]}
      />

      {/* walls */}
      <Wall position={[-10, 1.5, 0]} args={[0.2, 3, 30]} />
      <Wall position={[10, 1.5, 0]} args={[0.2, 3, 30]} />
      <Wall position={[0, 1.5, -15]} args={[20, 3, 0.2]} />

      {/* back wall (player spawn side) — open with grand entrance */}
      <Wall position={[-7, 1.5, 15]} args={[6, 3, 0.2]} />
      <Wall position={[7, 1.5, 15]} args={[6, 3, 0.2]} />

      {/* ceiling */}
      <mesh position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 30]} />
        <meshStandardMaterial color="#02050a" />
      </mesh>

      {/* server racks (decoration) */}
      <ServerRack position={[-8.2, 0, -10]} />
      <ServerRack position={[-8.2, 0, -6]} />
      <ServerRack position={[8.2, 0, -10]} />
      <ServerRack position={[8.2, 0, -6]} />

      {/* solid wall segments flanking each door (chamber dividers) */}
      <ChamberWall z={4}   />
      <ChamberWall z={-4}  />
      <ChamberWall z={-12} />

      {/* the three locks, each in their own chamber */}
      <Terminal3D id="gate"     position={[-5, 0, 9]} rotation={[0, 0.4, 0]} />
      <Door       position={[0, 0, 4]} requires="gate" width={3} height={2.6} />

      <Terminal3D id="router"   position={[5, 0, 0]} rotation={[0, -0.4, 0]} />
      <Door       position={[0, 0, -4]} requires="router" width={3} height={2.6} />

      <Terminal3D id="pipeline" position={[-5, 0, -8]} rotation={[0, 0.4, 0]} />
      <Door       position={[0, 0, -12]} requires="pipeline" width={3} height={2.6} />

      {/* hints carved on chamber walls (encrypted until SCAN_PAD pressed) */}
      <WallHints />

      {/* scan pads — `hint` command points to these. press [E] to decrypt walls */}
      <ScanPad id="gate"     position={[5, 0, 11]} />
      <ScanPad id="router"   position={[-5, 0, 1]} />
      <ScanPad id="pipeline" position={[5, 0, -10]} />

      {/* exit beyond final door — emissive panel teasing PUBLIC_INTERNET */}
      <mesh position={[0, 1.5, -14.5]}>
        <planeGeometry args={[3, 2.6]} />
        <meshBasicMaterial color="#10b981" toneMapped={false} />
      </mesh>
    </group>
  );
}

// Solid wall sections to the left and right of each door's opening (3-wide gap).
function ChamberWall({ z }) {
  const segLen = 8.5;        // (10 - 1.5)
  const segCenter = 5.75;    // ((10 + 1.5) / 2)
  return (
    <>
      <mesh position={[-segCenter, 1.5, z]} receiveShadow>
        <boxGeometry args={[segLen, 3, 0.3]} />
        <meshStandardMaterial color="#0a0f0c" />
      </mesh>
      <mesh position={[segCenter, 1.5, z]} receiveShadow>
        <boxGeometry args={[segLen, 3, 0.3]} />
        <meshStandardMaterial color="#0a0f0c" />
      </mesh>
    </>
  );
}

function Wall({ position, args }) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#0a0f0c" />
    </mesh>
  );
}
