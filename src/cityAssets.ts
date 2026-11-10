import * as THREE from 'three';

/** Procedural canvas textures and shared materials for the city scene. */

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext('2d')! };
}

function speckle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number,
  colors: string[],
  max = 3
) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * max, 1 + Math.random() * max);
  }
}

function finish(tex: THREE.CanvasTexture, repeatX = 1, repeatY = 1) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 4;
  return tex;
}

function makeRoadTexture() {
  const { canvas, ctx } = makeCanvas(256, 512);
  ctx.fillStyle = '#3a3d43';
  ctx.fillRect(0, 0, 256, 512);
  speckle(ctx, 256, 512, 2600, ['rgba(255,255,255,.05)', 'rgba(0,0,0,.22)', 'rgba(120,125,132,.08)']);

  // worn wheel tracks
  for (const cx of [64, 192]) {
    const g = ctx.createLinearGradient(cx - 22, 0, cx + 22, 0);
    g.addColorStop(0, 'rgba(20,21,24,0)');
    g.addColorStop(0.5, 'rgba(20,21,24,.22)');
    g.addColorStop(1, 'rgba(20,21,24,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - 22, 0, 44, 512);
  }

  // cracks
  ctx.strokeStyle = 'rgba(16,17,20,.55)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 9; i++) {
    let x = Math.random() * 256;
    let y = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      x += (Math.random() - 0.5) * 34;
      y += Math.random() * 30;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // edge lines + dashed lane dividers
  ctx.fillStyle = 'rgba(226,228,230,.9)';
  ctx.fillRect(8, 0, 4, 512);
  ctx.fillRect(244, 0, 4, 512);
  for (const x of [84.5, 170.5]) {
    for (let y = 0; y < 512; y += 120) ctx.fillRect(x - 2, y, 4, 58);
  }

  // manhole-ish patch
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath();
  ctx.arc(200, 350, 15, 0, Math.PI * 2);
  ctx.fill();
  return finish(new THREE.CanvasTexture(canvas));
}

function makeConcreteTexture() {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = '#74777d';
  ctx.fillRect(0, 0, 256, 256);
  speckle(ctx, 256, 256, 1800, ['rgba(255,255,255,.07)', 'rgba(0,0,0,.14)', 'rgba(90,94,100,.3)']);
  ctx.strokeStyle = 'rgba(0,0,0,.25)';
  ctx.lineWidth = 2;
  for (let y = 64; y < 256; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  for (let x = 128; x < 256; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  // grime near the bottom
  const g = ctx.createLinearGradient(0, 150, 0, 256);
  g.addColorStop(0, 'rgba(20,22,26,0)');
  g.addColorStop(1, 'rgba(20,22,26,.45)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 150, 256, 106);
  return finish(new THREE.CanvasTexture(canvas));
}

function makeTrackBedTexture() {
  const { canvas, ctx } = makeCanvas(128, 256);
  ctx.fillStyle = '#2b2d30';
  ctx.fillRect(0, 0, 128, 256);
  speckle(ctx, 128, 256, 2200, ['rgba(200,200,200,.09)', 'rgba(0,0,0,.35)', 'rgba(120,115,105,.16)'], 2);
  ctx.fillStyle = '#4b3c2e';
  for (let y = 6; y < 256; y += 32) {
    ctx.fillRect(0, y, 128, 10);
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(0, y + 10, 128, 2);
    ctx.fillStyle = '#4b3c2e';
  }
  return finish(new THREE.CanvasTexture(canvas));
}

function makeWindowTexture(variant: number) {
  const { canvas, ctx } = makeCanvas(256, 512);
  const cols = [4, 5, 3, 6][variant];
  const rows = [16, 20, 14, 24][variant];
  ctx.fillStyle = '#181e2a';
  ctx.fillRect(0, 0, 256, 512);
  speckle(ctx, 256, 512, 500, ['rgba(255,255,255,.03)', 'rgba(0,0,0,.18)']);
  const cellW = 256 / cols;
  const cellH = 512 / rows;
  const lit = ['#ffd18c', '#ffe3b0', '#cfe4ff', '#a8c8f0', '#fff0c4'];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW + cellW * 0.18;
      const y = r * cellH + cellH * 0.2;
      const w = cellW * 0.64;
      const h = cellH * 0.55;
      const isLit = Math.random() < 0.44;
      ctx.fillStyle = isLit ? lit[Math.floor(Math.random() * lit.length)] : '#0b1017';
      ctx.fillRect(x, y, w, h);
      if (isLit) {
        ctx.fillStyle = 'rgba(255,255,255,.28)';
        ctx.fillRect(x, y, w, h * 0.18);
      }
      ctx.strokeStyle = 'rgba(0,0,0,.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
    }
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(0, r * cellH, 256, 2);
  }
  // rooftop band
  ctx.fillStyle = '#232b38';
  ctx.fillRect(0, 0, 256, 10);
  return finish(new THREE.CanvasTexture(canvas));
}

const SIGN_STYLES = [
  { text: 'HOP', color: '#ff4fa3' },
  { text: 'SUSHI', color: '#39e6ff' },
  { text: '24H', color: '#ffb02e' },
  { text: 'RAMEN', color: '#79ff9f' },
];

function makeSignTexture(style: number) {
  const { text, color } = SIGN_STYLES[style];
  const { canvas, ctx } = makeCanvas(160, 420);
  ctx.fillStyle = '#100b16';
  ctx.fillRect(0, 0, 160, 420);
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.shadowColor = color;
  ctx.shadowBlur = 22;
  ctx.strokeRect(9, 9, 142, 402);
  ctx.fillStyle = color;
  ctx.font = '900 66px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const chars = text.split('');
  const step = 400 / chars.length;
  chars.forEach((ch, i) => ctx.fillText(ch, 80, 9 + step * (i + 0.5)));
  return finish(new THREE.CanvasTexture(canvas));
}

const POSTER_STYLES = [
  { title: 'NEON', sub: 'NIGHTS', a: '#2a0f3a', b: '#ff3d7f' },
  { title: 'SUNSET', sub: 'CITY', a: '#132238', b: '#ff8a3d' },
  { title: 'CHASE', sub: 'LIVE', a: '#0b2b2f', b: '#33e0b0' },
];

function makePosterTexture(style: number) {
  const { title, sub, a, b } = POSTER_STYLES[style];
  const { canvas, ctx } = makeCanvas(256, 150);
  const g = ctx.createLinearGradient(0, 0, 256, 150);
  g.addColorStop(0, a);
  g.addColorStop(1, '#070a10');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 150);
  ctx.strokeStyle = b;
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 244, 138);
  ctx.fillStyle = b;
  ctx.shadowColor = b;
  ctx.shadowBlur = 16;
  ctx.font = '900 54px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 128, 78);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e9eef7';
  ctx.font = '700 24px Arial, sans-serif';
  ctx.fillText(sub, 128, 116);
  return finish(new THREE.CanvasTexture(canvas));
}

