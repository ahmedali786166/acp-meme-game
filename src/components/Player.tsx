import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_SCALE, PLAYER_FBX } from '../constants';
import { g } from '../gameState';
import { useGame } from '../store';

export function Player() {
  const fbx = useFBX(PLAYER_FBX);
  const root = useRef<THREE.Group>(null!);
  const lean = useRef<THREE.Group>(null!);
  const status = useGame((s) => s.status);

  const mixer = useMemo(() => new THREE.AnimationMixer(fbx), [fbx]);
  const run = useMemo(() => mixer.clipAction(fbx.animations[0]), [mixer, fbx]);

  useEffect(() => {
    fbx.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.frustumCulled = false; }
    });
    run.play();
    return () => { mixer.stopAllAction(); };
  }, [fbx, mixer, run]);

  useEffect(() => {
    if (status === 'playing') { run.timeScale = 1; run.paused = false; }
  }, [status, run]);

  useFrame((_, dt) => {
    mixer.update(dt);
    if (status === 'caught') run.timeScale = Math.max(0, run.timeScale - 3 * dt);

    root.current.position.set(g.x, g.y, 0);
    // blink while invulnerable after a mistake
    root.current.visible = g.invuln <= 0 || Math.floor(g.invuln * 12) % 2 === 0;

    const k = Math.min(1, 12 * dt);
    const tz = THREE.MathUtils.clamp((g.targetX - g.x) * -0.15, -0.4, 0.4); // bank into the turn
    const tx = g.rolling ? -0.8 : 0; // forward tilt while rolling
    const sy = g.rolling ? 0.6 : 1;
    lean.current.rotation.z += (tz - lean.current.rotation.z) * k;
    lean.current.rotation.x += (tx - lean.current.rotation.x) * k;
    lean.current.scale.y += (sy - lean.current.scale.y) * k;
  });

  return (
    <group ref={root}>
      <group ref={lean}>
        {/* Mixamo characters face +z; the track runs toward -z, so turn around */}
        <group rotation={[0, Math.PI, 0]}>
          <primitive object={fbx} scale={MODEL_SCALE} />
        </group>
      </group>
    </group>
  );
}
