import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { wildlife } from "./wildlife";
import { createWildlifeAnimator, parkSafariJeep } from "./wildlifeAnimation";

const realLeavesSal = "/globe-kit/real-leaves-sal.png";
const realLeavesSalGreen = "/globe-kit/real-leaves-sal-green.png";
const realLeavesTeak = "/globe-kit/real-leaves-teak.png";
const realBamboo = "/globe-kit/real-bamboo.png";
const realBark = "/globe-kit/real-bark.jpg";
const realForestFloor = "/globe-kit/real-forest-floor.jpg";
const realForestFloorRed = "/globe-kit/real-forest-floor-red.jpg";
const realBarkSal = "/globe-kit/real-bark-sal.jpg";
const realBarkTrunk = "/globe-kit/real-bark-trunk.jpg";
const realRiverSand = "/globe-kit/real-river-sand.jpg";
const realRiverWater = "/globe-kit/real-river-water.jpg";
const realGrass = "/globe-kit/real-grass.png";

// Destination ecosystems, each with its own terrain, water, plant species,
// rocks and native wildlife. Built imperatively into THREE.Groups; the group's
// userData.update(time, camera) drives wind, water flow, birds and wildlife.
export type Biome = "forest" | "volcanic" | "savannah" | "arctic";

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number, oct = 5) {
  let s = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += amp * noise(x * f, y * f); f *= 2; amp *= 0.5; }
  return s;
}
const smooth = (a: number, b: number, v: number) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const rand = (seed: number) => hash(seed, seed * 0.37 + 1.3);

export const WATER: Record<Biome, number | null> = { forest: -2.6, volcanic: -1.5, savannah: 0.6, arctic: -1.5 };
const riverX = (z: number) => 18 * Math.sin(z * 0.028) + 6;

export const CLEARING = [12, -80] as const;
export function heightAt(biome: Biome, x: number, z: number) {
  switch (biome) {
    case "forest": {
      const far = smooth(-30, -120, z);
      let h = fbm(x * 0.018, z * 0.018) * 16 - 2 + far * fbm(x * 0.012 + 9, z * 0.012, 4) * 70;
      // Open meadow where the sunrise safari jeep watches wildlife.
      h = THREE.MathUtils.lerp(h, 0.4, 1 - smooth(16, 30, Math.hypot(x - CLEARING[0], (z - CLEARING[1]) * 0.7)));
      // Open the far valley so the sunrise is seen rising between the two ridges.
    h = THREE.MathUtils.lerp(h, Math.min(h, 3), (1 - smooth(18, 55, Math.abs(x - riverX(z)))) * smooth(95, 135, -z));
    const d = Math.abs(x - riverX(z));
      return THREE.MathUtils.lerp(-4.2, Math.max(h, -1), smooth(2.5, 11, d)); // river valley
    }
    case "volcanic": {
      const isl: [number, number, number, number][] = [[-20, -30, 38, 22], [35, -70, 30, 16], [-55, -100, 26, 12], [10, 20, 18, 7]];
      let h = -4;
      for (const [cx, cz, r, peakH] of isl) {
        const d = Math.hypot(x - cx, z - cz) / r;
        const crater = peakH > 15 ? -6 * Math.exp(-d * d * 40) : 0;
        h = Math.max(h, peakH * Math.exp(-d * d * 2) + crater - 3 + fbm(x * 0.09, z * 0.09, 4) * 3.5 * Math.exp(-d * d));
      }
      return h;
    }
    case "savannah": {
      const edge = smooth(-70, -150, z);
      const h = fbm(x * 0.01, z * 0.01, 4) * 6 + edge * fbm(x * 0.02 + 3, z * 0.02, 4) * 30;
      const pond = Math.hypot((x + 14) / 1.6, z + 22);
      return THREE.MathUtils.lerp(-0.6, h, smooth(4, 12, pond));
    }
    case "arctic": {
      const r = 1 - Math.abs(fbm(x * 0.015, z * 0.015, 5) * 2 - 1);
      const valley = smooth(10, 45, Math.abs(x + Math.sin(z * 0.02) * 15));
      return r * r * 60 * valley - 5 + valley * 4;
    }
  }
}

type Stop = [number, string];
const palettes: Record<Biome, Stop[]> = {
  // Kanha monsoon: pale sand by the river, then near-neutral tints so the
  // red-soil-and-green-grass floor photograph shows its own colours.
  forest: [[-4.2, "#cbbd97"], [-2, "#dccfa8"], [-0.6, "#c2c4a4"], [6, "#aebd9e"], [16, "#a4b795"], [32, "#a9b096"], [60, "#b8b5a4"]],
  volcanic: [[-4, "#1e3238"], [-1.8, "#c2b08a"], [-0.8, "#3b3532"], [3, "#2b2725"], [7, "#4a4a30"], [16, "#2a2523"]],
  savannah: [[-0.6, "#5e4b32"], [0.8, "#8a6f45"], [1.5, "#c9a35b"], [5, "#b89552"], [12, "#9a7d48"], [24, "#7a6c52"], [36, "#8d8578"]],
  arctic: [[-5, "#3a434c"], [-1, "#55524a"], [1.5, "#6c7a5a"], [5, "#7d858d"], [11, "#dfe7ee"], [30, "#f6f9fc"]],
};
function colorAt(stops: Stop[], h: number, out: THREE.Color) {
  let prev = stops[0]!;
  if (h <= prev[0]) return out.set(prev[1]);
  for (const cur of stops.slice(1)) {
    if (h <= cur[0]) return out.set(prev[1]).lerp(new THREE.Color(cur[1]), (h - prev[0]) / (cur[0] - prev[0]));
    prev = cur;
  }
  return out.set(prev[1]);
}

