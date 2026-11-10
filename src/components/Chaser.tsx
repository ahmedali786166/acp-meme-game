import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { CHASER_FBX, GRAB_FBX, MODEL_SCALE } from '../constants';
import { g } from '../gameState';
import { useGame } from '../store';

export function Chaser() {
  const fbx = useFBX(CHASER_FBX);
  const grabFbx = useFBX(GRAB_FBX);
  const root = useRef<THREE.Group>(null!);
  const status = useGame((s) => s.status);
  const cx = useRef(0);
  const grabbed = useRef(false);

  const mixer = useMemo(() => new THREE.AnimationMixer(fbx), [fbx]);
  const run = useMemo(() => mixer.clipAction(fbx.animations[0]), [mixer, fbx]);
  // The grab clip is applied to the chaser's skeleton (bone names must match: mixamorig*)
  const grab = useMemo(() => {
    const a = mixer.clipAction(grabFbx.animations[0]);
    a.setLoop(THREE.LoopOnce, 1);
    a.clampWhenFinished = true;
    return a;
  }, [mixer, grabFbx]);

  useEffect(() => {
    fbx.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.frustumCulled = false; }
    });
    run.play();
    return () => { mixer.stopAllAction(); };
  }, [fbx, mixer, run]);

  // restart -> back to running
  useEffect(() => {
    if (status === 'playing') {
      grab.stop();
      run.reset().play();
      grabbed.current = false;
      cx.current = g.x;
    }
  }, [status, run, grab]);

  useFrame((_, dt) => {
    mixer.update(dt);
    if (status === 'menu') cx.current = 0;

    // distance behind the player eases toward the target gap (set on every mistake)
    g.chaserGap += (g.chaserGapTarget - g.chaserGap) * Math.min(1, 3 * dt);
    cx.current += (g.x - cx.current) * Math.min(1, 5 * dt);
    root.current.position.set(cx.current, 0, g.chaserGap);

    // once he's close enough after the final hit: play the grab animation
    if (status === 'caught' && !grabbed.current && g.chaserGap < 1.5) {
      grabbed.current = true;
      grab.reset().crossFadeFrom(run, 0.2, false).play();
    }
  });

  return (
    <group ref={root}>
      <group rotation={[0, Math.PI, 0]}>
        <primitive object={fbx} scale={MODEL_SCALE} />
      </group>
    </group>
  );
}
