import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_SCALE, PLAYER_MODEL } from '../constants';
import { g } from '../gameState';
import { useGame } from '../store';

/** The player: Modi, running down the track on the actual model. */
export function Player() {
  const { scene: model, animations } = useGLTF(PLAYER_MODEL);
  const root = useRef<THREE.Group>(null!);
  const lean = useRef<THREE.Group>(null!);
  const facing = useRef<THREE.Group>(null!);
  const status = useGame((s) => s.status);

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
    return () => {
      mixer.stopAllAction();
    };
  }, [model, mixer, run]);

  useFrame((_, dt) => {
    const caught = status === 'caught';
    // freeze the run cycle the moment the ACP catches him
    mixer.update(caught ? 0 : dt);

    root.current.position.set(g.x, g.y, 0);
    // blink while invulnerable after a hit
    root.current.visible = g.invuln <= 0 || Math.floor(g.invuln * 14) % 2 === 0;

    // turn around to face the camera for the caught scene
    const turn = caught ? 0 : Math.PI;
    facing.current.rotation.y += (turn - facing.current.rotation.y) * Math.min(1, 8 * dt);

    const k = Math.min(1, 12 * dt);
    const bank = caught ? 0 : THREE.MathUtils.clamp((g.targetX - g.x) * -0.15, -0.4, 0.4);
    const tilt = !caught && g.rolling ? -0.8 : 0;
    const squash = !caught && g.rolling ? 0.6 : 1;
    lean.current.rotation.z += (bank - lean.current.rotation.z) * k;
    lean.current.rotation.x += (tilt - lean.current.rotation.x) * k;
    lean.current.scale.y += (squash - lean.current.scale.y) * k;
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
