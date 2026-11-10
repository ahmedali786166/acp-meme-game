import { useEffect } from 'react';
import { jump, moveLane, roll } from '../gameState';
import { useGame } from '../store';

const SWIPE_MIN = 30; // px

/** Keyboard + touch swipe input. Renders nothing. */
export function Controls() {
  useEffect(() => {
    const playing = () => useGame.getState().status === 'playing';

    const onKey = (e: KeyboardEvent) => {
      if (!playing()) return;
      switch (e.key) {
        case 'ArrowLeft': case 'a': case 'A': moveLane(-1); break;
        case 'ArrowRight': case 'd': case 'D': moveLane(1); break;
        case 'ArrowUp': case 'w': case 'W': case ' ': jump(); break;
        case 'ArrowDown': case 's': case 'S': roll(); break;
        default: return;
      }
      e.preventDefault();
    };

    let sx = 0, sy = 0, tracking = false;
    const onStart = (e: TouchEvent) => {
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
    };
    const onMove = (e: TouchEvent) => {
      if (!tracking || !playing()) return;
      const dx = e.touches[0].clientX - sx;
      const dy = e.touches[0].clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN) return;
      if (Math.abs(dx) > Math.abs(dy)) moveLane(dx > 0 ? 1 : -1);
      else if (dy < 0) jump();
      else roll();
      tracking = false; // one action per swipe
    };
    const onEnd = () => (tracking = false);

    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, []);
  return null;
}
