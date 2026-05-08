import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import Player from './Player.jsx';
import Room from './Room.jsx';

export default function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 5, 18], fov: 55 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#020404' }}
    >
      {/* fog cuts the corridor for atmosphere */}
      <fog attach="fog" args={['#020404', 8, 32]} />

      {/* ambient + key + accent lighting */}
      <ambientLight intensity={0.18} />
      <hemisphereLight args={['#10b981', '#020404', 0.25]} />
      <pointLight position={[0, 2.5, 12]} intensity={4} color="#10b981" distance={10} />
      <pointLight position={[0, 2.5, 0]}  intensity={4} color="#f59e0b" distance={10} />
      <pointLight position={[0, 2.5, -10]} intensity={4} color="#3b82f6" distance={10} />
      <pointLight position={[0, 2.5, -14.5]} intensity={6} color="#10b981" distance={8} />

      <Environment preset="night" />

      <Room />
      <Player />
    </Canvas>
  );
}
