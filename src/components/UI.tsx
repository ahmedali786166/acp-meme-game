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

function Coin({ className }: { className?: string }) {
  return (
    <svg className={className ? `coin ${className}` : 'coin'} viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="14" fill="#f9b400" stroke="#c87600" strokeWidth="2" />
      <circle cx="16" cy="16" r="10.5" fill="#ffd83d" stroke="#e39a00" strokeWidth="1.5" />
      <path d="M16 9.2l1.9 4.1 4.5.5-3.3 3.1.9 4.5-4-2.3-4 2.3.9-4.5-3.3-3.1 4.5-.5z" fill="#ff8a00" />
    </svg>
  );
}

function InstallIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v10" />
      <path d="m7.5 10 4.5 4.5L16.5 10" />
      <path d="M5 19h14" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <circle cx="18" cy="5.5" r="2.6" />
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="18.5" r="2.6" />
      <path d="m8.3 10.8 7.4-4M8.3 13.2l7.4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

function useInstallPrompt() {
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

  return { installed, toast, install };
}

function Logo() {
  return (
    <div className="logo">
      <h1>{GAME_TITLE}</h1>
      <h2>{GAME_SUBTITLE}</h2>
    </div>
  );
}

function MenuActions() {
  const { installed, toast, install } = useInstallPrompt();
  return (
    <div className="menu-actions">
      <div className="menu-buttons">
        {!installed && (
          <button className="cartoon-btn install" onClick={install}>
            <span className="btn-icon">
              <InstallIcon />
            </span>
            Install App
          </button>
        )}
        <button className="cartoon-btn invite" onClick={() => void inviteFriends()}>
          <span className="btn-icon">
            <ShareIcon />
          </span>
          Invite Friends
        </button>
      </div>
      {toast && <p className="toast">{toast}</p>}
    </div>
  );
}

function LoadingScreen() {
  const { progress } = useProgress();
  const pct = Math.round(progress);
  return (
    <div className="overlay loading">
      <div className="load-head">
        <span>Loading</span>
        <span className="load-dots">
          <i />
          <i />
          <i />
        </span>
      </div>
      <div className="load-center">
        <Logo />
        <div className="load-bar">
          <div className="load-fill" style={{ width: `${pct}%` }} />
          <span className="load-text">{pct}%</span>
        </div>
      </div>
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
  const { installed, toast, install } = useInstallPrompt();

  return (
    <div className="ui">
      {status === 'playing' && (
        <div className="hud">
          <div className="hud-hearts">
            {Array.from({ length: START_LIVES }, (_, i) => (
              <Heart key={i} filled={i < lives} />
            ))}
          </div>
          <div className="hud-right">
            <div className="score-chip">
              <span className="score-mult">x1</span>
              <span className="score-value">{String(distance).padStart(6, '0')}</span>
            </div>
            <div className="coin-chip">
              <span className="coin-value">{coins}</span>
              <Coin />
            </div>
          </div>
        </div>
      )}

      {status === 'menu' && (
        <>
          {!ready && <LoadingScreen />}
          <div className="overlay menu">
            <div className="menu-top">
              <div className="top-run-chip">
                <span>TOP RUN</span>
                <b>{best} m</b>
              </div>
              <div className="menu-hearts">
                {Array.from({ length: START_LIVES }, (_, i) => (
                  <Heart key={i} filled />
                ))}
              </div>
            </div>
            <Logo />
            <div className="menu-spacer" />
            <div className="menu-play">
              <button className="press-play" disabled={!ready} onClick={start}>
                {ready ? 'Press to Play' : 'Loading…'}
              </button>
              <p className="hint">Drag to explore &nbsp;·&nbsp; ← → lanes &nbsp;·&nbsp; ↑ jump &nbsp;·&nbsp; ↓ roll</p>
            </div>
            <MenuActions />
          </div>
        </>
      )}

      {status === 'caught' && showGameOver && (
        <div className="overlay caught">
          <div className="save-card">
            <div className="save-timer" aria-hidden>
              <i />
            </div>
            <h1 className="caught-title">CAUGHT!</h1>
            <p className="caught-sub">The Monster ACP got you.</p>
            <div className="stat-rows">
              <div className="stat-row">
                <span>Distance</span>
                <b>{distance} m</b>
              </div>
              <div className="stat-row">
                <span>Coins</span>
                <b className="stat-coins">
                  <Coin />
                  {coins}
                </b>
              </div>
            </div>
            <button className="save-btn green" onClick={start}>
              Run Again
              <span className="btn-badge">
                <PlayIcon />
              </span>
            </button>
            <button className="save-btn purple" onClick={() => void inviteFriends()}>
              Invite Friends
              <span className="btn-badge">
                <ShareIcon />
              </span>
            </button>
            {!installed && (
              <button className="install-chip" onClick={install}>
                <InstallIcon />
                Install
              </button>
            )}
            {toast && <p className="toast">{toast}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
