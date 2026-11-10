// ---- Assets (all live in /public) ----
export const PLAYER_FBX = '/Running_modi.fbx';
export const CHASER_FBX = '/Running_acp.fbx';
export const GRAB_FBX = '/Unarmed_Grab_Torch_From_Wall.fbx';

export const GAME_TITLE = 'Bhag Modi Bhag';
export const GAME_SUBTITLE = 'Meme Chase';

// These Mixamo FBX exports are already in metres (~1.79 m tall).
export const MODEL_SCALE = 1;

// ---- Track ----
export const LANE_W = 2.5; // distance between lane centres
export const LANE_LERP = 14; // lane-switch smoothing (higher = snappier)
export const SPAWN_Z = -100;
export const DESPAWN_Z = 14;

// ---- Speed ----
export const BASE_SPEED = 13;
export const MAX_SPEED = 28;

// ---- Jump / roll ----
export const GRAVITY = 32;
export const JUMP_V = 10.5;
export const FAST_FALL = 20;
export const ROLL_TIME = 0.75;
export const STAND_H = 1.8;
export const ROLL_H = 0.85;

// ---- Lives / chaser ----
export const START_LIVES = 3;
// index = lives lost (0..3); last entry = right behind the player
export const CHASER_GAPS = [4.4, 3.9, 3.3, 1.15];
export const INVULN_TIME = 1.6;

// ---- Obstacle dimensions ----
export const WALL = { halfW: 1.0, depth: 0.55, height: 1.0 };
export const LOG = { halfW: 1.0, depth: 0.7, height: 0.7 };
// Tall brick wall: impossible to jump, touching it ends the run instantly.
export const SOLID_WALL = { halfW: 1.0, depth: 0.6, height: 3.0 };

// ---- Coins ----
export const COIN_Y = 1.05;
export const COIN_R = 0.34;
