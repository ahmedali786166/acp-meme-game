import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COIN_R, COIN_Y, LANE_W } from '../constants';
import { g } from '../gameState';
import { getGlowTexture } from '../cityAssets';

const POOL = 48;

/** Bright golden coins with an additive glow, spinning and bobbing in the lanes. */
export function Coins() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const gold = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffce33',
        emissive: '#ff9c00',
        emissiveIntensity: 0.95,
        metalness: 0.85,
        roughness: 0.24,
      }),
    []
  );
  const goldBright = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffe27a', emissive: '#ffd766', emissiveIntensity: 0.7, metalness: 0.9, roughness: 0.2 }),
    []
  );
  const star = useMemo(() => new THREE.MeshBasicMaterial({ color: '#fff1ad', toneMapped: false }), []);
  const glow = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: getGlowTexture(),
        color: '#ffc247',
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    glow.opacity = 0.42 + 0.18 * Math.sin(t * 4);
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
      group.rotation.y = t * 3 + i * 0.6;
    }
  });

  return (
    <>
      {Array.from({ length: POOL }, (_, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} visible={false}>
          <sprite material={glow} scale={[COIN_R * 4.6, COIN_R * 4.6, 1]} />
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow material={gold}>
            <cylinderGeometry args={[COIN_R, COIN_R, 0.09, 28]} />
          </mesh>
          <mesh material={goldBright}>
            <torusGeometry args={[COIN_R, 0.05, 8, 26]} />
          </mesh>
          <mesh position={[0, 0, 0.055]} material={star}>
            <circleGeometry args={[COIN_R * 0.46, 5]} />
          </mesh>
        </group>
      ))}
    </>
  );
}