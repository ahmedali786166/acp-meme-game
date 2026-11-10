import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CHASER_MODEL, CHASER_GAPS, MODEL_SCALE } from '../constants';
import { g } from '../gameState';
import { loadGrabClip } from '../grabClip';
import { findBone, solveArm } from '../pose';
import { useGame } from '../store';

interface ArmChain {
  upper: THREE.Bone | null;
  lower: THREE.Bone | null;
  hand: THREE.Bone | null;
}

const ARRIVE_TIME = 0.95;

/** The chaser: the ACP model running behind Modi, catching him on caught. */
export function Chaser() {
  const { scene: model, animations } = useGLTF(CHASER_MODEL);
  const root = useRef<THREE.Group>(null!);
  const facing = useRef<THREE.Group>(null!);
  const status = useGame((s) => s.status);
  const cx = useRef(0);
  const cz = useRef(CHASER_GAPS[0]);
  const runFrom = useRef({ x: 0, z: CHASER_GAPS[0] });
  const started = useRef(false);
  const grabbed = useRef(false);
  const grabRequested = useRef(false);
  const arm = useRef<ArmChain>({ upper: null, lower: null, hand: null });
  const leftArm = useRef<ArmChain>({ upper: null, lower: null, hand: null });
  const reachTarget = useRef(new THREE.Vector3());
  const raisedTarget = useRef(new THREE.Vector3());

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
    arm.current = {
      upper: findBone(model, 'RightArm'),
      lower: findBone(model, 'RightForeArm'),
      hand: findBone(model, 'RightHand'),
    };
    leftArm.current = {
      upper: findBone(model, 'LeftArm'),
      lower: findBone(model, 'LeftForeArm'),
      hand: findBone(model, 'LeftHand'),
    };
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
      started.current = false;
      cx.current = g.x;
      cz.current = CHASER_GAPS[0];
      facing.current.rotation.y = Math.PI;
    }
  }, [status, run]);

  useFrame((_, dt) => {
    mixer.update(dt);
    const caught = status === 'caught';

    if (status === 'menu') {
      g.chaserGap = CHASER_GAPS[0];
      g.chaserGapTarget = CHASER_GAPS[0];
    }

    if (!caught) {
      // during play the gap tightens with every life lost
      g.chaserGap += (g.chaserGapTarget - g.chaserGap) * Math.min(1, 2.5 * dt);
      cx.current += (g.x - cx.current) * Math.min(1, 10 * dt);
      cz.current += (g.chaserGap - cz.current) * Math.min(1, 10 * dt);
      root.current.position.set(cx.current, 0, cz.current);
      facing.current.rotation.y += (Math.PI - facing.current.rotation.y) * Math.min(1, 8 * dt);
      return;
    }

    // caught: run up beside the fallen player and stop there
    if (!started.current) {
      started.current = true;
      runFrom.current = { x: cx.current, z: cz.current };
    }
    const fallDir = g.x > 0 ? -1 : 1;
    const targetX = g.x - fallDir * 0.95;
    const targetZ = 0.55;
    const t = Math.min(1, g.caughtTime / ARRIVE_TIME);
    const e = 1 - Math.pow(1 - t, 3);
    cx.current = THREE.MathUtils.lerp(runFrom.current.x, targetX, e);
    cz.current = THREE.MathUtils.lerp(runFrom.current.z, targetZ, e);
    root.current.position.set(cx.current, 0, cz.current);

    const arrived = t >= 1;

    // turn to look down at him once he stops
    const dx = g.x + fallDir * 0.55 - cx.current;
    const dz = 0.75 - cz.current;
    const yaw = arrived ? Math.atan2(dx, dz) : Math.PI;
    facing.current.rotation.y += (yaw - facing.current.rotation.y) * Math.min(1, 9 * dt);

    const action = grab.current;
    if (arrived && !grabbed.current && action) {
      grabbed.current = true;
      // jump into the overhead-grab part of the clip and hold the pose
      action.reset();
      action.time = action.getClip().duration * 0.2;
      action.crossFadeFrom(run, 0.25, false).play();
    }
    if (arrived && action && !action.paused && action.time >= action.getClip().duration * 0.28) {
      action.paused = true;
    }
    if (arrived && !action) mixer.update(0);

    // right hand reaches down toward Modi; left arm stays raised like the reference
    if (arrived) {
      const { upper, lower, hand } = arm.current;
      if (upper && lower && hand) {
        root.current.updateWorldMatrix(true, true);
        reachTarget.current.set(g.x + fallDir * 0.55, 0.35, 0.75);
        solveArm(upper, lower, hand, reachTarget.current);

        const left = leftArm.current;
        if (left.upper && left.lower && left.hand) {
          raisedTarget.current.set(g.x - fallDir * 0.25, 1.68, 0.9);
          solveArm(left.upper, left.lower, left.hand, raisedTarget.current);
        }
      }
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