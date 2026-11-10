import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { g } from '../gameState';
import { useGame } from '../store';

/** Subway-Surfers style chase cam; pushes in slightly for the caught scene. */
export function CameraRig() {
  const status = useGame((s) => s.status);
  const z = useRef(9.5);

  useFrame(({ camera }, dt) => {
    const k = Math.min(1, 5 * dt);
    const caught = status === 'caught';
    const targetZ = caught ? 5.2 : 9.5;
    camera.position.x += ((caught ? g.x + 0.3 : g.x * 0.55) - camera.position.x) * k;
    camera.position.y += ((caught ? 2.3 : 4.6) + g.y * 0.3 - camera.position.y) * k;
    z.current += (targetZ - z.current) * k;
    camera.position.z = z.current;
    if (caught) camera.lookAt(g.x + 0.3, 1.2, 0.1);
    else camera.lookAt(g.x * 0.4, 1.5, -8);
  });

  return null;
}
