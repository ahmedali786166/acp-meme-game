import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { useGame } from './store';
import { g } from './gameState';
import { getAudioDebug } from './audio';
import { initPwa } from './pwa';

initPwa();

if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__bmb = { useGame, g, getAudioDebug };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
