import React, { useEffect, useRef, useState } from 'react';
import Scene from './Scene.jsx';
import Hud from './Hud.jsx';
import TerminalOverlay from './TerminalOverlay.jsx';
import { useWorld } from './store.js';
import { sfx } from '../fx/sound.js';

const NEXT_HINT = {
  gate:     { next: 'router',   msg: 'NODE_1 BYPASSED · walk to NODE_2 (COND_ROUTER) and press [E]' },
  router:   { next: 'pipeline', msg: 'NODE_2 BYPASSED · walk to NODE_3 (CICD_PIPELINE) and press [E]' },
  pipeline: { next: null,       msg: 'NODE_3 BYPASSED · ESCAPE_COMPLETE' }
};

const CLOSE_DELAY_MS = 2500;

// 3D shell. Receives all puzzle state from <App /> and forwards to embedded
// Terminal via TerminalOverlay. Sync `unlocked` into zustand so 3D props
// (doors, terminal screens) react.
export default function WorldShell({
  status, setStatus, unlocked, setUnlocked, activeNode, setActiveNode, nodes,
  onWin, onReset, onHintUsed, onExitWorld
}) {
  const setUnlockedStore = useWorld(s => s.setUnlocked);
  const closeTerminal = useWorld(s => s.closeTerminal);
  const activeTerminal = useWorld(s => s.activeTerminal);
  const prevUnlockedLen = useRef(unlocked.length);
  const [worldBanner, setWorldBanner] = useState(null);
  const [overlayBanner, setOverlayBanner] = useState(null);

  // mirror App's unlocked into store
  useEffect(() => { setUnlockedStore(unlocked); }, [unlocked, setUnlockedStore]);

  // detect new unlock while overlay is open → show banner + auto-disconnect
  useEffect(() => {
    if (unlocked.length > prevUnlockedLen.current && activeTerminal) {
      const justUnlocked = unlocked[unlocked.length - 1];
      const hint = NEXT_HINT[justUnlocked];
      if (hint) {
        setOverlayBanner(hint.msg);
        // pipeline = final level → win screen handles flow, just leave overlay
        if (hint.next) {
          const t = setTimeout(() => {
            setOverlayBanner(null);
            closeTerminal();
            setWorldBanner(hint.msg);
            setTimeout(() => setWorldBanner(null), 4500);
          }, CLOSE_DELAY_MS);
          return () => clearTimeout(t);
        }
      }
    }
    prevUnlockedLen.current = unlocked.length;
  }, [unlocked, activeTerminal, closeTerminal]);

  // Esc closes any open terminal overlay
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && activeTerminal) {
        sfx.disconnect();
        setOverlayBanner(null);
        closeTerminal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTerminal, closeTerminal]);

  return (
    <div className="relative w-full h-full bg-black">
      <Scene />
      <Hud unlocked={unlocked} onExit={onExitWorld} worldBanner={worldBanner} />
      <TerminalOverlay
        banner={overlayBanner}
        status={status}
        setStatus={setStatus}
        unlocked={unlocked}
        setUnlocked={setUnlocked}
        activeNode={activeNode}
        setActiveNode={setActiveNode}
        nodes={nodes}
        onWin={onWin}
        onReset={onReset}
        onHintUsed={onHintUsed}
      />
    </div>
  );
}
