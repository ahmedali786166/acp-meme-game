import {
  BARRIER, BASE_SPEED, CHASER_GAPS, FAST_FALL, JUMP_V, OVERHEAD, ROLL_TIME, TRAIN,
} from './constants';
import { playSound } from './audio';

export type ObsType = 'train' | 'barrier' | 'overhead';
export interface Obstacle {
  type: ObsType;
  lane: number; // -1, 0, 1
  z: number; // centre z (moves toward +z, the player sits at z = 0)
  len: number;
  hit: boolean;
}

export const OBS_DIMS = { train: TRAIN, barrier: BARRIER, overhead: OVERHEAD };

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
  mistakes: 0,
  chaserGap: CHASER_GAPS[0],
  chaserGapTarget: CHASER_GAPS[0],
  caughtTime: 0,
  obstacles: [] as Obstacle[],
  sinceSpawn: 0,
  nextGap: 30,
  lastFree: 0,
};

export function resetGame() {
  g.speed = BASE_SPEED;
  g.distance = 0;
  g.lane = g.prevLane = 0;
  g.x = g.targetX = 0;
  g.y = g.vy = 0;
  g.rolling = false;
  g.rollT = 0;
  g.invuln = 0;
  g.mistakes = 0;
  g.chaserGap = g.chaserGapTarget = CHASER_GAPS[0];
  g.caughtTime = 0;
  g.obstacles = [];
  g.sinceSpawn = 0;
  g.nextGap = 30;
  g.lastFree = 0;
}

// ---------- Player actions ----------
export function moveLane(dir: -1 | 1) {
  const n = g.lane + dir;
  if (n < -1 || n > 1) return;
  g.prevLane = g.lane;
  g.lane = n;
}

export function jump() {
  if (g.y <= 0.001) {
    g.vy = JUMP_V;
    g.rolling = false;
    playSound('jump');
  }
}

export function roll() {
  if (g.y > 0.001) g.vy = -FAST_FALL; // fast-fall when pressed in the air
  g.rolling = true;
  g.rollT = ROLL_TIME;
}

// ---------- Obstacle spawning ----------
export function spawnRow(z: number) {
  // pick a lane that is guaranteed free; it may only shift by 1 lane vs last row
  const options = [-1, 0, 1].filter((l) => Math.abs(l - g.lastFree) <= 1);
  const free = options[Math.floor(Math.random() * options.length)];
  g.lastFree = free;

  for (const lane of [-1, 0, 1]) {
    if (lane === free || Math.random() > 0.65) continue;
    const r = Math.random();
    const type: ObsType = r < 0.45 ? 'train' : r < 0.75 ? 'barrier' : 'overhead';
    g.obstacles.push({ type, lane, z, len: OBS_DIMS[type].len, hit: false });
  }
  g.nextGap = 20 + Math.random() * 12;
}
