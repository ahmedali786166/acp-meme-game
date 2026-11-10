import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { CHASER_FBX, CHASER_GAPS, GRAB_FBX, MODEL_SCALE } from '../constants';
import { g } from '../gameState';
import { useGame } from '../store';

/** The chaser: the ACP model running behind Modi, grabbing him on caught. */
export function Chaser() {
  const fbx = useFBX(CHASER_FBX);
  const grabFbx = useFBX(GRAB_FBX);
  const root = useRef<THREE.Group>(null!);
  const facing = useRef<THREE.Group>(null!);
  const status = useGame((s) => s.status);
  const cx = useRef(0);
  const cz = useRef(CHASER_GAPS[0]);
  const grabbed = useRef(false);

  const mixer = useMemo(() => new THREE.AnimationMixer(fbx), [fbx]);
  const run = useMemo(() => mixer.clipAction(fbx.animations[0]), [mixer, fbx]);
  // grab clip is applied to the ACP skeleton (matching mixamorig* bone names)
  const grab = useMemo(() => {
    const action = mixer.clipAction(grabFbx.animations[0]);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    return action;
  }, [mixer, grabFbx]);

  useEffect(() => {
    fbx.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.frustumCulled = false;
      }
    });
    run.play();
    return () => {
      mixer.stopAllAction();
    };
  }, [fbx, mixer, run]);

  // restart -> back to running behind the player
  useEffect(() => {
    if (status === 'playing') {
      grab.stop();
      grab.paused = false;
      run.reset();
      run.setEffectiveWeight(1);
      run.play();
      grabbed.current = false;
      cx.current = g.x;
      cz.current = CHASER_GAPS[0];
    }
  }, [status, run, grab]);

  useFrame((_, dt) => {
    mixer.update(dt);
    const caught = status === 'caught';

    if (status === 'menu') {
      g.chaserGap = CHASER_GAPS[0];
      g.chaserGapTarget = CHASER_GAPS[0];
    }

    // during play the gap tightens with every life lost
    g.chaserGap += (g.chaserGapTarget - g.chaserGap) * Math.min(1, 2.5 * dt);

    // caught: step to Modi's side, right next to him
    const targetX = caught ? g.x + 0.45 : g.x;
    const targetZ = caught ? 0.25 : g.chaserGap;
    const ease = Math.min(1, (caught ? 7 : 10) * dt);
    cx.current += (targetX - cx.current) * ease;
    cz.current += (targetZ - cz.current) * ease;
    root.current.position.set(cx.current, 0, cz.current);

    // turn to face the camera (and slightly toward Modi) for the grab
    const turn = caught ? -0.45 : Math.PI;
    facing.current.rotation.y += (turn - facing.current.rotation.y) * Math.min(1, 8 * dt);

    if (caught && !grabbed.current) {
      grabbed.current = true;
      grab.reset().crossFadeFrom(run, 0.2, false).play();
    }
    // hold the reach pose instead of clamping on an arms-down end frame
    if (caught && grabbed.current && !grab.paused && grab.time >= grab.getClip().duration * 0.22) {
      grab.paused = true;
    }
  });

  return (
    <group ref={root}>
      <group ref={facing} rotation={[0, Math.PI, 0]}>
        <primitive object={fbx} scale={MODEL_SCALE} />
      </group>
    </group>
  );
}
