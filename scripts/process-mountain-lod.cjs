#!/usr/bin/env node
/**
 * Build script: generates mountain-low.bin, a decimated LOD variant of
 * mountain.bin for low-tier devices (CPU/software WebGL).
 *
 * Pipeline: gunzip → weld duplicate vertices → meshoptimizer simplify →
 * re-expand to the non-indexed triangle-soup format the runtime expects.
 * Trail/path points are copied verbatim from the source binary.
 *
 * Run: node scripts/process-mountain-lod.cjs
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { MeshoptSimplifier } = require("meshoptimizer");

const INPUT = path.join(__dirname, "../public/mountain.bin.gz");
const OUTPUT = path.join(__dirname, "../public/mountain-low.bin");

// Fraction of the original triangle count to keep in the LOD mesh.
const TARGET_RATIO = 0.08;

async function main() {
  await MeshoptSimplifier.ready;

  const gz = fs.readFileSync(INPUT);
  const buf = zlib.gunzipSync(gz);
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

  const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (magic !== "MTN\0") throw new Error("Invalid mountain binary");

  const vertexCount = view.getUint32(4, true);
  const pathCount = view.getUint32(8, true);
  const posOffset = 16;
  const positions = new Float32Array(buf.buffer, buf.byteOffset + posOffset, vertexCount * 3);
  console.log(`source: ${vertexCount} vertices (~${Math.round(vertexCount / 3)} tris), ${pathCount} path points`);

  // Trail points live after the position block — copy them verbatim.
  const pathOffset = posOffset + vertexCount * 3 * 4;
  const pathBytes = buf.subarray(pathOffset, pathOffset + pathCount * 12);

  // ── Weld duplicate vertices (STL soup → indexed mesh) ──────────────
  const weldMap = new Map();
  const weldedPositions = []; // flat f32 values
  const indices = new Uint32Array(vertexCount);
  for (let i = 0; i < vertexCount; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    const key = `${x},${y},${z}`;
    let idx = weldMap.get(key);
    if (idx === undefined) {
      idx = weldedPositions.length / 3;
      weldMap.set(key, idx);
      weldedPositions.push(x, y, z);
    }
    indices[i] = idx;
  }
  const uniqueCount = weldedPositions.length / 3;
  console.log(`welded: ${uniqueCount} unique vertices`);
  const vertexPositions = new Float32Array(weldedPositions);

  // ── Simplify ───────────────────────────────────────────────────────
  const targetIndexCount = Math.floor((vertexCount * TARGET_RATIO) / 3) * 3;
  const [resultIndices, error] = MeshoptSimplifier.simplify(
    indices,
    vertexPositions,
    3,
    targetIndexCount,
    0.05, // max deviation as a fraction of mesh extent — generous, stylized mesh
    ["LockBorder"]
  );
  const resultIndexCount = resultIndices.length;
  console.log(
    `simplified: ${resultIndexCount / 3} tris (target ${targetIndexCount / 3}), error ${(error * 100).toFixed(2)}%`
  );

  // ── Re-expand to non-indexed triangle soup ─────────────────────────
  const outVertexCount = resultIndexCount;
  const outPositions = new Float32Array(outVertexCount * 3);
  for (let i = 0; i < resultIndexCount; i++) {
    const src = resultIndices[i] * 3;
    outPositions[i * 3] = vertexPositions[src];
    outPositions[i * 3 + 1] = vertexPositions[src + 1];
    outPositions[i * 3 + 2] = vertexPositions[src + 2];
  }

  // ── Write binary (same format as process-mountain.cjs) ────────────
  const headerSize = 16;
  const out = Buffer.alloc(headerSize + outVertexCount * 3 * 4 + pathBytes.length);
  out.write("MTN\0", 0, "latin1");
  out.writeUInt32LE(outVertexCount, 4);
  out.writeUInt32LE(pathCount, 8);
  out.writeUInt32LE(1, 12); // version
  Buffer.from(outPositions.buffer, 0, outVertexCount * 3 * 4).copy(out, headerSize);
  Buffer.from(pathBytes).copy(out, headerSize + outVertexCount * 3 * 4);

  const compressed = zlib.gzipSync(out, { level: 9 });
  fs.writeFileSync(OUTPUT + ".gz", compressed);
  fs.writeFileSync(OUTPUT, out);
  console.log(
    `wrote ${OUTPUT} (${(out.length / 1e6).toFixed(1)} MB raw, ${(compressed.length / 1e6).toFixed(1)} MB gz)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
