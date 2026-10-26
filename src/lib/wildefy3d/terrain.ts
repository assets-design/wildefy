import * as THREE from "three";

/**
 * Geographic layout ported from the existing WILDEFY expedition map.
 * 1 unit = 5 design metres.
 * The mesh spans 1200 × 1600 units = 6 km × 8 km so the mapped ascent fits.
 * `terrainHeight` is the source of truth. To swap in a surveyed mesh later,
 * replace `buildTerrainGeometry` and keep this function, or bake the same field.
 */

export const WORLD = {
  width: 1200,
  depth: 1600,
  centerZ: -500,
  designWidthMeters: 6000,
  designDepthMeters: 8000,
  scaleMetersPerUnit: 5,
} as const;

export const ROUTE_POINTS: readonly (readonly [number, number])[] = [
  [-40, 175],
  [-55, 40],
  [-70, -40],
  [-20, -180],
  [-30, -390],
  [-15, -560],
  [10, -785],
  [20, -960],
  [40, -1130],
];

export const CROSSING_Z = -230;
export const FALLS_Z = -568;
export const BASE_CAMP = { x: -82, z: 198 } as const;
export const FOREST_CAMP = { x: -34, z: -390 } as const;
export const SUMMIT = { x: 42, z: -1152 } as const;
export const LAKE = { x: -148, z: 64, radiusX: 54, radiusZ: 34 } as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mapLinear(x: number, a1: number, a2: number, b1: number, b2: number) {
  return b1 + ((x - a1) * (b2 - b1)) / (a2 - a1);
}

function smoothstep(value: number, min: number, max: number) {
  const t = clamp((value - min) / (max - min), 0, 1);
  return t * t * (3 - 2 * t);
}

function hashNoise(x: number, z: number) {
  return (
    Math.sin(x * 0.018 + z * 0.011) * 0.48 +
    Math.sin(x * 0.041 - z * 0.023) * 0.28 +
    Math.cos(x * 0.008 + z * 0.031) * 0.24
  );
}

function peak(x: number, z: number, px: number, pz: number, radius: number, height: number) {
  const distanceSq = (x - px) ** 2 + (z - pz) ** 2;
  return Math.exp(-distanceSq / (radius * radius)) * height;
}

/** S-curve river: valley floor, then the gorge, then the upper ridge. */
export function riverX(z: number) {
  return (
    Math.sin((z + 210) * 0.0088) * 95 +
    Math.sin((z + 40) * 0.021) * 28 +
    Math.cos(z * 0.0045) * 18 -
    35
  );
}

export const CROSSING_X = riverX(CROSSING_Z);
export const FALLS_X = riverX(FALLS_Z);

