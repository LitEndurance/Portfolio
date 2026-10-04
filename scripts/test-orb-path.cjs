#!/usr/bin/env node
/**
 * Verification test for the climbing orb / marker hoop routes.
 *
 * Each page climbs the shared mountain on its own route:
 *   - /infrastructure: src/components/hoopRoutes/infrastructure.json with the
 *     zone thresholds in src/components/zoneConfig.ts
 *   - /websites: src/components/hoopRoutes/websites.json with the stop
 *     thresholds in src/components/websitesZoneConfig.ts
 *
 * Loads the processed mountain binaries (full + low LOD), rasterizes them into
 * a top-down heightmap, rebuilds the exact Catmull-Rom route the runtime uses
 * for each trail, and asserts that:
 *   1. every stop maps to a section id on its page, stops are in scroll order,
 *      and every hoop is tagged with one of its trail's stops,
 *   2. the orb passes through every hoop at its stop's scroll threshold,
 *   3. each hoop's flat ring rests on (not inside) the rock and the hoop does
 *      not float far above it,
 *   4. the orb path never dips into the terrain between hoops,
 *   5. hoops are reasonably evenly spaced along the path,
 * and finally that the two routes stay apart everywhere except the summit
 * they share.
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const THREE = require("three");

const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

// Stop thresholds are read straight from the config sources so this check
// can't drift from the real config.
function parseStops(rel, idKey) {
  const re = new RegExp(`${idKey}:\\s*"(\\w+)"[\\s\\S]*?progressStart:\\s*([\\d.]+)`, "g");
  return [...read(rel).matchAll(re)].map((m) => ({ id: m[1], progressStart: parseFloat(m[2]) }));
}

const TRAILS = [
  {
    name: "infrastructure",
    route: require("../src/components/hoopRoutes/infrastructure.json").points,
    stops: parseStops("src/components/zoneConfig.ts", "zone"),
    expectedStops: 6,
    // Where the page's section ids are declared.
    sectionSources: ["src/app/infrastructure/page.tsx"],
  },
  {
    name: "websites",
    route: require("../src/components/hoopRoutes/websites.json").points,
    stops: parseStops("src/components/websitesZoneConfig.ts", "id"),
    expectedStops: 7,
    sectionSources: ["src/components/sites/SitesHero.tsx", "src/content/sites.ts"],
  },
];

const SINK_Y = -3.0; // Mountain3D translates the mesh down by this much
const HOOP_LIFT = 0.8; // marker ring is drawn ~0.78 below the hoop center
const MIN_PATH_CLEARANCE = 0.3;
const MAX_HOOP_FLOAT = 1.25;
// Route separation: both trails finish on the same summit, so ignore points
// within this radius of it; elsewhere the curves must stay this far apart.
const SHARED_SUMMIT_RADIUS = 1.5;
const MIN_ROUTE_SEPARATION = 1.0;
const MIN_HOOP_TO_OTHER_ROUTE = 1.5;

// Base terrain plane around the mountain (createBaseTerrain): y = -10.55,
// mesh offset -0.2, plus up to ~0.15 of noise.
const BASE_PLANE_Y = -10.6;

// ── Heightmap ────────────────────────────────────────────────────────────
const RES = 0.1;
const X0 = -9.3;
const Z0 = -18.05;
const NX = 187;
const NZ = 182;

function readPositions(name) {
  const candidates = [`${name}.bin.gz`, `${name}.bin`].map((f) => path.join(PUBLIC, f));
  const file = candidates.find((f) => fs.existsSync(f));
  if (!file) return null;
  const raw = fs.readFileSync(file);
  const data = raw[0] === 0x1f && raw[1] === 0x8b ? zlib.gunzipSync(raw) : raw;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const magic = String.fromCharCode(data[0], data[1], data[2], data[3]);
  if (magic !== "MTN\0") throw new Error(`Invalid mountain binary: ${file}`);
  const vertexCount = view.getUint32(4, true);
  const positions = new Float32Array(vertexCount * 3);
  for (let i = 0; i < vertexCount * 3; i++) positions[i] = view.getFloat32(16 + i * 4, true);
  return positions;
}

// Rasterize every triangle into a max-height grid (top surface of the mesh).
function buildHeightmap(names) {
  const H = new Float32Array(NX * NZ).fill(-Infinity);
  for (const name of names) {
    const P = readPositions(name);
    if (!P) continue;
    for (let t = 0; t + 8 < P.length; t += 9) {
      const ax = P[t], ay = P[t + 1] + SINK_Y, az = P[t + 2];
      const bx = P[t + 3], by = P[t + 4] + SINK_Y, bz = P[t + 5];
      const cx = P[t + 6], cy = P[t + 7] + SINK_Y, cz = P[t + 8];
      const det = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
      const minX = Math.max(0, Math.ceil((Math.min(ax, bx, cx) - X0) / RES));
      const maxX = Math.min(NX - 1, Math.floor((Math.max(ax, bx, cx) - X0) / RES));
      const minZ = Math.max(0, Math.ceil((Math.min(az, bz, cz) - Z0) / RES));
      const maxZ = Math.min(NZ - 1, Math.floor((Math.max(az, bz, cz) - Z0) / RES));
      if (Math.abs(det) > 1e-12) {
        for (let iz = minZ; iz <= maxZ; iz++) {
          for (let ix = minX; ix <= maxX; ix++) {
            const x = X0 + ix * RES;
            const z = Z0 + iz * RES;
            const l1 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / det;
            const l2 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / det;
            const l3 = 1 - l1 - l2;
            if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
            const y = l1 * ay + l2 * by + l3 * cy;
            const k = iz * NX + ix;
            if (y > H[k]) H[k] = y;
          }
        }
      }
      for (const [x, y, z] of [[ax, ay, az], [bx, by, bz], [cx, cy, cz]]) {
        const ix = Math.round((x - X0) / RES);
        const iz = Math.round((z - Z0) / RES);
        if (ix < 0 || iz < 0 || ix >= NX || iz >= NZ) continue;
        const k = iz * NX + ix;
        if (y > H[k]) H[k] = y;
      }
    }
  }
  return H;
}

function makeTerrain(H) {
  const cell = (x, z) => {
    const ix = Math.round((x - X0) / RES);
    const iz = Math.round((z - Z0) / RES);
    if (ix < 0 || iz < 0 || ix >= NX || iz >= NZ) return BASE_PLANE_Y;
    return Math.max(H[iz * NX + ix], BASE_PLANE_Y);
  };
  // Highest ground within radius r of (x, z).
  return (x, z, r = 0) => {
    const n = Math.ceil(r / RES);
    let m = -Infinity;
    for (let a = -n; a <= n; a++) {
      for (let b = -n; b <= n; b++) {
        if (a * a + b * b > n * n) continue;
        m = Math.max(m, cell(x + a * RES, z + b * RES));
      }
    }
    return m;
  };
}

// ── Route (mirrors Mountain3D.tsx / trails.ts) ──────────────────────────
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function buildTrail(trail) {
  const route = trail.route;
  const curve = new THREE.CatmullRomCurve3(
    route.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
    false,
    "centripetal"
  );
  curve.arcLengthDivisions = 200;
  const hoopIndices = route.flatMap((p, i) => (p.hoop ? [i] : []));
  const hoopCurveT = hoopIndices.map((i) => i / (route.length - 1));
  // First hoop is the trailhead (progress 0); every later hoop is reached
  // when its stop begins (orbThresholds in trails.ts).
  const thresholds = hoopIndices.map((i, k) => {
    if (k === 0) return 0;
    const stop = trail.stops.find((s) => s.id === route[i].hoop);
    return stop ? stop.progressStart : NaN;
  });

  function getOrbPosition(progress) {
    let idx = 0;
    for (let i = 0; i < thresholds.length - 1; i++) {
      if (progress >= thresholds[i] && progress < thresholds[i + 1]) {
        idx = i;
        break;
      }
    }
    if (progress >= thresholds[thresholds.length - 1]) idx = thresholds.length - 1;
    const s = thresholds[idx];
    const e = thresholds[Math.min(idx + 1, thresholds.length - 1)];
    const rawT = e === s ? 0 : (progress - s) / (e - s);
    const t0 = hoopCurveT[idx];
    const t1 = hoopCurveT[Math.min(idx + 1, hoopCurveT.length - 1)];
    const t = t0 + (t1 - t0) * easeInOutQuad(Math.max(0, Math.min(1, rawT)));
    return curve.getPoint(Math.max(0, Math.min(1, t)));
  }

  return { ...trail, curve, hoopIndices, hoopCurveT, thresholds, getOrbPosition };
}

const nameOf = (p) => p.label || p.hoop;

function checkTrail(t, terrain, fail) {
  const route = t.route;
  console.log(`\n################ ${t.name} trail ################`);

  console.log("\n=== Stops ===");
  if (t.stops.length !== t.expectedStops) {
    fail(`${t.name}: expected ${t.expectedStops} stops, found ${t.stops.length}`);
  }
  const sectionSrc = t.sectionSources.map(read).join("\n");
  t.stops.forEach((s, i) => {
    const declared = new RegExp(`id(=|:\\s*)"${s.id}"`).test(sectionSrc);
    const ordered = i === 0 ? s.progressStart === 0 : s.progressStart > t.stops[i - 1].progressStart;
    console.log(
      `${s.id.padEnd(10)} progressStart=${s.progressStart.toFixed(3)} section=${declared ? "found" : "MISSING"} ` +
        `${declared && ordered ? "PASS" : "FAIL"}`
    );
    if (!declared) fail(`${t.name}: no section with id "${s.id}" on the page`);
    if (!ordered) fail(`${t.name}: stop ${s.id} is out of scroll order`);
  });
  for (const i of t.hoopIndices) {
    if (!t.stops.some((s) => s.id === route[i].hoop)) {
      fail(`${t.name}: hoop "${route[i].hoop}" is not a stop on this trail`);
    }
  }
  const lastHoop = route[t.hoopIndices[t.hoopIndices.length - 1]].hoop;
  if (lastHoop !== t.stops[t.stops.length - 1].id) {
    fail(`${t.name}: the summit hoop should belong to the last stop (${t.stops[t.stops.length - 1].id}), not ${lastHoop}`);
  }

  console.log("\n=== Hoops ===");
  t.hoopIndices.forEach((i, k) => {
    const p = route[i];
    const ground = terrain(p.x, p.z, 0.45);
    const float = p.y - HOOP_LIFT - ground;
    const orb = t.getOrbPosition(t.thresholds[k]);
    const d = orb.distanceTo(new THREE.Vector3(p.x, p.y, p.z));
    const ok = d < 0.01 && float > -0.1 && float < MAX_HOOP_FLOAT;
    console.log(
      `${nameOf(p).padEnd(14)} progress=${t.thresholds[k].toFixed(3)} ` +
        `pos=(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}) ring-above-ground=${float.toFixed(2)} ` +
        `orb-distance=${d.toFixed(4)}  ${ok ? "PASS" : "FAIL"}`
    );
    if (!(d < 0.01)) fail(`${t.name}: orb misses ${nameOf(p)} by ${d.toFixed(3)}`);
    if (float <= -0.1) fail(`${t.name}: ${nameOf(p)} ring is buried ${(-float).toFixed(2)} into the rock`);
    if (float >= MAX_HOOP_FLOAT) fail(`${t.name}: ${nameOf(p)} floats ${float.toFixed(2)} above the rock`);
  });

  console.log("\n=== Path clearance ===");
  let worst = { c: Infinity };
  for (let i = 0; i <= 1000; i++) {
    const v = t.curve.getPoint(i / 1000);
    const c = v.y - terrain(v.x, v.z, 0.25);
    if (c < worst.c) worst = { c, v, t: i / 1000 };
  }
  console.log(
    `Minimum orb clearance above terrain: ${worst.c.toFixed(3)} at t=${worst.t.toFixed(3)} ` +
      `(${worst.v.x.toFixed(2)}, ${worst.v.y.toFixed(2)}, ${worst.v.z.toFixed(2)})`
  );
  if (worst.c < MIN_PATH_CLEARANCE) fail(`${t.name}: orb path dips to ${worst.c.toFixed(2)} (< ${MIN_PATH_CLEARANCE})`);

  console.log("\n=== Spacing ===");
  const lengths = [];
  for (let k = 0; k < t.hoopCurveT.length - 1; k++) {
    const a = t.hoopCurveT[k];
    const b = t.hoopCurveT[k + 1];
    let L = 0;
    let prev = t.curve.getPoint(a);
    for (let s = 1; s <= 200; s++) {
      const v = t.curve.getPoint(a + ((b - a) * s) / 200);
      L += v.distanceTo(prev);
      prev = v;
    }
    lengths.push(L);
    console.log(`${nameOf(route[t.hoopIndices[k]])} → ${nameOf(route[t.hoopIndices[k + 1]])}: ${L.toFixed(2)}`);
  }
  const ratio = Math.max(...lengths) / Math.min(...lengths);
  console.log(`Longest / shortest leg: ${ratio.toFixed(2)}`);
  if (ratio > 2.5) fail(`${t.name}: hoop spacing is uneven (ratio ${ratio.toFixed(2)})`);

  console.log("\n=== Orb samples ===");
  for (let progress = 0; progress <= 1.0001; progress += 0.1) {
    const p = t.getOrbPosition(progress);
    console.log(`progress=${progress.toFixed(1)}  x=${p.x.toFixed(2)} y=${p.y.toFixed(2)} z=${p.z.toFixed(2)}`);
  }
}

// The two routes may only meet at the summit they share; everywhere else
// they should stay visibly apart so each page reads as its own trail.
function checkSeparation(a, b, fail) {
  console.log(`\n################ ${a.name} vs ${b.name} ################`);
  const summit = new THREE.Vector3().copy(a.curve.getPoint(1));
  const A = a.curve.getSpacedPoints(800);
  const B = b.curve.getSpacedPoints(800);
  const nearSummit = (v) => v.distanceTo(summit) < SHARED_SUMMIT_RADIUS;
  let worst = { d: Infinity };
  for (const p of A) {
    if (nearSummit(p)) continue;
    for (const q of B) {
      if (nearSummit(q)) continue;
      const d = p.distanceTo(q);
      if (d < worst.d) worst = { d, p, q };
    }
  }
  const fmt = (v) => `(${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`;
  console.log(
    `Closest approach outside the shared summit (r=${SHARED_SUMMIT_RADIUS}): ${worst.d.toFixed(2)} ` +
      `between ${fmt(worst.p)} and ${fmt(worst.q)}  ${worst.d >= MIN_ROUTE_SEPARATION ? "PASS" : "FAIL"}`
  );
  if (worst.d < MIN_ROUTE_SEPARATION) {
    fail(`routes come within ${worst.d.toFixed(2)} of each other (< ${MIN_ROUTE_SEPARATION})`);
  }
  for (const [t, other] of [[a, B], [b, A]]) {
    for (const i of t.hoopIndices.slice(0, -1)) {
      const p = t.route[i];
      const v = new THREE.Vector3(p.x, p.y, p.z);
      const d = Math.min(...other.map((q) => q.distanceTo(v)));
      const ok = d >= MIN_HOOP_TO_OTHER_ROUTE;
      console.log(`${t.name} hoop ${nameOf(p).padEnd(14)} distance to the other route: ${d.toFixed(2)}  ${ok ? "PASS" : "FAIL"}`);
      if (!ok) fail(`${t.name} hoop ${nameOf(p)} sits ${d.toFixed(2)} from the other trail's route`);
    }
  }
}

function main() {
  let allPassed = true;
  const fail = (msg) => {
    allPassed = false;
    console.log(`  FAIL ${msg}`);
  };

  console.log("Rasterizing mountain heightmap…");
  const terrain = makeTerrain(buildHeightmap(["mountain", "mountain-low"]));

  const trails = TRAILS.map(buildTrail);
  for (const t of trails) checkTrail(t, terrain, fail);
  checkSeparation(trails[0], trails[1], fail);

  console.log("\n" + (allPassed ? "✅ All checks passed" : "❌ Some checks failed"));
  process.exit(allPassed ? 0 : 1);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
