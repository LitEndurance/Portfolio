import * as THREE from "three";
import type { QualityProfile } from "@/lib/mountain/quality";

const SKY_BOTTOM = 0x402860;

export function createRenderer(profile: QualityProfile): THREE.WebGLRenderer {
  const powerPreference =
    profile.tier === "low" ? "low-power" : "high-performance";

  const renderer = new THREE.WebGLRenderer({
    antialias: profile.antialias,
    alpha: false,
    stencil: false,
    depth: true,
    powerPreference,
    // Medium precision halves shader register pressure on CPU rasterizers;
    // scene coordinates stay well within its range.
    precision: profile.cheapLighting ? "mediump" : "highp",
  });

  renderer.setPixelRatio(
    Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, profile.pixelRatioCap)
  );
  renderer.setClearColor(SKY_BOTTOM, 1);
  renderer.toneMapping = profile.toneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = profile.shadows;
  renderer.shadowMap.type = profile.shadows
    ? THREE.PCFSoftShadowMap
    : THREE.BasicShadowMap;

  // The shadow-casting moon light and the mountain never move, so the shadow
  // map only needs to be rendered once instead of every frame. Mountain3D
  // flips needsUpdate again after the geometry finishes loading.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  return renderer;
}
