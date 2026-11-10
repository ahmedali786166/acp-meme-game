// ---- Assets (all live in /public) ----
export const PLAYER_FBX = '/Running_acp.fbx';
export const CHASER_FBX = '/Running_modi.fbx';
export const GRAB_FBX = '/Unarmed_Grab_Torch_From_Wall.fbx';

// Mixamo FBX files are in centimetres -> scale to metres.
// If your characters look giant/tiny, tweak this.
export const MODEL_SCALE = 0.01;

// ---- Track ----
export const LANE_W = 2.5; // distance between lane centres
export const LANE_LERP = 14; // lane-switch smoothing (higher = snappier)
export const SPAWN_Z = -110;
export const DESPAWN_Z = 14;

// ---- Speed ----
export const BASE_SPEED = 14;
export const MAX_SPEED = 30;

// ---- Jump / roll ----
export const GRAVITY = 30;
export const JUMP_V = 10;
export const FAST_FALL = 18;
export const ROLL_TIME = 0.75;
export const STAND_H = 1.8;
export const ROLL_H = 0.7;

// ---- Chaser distance behind player (z units) per mistake count ----
// 0 mistakes, 1, 2, caught
export const CHASER_GAPS = [4.5, 3.0, 1.8, 0.9];
export const MAX_MISTAKES = 3; // 3rd mistake = caught
export const INVULN_TIME = 1.5;

// ---- Obstacle dimensions ----
export const TRAIN = { halfW: 1.0, len: 9, yMin: 0, yMax: 3.4 };
export const BARRIER = { halfW: 1.05, len: 0.6, yMin: 0, yMax: 1.0 };
export const OVERHEAD = { halfW: 1.05, len: 0.6, yMin: 1.2, yMax: 2.0 };
