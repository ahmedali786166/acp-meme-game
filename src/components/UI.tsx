import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { GAME_SUBTITLE, GAME_TITLE, START_LIVES } from '../constants';
import { useGame } from '../store';
import { canInstall, inviteFriends, isStandalone, promptInstall, subscribeInstall } from '../pwa';

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg className={filled ? 'heart filled' : 'heart'} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 21.2 10.6 20C5.6 15.7 2.5 12.9 2.5 9.4A5.3 5.3 0 0 1 8 4a5.9 5.9 0 0 1 4 1.9A5.9 5.9 0 0 1 16 4a5.3 5.3 0 0 1 5.5 5.4c0 3.5-3.1 6.3-8.1 10.6Z" />
    </svg>
  );
}

function InstallInvite() {
  const [installable, setInstallable] = useState(false);
  const [installed, setInstalled] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    setInstalled(isStandalone());
    setInstallable(canInstall());
    return subscribeInstall(setInstallable);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const install = async () => {
    if (installed) return;
    if (!installable) {
      setToast('Browser menu ⋮ → "Add to Home screen"');
      return;
    }
    const result = await promptInstall();
    if (result === 'accepted') {
      setInstalled(true);
      setToast('Installed! Open it from your home screen.');
    } else if (result === 'unavailable') {
      setToast('Browser menu ⋮ → "Add to Home screen"');
    }
  };

  return (
    <div className="install-invite">
      <div className="ghost-row">
        {!installed && (
          <button className="ghost" onClick={install}>
            Install App
          </button>
        )}
        <button className="ghost" onClick={() => void inviteFriends()}>
          Invite Friends
        </button>
      </div>
      {toast && <p className="toast">{toast}</p>}
    </div>
  );
}

export function UI() {
  const status = useGame((s) => s.status);
  const distance = useGame((s) => s.distance);
  const coins = useGame((s) => s.coins);
  const lives = useGame((s) => s.lives);
  const best = useGame((s) => s.best);
  const showGameOver = useGame((s) => s.showGameOver);
  const start = useGame((s) => s.start);
  const { progress } = useProgress();
  const ready = progress >= 100;

  return (
    <div className="ui">
      {status !== 'menu' && (
        <div className="hud">
          <div className="hud-box">
            <span className="hud-label">DISTANCE</span>
            <span className="hud-value">{distance} m</span>
          </div>
          <div className="hud-box hud-coins">
            <span className="coin-icon" aria-hidden />
            <span className="hud-value">{coins}</span>
          </div>
          <div className="hud-box hud-hearts">
            {Array.from({ length: START_LIVES }, (_, i) => (
              <Heart key={i} filled={i < lives} />
            ))}
          </div>
        </div>
      )}

      {status === 'menu' && (
        <div className="overlay">
          <p className="kicker">RUN FOR YOUR LIFE</p>
          <h1>{GAME_TITLE}</h1>
          <h2>{GAME_SUBTITLE}</h2>
          <p className="hint">← → switch lane &nbsp;·&nbsp; ↑ jump &nbsp;·&nbsp; ↓ roll</p>
          <p className="hint small">(swipe on mobile)</p>
          <button disabled={!ready} onClick={start}>
            {ready ? 'TAP TO START' : `LOADING ${Math.round(progress)}%`}
          </button>
          <InstallInvite />
        </div>
      )}

      {status === 'caught' && showGameOver && (
        <div className="overlay caught">
          <div className="caught-head">
            <h1 className="caught-title">CAUGHT!</h1>
            <p className="big">The Monster ACP got you.</p>
          </div>
          <div className="caught-foot">
            <div className="stats">
              <div>
                <span>{distance} m</span>
                <small>DISTANCE</small>
              </div>
              <div>
                <span>{coins}</span>
                <small>COINS</small>
              </div>
              <div>
                <span>{best} m</span>
                <small>BEST</small>
              </div>
            </div>
            <button onClick={start}>RUN AGAIN</button>
            <InstallInvite />
          </div>
        </div>
      )}
    </div>
  );
}
