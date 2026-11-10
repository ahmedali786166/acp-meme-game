import { create } from 'zustand';
import { playSound, stopSound, unlockAudio } from './audio';
import { resetGame } from './gameState';

export type Status = 'menu' | 'playing' | 'caught';

interface GameStore {
  status: Status;
  score: number;
  best: number;
  mistakes: number;
  showGameOver: boolean;
  start: () => void;
  caught: () => void;
  setScore: (n: number) => void;
  setMistakes: (n: number) => void;
}

let gameOverTimer: number | undefined;

export const useGame = create<GameStore>((set, get) => ({
  status: 'menu',
  score: 0,
  best: 0,
  mistakes: 0,
  showGameOver: false,

  start: () => {
    window.clearTimeout(gameOverTimer);
    unlockAudio();
    (['pakda_gya', 'first_touch', 'second_touch'] as const).forEach(stopSound);
    resetGame();
    playSound('start');
    set({ status: 'playing', score: 0, mistakes: 0, showGameOver: false });
  },

  caught: () => {
    if (get().status !== 'playing') return;
    (['first_touch', 'second_touch'] as const).forEach(stopSound);
    playSound('pakda_gya'); // immediately on being caught
    set((s) => ({ status: 'caught', best: Math.max(s.best, s.score) }));
    // let the grab animation play before showing the overlay
    gameOverTimer = window.setTimeout(() => set({ showGameOver: true }), 2200);
  },

  setScore: (score) => set({ score }),
  setMistakes: (mistakes) => set({ mistakes }),
}));
