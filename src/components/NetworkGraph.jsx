import React from 'react';
import Minimap from './Minimap.jsx';

export default function NetworkGraph({ nodes, unlocked, activeNode, status }) {
  const positions = nodes.map((_, i) => ({
    cx: 210,
    cy: 70 + i * 110
  }));

  return (
    <aside className="bg-terminal-panel border-l border-terminal-glow/20 p-4 flex flex-col gap-2 overflow-y-auto">
      <div className="text-xs uppercase tracking-widest text-terminal-glow/80">// network_topology</div>
      <svg viewBox="0 0 420 520" className="w-full h-auto">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* edges */}
        {nodes.slice(0, -1).map((n, i) => {
          const a = positions[i];
          const b = positions[i + 1];
          const isUnlocked = unlocked.includes(n.id);
          return (
            <line
              key={`e-${i}`}
              x1={a.cx} y1={a.cy}
              x2={b.cx} y2={b.cy}
              stroke={isUnlocked ? '#22c55e' : '#14532d'}
              strokeWidth="2"
              strokeDasharray={isUnlocked ? '0' : '6 4'}
            />
          );
        })}

        {/* nodes */}
        {nodes.map((n, i) => {
          const p = positions[i];
          const isActive = activeNode === n.id;
          const isUnlocked = unlocked.includes(n.id);
          const isExit = n.id === 'exit';
          const fill = isExit
            ? (unlocked.length === nodes.length - 1 ? '#10b981' : '#0b1014')
            : isUnlocked ? '#10b981' : '#0b1014';
          const stroke = isActive ? '#22c55e' : isUnlocked ? '#10b981' : '#14532d';

          return (
            <g key={n.id}>
              {isActive && (
                <circle cx={p.cx} cy={p.cy} r="38" fill="url(#glow)" />
              )}
              <circle
                cx={p.cx} cy={p.cy} r="22"
                fill={fill}
                stroke={stroke}
                strokeWidth={isActive ? 3 : 2}
              />
              <text
                x={p.cx} y={p.cy + 4}
                textAnchor="middle"
                fontSize="12"
                fill={isUnlocked ? '#05080a' : '#22c55e'}
                fontFamily="JetBrains Mono, monospace"
              >
                {n.level}
              </text>
              <text
                x={p.cx + 38} y={p.cy + 4}
                fontSize="11"
                fill={isActive ? '#10b981' : '#22c55e'}
                fontFamily="JetBrains Mono, monospace"
              >
                {n.label}
              </text>
              {isUnlocked && (
                <text
                  x={p.cx - 38} y={p.cy + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#10b981"
                >
                  ✓
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="text-[10px] text-terminal-green/60 leading-snug">
        <div>● active node pulses</div>
        <div>━━ solid edge = traversable</div>
        <div>┄┄ dashed edge = locked</div>
        <div className="mt-2 text-terminal-glow">status: <span className="uppercase">{status}</span></div>
      </div>

      <Minimap unlocked={unlocked} totalLevels={nodes.length - 1} />
    </aside>
  );
}