export function routeDistance(x: number, z: number) {
  let nearest = Number.POSITIVE_INFINITY;
  for (let index = 0; index < ROUTE_POINTS.length - 1; index += 1) {
    const [ax, az] = ROUTE_POINTS[index];
    const [bx, bz] = ROUTE_POINTS[index + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const lengthSq = dx * dx + dz * dz || 1;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / lengthSq, 0, 1);
    nearest = Math.min(nearest, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
  }
  return nearest;
}

export function terrainHeight(x: number, z: number) {
  const ascent = clamp(mapLinear(z, 280, -1280, 4, 228), 0, 240);
  const summit = peak(x, z, 40, -1085, 290, 92);
  const leftMassif = peak(x, z, -390, -780, 340, 110);
  const rightMassif = peak(x, z, 420, -620, 300, 98);
  const midCliff = peak(x, z, 90, -560, 150, 48);
  const farPeaks =
    peak(x, z, -180, -1320, 420, 70) +
    peak(x, z, 260, -1360, 380, 78) +
    peak(x, z, -520, -1180, 280, 55);
  const sideWalls = Math.pow(Math.abs(x) / 640, 2.1) * 48;
  const detail = hashNoise(x, z) * (6 + Math.max(0, ascent) * 0.05);
  const riverDistance = Math.abs(x - riverX(z));
  const riverCarve = Math.exp(-(riverDistance * riverDistance) / 2200) * (28 + ascent * 0.05);
  const valleyFloor = peak(x, z, -80, 120, 260, -16);
  const trail = routeDistance(x, z);
  const trailFlatten = smoothstep(trail, 6, 28);
  const routeGrade = ascent + Math.sin(z * 0.014) * 2.4;
  const raw =
    ascent +
    summit +
    leftMassif +
    rightMassif +
    midCliff +
    farPeaks +
    sideWalls +
    detail +
    valleyFloor -
    riverCarve;

  let height = Math.max(4, routeGrade * (1 - trailFlatten) + raw * trailFlatten + 18);

  // A short lip at the falls so the sheet drops into the pool.
  const fallsBand =
    Math.exp(-((x - riverX(z)) ** 2) / (26 * 26)) *
    Math.exp(-((z - FALLS_Z) ** 2) / (70 * 70));
  const fallsAlong = clamp((FALLS_Z - z) / 28, -1, 1);
  height += fallsBand * fallsAlong * 12;

  const lakeDx = (x - LAKE.x) / LAKE.radiusX;
  const lakeDz = (z - LAKE.z) / LAKE.radiusZ;
  const lakeMask = Math.exp(-(lakeDx * lakeDx + lakeDz * lakeDz) * 1.15);
  height -= lakeMask * 2.4;

  return height;
}

/** Bank height the bridge deck sits on, above the cut channel. */
export function bridgeDeckY() {
  return terrainHeight(CROSSING_X + 22, CROSSING_Z) + 0.85;
}

const terrainColor = new THREE.Color();

function paintTerrain(height: number, slope: number, x: number, z: number) {
  const camp = Math.hypot(x - BASE_CAMP.x, z - BASE_CAMP.z);
  if (camp < 52 && height < 24) terrainColor.set("#b7a078");
  else if (height > 214 || (height > 198 && slope > 0.42)) terrainColor.set("#e6e2d8");
  else if (slope > 0.58 || height > 190) terrainColor.set("#7c776f");
  else if (height > 162) terrainColor.set("#5d7046");
  else if (Math.abs(x - riverX(z)) < 20) terrainColor.set("#4e6f48");
  else if (Math.hypot(x - FOREST_CAMP.x, z - FOREST_CAMP.z) < 22) terrainColor.set("#8d734c");
  else terrainColor.set("#3c6840");

  const variation = hashNoise(x, z);
  terrainColor.offsetHSL(variation * 0.015, variation * 0.06, variation * 0.05);
  return terrainColor;
}

export function buildTerrainGeometry(segmentsX: number, segmentsZ: number) {
  const geometry = new THREE.PlaneGeometry(WORLD.width, WORLD.depth, segmentsX, segmentsZ);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0, WORLD.centerZ);

  const position = geometry.attributes.position;
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const z = position.getZ(index);
    position.setY(index, terrainHeight(x, z));
  }
  geometry.computeVertexNormals();

  const normal = geometry.attributes.normal;
  const colors = new Float32Array(position.count * 3);
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const z = position.getZ(index);
    const height = position.getY(index);
    const slope = 1 - normal.getY(index);
    const color = paintTerrain(height, slope, x, z);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

/** Visual trail, with a jog onto the bridge deck. */
export function trailPoints() {
  return [
    [-40, 175],
    [-55, 40],
    [-70, -40],
    [-28, -150],
    [CROSSING_X + 24, CROSSING_Z + 16],
    [CROSSING_X + 14, CROSSING_Z],
    [CROSSING_X - 14, CROSSING_Z],
    [CROSSING_X - 18, CROSSING_Z - 18],
    [-30, -390],
    [-15, -560],
    [10, -785],
    [20, -960],
    [40, -1130],
  ] as const;
}

export function buildTrailGeometry() {
  const points = trailPoints();
  const sampled: THREE.Vector3[] = [];
  for (let segment = 0; segment < points.length - 1; segment += 1) {
    const [ax, az] = points[segment];
    const [bx, bz] = points[segment + 1];
    const steps = 22;
    for (let step = 0; step < steps; step += 1) {
      const t = step / steps;
      sampled.push(
        new THREE.Vector3(THREE.MathUtils.lerp(ax, bx, t), 0, THREE.MathUtils.lerp(az, bz, t)),
      );
    }
  }
  const [endX, endZ] = points[points.length - 1];
  sampled.push(new THREE.Vector3(endX, 0, endZ));

  const positions: number[] = [];
  const indices: number[] = [];
  sampled.forEach((point, index) => {
    const previous = sampled[Math.max(0, index - 1)];
    const next = sampled[Math.min(sampled.length - 1, index + 1)];
    const tangent = next.clone().sub(previous);
    tangent.y = 0;
    if (tangent.lengthSq() < 1e-6) tangent.set(0, 0, 1);
    tangent.normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x);
    const onBridge = Math.hypot(point.x - CROSSING_X, point.z - CROSSING_Z) < 16;
    const y = onBridge ? bridgeDeckY() + 0.08 : terrainHeight(point.x, point.z) + 0.42;
    for (const sign of [-1, 1]) {
      const edge = point.clone().addScaledVector(side, sign * 1.45);
      const edgeY = onBridge ? y : terrainHeight(edge.x, edge.z) + 0.42;
      positions.push(edge.x, edgeY, edge.z);
    }
    if (index < sampled.length - 1) {
      const offset = index * 2;
      indices.push(offset, offset + 1, offset + 2, offset + 1, offset + 3, offset + 2);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
