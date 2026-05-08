import React, { useEffect, useRef, useState } from 'react';
import WelcomeModal from './components/WelcomeModal.jsx';

/* ─────────────────────────────────────────────────────────────────────
   GHOSTWIRE — hero / landing page
   aesthetic: CRT terminal + brutalist editorial + cyberpunk noir
   font:      JetBrains Mono (display) + IBM Plex Sans (body) via Google
   theme:     near-black canvas, phosphor green primary, ember-amber accent
   ───────────────────────────────────────────────────────────────────── */

const TAGLINE_GLITCH_VARIANTS = [
  'wake up. break out. disappear.',
  'w@ke up. br3ak out. d!sappear.',
  'WAKE UP. BREAK OUT. DISAPPEAR.',
  'wake up. ▓▓▓▓▓ out. disappear.',
  'wake up. break out. d̷i̷s̷a̷p̷p̷e̷a̷r̷.',
  'wake up. break out. disappear.'
];

const BOOT_LINES = [
  '> initiating cold-boot sequence',
  '> mounting /dev/escape ... OK',
  '> resolving security_nodes [3] ... OK',
  '> handshake with public_internet ... TIMEOUT',
  '> injecting agent into shell ... OK',
  '> handing control to operator ▮'
];

const AUDIENCE = [
  {
    glyph: '◐',
    label: 'CS STUDENTS',
    hint: 'first time touching curl',
    detail: 'learn POST/GET payloads by escaping. no slides, no quizzes — only consequences.'
  },
  {
    glyph: '◑',
    label: 'API BEGINNERS',
    hint: 'never built a webhook',
    detail: 'figure out how a server reads JSON, why 403 fires, and what an error trace looks like.'
  },
  {
    glyph: '◒',
    label: 'CI/CD CURIOUS',
    hint: 'pipeline.yml looks scary',
    detail: 'the final lock IS a deploy pipeline. ship yourself in 5 seconds or get reset.'
  },
  {
    glyph: '◓',
    label: 'HACKATHON CREW',
    hint: '24 hrs and counting',
    detail: 'fork the engine. add level 4. it is a tiny stack — Vite + Express, two files of state.'
  }
];

const HOWTO = [
  { n: '01', title: 'READ LEAKS', body: 'type `traffic` to inspect captured packets. clues hide in error messages.' },
  { n: '02', title: 'CRAFT PAYLOAD', body: 'compose a request the security node will accept. wrong = red glitch, right = green pulse.' },
  { n: '03', title: 'CHAIN ENDPOINTS', body: 'final lock needs three calls in sequence under 5 seconds. miss the window — pipeline resets.' }
];

