import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import { g } from '../gameState';
import { useGame } from '../store';

/** Subway-Surfers style chase cam; pushes in and tightens for the caught shot. */
export function CameraRig() {
  const status = useGame((s) => s.status);
  const z = useRef(9.5);
  const baseFov = useRef(0);

  useFrame(({ camera }, dt) => {
    const k = Math.min(1, 5 * dt);
    const caught = status === 'caught';
    const persp = camera as PerspectiveCamera;
    if (!baseFov.current) baseFov.current = persp.fov;

    const targetZ = caught ? 3.6 : 9.5;
    const targetY = caught ? 2.17 : 4.6;
    const targetX = caught ? g.x + 0.25 : g.x * 0.55;
    camera.position.x += (targetX - camera.position.x) * k;
    camera.position.y += (targetY + g.y * 0.3 - camera.position.y) * k;
    z.current += (targetZ - z.current) * k;
    camera.position.z = z.current;

    const targetFov = caught ? 62 : baseFov.current;
    if (Math.abs(persp.fov - targetFov) > 0.05) {
      persp.fov += (targetFov - persp.fov) * k;
      persp.updateProjectionMatrix();
    }

    if (caught) camera.lookAt(g.x + 0.25, 2.12, 0.4);
    else camera.lookAt(g.x * 0.4, 1.5, -8);

    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__cam = camera;
    }
  });

  return null;
}
