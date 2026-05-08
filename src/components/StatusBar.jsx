import React from 'react';

export default function StatusBar({ status, unlocked, totalNodes }) {
  const color =
    status === 'error' ? 'text-terminal-red'
    : status === 'success' ? 'text-emerald-300'
    : status === 'processing' ? 'text-yellow-300'
    : 'text-terminal-green';

  return (
    <div className="flex items-center gap-4 text-xs">
      <span className={`uppercase tracking-widest ${color}`}>
        ● {status}
      </span>
      <span className="text-terminal-green/70">
        nodes: {unlocked.length}/{totalNodes}
      </span>
    </div>
  );
}
