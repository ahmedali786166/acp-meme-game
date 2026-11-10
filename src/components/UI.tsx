import { useProgress } from '@react-three/drei';
import { MAX_MISTAKES } from '../constants';
import { useGame } from '../store';

export function UI() {
  const { status, score, best, mistakes, showGameOver, start } = useGame();
  const { progress } = useProgress();
  const ready = progress >= 100;

  return (
    <div className="ui">
      {status !== 'menu' && (
        <>
          <div className="score">
            <small>SCORE</small>
            {score}
          </div>
          <div className="lives">
            {Array.from({ length: MAX_MISTAKES }, (_, i) => (
              <span key={i} className={i < mistakes ? 'dot hit' : 'dot'} />
            ))}
          </div>
        </>
      )}

      {status === 'menu' && (
        <div className="overlay">
          <h1>AHMED<br />ARCADE</h1>
          <p className="hint">← → switch lane · ↑ jump · ↓ roll<br />(swipe on mobile)</p>
          <button disabled={!ready} onClick={start}>
            {ready ? 'START' : `LOADING ${Math.round(progress)}%`}
          </button>
        </div>
      )}

      {status === 'caught' && showGameOver && (
        <div className="overlay dark">
          <h1 className="red">PAKDA GYA!</h1>
          <p className="big">Score: {score}</p>
          <p className="hint">Best: {best}</p>
          <button onClick={start}>RESTART</button>
        </div>
      )}
    </div>
  );
}
