// Converts the raw trimesh export (Z-up, positions only, no material) into a
// glTF-conformant avatar: Y-up, feet on the ground, smooth normals, PBR material.
// Usage: node scripts/fix-avatar.mjs [input.glb] [output.glb]
import { readFileSync, writeFileSync } from "node:fs";

const [input = "anny_default.glb", output = "assets/avatar.glb"] = process.argv.slice(2);

const glb = readFileSync(input);
const jsonLength = glb.readUInt32LE(12);
const gltf = JSON.parse(glb.subarray(20, 20 + jsonLength).toString());
const binStart = 20 + jsonLength + 8;
const bin = glb.subarray(binStart);

const prim = gltf.meshes[0].primitives[0];
const read = (accessorIndex, Type) => {
  const accessor = gltf.accessors[accessorIndex];
  const view = gltf.bufferViews[accessor.bufferView];
  const size = { SCALAR: 1, VEC3: 3 }[accessor.type];
  const offset = (view.byteOffset || 0) + (accessor.byteOffset || 0);
  return new Type(bin.buffer.slice(bin.byteOffset + offset, bin.byteOffset + offset + accessor.count * size * Type.BYTES_PER_ELEMENT));
};

const indices = read(prim.indices, Uint32Array);
const source = read(prim.attributes.POSITION, Float32Array);
const count = source.length / 3;

// Z-up → Y-up: rotate -90° about X so (x, y, z) → (x, z, -y). Front (-Y) becomes +Z.
const positions = new Float32Array(source.length);
for (let i = 0; i < count; i++) {
  positions[i * 3] = source[i * 3];
  positions[i * 3 + 1] = source[i * 3 + 2];
  positions[i * 3 + 2] = -source[i * 3 + 1];
}

// Stand on y = 0 and center horizontally.
const min = [Infinity, Infinity, Infinity];
const max = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < positions.length; i++) {
  min[i % 3] = Math.min(min[i % 3], positions[i]);
  max[i % 3] = Math.max(max[i % 3], positions[i]);
}
const shift = [-(min[0] + max[0]) / 2, -min[1], -(min[2] + max[2]) / 2];
for (let i = 0; i < positions.length; i++) positions[i] += shift[i % 3];
for (let a = 0; a < 3; a++) { min[a] += shift[a]; max[a] += shift[a]; }

// Area-weighted smooth vertex normals.
const normals = new Float32Array(positions.length);
for (let t = 0; t < indices.length; t += 3) {
  const [a, b, c] = [indices[t] * 3, indices[t + 1] * 3, indices[t + 2] * 3];
  const e1 = [positions[b] - positions[a], positions[b + 1] - positions[a + 1], positions[b + 2] - positions[a + 2]];
  const e2 = [positions[c] - positions[a], positions[c + 1] - positions[a + 1], positions[c + 2] - positions[a + 2]];
  const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
  for (const v of [a, b, c]) for (let k = 0; k < 3; k++) normals[v + k] += n[k];
}
for (let i = 0; i < normals.length; i += 3) {
  const len = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
  normals[i] /= len; normals[i + 1] /= len; normals[i + 2] /= len;
}

// Assemble the new binary chunk: indices | positions | normals.
const chunks = [indices, positions, normals].map((arr) => Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength));
let cursor = 0;
const bufferViews = chunks.map((chunk, i) => {
  const view = { buffer: 0, byteOffset: cursor, byteLength: chunk.length, target: i === 0 ? 34963 : 34962 };
  cursor += chunk.length;
  return view;
});

const out = {
  asset: { version: "2.0", generator: "outfitted/scripts/fix-avatar.mjs" },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ name: "avatar", mesh: 0 }],
  meshes: [{ name: "avatar", primitives: [{ attributes: { POSITION: 1, NORMAL: 2 }, indices: 0, material: 0, mode: 4 }] }],
  materials: [{
    name: "skin",
    pbrMetallicRoughness: { baseColorFactor: [0.86, 0.72, 0.64, 1], metallicFactor: 0, roughnessFactor: 0.62 },
  }],
  accessors: [
    { bufferView: 0, componentType: 5125, count: indices.length, type: "SCALAR", min: [0], max: [count - 1] },
    { bufferView: 1, componentType: 5126, count, type: "VEC3", min, max },
    { bufferView: 2, componentType: 5126, count, type: "VEC3" },
  ],
  bufferViews,
  buffers: [{ byteLength: cursor }],
};

const pad = (buf, fill) => Buffer.concat([buf, Buffer.alloc((4 - (buf.length % 4)) % 4, fill)]);
const jsonChunk = pad(Buffer.from(JSON.stringify(out)), 0x20);
const binChunk = pad(Buffer.concat(chunks), 0);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);
const chunkHeader = (len, type) => { const h = Buffer.alloc(8); h.writeUInt32LE(len, 0); h.writeUInt32LE(type, 4); return h; };

writeFileSync(output, Buffer.concat([header, chunkHeader(jsonChunk.length, 0x4e4f534a), jsonChunk, chunkHeader(binChunk.length, 0x004e4942), binChunk]));
console.log(`Wrote ${output}: ${count} vertices, height ${(max[1] - min[1]).toFixed(2)}m`);