const BRIDGE_SIGN_STYLES = [
  { text: 'SUNSET BLVD', arrow: '→' },
  { text: 'CITY CENTER', arrow: '↑' },
  { text: 'RIVER ST', arrow: '↗' },
];

function makeBridgeSignTexture(style: number) {
  const { text, arrow } = BRIDGE_SIGN_STYLES[style % BRIDGE_SIGN_STYLES.length];
  const { canvas, ctx } = makeCanvas(512, 128);
  ctx.fillStyle = '#0d5a3c';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#d7e5dc';
  ctx.lineWidth = 5;
  ctx.strokeRect(6, 6, 500, 116);
  ctx.fillStyle = '#f2f7f3';
  ctx.font = '900 52px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 26, 64);
  ctx.font = '900 62px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(arrow, 486, 64);
  return finish(new THREE.CanvasTexture(canvas));
}

function makeStripeTexture() {
  const { canvas, ctx } = makeCanvas(128, 128);
  ctx.fillStyle = '#f0ede4';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#f2761d';
  ctx.lineWidth = 20;
  for (let x = -128; x < 256; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 128, 128);
    ctx.stroke();
  }
  return finish(new THREE.CanvasTexture(canvas), 2, 1);
}

function makeGlowTexture() {
  const { canvas, ctx } = makeCanvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,.65)');
  g.addColorStop(0.6, 'rgba(255,255,255,.18)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeSkyTexture() {
  const { canvas, ctx } = makeCanvas(4, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#1f2c42');
  g.addColorStop(0.34, '#4c5e78');
  g.addColorStop(0.5, '#93a3b6');
  g.addColorStop(0.56, '#69788a');
  g.addColorStop(1, '#1c2029');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface CityAssets {
  box: THREE.BoxGeometry;
  plane: THREE.PlaneGeometry;
  cylinder: THREE.CylinderGeometry;
  circle: THREE.CircleGeometry;
  roadMat: THREE.MeshStandardMaterial;
  sidewalkMat: THREE.MeshStandardMaterial;
  wallMat: THREE.MeshStandardMaterial;
  bedMat: THREE.MeshStandardMaterial;
  railMat: THREE.MeshStandardMaterial;
  guardMat: THREE.MeshStandardMaterial;
  postMat: THREE.MeshStandardMaterial;
  binMat: THREE.MeshStandardMaterial;
  manholeMat: THREE.MeshStandardMaterial;
  lampMat: THREE.MeshStandardMaterial;
  windowMats: THREE.MeshStandardMaterial[];
  signMats: THREE.MeshBasicMaterial[];
  glowMats: THREE.SpriteMaterial[];
  posterMats: THREE.MeshBasicMaterial[];
  bridgeSignMats: THREE.MeshBasicMaterial[];
  skyMat: THREE.MeshBasicMaterial;
  stripeMat: THREE.MeshStandardMaterial;
  stripeBasicMat: THREE.MeshBasicMaterial;
  stripeTex: THREE.Texture;
  glowTex: THREE.Texture;
}

let cache: CityAssets | null = null;

export function getCityAssets(): CityAssets {
  if (cache) return cache;

  const roadTex = makeRoadTexture();
  const concrete = makeConcreteTexture();
  const bedTex = makeTrackBedTexture();
  const stripeTex = makeStripeTexture();
  const glowTex = makeGlowTexture();
  const skyTex = makeSkyTexture();

  const wallConcrete = concrete.clone();
  wallConcrete.needsUpdate = true;
  wallConcrete.repeat.set(6, 1);
  const sidewalkConcrete = concrete.clone();
  sidewalkConcrete.needsUpdate = true;
  sidewalkConcrete.repeat.set(3, 6);

  const windowMats = [0, 1, 2, 3].map((variant) => {
    const tex = makeWindowTexture(variant);
    return new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: '#ffffff',
      emissiveIntensity: 1.05,
      color: '#b5bfd0',
      roughness: 0.88,
      metalness: 0.08,
    });
  });

  const signMats = SIGN_STYLES.map((s) => {
    const tex = makeSignTexture(SIGN_STYLES.indexOf(s));
    return new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, side: THREE.DoubleSide });
  });

  const glowMats = SIGN_STYLES.map(
    (s) =>
      new THREE.SpriteMaterial({
        map: glowTex,
        color: s.color,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        toneMapped: false,
      })
  );

  const posterMats = POSTER_STYLES.map(
    (_, i) =>
      new THREE.MeshBasicMaterial({ map: makePosterTexture(i), toneMapped: false, side: THREE.DoubleSide })
  );

  const bridgeSignMats = BRIDGE_SIGN_STYLES.map(
    (_, i) =>
      new THREE.MeshBasicMaterial({ map: makeBridgeSignTexture(i), toneMapped: false, side: THREE.DoubleSide })
  );

  cache = {
    box: new THREE.BoxGeometry(1, 1, 1),
    plane: new THREE.PlaneGeometry(1, 1),
    cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
    circle: new THREE.CircleGeometry(0.5, 18),
    roadMat: new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.94, metalness: 0.04 }),
    sidewalkMat: new THREE.MeshStandardMaterial({ map: sidewalkConcrete, roughness: 0.95 }),
    wallMat: new THREE.MeshStandardMaterial({ map: wallConcrete, roughness: 0.92 }),
    bedMat: new THREE.MeshStandardMaterial({ map: bedTex, roughness: 1 }),
    railMat: new THREE.MeshStandardMaterial({ color: '#9aa3ad', metalness: 0.9, roughness: 0.32 }),
    guardMat: new THREE.MeshStandardMaterial({ color: '#8d959f', metalness: 0.85, roughness: 0.35 }),
    postMat: new THREE.MeshStandardMaterial({ color: '#3b3f46', metalness: 0.5, roughness: 0.6 }),
    binMat: new THREE.MeshStandardMaterial({ color: '#2c4a3c', metalness: 0.3, roughness: 0.8 }),
    manholeMat: new THREE.MeshStandardMaterial({ color: '#34373d', metalness: 0.45, roughness: 0.85 }),
    lampMat: new THREE.MeshStandardMaterial({
      color: '#ffd9a0',
      emissive: '#ffb35c',
      emissiveIntensity: 2.2,
      toneMapped: false,
    }),
    windowMats,
    signMats,
    glowMats,
    posterMats,
    bridgeSignMats,
    skyMat: new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
      toneMapped: false,
    }),
    stripeMat: new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 0.7 }),
    stripeBasicMat: new THREE.MeshBasicMaterial({ map: stripeTex, toneMapped: false }),
    stripeTex,
    glowTex,
  };
  return cache;
}

let glowOnly: THREE.Texture | null = null;

export function getGlowTexture() {
  if (!glowOnly) glowOnly = makeGlowTexture();
  return glowOnly;
}