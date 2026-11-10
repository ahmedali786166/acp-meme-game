import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GRAB_MODEL } from './constants';

let clip: THREE.AnimationClip | null = null;
let pending: Promise<THREE.AnimationClip | null> | null = null;

/** The grab clip only matters once the ACP catches Modi, so it loads lazily. */
export function getGrabClip() {
  return clip;
}

export function loadGrabClip() {
  if (!pending) {
    // dedicated manager: this background fetch must not reopen the loading gate
    const loader = new GLTFLoader(new THREE.LoadingManager());
    pending = loader
      .loadAsync(GRAB_MODEL)
      .then((gltf) => {
        clip = gltf.animations[0] ?? null;
        return clip;
      })
      .catch(() => null);
  }
  return pending;
}
