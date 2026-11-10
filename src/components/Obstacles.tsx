import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BARRIER, LANE_W, OVERHEAD, TRAIN } from '../constants';
import { g } from '../gameState';

const POOL = 24;
const TRAIN_COLORS = ['#c0392b', '#2980b9', '#27ae60', '#f39c12'];

/**
 * Fixed pool of meshes that is re-positioned every frame from g.obstacles.
 * No React re-renders while playing. Child order: [train, barrier, overhead]
 */
export function Obstacles() {
  const refs = useRef<(THREE.Group | null)[]>([]);

  useFrame(() => {
    for (let i = 0; i < POOL; i++) {
      const grp = refs.current[i];
      if (!grp) continue;
      const o = g.obstacles[i];
      if (!o) { grp.visible = false; continue; }
      grp.visible = true;
      grp.position.set(o.lane * LANE_W, 0, o.z);
      grp.children[0].visible = o.type === 'train';
      grp.children[1].visible = o.type === 'barrier';
      grp.children[2].visible = o.type === 'overhead';
    }
  });

  return (
    <>
      {Array.from({ length: POOL }, (_, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} visible={false}>
          {/* TRAIN: solid, can't be jumped */}
          <group>
            <mesh position={[0, TRAIN.yMax / 2, 0]} castShadow>
              <boxGeometry args={[TRAIN.halfW * 2, TRAIN.yMax, TRAIN.len]} />
              <meshStandardMaterial color={TRAIN_COLORS[i % TRAIN_COLORS.length]} />
            </mesh>
            <mesh position={[0, 2.4, 0]}>
              <boxGeometry args={[TRAIN.halfW * 2 + 0.02, 0.7, TRAIN.len - 0.6]} />
              <meshStandardMaterial color="#cfe8ff" />
            </mesh>
          </group>
          {/* BARRIER: jump over it */}
          <group>
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[BARRIER.halfW * 2, 1.0, BARRIER.len]} />
              <meshStandardMaterial color="#e53935" />
            </mesh>
            <mesh position={[0, 0.75, 0]}>
              <boxGeometry args={[BARRIER.halfW * 2 + 0.02, 0.25, BARRIER.len + 0.02]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </group>
          {/* OVERHEAD BAR: roll under it */}
          <group>
            <mesh position={[0, 1.6, 0]} castShadow>
              <boxGeometry args={[OVERHEAD.halfW * 2, 0.8, OVERHEAD.len]} />
              <meshStandardMaterial color="#ffb300" />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * OVERHEAD.halfW, 1.0, 0]}>
                <boxGeometry args={[0.15, 2.0, 0.15]} />
                <meshStandardMaterial color="#555" />
              </mesh>
            ))}
          </group>
        </group>
      ))}
    </>
  );
}
