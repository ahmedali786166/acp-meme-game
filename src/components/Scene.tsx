import { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import { CHASER_MODEL, MAP_MODEL, PLAYER_MODEL } from '../constants';
import { useGame } from '../store';
import { CameraRig } from './CameraRig';
import { Chaser } from './Chaser';
import { Coins } from './Coins';
import { GameLoop } from './GameLoop';
import { Obstacles } from './Obstacles';
import { Player } from './Player';
import { SubwayShowcase } from './SubwayShowcase';
import { Track } from './Track';

useGLTF.preload(PLAYER_MODEL);
useGLTF.preload(CHASER_MODEL);

export function Scene() {
  const status = useGame((s) => s.status);

  if (status === 'menu') {
    return (
      <>
        <color attach="background" args={['#143667']} />
        <hemisphereLight args={['#e8f4ff', '#28324c', 1.4]} />
        <ambientLight intensity={1.05} />
        <directionalLight
          position={[9, 15, 11]}
          intensity={2.4}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0004}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-camera-far={50}
        />
        <directionalLight position={[-10, 7, -8]} intensity={0.9} color="#9ed4ff" />
        <Suspense fallback={null}>
          <SubwayShowcase />
        </Suspense>
      </>
    );
  }

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
