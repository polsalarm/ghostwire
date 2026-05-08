import React from 'react';
import Terminal from '../components/Terminal.jsx';
import { useWorld } from './store.js';

// Wraps existing Terminal component as a modal overlay. When the player
// interacts with a 3D terminal prop, this opens with the same puzzle
// shell — preserving all existing engine.js logic untouched.
export default function TerminalOverlay({
  status, setStatus, unlocked, setUnlocked, activeNode, setActiveNode, nodes,
  onWin, onReset, onHintUsed, banner, seed, tier
}) {
  const activeTerminal = useWorld(s => s.activeTerminal);
  const closeTerminal = useWorld(s => s.closeTerminal);
  if (!activeTerminal) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl h-[80vh] flex flex-col border-2 border-terminal-glow shadow-[0_0_60px_#10b98166] bg-terminal-bg">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-terminal-glow/30 bg-terminal-panel">
          <span className="text-terminal-glow text-xs tracking-widest">
            ▣ {activeTerminal.toUpperCase()} TERMINAL
          </span>
          <button
            onClick={closeTerminal}
            className="text-xs px-2 py-0.5 border border-terminal-glow/40 text-terminal-green/80 hover:bg-terminal-glow/15"
            title="disconnect terminal (Esc)"
          >
            disconnect [Esc]
          </button>
        </div>
        {banner && (
          <div className="px-3 py-2 bg-emerald-900/40 border-b border-terminal-glow text-terminal-glow text-xs font-mono tracking-wide animate-pulse">
            ▣ {banner} · disconnecting in 2s... or press [Esc] now
          </div>
        )}
        <div className="flex-1 min-h-0">
          <Terminal
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
            mode="3d"
            seed={seed}
            tier={tier}
          />
        </div>
      </div>
    </div>
  );
}
