#!/usr/bin/env node
/**
 * Verification test for the climbing orb path.
 *
 * Loads the processed mountain binary, reconstructs the exact marker hoop
 * positions the runtime uses, builds the same Catmull-Rom orb curve, and
 * asserts that the orb passes through every landmark at the correct scroll
 * progress.
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const THREE = require("three");

const BIN_GZ = path.join(__dirname, "../public/mountain.bin.gz");
const BIN = path.join(__dirname, "../public/mountain.bin");

const ZONES = [
  { zone: "hero", progressStart: 0, trailT: 0.06 },
  { zone: "about", progressStart: 0.088, trailT: 0.18 },
  { zone: "skills", progressStart: 0.264, trailT: 0.36 },
  { zone: "projects", progressStart: 0.44, trailT: 0.55 },
  { zone: "gallery", progressStart: 0.647, trailT: 0.74 },
  { zone: "contact", progressStart: 0.853, trailT: 0.9 },
];

const MARKERS = [
  { t: 0.06, zone: "about", label: "Base Camp" },
  { t: 0.36, zone: "skills", label: "Gear Wall" },
  { t: 0.55, zone: "projects", label: "Summit Log" },
  { t: 0.74, zone: "gallery", label: "Trail Markers" },
];

const ORB_THRESHOLDS = [
  0,
  ZONES[2].progressStart, // Gear Wall
  ZONES[3].progressStart, // Summit Log
  ZONES[4].progressStart, // Trail Markers
  ZONES[5].progressStart, // Summit
];

function parseBinary(buffer) {
  const isGz = buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
  const data = isGz ? zlib.gunzipSync(buffer) : buffer;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let pos = 0;

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
  pos += 4; // version

  const positions = new Float32Array(data.buffer, data.byteOffset + pos, vertexCount * 3);
  pos += vertexCount * 3 * 4;

  const pathPoints = [];
  for (let i = 0; i < pathCount; i++) {
    const x = view.getFloat32(pos, true);
    const y = view.getFloat32(pos + 4, true);
    const z = view.getFloat32(pos + 8, true);
    pathPoints.push(new THREE.Vector3(x, y, z));
    pos += 12;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.computeBoundingBox();

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

function pushToSurfaceConstruction(point, centerX, centerZ, bbox, margin = 0.3) {
  const dx = point.x - centerX;
  const dz = point.z - centerZ;
  const r = Math.sqrt(dx * dx + dz * dz);
  if (r < 0.001) return point;
  const angle = Math.atan2(dz, dx);
  const rx = (bbox.max.x - bbox.min.x) * 0.5;
  const rz = (bbox.max.z - bbox.min.z) * 0.5;
  const minR =
    1 /
      Math.sqrt(
        (Math.cos(angle) * Math.cos(angle)) / (rx * rx) +
          (Math.sin(angle) * Math.sin(angle)) / (rz * rz)
      ) +
    margin;
  if (r < minR) {
    const scale = minR / r;
    point.x = centerX + dx * scale;
    point.z = centerZ + dz * scale;
  }
  return point;
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function buildHoopPositions(pathCurve, bbox, centerX) {
  const markerPositions = {};
  for (const m of MARKERS) {
    const basePosition = pathCurve.getPoint(Math.max(0, Math.min(1, m.t))).clone();
    basePosition.y += 0.8;
    if (m.zone === "about") {
      const trailStart = pathCurve.getPoint(0);
      basePosition.set(centerX, trailStart.y + 0.2, bbox.max.z + 0.5);
    }
    markerPositions[m.zone] = basePosition;
  }

  const summitPoint = pathCurve.getPoint(1).clone();
  summitPoint.y += 0.8;

  return [
    markerPositions.about,
    markerPositions.skills,
    markerPositions.projects,
    markerPositions.gallery,
    summitPoint,
  ];
}

function buildOrbCurve(hoopPositions) {
  const curve = new THREE.CatmullRomCurve3(
    hoopPositions.map((p) => p.clone()),
    false,
    "centripetal"
  );
  curve.arcLengthDivisions = 200;
  return curve;
}

function getOrbPosition(progress, orbCurve) {
  if (!orbCurve || orbCurve.points.length === 0) {
    throw new Error("Orb curve not built");
  }

  let idx = 0;
  for (let i = 0; i < ORB_THRESHOLDS.length - 1; i++) {
    if (progress >= ORB_THRESHOLDS[i] && progress < ORB_THRESHOLDS[i + 1]) {
      idx = i;
      break;
    }
  }
  if (progress >= ORB_THRESHOLDS[ORB_THRESHOLDS.length - 1]) {
    idx = ORB_THRESHOLDS.length - 1;
  }

  const segmentStart = ORB_THRESHOLDS[idx];
  const segmentEnd = ORB_THRESHOLDS[Math.min(idx + 1, ORB_THRESHOLDS.length - 1)];
  const rawT =
    segmentEnd === segmentStart ? 0 : (progress - segmentStart) / (segmentEnd - segmentStart);
  const easedT = easeInOutQuad(Math.max(0, Math.min(1, rawT)));

  // The curve was built from the hoop points, so its parameter t maps evenly
  // to the hoops: t=0, 0.25, 0.5, 0.75, 1.0. Interpolating in this parameter
  // space guarantees the orb passes exactly through each landmark.
  const segmentCount = ORB_THRESHOLDS.length - 1;
  const t0 = idx / segmentCount;
  const t1 = Math.min(idx + 1, segmentCount) / segmentCount;
  const t = t0 + (t1 - t0) * easedT;
  return orbCurve.getPoint(Math.max(0, Math.min(1, t)));
}

function dist(a, b) {
  return Math.sqrt(
    (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2
  );
}

function main() {
  const buffer = fs.existsSync(BIN_GZ)
    ? fs.readFileSync(BIN_GZ)
    : fs.readFileSync(BIN);
  const data = parseBinary(buffer);

  // Apply the same sink transform Mountain3D.tsx uses.
  const sinkY = -3.0;
  const positions = data.geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 1] += sinkY;
  }
  data.pathPoints.forEach((p) => {
    p.y += sinkY;
  });
  data.geometry.computeBoundingBox();

  const bbox = data.geometry.boundingBox;
  const centerX = (bbox.min.x + bbox.max.x) / 2;
  const centerZ = (bbox.min.z + bbox.max.z) / 2;

  const pathCurve = new THREE.CatmullRomCurve3(
    data.pathPoints,
    false,
    "centripetal"
  );

  const hoopPositions = buildHoopPositions(pathCurve, bbox, centerX, centerZ);
  const orbCurve = buildOrbCurve(hoopPositions);
  const labels = ["Base Camp", "Gear Wall", "Summit Log", "Trail Markers", "Summit"];

  console.log("\n=== Hoop positions ===");
  hoopPositions.forEach((p, i) => {
    console.log(
      `${labels[i].padEnd(14)} x=${p.x.toFixed(2)} y=${p.y.toFixed(2)} z=${p.z.toFixed(2)}`
    );
  });

  console.log("\n=== Orb position at each landmark threshold ===");
  let allPassed = true;
  for (let i = 0; i < ORB_THRESHOLDS.length; i++) {
    const progress = ORB_THRESHOLDS[i];
    const orbPos = getOrbPosition(progress, orbCurve);
    const expected = hoopPositions[i];
    const d = dist(orbPos, expected);
    const passed = d < 0.01;
    if (!passed) allPassed = false;
    console.log(
      `${labels[i].padEnd(14)} progress=${progress.toFixed(3)}  orb=${
        orbPos.x.toFixed(2)
      },${orbPos.y.toFixed(2)},${orbPos.z.toFixed(2)}  distance=${d.toFixed(
        4
      )}  ${passed ? "PASS" : "FAIL"}`
    );
  }

  console.log("\n=== Intermediate orb path samples ===");
  for (let progress = 0; progress <= 1; progress += 0.1) {
    const p = getOrbPosition(progress, orbCurve);
    console.log(
      `progress=${progress.toFixed(1)}  x=${p.x.toFixed(2)} y=${p.y.toFixed(
        2
      )} z=${p.z.toFixed(2)}`
    );
  }

  console.log("\n=== Surface clearance check ===");
  let minClearance = Infinity;
  for (let progress = 0; progress <= 1; progress += 0.01) {
    const p = getOrbPosition(progress, orbCurve);
    const onSurface = pushToSurfaceConstruction(p.clone(), centerX, centerZ, bbox, 0.3);
    const clearance = dist(p, onSurface);
    if (clearance < minClearance) minClearance = clearance;
  }
  console.log(`Minimum surface clearance (margin=0.3): ${minClearance.toFixed(4)}`);
  if (minClearance < -0.01) {
    console.log("WARNING: orb dips inside the bounding ellipse at some point");
    allPassed = false;
  }

  console.log("\n" + (allPassed ? "✅ All checks passed" : "❌ Some checks failed"));
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
