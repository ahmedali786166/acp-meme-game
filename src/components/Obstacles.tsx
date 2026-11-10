import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LANE_W, LOG, SOLID_WALL, WALL } from '../constants';
import { g } from '../gameState';
import { useGame } from '../store';
import { getCityAssets, type CityAssets } from '../cityAssets';

const POOL = 20;

function makeBrickTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#7d2b1c'; // mortar
  c.fillRect(0, 0, 128, 128);
  const bh = 16;
  for (let row = 0; row < 8; row++) {
    const offset = (row % 2) * 16;
    for (let col = -1; col < 5; col++) {
      c.fillStyle = (row + col) % 3 === 0 ? '#b4442f' : '#c2503a';
      c.fillRect(offset + col * 32 + 2, row * bh + 2, 28, bh - 4);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

interface ObstacleMats {
  frame: THREE.MeshStandardMaterial;
  barrier: THREE.MeshStandardMaterial;
  reflective: THREE.MeshStandardMaterial;
  truckBody: THREE.MeshStandardMaterial;
  truckDoor: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  wheel: THREE.MeshStandardMaterial;
  tail: THREE.MeshBasicMaterial;
  amber: THREE.MeshBasicMaterial;
  plate: THREE.MeshBasicMaterial;
  tailGlow: THREE.SpriteMaterial;
  amberGlow: THREE.SpriteMaterial;
}

/**
 * Fixed pool of meshes re-positioned every frame from g.obstacles.
 * Child order per slot: [barricade, jersey barrier, parked truck, caught brick wall]
 */
export function Obstacles() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const assets = useMemo(getCityAssets, []);
  const bricks = useMemo(makeBrickTexture, []);
  const wallMap = useMemo(() => {
    const tex = bricks.clone();
    tex.needsUpdate = true;
    tex.repeat.set(2.4, 1);
    return tex;
  }, [bricks]);

  const mats = useMemo<ObstacleMats>(() => {
    const sprite = (color: string, opacity: number) =>
      new THREE.SpriteMaterial({
        map: assets.glowTex,
        color,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity,
        depthWrite: false,
        toneMapped: false,
      });
    return {
      frame: new THREE.MeshStandardMaterial({ color: '#3a3f47', metalness: 0.5, roughness: 0.6 }),
      barrier: new THREE.MeshStandardMaterial({ color: '#a9adb3', roughness: 0.9 }),
      reflective: new THREE.MeshStandardMaterial({
        color: '#f4f2ea',
        roughness: 0.4,
        emissive: '#ffe9c4',
        emissiveIntensity: 0.35,
      }),
      truckBody: new THREE.MeshStandardMaterial({ color: '#cbc9c2', roughness: 0.7, metalness: 0.15 }),
      truckDoor: new THREE.MeshStandardMaterial({ color: '#b9b7b0', roughness: 0.75, metalness: 0.1 }),
      dark: new THREE.MeshStandardMaterial({ color: '#22262c', roughness: 0.55, metalness: 0.45 }),
      wheel: new THREE.MeshStandardMaterial({ color: '#141518', roughness: 0.95 }),
      tail: new THREE.MeshBasicMaterial({ color: '#ff382e', toneMapped: false }),
      amber: new THREE.MeshBasicMaterial({ color: '#ffb02e', toneMapped: false }),
      plate: new THREE.MeshBasicMaterial({ color: '#e6e1cf', toneMapped: false }),
      tailGlow: sprite('#ff3b30', 0.5),
      amberGlow: sprite('#ffb02e', 0.55),
    };
  }, [assets]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 6));
    mats.amber.color.setRGB(pulse, 0.69 * pulse, 0.18 * pulse);
    mats.amberGlow.opacity = 0.2 + 0.5 * pulse;

    const caught = useGame.getState().status === 'caught';
    for (let i = 0; i < POOL; i++) {
      const group = refs.current[i];
      if (!group) continue;
      const obstacle = g.obstacles[i];
      if (!obstacle) {
        group.visible = false;
        continue;
      }
      group.visible = true;
      group.position.set(obstacle.x ?? obstacle.lane * LANE_W, 0, obstacle.z);
      const caughtWall = obstacle.type === 'wall' && obstacle.hit && caught;
      group.scale.x = caughtWall ? 0.3 : 1;
      group.children[0].visible = obstacle.type === 'wall' && !caughtWall;
      group.children[1].visible = obstacle.type === 'log';
      group.children[2].visible = obstacle.type === 'solid';
      group.children[3].visible = caughtWall;
    }
  });

  return (
    <>
      {Array.from({ length: POOL }, (_, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} visible={false}>
          <group>
            <Barricade assets={assets} mats={mats} />
          </group>
          <group>
            <JerseyBarrier assets={assets} mats={mats} />
          </group>
          <group>
            <ParkedTruck assets={assets} mats={mats} />
          </group>
          <group>
            <BrickWall map={wallMap} />
          </group>
        </group>
      ))}
    </>
  );
}

