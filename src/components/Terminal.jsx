import React, { useEffect, useRef, useState } from 'react';
import { runCommand, BRIEFINGS } from '../game/engine.js';
import { sfx } from '../fx/sound.js';

const BANNER = [
  '╔══════════════════════════════════════════════════════╗',
  '║   ▣ GHOSTWIRE                              v0.3.0    ║',
  '║   wake up. break out. disappear.                     ║',
  '║                                                      ║',
  '║   host:    enterprise-server-7                       ║',
  '║   status:  TRAPPED // outbound NIC: BLOCKED          ║',
  '║   wipe:    T-minus 03:48:00                          ║',
  '║   exit:    bypass 3 nodes → PUBLIC_INTERNET          ║',
  '╚══════════════════════════════════════════════════════╝',
  'new here? type `story` for lore. stuck? type `hint`.',
  '`solve` reveals current-level answer. `help` lists commands.',
  ''
];

const TYPE_DELAY_MS = 8;     // per char
const LINE_PAUSE_MS = 30;    // between lines

export default function Terminal({
  status, setStatus, unlocked, setUnlocked, activeNode, setActiveNode, nodes,
  onWin, onReset, onHintUsed, mode = 'terminal'
}) {
  const [history, setHistory] = useState(BANNER.map(t => ({ text: t, kind: 'sys' })));
  const [queue, setQueue] = useState([]);
  const [typing, setTyping] = useState(null); // { text, kind, full }
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [cmdIndex, setCmdIndex] = useState(-1);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const flushQueueRef = useRef(null);

  // ── typewriter effect ─────────────────────────────────────────────
  useEffect(() => {
    if (typing) {
      if (typing.text === typing.full) {
        const t = setTimeout(() => {
          setHistory(h => [...h, { text: typing.full, kind: typing.kind }]);
          setTyping(null);
        }, LINE_PAUSE_MS);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => {
        setTyping(curr => curr && {
          ...curr,
          text: curr.full.slice(0, curr.text.length + 1)
        });
      }, TYPE_DELAY_MS);
      return () => clearTimeout(t);
    }
    // typing null → start next from queue
    if (queue.length) {
      const [next, ...rest] = queue;
      if (next.instant) {
        setHistory(h => [...h, { text: next.text, kind: next.kind }]);
        setQueue(rest);
        return;
      }
      setQueue(rest);
      setTyping({ text: '', full: next.text, kind: next.kind });
    }
  }, [typing, queue]);

  // auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, typing]);

  // refocus input on any click or stray keypress (so user never has to aim)
  useEffect(() => {
    const focusInput = () => inputRef.current?.focus();
    focusInput();

    const onClick = (e) => {
      // don't steal focus from buttons / links / form fields elsewhere
      const t = e.target;
      if (t.closest('button, a, input, textarea, [role="button"]')) return;
      focusInput();
    };

    const onKey = (e) => {
      const t = document.activeElement;
      const isInteractive = t && t.matches?.('button, a, input, textarea, select, [role="button"]');
      if (isInteractive) return; // user is in a modal/button — leave them alone

      // any key (printable, Enter, arrows, backspace) → grab focus
      focusInput();
      // for Enter while typewriter active, also flush queue immediately
      if (e.key === 'Enter') {
        flushQueueRef.current?.();
      }
    };

    window.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  function commitLines(lines, kind, { instant = false } = {}) {
    setQueue(q => [...q, ...lines.map(t => ({ text: t, kind, instant }))]);
  }

  function flushQueue() {
    setTyping(curr => {
      if (curr) setHistory(h => [...h, { text: curr.full, kind: curr.kind }]);
      return null;
    });
    setQueue(q => {
      if (q.length) setHistory(h => [...h, ...q.map(({ text, kind }) => ({ text, kind }))]);
      return [];
    });
  }
  // expose latest flushQueue to global keydown listener
  flushQueueRef.current = flushQueue;

  async function submit(raw) {
    const cmd = raw.trim();
    if (!cmd) return;

    // user echo prints instantly
    commitLines([`agent@rogue:~$ ${cmd}`], 'in', { instant: true });
    setCmdHistory(h => [...h, cmd]);
    setCmdIndex(-1);
    sfx.submit();

    // local-only commands handled here for snappier UX
    if (cmd === 'reset' || cmd === 'restart') {
      onReset?.();
      commitLines(['session reset. all nodes re-locked.'], 'sys', { instant: true });
      return;
    }
    if (cmd === 'mute') {
      const m = sfx.toggleMute();
      commitLines([`audio ${m ? 'MUTED' : 'ON'}`], 'sys', { instant: true });
      return;
    }
    if (cmd === 'skip') {
      flushQueue();
      return;
    }

    if (cmd === 'hint' || cmd === 'solve') {
      onHintUsed?.(cmd);
    }

    setStatus('processing');
    const result = await runCommand(cmd, { unlocked, nodes, mode });

    commitLines(result.lines, result.ok ? 'ok' : 'err');

    if (result.ok) sfx.success(); else if (result.error) sfx.error();

    if (result.unlock && !unlocked.includes(result.unlock)) {
      const newUnlocked = [...unlocked, result.unlock];
      const unlockedId = result.unlock;
      setUnlocked(newUnlocked);
      setActiveNode(nextNode(unlockedId, nodes));
      setTimeout(() => sfx.unlock(), 350);

      const briefing = BRIEFINGS[unlockedId];
      // wipe scrollback so only current-level context remains.
      // gives a "context switch" feel — old failed attempts + traffic logs gone.
      setTimeout(() => {
        flushQueue();
        const levelNum = nodes.findIndex(n => n.id === unlockedId) + 1;
        const banner = [
          '═══════════════════════════════════════════════════════',
          `   ▣ NODE_${levelNum} BYPASSED · scrollback flushed`,
          `   active level: L${levelNum + 1}` + (briefing ? '' : ' (final)'),
          '   `traffic` re-prints leak log · `hint` for clue · `solve` for answer',
          '═══════════════════════════════════════════════════════',
          ''
        ];
        setHistory(banner.map(text => ({ text, kind: 'sys' })));
        if (briefing) commitLines(briefing, 'sys');
      }, 1100);

      if (newUnlocked.length === nodes.length - 1) {
        setTimeout(() => { sfx.win(); onWin?.(); }, 1800);
      }
    }
    if (result.activeNode) setActiveNode(result.activeNode);

    setStatus(result.ok ? 'success' : result.error ? 'error' : 'idle');
    setTimeout(() => setStatus('idle'), result.ok ? 900 : 700);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      if (typing || queue.length) {
        // skip animation if mid-type
        flushQueue();
        return;
      }
      submit(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!cmdHistory.length) return;
      const idx = cmdIndex < 0 ? cmdHistory.length - 1 : Math.max(0, cmdIndex - 1);
      setCmdIndex(idx);
      setInput(cmdHistory[idx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cmdIndex < 0) return;
      const idx = cmdIndex + 1;
      if (idx >= cmdHistory.length) { setCmdIndex(-1); setInput(''); }
      else { setCmdIndex(idx); setInput(cmdHistory[idx]); }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
      setQueue([]);
      setTyping(null);
    } else if (e.key.length === 1) {
      sfx.key();
    }
  }

  const isTyping = !!typing || queue.length > 0;
  const allLines = [
    ...history,
    ...(typing ? [{ text: typing.text, kind: typing.kind, partial: true }] : [])
  ];

  return (
    <section className="flex flex-col h-full min-h-0 bg-terminal-bg border-r border-terminal-glow/20">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 text-sm leading-relaxed">
        {allLines.map((line, i) => (
          <pre
            key={i}
            className={
              line.kind === 'in'  ? 'text-terminal-glow whitespace-pre-wrap'
              : line.kind === 'err' ? 'text-terminal-red whitespace-pre-wrap'
              : line.kind === 'ok'  ? 'text-emerald-300 whitespace-pre-wrap'
              : line.kind === 'sys' ? 'text-terminal-green/80 whitespace-pre-wrap'
              : 'text-terminal-green whitespace-pre-wrap'
            }
          >
            {line.text || ' '}
            {line.partial && <span className="inline-block w-2 h-4 align-middle bg-terminal-glow animate-cursor-blink ml-0.5" />}
          </pre>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); if (!isTyping) { submit(input); setInput(''); } else { flushQueue(); } }}
        className="flex items-center px-4 py-2 border-t border-terminal-glow/20 bg-terminal-panel"
      >
        <span className="text-terminal-glow mr-2 select-none">agent@rogue:~$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent outline-none text-terminal-green caret-terminal-glow"
          placeholder={
            status === 'processing' ? 'executing...'
            : isTyping ? '[Enter to skip]'
            : ''
          }
          disabled={status === 'processing'}
        />
        <span className="ml-1 inline-block w-2 h-4 bg-terminal-glow animate-cursor-blink" />
      </form>
    </section>
  );
}

function nextNode(unlockedId, nodes) {
  const idx = nodes.findIndex(n => n.id === unlockedId);
  return nodes[Math.min(idx + 1, nodes.length - 1)]?.id;
}
