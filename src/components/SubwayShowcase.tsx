import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { MAP_MODEL } from '../constants';

// Longest edge of the diorama in world units, regardless of the source size.
const FIT_SIZE = 12;
// Fixed yaw so the train strip reads diagonally on portrait screens.
const YAW = 0.12;
const ELEVATION = 0.38;
const AZIMUTH = 0.55;

/** Menu diorama: the provided subway map, centred, auto-fitted and orbitable. */
export function SubwayShowcase() {
  const { scene } = useGLTF(MAP_MODEL);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const controls = useRef<OrbitControlsImpl>(null);

  const stage = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const dims = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = FIT_SIZE / Math.max(dims.x, dims.y, dims.z);
    const radius = 0.5 * Math.hypot(dims.x, dims.y, dims.z) * scale;
    return { center, dims, scale, radius, lift: (dims.y / 2) * scale };
  }, [scene]);

  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        const mat = m as THREE.MeshStandardMaterial;
        if (!mat.isMeshStandardMaterial) continue;
        // The GLB omits metallicFactor, which glTF treats as 1.0 and renders black
        // without an environment map. These are painted props, not metal.
        mat.metalness = 0;
        mat.roughness = 0.85;
        if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
        mat.needsUpdate = true;
      }
    });
  }, [scene]);

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const target = new THREE.Vector3(0, stage.lift, 0);
    const dir = new THREE.Vector3(
      Math.sin(AZIMUTH) * Math.cos(ELEVATION),
      Math.sin(ELEVATION),
      Math.cos(AZIMUTH) * Math.cos(ELEVATION)
    );

    // Sample actual vertices so the long, flat strip fills the screen instead
    // of being fitted by its mostly-empty bounding box.
    let top: THREE.Object3D = scene;
    while (top.parent) top = top.parent;
    top.updateMatrixWorld(true);
    const points: THREE.Vector3[] = [];
    const v = new THREE.Vector3();
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const pos = mesh.geometry.getAttribute('position');
      if (!pos) return;
      const step = Math.max(1, Math.floor(pos.count / 1200));
      for (let i = 0; i < pos.count; i += step) {
        points.push(v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).clone());
      }
    });

    const probe = camera.clone() as THREE.PerspectiveCamera;
    probe.aspect = aspect;
    probe.near = 0.1;
    probe.far = 1000;
    probe.updateProjectionMatrix();
    const projected = new THREE.Vector3();

    // Smallest distance that keeps every vertex in front of the camera and
    // inside 90% of the viewport; a camera inside the flat model is rejected.
    const extentAt = (distance: number) => {
      probe.position.copy(target).addScaledVector(dir, distance);
      probe.lookAt(target);
      probe.updateMatrixWorld(true);
      const e = probe.matrixWorldInverse.elements;
      let extent = 0;
      for (const point of points) {
        const depth = e[2] * point.x + e[6] * point.y + e[10] * point.z + e[14];
        if (depth > -probe.near) return Infinity;
        projected.copy(point).project(probe);
        extent = Math.max(extent, Math.abs(projected.x), Math.abs(projected.y));
      }
      return extent;
    };

    let lo = 1;
    let hi = stage.radius * 6;
    for (let i = 0; i < 22; i++) {
      const mid = (lo + hi) / 2;
      if (extentAt(mid) <= 0.9) hi = mid;
      else lo = mid;
    }
    const distance = hi;

    camera.position.copy(target).addScaledVector(dir, distance);
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__cam = camera;
    }
    if (controls.current) {
      controls.current.target.copy(target);
      controls.current.minDistance = distance * 0.45;
      controls.current.maxDistance = distance * 2.2;
      controls.current.update();
    }
  }, [camera, size, stage]);

  return (
    <>
      <group position={[0, stage.lift, 0]} rotation={[0, YAW, 0]}>
        <group scale={stage.scale}>
          <group position={[-stage.center.x, -stage.center.y, -stage.center.z]}>
            <primitive object={scene} />
          </group>
        </group>
      </group>
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan
        panSpeed={0.8}
        rotateSpeed={0.7}
        zoomSpeed={0.9}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI / 2 - 0.04}
      />
    </>
  );
}

useGLTF.preload(MAP_MODEL);
