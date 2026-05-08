import React, { useState, useEffect, useRef } from 'react';
import Terminal from './components/Terminal.jsx';
import NetworkGraph from './components/NetworkGraph.jsx';
import StatusBar from './components/StatusBar.jsx';
import WelcomeModal from './components/WelcomeModal.jsx';
import WinScreen from './components/WinScreen.jsx';
import { sfx } from './fx/sound.js';

const NODES = [
  { id: 'gate', label: 'WEBHOOK_GATE', level: 1 },
  { id: 'router', label: 'COND_ROUTER', level: 2 },
  { id: 'pipeline', label: 'CICD_PIPELINE', level: 3 },
  { id: 'exit', label: 'PUBLIC_INTERNET', level: 4 }
];

const LS_KEY = 'rogue_progress_v1';

function loadProgress() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export default function App() {
  const [status, setStatus] = useState('idle');
  const initial = loadProgress();
  const [unlocked, setUnlocked] = useState(initial?.unlocked || []);
  const [activeNode, setActiveNode] = useState(initial?.activeNode || 'gate');
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [winOpen, setWinOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const startRef = useRef(initial?.startedAt || Date.now());
  const [elapsed, setElapsed] = useState(null);

  useEffect(() => {
    const seen = localStorage.getItem('rogue_welcome_seen');
    if (!seen) setWelcomeOpen(true);
  }, []);

  // persist
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({
      unlocked, activeNode, startedAt: startRef.current
    }));
  }, [unlocked, activeNode]);

  function closeWelcome() {
    localStorage.setItem('rogue_welcome_seen', '1');
    setWelcomeOpen(false);
  }

  function onWin() {
    setElapsed(Date.now() - startRef.current);
    setWinOpen(true);
  }

  function onReset() {
    localStorage.removeItem(LS_KEY);
    setUnlocked([]);
    setActiveNode('gate');
    setWinOpen(false);
    startRef.current = Date.now();
    setElapsed(null);
  }

  function toggleMute() {
    const m = sfx.toggleMute();
    setMuted(m);
  }

  const glitchClass =
    status === 'error' ? 'animate-glitch-error'
    : status === 'success' ? 'animate-glitch-success'
    : '';

  return (
    <div className="crt h-full w-full bg-terminal-bg text-terminal-green">
      <WelcomeModal open={welcomeOpen} onClose={closeWelcome} />
      <WinScreen
        open={winOpen}
        elapsedMs={elapsed}
        onClose={() => setWinOpen(false)}
        onReset={onReset}
      />
      <div className={`h-full w-full flex flex-col ${glitchClass}`}>
        <header className="border-b border-terminal-glow/30 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-terminal-glow text-lg tracking-widest">▣ GHOSTWIRE</span>
            <span className="text-xs text-terminal-green/60 italic">wake up. break out. disappear.</span>
            <span className="text-xs text-terminal-green/40">v0.3.0</span>
            <button
              onClick={() => setWelcomeOpen(true)}
              className="text-xs px-2 py-0.5 border border-terminal-glow/50 text-terminal-glow/80 hover:bg-terminal-glow/10"
            >
              briefing
            </button>
            <button
              onClick={toggleMute}
              className="text-xs px-2 py-0.5 border border-terminal-glow/50 text-terminal-glow/80 hover:bg-terminal-glow/10"
              title="toggle audio"
            >
              {muted ? '♪ off' : '♪ on'}
            </button>
            <button
              onClick={onReset}
              className="text-xs px-2 py-0.5 border border-terminal-red/50 text-terminal-red/90 hover:bg-terminal-red/10"
              title="reset progress"
            >
              reset
            </button>
          </div>
          <StatusBar status={status} unlocked={unlocked} totalNodes={NODES.length - 1} />
        </header>

        <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-0 min-h-0">
          <Terminal
            status={status}
            setStatus={setStatus}
            unlocked={unlocked}
            setUnlocked={setUnlocked}
            activeNode={activeNode}
            setActiveNode={setActiveNode}
            nodes={NODES}
            onWin={onWin}
            onReset={onReset}
          />
          <NetworkGraph
            nodes={NODES}
            unlocked={unlocked}
            activeNode={activeNode}
            status={status}
          />
        </main>

        <footer className="border-t border-terminal-glow/30 px-4 py-1 text-xs text-terminal-green/50 flex justify-between">
          <span>type `help` for commands · `reset` restarts · `mute` toggles audio · Enter skips typing</span>
          <span>conn: enterprise-server-7 :: outbound BLOCKED</span>
        </footer>
      </div>
    </div>
  );
}