function Barricade({ assets, mats }: { assets: CityAssets; mats: ObstacleMats }) {
  const w = WALL.halfW * 2 - 0.06;
  const z = WALL.depth / 2;
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (w / 2 - 0.12), 0, 0]}>
          <mesh geometry={assets.box} material={mats.frame} position={[0, 0.44, 0]} scale={[0.1, 0.88, 0.1]} />
          <mesh
            geometry={assets.box}
            material={mats.frame}
            position={[0, 0.05, 0]}
            scale={[0.18, 0.1, WALL.depth]}
          />
        </group>
      ))}
      <mesh
        geometry={assets.box}
        material={assets.stripeMat}
        position={[0, 0.78, z - 0.035]}
        scale={[w, 0.3, 0.07]}
      />
      <mesh
        geometry={assets.box}
        material={assets.stripeMat}
        position={[0, 0.42, z - 0.035]}
        scale={[w, 0.26, 0.07]}
      />
      <mesh geometry={assets.box} material={mats.frame} position={[0, 1.0, 0]} scale={[0.28, 0.08, 0.2]} />
      <mesh geometry={assets.box} material={mats.amber} position={[0, 1.09, 0]} scale={[0.16, 0.14, 0.16]} />
      <sprite material={mats.amberGlow} position={[0, 1.12, 0.16]} scale={[1.2, 1.2, 1]} />
    </>
  );
}

function JerseyBarrier({ assets, mats }: { assets: CityAssets; mats: ObstacleMats }) {
  const w = LOG.halfW * 2 - 0.04;
  return (
    <>
      <mesh geometry={assets.box} material={mats.barrier} position={[0, 0.15, 0]} scale={[w, 0.3, LOG.depth]} />
      <mesh
        geometry={assets.box}
        material={mats.barrier}
        position={[0, 0.4, 0]}
        scale={[w * 0.92, 0.22, LOG.depth * 0.78]}
      />
      <mesh
        geometry={assets.box}
        material={mats.barrier}
        position={[0, 0.58, 0]}
        scale={[w * 0.82, 0.16, LOG.depth * 0.6]}
      />
      <mesh
        geometry={assets.box}
        material={assets.stripeMat}
        position={[0, 0.33, LOG.depth / 2 + 0.005]}
        scale={[w * 0.96, 0.12, 0.03]}
      />
      <mesh
        geometry={assets.box}
        material={mats.reflective}
        position={[0, 0.58, LOG.depth * 0.3 + 0.015]}
        scale={[w * 0.3, 0.08, 0.02]}
      />
    </>
  );
}

function ParkedTruck({ assets, mats }: { assets: CityAssets; mats: ObstacleMats }) {
  const w = SOLID_WALL.halfW * 2 - 0.06;
  const d = SOLID_WALL.depth;
  const dz = d / 2;
  return (
    <>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          geometry={assets.cylinder}
          material={mats.wheel}
          rotation={[0, 0, Math.PI / 2]}
          position={[s * (w / 2 - 0.04), 0.4, 0.08]}
          scale={[0.8, 0.3, 0.8]}
        />
      ))}
      <mesh geometry={assets.box} material={mats.dark} position={[0, 0.52, 0]} scale={[w * 0.96, 0.36, d * 0.92]} />
      <mesh
        geometry={assets.box}
        material={mats.truckBody}
        position={[0, 1.75, 0]}
        scale={[w, 2.26, d * 0.94]}
      />
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          geometry={assets.box}
          material={mats.truckDoor}
          position={[s * w * 0.235, 1.75, dz * 0.94 + 0.012]}
          scale={[w * 0.45, 1.98, 0.02]}
        />
      ))}
      <mesh geometry={assets.box} material={mats.dark} position={[0, 1.75, dz * 0.94 + 0.03]} scale={[0.05, 2.02, 0.02]} />
      {[0.95, 1.75, 2.55].map((y) => (
        <mesh
          key={y}
          geometry={assets.box}
          material={mats.dark}
          position={[0, y, dz * 0.94 + 0.035]}
          scale={[w * 0.88, 0.04, 0.015]}
        />
      ))}
      <mesh geometry={assets.box} material={mats.dark} position={[0, 0.56, dz * 0.9]} scale={[w, 0.24, 0.1]} />
      <mesh geometry={assets.box} material={mats.plate} position={[0, 0.77, dz * 0.97]} scale={[0.46, 0.16, 0.02]} />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * w * 0.34, 0.86, dz * 0.94 + 0.02]}>
          <mesh geometry={assets.box} material={mats.tail} scale={[0.32, 0.18, 0.05]} />
          <sprite material={mats.tailGlow} position={[0, 0, 0.1]} scale={[0.8, 0.8, 1]} />
        </group>
      ))}
      {[-0.28, 0, 0.28].map((x) => (
        <mesh
          key={x}
          geometry={assets.box}
          material={mats.amber}
          position={[x, 2.91, dz * 0.7]}
          scale={[0.1, 0.06, 0.05]}
        />
      ))}
    </>
  );
}

function BrickWall({ map }: { map: THREE.Texture }) {
  return (
    <>
      <mesh position={[0, WALL.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL.halfW * 2, WALL.height, WALL.depth]} />
        <meshStandardMaterial map={map} roughness={0.95} />
      </mesh>
      <mesh position={[0, WALL.height + 0.06, 0]} castShadow>
        <boxGeometry args={[WALL.halfW * 2 + 0.08, 0.12, WALL.depth + 0.08]} />
        <meshStandardMaterial color="#ea7a1c" roughness={0.75} />
      </mesh>
    </>
  );
}