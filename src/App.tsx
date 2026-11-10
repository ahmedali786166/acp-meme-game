import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import { preloadAudio } from './audio';
import { Controls } from './components/Controls';
import { Scene } from './components/Scene';
import { UI } from './components/UI';

export default function App() {
  useEffect(() => preloadAudio(), []);
  return (
    <>
      <Canvas
        shadows="percentage"
        dpr={[1, 1.5]}
        camera={{ fov: 65, position: [0, 4.6, 9.5], near: 0.1, far: 200 }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <Controls />
      <UI />
    </>
  );
}
