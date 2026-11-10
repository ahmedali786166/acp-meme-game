import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CHASER_MODEL, CHASER_GAPS, MODEL_SCALE } from '../constants';
import { g } from '../gameState';
import { loadGrabClip } from '../grabClip';
import { useGame } from '../store';

/** The chaser: the ACP model running behind Modi, grabbing him on caught. */
export function Chaser() {
  const { scene: model, animations } = useGLTF(CHASER_MODEL);
  const root = useRef<THREE.Group>(null!);
  const facing = useRef<THREE.Group>(null!);
  const status = useGame((s) => s.status);
  const cx = useRef(0);
  const cz = useRef(CHASER_GAPS[0]);
  const grabbed = useRef(false);
  const grabRequested = useRef(false);

  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  const run = useMemo(() => mixer.clipAction(animations[0]), [mixer, animations]);
  const grab = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.frustumCulled = false;
      }
    });
    run.play();
    return () => {
      mixer.stopAllAction();
    };
  }, [model, mixer, run]);

  // load the grab clip in the background once the run starts
  useEffect(() => {
    if (status === 'menu' || grabRequested.current) return;
    grabRequested.current = true;
    void loadGrabClip().then((clip) => {
      if (!clip) return;
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      grab.current = action;
    });
  }, [mixer, status]);

  // restart -> back to running behind the player
  useEffect(() => {
    if (status === 'playing') {
      grab.current?.stop();
      if (grab.current) grab.current.paused = false;
      run.reset();
      run.setEffectiveWeight(1);
      run.play();
      grabbed.current = false;
      cx.current = g.x;
      cz.current = CHASER_GAPS[0];
    }
  }, [status, run]);

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
    const targetX = caught ? g.x + 0.32 : g.x;
    const targetZ = caught ? 0.18 : g.chaserGap;
    const ease = Math.min(1, (caught ? 7 : 10) * dt);
    cx.current += (targetX - cx.current) * ease;
    cz.current += (targetZ - cz.current) * ease;
    root.current.position.set(cx.current, 0, cz.current);

    // turn to face the camera (and slightly toward Modi) for the grab
    const turn = caught ? -0.35 : Math.PI;
    facing.current.rotation.y += (turn - facing.current.rotation.y) * Math.min(1, 8 * dt);

    const action = grab.current;
    if (caught && !grabbed.current && action) {
      grabbed.current = true;
      action.reset().crossFadeFrom(run, 0.2, false).play();
    }
    // hold the reach pose instead of clamping on an arms-down end frame
    if (caught && action && !action.paused && action.time >= action.getClip().duration * 0.22) {
      action.paused = true;
    }
  });

  return (
    <group ref={root}>
      <group ref={facing} rotation={[0, Math.PI, 0]}>
        <primitive object={model} scale={MODEL_SCALE} />
      </group>
    </group>
  );
}

useGLTF.preload(CHASER_MODEL);
