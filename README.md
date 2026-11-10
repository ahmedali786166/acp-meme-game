# Bhag Modi Bhag: Meme Chase

Endless runner built with Vite + React Three Fiber (three.js), zustand for UI state.

- **Player:** Modi (`/models/modi.glb`)
- **Chaser:** ACP (`/models/acp.glb`) with a Mixamo grab clip (`/models/grab.glb`, loaded after start)
- **Track:** solid white 3-lane path with low-poly trees
- **Obstacles:** jumpable brick walls and logs, plus rare solid walls (instant caught)
- **Coins:** dark gold-rimmed coins to collect
- **Lives:** 3 hearts
- **Audio:** Web Audio API, unlocked by the "Tap to Start" click; intro clip plays once, hits replace each other

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Controls

- `←` / `→` or `A` / `D` — switch lane
- `↑` / `W` / `Space` — jump
- `↓` / `S` — roll
- Swipe on touch devices

## Deploy

Pushed to GitHub and deployed on Vercel. Every push to `main` auto-deploys.
