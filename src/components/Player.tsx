import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_SCALE, PLAYER_MODEL } from '../constants';
import { g } from '../gameState';
import { findBone, solveArm } from '../pose';
import { useGame } from '../store';

interface ArmChain {
  upper: THREE.Bone | null;
  lower: THREE.Bone | null;
  hand: THREE.Bone | null;
}

/** The player: Modi, running down the track on the actual model. */
export function Player() {
  const { scene: model, animations } = useGLTF(PLAYER_MODEL);
  const root = useRef<THREE.Group>(null!);
  const lean = useRef<THREE.Group>(null!);
  const facing = useRef<THREE.Group>(null!);
  const status = useGame((s) => s.status);
  const leftArm = useRef<ArmChain>({ upper: null, lower: null, hand: null });
  const rightArm = useRef<ArmChain>({ upper: null, lower: null, hand: null });
  const leftTarget = useRef(new THREE.Vector3());
  const rightTarget = useRef(new THREE.Vector3());

  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  const run = useMemo(() => mixer.clipAction(animations[0]), [mixer, animations]);

  useEffect(() => {
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.frustumCulled = false;
      }
    });
    run.play();
    leftArm.current = {
      upper: findBone(model, 'LeftArm'),
      lower: findBone(model, 'LeftForeArm'),
      hand: findBone(model, 'LeftHand'),
    };
    rightArm.current = {
      upper: findBone(model, 'RightArm'),
      lower: findBone(model, 'RightForeArm'),
      hand: findBone(model, 'RightHand'),
    };
    return () => {
      mixer.stopAllAction();
    };
  }, [model, mixer, run]);

  useFrame((_, dt) => {
    const caught = status === 'caught';
    // freeze the run cycle the moment the ACP catches him
    mixer.update(caught ? 0 : dt);

    // one-shot trip: stumble, tip sideways and settle on the asphalt
    const fallDir = g.x > 0 ? -1 : 1;
    const fallT = caught ? THREE.MathUtils.clamp((g.caughtTime - 0.1) / 0.85, 0, 1) : 0;
    const tip = fallT * fallT;

    // drop any leftover jump height as the trip plays out
    const fallY = caught ? g.y * (1 - tip) : g.y;
    root.current.position.set(g.x, fallY + tip * 0.16, 0);
    // blink while invulnerable after a hit (but always show the caught tableau)
    root.current.visible = caught || g.invuln <= 0 || Math.floor(g.invuln * 14) % 2 === 0;

    // turn to face the camera while collapsing
    const turn = caught ? 0 : Math.PI;
    facing.current.rotation.y += (turn - facing.current.rotation.y) * Math.min(1, (caught ? 14 : 8) * dt);

    const k = Math.min(1, 12 * dt);
    const bank = caught ? 0 : THREE.MathUtils.clamp((g.targetX - g.x) * -0.15, -0.4, 0.4);
    const tilt = !caught && g.rolling ? -0.8 : 0;
    const squash = !caught && g.rolling ? 0.6 : 1;
    const settle =
      caught && fallT >= 1
        ? Math.sin((g.caughtTime - 0.95) * 14) * Math.exp(-(g.caughtTime - 0.95) * 7) * 0.05
        : 0;
    const fallZ = caught ? -fallDir * (Math.PI / 2 - 0.06) * tip + settle : 0;
    lean.current.rotation.z += (fallZ - lean.current.rotation.z) * Math.min(1, 18 * dt);
    lean.current.rotation.x += (tilt - lean.current.rotation.x) * k;
    lean.current.scale.y += (squash - lean.current.scale.y) * k;

    // arms fly out and land beside him
    if (caught) {
      root.current.updateWorldMatrix(true, true);
      leftTarget.current.set(g.x - fallDir * 0.85, 1.15 - tip * 0.95, 0.55);
      rightTarget.current.set(g.x + fallDir * 0.25, 0.95 - tip * 0.78, 1.15);

      const left = leftArm.current;
      if (left.upper && left.lower && left.hand) {
        solveArm(left.upper, left.lower, left.hand, leftTarget.current);
      }
      const right = rightArm.current;
      if (right.upper && right.lower && right.hand) {
        solveArm(right.upper, right.lower, right.hand, rightTarget.current);
      }
    }
  });

  return (
    <group ref={root}>
      <group ref={lean}>
        <group ref={facing} rotation={[0, Math.PI, 0]}>
          <primitive object={model} scale={MODEL_SCALE} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(PLAYER_MODEL);