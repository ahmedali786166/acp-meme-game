import { useGLTF } from '@react-three/drei';
import { CHASER_MODEL, PLAYER_MODEL } from '../constants';
import { CameraRig } from './CameraRig';
import { Chaser } from './Chaser';
import { Coins } from './Coins';
import { GameLoop } from './GameLoop';
import { Obstacles } from './Obstacles';
import { Player } from './Player';
import { Track } from './Track';

useGLTF.preload(PLAYER_MODEL);
useGLTF.preload(CHASER_MODEL);

export function Scene() {
  return (
    <>
      <color attach="background" args={['#7ec8e3']} />
      <fog attach="fog" args={['#7ec8e3', 55, 135]} />
      <hemisphereLight args={['#dff1ff', '#3f7a3c', 0.55]} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[6, 14, 6]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-far={60}
      />
      <GameLoop />
      <CameraRig />
      <Track />
      <Obstacles />
      <Coins />
      <Player />
      <Chaser />
    </>
  );
}
