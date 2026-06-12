"use client";

import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import * as THREE from "three";
// Mountain loaded from pre-processed binary (see scripts/process-mountain.cjs)
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { soundEngine } from "@/lib/soundEngine";
import { useClimb, type Zone } from "@/components/ClimbContext";
import { ZONES, progressToZone, zoneTrailT } from "@/components/zoneConfig";

gsap.registerPlugin(ScrollTrigger);

const SKY_TOP = 0x101440;
const SKY_MID = 0x201860;
const SKY_BOTTOM = 0x402860;

function createSkyGradient(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, `#${new THREE.Color(SKY_TOP).getHexString()}`);
  grad.addColorStop(0.45, `#${new THREE.Color(SKY_MID).getHexString()}`);
  grad.addColorStop(1, `#${new THREE.Color(SKY_BOTTOM).getHexString()}`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ─── Celeste Color Palette ──────────────────────────────
// Darker, moodier take on the mountain: deep blue-purple shadows,
// muted teal rock, and soft icy snow so the orb/moonlight becomes
// the main color source rather than the rock itself.

const rockShadow = new THREE.Color(0x141328);   // near-black violet crevices
const rockDark = new THREE.Color(0x1f2850);     // deep indigo shadow rock
const rockMid = new THREE.Color(0x284a68);      // muted teal-blue mid rock
const rockLight = new THREE.Color(0x356878);    // subdued cyan rock
const rockHighlight = new THREE.Color(0x4a90a0);// soft aqua edges

const snowBase = new THREE.Color(0x5a80a0);     // muted blue-lavender snow shadow
const snowBright = new THREE.Color(0x90b8d8);   // soft icy snow
const snowPure = new THREE.Color(0xc8e0f0);     // pale glowing white

const warmRock = new THREE.Color(0x503858);     // muted purple-brown accent
const coolTeal = new THREE.Color(0x208888);     // deep teal accent
const lavenderShadow = new THREE.Color(0x301840);// deep purple shadow tint
const deepPurpleShadow = new THREE.Color(0x080518);

function getBaseColor(heightNorm: number): THREE.Color {
  let color: THREE.Color;
  if (heightNorm > 0.88) {
    const t = (heightNorm - 0.88) / 0.12;
    color = snowBright.clone().lerp(snowPure, Math.min(1, t));
  } else if (heightNorm > 0.72) {
    const t = (heightNorm - 0.72) / 0.16;
    color = snowBase.clone().lerp(snowBright, t);
  } else if (heightNorm > 0.55) {
    const t = (heightNorm - 0.55) / 0.17;
    color = rockLight.clone().lerp(snowBase, t);
  } else if (heightNorm > 0.38) {
    const t = (heightNorm - 0.38) / 0.17;
    color = rockMid.clone().lerp(rockLight, t);
  } else if (heightNorm > 0.15) {
    const t = (heightNorm - 0.15) / 0.23;
    color = rockDark.clone().lerp(rockMid, t);
  } else {
    color = rockShadow.clone().lerp(rockDark, heightNorm / 0.15);
  }
  return color;
}

// ─── Apply Celeste-style vertex colors ──────────────────
// Height + normal-driven palette with restrained positional variation.
// Kept dark so the scene lighting (especially the orb/moon) provides
// the dominant color and contrast.

function applyCelesteColors(geometry: THREE.BufferGeometry): void {
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox!;
  const minY = bbox.min.y;
  const maxY = bbox.max.y;
  const heightRange = maxY - minY || 1;

  geometry.computeVertexNormals();
  const positions = geometry.attributes.position.array as Float32Array;
  const normals = geometry.attributes.normal.array as Float32Array;
  const colors: number[] = [];

  // Backlight from upper-left-behind (matches the video's rim-lit peaks)
  const lightDir = new THREE.Vector3(-0.4, 0.85, -0.35).normalize();
  const cyanTint = new THREE.Color(0x20a8c0);
  const tealTint = new THREE.Color(0x3890a0);
  const snowGlow = new THREE.Color(0x60c8e8);
  const snowLavender = new THREE.Color(0x8090d0);
  const rockRim = new THREE.Color(0x6078a8);

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    const heightNorm = Math.min(1, Math.max(0, (y - minY) / heightRange));
    const color = getBaseColor(heightNorm);

    const nx = normals[i];
    const ny = normals[i + 1];
    const nz = normals[i + 2];

    // Dot product with light direction
    const dot = nx * lightDir.x + ny * lightDir.y + nz * lightDir.z;

    // ── Sculpted detail: subtle strata / snow bands ──────────
    const bandNoise = Math.sin(heightNorm * 14.0 + x * 0.35 + z * 0.25) * 0.5 + 0.5;
    const fineNoise = Math.sin(x * 1.2 + y * 2.4 + z * 0.9) * 0.5 + 0.5;

    // ── Azimuth tint: muted warm on one side, cool on the other
    const azimuth = Math.atan2(z, x);
    const warmStrength = (Math.sin(azimuth + 1.0) * 0.5 + 0.5) * 0.08;
    color.lerp(warmRock, warmStrength);

    // ── Strata bands affect mid-elevation rock ───────────────
    if (heightNorm < 0.72) {
      color.lerp(rockShadow, bandNoise * 0.05);
      color.lerp(coolTeal, fineNoise * 0.03);
    }

    // ── Slope-aware snow: steeper = more rock, flatter = more snow
    const slopeSnowBias = Math.max(0, (ny - 0.35) * 0.35);
    if (heightNorm > 0.65 && heightNorm < 0.92) {
      color.lerp(snowBright, slopeSnowBias * 0.25);
    }

    // ── Lit faces: soft cyan moonlight, snow picks up lavender hint
    if (dot > 0.05) {
      const strength = dot * 0.40;
      if (heightNorm > 0.75) {
        color.lerp(snowGlow, strength * 1.0);
        color.lerp(snowLavender, strength * 0.25);
      } else {
        color.lerp(tealTint, strength * 0.55);
        color.lerp(cyanTint, strength * 0.25);
      }
    }

    // ── Shadowed faces: deep purple-indigo with warm lavender bounce
    if (dot < -0.08) {
      const shadowStrength = Math.abs(dot) * 0.50;
      color.lerp(deepPurpleShadow, shadowStrength);
      color.lerp(lavenderShadow, shadowStrength * 0.35);
    }

    // ── Rim light on upward edges facing the light
    if (ny > 0.45 && dot > 0.18 && heightNorm < 0.82) {
      color.lerp(rockRim, 0.14 + bandNoise * 0.06);
    }

    // ── Snow flat surfaces catch extra light
    if (ny > 0.70 && heightNorm > 0.68) {
      color.lerp(snowGlow, 0.14 + fineNoise * 0.06);
    }

    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
}

// ─── Load pre-processed mountain binary ─────────────────

interface MountainData {
  geometry: THREE.BufferGeometry;
  pathPoints: THREE.Vector3[];
  highestX: number;
  highestY: number;
  highestZ: number;
}

export interface MountainHandle {
  triggerReaction: (type: string, payload?: unknown) => void;
}

function parseMountainBinary(data: ArrayBuffer): MountainData {
  const view = new DataView(data);
  let pos = 0;

  // Magic "MTN\0"
  const magic = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );
  if (magic !== "MTN\0") throw new Error("Invalid mountain binary format");
  pos += 4;

  const vertexCount = view.getUint32(pos, true);
  pos += 4;
  const pathCount = view.getUint32(pos, true);
  pos += 4;
  pos += 4; // version / padding

  const positions = new Float32Array(data, pos, vertexCount * 3);
  pos += vertexCount * 3 * 4;

  const pathPoints: THREE.Vector3[] = [];
  for (let i = 0; i < pathCount; i++) {
    const x = view.getFloat32(pos, true);
    const y = view.getFloat32(pos + 4, true);
    const z = view.getFloat32(pos + 8, true);
    if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)) {
      pathPoints.push(new THREE.Vector3(x, y, z));
    }
    pos += 12;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  // Compute highest point from vertices
  let highestY = -Infinity;
  let highestX = 0;
  let highestZ = 0;
  for (let i = 0; i < positions.length; i += 3) {
    const y = positions[i + 1];
    if (y > highestY) {
      highestY = y;
      highestX = positions[i];
      highestZ = positions[i + 2];
    }
  }

  return { geometry, pathPoints, highestX, highestY, highestZ };
}

async function decompressGzip(arrayBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  const ds = new DecompressionStream("gzip");
  const source = new Response(new Blob([arrayBuffer])).body!;
  const reader = source.pipeThrough(ds).getReader();

  const chunks: Uint8Array[] = [];
  let totalLen = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLen += value.length;
  }

  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result.buffer;
}

