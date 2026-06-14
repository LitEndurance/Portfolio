import * as THREE from "three";
import type { ParticleBounds, Disposable } from "@/lib/mountain/types";
import type { QualityProfile } from "@/lib/mountain/quality";
import {
  PARTICLE_FRAGMENT_SHADER,
  PARTICLE_VERTEX_SHADER,
} from "@/lib/mountain/particles/shader";

const SNOW_COLOR_A = new THREE.Color(0xd8e8f8);
const SNOW_COLOR_B = new THREE.Color(0xb8c8e0);
const STAR_COLOR_A = new THREE.Color(0xe8f0ff);
const STAR_COLOR_B = new THREE.Color(0xb8c8e8);

export interface UnifiedParticles extends Disposable {
  points: THREE.Points;
  update: (time: number) => void;
  setBounds: (bounds: ParticleBounds) => void;
}

/**
 * Generate a soft radial particle texture that fades smoothly to transparent.
 * This is intentionally similar to the existing glow texture helper so the
 * look of stars/snow remains consistent with the rest of the scene.
 */
function createParticleTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create 2D canvas context for particle texture");
  }

  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.55)");
  gradient.addColorStop(0.75, "rgba(255,255,255,0.12)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function hash(n: number): number {
  return Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;
}

export function createUnifiedParticles(
  profile: QualityProfile,
  bounds: ParticleBounds
): UnifiedParticles {
  const snowCount = Math.max(0, profile.snowCount);
  const starCount = Math.max(0, profile.starCount);
  const totalCount = snowCount + starCount;

  const positions = new Float32Array(totalCount * 3);
  const types = new Float32Array(totalCount);
  const seeds = new Float32Array(totalCount);
  const velocities = new Float32Array(totalCount * 3);
  const phases = new Float32Array(totalCount);
  const colors = new Float32Array(totalCount * 3);
  const sizes = new Float32Array(totalCount);

  const colorTemp = new THREE.Color();

  // ── Snow distribution ────────────────────────────────────
  // Scatter snow in an elliptical volume centered on the mountain so it wraps
  // the peak and falls through the playable camera volume.
  for (let i = 0; i < snowCount; i++) {
    const seed = i * 0.713 + hash(i * 1.37) * 100;
    const angle = hash(seed) * Math.PI * 2;
    const radius = Math.sqrt(hash(seed + 1)) * 0.5 + 0.1;

    const x =
      bounds.centerX + Math.cos(angle) * radius * bounds.xRange * 0.5;
    const z =
      bounds.centerZ + Math.sin(angle) * radius * bounds.zRange * 0.5;
    const y = bounds.baseY + hash(seed + 2) * (bounds.topY - bounds.baseY);

    const ix = i * 3;
    positions[ix] = x;
    positions[ix + 1] = y;
    positions[ix + 2] = z;

    types[i] = 0;
    seeds[i] = seed;

    velocities[ix] = (hash(seed + 3) - 0.5) * 0.004;
    velocities[ix + 1] = -(hash(seed + 4) * 0.015 + 0.008);
    velocities[ix + 2] = (hash(seed + 5) - 0.5) * 0.004;

    phases[i] = hash(seed + 6) * Math.PI * 2;

    colorTemp.copy(SNOW_COLOR_A).lerp(SNOW_COLOR_B, hash(seed + 7));
    colors[ix] = colorTemp.r;
    colors[ix + 1] = colorTemp.g;
    colors[ix + 2] = colorTemp.b;

    sizes[i] = (0.06 + hash(seed + 8) * 0.07) * profile.particleSizeMultiplier;
  }

  // ── Star distribution ────────────────────────────────────
  // Place stars on a hemisphere dome above and around the mountain.
  for (let i = 0; i < starCount; i++) {
    const seed = i * 0.617 + hash(i * 2.19) * 200;
    const theta = hash(seed) * Math.PI * 2;
    // Bias toward the horizon so the sky feels like a dome, not a sphere.
    const phi = Math.acos(1 - hash(seed + 1) * 0.85);
    const r = 45 + hash(seed + 2) * 55;

    const x = bounds.centerX + r * Math.sin(phi) * Math.cos(theta);
    const y = Math.max(bounds.baseY + 5, r * Math.cos(phi) + bounds.baseY + 8);
    const z = bounds.centerZ + r * Math.sin(phi) * Math.sin(theta);

    const ix = (snowCount + i) * 3;
    positions[ix] = x;
    positions[ix + 1] = y;
    positions[ix + 2] = z;

    types[snowCount + i] = 1;
    seeds[snowCount + i] = seed;

    velocities[ix] = 0;
    velocities[ix + 1] = 0;
    velocities[ix + 2] = 0;

    phases[snowCount + i] = hash(seed + 3) * Math.PI * 2;

    colorTemp.copy(STAR_COLOR_A).lerp(STAR_COLOR_B, hash(seed + 4));
    colors[ix] = colorTemp.r;
    colors[ix + 1] = colorTemp.g;
    colors[ix + 2] = colorTemp.b;

    sizes[snowCount + i] =
      (0.05 + hash(seed + 5) * 0.12) * profile.particleSizeMultiplier;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aType", new THREE.BufferAttribute(types, 1));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute(
    "aVelocity",
    new THREE.BufferAttribute(velocities, 3)
  );
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

  const texture = createParticleTexture();

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSnowBottom: { value: bounds.baseY },
      uSnowTop: { value: bounds.topY },
      uGlobalOpacity: { value: 1 },
      uTexture: { value: texture },
    },
    vertexShader: PARTICLE_VERTEX_SHADER,
    fragmentShader: PARTICLE_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);

  return {
    points,
    update(time: number) {
      material.uniforms.uTime.value = time;
    },
    setBounds(nextBounds: ParticleBounds) {
      material.uniforms.uSnowBottom.value = nextBounds.baseY;
      material.uniforms.uSnowTop.value = nextBounds.topY;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}
