import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { g } from '../gameState';
import { getCityAssets, type CityAssets } from '../cityAssets';

const TILE = 16;
const N = 9;
const TOTAL = TILE * N;

interface BuildingSpec {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  variant: number;
  tier: boolean;
  antenna: boolean;
}

interface SignSpec {
  side: -1 | 1;
  z: number;
  y: number;
  style: number;
}

interface PosterSpec {
  side: -1 | 1;
  z: number;
  style: number;
}

interface TileSpec {
  buildings: BuildingSpec[];
  signs: SignSpec[];
  posters: PosterSpec[];
  bin: number | null;
  lampSide: -1 | 1;
  bridge: number | null;
  manholes: { x: number; z: number }[];
}

interface TileMats {
  base: THREE.MeshStandardMaterial;
  beacon: THREE.MeshBasicMaterial;
  carA: THREE.MeshStandardMaterial;
  carB: THREE.MeshStandardMaterial;
  cab: THREE.MeshStandardMaterial;
  tail: THREE.MeshBasicMaterial;
}

interface Part {
  geo: THREE.BufferGeometry;
  mat: THREE.Material;
  matrix: THREE.Matrix4;
}

interface SpritePart {
  mat: THREE.SpriteMaterial;
  pos: THREE.Vector3;
  scale: number;
}

const v = new THREE.Vector3();
const q = new THREE.Quaternion();
const s = new THREE.Vector3();
const e = new THREE.Euler();

function tileZ(i: number) {
  return ((i * TILE + g.distance) % TOTAL) - (TOTAL - 30);
}

function makeTileSpec(i: number): TileSpec {
  const buildings: BuildingSpec[] = [];
  for (const side of [-1, 1] as const) {
    const count = Math.random() < 0.3 ? 1 : 2;
    for (let k = 0; k < count; k++) {
      const w = 3.8 + Math.random() * 3;
      const d = 3.8 + Math.random() * 3.4;
      buildings.push({
        x: side * (12.2 + Math.random() * 6 + w * 0.15),
        z: -TILE / 2 + 1.2 + Math.random() * (TILE - 2.4),
        w,
        h: 9 + Math.random() * 36,
        d,
        variant: Math.floor(Math.random() * 4),
        tier: Math.random() < 0.42,
        antenna: Math.random() < 0.35,
      });
    }
  }

  const signs: SignSpec[] = [];
  const signCount = Math.random() < 0.45 ? 2 : 1;
  for (let k = 0; k < signCount; k++) {
    signs.push({
      side: Math.random() < 0.5 ? -1 : 1,
      z: -TILE / 2 + 1.5 + Math.random() * (TILE - 3),
      y: 4.2 + Math.random() * 3.2,
      style: Math.floor(Math.random() * 4),
    });
  }

  const posters: PosterSpec[] = [];
  if (Math.random() < 0.7) {
    posters.push({
      side: Math.random() < 0.5 ? -1 : 1,
      z: -TILE / 2 + 2 + Math.random() * (TILE - 4),
      style: Math.floor(Math.random() * 3),
    });
  }

  const manholes: { x: number; z: number }[] = [];
  if (Math.random() < 0.5) {
    manholes.push({
      x: -2.4 + Math.random() * 4.8,
      z: -TILE / 2 + 2.5 + Math.random() * (TILE - 5),
    });
  }

  return {
    buildings,
    signs,
    posters,
    bin: Math.random() < 0.45 ? -TILE / 2 + 2 + Math.random() * (TILE - 4) : null,
    lampSide: i % 2 === 0 ? -1 : 1,
    bridge: i % 4 === 2 ? i % 3 : null,
    manholes,
  };
}

