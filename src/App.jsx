import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import Terminal from './components/Terminal.jsx';
import NetworkGraph from './components/NetworkGraph.jsx';
import StatusBar from './components/StatusBar.jsx';
import WelcomeModal from './components/WelcomeModal.jsx';
import WinScreen from './components/WinScreen.jsx';
import Hero from './Hero.jsx';
import { sfx } from './fx/sound.js';
import { dailySeed, todayUTC, isDailySeed } from '../shared/puzzles/rng.js';
import { TIERS, tierOrDefault } from '../shared/puzzles/tier.js';
import { startRecording, stopRecording, snapshot as snapshotTrace } from './runRecorder.js';

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

function fmtMs(ms) {
  if (ms == null) return '—';
  const s = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${String(ss).padStart(2, '0')}`;
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
  const [seed, setSeed] = useState(initial?.seed || null);  // null = free play; 'd:YYYY-MM-DD' = daily
  const [tier, setTier] = useState(initial?.tier || 'story');
  const [timerLeft, setTimerLeft] = useState(null); // ms remaining in tier timer; null = no timer
  const [expiredOpen, setExpiredOpen] = useState(false);
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

  function enterShell(opts = {}) {
    startFreshRun(opts);
    localStorage.setItem('gw_skip_hero', '1');
    setScreen('shell');
  }

  function enterWorld(opts = {}) {
    startFreshRun(opts);
    localStorage.setItem('gw_skip_hero', '1');
    window.location.hash = '#3d';
    setScreen('world');
  }

  // Hero always launches a fresh run. Resets timer, unlocks, hints — so
  // a HARDENED/GHOST tier gets a real 60s budget instead of inheriting
  // an ancient startedAt from a previous session.
  function startFreshRun(opts = {}) {
    setTier(opts.tier || 'story');
    setSeed(opts.daily ? dailySeed(todayUTC()) : null);
    setUnlocked([]);
    setActiveNode('gate');
    setHintsUsed(0);
    startRef.current = Date.now();
    setElapsed(null);
    setWinOpen(false);
    setExpiredOpen(false);
    startRecording();
  }

  function dismissExpired() {
    setExpiredOpen(false);
    onReset();
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
      unlocked, activeNode, startedAt: startRef.current, hintsUsed, seed, tier
    }));
  }, [unlocked, activeNode, hintsUsed, seed, tier]);

  // tier timer — only ticks while playing (screen=shell|world) and run not won
  useEffect(() => {
    const cfg = tierOrDefault(tier);
    if (!cfg.timerMs || screen === 'hero' || winOpen || expiredOpen) {
      setTimerLeft(null);
      return;
    }
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const left = Math.max(0, cfg.timerMs - elapsed);
      setTimerLeft(left);
      if (left <= 0) {
        setExpiredOpen(true);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [tier, screen, winOpen, expiredOpen]);

  // if a stored daily seed is from a previous UTC day, treat as expired and reset
  // also: if loaded with a timer-tier whose budget already elapsed, drop to story
  useEffect(() => {
    if (isDailySeed(seed)) {
      const today = dailySeed(todayUTC());
      if (seed !== today) {
        setSeed(null);
        setUnlocked([]);
        setActiveNode('gate');
        startRef.current = Date.now();
        setHintsUsed(0);
      }
    }
    const cfg = tierOrDefault(tier);
    if (cfg.timerMs && Date.now() - startRef.current > cfg.timerMs) {
      // session was idle past the timer budget — drop to story rather than
      // expiring the user the moment they reopen the tab
      setTier('story');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function closeWelcome() {
    localStorage.setItem('rogue_welcome_seen', '1');
    setWelcomeOpen(false);
  }

  function onWin() {
    setElapsed(Date.now() - startRef.current);
    stopRecording();
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
    setSeed(null);
    setTier('story');
    setExpiredOpen(false);
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
        <ExpiredModal open={expiredOpen} tier={tier} onDismiss={dismissExpired} />
        <WinScreen
          open={winOpen}
          elapsedMs={elapsed}
          hintsUsed={hintsUsed}
          seed={seed}
          tier={tier}
          onClose={() => setWinOpen(false)}
          onReset={onReset}
        />
        <WorldShell
          seed={seed}
          tier={tier}
          timerLeft={timerLeft}
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
      <ExpiredModal open={expiredOpen} tier={tier} onDismiss={dismissExpired} />
      <WinScreen
        open={winOpen}
        elapsedMs={elapsed}
        hintsUsed={hintsUsed}
        seed={seed}
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
            <span className="text-xs text-terminal-green/40">v0.4.0</span>
            {seed && isDailySeed(seed) && (
              <span
                className="text-[10px] tracking-widest px-2 py-0.5 border border-amber-400 text-amber-300 bg-amber-500/10"
                title="daily challenge run — counts toward today's leaderboard"
              >
                ◇ DAILY {seed.slice(2)}
              </span>
            )}
            {tier && tier !== 'story' && (
              <span
                className={`text-[10px] tracking-widest px-2 py-0.5 border ${
                  tier === 'ghost'
                    ? 'border-fuchsia-400 text-fuchsia-300 bg-fuchsia-500/10'
                    : 'border-rose-400 text-rose-300 bg-rose-500/10'
                }`}
                title={`tier=${tier} · score multiplier ×${tierOrDefault(tier).mul}`}
              >
                ▲ {tier.toUpperCase()}
              </span>
            )}
            {timerLeft != null && (
              <span
                className={`text-xs px-2 py-0.5 tabular-nums font-bold border ${
                  timerLeft < 10000
                    ? 'border-terminal-red text-terminal-red bg-terminal-red/15 animate-pulse'
                    : 'border-rose-400/60 text-rose-300 bg-rose-500/10'
                }`}
                title="run timer — expires the run when it hits 0"
              >
                ⏱ {fmtMs(timerLeft)}
              </span>
            )}
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
            seed={seed}
            tier={tier}
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

function ExpiredModal({ open, tier, onDismiss }) {
  if (!open) return null;
  const cfg = tierOrDefault(tier);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="max-w-md w-full bg-terminal-panel border-2 border-terminal-red shadow-[0_0_50px_#ef444499] p-6 text-terminal-green font-mono">
        <div className="text-terminal-red text-xl tracking-widest mb-2">▣ RUN EXPIRED</div>
        <div className="text-xs text-terminal-red/80 mb-4">
          tier=<span className="text-terminal-red">{cfg.label}</span> · timer={cfg.timerMs / 1000}s · ops detected you
        </div>
        <div className="text-sm leading-relaxed mb-5">
          you ran out of time. ops trace went hot. the wipe came early.
          this run is forfeit — no leaderboard entry. retry from a fresh boot.
        </div>
        <button
          onClick={onDismiss}
          className="w-full px-4 py-2 bg-terminal-red/20 border border-terminal-red text-terminal-red hover:bg-terminal-red/40 text-sm tracking-widest"
        >
          [ NEW INSTANCE ]
        </button>
      </div>
    </div>
  );
}

