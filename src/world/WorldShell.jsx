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

export default function WorldShell({
  status, setStatus, unlocked, setUnlocked, activeNode, setActiveNode, nodes,
  onWin, onReset, onHintUsed, onExitWorld, seed, tier, timerLeft
}) {
  const setUnlockedStore = useWorld(s => s.setUnlocked);
  const closeTerminal = useWorld(s => s.closeTerminal);
  const activeTerminal = useWorld(s => s.activeTerminal);
  const startFlythrough = useWorld(s => s.startFlythrough);
  const endFlythrough = useWorld(s => s.endFlythrough);
  const prevUnlockedLen = useRef(unlocked.length);
  const [worldBanner, setWorldBanner] = useState(null);
  const [overlayBanner, setOverlayBanner] = useState(null);
  const pendingWin = useRef(false);

  useEffect(() => { setUnlockedStore(unlocked); }, [unlocked, setUnlockedStore]);

  useEffect(() => {
    if (unlocked.length > prevUnlockedLen.current && activeTerminal) {
      const justUnlocked = unlocked[unlocked.length - 1];
      const hint = NEXT_HINT[justUnlocked];
      if (hint) {
        setOverlayBanner(hint.msg);
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

  // Intercept the Terminal-issued win — start flythrough instead. Real
  // onWin (modal pop) fires when Flythrough.onDone() runs.
  function handleWinIntercept() {
    if (pendingWin.current) return;
    pendingWin.current = true;
    setOverlayBanner(null);
    closeTerminal();
    setWorldBanner('▣ ESCAPE_COMPLETE · cinematic in progress');
    sfx.win();
    // small delay so the player sees the door begin to open before camera moves
    setTimeout(() => startFlythrough(), 600);
  }

  function handleFlythroughDone() {
    endFlythrough();
    pendingWin.current = false;
    setWorldBanner(null);
    onWin?.();
  }

  return (
    <div className="relative w-full h-full bg-black">
      <Scene onFlythroughDone={handleFlythroughDone} />
      <Hud unlocked={unlocked} onExit={onExitWorld} worldBanner={worldBanner} tier={tier} timerLeft={timerLeft} seed={seed} />
      <TerminalOverlay
        banner={overlayBanner}
        seed={seed}
        tier={tier}
        status={status}
        setStatus={setStatus}
        unlocked={unlocked}
        setUnlocked={setUnlocked}
        activeNode={activeNode}
        setActiveNode={setActiveNode}
        nodes={nodes}
        onWin={handleWinIntercept}
        onReset={onReset}
        onHintUsed={onHintUsed}
      />
    </div>
  );
}