/** Endless dusk highway: asphalt lanes, rail line, guardrails, walls and a neon city. */
export function Track() {
  const assets = useMemo(getCityAssets, []);
  const specs = useMemo(() => Array.from({ length: N }, (_, i) => makeTileSpec(i)), []);
  const tiles = useRef<(THREE.Group | null)[]>([]);
  const lamps = useRef<(THREE.PointLight | null)[]>([]);
  const lightTiles = useMemo(() => [0, 3, 6], []);

  const mats = useMemo<TileMats>(
    () => ({
      base: new THREE.MeshStandardMaterial({ color: '#232529', roughness: 1 }),
      beacon: new THREE.MeshBasicMaterial({ color: '#ff4b4b', toneMapped: false }),
      carA: new THREE.MeshStandardMaterial({ color: '#4a2f33', metalness: 0.55, roughness: 0.45 }),
      carB: new THREE.MeshStandardMaterial({ color: '#2b3a4f', metalness: 0.55, roughness: 0.45 }),
      cab: new THREE.MeshStandardMaterial({ color: '#10151d', metalness: 0.4, roughness: 0.4 }),
      tail: new THREE.MeshBasicMaterial({ color: '#ff3b30', toneMapped: false }),
    }),
    []
  );

  const lampGlow = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: assets.glowTex,
        color: '#ffc07a',
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        toneMapped: false,
      }),
    [assets]
  );

  const duskGlow = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: assets.glowTex,
        color: '#ff9f6b',
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    [assets]
  );

  useFrame(() => {
    for (let i = 0; i < N; i++) {
      const tile = tiles.current[i];
      if (tile) tile.position.z = tileZ(i);
    }
    for (let k = 0; k < lightTiles.length; k++) {
      const light = lamps.current[k];
      const spec = specs[lightTiles[k]];
      if (light) light.position.set(spec.lampSide * 3.2, 4.95, tileZ(lightTiles[k]));
    }
  });

  return (
    <>
      <group position={[0, 0, -40]}>
        <mesh geometry={assets.box} material={assets.skyMat} scale={[150, 150, 150]} renderOrder={-1} />
      </group>
      <sprite material={duskGlow} position={[0, 16, -138]} scale={[120, 120, 1]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.34, -60]} receiveShadow>
        <planeGeometry args={[320, 360]} />
        <meshStandardMaterial color="#1e2229" roughness={1} />
      </mesh>

      {lightTiles.map((tileIndex, k) => (
        <pointLight
          key={k}
          ref={(el) => (lamps.current[k] = el)}
          color="#ffb36b"
          intensity={65}
          distance={24}
          decay={1.7}
        />
      ))}

      {specs.map((spec, i) => (
        <group key={i} ref={(el) => (tiles.current[i] = el)}>
          <Tile spec={spec} assets={assets} mats={mats} lampGlow={lampGlow} />
        </group>
      ))}
    </>
  );
}

function Tile({
  spec,
  assets,
  mats,
  lampGlow,
}: {
  spec: TileSpec;
  assets: CityAssets;
  mats: TileMats;
  lampGlow: THREE.SpriteMaterial;
}) {
  const content = useMemo(() => {
    const parts: Part[] = [];
    const sprites: SpritePart[] = [];
    buildTile(spec, assets, mats, lampGlow, parts, sprites);
    return { meshes: mergeByMaterial(parts), sprites };
  }, [spec, assets, mats, lampGlow]);

  return (
    <>
      {content.meshes.map((m, i) => (
        <mesh key={i} geometry={m.geo} material={m.mat} receiveShadow />
      ))}
      {content.sprites.map((sp, i) => (
        <sprite key={`sp${i}`} material={sp.mat} position={sp.pos} scale={[sp.scale, sp.scale, 1]} />
      ))}
    </>
  );
}

function compose(pos: [number, number, number], scale: [number, number, number], rotY = 0) {
  v.set(...pos);
  e.set(0, rotY, 0);
  q.setFromEuler(e);
  s.set(...scale);
  return new THREE.Matrix4().compose(v, q, s);
}

function push(
  parts: Part[],
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  pos: [number, number, number],
  scale: [number, number, number],
  rotY = 0,
  parent?: THREE.Matrix4
) {
  const m = compose(pos, scale, rotY);
  if (parent) m.premultiply(parent);
  parts.push({ geo, mat, matrix: m });
}

