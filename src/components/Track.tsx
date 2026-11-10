import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
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
          <Tile spec={spec} assets={assets} lampGlow={lampGlow} />
        </group>
      ))}
    </>
  );
}

function Tile({
  spec,
  assets,
  lampGlow,
}: {
  spec: TileSpec;
  assets: CityAssets;
  lampGlow: THREE.SpriteMaterial;
}) {
  return (
    <>
      {/* asphalt */}
      <mesh
        geometry={assets.plane}
        material={assets.roadMat}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[7.6, TILE, 1]}
        receiveShadow
      />
      <mesh geometry={assets.box} position={[0, -0.16, 0]} scale={[7.7, 0.3, TILE]}>
        <meshStandardMaterial color="#232529" roughness={1} />
      </mesh>

      {/* curbs */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          geometry={assets.box}
          material={assets.sidewalkMat}
          position={[side * 3.98, 0.08, 0]}
          scale={[0.18, 0.26, TILE]}
        />
      ))}

      {/* left sidewalk */}
      <mesh
        geometry={assets.box}
        material={assets.sidewalkMat}
        position={[-6.25, 0.1, 0]}
        scale={[4.3, 0.2, TILE]}
        receiveShadow
      />

      {/* right rail bed + rails */}
      <mesh geometry={assets.box} material={assets.bedMat} position={[6.25, 0.06, 0]} scale={[4.3, 0.12, TILE]} />
      {[5.4, 7.0].map((x) => (
        <mesh
          key={x}
          geometry={assets.box}
          material={assets.railMat}
          position={[x, 0.16, 0]}
          scale={[0.12, 0.14, TILE]}
        />
      ))}

      {/* guardrails */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 4.24, 0, 0]}>
          <mesh geometry={assets.box} material={assets.guardMat} position={[0, 0.9, 0]} scale={[0.1, 0.34, TILE]} />
          <mesh geometry={assets.box} material={assets.guardMat} position={[0, 0.5, 0]} scale={[0.08, 0.18, TILE]} />
          {[-6, -2, 2, 6].map((z) => (
            <mesh
              key={z}
              geometry={assets.box}
              material={assets.postMat}
              position={[0, 0.5, z]}
              scale={[0.16, 1, 0.16]}
            />
          ))}
        </group>
      ))}

      {/* concrete walls */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 8.6, 0, 0]}>
          <mesh
            geometry={assets.box}
            material={assets.wallMat}
            position={[0, 1.45, 0]}
            scale={[0.5, 2.9, TILE]}
            receiveShadow
          />
          <mesh geometry={assets.box} material={assets.wallMat} position={[0, 2.96, 0]} scale={[0.78, 0.14, TILE]} />
        </group>
      ))}

      {/* buildings */}
      {spec.buildings.map((b, k) => (
        <Buildings key={k} b={b} assets={assets} />
      ))}

      {/* neon signs */}
      {spec.signs.map((s, k) => (
        <group
          key={`s${k}`}
          position={[s.side * 9.15, s.y, s.z]}
          rotation={[0, s.side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
        >
          <mesh geometry={assets.plane} material={assets.signMats[s.style]} scale={[1.7, 4.3, 1]} />
          <mesh geometry={assets.box} material={assets.postMat} position={[0, 0, -0.08]} scale={[1.9, 0.14, 0.06]} />
          <sprite material={assets.glowMats[s.style]} position={[0, 0, 0.35]} scale={[6.5, 6.5, 1]} />
        </group>
      ))}

      {/* wall posters */}
      {spec.posters.map((p, k) => (
        <group
          key={`p${k}`}
          position={[p.side * 8.32, 1.5, p.z]}
          rotation={[0, p.side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
        >
          <mesh geometry={assets.plane} material={assets.posterMats[p.style]} scale={[2.3, 1.35, 1]} />
        </group>
      ))}

      {/* bins */}
      {spec.bin !== null && (
        <group position={[-4.92, 0.2, spec.bin]}>
          <mesh geometry={assets.cylinder} material={assets.binMat} position={[0, 0.4, 0]} scale={[0.54, 0.8, 0.54]} />
          <mesh geometry={assets.cylinder} material={assets.postMat} position={[0, 0.84, 0]} scale={[0.58, 0.06, 0.58]} />
        </group>
      )}

      {/* manholes */}
      {spec.manholes.map((m, k) => (
        <mesh
          key={`m${k}`}
          geometry={assets.circle}
          material={assets.manholeMat}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[m.x, 0.012, m.z]}
          scale={[1.3, 1.3, 1]}
        />
      ))}

      <StreetLamp side={spec.lampSide} assets={assets} lampGlow={lampGlow} />
      {spec.bridge !== null && <Overpass style={spec.bridge} assets={assets} />}
    </>
  );
}

function Buildings({ b, assets }: { b: BuildingSpec; assets: CityAssets }) {
  const mat = assets.windowMats[b.variant];
  const top = b.tier ? b.h + b.h * 0.22 : b.h;
  return (
    <group position={[b.x, 0, b.z]}>
      <mesh geometry={assets.box} material={mat} position={[0, b.h / 2, 0]} scale={[b.w, b.h, b.d]} />
      {b.tier && (
        <mesh
          geometry={assets.box}
          material={mat}
          position={[0, b.h + b.h * 0.11, 0]}
          scale={[b.w * 0.62, b.h * 0.22, b.d * 0.62]}
        />
      )}
      <mesh
        geometry={assets.box}
        material={assets.postMat}
        position={[b.w * 0.18, top + 0.5, b.d * 0.12]}
        scale={[b.w * 0.3, 1, b.d * 0.3]}
      />
      {b.antenna && (
        <>
          <mesh geometry={assets.box} material={assets.postMat} position={[0, top + 1.4, 0]} scale={[0.12, 2.8, 0.12]} />
          <mesh position={[0, top + 2.85, 0]} scale={[0.2, 0.2, 0.2]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#ff4b4b" toneMapped={false} />
          </mesh>
        </>
      )}
    </group>
  );
}

function StreetLamp({
  side,
  assets,
  lampGlow,
}: {
  side: -1 | 1;
  assets: CityAssets;
  lampGlow: THREE.SpriteMaterial;
}) {
  return (
    <group position={[side * 4.9, 0.15, 0]}>
      <mesh geometry={assets.box} material={assets.postMat} position={[0, 0.25, 0]} scale={[0.36, 0.5, 0.36]} />
      <mesh geometry={assets.box} material={assets.postMat} position={[0, 2.65, 0]} scale={[0.14, 5.3, 0.14]} />
      <mesh
        geometry={assets.box}
        material={assets.postMat}
        position={[-side * 0.85, 5.22, 0]}
        scale={[1.8, 0.12, 0.12]}
      />
      <mesh
        geometry={assets.box}
        material={assets.lampMat}
        position={[-side * 1.7, 5.12, 0]}
        scale={[0.62, 0.16, 0.36]}
      />
      <sprite material={lampGlow} position={[-side * 1.7, 5.06, 0]} scale={[2.8, 2.8, 1]} />
    </group>
  );
}

function Overpass({ style, assets }: { style: number; assets: CityAssets }) {
  return (
    <group position={[0, 0, 0]}>
      {/* deck */}
      <mesh geometry={assets.box} material={assets.sidewalkMat} position={[0, 7.65, 0]} scale={[24, 0.5, 4.6]} />
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          geometry={assets.box}
          material={assets.wallMat}
          position={[0, 8.25, side * 2.15]}
          scale={[24, 0.7, 0.3]}
        />
      ))}
      {/* columns */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          geometry={assets.box}
          material={assets.wallMat}
          position={[side * 10.2, 3.65, 0]}
          scale={[1.5, 7.3, 2.4]}
        />
      ))}
      {/* underside fixtures */}
      {[-6, 0, 6].map((x) => (
        <mesh key={x} geometry={assets.box} material={assets.lampMat} position={[x, 7.36, 0]} scale={[1.2, 0.05, 0.26]} />
      ))}
      {/* hanging sign */}
      <mesh geometry={assets.plane} material={assets.bridgeSignMats[style]} position={[0, 6.55, 0.2]} scale={[4.8, 1.2, 1]} />
      {/* traffic on the deck */}
      {[-5.6, 4.4].map((x, i) => (
        <group key={x} position={[x, 7.9, 0.5]}>
          <mesh geometry={assets.box} position={[0, 0.55, 0]} scale={[3.4, 0.95, 1.8]}>
            <meshStandardMaterial color={i ? '#2b3a4f' : '#4a2f33'} metalness={0.55} roughness={0.45} />
          </mesh>
          <mesh geometry={assets.box} position={[-0.2, 1.2, 0]} scale={[1.6, 0.55, 1.65]}>
            <meshStandardMaterial color="#10151d" metalness={0.4} roughness={0.4} />
          </mesh>
          {[-0.65, 0.65].map((z) => (
            <mesh key={z} position={[1.72, 0.62, z]} scale={[0.06, 0.14, 0.3]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="#ff3b30" toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}