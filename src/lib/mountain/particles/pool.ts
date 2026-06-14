import * as THREE from "three";
import type { Disposable } from "@/lib/mountain/types";
import type { QualityProfile } from "@/lib/mountain/quality";

export interface BurstOptions {
  position: THREE.Vector3;
  color: THREE.ColorRepresentation;
  count: number;
  lifetime?: number;
}

const VERTEX_SHADER = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aLife;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;

    // aLife is normalized [0,1] over the particle's total lifetime.
    float fadeIn = smoothstep(0.0, 0.15, aLife);
    float fadeOut = smoothstep(1.0, 0.45, aLife);
    vAlpha = fadeIn * fadeOut;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float attenuation = 250.0 / -mvPosition.z;
    gl_PointSize = max(1.0, aSize * attenuation);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uTexture;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    float alpha = smoothstep(0.5, 0.22, dist);
    vec4 tex = texture2D(uTexture, gl_PointCoord);
    gl_FragColor = vec4(vColor, vAlpha * alpha * tex.a);
    if (gl_FragColor.a < 0.01) discard;
  }
`;

function createBurstTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create 2D canvas context for burst texture");
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
  gradient.addColorStop(0.35, "rgba(255,255,255,0.5)");
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

/**
 * Pre-allocated pool of transient burst particles (summit celebrations,
 * checkpoint sparks, etc). Particles are updated on the CPU but the pool
 * only iterates over currently active particles each frame.
 */
export class TransientParticlePool implements Disposable {
  private capacity: number;
  private profile: QualityProfile;
  private scene: THREE.Scene;
  private points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private texture: THREE.CanvasTexture;

  private positions: Float32Array;
  private velocities: Float32Array;
  private lives: Float32Array; // normalized remaining life, 0 = dead
  private maxLives: Float32Array; // total lifetime in seconds
  private colors: Float32Array;
  private sizes: Float32Array;

  private activeIndices: number[] = [];
  private nextSpawn = 0;

  constructor(capacity: number, scene: THREE.Scene, profile: QualityProfile) {
    this.capacity = Math.max(0, Math.floor(capacity));
    this.profile = profile;
    this.scene = scene;

    const count = this.capacity;

    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.lives = new Float32Array(count);
    this.maxLives = new Float32Array(count);
    this.colors = new Float32Array(count * 3);
    this.sizes = new Float32Array(count);

    // Hide all particles initially by placing them under the world.
    for (let i = 0; i < count; i++) {
      this.positions[i * 3 + 1] = -9999;
      this.lives[i] = 0;
      this.maxLives[i] = 0;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3)
    );
    this.geometry.setAttribute(
      "aColor",
      new THREE.BufferAttribute(this.colors, 3)
    );
    this.geometry.setAttribute(
      "aSize",
      new THREE.BufferAttribute(this.sizes, 1)
    );
    this.geometry.setAttribute(
      "aLife",
      new THREE.BufferAttribute(this.lives, 1)
    );

    this.texture = createBurstTexture();
    this.material = new THREE.ShaderMaterial({
      uniforms: { uTexture: { value: this.texture } },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  burst(options: BurstOptions): void {
    if (this.profile.tier === "low" || !this.profile.enableSummitParticles) {
      return;
    }

    const color = new THREE.Color(options.color);
    const baseLifetime = options.lifetime ?? 1.5;
    const requested = Math.max(0, Math.floor(options.count));
    // Medium quality caps burst density to protect frame time.
    const count =
      this.profile.tier === "medium" ? Math.min(requested, 24) : requested;

    let spawned = 0;
    let scan = 0;
    const maxScan = Math.min(count * 3, this.capacity);

    while (spawned < count && scan < maxScan) {
      const idx = this.nextSpawn;
      this.nextSpawn = (this.nextSpawn + 1) % this.capacity;
      scan++;

      if (this.lives[idx] > 0) continue;

      const seed = idx * 0.437 + spawned * 0.913;
      const theta = hash(seed) * Math.PI * 2;
      const phi = hash(seed + 1) * Math.PI;
      const speed = 0.02 + hash(seed + 2) * 0.06;

      const vx = Math.sin(phi) * Math.cos(theta) * speed;
      const vy = Math.cos(phi) * speed + 0.02;
      const vz = Math.sin(phi) * Math.sin(theta) * speed;

      const ix = idx * 3;
      this.positions[ix] = options.position.x;
      this.positions[ix + 1] = options.position.y;
      this.positions[ix + 2] = options.position.z;

      this.velocities[ix] = vx;
      this.velocities[ix + 1] = vy;
      this.velocities[ix + 2] = vz;

      this.colors[ix] = color.r;
      this.colors[ix + 1] = color.g;
      this.colors[ix + 2] = color.b;

      this.sizes[idx] =
        (0.08 + hash(seed + 3) * 0.1) * this.profile.particleSizeMultiplier;

      const totalLife = baseLifetime * (0.8 + hash(seed + 4) * 0.4);
      this.maxLives[idx] = totalLife;
      this.lives[idx] = 1;

      this.activeIndices.push(idx);
      spawned++;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.aColor.needsUpdate = true;
    this.geometry.attributes.aSize.needsUpdate = true;
    this.geometry.attributes.aLife.needsUpdate = true;
  }

  update(_time: number, dt: number): void {
    if (this.activeIndices.length === 0) return;

    const gravity = -0.6; // units / second^2
    const delta = Math.min(dt, 0.05);

    // Iterate active particles only. Dead particles are swapped out in place.
    let write = 0;
    for (let read = 0; read < this.activeIndices.length; read++) {
      const idx = this.activeIndices[read];
      const ix = idx * 3;

      this.velocities[ix + 1] += gravity * delta;

      this.positions[ix] += this.velocities[ix] * delta;
      this.positions[ix + 1] += this.velocities[ix + 1] * delta;
      this.positions[ix + 2] += this.velocities[ix + 2] * delta;

      const totalLife = this.maxLives[idx];
      if (totalLife > 0) {
        this.lives[idx] -= delta / totalLife;
      } else {
        this.lives[idx] = 0;
      }

      if (this.lives[idx] > 0) {
        this.activeIndices[write] = idx;
        write++;
      } else {
        // Hide the dead particle outside the frustum.
        this.positions[ix + 1] = -9999;
        this.lives[idx] = 0;
      }
    }

    this.activeIndices.length = write;

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.aLife.needsUpdate = true;
  }

  dispose(): void {
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
    this.activeIndices.length = 0;
  }
}
