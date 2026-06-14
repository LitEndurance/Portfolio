import * as THREE from "three";
import type { Disposable } from "@/lib/mountain/types";
import type { QualityProfile } from "@/lib/mountain/quality";

export interface ClimberTrail extends Disposable {
  points: THREE.Points;
  push: (position: THREE.Vector3) => void;
}

const TRAIL_COLOR = new THREE.Color(0x4ecdc4);
const TRAIL_COUNT = 40;

const VERTEX_SHADER = /* glsl */ `
  attribute float aAlpha;
  attribute vec3 aColor;
  attribute float aSize;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vAlpha = aAlpha;
    vColor = aColor;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float attenuation = 300.0 / -mvPosition.z;
    gl_PointSize = max(1.0, aSize * attenuation);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    float alpha = smoothstep(0.5, 0.25, dist);
    gl_FragColor = vec4(vColor, vAlpha * alpha);
    if (gl_FragColor.a < 0.01) discard;
  }
`;

/**
 * Build a stub trail for low-end devices. It still exposes the same
 * `ClimberTrail` interface so callers don't need branching logic.
 */
function createStubTrail(): ClimberTrail {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(3);
  positions[1] = -9999;
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: TRAIL_COLOR,
    size: 0,
    transparent: true,
    opacity: 0,
  });

  const points = new THREE.Points(geometry, material);
  points.visible = false;

  return {
    points,
    push: () => {},
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}

export function createClimberTrail(profile: QualityProfile): ClimberTrail {
  if (profile.tier === "low" || !profile.enableClimberTrail) {
    return createStubTrail();
  }

  // Throttle buffer shifts: high updates every 2 pushes, medium every 3.
  const throttle = profile.tier === "high" ? 2 : 3;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(TRAIL_COUNT * 3);
  const alphas = new Float32Array(TRAIL_COUNT);
  const colors = new Float32Array(TRAIL_COUNT * 3);
  const sizes = new Float32Array(TRAIL_COUNT);

  for (let i = 0; i < TRAIL_COUNT; i++) {
    positions[i * 3 + 1] = -9999;
    // Head is brightest, tail fades out.
    alphas[i] = Math.max(0, 1 - i / (TRAIL_COUNT - 1)) * 0.55;
    colors[i * 3] = TRAIL_COLOR.r;
    colors[i * 3 + 1] = TRAIL_COLOR.g;
    colors[i * 3 + 2] = TRAIL_COLOR.b;
    sizes[i] = 0.12 * (1 - i / TRAIL_COUNT) * profile.particleSizeMultiplier;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);

  let pushCounter = 0;
  let pending = new THREE.Vector3();
  let hasPending = false;

  return {
    points,
    push(position: THREE.Vector3) {
      pushCounter++;
      pending.copy(position);
      hasPending = true;

      if (pushCounter % throttle !== 0) return;

      const pos = geometry.attributes.position.array as Float32Array;
      for (let i = TRAIL_COUNT - 1; i > 0; i--) {
        const ix = i * 3;
        const prev = (i - 1) * 3;
        pos[ix] = pos[prev];
        pos[ix + 1] = pos[prev + 1];
        pos[ix + 2] = pos[prev + 2];
      }

      pos[0] = pending.x;
      pos[1] = pending.y;
      pos[2] = pending.z;

      geometry.attributes.position.needsUpdate = true;
      hasPending = false;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