export const atmosphere: Record<Biome, { sky: string; fogNear: number; fogFar: number; sun: string; sunI: number; ground: string }> = {
  // Cool misty morning light like the Kanha sal forest at dawn.
  forest: { sky: "#b9c5ad", fogNear: 16, fogFar: 135, sun: "#f2ead2", sunI: 2.2, ground: "#4a5340" },
  volcanic: { sky: "#a6c3d1", fogNear: 60, fogFar: 260, sun: "#fff3dc", sunI: 2.6, ground: "#2b3a3d" },
  savannah: { sky: "#e4c48c", fogNear: 45, fogFar: 230, sun: "#ffcf80", sunI: 2.9, ground: "#5a4526" },
  arctic: { sky: "#c3d0db", fogNear: 25, fogFar: 190, sun: "#e6f0ff", sunI: 1.9, ground: "#4a5866" },
};

// ---------- textures ----------
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  if (g) draw(g);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// A cluster of individual leaves on a transparent card.
function leafTex(colors: string[], leafW: number, leafH: number, count: number, seed: number) {
  return crisp(canvasTex(256, 256, (g) => {
    for (let i = 0; i < count; i++) {
      const a = rand(seed + i) * Math.PI * 2, r = Math.sqrt(rand(seed + i * 3.1)) * 110;
      const x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r;
      g.save(); g.translate(x, y); g.rotate(rand(seed + i * 7.3) * Math.PI * 2);
      g.fillStyle = colors[Math.floor(rand(seed + i * 1.7) * colors.length)]!;
      g.beginPath(); g.ellipse(0, 0, leafW * (0.7 + rand(i) * 0.6), leafH, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    }
  }));
}
// No mipmaps on cut-out foliage so distant leaves don't fade to nothing.
function crisp(t: THREE.Texture) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; return t; }
// Photorealistic generated textures for the India forest.
function imageTex(url: string, repeat = false, crispEdges = true) {
  const t = new THREE.TextureLoader().load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return crispEdges ? crisp(t) : t;
}
function grassTex(colors: string[], seed: number) {
  return canvasTex(128, 128, (g) => {
    for (let i = 0; i < 70; i++) {
      const x = 64 + (rand(seed + i) - 0.5) * 70, lean = (rand(seed + i * 2) - 0.5) * 30;
      g.strokeStyle = colors[i % colors.length]!; g.lineWidth = 2.5 + rand(i) * 2;
      g.beginPath(); g.moveTo(x, 128); g.quadraticCurveTo(x + lean * 0.3, 70, x + lean, 10 + rand(seed + i * 5) * 50); g.stroke();
    }
  });
}
function barkTex(base: string, line: string) {
  const t = canvasTex(64, 256, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 40; i++) { g.strokeStyle = line; g.globalAlpha = 0.4; g.lineWidth = 1 + rand(i) * 2; const x = rand(i * 3) * 64; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (rand(i * 5) - 0.5) * 10, 256); g.stroke(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function waterNormal() {
  const size = 128;
  const t = canvasTex(size, size, (g) => {
    const img = g.createImageData(size, size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const f = (u: number, v: number) => fbm(u / 16, v / 16, 3);
      const dx = f(x + 1, y) - f(x - 1, y), dy = f(x, y + 1) - f(x, y - 1);
      const i = (y * size + x) * 4;
      img.data[i] = 128 + dx * 600; img.data[i + 1] = 128 + dy * 600; img.data[i + 2] = 255; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }, false);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(30, 30);
  return t;
}

// Leaves sway with the wind: a small vertex offset scaled by local height.
type Wind = { value: number };
function windMaterial(params: THREE.MeshStandardMaterialParameters, wind: Wind, strength: number, lift = 0) {
  const m = new THREE.MeshStandardMaterial({ alphaTest: 0.6, side: THREE.DoubleSide, roughness: 0.85, ...params });
  // A soft self-illumination lift keeps photo-real leaves readable in shade instead of going black.
  if (lift > 0 && params.map instanceof THREE.Texture) { m.emissive = new THREE.Color("#ffffff"); m.emissiveMap = params.map; m.emissiveIntensity = lift; }
  m.onBeforeCompile = (s) => {
    s.uniforms["uTime"] = wind;
    s.vertexShader = s.vertexShader.replace("#include <common>", "#include <common>\nuniform float uTime;").replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
      vec3 ip = instanceMatrix[3].xyz;
      #else
      vec3 ip = vec3(0.0);
      #endif
      float sway = sin(uTime * 1.3 + ip.x * 0.15 + ip.z * 0.11) * ${strength.toFixed(3)} * max(position.y, 0.0);
      transformed.x += sway; transformed.z += sway * 0.6;`,
    );
  };
  return m;
}

// ---------- geometry helpers ----------
const up = new THREE.Vector3(0, 1, 0);
function limb(a: THREE.Vector3, b: THREE.Vector3, r0: number, r1: number, seg = 6) {
  const len = a.distanceTo(b);
  const radial = r0 > 0.2 ? 14 : seg;
  const rows = Math.max(1, Math.round(len / 0.8));
  const g = new THREE.CylinderGeometry(r1, r0, len, radial, rows, true);
  // Organic trunk: irregular bulges, buttress flare at the base, slight lean.
  const pos = g.attributes['position'] as THREE.BufferAttribute;
  const uv = g.attributes['uv'] as THREE.BufferAttribute;
  const seed = a.x * 3.1 + a.y * 1.7 + b.x * 5.3 + b.z * 2.9 + len;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const ang = Math.atan2(z, x), v = (y + len / 2) / len;
    const knob = 1 + 0.09 * Math.sin(ang * 5 + seed + v * 7) + 0.06 * Math.sin(ang * 9 - seed * 2 + v * 13);
    const flare = r0 > 0.2 ? 1 + 0.55 * Math.pow(Math.max(0, 1 - v * 7), 2) * (1 + 0.4 * Math.sin(ang * 4 + seed)) : 1;
    const bend = Math.sin(v * 3 + seed) * 0.04 * len * (r0 > 0.2 ? 0.25 : 1);
    pos.setXYZ(i, x * knob * flare + bend, y, z * knob * flare);
    uv.setXY(i, uv.getX(i) * Math.max(1, Math.round((Math.PI * 2 * r0) / 0.9)), uv.getY(i) * Math.max(1, len / 1.4));
  }
  g.computeVertexNormals();
  g.translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, b.clone().sub(a).normalize()));
  g.translate(a.x, a.y, a.z);
  return g;
}
function card(at: THREE.Vector3, size: number, seed: number, flat = false) {
  const parts: THREE.BufferGeometry[] = [];
  const n = flat ? 2 : 3;
  for (let i = 0; i < n; i++) {
    const p = new THREE.PlaneGeometry(size, flat ? size * 0.9 : size);
    if (flat) p.rotateX(-Math.PI / 2 + (rand(seed + i) - 0.5) * 0.5);
    else { p.rotateY((i / n) * Math.PI + rand(seed) * 0.5); p.rotateX((rand(seed + i * 2) - 0.5) * 0.6); }
    p.rotateY(rand(seed + i * 9) * Math.PI);
    p.translate(at.x, at.y, at.z);
    parts.push(p);
  }
  return mergeGeometries(parts)!;
}
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

type Species = { wood: THREE.BufferGeometry; leaves: THREE.BufferGeometry };
function grow(seed: number, build: (r: (n: number) => number, wood: THREE.BufferGeometry[], leaves: THREE.BufferGeometry[]) => void): Species {
  const wood: THREE.BufferGeometry[] = [], leaves: THREE.BufferGeometry[] = [];
  build((n) => rand(seed * 13.7 + n), wood, leaves);
  return { wood: mergeGeometries(wood.map((g) => g.toNonIndexed()))!, leaves: mergeGeometries(leaves.map((g) => g.toNonIndexed()))! };
}

// Tall, straight trunk with a high, layered crown (sal).
const sal = (seed: number) => grow(seed, (r, wood, leaves) => {
  const h = 11 + r(1) * 4;
  wood.push(limb(V(0, 0, 0), V(0, h, 0), 0.38, 0.12));
  for (let i = 0; i < 6; i++) {
    const y = h * (0.55 + i * 0.075), a = r(i + 2) * 6.28, l = 2 + r(i + 3) * 1.8;
    const end = V(Math.cos(a) * l, y + 1.2, Math.sin(a) * l);
    wood.push(limb(V(0, y, 0), end, 0.12, 0.04, 4));
    leaves.push(card(end, 3.4 + r(i + 4), seed + i));
  }
  leaves.push(card(V(0, h + 0.6, 0), 4, seed + 20));
});
// Medium trunk, broad round crown with large leaves (teak).
const teak = (seed: number) => grow(seed, (r, wood, leaves) => {
  const h = 6 + r(1) * 3;
  const top = V((r(2) - 0.5), h, (r(3) - 0.5));
  wood.push(limb(V(0, 0, 0), top, 0.3, 0.14));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * 6.28 + r(i), l = 1.8 + r(i + 5) * 1.4;
    const end = V(top.x + Math.cos(a) * l, h + 0.5 + r(i + 7) * 2.2, top.z + Math.sin(a) * l);
    wood.push(limb(top, end, 0.12, 0.05, 4));
    leaves.push(card(end, 3 + r(i + 8) * 1.2, seed + i));
  }
});
// Massive trunk, aerial roots and an enormous low canopy (banyan).
const banyan = (seed: number) => grow(seed, (r, wood, leaves) => {
  const h = 6;
  wood.push(limb(V(0, 0, 0), V(0, h, 0), 1.1, 0.7, 8));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 6.28 + r(i), l = 5 + r(i + 2) * 3;
    const end = V(Math.cos(a) * l, h + 1.5 + r(i + 3), Math.sin(a) * l);
    wood.push(limb(V(0, h - 0.5, 0), end, 0.45, 0.2));
    wood.push(limb(V(end.x * 0.8, 0, end.z * 0.8), V(end.x * 0.8, end.y - 0.4, end.z * 0.8), 0.12, 0.08, 4));
    for (let k = 0; k < 3; k++) leaves.push(card(V(end.x * (0.5 + k * 0.25), end.y + 0.8 + r(k + i), end.z * (0.5 + k * 0.25)), 4.5, seed + i * 5 + k, k === 1));
  }
  leaves.push(card(V(0, h + 3, 0), 6, seed + 99, true));
});
// Clump of arching culms with narrow leaves along the tips (bamboo).
const bamboo = (seed: number) => grow(seed, (r, wood, leaves) => {
  for (let i = 0; i < 14; i++) {
    const a = r(i) * 6.28, lean = 0.08 + r(i + 1) * 0.18, h = 8 + r(i + 2) * 5;
    const base = V(Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6);
    const mid = V(base.x + Math.cos(a) * h * lean * 0.4, h * 0.55, base.z + Math.sin(a) * h * lean * 0.4);
    const tip = V(base.x + Math.cos(a) * h * lean * 1.4, h, base.z + Math.sin(a) * h * lean * 1.4);
    wood.push(limb(base, mid, 0.07, 0.06, 5), limb(mid, tip, 0.06, 0.03, 5));
    leaves.push(card(tip, 2.2, seed + i), card(mid.clone().lerp(tip, 0.5), 1.8, seed + i + 40));
  }
});
// Forked trunk spreading into a flat umbrella crown (acacia tortilis).
const acacia = (seed: number) => grow(seed, (r, wood, leaves) => {
  const fork = V((r(1) - 0.5) * 0.8, 2.4 + r(2), (r(3) - 0.5) * 0.8);
  wood.push(limb(V(0, 0, 0), fork, 0.32, 0.22));
  const top = 5.5 + r(4) * 1.5;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * 6.28 + r(i + 5), l = 3 + r(i + 6) * 2;
    const end = V(Math.cos(a) * l, top + r(i) * 0.6, Math.sin(a) * l);
    wood.push(limb(fork, end, 0.18, 0.06, 5));
    for (let k = 0; k < 3; k++) leaves.push(card(V(end.x * (0.4 + k * 0.3), top + 0.4, end.z * (0.4 + k * 0.3)), 3.6, seed + i * 3 + k, true));
  }
});
// Tree prickly pear: grey trunk carrying flat oval pads (Opuntia echios).
const opuntia = (seed: number) => {
  const r = (n: number) => rand(seed * 7.1 + n);
  const h = 2.5 + r(1) * 2;
  const wood = limb(V(0, 0, 0), V(0, h, 0), 0.25, 0.18, 7);
  const pads: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 16; i++) {
    const p = new THREE.SphereGeometry(0.55, 8, 6);
    p.scale(1, 1.35, 0.22);
    p.rotateZ((r(i) - 0.5) * 1.2); p.rotateY(r(i + 3) * 6.28);
    const a = r(i + 6) * 6.28, l = 0.4 + r(i + 7) * 1.4;
    p.translate(Math.cos(a) * l, h + r(i + 9) * 1.8, Math.sin(a) * l);
    pads.push(p.toNonIndexed());
  }
  return { wood, pads: mergeGeometries(pads)! };
};
// Pale, near-leafless branching tree of the dry zone (palo santo).
const paloSanto = (seed: number) => grow(seed, (r, wood, leaves) => {
  const fork = V(0, 1.5 + r(1), 0);
  wood.push(limb(V(0, 0, 0), fork, 0.18, 0.12));
  for (let i = 0; i < 6; i++) {
    const a = r(i + 2) * 6.28, l = 1.2 + r(i + 3) * 1.6;
    const end = V(Math.cos(a) * l, fork.y + 1.5 + r(i + 4) * 1.5, Math.sin(a) * l);
    wood.push(limb(fork, end, 0.1, 0.03, 4));
    if (r(i + 9) > 0.5) leaves.push(card(end, 1.2, seed + i));
  }
  leaves.push(card(fork.clone().setY(fork.y + 2.5), 0.8, seed + 50));
});
function rockGeo(seed: number) {
  const g = new THREE.IcosahedronGeometry(1, 2);
  const p = g.attributes["position"]!;
  for (let i = 0; i < p.count; i++) {
    const v = V(p.getX(i), p.getY(i), p.getZ(i));
    v.multiplyScalar(0.75 + fbm(v.x * 2 + seed, v.z * 2 + v.y, 3) * 0.6);
    p.setXYZ(i, v.x, v.y * 0.65, v.z);
  }
  g.computeVertexNormals();
  return g;
}

// ---------- scattering ----------
type Place = { x: number; z: number; h: number };
function places(biome: Biome, count: number, seed: number, accept: (p: Place) => boolean, area = 230) {
  const out: Place[] = [];
  for (let i = 0; i < count * 8 && out.length < count; i++) {
    const x = (rand(seed + i * 1.13) - 0.5) * area, z = (rand(seed + i * 2.71 + 9) - 0.5) * area;
    const h = heightAt(biome, x, z);
    const p = { x, z, h };
    if (accept(p)) out.push(p);
  }
  return out;
}
function instance(geo: THREE.BufferGeometry, mat: THREE.Material, pts: Place[], scale: [number, number], seed: number, sink = 0.2) {
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, pts.length));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  pts.forEach((pt, i) => {
    const sc = scale[0] + rand(seed + i) * (scale[1] - scale[0]);
    q.setFromAxisAngle(up, rand(seed + i * 3) * 6.28);
    m.compose(p.set(pt.x, pt.h - sink, pt.z), q, s.set(sc, sc * (0.85 + rand(seed + i * 5) * 0.3), sc));
    mesh.setMatrixAt(i, m);
    // Per-instance tint so no two plants or rocks read as identical copies.
    const t = 0.78 + rand(seed + i * 7.3) * 0.34;
    mesh.setColorAt(i, new THREE.Color(t, t * (0.96 + rand(seed + i * 9.1) * 0.08), t * 0.95));
  });
  mesh.count = pts.length;
  return mesh;
}
function plant(g: THREE.Group, sp: Species[], pts: Place[], wood: THREE.Material, leaf: THREE.Material, scale: [number, number], seed: number) {
  sp.forEach((s, i) => {
    const mine = pts.filter((_, k) => k % sp.length === i);
    if (!mine.length) return;
    g.add(instance(s.wood, wood, mine, scale, seed + i * 31), instance(s.leaves, leaf, mine, scale, seed + i * 31));
  });
}

// ---------- birds ----------
function birds(color: string, count: number, seed: number) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, 0, 0.2, 0, 0, -0.3, 0, 0, 0.3, 1, 0, 0.2, 0, 0, -0.3, 0, 0, 0.3]), 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  const flock = new THREE.Group();
  const list: { mesh: THREE.Mesh; o: number }[] = [];
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(geo.clone(), mat);
    mesh.scale.setScalar(0.5 + rand(seed + i) * 0.3);
    flock.add(mesh); list.push({ mesh, o: rand(seed + i * 4) * 10 });
  }
  const update = (t: number) => list.forEach(({ mesh, o }, i) => {
    const a = t * 0.12 + o;
    mesh.position.set(Math.sin(a) * 40 + (i % 4) * 2, 22 + Math.sin(t * 0.5 + o) * 2, -40 + Math.cos(a) * 30 + Math.floor(i / 4) * 2);
    mesh.rotation.y = -a;
    const flap = Math.sin(t * 8 + o) * 0.5;
    const p = mesh.geometry.attributes["position"]! as THREE.BufferAttribute;
    p.setY(0, flap); p.setY(3, flap); p.needsUpdate = true;
  });
  return { flock, update };
}

// ---------- wildlife ----------
const loader = new THREE.TextureLoader();
const safariJeep = "/globe-kit/wildlife/safari-jeep.png";
// India finale: a safari jeep of photographers watching wildlife as the sun rises over the valley.
function addSafariSunrise(g: THREE.Group) {
  const ups: ((t: number, cam: THREE.Camera) => void)[] = [];
  const glowTex = canvasTex(256, 256, (c) => { const r = c.createRadialGradient(128, 128, 0, 128, 128, 128); r.addColorStop(0, "rgba(255,250,225,1)"); r.addColorStop(0.08, "rgba(255,226,150,0.95)"); r.addColorStop(0.3, "rgba(255,170,80,0.45)"); r.addColorStop(1, "rgba(255,120,40,0)"); c.fillStyle = r; c.fillRect(0, 0, 256, 256); });
  const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), glowMat);
  const sx = riverX(-235);
  glow.position.set(sx, 26, -235); glow.renderOrder = -1; g.add(glow);
  const discTex = canvasTex(128, 128, (c) => { const r = c.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(255,252,235,1)"); r.addColorStop(0.45, "rgba(255,236,180,1)"); r.addColorStop(0.55, "rgba(255,200,120,0.5)"); r.addColorStop(1, "rgba(255,160,80,0)"); c.fillStyle = r; c.fillRect(0, 0, 128, 128); });
  const discMat = new THREE.MeshBasicMaterial({ map: discTex, transparent: true, depthWrite: false, fog: false, opacity: 0 });
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), discMat);
  disc.position.set(sx, 10, -232); g.add(disc);
  const warm = new THREE.DirectionalLight("#ffb46b", 0); warm.position.set(12, 12, -200); g.add(warm);
  const jx = 12, jz = -74, jh = 3.4;
  const tex = loader.load(safariJeep); tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(jh * 1.5, jh); geo.translate(0, jh * 0.5 - 0.02 * jh, 0); // tyres on the ground
  const jeep = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }));
  const jy = heightAt("forest", jx, jz) + 0.02;
  parkSafariJeep(jeep, jx, jy, jz); g.add(jeep);
  const jsTex = canvasTex(64, 64, (c) => { const r = c.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(0,0,0,0.7)"); r.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = r; c.fillRect(0, 0, 64, 64); });
  const jshadow = new THREE.Mesh(new THREE.PlaneGeometry(jh * 1.6, jh * 0.9), new THREE.MeshBasicMaterial({ map: jsTex, transparent: true, depthWrite: false }));
  jshadow.rotation.x = -Math.PI / 2; jshadow.position.set(jx, jy + 0.25, jz); g.add(jshadow);
  ups.push((_t, cam) => {
    const f = THREE.MathUtils.smoothstep(-cam.position.z, 25, 60);
    glowMat.opacity = f; warm.intensity = f * 2.4; discMat.opacity = f;
    disc.position.y = 6 + f * 8; // the sun lifts clear of the horizon as you arrive
    // Parked jeep: no world transform updates, including camera-facing rotation.
  });
  return (t: number, cam: THREE.Camera) => ups.forEach((u) => u(t, cam));
}
function addWildlife(g: THREE.Group, biome: Biome, surface: (x: number, z: number) => number) {
  const water = WATER[biome];
  const shadowTex = canvasTex(64, 64, (c) => { const r = c.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(0,0,0,0.55)"); r.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = r; c.fillRect(0, 0, 64, 64); });
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
  const iceMat = new THREE.MeshStandardMaterial({ color: "#eef5f9", roughness: 0.5, flatShading: true });
  const boards: { m: THREE.Mesh; base: number; o: number; animate: ((t: number) => void) | undefined }[] = [];
  wildlife[biome].forEach((a, si) => {
    const tex = loader.load(a.src);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 });
    // Ground contact: the visible feet, not the picture's bottom edge, sit on the ground.
    const H = a.h * 1.35;
    const sink = a.behaviour ? 0 : 0.015;
    const geo = new THREE.PlaneGeometry(H * a.aspect, H, a.behaviour ? 32 : 1, a.behaviour ? 24 : 1);
    geo.translate(0, H * (0.5 - (a.foot ?? 0.05) + sink), 0);
    // Height of the visible feet above the mesh origin.
    const paw = H * sink;
    a.at.forEach(([x, z], i) => {
      const hw = a.h * 0.6 * a.aspect;
      // The feet occupy the middle of the billboard, which spins to face the camera.
      // Stand them on the highest drawn ground across that whole band, otherwise a
      // slope between the camera and the animal paints over its lower legs.
      const band = hw * 0.6;
      let ground = surface(x, z);
      for (let s = 0; s < 8; s++) {
        const ang = (s / 8) * Math.PI * 2;
        const cx = Math.cos(ang) * band, cz = Math.sin(ang) * band;
        ground = Math.max(ground, surface(x + cx * 0.5, z + cz * 0.5), surface(x + cx, z + cz));
      }
      let y = ground - paw + 0.02;
      if (water !== null && ground < water + 0.1) {
        if (a.shore) { const floe = new THREE.Mesh(rockGeo(si + i), iceMat); floe.scale.set(a.h * 2.2, 0.5, a.h * 1.6); floe.position.set(x, water, z); g.add(floe); }
        y = water + 0.15 - paw;
      }
      const instanceGeo = a.behaviour ? geo.clone() : geo;
      const m = new THREE.Mesh(instanceGeo, mat);
      m.name = a.behaviour ? `india-${a.behaviour}-${i}` : `wildlife-${biome}-${si}-${i}`;
      m.position.set(x, y, z);
      if (rand(si * 10 + i) > 0.5) m.scale.x = -1;
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(a.h * a.aspect * 1.05, a.h * 0.45), shadowMat);
      sh.rotation.x = -Math.PI / 2; sh.position.set(x, y + paw - 0.01, z);
      g.add(sh, m);
      const o = rand(si + i * 7) * (a.behaviour ? 23 : 6);
      boards.push({ m, base: y, o, animate: a.behaviour ? createWildlifeAnimator(instanceGeo, a.behaviour, o) : undefined });
    });
    if (a.behaviour) geo.dispose();
  });
  return (t: number, cam: THREE.Camera) => boards.forEach(({ m, base, o, animate }) => {
    m.rotation.y = Math.atan2(cam.position.x - m.position.x, cam.position.z - m.position.z);
    if (animate) animate(t);
    else m.scale.y = 1 + Math.sin(t * 1.6 + o) * 0.012;
    m.position.y = base;
  });
}

// Height of the ground you actually see: the terrain mesh is a coarse grid, so its
// drawn surface is a bilinear blend of the vertex heights, not the analytic heightAt().
export function terrainSurface(geo: THREE.PlaneGeometry, seg: number) {
  const cell = 260 / seg;
  const pos = geo.attributes["position"]!;
  return (x: number, z: number) => {
    const fx = Math.max(0, Math.min(seg, (x + 130) / cell));
    const fz = Math.max(0, Math.min(seg, (z + 130) / cell));
    const ix = Math.min(seg - 1, Math.floor(fx)), iz = Math.min(seg - 1, Math.floor(fz));
    const tx = fx - ix, tz = fz - iz;
    const gy = (i: number, j: number) => pos.getY(j * (seg + 1) + i);
    const h00 = gy(ix, iz), h10 = gy(ix + 1, iz), h01 = gy(ix, iz + 1), h11 = gy(ix + 1, iz + 1);
    return (h00 * (1 - tx) + h10 * tx) * (1 - tz) + (h01 * (1 - tx) + h11 * tx) * tz;
  };
}

// ---------- assemble ----------
export function buildLandscape(biome: Biome, light = false) {
  const g = new THREE.Group();
  const wind: Wind = { value: 0 };
  const k = light ? 0.45 : 1;
  const updates: ((t: number, cam: THREE.Camera) => void)[] = [];

  const seg = light ? 120 : 200;
  const geo = new THREE.PlaneGeometry(260, 260, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes["position"]!;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = heightAt(biome, x, z);
    pos.setY(i, h);
    colorAt(palettes[biome], h + (fbm(x * 0.3, z * 0.3, 2) - 0.5) * 2.2, c);
    c.multiplyScalar(0.88 + hash(x, z) * 0.18);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const surface = terrainSurface(geo, seg);
  // Snow on gentle slopes, bare rock on steep ones.
  if (biome === "arctic") {
    const n = geo.attributes["normal"]!;
    for (let i = 0; i < pos.count; i++) if (pos.getY(i) > 3 && n.getY(i) < 0.75) colors.set([0.42, 0.45, 0.49], i * 3);
  }
  let grain: THREE.Texture;
  if (biome === "forest") {
    // Red laterite soil with lush monsoon grass, matching the Kanha track photo.
    grain = imageTex(realForestFloorRed, true, false);
  } else {
    grain = canvasTex(256, 256, (g2) => { for (let i = 0; i < 6000; i++) { g2.fillStyle = `rgba(${rand(i) > 0.5 ? "255,255,255" : "0,0,0"},0.08)`; g2.fillRect(rand(i * 2) * 256, rand(i * 3) * 256, 2, 2); } });
    if (biome === "savannah") {
      // Dry-grass flecks so the ground isn't a flat colour.
      const litter = canvasTex(256, 256, (g2) => { for (let i = 0; i < 2500; i++) { const r2 = rand(i * 5.7); g2.fillStyle = "rgba(140,110,60,0.25)"; g2.beginPath(); g2.ellipse(rand(i * 2.3) * 256, rand(i * 3.1) * 256, 1.5 + r2 * 2.5, 0.8 + r2, r2 * 6, 0, 6.28); g2.fill(); } });
      grain.image = litter.image;
    }
  }
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping; grain.repeat.set(40, 40);
  g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, map: grain, roughness: 0.95 })));

  // Water: rippling, slowly flowing surface.
  const waterLevel = WATER[biome];
  if (waterLevel !== null) {
    const nm = waterNormal();
    const size = biome === "forest" || biome === "savannah" ? 260 : 600;
    // Kanha's river: a real photographed water surface that scrolls with the current.
    const riverMap = biome === "forest" ? imageTex(realRiverWater, true, false) : null;
    if (riverMap) riverMap.repeat.set(5, 5);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({
      map: riverMap ?? null,
      color: riverMap ? "#b8c4ae" : { forest: "#5d6b52", volcanic: "#1f6680", savannah: "#5e5a3e", arctic: "#2f4b5a" }[biome],
      // Kanha's wide river is calm and reflective; other biomes keep their original surface.
      roughness: biome === "forest" ? 0.18 : 0.12, metalness: biome === "forest" ? 0.25 : 0.35, normalMap: nm, normalScale: new THREE.Vector2(0.6, 0.6), transparent: true, opacity: biome === "forest" ? 0.9 : 0.92,
    }));
    water.rotation.x = -Math.PI / 2; water.position.y = waterLevel;
    g.add(water);
    const flow = biome === "forest" ? 0.04 : 0.008;
    updates.push((t) => {
      nm.offset.set(t * flow * 0.3, -t * flow);
      if (riverMap) riverMap.offset.set(t * flow * 0.2, -t * flow * 0.8);
    });
  }

  const rockMat = new THREE.MeshStandardMaterial({ color: biome === "volcanic" ? "#2a2624" : biome === "arctic" ? "#5d636a" : biome === "forest" ? "#9a8a6a" : "#7a7366", roughness: 0.95, flatShading: true });
  const rocks = [rockGeo(1), rockGeo(2), rockGeo(3)];

  if (biome === "forest") {
    // Realistic generated foliage and bark replace the cartoon hand-drawn textures.
    const leafA = windMaterial({ map: imageTex(realLeavesSalGreen) }, wind, 0.02, 0.35);
    const leafTeak = windMaterial({ map: imageTex(realLeavesTeak) }, wind, 0.025, 0.35);
    const leafBanyan = windMaterial({ map: imageTex(realLeavesSal) }, wind, 0.012, 0.35);
    const leafBamboo = windMaterial({ map: imageTex(realBamboo) }, wind, 0.05, 0.35);
    // Real sal bark: dark, deeply furrowed, slightly mossy like the photo.
    const barkMap = imageTex(realBarkTrunk, true, false);
    const bark = new THREE.MeshStandardMaterial({ map: barkMap, bumpMap: barkMap, bumpScale: 4, roughness: 1 });
    void realBarkSal;
    const pale = new THREE.MeshStandardMaterial({ map: imageTex(realBark, true, false), roughness: 1 });
    const culm = new THREE.MeshStandardMaterial({ color: "#6f8340", roughness: 0.6 });
    const forestFloor = (p: Place) => p.h > -0.8 && p.h < 26 && Math.hypot(p.x - CLEARING[0], (p.z - CLEARING[1]) * 0.7) > 17 && Math.abs(p.x - riverX(p.z)) > 9 && fbm(p.x * 0.04, p.z * 0.04, 2) > 0.38; // leave clearings
    // Kanha's sal forest is open: tall straight trunks with the canopy high
    // above, so fewer, taller trees keep the forest floor visible.
    plant(g, [sal(1), sal(2), sal(3)], places(biome, Math.round(560 * k), 11, forestFloor), bark, leafA, [0.85, 1.7], 1);
    plant(g, [teak(4), teak(5)], places(biome, Math.round(240 * k), 23, forestFloor), pale, leafTeak, [0.7, 1.4], 2);
    plant(g, [banyan(6)], places(biome, Math.round(14 * k) + 4, 37, (p) => forestFloor(p) && p.h < 8), bark, leafBanyan, [0.9, 1.2], 3);
    plant(g, [bamboo(7), bamboo(8)], places(biome, Math.round(30 * k), 41, (p) => p.h > -1 && p.h < 10 && Math.abs(p.x - riverX(p.z)) > 10 && Math.abs(p.x - riverX(p.z)) < 26), culm, leafBamboo, [0.7, 1.1], 4);
    const grass = windMaterial({ map: imageTex(realGrass) }, wind, 0.12, 0.3);
    g.add(instance(card(V(0, 0.6, 0), 1.4, 9), grass, places(biome, Math.round(700 * k), 53, (p) => p.h > -1 && p.h < 12 && fbm(p.x * 0.08, p.z * 0.08, 2) > 0.45, 160), [0.4, 0.9], 5, 0));
    // Sandy riverbanks: low flat pebbly mounds in the sand band, plus a few
    // smooth rocks where the current runs.
    const sandMat = new THREE.MeshStandardMaterial({ map: imageTex(realRiverSand, true, false), roughness: 1 });
    const bank = places(biome, Math.round(140 * k), 61, (p) => { const d = Math.abs(p.x - riverX(p.z)); return d > 2 && d < 8; });
    rocks.forEach((r, i) => g.add(instance(r, sandMat, bank.filter((_, j) => j % 3 === i), [0.5, 1.4], 6 + i, 0.55)));
    const wet = places(biome, Math.round(40 * k), 67, (p) => { const d = Math.abs(p.x - riverX(p.z)); return d > 1.5 && d < 4; });
    rocks.forEach((r, i) => g.add(instance(r, rockMat, wet.filter((_, j) => j % 3 === i), [0.3, 0.8], 16 + i, 0.5)));
  }

  if (biome === "volcanic") {
    const padMat = windMaterial({ color: "#6a8a3a", side: THREE.FrontSide, alphaTest: 0 }, wind, 0.003);
    const trunk = new THREE.MeshStandardMaterial({ map: barkTex("#8a7f6c", "#5c5446"), roughness: 1 });
    const pale = new THREE.MeshStandardMaterial({ map: barkTex("#b8b0a2", "#8a8274"), roughness: 1 });
    const sparseLeaf = windMaterial({ map: leafTex(["#8a9a52", "#7a8a46"], 10, 6, 110, 7) }, wind, 0.02);
    const dryZone = (p: Place) => p.h > 1.5 && p.h < 9 && fbm(p.x * 0.08, p.z * 0.08, 2) > 0.45;
    const pts = places(biome, Math.round(90 * k), 71, dryZone);
    [opuntia(1), opuntia(2)].forEach((o, i) => {
      const mine = pts.filter((_, j) => j % 2 === i);
      g.add(instance(o.wood, trunk, mine, [0.8, 1.3], 70 + i), instance(o.pads, padMat, mine, [0.8, 1.3], 70 + i));
    });
    plant(g, [paloSanto(3), paloSanto(4)], places(biome, Math.round(140 * k), 79, (p) => p.h > 2 && p.h < 12), pale, sparseLeaf, [0.8, 1.3], 8);
    const salt = windMaterial({ map: leafTex(["#7c8a4a", "#6a7a3e", "#8a9a5c"], 6, 4, 160, 8) }, wind, 0.03);
    g.add(instance(card(V(0, 0.5, 0), 1.3, 3), salt, places(biome, Math.round(500 * k), 83, (p) => p.h > -0.5 && p.h < 6), [0.6, 1.3], 9, 0));
    // Lava boulders and coastal rock along the shore.
    const shore = places(biome, Math.round(260 * k), 89, (p) => p.h > -2.4 && p.h < 1.5);
    rocks.forEach((r, i) => g.add(instance(r, rockMat, shore.filter((_, j) => j % 3 === i), [0.6, 2.4], 10 + i)));
  }

  if (biome === "savannah") {
    const crown = windMaterial({ map: leafTex(["#5c6a30", "#6a7838", "#4e5c28"], 11, 7, 320, 9) }, wind, 0.01);
    const bark = new THREE.MeshStandardMaterial({ map: barkTex("#4d3b2b", "#2e2219"), roughness: 1 });
    plant(g, [acacia(1), acacia(2), acacia(3)], places(biome, Math.round(70 * k), 97, (p) => p.h > 1 && p.h < 9 && rand(p.x) > 0.2), bark, crown, [0.8, 1.3], 11);
    const grass = windMaterial({ map: grassTex(["#d2ac62", "#c09650", "#e0bd78", "#a8854a"], 10) }, wind, 0.15);
    g.add(instance(card(V(0, 0.4, 0), 0.9, 10), grass, places(biome, Math.round(3500 * k), 101, (p) => p.h > 1, 170), [0.8, 1.6], 12, 0));
    const shrub = windMaterial({ map: leafTex(["#6e6e3a", "#7d7a42"], 6, 4, 120, 11) }, wind, 0.02);
    g.add(instance(card(V(0, 0.6, 0), 1.6, 11), shrub, places(biome, Math.round(250 * k), 103, (p) => p.h > 1 && p.h < 10), [0.6, 1.4], 13, 0));
    rocks.forEach((r, i) => g.add(instance(r, rockMat, places(biome, Math.round(40 * k), 107 + i, (p) => p.h > 2 && fbm(p.x * 0.05, p.z * 0.05, 2) > 0.6), [0.8, 2.5], 14 + i)));
  }

  if (biome === "arctic") {
    // Low tundra: moss, lichen and purple saxifrage only — no trees.
    const moss = windMaterial({ map: leafTex(["#6b7a4a", "#8a8a5a", "#a08a9a", "#7a5a8a"], 4, 3, 200, 12) }, wind, 0.01);
    g.add(instance(card(V(0, 0.15, 0), 1.2, 12, true), moss, places(biome, Math.round(700 * k), 109, (p) => p.h > -1 && p.h < 5), [0.6, 1.5], 15, 0));
    const ice = new THREE.MeshStandardMaterial({ color: "#e8f2f8", roughness: 0.35, flatShading: true });
    g.add(instance(rocks[0]!, ice, places(biome, Math.round(140 * k), 113, (p) => p.h < -2), [0.8, 3], 16, 0.4));
    rocks.forEach((r, i) => g.add(instance(r, rockMat, places(biome, Math.round(80 * k), 117 + i, (p) => p.h > -1.4 && p.h < 3), [0.6, 2], 17 + i)));
    // Drifting snow
    const flakes = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) flakes.set([(rand(i) - 0.5) * 140, rand(i + 1) * 60, (rand(i + 2) - 0.5) * 200], i * 3);
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(flakes, 3));
    const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: "#ffffff", size: 0.25, transparent: true, opacity: 0.8 }));
    g.add(snow);
    updates.push((t) => { snow.position.y = -((t * 2) % 30); snow.position.x = Math.sin(t * 0.3) * 3; });
  }

  updates.push(addWildlife(g, biome, surface));
  if (biome === "forest") updates.push(addSafariSunrise(g));
  const b = birds(biome === "arctic" || biome === "volcanic" ? "#2b2b2b" : "#1d1a16", Math.round(10 * k) + 2, biome.length);
  g.add(b.flock); updates.push(b.update);

  const a = atmosphere[biome];
  // Dense forest canopy needs stronger ambient and a counter-fill so
  // leaf planes facing away from the sun don't render black.
  g.add(new THREE.HemisphereLight(a.sky, a.ground, biome === "forest" ? 1.6 : 1));
  const sun = new THREE.DirectionalLight(a.sun, a.sunI);
  sun.position.set(-60, 80, 40);
  g.add(sun);
  if (biome === "forest") {
    const fill = new THREE.DirectionalLight("#d8e4c0", 1.1);
    fill.position.set(50, 30, -60);
    g.add(fill);
  }

  g.userData["update"] = (t: number, cam: THREE.Camera) => { wind.value = t; updates.forEach((u) => u(t, cam)); };
  return g;
}

// One continuous expedition per destination, keyed to scroll:
// arrival descent → glide through → low pass by the wildlife → side angle → rise out.
// Keys: [t, x, altitude above ground, z, lookX, lookZ]
const KEYS: [number, number, number, number, number, number][] = [
  [0, 0, 85, 95, 4, 45],
  [0.18, -6, 18, 60, 2, 10],
  [0.42, 8, 22, 18, 10, -30],
  [0.64, 6, 15, -8, 12, -42],
  [0.84, 34, 16, -18, 4, -48],
  [1, 22, 38, 4, 2, -50],
];
// India stays longer: the expedition continues past the river to a sunrise safari jeep scene.
const FOREST_KEYS: typeof KEYS = [
  [0, 0, 85, 95, 4, 45],
  [0.11, -6, 18, 60, 2, 10],
  [0.25, 8, 22, 18, 10, -30],
  [0.38, 6, 15, -8, 12, -42],
  [0.5, 30, 14, -24, 16, -60],
  [0.66, 18, 7, -54, 12, -95],
  [0.84, 12, 4.5, -62, 12, -110],
  [1, 12, 5.5, -50, 4, -200],
];
const forestCam = new THREE.CatmullRomCurve3(FOREST_KEYS.map((k) => V(k[1], k[2], k[3])), false, "centripetal");
const forestLook = new THREE.CatmullRomCurve3(FOREST_KEYS.map((k) => V(k[4], 0, k[5])), false, "centripetal");
const camPath = new THREE.CatmullRomCurve3(KEYS.map((k) => V(k[1], k[2], k[3])), false, "centripetal");
const lookPath = new THREE.CatmullRomCurve3(KEYS.map((k) => V(k[4], 0, k[5])), false, "centripetal");
function keyU(t: number, keys = KEYS) {
  // map timeline t to curve parameter so each key lands at its scroll moment
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1]![0], b = keys[i]![0];
    if (t <= b) { const f = (t - a) / (b - a); return (i - 1 + f * f * (3 - 2 * f) * 0.6 + f * 0.4) / (keys.length - 1); }
  }
  return 1;
}
const tmpV = new THREE.Vector3();
export function landscapeCamera(biome: Biome, t: number, pos: THREE.Vector3, look: THREE.Vector3) {
  const forest = biome === "forest";
  const u = keyU(Math.max(0, Math.min(1, t)), forest ? FOREST_KEYS : KEYS);
  (forest ? forestCam : camPath).getPoint(u, tmpV);
  const floor = (x: number, z: number) => Math.max(heightAt(biome, x, z), WATER[biome] ?? -10);
  pos.set(tmpV.x, floor(tmpV.x, tmpV.z) + tmpV.y, tmpV.z);
  (forest ? forestLook : lookPath).getPoint(u, tmpV);
  look.set(tmpV.x, floor(tmpV.x, tmpV.z) + 1.5, tmpV.z);
  // Finale: lift the gaze to the horizon so the sunrise sits above the jeep and the grazing herd.
  if (forest) look.y = THREE.MathUtils.lerp(look.y, pos.y + 1, THREE.MathUtils.smoothstep(u, 0.55, 0.75) * 0.85);
}
