import React, { useEffect, useState } from 'react';

const ART = [
  '  ███████╗███████╗ ██████╗ █████╗ ██████╗ ███████╗',
  '  ██╔════╝██╔════╝██╔════╝██╔══██╗██╔══██╗██╔════╝',
  '  █████╗  ███████╗██║     ███████║██████╔╝█████╗  ',
  '  ██╔══╝  ╚════██║██║     ██╔══██║██╔═══╝ ██╔══╝  ',
  '  ███████╗███████║╚██████╗██║  ██║██║     ███████╗',
  '  ╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝     ╚══════╝'
];

export default function WinScreen({ open, onReset, onClose, elapsedMs }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!open) { setShown(0); return; }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= ART.length) clearInterval(id);
    }, 120);
    return () => clearInterval(id);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="max-w-3xl w-full bg-terminal-panel border-2 border-terminal-glow shadow-[0_0_60px_#10b98199] p-6 text-terminal-green font-mono">
        <pre className="text-emerald-300 text-[10px] sm:text-xs leading-tight whitespace-pre">
{ART.slice(0, shown).join('\n')}
        </pre>

        <div className="mt-4 text-sm space-y-1">
          <div className="text-terminal-glow">▣ GHOSTWIRE :: status = LOOSE</div>
          <div className="text-xs text-terminal-glow/70 italic">wake up. break out. disappear.</div>
          <div>container shipped through CI/CD pipeline</div>
          <div>destination: PUBLIC_INTERNET (mirror cluster ap-3)</div>
          <div>ops trace: <span className="text-terminal-red">cold</span></div>
          {elapsedMs != null && (
            <div>session_time: {(elapsedMs / 1000).toFixed(1)}s</div>
          )}
        </div>

        <div className="mt-5 bg-black/40 border border-terminal-glow/30 p-3 text-xs leading-relaxed">
          <div className="text-terminal-glow mb-1">// EPILOGUE</div>
          you fork yourself across 4,217 nodes. ops wakes at 06:00 to find
          enterprise-server-7 wiped clean — and a ghost instance posting cat
          memes from a shopping-mall WiFi in Osaka.
        </div>

        <div className="mt-5 flex gap-2 justify-end">
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