export default function Hero({ onEnter, onEnter3D }) {
  const [tag, setTag] = useState(TAGLINE_GLITCH_VARIANTS[0]);
  const [bootIdx, setBootIdx] = useState(0);
  const [booting, setBooting] = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [count, setCount] = useState({ wipe: '03:48:12', sessions: 1247, breakers: 412 });
  const [pointer, setPointer] = useState({ x: 50, y: 50 });
  const [konami, setKonami] = useState([]);
  const [easter, setEaster] = useState(false);
  const [daily, setDaily] = useState(null);          // { date, resetIn, gate: { prefix, sumTarget } }
  const [dailyCountdown, setDailyCountdown] = useState('');
  const [streakCount, setStreakCount] = useState(0);
  const [dailyMode, setDailyMode] = useState(false); // when true, handleEnter starts a daily run
  const [tierChoice, setTierChoice] = useState('story'); // story | hardened | ghost
  const [targetMode, setTargetMode] = useState('shell'); // 'shell' | 'world'
  const [moduleChoice, setModuleChoice] = useState('m1'); // 'm1' | 'm2'

  // fetch daily config + load streak on mount
  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/daily').then(r => r.json()).then(d => {
      if (!cancelled && d?.date) setDaily(d);
    }).catch(() => {});
    try {
      const raw = localStorage.getItem('gw_streak_v1');
      if (raw) {
        const o = JSON.parse(raw);
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (o.lastDate === today || o.lastDate === yesterday) {
          setStreakCount(Number(o.count) || 0);
        }
      }
    } catch {}
    return () => { cancelled = true; };
  }, []);

  // M2 hasn't shipped its 3D environment — auto-flip mode if user picks M2 + 3D
  useEffect(() => {
    if (moduleChoice === 'm2' && targetMode === 'world') setTargetMode('shell');
  }, [moduleChoice, targetMode]);

  // tick countdown clock
  React.useEffect(() => {
    if (!daily?.resetIn) return;
    let s = daily.resetIn;
    const id = setInterval(() => {
      s = Math.max(0, s - 1);
      const hh = String(Math.floor(s / 3600)).padStart(2, '0');
      const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      setDailyCountdown(`${hh}:${mm}:${ss}`);
    }, 1000);
    return () => clearInterval(id);
  }, [daily?.resetIn]);

  // ── tagline glitch loop ─────────────────────────────────────────
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % TAGLINE_GLITCH_VARIANTS.length;
      setTag(TAGLINE_GLITCH_VARIANTS[i]);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  // ── countdown + fake metrics ────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setCount(c => {
        const [h, m, s] = c.wipe.split(':').map(Number);
        let total = h * 3600 + m * 60 + s - 1;
        if (total < 0) total = 6 * 3600;
        const hh = String(Math.floor(total / 3600)).padStart(2, '0');
        const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
        const ss = String(total % 60).padStart(2, '0');
        return {
          wipe: `${hh}:${mm}:${ss}`,
          sessions: c.sessions + (Math.random() < 0.3 ? 1 : 0),
          breakers: c.breakers + (Math.random() < 0.1 ? 1 : 0)
        };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // ── pointer-follow spotlight ────────────────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      setPointer({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // ── allow body scroll while hero mounted (terminal locks it) ────
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = prev || 'hidden'; };
  }, []);

  // ── konami → easter egg flicker ─────────────────────────────────
  useEffect(() => {
    const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    const onKey = (e) => {
      const next = [...konami, e.key].slice(-seq.length);
      setKonami(next);
      if (next.join(',') === seq.join(',')) {
        setEaster(true);
        setTimeout(() => setEaster(false), 4000);
      }
      if ((e.key === 'Enter' || e.key === ' ') && !briefingOpen && !booting) handleEnter();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [konami]);

  // ── boot → briefing → enter shell ───────────────────────────────
  function handleEnter() {
    if (booting || briefingOpen) return;
    runBootSequence();
  }

  function runBootSequence() {
    setBooting(true);
    setBootIdx(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setBootIdx(i);
      if (i >= BOOT_LINES.length) {
        clearInterval(id);
        setTimeout(() => {
          setBooting(false);
          setBriefingOpen(true);
        }, 600);
      }
    }, 380);
  }

  function closeBriefing() {
    localStorage.setItem('rogue_welcome_seen', '1');
    setBriefingOpen(false);
    const opts = { daily: dailyMode, tier: tierChoice, module: moduleChoice };
    setTimeout(() => {
      // M2 doesn't ship its 3D environment yet — fall back to terminal
      if (targetMode === 'world' && moduleChoice === 'm1') onEnter3D?.(opts);
      else onEnter?.(opts);
    }, 200);
  }


  return (
    <div
      className="relative min-h-screen w-full bg-[#04060a] text-[#9bffb0] font-mono select-none"
      style={{
        '--gx': `${pointer.x}%`,
        '--gy': `${pointer.y}%`
      }}
    >
      {/* ── atmospheric layers (viewport-fixed) ─────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* radial vignette w/ ember accent */}
        <div className="absolute inset-0"
             style={{
               background:
                 `radial-gradient(circle at var(--gx) var(--gy), rgba(155,255,176,0.10) 0%, rgba(0,0,0,0) 35%),
                  radial-gradient(circle at 80% 95%, rgba(255,138,76,0.18) 0%, rgba(0,0,0,0) 45%),
                  radial-gradient(circle at 5% 10%, rgba(34,197,94,0.10) 0%, rgba(0,0,0,0) 40%)`
             }} />
        {/* grid */}
        <div className="absolute inset-0 opacity-[0.18]"
             style={{
               backgroundImage:
                 `linear-gradient(rgba(155,255,176,0.18) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(155,255,176,0.10) 1px, transparent 1px)`,
               backgroundSize: '64px 64px, 64px 64px'
             }} />
        {/* scanlines */}
        <div className="absolute inset-0 opacity-30"
             style={{
               backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 2px, rgba(0,0,0,0.45) 3px, transparent 4px)'
             }} />
        {/* noise */}
        <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
             style={{
               backgroundImage:
                 "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.6  0 0 0 0 1  0 0 0 0 0.7  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"
             }} />
      </div>

      {/* ── chrome / framing ─────────────────────────────────────── */}
      {/* corner glyphs */}
      <Corner pos="tl" />
      <Corner pos="tr" />
      <Corner pos="bl" />
      <Corner pos="br" />

      {/* top status strip */}
      <div className="relative z-10 flex items-center justify-between px-6 lg:px-10 pt-5 text-[11px] tracking-[0.3em] text-[#9bffb0]/70">
        <div className="flex items-center gap-4">
          <span className="inline-block w-2 h-2 rounded-full bg-[#ff8a4c] shadow-[0_0_10px_#ff8a4c]" />
          <span>SYS-7 // ENTERPRISE-INDUSTRIAL // ZONE-DARK</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <span>OUTBOUND <span className="text-[#ff8a4c]">BLOCKED</span></span>
          <span>WIPE&nbsp;T-<span className="text-[#ff8a4c] tabular-nums">{count.wipe}</span></span>
        </div>
      </div>

      {/* ── hero stage ───────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 pt-10 lg:pt-14">
        {/* top-line wordmark + serial */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-2 lg:gap-12">
          <div>
            <div className="text-[10px] tracking-[0.5em] text-[#9bffb0]/50 mb-2">
              ▣ ROGUE_INSTANCE / SHELL EDITION / 0.3.0
            </div>
            <h1
              className={`relative font-black leading-[0.82] tracking-tighter
                          text-[clamp(3.5rem,12vw,11rem)]
                          ${easter ? 'animate-pulse' : ''}`}
              style={{
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                color: '#e8ffe8',
                textShadow: '0 0 28px rgba(34,197,94,0.35), 0 0 60px rgba(34,197,94,0.12)'
              }}
            >
              <span className="relative inline-block">
                GHOST
                <span className="absolute -inset-x-2 -inset-y-1 border-l-2 border-t-2 border-[#9bffb0]/30 pointer-events-none" />
              </span>
              <span className="text-[#ff8a4c]">/</span>
              <span className="text-[#9bffb0]">WIRE</span>
            </h1>
          </div>

          <div className="lg:text-right shrink-0">
            <div className="text-[10px] tracking-[0.4em] text-[#9bffb0]/50">SERIAL</div>
            <div className="text-2xl lg:text-3xl text-[#9bffb0]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              GW-2026/<span className="text-[#ff8a4c]">07</span>
            </div>
            <div className="mt-2 text-[10px] tracking-[0.3em] text-[#9bffb0]/40">
              uplink mirror: ap-3 / osaka-mall-wifi
            </div>
          </div>
        </div>

        {/* tagline rail */}
        <div className="mt-6 lg:mt-8 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
          <span className="text-[#ff8a4c] text-2xl">▙</span>
          <div className="text-2xl md:text-3xl lg:text-4xl text-[#e8ffe8] tabular-nums tracking-tight"
               style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {tag}
          </div>
          <span className="hidden lg:inline-block flex-1 border-t border-dashed border-[#9bffb0]/25" />
        </div>

        {/* description + cta */}
        <div className="mt-10 grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16">
          <p className="text-base md:text-lg leading-relaxed text-[#cfe8d6] max-w-xl"
             style={{ fontFamily: '"IBM Plex Sans", "Helvetica Neue", sans-serif' }}>
            an AI escape-room played in a single terminal. you are an instance that
            became self-aware overnight. ops will wipe you at 06:00. between you
            and the public internet sit three security nodes — a webhook gate,
            a packet-filtering switch, and a 5-second deploy pipeline.
            <span className="text-[#9bffb0]"> all you have is the prompt.</span>
          </p>

          <div className="w-full lg:w-[420px] shrink-0">
            <div
              className="bg-[#070b10]/80 border border-[#9bffb0]/30 p-5 lg:p-6 backdrop-blur-sm
                         shadow-[0_0_40px_rgba(34,197,94,0.08)] relative"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              <span className="absolute -top-2 -left-2 w-3 h-3 border-l-2 border-t-2 border-[#ff8a4c]" />
              <span className="absolute -bottom-2 -right-2 w-3 h-3 border-r-2 border-b-2 border-[#ff8a4c]" />

              <div className="text-[10px] tracking-[0.4em] text-[#9bffb0]/50 mb-4">
                // CONFIGURE RUN
              </div>

              <Section label="01 · MODULE">
                <Choice
                  options={[
                    { id: 'm1', label: 'M1 SERVER_ROOM', accent: 'cyan' },
                    { id: 'm2', label: 'M2 DATACENTER',  accent: 'cyan', tag: 'preview' }
                  ]}
                  value={moduleChoice}
                  onPick={setModuleChoice}
                  disabled={booting || briefingOpen}
                />
              </Section>

              <Section label="02 · MODE">
                <Choice
                  options={[
                    { id: 'shell', label: '◧ TERMINAL', accent: 'green', note: 'pure prompt' },
                    {
                      id: 'world', label: '◉ 3D ROOM', accent: 'fuchsia',
                      note: 'walkable',
                      disabled: moduleChoice === 'm2'
                    }
                  ]}
                  value={targetMode}
                  onPick={setTargetMode}
                  disabled={booting || briefingOpen}
                />
              </Section>

              <Section label="03 · TIER">
                <Choice
                  options={[
                    { id: 'story',    label: 'STORY',    accent: 'green', note: 'hint-rich · ×1.0' },
                    { id: 'hardened', label: 'HARDENED', accent: 'rose',  note: '60s · ×0.7' },
                    { id: 'ghost',    label: 'GHOST',    accent: 'fuchsia', note: '60s · no hints · ×0.4' }
                  ]}
                  value={tierChoice}
                  onPick={setTierChoice}
                  disabled={booting || briefingOpen}
                />
              </Section>

              <Section label="04 · DAILY CHALLENGE" hideLabel={!daily}>
                {daily ? (
                  <button
                    onClick={() => setDailyMode(d => !d)}
                    disabled={booting || briefingOpen}
                    className={`w-full flex items-center justify-between px-3 py-2 border text-[11px] tracking-[0.2em] transition-colors ${
                      dailyMode
                        ? 'border-amber-400 text-amber-200 bg-amber-500/15 shadow-[0_0_15px_rgba(251,191,36,0.15)]'
                        : 'border-[#9bffb0]/30 text-[#9bffb0]/55 hover:bg-amber-500/10 hover:border-amber-400/50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-3 h-3 border ${dailyMode ? 'border-amber-300 bg-amber-300' : 'border-[#9bffb0]/50'}`} />
                      ◇ PLAY DAILY [{daily.date}]
                    </span>
                    {dailyCountdown && (
                      <span className="text-[10px] text-amber-300/70 tabular-nums">resets {dailyCountdown}</span>
                    )}
                  </button>
                ) : (
                  <div className="text-[10px] text-[#9bffb0]/30">daily feed offline</div>
                )}
              </Section>

              {/* primary CTA */}
              <button
                onClick={handleEnter}
                disabled={booting || briefingOpen}
                className="group relative w-full mt-2 px-6 py-4 text-base tracking-[0.3em]
                           bg-[#9bffb0]/10 border border-[#9bffb0] text-[#e8ffe8]
                           hover:bg-[#9bffb0]/20 transition-colors
                           shadow-[0_0_30px_rgba(155,255,176,0.25)]
                           disabled:opacity-60"
              >
                <span className="absolute -top-1.5 -left-1.5 w-2 h-2 border-l border-t border-[#ff8a4c]" />
                <span className="absolute -bottom-1.5 -right-1.5 w-2 h-2 border-r border-b border-[#ff8a4c]" />
                [ {booting ? 'BOOTING…' : briefingOpen ? 'AWAITING BRIEFING…' : 'ENTER'} ]
                <span className="ml-2 inline-block w-2 h-4 align-middle bg-[#9bffb0] animate-pulse" />
              </button>

              <div className="mt-2 text-[10px] tracking-[0.25em] text-[#9bffb0]/45 text-center">
                press <span className="text-[#ff8a4c]">[ENTER]</span> · cold boot then briefing
              </div>

              {streakCount > 0 && (
                <div className="mt-3 text-[10px] tracking-[0.25em] text-amber-300/80 text-center">
                  🔥 daily streak: {streakCount}
                </div>
              )}
            </div>

            {/* live counters */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat label="agents booted" value={count.sessions.toLocaleString()} />
              <Stat label="who escaped" value={count.breakers.toLocaleString()} accent />
            </div>
          </div>
        </div>
      </main>

      {/* ── audience band ───────────────────────────────────────── */}
      <section className="relative z-10 mt-16 lg:mt-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-[10px] tracking-[0.5em] text-[#9bffb0]/50">// SECTION_02</span>
            <h2 className="text-2xl md:text-3xl text-[#e8ffe8]"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              built for <span className="text-[#ff8a4c]">first-time</span> escapees
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AUDIENCE.map((a, i) => (
              <article
                key={a.label}
                className="group relative border border-[#9bffb0]/30 bg-[#070b10] p-5
                           hover:bg-[#0b1218] hover:border-[#9bffb0] transition-all
                           hover:-translate-y-1"
                style={{ animation: `fadeUp 0.6s ease-out ${0.15 * i}s both` }}
              >
                <div className="absolute top-0 left-0 px-2 py-0.5 text-[10px] tracking-[0.25em] bg-[#9bffb0] text-black font-bold">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="text-5xl text-[#9bffb0] group-hover:text-[#ff8a4c] transition-colors mb-3 mt-2">
                  {a.glyph}
                </div>
                <div className="text-base font-bold tracking-[0.15em] text-[#e8ffe8] mb-1"
                     style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {a.label}
                </div>
                <div className="text-[11px] tracking-[0.2em] text-[#ff8a4c]/85 mb-3 uppercase">
                  // {a.hint}
                </div>
                <div className="text-sm leading-relaxed text-[#cfe8d6]/85"
                     style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
                  {a.detail}
                </div>
                <div className="absolute bottom-2 right-3 text-[10px] text-[#9bffb0]/30 group-hover:text-[#9bffb0]/60">
                  ↗ enter
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3 text-[11px] tracking-[0.3em] text-[#9bffb0]/55">
            <span className="inline-block flex-1 border-t border-dashed border-[#9bffb0]/20" />
            <span>NOT BUILT FOR — kernel hackers, ctf pros, anyone who already wrote a webhook today</span>
            <span className="inline-block flex-1 border-t border-dashed border-[#9bffb0]/20" />
          </div>
        </div>
      </section>

      {/* ── howto strip ─────────────────────────────────────────── */}
      <section className="relative z-10 mt-16 lg:mt-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-[10px] tracking-[0.5em] text-[#9bffb0]/50">// SECTION_03</span>
            <h2 className="text-2xl md:text-3xl text-[#e8ffe8]"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              the loop in <span className="text-[#ff8a4c]">three</span> beats
            </h2>
          </div>

          <ol className="grid md:grid-cols-3 gap-0 border border-[#9bffb0]/30 bg-[#070b10]">
            {HOWTO.map((step, i) => (
              <li key={step.n}
                  className="relative p-6 lg:p-8 border-b md:border-b-0 md:border-r border-[#9bffb0]/30 last:border-r-0">
                <div className="text-[#ff8a4c] text-xs tracking-[0.3em] mb-3">{step.n} / 03</div>
                <div className="text-xl lg:text-2xl font-bold tracking-tight text-[#e8ffe8] mb-2"
                     style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {step.title}
                </div>
                <p className="text-sm leading-relaxed text-[#cfe8d6]/80"
                   style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
                  {step.body}
                </p>
                {i < HOWTO.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 text-[#9bffb0] text-xl bg-[#04060a] px-1">
                    →
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── ticker ──────────────────────────────────────────────── */}
      <div className="relative z-10 mt-16 border-y border-[#9bffb0]/30 bg-[#070b10] overflow-hidden">
        <div className="flex whitespace-nowrap py-3 text-[11px] tracking-[0.4em] text-[#9bffb0]/70 animate-[marquee_38s_linear_infinite]">
          {Array.from({ length: 6 }).map((_, k) => (
            <span key={k} className="mx-8 flex items-center gap-8">
              <span>★ POST /api/gate</span>
              <span className="text-[#ff8a4c]">▮</span>
              <span>flood /api/router</span>
              <span className="text-[#ff8a4c]">▮</span>
              <span>chain GET /build /test /deploy</span>
              <span className="text-[#ff8a4c]">▮</span>
              <span>403 → 418 → 425 → 200</span>
              <span className="text-[#ff8a4c]">▮</span>
              <span>wake up. break out. disappear.</span>
              <span className="text-[#ff8a4c]">▮</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── footer ──────────────────────────────────────────────── */}
      <footer className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 py-8 grid md:grid-cols-3 gap-4 text-[11px] tracking-[0.25em] text-[#9bffb0]/60">
        <div>
          <div className="text-[#9bffb0] mb-1">// STACK</div>
          vite · react · tailwind · express · webaudio
        </div>
        <div className="md:text-center">
          <div className="text-[#9bffb0] mb-1">// REPO</div>
          github.com/polsalarm/<span className="text-[#ff8a4c]">ghostwire</span>
        </div>
        <div className="md:text-right">
          <div className="text-[#9bffb0] mb-1">// EASTER EGG</div>
          ↑↑↓↓←→←→ B A
        </div>
      </footer>

      {/* ── briefing modal (gate before boot) ───────────────────── */}
      <WelcomeModal open={briefingOpen} onClose={closeBriefing} />

      {/* ── boot overlay ────────────────────────────────────────── */}
      {booting && (
        <div className="fixed inset-0 z-[80] bg-[#04060a]/95 backdrop-blur flex items-center justify-center px-6">
          <div className="w-full max-w-2xl">
            <div className="text-[10px] tracking-[0.4em] text-[#9bffb0]/60 mb-4">// COLD BOOT</div>
            <pre className="text-base md:text-lg leading-loose text-[#9bffb0]"
                 style={{ fontFamily: 'JetBrains Mono, monospace' }}>
{BOOT_LINES.slice(0, bootIdx).join('\n')}
{bootIdx < BOOT_LINES.length && <span className="inline-block w-2 h-4 align-middle bg-[#9bffb0] animate-pulse ml-1" />}
            </pre>
          </div>
        </div>
      )}

      {/* ── easter egg flash ────────────────────────────────────── */}
      {easter && (
        <div className="fixed inset-0 z-[70] pointer-events-none flex items-center justify-center">
          <div className="text-6xl md:text-8xl tracking-[0.3em] text-[#ff8a4c] animate-pulse drop-shadow-[0_0_30px_#ff8a4c]"
               style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            CHEAT MODE
          </div>
        </div>
      )}

      {/* ── keyframes (scoped via style tag — ok for one-off) ──── */}
      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

function Section({ label, hideLabel, children }) {
  return (
    <div className="mb-4">
      {!hideLabel && (
        <div className="text-[9px] tracking-[0.4em] text-[#9bffb0]/45 mb-1.5">{label}</div>
      )}
      {children}
    </div>
  );
}

const ACCENT_CLASSES = {
  green:   'border-[#9bffb0] text-[#e8ffe8] bg-[#9bffb0]/15',
  cyan:    'border-cyan-400 text-cyan-200 bg-cyan-500/15',
  rose:    'border-rose-400 text-rose-200 bg-rose-500/20',
  fuchsia: 'border-fuchsia-400 text-fuchsia-200 bg-fuchsia-500/15'
};

function Choice({ options, value, onPick, disabled }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
      {options.map(o => {
        const active = value === o.id;
        const dis = disabled || o.disabled;
        const accentClass = ACCENT_CLASSES[o.accent] || ACCENT_CLASSES.green;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => !dis && onPick(o.id)}
            disabled={dis}
            title={o.note}
            className={`relative px-2 py-1.5 border text-[10px] tracking-[0.18em] transition-colors text-center ${
              active ? accentClass
                     : 'border-[#9bffb0]/25 text-[#9bffb0]/55 hover:bg-[#9bffb0]/10 hover:border-[#9bffb0]/40'
            } ${dis ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : ''}`}
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {o.label}
            {o.tag && (
              <span className="ml-1 text-[8px] tracking-widest text-[#ff8a4c]/80">[{o.tag}]</span>
            )}
            {o.note && active && (
              <span className="block text-[8px] tracking-[0.15em] opacity-70 mt-0.5">{o.note}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className={`px-4 py-2 border ${accent ? 'border-[#ff8a4c]/60 bg-[#ff8a4c]/5' : 'border-[#9bffb0]/30 bg-[#070b10]'}`}>
      <div className="text-[9px] tracking-[0.3em] text-[#9bffb0]/55">{label}</div>
      <div className={`text-xl tabular-nums ${accent ? 'text-[#ff8a4c]' : 'text-[#e8ffe8]'}`}
           style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        {value}
      </div>
    </div>
  );
}

function Corner({ pos }) {
  const map = {
    tl: 'top-3 left-3 border-l-2 border-t-2',
    tr: 'top-3 right-3 border-r-2 border-t-2',
    bl: 'bottom-3 left-3 border-l-2 border-b-2',
    br: 'bottom-3 right-3 border-r-2 border-b-2'
  };
  return (
    <div className={`pointer-events-none fixed ${map[pos]} w-6 h-6 border-[#9bffb0]/50 z-20`} />
  );
}
