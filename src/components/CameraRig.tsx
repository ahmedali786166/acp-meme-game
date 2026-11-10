import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PerspectiveCamera } from 'three';
import { g } from '../gameState';
import { useGame } from '../store';

const ZOOM_TIME = 1; // dramatic push-in duration
const closePos = new THREE.Vector3();
const closeLook = new THREE.Vector3();

/** Chase cam, plus a one-second cinematic push-in on the fallen player when caught. */
export function CameraRig() {
  const status = useGame((s) => s.status);
  const baseFov = useRef(0);
  const look = useRef(new THREE.Vector3(0, 1.5, -8));
  const wasCaught = useRef(false);
  const startPos = useRef(new THREE.Vector3());
  const startLook = useRef(new THREE.Vector3());
  const startFov = useRef(65);
  const fallDir = useRef(1);

  useFrame(({ camera, gl }, dt) => {
    const persp = camera as PerspectiveCamera;
    if (!baseFov.current) baseFov.current = persp.fov;

    const caught = status === 'caught';

    if (caught && !wasCaught.current) {
      wasCaught.current = true;
      startPos.current.copy(camera.position);
      startLook.current.copy(look.current);
      startFov.current = persp.fov;
      fallDir.current = g.x > 0 ? -1 : 1;
    } else if (!caught && wasCaught.current) {
      wasCaught.current = false;
    }

    if (caught) {
      const t = Math.min(1, g.caughtTime / ZOOM_TIME);
      const e = t * t * (3 - 2 * t); // easeInOut
      const dir = fallDir.current;
      // slow drift after the zoom lands, keeping the shot alive
      const drift = THREE.MathUtils.clamp((g.caughtTime - ZOOM_TIME) / 2.5, 0, 1);

      closePos.set(
        g.x + dir * (1.35 - 0.1 * drift),
        1.85 - 0.1 * drift,
        4.0 - 0.3 * drift,
      );
      closeLook.set(g.x + dir * 0.45, 0.6, 0.55);

      camera.position.lerpVectors(startPos.current, closePos, e);
      look.current.lerpVectors(startLook.current, closeLook, e);
      camera.lookAt(look.current);

      const targetFov = THREE.MathUtils.lerp(startFov.current, 55, e);
      if (Math.abs(persp.fov - targetFov) > 0.01) {
        persp.fov = targetFov;
        persp.updateProjectionMatrix();
      }
    } else {
      const k = Math.min(1, 5 * dt);
      camera.position.x += (g.x * 0.55 - camera.position.x) * k;
      camera.position.y += (4.6 + g.y * 0.3 - camera.position.y) * k;
      camera.position.z += (9.5 - camera.position.z) * k;

      look.current.x += (g.x * 0.4 - look.current.x) * k;
      look.current.y += (1.5 - look.current.y) * k;
      look.current.z += (-8 - look.current.z) * k;
      camera.lookAt(look.current);

      if (Math.abs(persp.fov - baseFov.current) > 0.01) {
        persp.fov += (baseFov.current - persp.fov) * k;
        persp.updateProjectionMatrix();
      }
    }

    if (import.meta.env.DEV) {
      const dev = window as unknown as Record<string, unknown>;
      dev.__cam = camera;
      dev.__gl = gl;
    }
  });

  return null;
}
