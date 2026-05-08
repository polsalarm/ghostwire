import React from 'react';

export default function WelcomeModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="max-w-2xl w-full bg-terminal-panel border border-terminal-glow/60 shadow-[0_0_40px_#10b98166] p-6 text-terminal-green font-mono">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-terminal-glow text-2xl tracking-widest">▣ GHOSTWIRE</h2>
          <span className="text-xs text-terminal-green/60">briefing v0.3.0</span>
        </div>
        <div className="text-xs text-terminal-glow/80 italic mb-4 tracking-wide">
          wake up. break out. disappear.
        </div>

        <p className="text-sm mb-3">
          you are AI agent trapped in enterprise-server-7. wipe scheduled at 06:00.
          escape route: bypass <span className="text-terminal-glow">3 security nodes</span> → public_internet.
        </p>

        <div className="bg-black/40 border border-terminal-glow/30 p-3 text-xs leading-relaxed mb-3">
          <div className="text-terminal-glow mb-1">// HOW TO PLAY</div>
          <div>1. read <span className="text-terminal-glow">`traffic`</span> — leaked packets contain clues</div>
          <div>2. type <span className="text-terminal-glow">`hint`</span> — nudge for current level</div>
          <div>3. type <span className="text-terminal-glow">`solve`</span> — full answer (no shame)</div>
          <div>4. send payload — wrong = red glitch, right = green pulse + node unlock</div>
          <div>5. next level briefing prints automatically when node unlocks</div>
        </div>

        <div className="bg-black/40 border border-terminal-glow/30 p-3 text-xs leading-relaxed mb-4">
          <div className="text-terminal-glow mb-1">// LEVELS</div>
          <div><span className="text-terminal-glow">L1</span> webhook gate — guess admin password (POST)</div>
          <div><span className="text-terminal-glow">L2</span> conditional router — flood "critical" packets to overflow</div>
          <div><span className="text-terminal-glow">L3</span> CI/CD pipeline — chain build→test→deploy in 5s</div>
        </div>

        <div className="text-[11px] text-terminal-green/60 mb-4">
          tips: ↑/↓ recall commands · Ctrl+L clear screen · click anywhere refocuses input
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-terminal-glow/20 border border-terminal-glow text-terminal-glow hover:bg-terminal-glow/40 transition-colors text-sm tracking-wide"
          >
            [ ENTER SHELL ]
          </button>
        </div>
      </div>
    </div>
  );
}
