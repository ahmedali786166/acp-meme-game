# Bhag Modi Bhag: Meme Chase

Endless runner built with Vite + React Three Fiber (three.js), zustand for UI state.

- **Player:** Modi (`/Running_modi.fbx`)
- **Chaser:** ACP (`/Running_acp.fbx`) with a Mixamo grab clip (`/Unarmed_Grab_Torch_From_Wall.fbx`)
- **Track:** solid white 3-lane path with low-poly trees
- **Obstacles:** jumpable brick walls and logs, plus rare solid walls (instant caught)
- **Coins:** dark gold-rimmed coins to collect
- **Lives:** 3 hearts
- **Audio:** Web Audio API, unlocked by the "Tap to Start" click

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
