import React from 'react';
import { useWorld } from './store.js';

function fmtMs(ms) {
  if (ms == null) return '—';
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function Hud({ unlocked, onExit, worldBanner, tier, timerLeft, seed }) {
  const nearTerminal = useWorld(s => s.nearTerminal);
  const nearPad = useWorld(s => s.nearPad);
  const revealedChambers = useWorld(s => s.revealedChambers);
  const totalSolved = unlocked.filter(u => u !== 'exit').length;
  const isDaily = typeof seed === 'string' && seed.startsWith('d:');
  const timerLow = timerLeft != null && timerLeft < 10000;

  return (
    <>
      {/* top-left HUD */}
      <div className="absolute top-3 left-3 text-terminal-green font-mono text-xs space-y-1 pointer-events-none select-none">
        <div className="text-terminal-glow tracking-widest">▣ GHOSTWIRE :: M1 SERVER_ROOM</div>
        <div>nodes bypassed: {totalSolved}/3</div>
        <div className="text-terminal-green/60">[WASD] move · [drag] camera · [E] interact · [Esc] disconnect</div>
        <div className="text-terminal-glow/60 italic">hints carved on chamber walls · door opens when node bypassed</div>
      </div>

      {/* top-right cluster: tier/daily badges + timer + exit */}
      <div className="absolute top-3 right-3 flex items-center gap-2 font-mono pointer-events-auto">
        {isDaily && (
          <span className="text-[10px] tracking-widest px-2 py-1 border border-amber-400 text-amber-300 bg-amber-500/10 select-none">
            ◇ DAILY {seed.slice(2)}
          </span>
        )}
        {tier && tier !== 'story' && (
          <span
            className={`text-[10px] tracking-widest px-2 py-1 border select-none ${
              tier === 'ghost'
                ? 'border-fuchsia-400 text-fuchsia-300 bg-fuchsia-500/15'
                : 'border-rose-400 text-rose-300 bg-rose-500/15'
            }`}
          >
            ▲ {tier.toUpperCase()}
          </span>
        )}
        {timerLeft != null && (
          <span
            className={`text-sm px-2.5 py-1 tabular-nums font-bold border select-none ${
              timerLow
                ? 'border-terminal-red text-terminal-red bg-terminal-red/15 animate-pulse shadow-[0_0_15px_#ef444466]'
                : 'border-rose-400/60 text-rose-200 bg-rose-500/10'
            }`}
          >
            ⏱ {fmtMs(timerLeft)}
          </span>
        )}
        <button
          onClick={onExit}
          className="text-xs px-3 py-1 border border-terminal-glow/40 text-terminal-glow/80 bg-black/60 hover:bg-terminal-glow/20"
        >
          ← exit 3D
        </button>
      </div>

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
