import { useFBX } from '@react-three/drei';
import { CHASER_FBX, GRAB_FBX, PLAYER_FBX } from '../constants';
import { CameraRig } from './CameraRig';
import { Chaser } from './Chaser';
import { GameLoop } from './GameLoop';
import { Obstacles } from './Obstacles';
import { Player } from './Player';
import { Track } from './Track';

useFBX.preload(PLAYER_FBX);
useFBX.preload(CHASER_FBX);
useFBX.preload(GRAB_FBX);

export function Scene() {
  return (
    <>
      <color attach="background" args={['#87ceeb']} />
      <fog attach="fog" args={['#87ceeb', 40, 110]} />
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[6, 14, 6]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <GameLoop />
      <CameraRig />
      <Track />
      <Obstacles />
      <Player />
      <Chaser />
    </>
  );
}
