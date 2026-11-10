import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LANE_W } from '../constants';
import { g } from '../gameState';

const TILE = 16;
const N = 9;
const TOTAL = TILE * N;

interface TreeSpot {
  x: number;
  z: number;
  scale: number;
  kind: number;
}

/** Treadmill track: solid white 3-lane path with low-poly trees on both sides. */
export function Track() {
  const tiles = useRef<(THREE.Group | null)[]>([]);
  const trees = useMemo(
    () =>
      Array.from({ length: N }, () => {
        const spots: TreeSpot[] = [];
        for (const side of [-1, 1]) {
          const count = 2 + Math.floor(Math.random() * 2);
          for (let i = 0; i < count; i++) {
            spots.push({
              x: side * (4.9 + Math.random() * 3.4),
              z: -TILE / 2 + Math.random() * TILE,
              scale: 0.8 + Math.random() * 0.75,
              kind: Math.floor(Math.random() * 3),
            });
          }
        }
        return spots;
      }),
    []
  );

  useFrame(() => {
    for (let i = 0; i < N; i++) {
      const tile = tiles.current[i];
      if (tile) tile.position.z = ((i * TILE + g.distance) % TOTAL) - (TOTAL - 30);
    }
  });

  return (
    <>
      {/* grass floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, -60]} receiveShadow>
        <planeGeometry args={[120, 320]} />
        <meshStandardMaterial color="#3f9b4a" />
      </mesh>

      {trees.map((spots, i) => (
        <group key={i} ref={(el) => (tiles.current[i] = el)}>
          {/* solid white path */}
          <mesh position={[0, -0.06, 0]} receiveShadow>
            <boxGeometry args={[LANE_W * 3, 0.12, TILE]} />
            <meshStandardMaterial color="#ffffff" roughness={0.85} />
          </mesh>
          {/* lane dividers */}
          {[-LANE_W / 2, LANE_W / 2].map((x) => (
            <mesh key={x} position={[x, 0.012, 0]}>
              <boxGeometry args={[0.1, 0.012, TILE * 0.7]} />
              <meshStandardMaterial color="#c5ccd6" />
            </mesh>
          ))}
          {/* orange edge lines */}
          {[-LANE_W * 1.5, LANE_W * 1.5].map((x) => (
            <mesh key={x} position={[x, 0.012, 0]}>
              <boxGeometry args={[0.12, 0.012, TILE]} />
              <meshStandardMaterial color="#ffb300" />
            </mesh>
          ))}
          {spots.map((spot, k) => (
            <Tree key={k} {...spot} />
          ))}
        </group>
      ))}
    </>
  );
}

function Tree({ x, z, scale, kind }: TreeSpot) {
  const green = ['#2e7d32', '#388e3c', '#43a047'][kind];
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.2, 1.4, 6]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <coneGeometry args={[0.95, 1.8, 6]} />
        <meshStandardMaterial color={green} flatShading />
      </mesh>
      <mesh position={[0, 2.55, 0]} castShadow>
        <coneGeometry args={[0.68, 1.35, 6]} />
        <meshStandardMaterial color={green} flatShading />
      </mesh>
    </group>
  );
}
