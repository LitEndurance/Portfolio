import * as THREE from "three";
import type { DeviceTier } from "@/hooks/useDeviceTier";

export interface QualityProfile {
  tier: DeviceTier;
  antialias: boolean;
  pixelRatioCap: number;
  shadows: boolean;
  toneMapping: THREE.ToneMapping;
  shadowMapSize: number;
  snowCount: number;
  starCount: number;
  cloudCount: number;
  mistCount: number;
  particleSizeMultiplier: number;
  enableAurora: boolean;
  enableClimberTrail: boolean;
  enableSummitParticles: boolean;
  enableWindEffects: boolean;
  enableMarkerHoverEffects: boolean;
  /**
   * Use cheap lit materials (Lambert instead of Standard PBR) — keeps the
   * scene light-reactive (moon, shadows, traveling orb) at a fraction of the
   * per-fragment cost. Critical for CPU/software rasterizers.
   */
  cheapLighting: boolean;
  /** Max rendered frames per second; 0 = uncapped (display refresh). */
  fpsCap: number;
  /** Load the decimated LOD mountain mesh instead of the full 1.2M-tri one. */
  lowPolyMountain: boolean;
}

export function getQualityProfile(
  tier: DeviceTier,
  reducedMotion: boolean
): QualityProfile {
  const isLow = tier === "low" || reducedMotion;
  const isMedium = tier === "medium" && !reducedMotion;

  if (isLow) {
    return {
      tier: "low",
      antialias: false,
      // On a CPU rasterizer every fragment counts; start slightly below 1:1
      // and let the adaptive scaler find the floor from there.
      pixelRatioCap: 0.75,
      // Shadows stay on: the map is static and rendered exactly once, and
      // they carry most of the scene's depth. 512px is plenty at this range.
      shadows: true,
      // Reinhard keeps the moody graded look for far less than ACES.
      toneMapping: THREE.ReinhardToneMapping,
      shadowMapSize: 512,
      snowCount: 120,
      starCount: 150,
      cloudCount: 4,
      mistCount: 3,
      particleSizeMultiplier: 1.6,
      enableAurora: false,
      enableClimberTrail: false,
      enableSummitParticles: false,
      enableWindEffects: false,
      enableMarkerHoverEffects: false,
      cheapLighting: true,
      fpsCap: 30,
      lowPolyMountain: true,
    };
  }

  if (isMedium) {
    return {
      tier: "medium",
      antialias: false,
      pixelRatioCap: 1.25,
      shadows: true,
      toneMapping: THREE.ReinhardToneMapping,
      shadowMapSize: 1024,
      snowCount: 350,
      starCount: 300,
      cloudCount: 6,
      mistCount: 5,
      particleSizeMultiplier: 1.2,
      enableAurora: true,
      enableClimberTrail: true,
      enableSummitParticles: true,
      enableWindEffects: true,
      enableMarkerHoverEffects: true,
      cheapLighting: false,
      fpsCap: 0,
      // The decimated mesh (95k tris, 0.02% error) is visually
      // indistinguishable and ~12× cheaper on integrated GPUs.
      lowPolyMountain: true,
    };
  }

  return {
    tier: "high",
    antialias: true,
    pixelRatioCap: 1.5,
    shadows: true,
    toneMapping: THREE.ACESFilmicToneMapping,
    shadowMapSize: 2048,
    snowCount: 1000,
    starCount: 700,
    cloudCount: 8,
    mistCount: 8,
    particleSizeMultiplier: 1,
    enableAurora: true,
    enableClimberTrail: true,
    enableSummitParticles: true,
    enableWindEffects: true,
    enableMarkerHoverEffects: true,
    cheapLighting: false,
    fpsCap: 0,
    lowPolyMountain: false,
  };
}
