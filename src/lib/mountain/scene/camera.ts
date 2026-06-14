import * as THREE from "three";

export function createCamera(width: number, height: number): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 200);
  return camera;
}
