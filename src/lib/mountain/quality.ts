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
      pixelRatioCap: 1,
      shadows: false,
      toneMapping: THREE.NoToneMapping,
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
  };
}
