import { mulberry32, hashSeed } from './rng.js';

export function genPipeline(seed) {
  if (!seed || seed === 'DEFAULT') {
    return { seed: 'DEFAULT', windowMs: 5000 };
  }
  const rng = mulberry32(hashSeed(`pipeline:${seed}`));
  // 3000..7000 in 500ms steps
  const windowMs = 3000 + Math.floor(rng() * 9) * 500;
  return { seed, windowMs };
}

export function pipelineHintLines(cfg) {
  return [
    '// L3 hint',
    'CI/CD pipeline. 3 stages. order matters. clock matters.',
    '  one stage starts the timer',
    '  another ships',
    '  the third must come between them',
    `  total budget ≤ ${cfg.windowMs / 1000}s. stale = 425. wrong order = 409.`,
    "(`traffic` has fragments of pipeline.yml — that's all you get)"
  ];
}
