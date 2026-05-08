import React from 'react';

const LEVEL_DEFS = [
  { id: 'gate',     label: 'L1', body: 'webhook gate — guess admin password (POST)' },
  { id: 'router',   label: 'L2', body: 'conditional router — flood "critical" packets to overflow' },
  { id: 'pipeline', label: 'L3', body: 'CI/CD pipeline — chain build→test→deploy in 5s' }
];

function loadUnlocked() {
  try {
    const raw = localStorage.getItem('rogue_progress_v1');
    if (!raw) return [];
    return JSON.parse(raw).unlocked || [];
  } catch { return []; }
}

export default function WelcomeModal({ open, onClose, unlocked }) {
  if (!open) return null;

  const done = Array.isArray(unlocked) ? unlocked : loadUnlocked();
  const remaining = LEVEL_DEFS.filter(l => !done.includes(l.id));
  const allDone = remaining.length === 0;

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
          <div className="flex items-center justify-between mb-1">
            <span className="text-terminal-glow">// {allDone ? 'PROGRESS' : 'REMAINING LEVELS'}</span>
            <span className="text-terminal-green/60">{done.length}/{LEVEL_DEFS.length} bypassed</span>
          </div>
          {allDone ? (
            <div className="text-emerald-300">all nodes bypassed. type `reset` in shell to play again.</div>
          ) : (
            remaining.map(l => (
              <div key={l.id}>
                <span className="text-terminal-glow">{l.label}</span> {l.body}
              </div>
            ))
          )}
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
