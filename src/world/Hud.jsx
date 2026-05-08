import React from 'react';
import { useWorld } from './store.js';

export default function Hud({ unlocked, onExit, worldBanner }) {
  const nearTerminal = useWorld(s => s.nearTerminal);
  const nearPad = useWorld(s => s.nearPad);
  const revealedChambers = useWorld(s => s.revealedChambers);
  const totalSolved = unlocked.filter(u => u !== 'exit').length;

  return (
    <>
      {/* top-left HUD */}
      <div className="absolute top-3 left-3 text-terminal-green font-mono text-xs space-y-1 pointer-events-none select-none">
        <div className="text-terminal-glow tracking-widest">▣ GHOSTWIRE :: M1 SERVER_ROOM</div>
        <div>nodes bypassed: {totalSolved}/3</div>
        <div className="text-terminal-green/60">[WASD] move · [drag] camera · [E] interact · [Esc] disconnect</div>
        <div className="text-terminal-glow/60 italic">hints carved on chamber walls · door opens when node bypassed</div>
      </div>

      {/* top-right exit */}
      <button
        onClick={onExit}
        className="absolute top-3 right-3 text-xs px-3 py-1 border border-terminal-glow/40 text-terminal-glow/80 bg-black/60 hover:bg-terminal-glow/20 font-mono pointer-events-auto"
      >
        ← exit 3D
      </button>

      {/* world banner — survives between terminal sessions */}
      {worldBanner && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 px-5 py-3 bg-emerald-900/60 border border-terminal-glow text-terminal-glow font-mono text-sm shadow-[0_0_30px_#10b98166] pointer-events-none animate-pulse">
          ▣ {worldBanner}
        </div>
      )}

      {/* bottom-center prompts */}
      {nearTerminal && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 border border-terminal-glow text-terminal-glow font-mono text-sm pointer-events-none">
          press <span className="text-white">[E]</span> to access {nearTerminal.toUpperCase()} terminal
        </div>
      )}
      {nearPad && !revealedChambers.has(nearPad) && !nearTerminal && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 border border-amber-400 text-amber-300 font-mono text-sm pointer-events-none">
          press <span className="text-white">[E]</span> to decrypt {nearPad.toUpperCase()} wall hints
        </div>
      )}

      {/* scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"
        style={{
          backgroundImage: 'repeating-linear-gradient(to bottom, rgba(16,185,129,0.08) 0 1px, transparent 1px 3px)'
        }}
      />
    </>
  );
}