function isGzipData(buffer: ArrayBuffer): boolean {
  const view = new Uint8Array(buffer);
  return view.length >= 2 && view[0] === 0x1f && view[1] === 0x8b;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function loadMountainBinary(): Promise<MountainData> {
  // Try compressed version first
  let data: ArrayBuffer;
  try {
    const response = await withTimeout(
      fetch("/mountain.bin.gz"),
      15000,
      "Mountain binary fetch"
    );
    if (!response.ok) throw new Error("gz fetch failed");
    data = await response.arrayBuffer();

    // Some servers auto-decompress .gz files — check magic bytes
    if (isGzipData(data) && typeof DecompressionStream !== "undefined") {
      data = await decompressGzip(data);
    }
  } catch {
    // Fallback to uncompressed binary
    const response = await fetch("/mountain.bin");
    if (!response.ok) throw new Error("Failed to fetch mountain binary");
    data = await response.arrayBuffer();
  }

  return parseMountainBinary(data);
}

// ─── Background Mountains ───────────────────────────────
// Creates a silhouetted mountain ridge segment. Multiple segments
// are placed in a 360° ring around the main mountain so the camera
// is fully enclosed by background peaks no matter how it rotates.

function createBackgroundMountainSegment(seed: number): THREE.BufferGeometry {
  // Tall vertical segment that fills the frame even when the camera looks upward
  const geometry = new THREE.PlaneGeometry(90, 220, 40, 110);
  const positions = geometry.attributes.position.array as Float32Array;
  const colors: number[] = [];

  // Different peak arrangements for each segment so the ring isn't repetitive
  const peakSets = [
    [
      { x: -28, z: -12, height: 10, spread: 16 },
      { x: 26, z: -8, height: 12, spread: 18 },
      { x: -12, z: -24, height: 14, spread: 20 },
      { x: 16, z: -20, height: 9, spread: 15 },
      { x: -5, z: -30, height: 11, spread: 18 },
    ],
    [
      { x: -22, z: -18, height: 13, spread: 19 },
      { x: 18, z: -10, height: 10, spread: 16 },
      { x: 0, z: -26, height: 15, spread: 21 },
      { x: -32, z: -4, height: 8, spread: 14 },
      { x: 28, z: -22, height: 11, spread: 17 },
    ],
    [
      { x: -18, z: -8, height: 11, spread: 17 },
      { x: 22, z: -16, height: 13, spread: 19 },
      { x: -8, z: -28, height: 9, spread: 15 },
      { x: 10, z: -22, height: 12, spread: 18 },
      { x: -30, z: -20, height: 10, spread: 16 },
    ],
    [
      { x: -14, z: -14, height: 12, spread: 18 },
      { x: 24, z: -6, height: 9, spread: 14 },
      { x: 4, z: -30, height: 14, spread: 20 },
      { x: -26, z: -10, height: 11, spread: 17 },
      { x: 18, z: -26, height: 10, spread: 16 },
    ],
  ];
  const peaks = peakSets[seed % peakSets.length];

  // Dark silhouettes against the night sky
  const bgBase = new THREE.Color(0x050514);
  const bgMid = new THREE.Color(0x080822);
  const bgTop = new THREE.Color(0x0c0c32);

  function noise(x: number, z: number, seedOffset: number = 0): number {
    const sin = Math.sin;
    const cos = Math.cos;
    const s = seed + seedOffset;
    return (
      sin(x * 0.5 + s) * cos(z * 0.4 + s * 2) * 0.5 +
      sin(x * 1.1 + z * 0.8 + s * 3) * 0.25 +
      cos(x * 2.3 - z * 1.5 + s * 5) * 0.125 +
      sin(x * 4.1 + z * 3.1 + s * 7) * 0.06
    );
  }

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 1];
    let y = -8;

    for (const peak of peaks) {
      const dx = x - peak.x;
      const dz = z - peak.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const influence = Math.pow(Math.max(0, 1 - dist / peak.spread), 2);
      y += peak.height * influence;
    }

    y += noise(x, z, 10) * 0.4;
    y = Math.max(y, -8);

    // Keep segments as tall vertical walls so they fill the frame from every angle
    positions[i + 2] = y;

    const heightNorm = (y + 8) / 16;
    const color = bgBase.clone().lerp(bgMid, heightNorm * 0.6).lerp(bgTop, Math.max(0, heightNorm - 0.5) * 0.4);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function createBackgroundMountainRing(): THREE.Group {
  const group = new THREE.Group();
  const segmentCount = 8;
  const radius = 60;

  const bgMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0,
    flatShading: true,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < segmentCount; i++) {
    const angle = (i / segmentCount) * Math.PI * 2;
    const geometry = createBackgroundMountainSegment(i);
    const mesh = new THREE.Mesh(geometry, bgMat);

    // Position around a circle, facing inward toward the main mountain
    mesh.position.set(Math.sin(angle) * radius, -3, Math.cos(angle) * radius);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = -angle + Math.PI;

    group.add(mesh);
  }

  return group;
}

// ─── Aurora ─────────────────────────────────────────────

