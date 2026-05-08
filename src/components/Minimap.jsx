import React from 'react';

// Inverse-hangman: each unlock adds parts to escape rocket.
// Stage 0: launchpad only · 1: + body · 2: + thrusters · 3: full launch (PUBLIC_INTERNET)

const FRAMES = [
  // 0: nothing
  [
    '       .       ',
    '      ___      ',
    '     |   |     ',
    '     |___|     ',
    '   _________   ',
    '  /  PAD-7  \\  ',
    ' /___________\\ ',
    '               ',
    '   [ NO ESC ]  '
  ],
  // 1: gate unlocked → AI body materializes
  [
    '       .       ',
    '      /A\\      ',
    '     |   |     ',
    '     |___|     ',
    '   _________   ',
    '  /  PAD-7  \\  ',
    ' /___________\\ ',
    '               ',
    '   [ L1 OK  ]  '
  ],
  // 2: router unlocked → thrusters attached
  [
    '       .       ',
    '      /A\\      ',
    '     |[#]|     ',
    '     |___|     ',
    '    /|   |\\    ',
    '   //|___|\\\\   ',
    '  /  PAD-7  \\  ',
    ' /___________\\ ',
    '   [ L2 OK  ]  '
  ],
  // 3: pipeline unlocked → liftoff
  [
    '      /A\\      ',
    '     |[#]|     ',
    '     |___|     ',
    '    /|   |\\    ',
    '   //|___|\\\\   ',
    '   * * * * *   ',
    '  *  FIRE  *   ',
    '   * * * * *   ',
    '  >>> ESCAPE   '
  ]
];

const LABELS = ['STANDBY', 'BODY ONLINE', 'THRUSTERS HOT', 'LIFTOFF'];

export default function Minimap({ unlocked, totalLevels = 3 }) {
  const stage = Math.min(unlocked.length, FRAMES.length - 1);
  const frame = FRAMES[stage];
  const label = LABELS[stage];

  return (
    <div className="bg-black/40 border border-terminal-glow/30 p-3 mt-3">
      <div className="text-[10px] uppercase tracking-widest text-terminal-glow/80 mb-2">
        // escape_vehicle
      </div>
      <pre className={`text-xs leading-tight ${stage === 3 ? 'text-emerald-300' : 'text-terminal-green'}`}>
{frame.join('\n')}
      </pre>
      <div className="mt-2 flex items-center justify-between text-[10px]">
        <span className="text-terminal-glow">{label}</span>
        <span className="text-terminal-green/70">stage {stage}/{totalLevels}</span>
      </div>
      <div className="mt-1 h-1 bg-terminal-green/10">
        <div
          className="h-full bg-terminal-glow transition-all duration-500"
          style={{ width: `${(stage / totalLevels) * 100}%` }}
        />
      </div>
    </div>
  );
}
