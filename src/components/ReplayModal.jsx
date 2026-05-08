import React, { useEffect, useRef, useState } from 'react';

const TYPE_CHAR_MS = 18;
const MAX_GAP_MS = 1500;   // cap idle pauses between commands so replays aren't boring
const MIN_GAP_MS = 120;

function fmtMs(ms) {
  const s = (ms / 1000).toFixed(2);
  return `${s}s`;
}

export default function ReplayModal({ replay, onClose }) {
  const [printed, setPrinted] = useState([]);   // [{ t, text }]
  const [partial, setPartial] = useState('');
  const [done, setDone] = useState(false);
  const [speed, setSpeed] = useState(1);        // 1x | 2x | 4x
  const cancelRef = useRef(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!replay) return;
    cancelRef.current = false;
    setPrinted([]);
    setPartial('');
    setDone(false);
    runPlayback(replay.trace);
    return () => { cancelRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replay, speed]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [printed, partial]);

  async function runPlayback(trace) {
    let prevT = 0;
    for (let i = 0; i < trace.length; i++) {
      if (cancelRef.current) return;
      const ev = trace[i];
      const gap = Math.min(MAX_GAP_MS, Math.max(MIN_GAP_MS, ev.t - prevT));
      await sleep(gap / speed);
      if (cancelRef.current) return;
      // typewrite the command
      let acc = '';
      for (const ch of ev.c) {
        if (cancelRef.current) return;
        acc += ch;
        setPartial(acc);
        await sleep(TYPE_CHAR_MS / speed);
      }
      setPrinted(p => [...p, { t: ev.t, text: ev.c }]);
      setPartial('');
      prevT = ev.t;
    }
    setDone(true);
  }

  if (!replay) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="max-w-3xl w-full bg-terminal-panel border-2 border-terminal-glow shadow-[0_0_50px_#10b98199] flex flex-col text-terminal-green font-mono"
        style={{ height: 'min(70vh, 600px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-terminal-glow/30 bg-black/40">
          <div className="text-terminal-glow text-xs tracking-widest">
            ▣ GHOST REPLAY :: {replay.handle} ({replay.trace.length} commands)
          </div>
          <div className="flex items-center gap-2 text-xs">
            {[1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 border ${speed === s
                  ? 'border-terminal-glow text-terminal-glow bg-terminal-glow/15'
                  : 'border-terminal-glow/30 text-terminal-green/60 hover:bg-terminal-glow/10'}`}
              >
                {s}×
              </button>
            ))}
            <button
              onClick={onClose}
              className="px-2 py-0.5 border border-terminal-red/40 text-terminal-red/80 hover:bg-terminal-red/10"
            >
              close
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 text-xs leading-relaxed">
          {printed.map((p, i) => (
            <div key={i} className="mb-0.5">
              <span className="text-terminal-green/40 mr-2 tabular-nums">[{fmtMs(p.t)}]</span>
              <span className="text-terminal-glow">agent@rogue:~$</span>{' '}
              <span className="text-terminal-green">{p.text}</span>
            </div>
          ))}
          {partial && (
            <div>
              <span className="text-terminal-green/40 mr-2">[…]</span>
              <span className="text-terminal-glow">agent@rogue:~$</span>{' '}
              <span className="text-terminal-green">{partial}</span>
              <span className="inline-block w-2 h-3 ml-0.5 align-middle bg-terminal-glow animate-cursor-blink" />
            </div>
          )}
          {done && (
            <div className="mt-2 text-terminal-glow/70">
              ▣ end of replay
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, Math.max(0, ms)));
}