function createAurora(): THREE.Group {
  const group = new THREE.Group();
  const colors = [0x40ffaa, 0x40e0ff, 0x8060ff];

  for (let i = 0; i < 6; i++) {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    const color = new THREE.Color(colors[i % colors.length]);
    const r = Math.floor(color.r * 255);
    const g = Math.floor(color.g * 255);
    const b = Math.floor(color.b * 255);

    const grad = ctx.createLinearGradient(32, 0, 32, 256);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.25, `rgba(${r}, ${g}, ${b}, 0.06)`);
    grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.14)`);
    grad.addColorStop(0.75, `rgba(${r}, ${g}, ${b}, 0.06)`);
    grad.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 256);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const geo = new THREE.PlaneGeometry(10, 36);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(-22 + i * 8, 16, -45);
    mesh.rotation.y = -0.2 + i * 0.15;
    mesh.rotation.z = 0.05 + i * 0.03;
    (mesh as any).phase = i * 1.2;
    (mesh as any).baseX = mesh.position.x;
    (mesh as any).baseZ = mesh.position.z;
    group.add(mesh);
  }

  return group;
}

// ─── Snow ───────────────────────────────────────────────
// Slow 3D snow that falls through the mountain environment. Particles are
// reset to the top of the volume when they drift below the base, so the
// snowfall is continuous and feels part of the world.

function createSnow(count: number): THREE.Points {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const basePositions = new Float32Array(count * 3);
  const velocities: number[] = [];
  const phases: number[] = [];

  // Placeholder volume; repositionSnowInEnvironment will set the real
  // bounds once the mountain binary has loaded.
  const xRange = 60;
  const yRange = 40;
  const zRange = 60;

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * xRange;
    const y = (Math.random() - 0.5) * yRange;
    const z = (Math.random() - 0.5) * zRange;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    basePositions[i * 3] = x;
    basePositions[i * 3 + 1] = y;
    basePositions[i * 3 + 2] = z;

    velocities.push(
      (Math.random() - 0.5) * 0.002,
      -(Math.random() * 0.015 + 0.01), // slow, gentle fall
      (Math.random() - 0.5) * 0.002
    );
    phases.push(Math.random() * Math.PI * 2);
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xd8e8f8,
    size: 0.1,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  (points as any).velocities = velocities;
  (points as any).basePositions = basePositions;
  (points as any).phases = phases;
  return points;
}

function repositionSnowInEnvironment(
  snow: THREE.Points,
  count: number,
  highestX: number,
  summitY: number,
  highestZ: number,
  baseY: number
) {
  const positions = snow.geometry.attributes.position.array as Float32Array;
  const basePositions = (snow as any).basePositions as Float32Array;

  const topY = summitY + 10;
  const heightRange = Math.max(1, topY - baseY);
  const xRange = 60;
  const zRange = 60;

  for (let i = 0; i < count; i++) {
    const x = highestX + (Math.random() - 0.5) * xRange;
    const y = baseY + Math.random() * heightRange;
    const z = highestZ + (Math.random() - 0.5) * zRange;

    const ix = i * 3;
    positions[ix] = x;
    positions[ix + 1] = y;
    positions[ix + 2] = z;

    basePositions[ix] = x;
    basePositions[ix + 1] = y;
    basePositions[ix + 2] = z;
  }

  (snow as any).topY = topY;
  (snow as any).baseY = baseY;
  (snow as any).xRange = xRange;
  (snow as any).zRange = zRange;
  (snow as any).spawnX = highestX;
  (snow as any).spawnZ = highestZ;
  snow.geometry.attributes.position.needsUpdate = true;
}

// ─── Stars ──────────────────────────────────────────────

function createStars(count: number): THREE.Points {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.55;
    const r = 50 + Math.random() * 50;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi) + 10;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xd0d8f0,
    size: 0.1,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  return new THREE.Points(geo, mat);
}

// ─── Clouds ─────────────────────────────────────────────
// Celeste-style: soft, rounded, lavender-blue cloud clusters
// drifting slowly across the night sky.

function createCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Stylized cloud cluster: overlapping soft periwinkle-pink blobs
  const blobs = [
    { x: 180, y: 130, r: 80, a: 0.32 },
    { x: 260, y: 120, r: 95, a: 0.35 },
    { x: 330, y: 135, r: 75, a: 0.30 },
    { x: 120, y: 145, r: 55, a: 0.26 },
    { x: 380, y: 150, r: 60, a: 0.24 },
    { x: 220, y: 90, r: 50, a: 0.20 },
    { x: 300, y: 85, r: 55, a: 0.22 },
  ];

  for (const blob of blobs) {
    const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
    grad.addColorStop(0, `rgba(200, 210, 255, ${blob.a})`);
    grad.addColorStop(0.5, `rgba(170, 160, 220, ${blob.a * 0.55})`);
    grad.addColorStop(1, "rgba(140, 120, 190, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createClouds(): THREE.Group {
  const group = new THREE.Group();
  const texture = createCloudTexture();

  const cloudData = [
    { x: -28, y: 12, z: -18, scale: 22, speed: 0.5, parallax: 0.25 },
    { x: 12, y: 16, z: -24, scale: 26, speed: 0.4, parallax: 0.2 },
    { x: -10, y: 9, z: -10, scale: 18, speed: 0.6, parallax: 0.35 },
    { x: 26, y: 11, z: -16, scale: 20, speed: 0.45, parallax: 0.3 },
    { x: -20, y: 18, z: -28, scale: 28, speed: 0.35, parallax: 0.15 },
    { x: 34, y: 8, z: -8, scale: 16, speed: 0.7, parallax: 0.4 },
    { x: -36, y: 14, z: -22, scale: 24, speed: 0.4, parallax: 0.2 },
    { x: 4, y: 7, z: -4, scale: 14, speed: 0.8, parallax: 0.45 },
  ];

  for (const data of cloudData) {
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(data.scale, data.scale * 0.45, 1);
    sprite.position.set(data.x, data.y, data.z);
    (sprite as any).speed = data.speed;
    (sprite as any).startX = data.x;
    (sprite as any).parallax = data.parallax;
    group.add(sprite);
  }

  return group;
}

// ─── Mountain Mist ──────────────────────────────────────
// Soft sprite-based fog pooled around the mountain base so it
// reads as atmospheric depth rather than scattered particles.

function createMountainMist(): THREE.Group {
  const group = new THREE.Group();
  const mistData = [
    { x: 0, z: -9, scale: 28 },
    { x: -8, z: -7, scale: 24 },
    { x: 8, z: -11, scale: 26 },
    { x: -14, z: -12, scale: 22 },
    { x: 14, z: -6, scale: 23 },
    { x: -4, z: -16, scale: 20 },
    { x: 4, z: -4, scale: 18 },
    { x: -18, z: -9, scale: 20 },
  ];

  for (const data of mistData) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "rgba(220, 160, 200, 0.12)");
    grad.addColorStop(0.35, "rgba(160, 120, 180, 0.06)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(data.scale, data.scale * 0.35, 1);
    sprite.position.set(data.x, -7.3, data.z);
    (sprite as any).phase = Math.random() * Math.PI * 2;
    (sprite as any).baseX = data.x;
    (sprite as any).baseZ = data.z;
    group.add(sprite);
  }

  return group;
}

// ─── Atmospheric Glow ───────────────────────────────────

function createAtmosphericGlow(): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(120, 80, 180, 0.14)");
  gradient.addColorStop(0.4, "rgba(70, 60, 140, 0.06)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(40, 40, 1);
  sprite.position.set(0, 6, -8);
  return sprite;
}

// ─── Base Terrain ───────────────────────────────────────
// A rolling foreground that rises up to meet the mountain so the
// peak feels anchored to the world rather than floating in space.

function createBaseTerrain(): THREE.Mesh {
  const size = 90;
  const segments = 110;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  const positions = geometry.attributes.position.array as Float32Array;
  const colors: number[] = [];

  const mountainRadius = 9.0;
  const outerRadius = 38;
  const edgeHeight = -12.0;
  const baseHeight = -10.55;
  const centerHeight = -10.55;
  const noiseHeightScale = 0.15;
  const fogColor = new THREE.Color(0x201850);

  function terrainNoise(x: number, z: number): number {
    return (
      Math.sin(x * 0.22 + z * 0.18) * Math.cos(x * 0.14 - z * 0.24) * 0.4 +
      Math.sin(x * 0.55 + z * 0.42) * 0.18 +
      Math.cos(x * 1.05 - z * 0.8) * 0.08
    );
  }

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 1];
    const dist = Math.sqrt(x * x + z * z);

    // Smooth ramp from the mountain base out to the distant floor
    let t = (dist - mountainRadius) / (outerRadius - mountainRadius);
    t = Math.max(0, Math.min(1, t));
    t = t * t * (3 - 2 * t); // smoothstep

    let y = baseHeight + (edgeHeight - baseHeight) * t;

    // Add gentle rolling hills (subtle height so the base stays flush)
    y += terrainNoise(x, z) * noiseHeightScale;

    // Flatten the very center so it butts cleanly against the mountain mesh
    if (dist < mountainRadius + 2.5) {
      const blend = Math.max(0, (dist - mountainRadius) / 2.5);
      y = THREE.MathUtils.lerp(centerHeight, y, blend);
    }

    // Fade the square plane edges into the fog color
    const edgeFade = Math.min(1, Math.max(0, (dist - outerRadius) / 8));

    positions[i + 2] = y;

    // Color: rocky shadows at the floor, lighter rock near the mountain
    const heightNorm = Math.max(0, Math.min(1, (y - edgeHeight) / (baseHeight - edgeHeight + 1)));
    const distNorm = Math.max(0, Math.min(1, (dist - mountainRadius) / (outerRadius - mountainRadius)));

    let color: THREE.Color;
    if (heightNorm > 0.6) {
      color = rockDark.clone().lerp(rockMid, (heightNorm - 0.6) / 0.4);
    } else {
      color = rockShadow.clone().lerp(rockDark, heightNorm / 0.6);
    }

    // Subtle noise tint
    color.lerp(rockMid, terrainNoise(x, z) * 0.18);

    // Atmospheric perspective and edge fade
    color.lerp(fogColor, distNorm * 0.4 + edgeFade * 0.35);

    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.02,
    flatShading: false,
    side: THREE.FrontSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.2;
  return mesh;
}

// ─── Trail Marker Textures ──────────────────────────────

function createMarkerTexture(icon: string, label: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 112;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Glass banner background
  ctx.fillStyle = "rgba(13, 17, 23, 0.78)";
  roundRect(ctx, 6, 6, 244, 100, 12);
  ctx.fill();

  // Cyan border
  ctx.strokeStyle = "rgba(78, 205, 196, 0.65)";
  ctx.lineWidth = 2;
  roundRect(ctx, 6, 6, 244, 100, 12);
  ctx.stroke();

  // Icon
  ctx.font = "34px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#e8f8ff";
  ctx.fillText(icon, 22, 56);

  // Label
  ctx.font = "600 22px ui-monospace, monospace";
  ctx.fillStyle = "#4ecdc4";
  ctx.fillText(label, 74, 56);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

// Glowing portal ring that always faces the camera so the hoop is visible
// from every scroll-driven viewpoint.
function createPortalRingTexture(color: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  // Outer soft glow
  const glow = ctx.createRadialGradient(cx, cy, size * 0.22, cx, cy, size * 0.48);
  glow.addColorStop(0, "rgba(78, 205, 196, 0)");
  glow.addColorStop(0.5, "rgba(78, 205, 196, 0.22)");
  glow.addColorStop(0.72, "rgba(78, 205, 196, 0.5)");
  glow.addColorStop(0.88, "rgba(78, 205, 196, 0.18)");
  glow.addColorStop(1, "rgba(78, 205, 196, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  // Sharp ring stroke
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  // Inner rim highlight
  ctx.strokeStyle = "rgba(232, 248, 255, 0.65)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.34, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createFlagTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Pole
  ctx.fillStyle = "rgba(232, 248, 255, 0.9)";
  ctx.fillRect(18, 8, 6, 240);

  // Flag triangle
  ctx.beginPath();
  ctx.moveTo(28, 16);
  ctx.lineTo(110, 50);
  ctx.lineTo(28, 84);
  ctx.closePath();
  ctx.fillStyle = "#4ecdc4";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#e8f8ff";
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createClimberTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Outer glow
  const glow = ctx.createRadialGradient(32, 32, 4, 32, 32, 28);
  glow.addColorStop(0, "rgba(78, 205, 196, 0.9)");
  glow.addColorStop(0.5, "rgba(78, 205, 196, 0.25)");
  glow.addColorStop(1, "rgba(78, 205, 196, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 64, 64);

  // Core
  ctx.beginPath();
  ctx.arc(32, 32, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#e8f8ff";
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSummitParticles(count: number): THREE.Points {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities: number[] = [];
  const lifes: number[] = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const speed = 0.02 + Math.random() * 0.06;
    velocities.push(
      Math.sin(phi) * Math.cos(theta) * speed,
      Math.cos(phi) * speed + 0.02,
      Math.sin(phi) * Math.sin(theta) * speed
    );
    lifes.push(Math.random());
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0x4ecdc4,
    size: 0.18,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  (points as any).velocities = velocities;
  (points as any).lifes = lifes;
  return points;
}

// ─── Reaction Texture Helpers ───────────────────────────

function createSquareTexture(
  color: THREE.ColorRepresentation,
  size = 64
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = new THREE.Color(color);
  ctx.fillStyle = `rgb(${c.r * 255},${c.g * 255},${c.b * 255})`;
  ctx.fillRect(8, 8, size - 16, size - 16);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createCircleTexture(
  color: THREE.ColorRepresentation,
  size = 64
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = new THREE.Color(color);
  ctx.fillStyle = `rgb(${c.r * 255},${c.g * 255},${c.b * 255})`;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createGlowTexture(
  color: THREE.ColorRepresentation,
  size = 128
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = new THREE.Color(color);
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(
    0,
    `rgba(${c.r * 255},${c.g * 255},${c.b * 255},1)`
  );
  gradient.addColorStop(
    0.4,
    `rgba(${c.r * 255},${c.g * 255},${c.b * 255},0.4)`
  );
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ─── Main Component ─────────────────────────────────────

const Mountain3D = forwardRef<MountainHandle, object>(function Mountain3D(
  props,
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const {
    bootStage,
    currentZone,
    summitReached,
    setBootStage,
    setZone,
    markCheckpoint,
  } = useClimb();
  const lastZoneRef = useRef<Zone | null>(null);
  const zoneEnterTimeRef = useRef<number>(0);
  const checkpointTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const summitFlareTriggeredRef = useRef(false);
  const scrollProgressRef = useRef(0);
  const CHECKPOINT_DWELL_MS = 1500; // time required to establish a checkpoint
  const pathCurveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const mountainExtentsRef = useRef<{ halfX: number; halfZ: number } | null>(
    null
  );
  const baseCampArcRef = useRef<
    | {
        start: THREE.Vector3;
        gear: THREE.Vector3;
        startAngle: number;
        gearAngle: number;
        startRadius: number;
        gearRadius: number;
        bulge: number;
      }
    | null
  >(null);
  const mountainCenterRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const markersRef = useRef<
    {
      group: THREE.Group;
      ring: THREE.Mesh;
      portal: THREE.Sprite;
      sprite: THREE.Sprite;
      zone: Zone;
      basePosition: THREE.Vector3;
      t: number;
    }[]
  >([]);
  const climberRef = useRef<THREE.Sprite | null>(null);
  const climberTrailRef = useRef<THREE.Points | null>(null);
  const flagRef = useRef<THREE.Sprite | null>(null);
  const summitParticlesRef = useRef<THREE.Points | null>(null);
  const flagSpawnedRef = useRef(false);
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const currentZoneRef = useRef<Zone | null>(currentZone);

  useEffect(() => {
    currentZoneRef.current = currentZone;
  }, [currentZone]);

  const reactionHandlerRef = useRef<(type: string, payload?: unknown) => void>(
    () => {}
  );

  useImperativeHandle(
    ref,
    () => ({
      triggerReaction: (type: string, payload?: unknown) =>
        reactionHandlerRef.current(type, payload),
    }),
    []
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setBootStage("booting");

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = createSkyGradient();
    scene.fog = new THREE.FogExp2(0x201850, 0.012);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(SKY_BOTTOM, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // ─── Lighting ──────────────────────────────────────
    // Dark, moody Celeste style: low ambient, a strong directional key light
    // cast from the moon/orb, and subtle fills for readability.
    const ambient = new THREE.AmbientLight(0x303450, 1.30);
    scene.add(ambient);

    // Warm fill from front-right to keep shadowed faces barely readable
    const fill = new THREE.DirectionalLight(0x504060, 0.35);
    fill.position.set(12, 6, 10);
    scene.add(fill);

    // Soft cyan rim from behind
    const rim = new THREE.DirectionalLight(0x50a0b0, 0.60);
    rim.position.set(-6, 8, -16);
    scene.add(rim);

    // Subtle camera-aligned fill so the mountain remains readable from every
    // scroll-driven viewpoint without flattening the soft moonlight.
    const cameraLight = new THREE.DirectionalLight(0x8090a8, 1.6);
    scene.add(cameraLight);

    const summitLight = new THREE.PointLight(0x60e0f8, 2.5, 30);
    summitLight.position.set(-2, 18, 0);
    scene.add(summitLight);

    // Cyan point light that travels to the active trail marker so the hoop
    // glows from within and the "light through the ring" reads on camera.
    const markerLight = new THREE.PointLight(0x4ecdc4, 0, 24);
    scene.add(markerLight);

    // The traveling light has no visible sprite — only the point light and its
    // subtle glow on the mountain surface.

    // The big halo around the orb is intentionally omitted so only the small
    // traveling light remains visible.

    // ─── Background Mountains ──────────────────────────
    // Full 360° ring of silhouetted peaks surrounding the main mountain
    const bgRing = createBackgroundMountainRing();
    scene.add(bgRing);

    // ─── Base Terrain ──────────────────────────────────
    // Rolling ground that rises to meet the mountain base
    const baseTerrain = createBaseTerrain();
    baseTerrain.receiveShadow = true;
    scene.add(baseTerrain);

    // ─── Atmosphere (no terrain dependency) ────────────
    // Soft static moon fill so the mountain retains shape without flattening.
    const moonLight = new THREE.DirectionalLight(0x90d8ff, 2.2);
    moonLight.position.set(-24, 32, -4);
    moonLight.target.position.set(0, 2, -8);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 1;
    moonLight.shadow.camera.far = 140;
    moonLight.shadow.camera.left = -40;
    moonLight.shadow.camera.right = 40;
    moonLight.shadow.camera.top = 40;
    moonLight.shadow.camera.bottom = -40;
    moonLight.shadow.bias = -0.0005;
    scene.add(moonLight);
    scene.add(moonLight.target);

    // Subtle glow from the small traveling light; kept faint so it doesn't
    // become a second moon.
    const orbGlow = new THREE.PointLight(0x80d0ff, 0, 40);
    orbGlow.position.set(0, 0, 0);
    scene.add(orbGlow);

    const aurora = createAurora();
    scene.add(aurora);

    const snowCount = prefersReducedMotion ? 80 : 2000;
    const snow = createSnow(snowCount);
    scene.add(snow);

    const stars = createStars(prefersReducedMotion ? 200 : 1000);
    scene.add(stars);

    const clouds = createClouds();
    scene.add(clouds);

    const mountainMist = createMountainMist();
    scene.add(mountainMist);

    const atmoGlow = createAtmosphericGlow();
    scene.add(atmoGlow);

    let st: ScrollTrigger | null = null;
    let updateCamera: ((progress: number) => void) | null = null;
    let mountainMesh: THREE.Mesh | null = null;
    let isCleanedUp = false;
    let cameraBasePosition = new THREE.Vector3();

    // ─── Reaction System ───────────────────────────────
    const reactionGroup = new THREE.Group();
    scene.add(reactionGroup);

    let pathCurve: THREE.CatmullRomCurve3 | null = null;
    let summitPos: THREE.Vector3 | null = null;

    function getActiveMarkerPosition(): THREE.Vector3 {
      const zone = currentZoneRef.current || "hero";
      const marker = markersRef.current.find((m) => m.zone === zone);
      if (marker) {
        return marker.portal.position.clone();
      }
      const curve = pathCurveRef.current || pathCurve;
      if (curve) {
        const pos = curve.getPoint(Math.max(0, Math.min(1, zoneTrailT(zone))));
        return pos.clone().add(new THREE.Vector3(0, 1.2, 0));
      }
      return summitPos
        ? summitPos.clone().add(new THREE.Vector3(0, -5, 0))
        : new THREE.Vector3(0, 5, 0);
    }

    interface TransientEffect {
      mesh: THREE.Object3D;
      born: number;
      lifetime: number;
      update: (dt: number, age: number) => boolean;
      dispose: () => void;
    }
    const effects: TransientEffect[] = [];

    const cameraShake = { active: false, startTime: 0, duration: 0 };
    const lightFlare = {
      active: false,
      startTime: 0,
      duration: 0,
      boost: 0,
      baseIntensity: 2,
    };
    const auroraOverride = {
      active: false,
      startTime: 0,
      duration: 0,
      color: new THREE.Color(0xffffff),
    };

    function spawnParticleBurst(
      position: THREE.Vector3,
      color: THREE.ColorRepresentation,
      count: number
    ) {
      if (prefersReducedMotion) count = Math.min(count, 6);
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const velocities: THREE.Vector3[] = [];
      const startOffsets: number[] = [];
      for (let i = 0; i < count; i++) {
        positions[i * 3] = position.x;
        positions[i * 3 + 1] = position.y;
        positions[i * 3 + 2] = position.z;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = 0.02 + Math.random() * 0.05;
        velocities.push(
          new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.cos(phi) * speed + 0.02,
            Math.sin(phi) * Math.sin(theta) * speed
          )
        );
        startOffsets.push(Math.random() * 0.3);
      }
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color,
        size: 0.12,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geo, mat);
      reactionGroup.add(points);
      effects.push({
        mesh: points,
        born: clock.getElapsedTime(),
        lifetime: 1.5,
        update: (_dt, age) => {
          const pos = geo.attributes.position.array as Float32Array;
          for (let i = 0; i < count; i++) {
            const ix = i * 3;
            if (age < startOffsets[i]) continue;
            pos[ix] += velocities[i].x;
            pos[ix + 1] += velocities[i].y;
            pos[ix + 2] += velocities[i].z;
            velocities[i].y -= 0.001;
          }
          geo.attributes.position.needsUpdate = true;
          mat.opacity = Math.max(0, 1 - age / 1.2);
          return true;
        },
        dispose: () => {
          reactionGroup.remove(points);
          geo.dispose();
          mat.dispose();
        },
      });
    }

    function spawnFloatingSquares(position: THREE.Vector3, count: number) {
      if (prefersReducedMotion) count = Math.min(count, 2);
      const colors = [0x4ecdc4, 0x44a3aa, 0x8cc8e0, 0xc0e8f8];
      const group = new THREE.Group();
      group.position.copy(position);
      const items: {
        sprite: THREE.Sprite;
        velocity: THREE.Vector3;
        rotSpeed: number;
      }[] = [];
      for (let i = 0; i < count; i++) {
        const color = colors[i % colors.length];
        const texture = createSquareTexture(color, 32);
        const mat = new THREE.SpriteMaterial({
          map: texture,
          color,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(0.25, 0.25, 1);
        sprite.position.set(
          (Math.random() - 0.5) * 3,
          Math.random() * 1,
          (Math.random() - 0.5) * 3
        );
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          0.03 + Math.random() * 0.03,
          (Math.random() - 0.5) * 0.01
        );
        group.add(sprite);
        items.push({ sprite, velocity, rotSpeed: (Math.random() - 0.5) * 0.1 });
      }
      reactionGroup.add(group);
      effects.push({
        mesh: group,
        born: clock.getElapsedTime(),
        lifetime: 3.0,
        update: (_dt, age) => {
          items.forEach((item) => {
            item.sprite.position.add(item.velocity);
            item.sprite.material.rotation += item.rotSpeed;
            item.sprite.material.opacity = Math.max(0, 0.9 - age / 2.5);
          });
          return true;
        },
        dispose: () => {
          items.forEach((item) => {
            item.sprite.material.map?.dispose();
            item.sprite.material.dispose();
          });
          group.clear();
          reactionGroup.remove(group);
        },
      });
    }

    function spawnOrbitSprite(
      position: THREE.Vector3,
      color: THREE.ColorRepresentation
    ) {
      const texture = createCircleTexture(color, 48);
      const mat = new THREE.SpriteMaterial({
        map: texture,
        color,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.5, 0.5, 1);
      sprite.position.copy(position);
      reactionGroup.add(sprite);
      effects.push({
        mesh: sprite,
        born: clock.getElapsedTime(),
        lifetime: 3.0,
        update: (_dt, age) => {
          const angle = age * 4;
          const radius = 0.8 + Math.sin(age * 3) * 0.2;
          sprite.position.set(
            position.x + Math.cos(angle) * radius,
            position.y + Math.sin(age * 2) * 0.3 + 0.3,
            position.z + Math.sin(angle) * radius
          );
          sprite.material.opacity = Math.max(0, 1 - age / 2.5);
          return true;
        },
        dispose: () => {
          mat.map?.dispose();
          mat.dispose();
          reactionGroup.remove(sprite);
        },
      });
    }

    function spawnGoldenStrawberry(position: THREE.Vector3) {
      const texture = createCircleTexture(0xffd700, 64);
      const mat = new THREE.SpriteMaterial({
        map: texture,
        color: 0xffd700,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.8, 0.8, 1);
      sprite.position.copy(position);
      reactionGroup.add(sprite);
      effects.push({
        mesh: sprite,
        born: clock.getElapsedTime(),
        lifetime: 4.0,
        update: (_dt, age) => {
          sprite.position.y = position.y + age * 0.8;
          const pulse = 1 + Math.sin(age * 6) * 0.2;
          sprite.scale.set(0.8 * pulse, 0.8 * pulse, 1);
          sprite.material.opacity =
            age < 0.5 ? age * 2 : Math.max(0, 1 - (age - 0.5) / 2.5);
          return true;
        },
        dispose: () => {
          mat.map?.dispose();
          mat.dispose();
          reactionGroup.remove(sprite);
        },
      });
    }

    function spawnNavFlash(position: THREE.Vector3) {
      const texture = createGlowTexture(0x00f5d4, 128);
      const mat = new THREE.SpriteMaterial({
        map: texture,
        color: 0x00f5d4,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(2, 2, 1);
      sprite.position.copy(position);
      reactionGroup.add(sprite);
      effects.push({
        mesh: sprite,
        born: clock.getElapsedTime(),
        lifetime: 1.0,
        update: (_dt, age) => {
          const pulse = Math.sin(age * Math.PI * 4);
          sprite.scale.set(2 + pulse * 0.5, 2 + pulse * 0.5, 1);
          mat.opacity = 0.8 * (1 - age);
          return true;
        },
        dispose: () => {
          mat.map?.dispose();
          mat.dispose();
          reactionGroup.remove(sprite);
        },
      });
    }

    function flareSummitLight(boost: number, duration: number) {
      lightFlare.active = true;
      lightFlare.startTime = clock.getElapsedTime();
      lightFlare.duration = duration;
      lightFlare.boost = boost;
      lightFlare.baseIntensity = summitLight.intensity;
    }

    function boostAurora(duration: number, color: THREE.ColorRepresentation) {
      auroraOverride.active = true;
      auroraOverride.startTime = clock.getElapsedTime();
      auroraOverride.duration = duration;
      auroraOverride.color = new THREE.Color(color);
    }

    function shakeCamera(duration: number) {
      if (prefersReducedMotion) return;
      cameraShake.active = true;
      cameraShake.startTime = clock.getElapsedTime();
      cameraShake.duration = duration;
    }

    // ─── Load Pre-Processed Mountain Binary ────────────
    loadMountainBinary()
      .then((mountainData) => {
        if (isCleanedUp) {
          mountainData.geometry.dispose();
          return;
        }

        const geometry = mountainData.geometry;
        geometry.computeBoundingBox();
        geometry.computeVertexNormals();

        // Apply Celeste vertex colors
        applyCelesteColors(geometry);

        // Sink the mountain so its base sits flush with the scene
        // instead of jutting out below the environment. A slightly deeper
        // sink hides the flat cut-off edge of the mesh while keeping the
        // ridge trail and landmarks clearly visible.
        const sinkY = -3.0;
        geometry.translate(0, sinkY, 0);
        mountainData.pathPoints.forEach((p) => {
          p.y += sinkY;
        });

        // Create mesh
        const mtnMat = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.58,
          metalness: 0.04,
          flatShading: false,
          side: THREE.DoubleSide,
        });
        mountainMesh = new THREE.Mesh(geometry, mtnMat);
        mountainMesh.castShadow = true;
        mountainMesh.receiveShadow = true;
        scene.add(mountainMesh);

        const { highestX, highestY, highestZ } = mountainData;
        const summitY = highestY + sinkY;
        summitPos = new THREE.Vector3(highestX, summitY, highestZ);

        // Position snow throughout the 3D mountain environment.
        const snowBaseY = -10.0;
        repositionSnowInEnvironment(snow, snowCount, highestX, summitY, highestZ, snowBaseY);

        // Mountain bounding box for camera framing
        const bbox = geometry.boundingBox!;
        const centerX = (bbox.min.x + bbox.max.x) / 2;
        const centerZ = (bbox.min.z + bbox.max.z) / 2;
        const centerY = (bbox.min.y + bbox.max.y) / 2;
        mountainCenterRef.current = { x: centerX, z: centerZ };
        mountainExtentsRef.current = {
          halfX: (bbox.max.x - bbox.min.x) * 0.5,
          halfZ: (bbox.max.z - bbox.min.z) * 0.5,
        };

        // Update summit light to actual peak
        summitLight.position.set(highestX, summitY + 3, highestZ);

        // ─── Camera Path ───────────────────────────────
        // Landmark-driven orbit: the camera makes a single continuous clockwise
        // sweep around the mountain while its look-at target climbs the actual
        // ridge trail embedded in the binary. Radius and height curves give
        // smooth zoom-in / zoom-out transitions at each landmark.
        pathCurve = new THREE.CatmullRomCurve3(
          mountainData.pathPoints,
          false,
          "centripetal"
        );

        interface Landmark {
          progress: number; // scroll progress
          trailT: number;   // position along the ridge trail (0=base, 1=summit)
          angle: number;    // azimuth around mountain center (radians)
          radius: number;   // horizontal distance from mountain center
          camY: number;     // absolute camera height
        }

        // Derive markers and camera landmarks from the centralized zone config.
        // This removes the duplicated zone tables that used to live here.
        // The summit/contact marker is omitted so the peak stays clean. A
        // synthetic Base Camp hoop is added at the front/center base; the old
        // hero/trailhead hoop is removed so the climb starts from Base Camp.
        const MARKERS: {
          t: number;
          zone: Zone;
          icon: string;
          label: string;
        }[] = [
          { t: 0.06, zone: "about", icon: "🚩", label: "Base Camp" },
          ...ZONES.filter(
            (z) =>
              z.zone !== "contact" &&
              z.zone !== "hero" &&
              z.zone !== "about"
          ).map((z) => ({
            t: z.trailT,
            zone: z.zone,
            icon: z.icon,
            label: z.label,
          })),
        ];

        const landmarks: Landmark[] = [
          // The climb begins at the Base Camp marker on the front/center base.
          {
            progress: 0.0,
            trailT: 0.06,
            angle: Math.PI / 2,
            radius: 30,
            camY: 3,
          },
          ...ZONES.map((z) => ({
            progress: z.landmark.progress,
            trailT: z.trailT,
            angle: z.landmark.angle,
            radius: z.landmark.radius,
            camY: z.landmark.camY,
          })),
          // Mid pull-back: keep the camera moving away from the summit so the
          // zoom-out feels gradual rather than a sudden snap at the very end.
          { progress: 0.975, trailT: 0.98, angle: 0.9, radius: 18, camY: 7 },
          // ── FINAL SUMMIT PULL-BACK ───────────────────────────────────────
          // AUTHOR'S INTENT — DO NOT CHANGE. The climb ends by easing back
          // toward the Base Camp / city trailhead (angle = Math.PI / 2) with a
          // modest zoom (radius = 22) and a lower camera height (camY = 6) so
          // the summit and the top ~7/10ths of the mountain fill the frame.
          // The pull-back is intentionally drawn out across the summit section
          // and all the way to the footer; do not make it faster or wider.
          // ──────────────────────────────────────────────────────────────────
          { progress: 1.0, trailT: 1.0, angle: Math.PI / 2, radius: 22, camY: 6 },
        ];

        function interpolateValue(values: number[], progress: number): number {
          const n = landmarks.length;
          let i0 = 0;
          let i1 = n - 1;
          for (let i = 0; i < n - 1; i++) {
            if (progress >= landmarks[i].progress && progress <= landmarks[i + 1].progress) {
              i0 = i;
              i1 = i + 1;
              break;
            }
          }
          const t = Math.max(0, Math.min(1, (progress - landmarks[i0].progress) / (landmarks[i1].progress - landmarks[i0].progress)));
          return values[i0] + (values[i1] - values[i0]) * t;
        }

        function easeInOutQuad(t: number): number {
          return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        }

        function interpolateEase(values: number[], progress: number): number {
          const n = landmarks.length;
          let i0 = 0;
          let i1 = n - 1;
          for (let i = 0; i < n - 1; i++) {
            if (progress >= landmarks[i].progress && progress <= landmarks[i + 1].progress) {
              i0 = i;
              i1 = i + 1;
              break;
            }
          }
          const t = Math.max(0, Math.min(1, (progress - landmarks[i0].progress) / (landmarks[i1].progress - landmarks[i0].progress)));
          return values[i0] + (values[i1] - values[i0]) * easeInOutQuad(t);
        }

        function getCameraPose(progress: number): { pos: THREE.Vector3; lookAt: THREE.Vector3 } {
          // Orbit the camera around the mountain as the user climbs, keeping
          // the moonlight and ridge trail in view at each landmark.
          const angle = interpolateValue(
            landmarks.map((lm) => lm.angle),
            progress
          );
          const radius = interpolateEase(
            landmarks.map((lm) => lm.radius),
            progress
          );
          const camYOffset = interpolateEase(
            landmarks.map((lm) => lm.camY),
            progress
          );
          const trailT = interpolateValue(
            landmarks.map((lm) => lm.trailT),
            progress
          );

          // Look at the current trail point so the camera tracks the ridge line
          // and passes each marker as it climbs.
          const target = pathCurve!.getPoint(Math.max(0, Math.min(1, trailT)));
          target.y += 0.5;

          // At the very end, ease the gaze from the summit trail to the mountain
          // center so the final shot frames the entire mountain.
          const mountainCenter = new THREE.Vector3(centerX, centerY, centerZ);
          const pullBackStart = landmarks[landmarks.length - 2].progress;
          const pullBack = THREE.MathUtils.smoothstep(progress, pullBackStart, 1.0);
          target.lerp(mountainCenter, pullBack);

          const pos = new THREE.Vector3(
            centerX + Math.cos(angle) * radius,
            target.y + camYOffset,
            centerZ + Math.sin(angle) * radius
          );

          return { pos, lookAt: target };
        }

        updateCamera = (progress: number) => {
          const pose = getCameraPose(progress);
          cameraBasePosition.copy(pose.pos);
          camera.position.copy(pose.pos);
          camera.lookAt(pose.lookAt);

          cameraLight.position.copy(pose.pos);
          cameraLight.target.position.copy(pose.lookAt);
          cameraLight.target.updateMatrixWorld();

          // Moon fill is kept static; the traveling hoop orb is now the
          // moving light source and its glow is updated in the animation loop.
        };

        updateCamera(0);

        // ─── Trail Markers ─────────────────────────────────
        pathCurveRef.current = pathCurve;

        const markerGroup = new THREE.Group();
        markerGroupRef.current = markerGroup;
        scene.add(markerGroup);

        MARKERS.forEach((m) => {
          const basePosition = pathCurve!.getPoint(Math.max(0, Math.min(1, m.t)));
          basePosition.y += 0.8;

          // Place the Base Camp hoop at the front/center base of the mountain
          // so the climb starts from the center, not off to one side. Push it
          // just past the bounding-box front face so it doesn't sit inside the rock.
          if (m.zone === "about") {
            const trailStart = pathCurve!.getPoint(0);
            basePosition.set(centerX, trailStart.y + 0.2, bbox.max.z + 0.5);
          }

          // Pulsing ring base
          const ringGeo = new THREE.TorusGeometry(0.35, 0.04, 8, 32);
          const ringMat = new THREE.MeshBasicMaterial({
            color: 0x4ecdc4,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = -Math.PI / 2;
          ring.position.copy(basePosition);
          ring.position.y -= 0.78;
          markerGroup.add(ring);

          // Glowing portal ring sprite
          const portalTexture = createPortalRingTexture("#4ecdc4");
          const portalMat = new THREE.SpriteMaterial({
            map: portalTexture,
            transparent: true,
            opacity: 0.65,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          });
          const portal = new THREE.Sprite(portalMat);
          portal.scale.set(1.1, 1.1, 1);
          portal.position.copy(basePosition);
          markerGroup.add(portal);

          // Banner label sprite
          const texture = createMarkerTexture(m.icon, m.label);
          const spriteMat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.92,
            depthWrite: false,
          });
          const sprite = new THREE.Sprite(spriteMat);
          sprite.scale.set(1.5, 0.66, 1);
          sprite.position.copy(basePosition);
          sprite.position.y += 0.85;
          markerGroup.add(sprite);

          markersRef.current.push({
            group: markerGroup,
            ring,
            portal,
            sprite,
            zone: m.zone,
            basePosition,
            t: m.t,
          });
        });

        // Compute a direct surface arc from the front/center Base Camp marker
        // to Gear Wall. The arc bulges outward by the mountain's bounding
        // radius so the light never cuts through the rock.
        const baseCampMarker = markersRef.current.find((m) => m.zone === "about");
        if (baseCampMarker) {
          markerLight.position.copy(baseCampMarker.portal.position);
          orbGlow.position.copy(baseCampMarker.portal.position);

          const start = baseCampMarker.portal.position.clone();

          const gearT = 0.36;
          const gear = pathCurve.getPoint(gearT).clone();
          gear.y += 0.5;
          const gearOutward = new THREE.Vector3(
            gear.x - centerX,
            0,
            gear.z - centerZ
          ).normalize();
          gear.add(gearOutward.multiplyScalar(0.6));

          const startAngle = Math.atan2(start.z - centerZ, start.x - centerX);
          const gearAngle = Math.atan2(gear.z - centerZ, gear.x - centerX);
          const startRadius = Math.sqrt(
            (start.x - centerX) ** 2 + (start.z - centerZ) ** 2
          );
          const gearRadius = Math.sqrt(
            (gear.x - centerX) ** 2 + (gear.z - centerZ) ** 2
          );
          const outerR =
            Math.max(
              (bbox.max.x - bbox.min.x) * 0.5,
              (bbox.max.z - bbox.min.z) * 0.5
            ) + 1.0;
          const midRadius = (startRadius + gearRadius) * 0.5;
          const bulge = Math.max(0, outerR - midRadius);

          baseCampArcRef.current = {
            start,
            gear,
            startAngle,
            gearAngle,
            startRadius,
            gearRadius,
            bulge,
          };
        }

        // ─── Climber Sprite ────────────────────────────────
        const climberTexture = createClimberTexture();
        const climberMat = new THREE.SpriteMaterial({
          map: climberTexture,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const climber = new THREE.Sprite(climberMat);
        const startPos = baseCampMarker
          ? baseCampMarker.portal.position.clone()
          : pathCurve.getPoint(0).clone();
        startPos.y += 0.4;
        climber.position.copy(startPos);
        climber.scale.set(0.8, 0.8, 1);
        scene.add(climber);
        climberRef.current = climber;

        // ─── Climber Trail Particles ───────────────────────
        const trailCount = 40;
        const trailGeo = new THREE.BufferGeometry();
        const trailPositions = new Float32Array(trailCount * 3);
        const trailOpacities = new Float32Array(trailCount);
        for (let i = 0; i < trailCount; i++) {
          trailPositions[i * 3] = startPos.x;
          trailPositions[i * 3 + 1] = startPos.y;
          trailPositions[i * 3 + 2] = startPos.z;
          trailOpacities[i] = 0;
        }
        trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
        trailGeo.setAttribute("alpha", new THREE.BufferAttribute(trailOpacities, 1));

        const trailMat = new THREE.PointsMaterial({
          color: 0x4ecdc4,
          size: 0.12,
          transparent: true,
          opacity: 0.55,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true,
        });
        const trail = new THREE.Points(trailGeo, trailMat);
        scene.add(trail);
        climberTrailRef.current = trail;

        // ScrollTrigger
        st = ScrollTrigger.create({
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => {
            scrollProgressRef.current = self.progress;
            if (updateCamera) updateCamera(self.progress);
            const zone = progressToZone(self.progress);
            const now = performance.now();

            if (zone !== lastZoneRef.current) {
              // Entered a new zone
              lastZoneRef.current = zone;
              zoneEnterTimeRef.current = now;
              const altitude = Math.round(self.progress * 8000);
              setZone(zone, altitude);

              // Clear any pending checkpoint from a previous zone
              if (checkpointTimerRef.current) {
                clearTimeout(checkpointTimerRef.current);
                checkpointTimerRef.current = null;
              }

              // Mark checkpoint after dwell time
              checkpointTimerRef.current = setTimeout(() => {
                markCheckpoint(zone);
              }, CHECKPOINT_DWELL_MS);

              // Immediate ambient reaction when passing through a hoop.
              triggerCheckpointReaction(zone);
            }

            // Dedicated summit flare as the user reaches the very top.
            if (self.progress > 0.97 && !summitFlareTriggeredRef.current) {
              summitFlareTriggeredRef.current = true;
              flareSummitLight(5.0, 4.0);
              boostAurora(3.0, 0x60e0f8);
              if (summitPos) {
                spawnParticleBurst(summitPos, 0xc0e8f8, 40);
                spawnParticleBurst(summitPos, 0xd4a843, 18);
              }
            }
          },
        });

        // Per-zone ambient checkpoint reactions: light flicker, wind gust, or
        // rockfall triggered as the orb passes each portal hoop.
        function triggerCheckpointReaction(zone: Zone) {
          if (prefersReducedMotion) {
            flareSummitLight(1.5, 1.2);
            return;
          }
          switch (zone) {
            case "hero":
              // Warm flicker as the orb leaves the Base Camp lights.
              flareSummitLight(1.6, 1.2);
              break;
            case "about":
              // Subtle checkpoint ambience.
              break;
            case "skills":
              // Loose rockfall from the gear wall.
              shakeCamera(0.4);
              spawnParticleBurst(getActiveMarkerPosition(), 0x8b7d6b, 18);
              break;
            case "projects":
              // Icy flare + aurora ripple.
              flareSummitLight(2.2, 1.6);
              boostAurora(1.5, 0x60e0f8);
              break;
            case "gallery":
              // Subtle checkpoint ambience.
              break;
            case "contact":
              // Summit flare and celebratory burst.
              flareSummitLight(4.0, 3.0);
              if (summitPos) {
                spawnParticleBurst(summitPos, 0xc0e8f8, 30);
                spawnParticleBurst(summitPos, 0xd4a843, 16);
              }
              break;
          }
        }

        // Ensure ScrollTrigger recalculates the page height and fires once
        // so the initial zone/currentZone is set and the camera starts at
        // the correct position for the current scroll offset.
        ScrollTrigger.refresh();

        // Explicitly set the initial zone from the current scroll position so
        // the status bar never stays stuck on "Booting..." after the handoff.
        const initialProgress =
          ScrollTrigger.maxScroll(window) > 0
            ? window.scrollY / ScrollTrigger.maxScroll(window)
            : 0;
        const initialZone = progressToZone(initialProgress);
        lastZoneRef.current = initialZone;
        setZone(initialZone, Math.round(initialProgress * 8000));

        setBootStage("ready");
      })
      .catch((err) => {
        console.error("Failed to load mountain binary:", err);
        setBootStage("ready"); // prevent infinite spinner
      });

    // ─── Animation Loop ────────────────────────────────
    const clock = new THREE.Clock();

    // Wire imperative reaction handler now that clock exists
    reactionHandlerRef.current = (type, payload) => {
      if (prefersReducedMotion) {
        if (type === "uptime") {
          soundEngine.success();
          flareSummitLight(2.0, 2.0);
          boostAurora(2.0, 0x40e0ff);
          return;
        }
        if (type === "summit") {
          soundEngine.summit();
          flareSummitLight(3.0, 3.0);
          return;
        }
        if (type === "golden-strawberry") {
          soundEngine.golden();
          flareSummitLight(3.0, 4.0);
          boostAurora(4.0, 0xffd700);
          return;
        }
        return;
      }

      switch (type) {
        case "whoami":
          soundEngine.success();
          spawnParticleBurst(getActiveMarkerPosition(), 0x00f5d4, 16);
          break;
        case "docker-ps":
          soundEngine.success();
          spawnFloatingSquares(new THREE.Vector3(0, -2, 0), 6);
          break;
        case "uptime":
          soundEngine.success();
          flareSummitLight(2.5, 2.0);
          boostAurora(2.0, 0x40e0ff);
          break;
        case "mountain":
          soundEngine.wind();
          flareSummitLight(2.0, 3.0);
          break;
        case "strawberry":
          soundEngine.golden();
          spawnOrbitSprite(getActiveMarkerPosition(), 0xe85555);
          break;
        case "clear":
          soundEngine.wind();
          break;
        case "fall":
          soundEngine.error();
          spawnParticleBurst(getActiveMarkerPosition(), 0xe85555, 20);
          shakeCamera(0.5);
          break;
        case "summit":
          soundEngine.summit();
          if (summitPos) {
            spawnParticleBurst(summitPos, 0xc0e8f8, 40);
            spawnParticleBurst(summitPos, 0xd4a843, 20);
          }
          flareSummitLight(3.0, 3.0);
          break;
        case "golden-strawberry":
          soundEngine.golden();
          if (summitPos) spawnGoldenStrawberry(summitPos);
          flareSummitLight(3.0, 4.0);
          boostAurora(4.0, 0xffd700);
          break;
        default:
          if (type.startsWith("nav-")) {
            const zone = type.slice(4) as Zone;
            const marker = markersRef.current.find((m) => m.zone === zone);
            const curve = pathCurveRef.current || pathCurve;
            const pos = marker
              ? marker.portal.position.clone()
              : curve
                ? curve
                    .getPoint(Math.max(0, Math.min(1, zoneTrailT(zone))))
                    .clone()
                    .add(new THREE.Vector3(0, 1.2, 0))
                : new THREE.Vector3(0, 5, 0);
            soundEngine.nav();
            spawnNavFlash(pos);
          }
          break;
      }
    };

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const dt = clock.getDelta();

      // Update transient reaction effects
      for (let i = effects.length - 1; i >= 0; i--) {
        const e = effects[i];
        const age = time - e.born;
        if (age >= e.lifetime || !e.update(dt, age)) {
          reactionGroup.remove(e.mesh);
          e.dispose();
          effects.splice(i, 1);
        }
      }

      // Aurora drift
      aurora.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const phase = (child as any).phase || 0;
          const baseX = (child as any).baseX || child.position.x;
          const baseZ = (child as any).baseZ || child.position.z;
          child.position.x = baseX + Math.sin(time * 0.15 + phase) * 2.5;
          child.position.z = baseZ + Math.cos(time * 0.12 + phase) * 1.5;
          child.material.opacity = 0.35 + Math.sin(time * 0.3 + phase) * 0.15;
        }
      });

      // Aurora reaction override
      if (auroraOverride.active) {
        const age = time - auroraOverride.startTime;
        if (age < auroraOverride.duration) {
          aurora.children.forEach((child) => {
            if (child instanceof THREE.Mesh) {
              child.material.color.copy(auroraOverride.color);
              child.material.opacity = Math.min(
                0.9,
                0.55 + Math.sin(age * 2) * 0.2
              );
            }
          });
        } else {
          aurora.children.forEach((child, i) => {
            if (child instanceof THREE.Mesh) {
              const colors = [0x40ffaa, 0x40e0ff, 0x8060ff];
              child.material.color.set(colors[i % colors.length]);
              child.material.opacity = 0.55;
            }
          });
          auroraOverride.active = false;
        }
      }

      // Snow
      // Slow 3D snowfall through the mountain environment. Particles fall
      // downward in world space and reset to the top when they pass below
      // the base.
      if (!prefersReducedMotion) {
        const positions = snow.geometry.attributes.position.array as Float32Array;
        const velocities = (snow as any).velocities as number[];
        const topY = ((snow as any).topY as number) ?? 30;
        const baseY = ((snow as any).baseY as number) ?? -10;
        const xRange = ((snow as any).xRange as number) ?? 60;
        const zRange = ((snow as any).zRange as number) ?? 60;
        const spawnX = ((snow as any).spawnX as number) ?? 0;
        const spawnZ = ((snow as any).spawnZ as number) ?? -9;

        for (let i = 0; i < snowCount; i++) {
          const ix = i * 3;
          const vx = velocities[ix];
          const vy = velocities[ix + 1];
          const vz = velocities[ix + 2];

          positions[ix] += vx;
          positions[ix + 1] += vy;
          positions[ix + 2] += vz;

          // Reset to the top when it falls below the base.
          if (positions[ix + 1] < baseY - 2) {
            positions[ix] = spawnX + (Math.random() - 0.5) * xRange;
            positions[ix + 1] = topY + Math.random() * 4;
            positions[ix + 2] = spawnZ + (Math.random() - 0.5) * zRange;
          }
        }
        snow.geometry.attributes.position.needsUpdate = true;
      }

      // Stars twinkle
      (stars.material as THREE.PointsMaterial).opacity = 0.4 + Math.sin(time * 0.6) * 0.15;

      // Summit light pulse + flare
      let baseIntensity = 2.0 + Math.sin(time * 1.0) * 0.5;
      if (lightFlare.active) {
        const age = time - lightFlare.startTime;
        if (age < lightFlare.duration) {
          const pulse = Math.sin((age / lightFlare.duration) * Math.PI);
          baseIntensity = Math.max(
            baseIntensity,
            lightFlare.baseIntensity + pulse * lightFlare.boost
          );
        } else {
          lightFlare.active = false;
        }
      }
      summitLight.intensity = baseIntensity;

      // Cloud drift — slow, consistent horizontal drift with wrap-around
      clouds.children.forEach((child) => {
        if (child instanceof THREE.Sprite) {
          const speed = (child as any).speed || 0.2;
          const startX = (child as any).startX || 0;
          const parallax = (child as any).parallax || 0.4;
          const range = 70;
          const drift = ((time * speed * parallax * 0.5) % range);
          child.position.x = startX + drift;
          if (child.position.x > 35) {
            child.position.x -= range;
          }
        }
      });

      // Mountain mist drift
      mountainMist.children.forEach((child) => {
        if (child instanceof THREE.Sprite) {
          const phase = (child as any).phase || 0;
          const baseX = (child as any).baseX || child.position.x;
          const baseZ = (child as any).baseZ || child.position.z;
          child.position.x = baseX + Math.sin(time * 0.08 + phase) * 1.2;
          child.position.z = baseZ + Math.cos(time * 0.06 + phase) * 0.8;
          child.material.opacity = 0.5 + Math.sin(time * 0.2 + phase) * 0.12;
        }
      });

      // Trail markers bob/pulse and highlight active zone
      const activeZone = currentZoneRef.current;
      const trailT = Math.max(0, Math.min(1, scrollProgressRef.current));

      markersRef.current.forEach((m, i) => {
        const isActive = m.zone === activeZone;
        const dist = Math.abs(m.t - trailT);
        const nearby = dist < 0.35;
        const bobSpeed = isActive ? 2.5 : 1.2;
        const bobHeight = isActive ? 0.12 : 0.06;
        const phase = i * 1.1;

        m.sprite.position.y =
          m.basePosition.y + 0.85 + Math.sin(time * bobSpeed + phase) * bobHeight;
        m.ring.position.y =
          m.basePosition.y - 0.78 + Math.sin(time * bobSpeed + phase) * (bobHeight * 0.3);
        m.portal!.position.y =
          m.basePosition.y + 0.65 + Math.sin(time * bobSpeed + phase) * bobHeight;

        const ringMat = m.ring.material as THREE.MeshBasicMaterial;
        if (isActive) {
          ringMat.color.setHex(0xffc84e);
          ringMat.opacity = 0.85 + Math.sin(time * 4 + phase) * 0.15;
          m.sprite.material.opacity = 1;
          const s = 1 + Math.sin(time * 3 + phase) * 0.04;
          m.sprite.scale.set(1.5 * s, 0.66 * s, 1);

          m.portal!.material.opacity = 0.85 + Math.sin(time * 3 + phase) * 0.1;
          const ps = 1 + Math.sin(time * 2 + phase) * 0.06;
          m.portal!.scale.set(1.1 * ps, 1.1 * ps, 1);
        } else {
          ringMat.color.setHex(0x4ecdc4);
          ringMat.opacity = nearby
            ? 0.45 + Math.sin(time * 1.5 + phase) * 0.12
            : 0.35 + Math.sin(time * 1.2 + phase) * 0.08;
          m.sprite.material.opacity = nearby
            ? Math.max(0.35, 0.7 - dist * 1.0)
            : 0.45;
          m.sprite.scale.set(1.5, 0.66, 1);

          m.portal!.material.opacity = nearby
            ? Math.max(0.25, 0.55 - dist * 0.9)
            : 0.35;
          m.portal!.scale.set(1.1, 1.1, 1);
        }
      });

      // Compute the shared surface position for the traveling light and the
      // climber sprite so neither one tunnels through the mountain.
      const progress = Math.max(0, Math.min(1, scrollProgressRef.current));
      const pathCurve = pathCurveRef.current;
      const baseCampArc = baseCampArcRef.current;
      const center = mountainCenterRef.current;
      const arcEndProgress = 0.264;

      function minHorizontalRadius(angle: number): number {
        const ext = mountainExtentsRef.current;
        if (!ext) return 0;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return (
          1 /
          Math.sqrt(
            (cos * cos) / (ext.halfX * ext.halfX) +
              (sin * sin) / (ext.halfZ * ext.halfZ)
          )
        );
      }

      function pushToSurface(point: THREE.Vector3, margin = 0.3): THREE.Vector3 {
        const dx = point.x - center.x;
        const dz = point.z - center.z;
        const r = Math.sqrt(dx * dx + dz * dz);
        if (r < 0.001) return point;
        const angle = Math.atan2(dz, dx);
        const minR = minHorizontalRadius(angle) + margin;
        if (r < minR) {
          const scale = minR / r;
          point.x = center.x + dx * scale;
          point.z = center.z + dz * scale;
        }
        return point;
      }

      function getTravelerTarget(p: number): THREE.Vector3 | null {
        if (baseCampArc && p < arcEndProgress) {
          const t = Math.max(0, Math.min(1, p / arcEndProgress));
          const angle =
            baseCampArc.startAngle +
            (baseCampArc.gearAngle - baseCampArc.startAngle) * t;
          const baseRadius =
            baseCampArc.startRadius +
            (baseCampArc.gearRadius - baseCampArc.startRadius) * t;
          const radius = baseRadius + baseCampArc.bulge * Math.sin(Math.PI * t);
          const y =
            baseCampArc.start.y + (baseCampArc.gear.y - baseCampArc.start.y) * t;
          const point = new THREE.Vector3(
            center.x + Math.cos(angle) * radius,
            y,
            center.z + Math.sin(angle) * radius
          );
          return pushToSurface(point, 0.3);
        } else if (pathCurve) {
          let orbT: number;
          if (p < 0.264) {
            orbT = 0.06 + (p / 0.264) * 0.30;
          } else {
            orbT = 0.36 + ((p - 0.264) / 0.736) * 0.64;
          }
          const point = pathCurve
            .getPoint(Math.max(0.06, Math.min(1, orbT)))
            .clone();
          point.y += 0.5;
          return pushToSurface(point, 0.3);
        }
        return null;
      }

      const orbTarget = getTravelerTarget(progress);

      if (markerLight && orbTarget && !prefersReducedMotion) {
        markerLight.position.lerp(orbTarget, 0.08);
        markerLight.intensity = THREE.MathUtils.lerp(
          markerLight.intensity,
          1.5 + Math.sin(time * 3) * 0.3,
          0.08
        );
      } else if (markerLight) {
        markerLight.intensity = THREE.MathUtils.lerp(markerLight.intensity, 0, 0.06);
      }

      // The traveling light casts a narrow, subtle glow on nearby rock.
      if (orbGlow && markerLight) {
        orbGlow.position.copy(markerLight.position);
        orbGlow.intensity = THREE.MathUtils.lerp(
          orbGlow.intensity,
          orbTarget && !prefersReducedMotion ? 1.5 + Math.sin(time * 2) * 0.3 : 0,
          0.06
        );
      }

      // Climber sprite follows the same surface path as the traveling light
      const climber = climberRef.current;
      const trail = climberTrailRef.current;
      if (climber) {
        const pos = getTravelerTarget(progress);
        if (pos) {
          climber.position.copy(pos);

          // Trail particles
          if (trail && !prefersReducedMotion) {
            const positions = trail.geometry.attributes.position.array as Float32Array;
            const trailCount = positions.length / 3;
            for (let i = trailCount - 1; i > 0; i--) {
              positions[i * 3] = positions[(i - 1) * 3];
              positions[i * 3 + 1] = positions[(i - 1) * 3 + 1];
              positions[i * 3 + 2] = positions[(i - 1) * 3 + 2];
            }
            positions[0] = pos.x;
            positions[1] = pos.y - 0.1;
            positions[2] = pos.z;
            trail.geometry.attributes.position.needsUpdate = true;
          }
        }
      }

      // Summit flag particles
      const summitParticles = summitParticlesRef.current;
      if (summitParticles && !prefersReducedMotion) {
        const positions = summitParticles.geometry.attributes.position.array as Float32Array;
        const velocities = (summitParticles as any).velocities as number[];
        const lifes = (summitParticles as any).lifes as number[];
        const mat = summitParticles.material as THREE.PointsMaterial;
        let aliveCount = 0;
        for (let i = 0; i < lifes.length; i++) {
          lifes[i] -= 0.015;
          if (lifes[i] > 0) {
            positions[i * 3] += velocities[i * 3];
            positions[i * 3 + 1] += velocities[i * 3 + 1];
            positions[i * 3 + 2] += velocities[i * 3 + 2];
            aliveCount++;
          } else {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
          }
        }
        summitParticles.geometry.attributes.position.needsUpdate = true;
        mat.opacity = Math.max(0, (aliveCount / lifes.length) * 0.9);
      }

      // Camera shake
      if (cameraShake.active) {
        const age = time - cameraShake.startTime;
        if (age < cameraShake.duration) {
          const decay = 1 - age / cameraShake.duration;
          camera.position.x =
            cameraBasePosition.x + (Math.random() - 0.5) * 0.05 * decay;
          camera.position.y =
            cameraBasePosition.y + (Math.random() - 0.5) * 0.05 * decay;
          camera.position.z =
            cameraBasePosition.z + (Math.random() - 0.5) * 0.05 * decay;
        } else {
          cameraShake.active = false;
          camera.position.copy(cameraBasePosition);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      isCleanedUp = true;
      if (checkpointTimerRef.current) {
        clearTimeout(checkpointTimerRef.current);
      }
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", onResize);
      if (st) st.kill();
      renderer.dispose();
      bgRing.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      if (baseTerrain) {
        baseTerrain.geometry.dispose();
        (baseTerrain.material as THREE.Material).dispose();
      }
      aurora.children.forEach((c) => {
        if (c instanceof THREE.Mesh) {
          c.geometry.dispose();
          c.material.map?.dispose();
          c.material.dispose();
        }
      });
      if (mountainMesh) {
        mountainMesh.geometry.dispose();
        (mountainMesh.material as THREE.Material).dispose();
      }
      if (markerGroupRef.current) {
        scene.remove(markerGroupRef.current);
        markersRef.current.forEach((m) => {
          m.ring.geometry.dispose();
          (m.ring.material as THREE.Material).dispose();
          m.portal!.material.map?.dispose();
          (m.portal!.material as THREE.Material).dispose();
          m.sprite.material.map?.dispose();
          (m.sprite.material as THREE.Material).dispose();
        });
        markerGroupRef.current = null;
      }
      if (markerLight) {
        scene.remove(markerLight);
        markerLight.dispose();
      }

      if (moonLight) {
        scene.remove(moonLight.target);
        scene.remove(moonLight);
        moonLight.dispose();
      }
      if (orbGlow) {
        scene.remove(orbGlow);
        orbGlow.dispose();
      }
      markersRef.current = [];
      if (climberRef.current) {
        scene.remove(climberRef.current);
        climberRef.current.material.map?.dispose();
        climberRef.current.material.dispose();
        climberRef.current = null;
      }
      if (climberTrailRef.current) {
        scene.remove(climberTrailRef.current);
        climberTrailRef.current.geometry.dispose();
        (climberTrailRef.current.material as THREE.Material).dispose();
        climberTrailRef.current = null;
      }
      if (flagRef.current) {
        scene.remove(flagRef.current);
        flagRef.current.material.map?.dispose();
        flagRef.current.material.dispose();
        flagRef.current = null;
      }
      if (summitParticlesRef.current) {
        scene.remove(summitParticlesRef.current);
        summitParticlesRef.current.geometry.dispose();
        (summitParticlesRef.current.material as THREE.Material).dispose();
        summitParticlesRef.current = null;
      }
      effects.forEach((e) => e.dispose());
      effects.length = 0;
      scene.remove(reactionGroup);
      reactionGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        } else if (child instanceof THREE.Sprite) {
          child.material.map?.dispose();
          child.material.dispose();
        } else if (child instanceof THREE.Points) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      clouds.children.forEach((c) => {
        if (c instanceof THREE.Sprite) {
          c.material.map?.dispose();
          c.material.dispose();
        }
      });
      mountainMist.children.forEach((c) => {
        if (c instanceof THREE.Sprite) {
          c.material.map?.dispose();
          c.material.dispose();
        }
      });
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, []);

  // ─── Summit Flag Effect ─────────────────────────────────
  useEffect(() => {
    if (!summitReached || flagSpawnedRef.current) return;

    const scene = sceneRef.current;
    const pathCurve = pathCurveRef.current;
    if (!scene || !pathCurve) return;

    flagSpawnedRef.current = true;

    const summitPos = pathCurve.getPoint(1);
    summitPos.y += 1.2;

    const flagTexture = createFlagTexture();
    const flagMat = new THREE.SpriteMaterial({
      map: flagTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const flag = new THREE.Sprite(flagMat);
    flag.scale.set(1.6, 3.2, 1);
    flag.position.copy(summitPos);
    scene.add(flag);
    flagRef.current = flag;

    // Fade flag in
    gsap.to(flagMat, {
      opacity: 0.95,
      duration: 0.8,
      ease: "power2.out",
    });

    // Particle burst
    const burst = createSummitParticles(80);
    burst.position.copy(summitPos);
    scene.add(burst);
    summitParticlesRef.current = burst;
  }, [summitReached]);

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 z-0"
        style={{ background: "#201850" }}
      />
    </>
  );
});

export default Mountain3D;
