// Physical walls + door slabs between chambers. Player collides with these.
// `requires` = the unlock id needed for that segment to disappear (door).
// `requires: null` = always solid (wall flanking door).

export const PLAYER_RADIUS = 0.45;
export const DOOR_HALF_WIDTH = 1.5;

export const BARRIERS = [
  // chamber 1 → 2 (z = 4) — gate door
  { minX: -10, maxX: -DOOR_HALF_WIDTH, minZ: 3.85, maxZ: 4.15, requires: null },
  { minX:  DOOR_HALF_WIDTH, maxX: 10, minZ: 3.85, maxZ: 4.15, requires: null },
  { minX: -DOOR_HALF_WIDTH, maxX: DOOR_HALF_WIDTH, minZ: 3.85, maxZ: 4.15, requires: 'gate' },
  // chamber 2 → 3 (z = -4) — router door
  { minX: -10, maxX: -DOOR_HALF_WIDTH, minZ: -4.15, maxZ: -3.85, requires: null },
  { minX:  DOOR_HALF_WIDTH, maxX: 10, minZ: -4.15, maxZ: -3.85, requires: null },
  { minX: -DOOR_HALF_WIDTH, maxX: DOOR_HALF_WIDTH, minZ: -4.15, maxZ: -3.85, requires: 'router' },
  // chamber 3 → exit (z = -12) — pipeline door
  { minX: -10, maxX: -DOOR_HALF_WIDTH, minZ: -12.15, maxZ: -11.85, requires: null },
  { minX:  DOOR_HALF_WIDTH, maxX: 10, minZ: -12.15, maxZ: -11.85, requires: null },
  { minX: -DOOR_HALF_WIDTH, maxX: DOOR_HALF_WIDTH, minZ: -12.15, maxZ: -11.85, requires: 'pipeline' }
];

export function blocked(x, z, unlocked) {
  const r = PLAYER_RADIUS;
  for (const b of BARRIERS) {
    if (b.requires && unlocked.includes(b.requires)) continue;
    if (x > b.minX - r && x < b.maxX + r && z > b.minZ - r && z < b.maxZ + r) {
      return true;
    }
  }
  return false;
}
