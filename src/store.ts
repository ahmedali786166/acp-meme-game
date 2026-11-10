import { create } from 'zustand';
import { initAudio, play, startBg, stopBg } from './audio';
import { resetGame } from './gameState';
import { START_LIVES } from './constants';

export type Status = 'menu' | 'playing' | 'caught';

interface GameStore {
  status: Status;
  distance: number;
  coins: number;
  lives: number;
  best: number;
  showGameOver: boolean;
  start: () => void;
  caught: () => void;
  setDistance: (n: number) => void;
  setCoins: (n: number) => void;
  setLives: (n: number) => void;
}

const BEST_KEY = 'bmb-best-distance';
let gameOverTimer: number | undefined;

function readBest() {
  try {
    const value = Number(window.localStorage.getItem(BEST_KEY));
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export const useGame = create<GameStore>((set, get) => ({
  status: 'menu',
  distance: 0,
  coins: 0,
  lives: START_LIVES,
  best: readBest(),
  showGameOver: false,

  start: () => {
    window.clearTimeout(gameOverTimer);
    resetGame();
    set({ status: 'playing', distance: 0, coins: 0, lives: START_LIVES, showGameOver: false });
    // Init inside the click gesture; background loop starts once decoded.
    void initAudio()
      .then(() => {
        if (useGame.getState().status === 'playing') startBg();
      })
      .catch(() => undefined);
  },

  caught: () => {
    if (get().status !== 'playing') return;
    stopBg();
    play('caught'); // exactly once, on lives = 0 or a solid wall hit
    const finalDistance = Math.floor(get().distance);
    const best = Math.max(get().best, finalDistance);
    try {
      window.localStorage.setItem(BEST_KEY, String(best));
    } catch {
      // storage can be unavailable (private mode)
    }
    set({ status: 'caught', best });
    // let the chaser arrive, turn, grab and hold before the score panel appears
    gameOverTimer = window.setTimeout(() => set({ showGameOver: true }), 3200);
  },

  setDistance: (distance) => set({ distance }),
  setCoins: (coins) => set({ coins }),
  setLives: (lives) => set({ lives }),
}));
