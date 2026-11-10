import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LANE_W } from '../constants';
import { g } from '../gameState';

const TILE = 20;
const N = 7;
const TOTAL = TILE * N;

/** Treadmill track: tiles scroll toward +z and wrap around. */
export function Track() {
  const tiles = useRef<(THREE.Group | null)[]>([]);
  const decor = useMemo(
    () => Array.from({ length: N }, () => ({
      l: [3 + Math.random() * 6, 3 + Math.random() * 6],
      r: [3 + Math.random() * 6, 3 + Math.random() * 6],
    })),
    []
  );

  useFrame(() => {
    for (let i = 0; i < N; i++) {
      const t = tiles.current[i];
      if (t) t.position.z = ((i * TILE + g.distance) % TOTAL) - (TOTAL - 30);
    }
  });

  return (
    <>
      {decor.map((d, i) => (
        <group key={i} ref={(el) => (tiles.current[i] = el)}>
          {/* ground */}
          <mesh position={[0, -0.1, 0]} receiveShadow>
            <boxGeometry args={[LANE_W * 3 + 0.4, 0.2, TILE]} />
            <meshStandardMaterial color="#4b4f58" />
          </mesh>
          {/* lane dividers */}
          {[-LANE_W / 2, LANE_W / 2].map((x) => (
            <mesh key={x} position={[x, 0.01, 0]}>
              <boxGeometry args={[0.08, 0.02, TILE]} />
              <meshStandardMaterial color="#e8e8e8" />
            </mesh>
          ))}
          {/* sleepers */}
          {[-8, -3, 2, 7].map((z) => (
            <mesh key={z} position={[0, 0.005, z]}>
              <boxGeometry args={[LANE_W * 3, 0.01, 0.4]} />
              <meshStandardMaterial color="#3a3d44" />
            </mesh>
          ))}
          {/* side buildings */}
          {d.l.map((h, k) => (
            <mesh key={`l${k}`} position={[-9, h / 2, -5 + k * 10]}>
              <boxGeometry args={[6, h, 8]} />
              <meshStandardMaterial color={k ? '#8d6e63' : '#607d8b'} />
            </mesh>
          ))}
          {d.r.map((h, k) => (
            <mesh key={`r${k}`} position={[9, h / 2, -5 + k * 10]}>
              <boxGeometry args={[6, h, 8]} />
              <meshStandardMaterial color={k ? '#78909c' : '#a1887f'} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}
