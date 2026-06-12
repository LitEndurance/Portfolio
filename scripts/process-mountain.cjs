#!/usr/bin/env node
/**
 * Build script: processes mountain.stl → mountain.bin
 * - Centers, scales, rotates (Z-up → Y-up)
 * - Computes Celeste vertex colors
 * - Generates a ridge-following trail from base to summit
 * - Outputs a compressed-ready binary for fast runtime loading
 */

const fs = require("fs");
const path = require("path");
const THREE = require("three");
const { STLLoader } = require("three/examples/jsm/loaders/STLLoader.js");

const INPUT = path.join(__dirname, "../CelesteMountain_Completed.stl");
const OUTPUT = path.join(__dirname, "../public/mountain.bin");

const SKY_COLOR = 0x0d1b3a;

const rockShadow = new THREE.Color(0x1e2060);
const rockDark = new THREE.Color(0x2e4a80);
const rockMid = new THREE.Color(0x3e6a9a);
const rockLight = new THREE.Color(0x4e8ab0);
const rockHighlight = new THREE.Color(0x5eaac8);
const snowBase = new THREE.Color(0x90c0e0);
const snowBright = new THREE.Color(0xe8f4ff);
const snowPure = new THREE.Color(0xffffff);

function getVertexColor(y, minY, maxY) {
  const heightNorm = Math.min(1, Math.max(0, (y - minY) / (maxY - minY)));
  let color;
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

function applyCelesteColors(geometry) {
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  const minY = bbox.min.y;
  const maxY = bbox.max.y;
  const positions = geometry.attributes.position.array;
  const colors = new Float32Array(positions.length);

  for (let i = 0; i < positions.length; i += 3) {
    const y = positions[i + 1];
    const c = getVertexColor(y, minY, maxY);
    colors[i] = c.r;
    colors[i + 1] = c.g;
    colors[i + 2] = c.b;
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
}

function transformGeometry(geometry) {
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  const size = new THREE.Vector3();
  bbox.getSize(size);

  const positions = geometry.attributes.position.array;
  const targetHeight = 18;
  const scale = targetHeight / size.y;

  for (let i = 0; i < positions.length; i += 3) {
    const lx = (positions[i] - center.x) * scale;
    const ly = (positions[i + 1] - bbox.min.y) * scale;
    const lz = (positions[i + 2] - center.z) * scale;
    // Rotate -90° around X: (x, y, z) → (x, z, -y)
    positions[i] = lx;
    positions[i + 1] = lz;
    positions[i + 2] = -ly;
  }
  geometry.attributes.position.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();
}

function generateTrail(mesh, summitX, summitZ, summitY) {
  // Generate a smooth parametric ridge spiral that sweeps around the mountain
  // from the front/center base to the summit, matching the Celeste wallpaper's
  // glowing climb path. Using an analytic spiral guarantees a continuous,
  // jitter-free curve regardless of mesh noise or internal geometry.
  const positions = mesh.geometry.attributes.position.array;
  let minY = Infinity;
  for (let i = 1; i < positions.length; i += 3) {
    if (positions[i] < minY) minY = positions[i];
  }

  const bbox = mesh.geometry.boundingBox;
  const centerX = (bbox.min.x + bbox.max.x) / 2;
  const centerZ = (bbox.min.z + bbox.max.z) / 2;

  const pointCount = 250;
  const startAngle = -Math.PI / 2; // front-center base
  const endAngle = Math.atan2(summitZ - centerZ, summitX - centerX);
  let sweep = endAngle - startAngle;
  // About 2.5 clockwise turns so the path wraps around and finishes behind the summit
  while (sweep > -Math.PI * 2.35) sweep -= Math.PI * 2;
  while (sweep < -Math.PI * 2.65) sweep += Math.PI * 2;

  const startRadius = 8.2;
  const endRadius = 0.0;
  const startY = minY + 0.5;
  const endY = summitY;

  const points = [];
  for (let i = 0; i < pointCount; i++) {
    const t = i / (pointCount - 1);
    // Smooth height ease: slow start, gradual summit approach
    const ty = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    // Radius shrinks faster near the top
    const tr = t * t * (3 - 2 * t);

    const angle = startAngle + sweep * t;
    const radius = startRadius + (endRadius - startRadius) * tr;
    const y = startY + (endY - startY) * ty;
    const x = centerX + Math.cos(angle) * radius;
    const z = centerZ + Math.sin(angle) * radius;

    points.push(new THREE.Vector3(x, y + 0.12, z));
  }

  // Ensure exact summit at the end
  points[points.length - 1].set(summitX, summitY + 0.12, summitZ);

  return points;
}

function writeBinary(geometry, pathPoints, outPath) {
  const positions = geometry.attributes.position.array;
  const vertexCount = positions.length / 3;
  const pathCount = pathPoints.length;

  const headerSize = 16;
  const positionsSize = vertexCount * 3 * 4;
  const pathSize = pathCount * 3 * 4;
  const totalSize = headerSize + positionsSize + pathSize;

  const buffer = Buffer.alloc(totalSize);
  let offset = 0;

  // Magic "MTN\0"
  buffer.write("MTN\0", offset);
  offset += 4;

  // Vertex count
  buffer.writeUInt32LE(vertexCount, offset);
  offset += 4;

  // Path point count
  buffer.writeUInt32LE(pathCount, offset);
  offset += 4;

  // Version
  buffer.writeUInt32LE(1, offset);
  offset += 4;

  // Positions
  const posBuffer = Buffer.from(positions.buffer, positions.byteOffset, positionsSize);
  posBuffer.copy(buffer, offset);
  offset += positionsSize;

  // Path points
  for (let i = 0; i < pathCount; i++) {
    const p = pathPoints[i];
    buffer.writeFloatLE(p.x, offset);
    buffer.writeFloatLE(p.y, offset + 4);
    buffer.writeFloatLE(p.z, offset + 8);
    offset += 12;
  }

  // Gzip compress
  const zlib = require("zlib");
  const compressed = zlib.gzipSync(buffer, { level: 9 });
  fs.writeFileSync(outPath + ".gz", compressed);
  fs.writeFileSync(outPath, buffer); // also write raw for comparison
  console.log(`Wrote ${outPath} (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Wrote ${outPath}.gz (${(compressed.length / 1024 / 1024).toFixed(2)} MB)`);
}

async function main() {
  console.log("Loading STL...");
  const loader = new STLLoader();
  const buffer = fs.readFileSync(INPUT);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const geometry = loader.parse(arrayBuffer);
  console.log(`Loaded ${geometry.attributes.position.count} vertices`);

  console.log("Transforming geometry...");
  transformGeometry(geometry);
  applyCelesteColors(geometry);

  const mesh = new THREE.Mesh(geometry);
  mesh.geometry.computeBoundingBox();

  // Find summit
  const posArray = geometry.attributes.position.array;
  let highestY = -Infinity;
  let highestX = 0;
  let highestZ = 0;
  for (let i = 0; i < posArray.length; i += 3) {
    const vy = posArray[i + 1];
    if (vy > highestY) {
      highestY = vy;
      highestX = posArray[i];
      highestZ = posArray[i + 2];
    }
  }
  console.log(`Summit at (${highestX.toFixed(2)}, ${highestY.toFixed(2)}, ${highestZ.toFixed(2)})`);

  console.log("Generating trail...");
  const trail = generateTrail(mesh, highestX, highestZ, highestY);
  console.log(`Trail has ${trail.length} points`);

  console.log("Writing binary...");
  writeBinary(geometry, trail, OUTPUT);

  // Also write a JSON metadata file for convenience
  const meta = {
    vertexCount: geometry.attributes.position.count,
    pathPointCount: trail.length,
    summit: { x: highestX, y: highestY, z: highestZ },
    boundingBox: {
      min: mesh.geometry.boundingBox.min,
      max: mesh.geometry.boundingBox.max,
    },
  };
  fs.writeFileSync(
    path.join(__dirname, "../public/mountain-meta.json"),
    JSON.stringify(meta, null, 2)
  );

  console.log("Done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
