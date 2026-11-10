import {
  BASE_SPEED, CHASER_GAPS, FAST_FALL, JUMP_V, LOG, ROLL_TIME, SOLID_WALL, START_LIVES, WALL,
} from './constants';
import { play } from './audio';

export type ObstacleType = 'wall' | 'log' | 'solid';

export interface Obstacle {
  type: ObstacleType;
  lane: number; // -1, 0, 1
  z: number; // centre z (moves toward +z, the player sits at z = 0)
  hit: boolean;
  x?: number; // optional world x override (used to centre the caught wall)
}

export interface Coin {
  lane: number;
  z: number;
  id: number;
}

export const OBS_DIMS = {
  wall: { halfW: WALL.halfW, depth: WALL.depth, height: WALL.height },
  log: { halfW: LOG.halfW, depth: LOG.depth, height: LOG.height },
  solid: { halfW: SOLID_WALL.halfW, depth: SOLID_WALL.depth, height: SOLID_WALL.height },
} as const;

/**
 * Mutable per-frame game state. Kept OUTSIDE React state on purpose:
 * it changes 60x/sec and must not trigger re-renders.
 */
export const g = {
  speed: BASE_SPEED,
  distance: 0,
  lane: 0,
  prevLane: 0,
  x: 0,
  targetX: 0,
  y: 0,
  vy: 0,
  rolling: false,
  rollT: 0,
  invuln: 0,
  lives: START_LIVES,
  coinCount: 0,
  obstacles: [] as Obstacle[],
  coins: [] as Coin[],
  sinceObstacle: 0,
  nextObstacleGap: 26,
  sinceCoin: 0,
  nextCoinGap: 8,
  lastFree: 0,
  caughtTime: 0,
  chaserGap: CHASER_GAPS[0],
  chaserGapTarget: CHASER_GAPS[0],
};

let coinId = 0;

export function resetGame() {
  g.speed = BASE_SPEED;
  g.distance = 0;
  g.lane = g.prevLane = 0;
  g.x = g.targetX = 0;
  g.y = g.vy = 0;
  g.rolling = false;
  g.rollT = 0;
  g.invuln = 0;
  g.lives = START_LIVES;
  g.coinCount = 0;
  g.obstacles = [];
  g.coins = [];
  g.sinceObstacle = 0;
  g.nextObstacleGap = 26;
  g.sinceCoin = 0;
  g.nextCoinGap = 8;
  g.lastFree = 0;
  g.caughtTime = 0;
  g.chaserGap = g.chaserGapTarget = CHASER_GAPS[0];
  coinId = 0;
}

// ---------- Player actions ----------
export function moveLane(dir: -1 | 1) {
  const next = g.lane + dir;
  if (next < -1 || next > 1) return;
  g.prevLane = g.lane;
  g.lane = next;
}

export function jump() {
  if (g.y > 0.001) return; // no double jump
  g.vy = JUMP_V;
  g.rolling = false;
  play('jump');
}

export function roll() {
  if (g.y > 0.001) g.vy = -FAST_FALL; // fast-fall when pressed in the air
  g.rolling = true;
  g.rollT = ROLL_TIME;
}

// ---------- Spawning ----------
export function spawnObstacleRow(z: number) {
  // pick a lane that is guaranteed free; it may only shift by 1 lane vs last row
  const options = [-1, 0, 1].filter((lane) => Math.abs(lane - g.lastFree) <= 1);
  const free = options[Math.floor(Math.random() * options.length)];
  g.lastFree = free;

  for (const lane of [-1, 0, 1]) {
    if (lane === free) continue;
    if (Math.random() > 0.6) continue;
    // don't drop a wall on top of a coin trail
    if (g.coins.some((c) => c.lane === lane && Math.abs(c.z - z) < 5)) continue;
    const r = Math.random();
    const type: ObstacleType = r < 0.5 ? 'wall' : r < 0.94 ? 'log' : 'solid';
    g.obstacles.push({ type, lane, z, hit: false });
  }
  g.nextObstacleGap = 18 + Math.random() * 14;
}

export function spawnCoinTrail(z: number) {
  const lane = Math.floor(Math.random() * 3) - 1;
  const blocked = g.obstacles.some((o) => o.lane === lane && Math.abs(o.z - z) < 6);
  if (blocked) {
    g.nextCoinGap = 8;
    return;
  }
  const count = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    g.coins.push({ lane, z: z - i * 2.4, id: coinId++ });
  }
  g.nextCoinGap = 16 + Math.random() * 12;
}