function pushMesh(
  parts: Part[],
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  pos: [number, number, number],
  scale: [number, number, number],
  rot?: [number, number, number],
  parent?: THREE.Matrix4
) {
  v.set(...pos);
  e.set(...(rot ?? [0, 0, 0]));
  q.setFromEuler(e);
  s.set(...scale);
  const m = new THREE.Matrix4().compose(v, q, s);
  if (parent) m.premultiply(parent);
  parts.push({ geo, mat, matrix: m });
}

function buildTile(
  spec: TileSpec,
  assets: CityAssets,
  mats: TileMats,
  lampGlow: THREE.SpriteMaterial,
  parts: Part[],
  sprites: SpritePart[]
) {
  const { box, plane, cylinder, circle } = assets;

  // asphalt + base
  pushMesh(parts, plane, assets.roadMat, [0, 0, 0], [7.6, TILE, 1], [-Math.PI / 2, 0, 0]);
  push(parts, box, mats.base, [0, -0.16, 0], [7.7, 0.3, TILE]);

  // curbs + left sidewalk
  for (const side of [-1, 1]) {
    push(parts, box, assets.sidewalkMat, [side * 3.98, 0.08, 0], [0.18, 0.26, TILE]);
  }
  push(parts, box, assets.sidewalkMat, [-6.25, 0.1, 0], [4.3, 0.2, TILE]);

  // right rail bed + rails
  push(parts, box, assets.bedMat, [6.25, 0.06, 0], [4.3, 0.12, TILE]);
  for (const x of [5.4, 7.0]) {
    push(parts, box, assets.railMat, [x, 0.16, 0], [0.12, 0.14, TILE]);
  }

  // guardrails
  for (const side of [-1, 1]) {
    push(parts, box, assets.guardMat, [side * 4.24, 0.9, 0], [0.1, 0.34, TILE]);
    push(parts, box, assets.guardMat, [side * 4.24, 0.5, 0], [0.08, 0.18, TILE]);
    for (const z of [-6, -2, 2, 6]) {
      push(parts, box, assets.postMat, [side * 4.24, 0.5, z], [0.16, 1, 0.16]);
    }
  }

  // concrete walls
  for (const side of [-1, 1]) {
    push(parts, box, assets.wallMat, [side * 8.6, 1.45, 0], [0.5, 2.9, TILE]);
    push(parts, box, assets.wallMat, [side * 8.6, 2.96, 0], [0.78, 0.14, TILE]);
  }

  // buildings
  for (const b of spec.buildings) {
    const mat = assets.windowMats[b.variant];
    const top = b.tier ? b.h + b.h * 0.22 : b.h;
    push(parts, box, mat, [b.x, b.h / 2, b.z], [b.w, b.h, b.d]);
    if (b.tier) {
      push(parts, box, mat, [b.x, b.h + b.h * 0.11, b.z], [b.w * 0.62, b.h * 0.22, b.d * 0.62]);
    }
    push(
      parts,
      box,
      assets.postMat,
      [b.x + b.w * 0.18, top + 0.5, b.z + b.d * 0.12],
      [b.w * 0.3, 1, b.d * 0.3]
    );
    if (b.antenna) {
      push(parts, box, assets.postMat, [b.x, top + 1.4, b.z], [0.12, 2.8, 0.12]);
      push(parts, box, mats.beacon, [b.x, top + 2.85, b.z], [0.2, 0.2, 0.2]);
    }
  }

  // neon signs
  for (const sg of spec.signs) {
    const rotY = sg.side > 0 ? -Math.PI / 2 : Math.PI / 2;
    const parent = compose([sg.side * 9.15, sg.y, sg.z], [1, 1, 1], rotY);
    pushMesh(parts, plane, assets.signMats[sg.style], [0, 0, 0], [1.7, 4.3, 1], [0, 0, 0], parent);
    push(parts, box, assets.postMat, [0, 0, -0.08], [1.9, 0.14, 0.06], 0, parent);
    v.set(0, 0, 0.35).applyMatrix4(parent);
    sprites.push({ mat: assets.glowMats[sg.style], pos: v.clone(), scale: 6.5 });
  }

  // wall posters
  for (const p of spec.posters) {
    const rotY = p.side > 0 ? -Math.PI / 2 : Math.PI / 2;
    const parent = compose([p.side * 8.32, 1.5, p.z], [1, 1, 1], rotY);
    pushMesh(parts, plane, assets.posterMats[p.style], [0, 0, 0], [2.3, 1.35, 1], [0, 0, 0], parent);
  }

  // bins
  if (spec.bin !== null) {
    const parent = compose([-4.92, 0.2, spec.bin], [1, 1, 1]);
    push(parts, cylinder, assets.binMat, [0, 0.4, 0], [0.54, 0.8, 0.54], 0, parent);
    push(parts, cylinder, assets.postMat, [0, 0.84, 0], [0.58, 0.06, 0.58], 0, parent);
  }

  // manholes
  for (const mh of spec.manholes) {
    pushMesh(parts, circle, assets.manholeMat, [mh.x, 0.012, mh.z], [1.05, 1.05, 1], [-Math.PI / 2, 0, 0]);
  }

  // street lamp
  {
    const side = spec.lampSide;
    const parent = compose([side * 4.9, 0.15, 0], [1, 1, 1]);
    push(parts, box, assets.postMat, [0, 0.25, 0], [0.36, 0.5, 0.36], 0, parent);
    push(parts, box, assets.postMat, [0, 2.65, 0], [0.14, 5.3, 0.14], 0, parent);
    push(parts, box, assets.postMat, [-side * 0.85, 5.22, 0], [1.8, 0.12, 0.12], 0, parent);
    push(parts, box, assets.lampMat, [-side * 1.7, 5.12, 0], [0.62, 0.16, 0.36], 0, parent);
    v.set(-side * 1.7, 5.06, 0).applyMatrix4(parent);
    sprites.push({ mat: lampGlow, pos: v.clone(), scale: 2.8 });
  }

  // overpass
  if (spec.bridge !== null) {
    push(parts, box, assets.sidewalkMat, [0, 7.65, 0], [24, 0.5, 4.6]);
    for (const side of [-1, 1]) {
      push(parts, box, assets.wallMat, [0, 8.25, side * 2.15], [24, 0.7, 0.3]);
      push(parts, box, assets.wallMat, [side * 10.2, 3.65, 0], [1.5, 7.3, 2.4]);
    }
    for (const x of [-6, 0, 6]) {
      push(parts, box, assets.lampMat, [x, 7.36, 0], [1.2, 0.05, 0.26]);
    }
    pushMesh(parts, plane, assets.bridgeSignMats[spec.bridge], [0, 6.55, 0.2], [4.8, 1.2, 1]);

    [-5.6, 4.4].forEach((x, i) => {
      const parent = compose([x, 7.9, 0.5], [1, 1, 1]);
      push(parts, box, i ? mats.carB : mats.carA, [0, 0.55, 0], [3.4, 0.95, 1.8], 0, parent);
      push(parts, box, mats.cab, [-0.2, 1.2, 0], [1.6, 0.55, 1.65], 0, parent);
      for (const z of [-0.65, 0.65]) {
        push(parts, box, mats.tail, [1.72, 0.62, z], [0.06, 0.14, 0.3], 0, parent);
      }
    });
  }
}

/** Merges tile parts by material so each tile costs a dozen draw calls instead of ~60. */
function mergeByMaterial(parts: Part[]) {
  const groups = new Map<THREE.Material, THREE.BufferGeometry[]>();
  for (const p of parts) {
    const geo = p.geo.clone().applyMatrix4(p.matrix);
    const list = groups.get(p.mat);
    if (list) list.push(geo);
    else groups.set(p.mat, [geo]);
  }
  const result: { mat: THREE.Material; geo: THREE.BufferGeometry }[] = [];
  for (const [mat, geos] of groups) {
    const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos);
    if (!merged) continue;
    result.push({ mat, geo: merged });
    if (merged !== geos[0]) geos.forEach((geo) => geo.dispose());
  }
  return result;
}
