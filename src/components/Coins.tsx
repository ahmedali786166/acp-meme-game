import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COIN_R, COIN_Y, LANE_W } from '../constants';
import { g } from '../gameState';

const POOL = 48;

/** Dark round coins with a gold rim, spinning and bobbing in the lanes. */
export function Coins() {
  const refs = useRef<(THREE.Group | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (let i = 0; i < POOL; i++) {
      const group = refs.current[i];
      if (!group) continue;
      const coin = g.coins[i];
      if (!coin) {
        group.visible = false;
        continue;
      }
      group.visible = true;
      group.position.set(coin.lane * LANE_W, COIN_Y + Math.sin(t * 3 + i) * 0.08, coin.z);
      group.rotation.z = t * 2.6 + i;
    }
  });

  return (
    <>
      {Array.from({ length: POOL }, (_, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} visible={false}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[COIN_R, COIN_R, 0.08, 24]} />
            <meshStandardMaterial color="#2f2814" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh>
            <torusGeometry args={[COIN_R, 0.045, 8, 24]} />
            <meshStandardMaterial color="#c9a227" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.055]}>
            <circleGeometry args={[0.13, 5]} />
            <meshStandardMaterial color="#c9a227" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </>
  );
}
