import { useFrame } from '@react-three/fiber';
import {
  BASE_SPEED, CHASER_GAPS, DESPAWN_Z, GRAVITY, INVULN_TIME, LANE_LERP, LANE_W,
  MAX_MISTAKES, MAX_SPEED, ROLL_H, SPAWN_Z, STAND_H,
} from '../constants';
import { g, OBS_DIMS, Obstacle, spawnRow } from '../gameState';
import { playSound } from '../audio';
import { useGame } from '../store';

const PLAYER_HALF_W = 0.35;
const PLAYER_HALF_Z = 0.4;

function advanceWorld(dt: number) {
  const d = g.speed * dt;
  g.distance += d;
  for (const o of g.obstacles) o.z += d;
}

function onHit(o: Obstacle, front: boolean) {
  if (g.invuln > 0 || o.hit) return;
  o.hit = true;
  const store = useGame.getState();

  // Crashing head-on into a train/wall = instant "caught"
  if (o.type === 'train' && front) {
    g.chaserGapTarget = CHASER_GAPS[3];
    store.caught();
    return;
  }

  g.mistakes++;
  store.setMistakes(g.mistakes);

  if (g.mistakes >= MAX_MISTAKES) {
    g.chaserGapTarget = CHASER_GAPS[3];
    store.caught();
    return;
  }

  g.chaserGapTarget = CHASER_GAPS[g.mistakes]; // chaser closes in
  g.invuln = INVULN_TIME;
  playSound(g.mistakes === 1 ? 'first_touch' : 'second_touch');
  if (o.type === 'train') g.lane = g.prevLane; // side-scrape: bounce back to old lane
}

function updatePlaying(dt: number) {
  // speed ramps with distance
  g.speed = Math.min(MAX_SPEED, BASE_SPEED + g.distance * 0.003);

  // --- lane-switching math: exponential smoothing toward lane centre ---
  g.targetX = g.lane * LANE_W;
  g.x += (g.targetX - g.x) * Math.min(1, LANE_LERP * dt);

  // --- jump physics ---
  g.vy -= GRAVITY * dt;
  g.y += g.vy * dt;
  if (g.y <= 0) { g.y = 0; g.vy = 0; }

  // --- roll timer ---
  if (g.rolling) { g.rollT -= dt; if (g.rollT <= 0) g.rolling = false; }
  if (g.invuln > 0) g.invuln -= dt;

  advanceWorld(dt);

  // --- spawn / despawn ---
  g.sinceSpawn += g.speed * dt;
  if (g.sinceSpawn >= g.nextGap) { g.sinceSpawn = 0; spawnRow(SPAWN_Z); }
  if (g.obstacles.length && g.obstacles.some((o) => o.z > DESPAWN_Z + o.len / 2)) {
    g.obstacles = g.obstacles.filter((o) => o.z <= DESPAWN_Z + o.len / 2);
  }

  // --- AABB collisions (player sits at z = 0) ---
  const py0 = g.y;
  const py1 = g.y + (g.rolling ? ROLL_H : STAND_H);
  for (const o of g.obstacles) {
    if (o.hit) continue;
    const d = OBS_DIMS[o.type];
    const dx = Math.abs(o.lane * LANE_W - g.x);
    if (dx >= d.halfW + PLAYER_HALF_W) continue;
    const leading = o.z + o.len / 2; // edge nearest the player
    const trailing = o.z - o.len / 2;
    if (!(leading > -PLAYER_HALF_Z && trailing < PLAYER_HALF_Z)) continue;
    if (!(py0 < d.yMax && py1 > d.yMin)) continue;
    // "front" = we just reached the obstacle's face; otherwise we scraped its side
    const front = leading < PLAYER_HALF_Z + 0.5;
    onHit(o, front);
  }

  // --- score (only touch React state when the integer changes) ---
  const score = Math.floor(g.distance / 2);
  if (score !== useGame.getState().score) useGame.getState().setScore(score);
}

/** Runs all gameplay logic once per frame. Renders nothing. */
export function GameLoop() {
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const status = useGame.getState().status;
    if (status === 'playing') updatePlaying(dt);
    else if (status === 'caught') {
      g.speed = Math.max(0, g.speed - 45 * dt); // world slows to a stop
      g.caughtTime += dt;
      advanceWorld(dt);
    }
  });
  return null;
}
