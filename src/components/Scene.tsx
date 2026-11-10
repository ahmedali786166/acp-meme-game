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
      <color attach="background" args={['#3c4b60']} />
      <fog attach="fog" args={['#6f8095', 28, 118]} />
      <hemisphereLight args={['#9db2d2', '#22252c', 0.85]} />
      <ambientLight intensity={0.32} />
      <directionalLight
        position={[-7, 16, 10]}
        intensity={1.15}
        color="#c6d6f2"
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