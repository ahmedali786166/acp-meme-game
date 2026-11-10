import { useFrame } from '@react-three/fiber';
import {
  BASE_SPEED, CHASER_GAPS, DESPAWN_Z, GRAVITY, INVULN_TIME, LANE_LERP, LANE_W,
  MAX_SPEED, ROLL_H, SPAWN_Z, STAND_H,
} from '../constants';
import { g, OBS_DIMS, Obstacle, spawnCoinTrail, spawnObstacleRow } from '../gameState';
import { play, playCoin, stop } from '../audio';
import { useGame } from '../store';

const PLAYER_HALF_W = 0.36;
const PLAYER_HALF_Z = 0.4;

function advanceWorld(dt: number) {
  const d = g.speed * dt;
  g.distance += d;
  for (const o of g.obstacles) o.z += d;
  for (const c of g.coins) c.z += d;
}

function die(by?: Obstacle) {
  if (by) {
    // stage the lethal obstacle in front of the pair, like the reference shot:
    // the two characters face the camera from behind a waist-high brick wall
    by.type = by.type === 'solid' ? 'wall' : by.type;
    by.hit = true;
    by.z = 1.15;
  }
  g.speed = 0; // stop the world scrolling immediately
  g.lives = 0;
  g.chaserGapTarget = CHASER_GAPS[3];
  useGame.getState().setLives(0);
  useGame.getState().caught();
}

function hitObstacle(o: Obstacle) {
  o.hit = true;
  const solid = o.type === 'solid';
  g.lives = solid ? 0 : Math.max(0, g.lives - 1);
  useGame.getState().setLives(g.lives);

  if (solid || g.lives === 0) {
    die(o);
    return;
  }

  g.invuln = INVULN_TIME;
  g.chaserGapTarget = CHASER_GAPS[3 - g.lives];
  if (g.lives === 2) {
    play('firstTouch');
  } else if (g.lives === 1) {
    // the second touch replaces the first one instead of overlapping it
    stop('firstTouch');
    play('secondTouch');
  }
}

function collectCoins() {
  if (!g.coins.length) return;
  const remaining = [];
  let picked = 0;
  for (const coin of g.coins) {
    const dx = Math.abs(coin.lane * LANE_W - g.x);
    if (dx < 0.72 && Math.abs(coin.z) < 0.9) {
      picked++;
      continue;
    }
    remaining.push(coin);
  }
  if (picked > 0) {
    g.coins = remaining;
    g.coinCount += picked;
    useGame.getState().setCoins(g.coinCount);
    playCoin();
  }
}

function collideObstacles() {
  // player hitbox: feet at g.y, head at g.y + height
  const py0 = g.y;
  const py1 = g.y + (g.rolling ? ROLL_H : STAND_H);

  for (const o of g.obstacles) {
    if (o.hit) continue;
    const dims = OBS_DIMS[o.type];
    if (Math.abs(o.lane * LANE_W - g.x) >= dims.halfW + PLAYER_HALF_W) continue;

    const leading = o.z + dims.depth / 2;
    const trailing = o.z - dims.depth / 2;
    if (!(leading > -PLAYER_HALF_Z && trailing < PLAYER_HALF_Z)) continue;
    if (!(py0 < dims.height && py1 > 0)) continue;

    hitObstacle(o);
    if (useGame.getState().status !== 'playing') return;
  }
}

function updatePlaying(dt: number) {
  // speed ramps with distance
  g.speed = Math.min(MAX_SPEED, BASE_SPEED + g.distance * 0.0025);

  // lane switch: exponential smoothing toward the lane centre
  g.targetX = g.lane * LANE_W;
  g.x += (g.targetX - g.x) * Math.min(1, LANE_LERP * dt);

  // jump physics
  g.vy -= GRAVITY * dt;
  g.y += g.vy * dt;
  if (g.y <= 0) {
    g.y = 0;
    g.vy = 0;
  }

  if (g.rolling) {
    g.rollT -= dt;
    if (g.rollT <= 0) g.rolling = false;
  }
  if (g.invuln > 0) g.invuln -= dt;

  advanceWorld(dt);

  // spawn / despawn
  g.sinceObstacle += g.speed * dt;
  if (g.sinceObstacle >= g.nextObstacleGap) {
    g.sinceObstacle = 0;
    spawnObstacleRow(SPAWN_Z);
  }
  g.sinceCoin += g.speed * dt;
  if (g.sinceCoin >= g.nextCoinGap) {
    g.sinceCoin = 0;
    spawnCoinTrail(SPAWN_Z);
  }

  if (g.obstacles.some((o) => o.z > DESPAWN_Z)) {
    g.obstacles = g.obstacles.filter((o) => o.z <= DESPAWN_Z);
  }
  if (g.coins.some((c) => c.z > DESPAWN_Z)) {
    g.coins = g.coins.filter((c) => c.z <= DESPAWN_Z);
  }

  collectCoins();
  collideObstacles();

  const meters = Math.floor(g.distance);
  if (meters !== useGame.getState().distance) useGame.getState().setDistance(meters);
}

/** Runs all gameplay logic once per frame. Renders nothing. */
export function GameLoop() {
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const status = useGame.getState().status;
    if (status === 'playing') updatePlaying(dt);
    // 'caught' freezes the world: no distance, no obstacle or coin movement.
  });
  return null;
}
