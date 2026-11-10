import { useFrame } from '@react-three/fiber';
import { g } from '../gameState';

/** Subway-Surfers style: behind & above, slides sideways with the player, looks down the track. */
export function CameraRig() {
  useFrame(({ camera }, dt) => {
    const k = Math.min(1, 6 * dt);
    camera.position.x += (g.x * 0.6 - camera.position.x) * k;
    camera.position.y += (4.6 + g.y * 0.35 - camera.position.y) * k;
    camera.position.z = 8;
    camera.lookAt(g.x * 0.5, 1.6, -10);
  });
  return null;
}
