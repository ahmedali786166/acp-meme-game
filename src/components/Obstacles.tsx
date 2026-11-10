import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LANE_W, LOG, SOLID_WALL, WALL } from '../constants';
import { g } from '../gameState';
import { useGame } from '../store';

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

/**
 * Fixed pool of meshes re-positioned every frame from g.obstacles.
 * Child order per slot: [brick wall, log, solid wall]
 */
export function Obstacles() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const bricks = useMemo(makeBrickTexture, []);
  const wallMap = useMemo(() => {
    const tex = bricks.clone();
    tex.needsUpdate = true;
    tex.repeat.set(2.4, 1);
    return tex;
  }, [bricks]);
  const solidMap = useMemo(() => {
    const tex = bricks.clone();
    tex.needsUpdate = true;
    tex.repeat.set(2.4, 3.2);
    return tex;
  }, [bricks]);

  useFrame(() => {
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
      group.scale.x = obstacle.hit && caught ? 0.3 : 1;
      group.children[0].visible = obstacle.type === 'wall';
      group.children[1].visible = obstacle.type === 'log';
      group.children[2].visible = obstacle.type === 'solid';
    }
  });

  return (
    <>
      {Array.from({ length: POOL }, (_, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} visible={false}>
          <BrickWall map={wallMap} />
          <Log />
          <SolidWall map={solidMap} />
        </group>
      ))}
    </>
  );
}

function BrickWall({ map }: { map: THREE.Texture }) {
  return (
    <group>
      <mesh position={[0, WALL.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL.halfW * 2, WALL.height, WALL.depth]} />
        <meshStandardMaterial map={map} roughness={0.95} />
      </mesh>
      <mesh position={[0, WALL.height + 0.06, 0]} castShadow>
        <boxGeometry args={[WALL.halfW * 2 + 0.08, 0.12, WALL.depth + 0.08]} />
        <meshStandardMaterial color="#ea7a1c" roughness={0.75} />
      </mesh>
    </group>
  );
}

function Log() {
  const r = LOG.height / 2;
  return (
    <group>
      <mesh position={[0, r, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, LOG.halfW * 2, 10]} />
        <meshStandardMaterial color="#7a4a24" roughness={1} />
      </mesh>
      {[-0.8, 0.8].map((x) => (
        <mesh key={x} position={[x, r, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[r + 0.015, r + 0.015, 0.14, 10]} />
          <meshStandardMaterial color="#a9743f" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function SolidWall({ map }: { map: THREE.Texture }) {
  const z = SOLID_WALL.depth / 2 + 0.01;
  return (
    <group>
      <mesh position={[0, SOLID_WALL.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[SOLID_WALL.halfW * 2, SOLID_WALL.height, SOLID_WALL.depth]} />
        <meshStandardMaterial map={map} roughness={0.95} />
      </mesh>
      {/* warning sign */}
      <mesh position={[0, 2.55, z]}>
        <planeGeometry args={[1.1, 0.5]} />
        <meshBasicMaterial color="#ffd54f" />
      </mesh>
      <mesh position={[0, 2.63, z + 0.01]}>
        <boxGeometry args={[0.09, 0.26, 0.01]} />
        <meshBasicMaterial color="#222222" />
      </mesh>
      <mesh position={[0, 2.46, z + 0.01]}>
        <boxGeometry args={[0.09, 0.09, 0.01]} />
        <meshBasicMaterial color="#222222" />
      </mesh>
    </group>
  );
}
