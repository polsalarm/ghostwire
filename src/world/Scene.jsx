import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, PerformanceMonitor } from '@react-three/drei';
import {
  EffectComposer, Bloom, ChromaticAberration, Scanline, Vignette, Noise
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import Player from './Player.jsx';
import Room from './Room.jsx';
import Flythrough from './Flythrough.jsx';

export default function Scene({ onFlythroughDone }) {
  const [dpr, setDpr] = useState(window.devicePixelRatio > 1 ? 1.5 : 1);
  const [enableShadows, setEnableShadows] = useState(true);
  const [heavyFx, setHeavyFx] = useState(true);

  return (
    <Canvas
      shadows={enableShadows}
      dpr={dpr}
      camera={{ position: [0, 5, 18], fov: 55 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{ background: '#020404' }}
    >
      <PerformanceMonitor
        bounds={() => [40, 60]}
        onIncline={() => setDpr(d => Math.min(window.devicePixelRatio || 2, d + 0.25))}
        onDecline={() => {
          setDpr(d => Math.max(0.75, d - 0.25));
          setHeavyFx(false);
          setEnableShadows(false);
        }}
      />
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
      <Flythrough onDone={onFlythroughDone} />

      <EffectComposer multisampling={0}>
        <Bloom intensity={heavyFx ? 0.55 : 0.3} luminanceThreshold={0.35} luminanceSmoothing={0.4} mipmapBlur />
        {heavyFx && <ChromaticAberration offset={[0.0009, 0.0014]} blendFunction={BlendFunction.NORMAL} />}
        <Scanline density={1.4} opacity={heavyFx ? 0.07 : 0.04} blendFunction={BlendFunction.OVERLAY} />
        {heavyFx && <Noise opacity={0.05} blendFunction={BlendFunction.OVERLAY} />}
        <Vignette eskil={false} offset={0.15} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}
