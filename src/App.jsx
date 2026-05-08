import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import Terminal from './components/Terminal.jsx';
import NetworkGraph from './components/NetworkGraph.jsx';
import StatusBar from './components/StatusBar.jsx';
import WelcomeModal from './components/WelcomeModal.jsx';
import WinScreen from './components/WinScreen.jsx';
import Hero from './Hero.jsx';
import { sfx } from './fx/sound.js';

const WorldShell = lazy(() => import('./world/WorldShell.jsx'));

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
  const [hintsUsed, setHintsUsed] = useState(initial?.hintsUsed || 0);
  const [screen, setScreen] = useState(() => {
    if (window.location.hash === '#3d') return 'world';
    if (window.location.hash === '#shell') return 'shell';
    return localStorage.getItem('gw_skip_hero') ? 'shell' : 'hero';
  });

  // sync screen with hash so back/forward + share-links work
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash;
      if (h === '#3d') setScreen('world');
      else if (h === '#shell') setScreen('shell');
      else if (h === '' || h === '#') setScreen(localStorage.getItem('gw_skip_hero') ? 'shell' : 'hero');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function enterShell() {
    localStorage.setItem('gw_skip_hero', '1');
    setScreen('shell');
  }

  function enterWorld() {
    localStorage.setItem('gw_skip_hero', '1');
    window.location.hash = '#3d';
    setScreen('world');
  }

  function exitWorld() {
    window.location.hash = '#shell';
    setScreen('shell');
  }

  function backToHero() {
    localStorage.removeItem('gw_skip_hero');
    window.location.hash = '';
    setScreen('hero');
  }

  // briefing is shown on hero before entering; only auto-pop here if user
  // bypassed hero (e.g. opened with #shell hash) and hasn't seen it yet.
  useEffect(() => {
    if (screen !== 'shell') return;
    const seen = localStorage.getItem('rogue_welcome_seen');
    const skippedHero = window.location.hash === '#shell';
    if (!seen && skippedHero) setWelcomeOpen(true);
  }, [screen]);

  // persist
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({
      unlocked, activeNode, startedAt: startRef.current, hintsUsed
    }));
  }, [unlocked, activeNode, hintsUsed]);

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
    setHintsUsed(0);
  }

  function toggleMute() {
    const m = sfx.toggleMute();
    setMuted(m);
  }

  const glitchClass =
    status === 'error' ? 'animate-glitch-error'
    : status === 'success' ? 'animate-glitch-success'
    : '';

  if (screen === 'hero') {
    return <Hero onEnter={enterShell} onEnter3D={enterWorld} />;
  }

  if (screen === 'world') {
    return (
      <Suspense
        fallback={
          <div className="h-full w-full flex items-center justify-center bg-black text-terminal-glow font-mono text-sm">
            booting 3D shell...
          </div>
        }
      >
        <WelcomeModal open={welcomeOpen} onClose={closeWelcome} unlocked={unlocked} />
        <WinScreen
          open={winOpen}
          elapsedMs={elapsed}
          hintsUsed={hintsUsed}
          onClose={() => setWinOpen(false)}
          onReset={onReset}
        />
        <WorldShell
          status={status}
          setStatus={setStatus}
          unlocked={unlocked}
          setUnlocked={setUnlocked}
          activeNode={activeNode}
          setActiveNode={setActiveNode}
          nodes={NODES}
          onWin={onWin}
          onReset={onReset}
          onHintUsed={() => setHintsUsed(n => n + 1)}
          onExitWorld={exitWorld}
        />
      </Suspense>
    );
  }

  return (
    <div className="crt h-full w-full bg-terminal-bg text-terminal-green">
      <WelcomeModal open={welcomeOpen} onClose={closeWelcome} unlocked={unlocked} />
      <WinScreen
        open={winOpen}
        elapsedMs={elapsed}
        hintsUsed={hintsUsed}
        onClose={() => setWinOpen(false)}
        onReset={onReset}
      />
      <div className={`h-full w-full flex flex-col ${glitchClass}`}>
        <header className="border-b border-terminal-glow/30 px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={backToHero}
              title="back to landing page"
              className="group flex items-center gap-1.5 px-3 py-1 border border-terminal-glow text-terminal-glow
                         bg-terminal-glow/10 hover:bg-terminal-glow/25 hover:shadow-[0_0_12px_#10b98166] transition-all text-xs tracking-widest"
            >
              <span className="text-base leading-none group-hover:-translate-x-0.5 transition-transform">←</span>
              <span>HERO</span>
            </button>
            <button
              onClick={enterWorld}
              title="enter 3D server room (beta)"
              className="px-3 py-1 border border-fuchsia-400 text-fuchsia-300 bg-fuchsia-500/10 hover:bg-fuchsia-500/25 hover:shadow-[0_0_12px_#e879f966] transition-all text-xs tracking-widest"
            >
              ◉ 3D MODE
            </button>
            <span className="text-terminal-glow text-lg tracking-widest">▣ GHOSTWIRE</span>
            <span className="text-xs text-terminal-green/60 italic hidden md:inline">wake up. break out. disappear.</span>
            <span className="text-xs text-terminal-green/40">v0.3.0</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBar status={status} unlocked={unlocked} totalNodes={NODES.length - 1} />
            <button
              onClick={() => setWelcomeOpen(true)}
              className="text-xs px-2 py-0.5 border border-terminal-glow/50 text-terminal-glow/80 hover:bg-terminal-glow/10"
              title="reopen briefing"
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
            onHintUsed={() => setHintsUsed(n => n + 1)}
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
