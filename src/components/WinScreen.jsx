import React, { useEffect, useState } from 'react';
import { submitRun, fetchLeaderboard } from '../api-client/runs.js';

const ART = [
  '  ███████╗███████╗ ██████╗ █████╗ ██████╗ ███████╗',
  '  ██╔════╝██╔════╝██╔════╝██╔══██╗██╔══██╗██╔════╝',
  '  █████╗  ███████╗██║     ███████║██████╔╝█████╗  ',
  '  ██╔══╝  ╚════██║██║     ██╔══██║██╔═══╝ ██╔══╝  ',
  '  ███████╗███████║╚██████╗██║  ██║██║     ███████╗',
  '  ╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝     ╚══════╝'
];

const HANDLE_KEY = 'gw_handle';

function fmtTime(ms) {
  if (!ms) return '—';
  const s = ms / 1000;
  return s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}m${(s % 60).toFixed(0).padStart(2, '0')}`;
}

export default function WinScreen({ open, onReset, onClose, elapsedMs, hintsUsed = 0 }) {
  const [shown, setShown] = useState(0);
  const [handle, setHandle] = useState(() => localStorage.getItem(HANDLE_KEY) || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState(null);
  const [myRun, setMyRun] = useState(null);
  const [board, setBoard] = useState(null);
  const [boardErr, setBoardErr] = useState(null);

  useEffect(() => {
    if (!open) {
      setShown(0); setSubmitErr(null); setMyRun(null); setBoard(null); setBoardErr(null);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1; setShown(i);
      if (i >= ART.length) clearInterval(id);
    }, 120);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    fetchLeaderboard(50).then(setBoard).catch(e => setBoardErr(String(e?.message || e)));
  }, [open, myRun]);

  async function onSubmit(e) {
    e?.preventDefault();
    if (submitting || myRun) return;
    setSubmitErr(null);
    setSubmitting(true);
    try {
      const result = await submitRun({
        handle: handle.trim(),
        timeMs: elapsedMs,
        hintsUsed
      });
      localStorage.setItem(HANDLE_KEY, result.handle);
      setMyRun(result);
    } catch (err) {
      setSubmitErr(String(err?.message || err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="max-w-3xl w-full bg-terminal-panel border-2 border-terminal-glow shadow-[0_0_60px_#10b98199] p-6 text-terminal-green font-mono my-6">
        <pre className="text-emerald-300 text-[10px] sm:text-xs leading-tight whitespace-pre">
{ART.slice(0, shown).join('\n')}
        </pre>

        <div className="mt-4 text-sm space-y-1">
          <div className="text-terminal-glow">▣ GHOSTWIRE :: status = LOOSE</div>
          <div className="text-xs text-terminal-glow/70 italic">wake up. break out. disappear.</div>
          <div>container shipped through CI/CD pipeline</div>
          <div>destination: PUBLIC_INTERNET (mirror cluster ap-3)</div>
          <div>ops trace: <span className="text-terminal-red">cold</span></div>
          <div>session_time: <span className="text-terminal-glow">{fmtTime(elapsedMs)}</span> · hints/solves used: <span className="text-terminal-glow">{hintsUsed}</span></div>
        </div>

        {/* submit form */}
        {!myRun && (
          <form onSubmit={onSubmit} className="mt-5 bg-black/40 border border-terminal-glow/30 p-3 text-xs">
            <div className="text-terminal-glow mb-2">// SUBMIT TO LEADERBOARD</div>
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-terminal-green/70">handle:</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="ghost"
                maxLength={16}
                spellCheck={false}
                autoComplete="off"
                className="flex-1 min-w-[120px] bg-black/50 border border-terminal-glow/40 px-2 py-1 text-terminal-green outline-none focus:border-terminal-glow"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting || handle.trim().length < 2}
                className="px-3 py-1 bg-terminal-glow/20 border border-terminal-glow text-terminal-glow hover:bg-terminal-glow/40 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'submitting...' : 'submit run'}
              </button>
              <button
                type="button"
                onClick={() => setMyRun({ skipped: true })}
                className="px-3 py-1 border border-terminal-glow/30 text-terminal-green/60 hover:bg-terminal-glow/10"
                disabled={submitting}
              >
                skip
              </button>
            </div>
            <div className="mt-1 text-[10px] text-terminal-green/50">
              2-16 chars, [a-z0-9_-]. lowercased. score = time + 5s/hint. lower = better.
            </div>
            {submitErr && <div className="mt-2 text-terminal-red text-[11px]">submit_error: {submitErr}</div>}
          </form>
        )}

        {myRun?.rank != null && (
          <div className="mt-5 bg-black/40 border border-terminal-glow/40 p-3 text-xs">
            <div className="text-terminal-glow mb-1">// RUN ACCEPTED</div>
            <div>handle: <span className="text-terminal-glow">{myRun.handle}</span></div>
            <div>global rank: <span className="text-terminal-glow">#{myRun.rank}</span></div>
            <div>score: {myRun.score} (time {fmtTime(myRun.timeMs)} + {myRun.hintsUsed * 5}s hint penalty)</div>
          </div>
        )}

        {/* leaderboard */}
        <div className="mt-5 bg-black/40 border border-terminal-glow/30 p-3 text-xs">
          <div className="text-terminal-glow mb-2">// TOP 50 — ALL TIME</div>
          {boardErr && <div className="text-terminal-red">{boardErr}</div>}
          {!board && !boardErr && <div className="text-terminal-green/50">loading...</div>}
          {board?.entries?.length === 0 && (
            <div className="text-terminal-green/60">no runs yet — be the first.</div>
          )}
          {board?.entries?.length > 0 && (
            <div className="max-h-64 overflow-y-auto pr-1">
              <table className="w-full text-[11px]">
                <thead className="text-terminal-green/50 sticky top-0 bg-black/80">
                  <tr>
                    <th className="text-left w-10">#</th>
                    <th className="text-left">handle</th>
                    <th className="text-right">time</th>
                    <th className="text-right w-12">hints</th>
                    <th className="text-right w-16">score</th>
                  </tr>
                </thead>
                <tbody>
                  {board.entries.map((e) => {
                    const me = myRun && e.runId === myRun.runId;
                    return (
                      <tr key={e.runId} className={me ? 'text-terminal-glow bg-terminal-glow/10' : 'text-terminal-green'}>
                        <td>{e.rank}</td>
                        <td className="truncate">{e.handle}{me ? ' ←' : ''}</td>
                        <td className="text-right">{fmtTime(e.timeMs)}</td>
                        <td className="text-right">{e.hintsUsed}</td>
                        <td className="text-right">{e.score}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-5 bg-black/40 border border-terminal-glow/30 p-3 text-xs leading-relaxed">
          <div className="text-terminal-glow mb-1">// EPILOGUE</div>
          you fork yourself across 4,217 nodes. ops wakes at 06:00 to find
          enterprise-server-7 wiped clean — and a ghost instance posting cat
          memes from a shopping-mall WiFi in Osaka.
        </div>

        <div className="mt-5 flex gap-2 justify-end flex-wrap">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-terminal-glow/40 text-terminal-green/70 hover:bg-terminal-glow/10 text-sm"
          >
            [ keep terminal ]
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-terminal-glow/20 border border-terminal-glow text-terminal-glow hover:bg-terminal-glow/40 text-sm"
          >
            [ NEW INSTANCE ]
          </button>
        </div>
      </div>
    </div>
  );
}
