import * as THREE from 'three';

const toHand = new THREE.Vector3();
const toTarget = new THREE.Vector3();
const boneWorldQ = new THREE.Quaternion();
const parentWorldQ = new THREE.Quaternion();
const delta = new THREE.Quaternion();
const handPos = new THREE.Vector3();
const bonePos = new THREE.Vector3();

/** Finds the first bone with the given Mixamo name (unsuffixed copy). */
export function findBone(root: THREE.Object3D, name: string) {
  let found: THREE.Bone | null = null;
  root.traverse((o) => {
    if (!found && (o as THREE.Bone).isBone && o.name === name) found = o as THREE.Bone;
  });
  return found;
}

/**
 * Small CCD solver used for the caught tableau: bends upper/lower arm so the
 * hand lands on a world-space target (Modi's shoulder, or a raised panic hand).
 */
export function solveArm(
  upper: THREE.Object3D,
  lower: THREE.Object3D,
  hand: THREE.Object3D,
  target: THREE.Vector3,
  iterations = 5,
) {
  for (let i = 0; i < iterations; i++) {
    for (const bone of [lower, upper]) {
      hand.getWorldPosition(handPos);
      bone.getWorldPosition(bonePos);
      toHand.copy(handPos).sub(bonePos);
      toTarget.copy(target).sub(bonePos);
      if (toHand.lengthSq() < 1e-6 || toTarget.lengthSq() < 1e-6) continue;
      delta.setFromUnitVectors(toHand.normalize(), toTarget.normalize());
      bone.getWorldQuaternion(boneWorldQ);
      bone.parent!.getWorldQuaternion(parentWorldQ).invert();
      bone.quaternion.copy(parentWorldQ.multiply(delta).multiply(boneWorldQ));
      bone.updateWorldMatrix(false, true);
    }
  }
}
