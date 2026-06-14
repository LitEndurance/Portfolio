import * as THREE from "three";
import type { QualityProfile } from "@/lib/mountain/quality";
import type { Disposable } from "@/lib/mountain/types";

export interface SceneLights extends Disposable {
  ambient: THREE.AmbientLight;
  fill?: THREE.DirectionalLight;
  rim?: THREE.DirectionalLight;
  cameraLight: THREE.DirectionalLight;
  summitLight: THREE.PointLight;
  moonLight: THREE.DirectionalLight;
  markerLight: THREE.PointLight;
  orbGlow: THREE.PointLight;
  addTo: (scene: THREE.Scene) => void;
}

export function createLights(profile: QualityProfile): SceneLights {
  const isLow = profile.tier === "low";
  const shadowMapSize = profile.shadowMapSize;

  // Dark, moody Celeste style: low ambient, a strong directional key light
  // cast from the moon/orb, and subtle fills for readability.
  const ambient = new THREE.AmbientLight(0x303450, 1.3);

  // Warm fill from front-right to keep shadowed faces barely readable.
  // Omitted on low tier to reduce overhead.
  const fill: THREE.DirectionalLight | undefined = isLow
    ? undefined
    : new THREE.DirectionalLight(0x504060, 0.35);
  if (fill) fill.position.set(12, 6, 10);

  // Soft cyan rim from behind. Omitted on low tier to reduce overhead.
  const rim: THREE.DirectionalLight | undefined = isLow
    ? undefined
    : new THREE.DirectionalLight(0x50a0b0, 0.6);
  if (rim) rim.position.set(-6, 8, -16);

  // Subtle camera-aligned fill so the mountain remains readable from every
  // scroll-driven viewpoint without flattening the soft moonlight.
  const cameraLight = new THREE.DirectionalLight(0x8090a8, 1.6);

  const summitLight = new THREE.PointLight(0x60e0f8, 2.5, 30);
  summitLight.position.set(-2, 18, 0);

  // Bright cyan point light that travels along the ridge trail with the
  // climber. Higher intensity and range so it reads clearly against the
  // dark mountain surface and casts a vivid glow on nearby rock.
  const markerLight = new THREE.PointLight(0x5ee0e8, 0, 36);

  // Soft static moon fill so the mountain retains shape without flattening.
  const moonLight = new THREE.DirectionalLight(0x90d8ff, 2.2);
  moonLight.position.set(-24, 32, -4);
  moonLight.target.position.set(0, 2, -8);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.width = shadowMapSize;
  moonLight.shadow.mapSize.height = shadowMapSize;
  moonLight.shadow.camera.near = 1;
  moonLight.shadow.camera.far = 140;
  moonLight.shadow.camera.left = -40;
  moonLight.shadow.camera.right = 40;
  moonLight.shadow.camera.top = 40;
  moonLight.shadow.camera.bottom = -40;
  moonLight.shadow.bias = -0.0005;

  // Wide, bright glow from the traveling light so the orb leaves a vivid
  // luminous footprint on the mountain as it ascends.
  const orbGlow = new THREE.PointLight(0x90e8ff, 0, 60);
  orbGlow.position.set(0, 0, 0);

  const addTo = (scene: THREE.Scene): void => {
    scene.add(ambient);
    if (fill) scene.add(fill);
    if (rim) scene.add(rim);
    scene.add(cameraLight);
    scene.add(summitLight);
    scene.add(moonLight);
    scene.add(moonLight.target);
    scene.add(markerLight);
    scene.add(orbGlow);
  };

  const dispose = (): void => {
    // Three.js lights do not hold GPU resources (textures/materials) directly.
    // Detach from any parent to aid garbage collection.
    ambient.removeFromParent();
    fill?.removeFromParent();
    rim?.removeFromParent();
    cameraLight.removeFromParent();
    summitLight.removeFromParent();
    moonLight.removeFromParent();
    moonLight.target.removeFromParent();
    markerLight.removeFromParent();
    orbGlow.removeFromParent();
  };

  return {
    ambient,
    fill,
    rim,
    cameraLight,
    summitLight,
    moonLight,
    markerLight,
    orbGlow,
    addTo,
    dispose,
  };
}
