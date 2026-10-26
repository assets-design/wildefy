"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { cameraTrail, JOURNEY_KEYS } from "@/config/wildefyCameraPath";
import type { SceneQuality } from "@/lib/wildefy3d/quality";
import {
  BASE_CAMP,
  CROSSING_X,
  CROSSING_Z,
  FALLS_X,
  FALLS_Z,
  FOREST_CAMP,
  LAKE,
  riverX,
  ROUTE_POINTS,
  routeDistance,
  SUMMIT,
  terrainHeight,
} from "@/lib/wildefy3d/terrain";
import { applyFoliageWind } from "@/lib/wildefy3d/wind";

type Placement = {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
};

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function paint(geometry: THREE.BufferGeometry, color: THREE.Color, wind: number) {
  const count = geometry.attributes.position.count;
  const colors = new Float32Array(count * 3);
  const winds = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
    winds[index] = wind;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aWind", new THREE.BufferAttribute(winds, 1));
  return geometry;
}

function buildPine() {
  const parts: THREE.BufferGeometry[] = [];
  const trunk = new THREE.CylinderGeometry(0.2, 0.42, 6.4, 7, 3);
  trunk.translate(0, 3.2, 0);
  parts.push(paint(trunk, new THREE.Color("#6b4630"), 0.05));

  const layers: readonly (readonly [number, number, number, number, string])[] = [
    [5.1, 2.55, 3.5, 0.5, "#1c492b"],
    [6.9, 2.05, 3.15, 0.7, "#245733"],
    [8.6, 1.55, 2.8, 0.88, "#2e693b"],
    [10.2, 1.05, 2.35, 1, "#3b7844"],
  ];
  layers.forEach(([y, radius, height, wind, color], index) => {
    const cone = new THREE.ConeGeometry(radius, height, 9, 2);
    const side = index % 2 === 0 ? 1 : -1;
    cone.translate(side * 0.22, y, side * -0.14);
    cone.scale(index % 2 === 0 ? 1.18 : 0.9, 1, index % 2 === 0 ? 0.82 : 1.12);
    parts.push(paint(cone, new THREE.Color(color), wind));
  });
  for (let index = 0; index < 4; index += 1) {
    const clump = new THREE.ConeGeometry(0.7, 1.6, 6, 1);
    const angle = index * 1.5;
    clump.rotateZ(0.7);
    clump.rotateY(angle);
    clump.translate(Math.cos(angle) * 1.15, 6.2 + (index % 2) * 1.3, Math.sin(angle) * 1.15);
    parts.push(paint(clump, new THREE.Color(index % 2 ? "#2a6236" : "#1e4c2c"), 0.8));
  }

  for (let index = 0; index < 5; index += 1) {
    const branch = new THREE.CylinderGeometry(0.05, 0.09, 1.7, 5, 1);
    const angle = (index / 5) * Math.PI * 2 + 0.4;
    branch.translate(0, 0.7, 0);
    branch.rotateZ(0.95);
    branch.rotateY(angle);
    branch.translate(Math.cos(angle) * 0.25, 4.4 + (index % 2) * 1.5, Math.sin(angle) * 0.25);
    parts.push(paint(branch, new THREE.Color("#5a3d2c"), 0.42));
  }

  const merged = mergeGeometries(parts, false);
  parts.forEach((geometry) => geometry.dispose());
  if (!merged) throw new Error("Pine geometry failed to merge");
  merged.computeVertexNormals();
  return merged;
}

function buildFern() {
  const a = new THREE.PlaneGeometry(1.15, 0.72, 1, 1);
  a.translate(0, 0.28, 0);
  paint(a, new THREE.Color("#3f7a46"), 1);
  const b = a.clone();
  b.rotateY(Math.PI / 2.5);
  const merged = mergeGeometries([a, b], false);
  a.dispose();
  b.dispose();
  if (!merged) throw new Error("Fern geometry failed to merge");
  return merged;
}

const CAMERA_TRAIL = cameraTrail();

function blocked(x: number, z: number, radius: number) {
    if (routeDistance(x, z) < radius) return true;
    if (
      radius > 7 &&
      CAMERA_TRAIL.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < 12)
    ) {
      return true;
    }
  if (Math.abs(x - riverX(z)) < 14) return true;
  if (Math.hypot(x - BASE_CAMP.x, z - BASE_CAMP.z) < 58) return true;
  if (Math.hypot(x - FOREST_CAMP.x, z - FOREST_CAMP.z) < 26) return true;
  if (Math.hypot(x - CROSSING_X, z - CROSSING_Z) < 22) return true;
  if (Math.hypot(x - FALLS_X, z - FALLS_Z) < 20) return true;
  if (Math.hypot(x - SUMMIT.x, z - SUMMIT.z) < 16) return true;
  const lakeDx = (x - LAKE.x) / LAKE.radiusX;
  const lakeDz = (z - LAKE.z) / LAKE.radiusZ;
  if (lakeDx * lakeDx + lakeDz * lakeDz < 1.1) return true;
  return JOURNEY_KEYS.some(
    (key) => key.clearance > 0 && Math.hypot(x - key.position[0], z - key.position[2]) < 13,
  );
}

function placeForest(kind: "pine" | "oak" | "fern" | "bush" | "log", count: number): Placement[] {
  const rand = mulberry32(
    kind === "pine" ? 0x50494e45 : kind === "oak" ? 0x4f414b21 : kind === "fern" ? 0x4645524e : 0x524f434b,
  );
  const placements: Placement[] = [];
  const spacing = kind === "fern" ? 1.8 : kind === "bush" ? 3.2 : kind === "log" ? 18 : 7.5;
  const limit = count * 60;
  let attempts = 0;

  while (placements.length < count && attempts < limit) {
    attempts += 1;
    let x: number;
    let z: number;
    if (kind === "fern" || kind === "log" || rand() < 0.68) {
      const segment = Math.min(ROUTE_POINTS.length - 2, Math.floor(rand() * (ROUTE_POINTS.length - 1)));
      const [ax, az] = ROUTE_POINTS[segment];
      const [bx, bz] = ROUTE_POINTS[segment + 1];
      const t = rand();
      const cx = THREE.MathUtils.lerp(ax, bx, t);
      const cz = THREE.MathUtils.lerp(az, bz, t);
      const side = (rand() < 0.5 ? -1 : 1) * (kind === "fern" ? 8 + rand() * 12 : 16 + rand() * 34);
      x = cx + side;
      z = cz + (rand() - 0.5) * 16;
    } else {
      x = (rand() - 0.5) * 1080;
      z = rand() * -1450 + 260;
    }

    const y = terrainHeight(x, z);
    const corridor = kind === "fern" || kind === "log" ? 6.5 : kind === "bush" ? 8 : 11;
    if (blocked(x, z, corridor)) continue;
    if (kind === "fern" && (routeDistance(x, z) > 24 || y > 150)) continue;
    if (kind === "oak" && (y > 145 || y < 8)) continue;
    if (kind === "pine" && y > 198) continue;
    if (kind === "bush" && y > 175) continue;
    if (kind === "log" && y > 160) continue;
    if (placements.some((item) => Math.hypot(item.position.x - x, item.position.z - z) < spacing)) continue;

    const yaw = rand() * Math.PI * 2;
    let scale = new THREE.Vector3(1, 1, 1);
    if (kind === "pine") {
      const size = THREE.MathUtils.lerp(0.95, 1.75, rand());
      scale = new THREE.Vector3(size, size * THREE.MathUtils.lerp(0.88, 1.16, rand()), size);
    } else if (kind === "oak") {
      const size = THREE.MathUtils.lerp(1.25, 2.05, rand());
      scale = new THREE.Vector3(size, size, size);
    } else if (kind === "fern") {
      const size = THREE.MathUtils.lerp(0.7, 1.7, rand());
      scale = new THREE.Vector3(size, size * 0.8, size);
    } else if (kind === "bush") {
      scale = new THREE.Vector3(
        THREE.MathUtils.lerp(0.45, 0.95, rand()),
        THREE.MathUtils.lerp(0.4, 0.8, rand()),
        THREE.MathUtils.lerp(0.45, 0.95, rand()),
      );
    } else {
      scale = new THREE.Vector3(THREE.MathUtils.lerp(1.4, 2.6, rand()), 0.35, 0.35);
    }

    placements.push({
      position: new THREE.Vector3(x, kind === "log" ? y + 0.3 : kind === "oak" ? y - 0.45 : y, z),
      quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(kind === "log" ? Math.PI / 2 : 0, yaw, 0)),
      scale,
    });
  }
  return placements;
}

function InstanceField({
  geometry,
  material,
  placements,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  placements: Placement[];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh || placements.length === 0) return;
    const dummy = new THREE.Object3D();
    placements.forEach((placement, index) => {
      dummy.position.copy(placement.position);
      dummy.quaternion.copy(placement.quaternion);
      dummy.scale.copy(placement.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements]);

  if (placements.length === 0) return null;
  return (
    <instancedMesh ref={ref} args={[geometry, material, placements.length]} frustumCulled={false} />
  );
}

function OakInstances({ mesh, placements }: { mesh: THREE.Mesh; placements: Placement[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const canopy = /canopy|leaf/i.test(mesh.name);
  const material = useMemo(() => {
    const source = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
    const next = source.clone();
    next.side = canopy ? THREE.DoubleSide : THREE.FrontSide;
    if (next.map) next.map.colorSpace = THREE.SRGBColorSpace;
    if (canopy) applyFoliageWind(next, 0.11, "canopy");
    return next;
  }, [mesh, canopy]);

  const local = useMemo(() => {
    mesh.updateWorldMatrix(true, false);
    return mesh.matrixWorld.clone();
  }, [mesh]);

  useLayoutEffect(() => {
    const instanced = ref.current;
    if (!instanced) return;
    const root = new THREE.Matrix4();
    const composed = new THREE.Matrix4();
    placements.forEach((placement, index) => {
      root.compose(placement.position, placement.quaternion, placement.scale);
      composed.copy(root).multiply(local);
      instanced.setMatrixAt(index, composed);
    });
    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
  }, [placements, local]);

  useEffect(() => () => material.dispose(), [material]);

  if (placements.length === 0) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[mesh.geometry, material, placements.length]}
      frustumCulled={false}
    />
  );
}

export function WildefyVegetation({
  quality,
  onOakProgress,
  onOakSettled,
}: {
  quality: SceneQuality;
  onOakProgress: (ratio: number) => void;
  onOakSettled: (status: "ready" | "failed") => void;
}) {
  const [gltf, setGltf] = useState<GLTF | null>(null);
  const progressSink = useRef(onOakProgress);
  const settledSink = useRef(onOakSettled);
  progressSink.current = onOakProgress;
  settledSink.current = onOakSettled;

  const pineGeometry = useMemo(() => buildPine(), []);
  const fernGeometry = useMemo(() => buildFern(), []);
  const bushGeometry = useMemo(() => {
    const cone = new THREE.ConeGeometry(1, 1.25, 7, 1);
    cone.translate(0, 0.5, 0);
    return cone;
  }, []);
  const logGeometry = useMemo(() => new THREE.CylinderGeometry(0.28, 0.34, 3.4, 6, 1), []);

  const pineMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });
    applyFoliageWind(material, 0.38, "attribute");
    return material;
  }, []);
  const fernMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      side: THREE.DoubleSide,
    });
    applyFoliageWind(material, 0.22, "attribute");
    return material;
  }, []);
  const bushMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({ color: "#2f5c34", roughness: 0.92 });
    return material;
  }, []);
  const logMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#6a4a32", roughness: 0.94 }),
    [],
  );

  const pines = useMemo(() => placeForest("pine", quality.pines), [quality.pines]);
  const oaks = useMemo(() => placeForest("oak", quality.oaks), [quality.oaks]);
  const ferns = useMemo(() => placeForest("fern", quality.ferns), [quality.ferns]);
  const bushes = useMemo(() => placeForest("bush", quality.bushes), [quality.bushes]);
  const logs = useMemo(() => placeForest("log", quality.tier === "mobile" ? 8 : 16), [quality.tier]);

  const oakMeshes = useMemo(() => {
    if (!gltf) return [];
    const meshes: THREE.Mesh[] = [];
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.isMesh) meshes.push(mesh);
    });
    return meshes;
  }, [gltf]);

  useEffect(() => {
    let active = true;
    const loader = new GLTFLoader();
    const timer = window.setTimeout(() => {
      if (!active) return;
      active = false;
      console.warn("[wildefy3d] oak model timed out — conifer forest remains");
      settledSink.current("failed");
    }, 18000);

    loader.load(
      "/models/oak_tree_web.glb",
      (loaded) => {
        if (!active) return;
        active = false;
        window.clearTimeout(timer);
        setGltf(loaded);
        console.info("[wildefy3d] oak model loaded");
        settledSink.current("ready");
      },
      (event) => {
        if (event.total > 0) progressSink.current(event.loaded / event.total);
      },
      (error) => {
        if (!active) return;
        active = false;
        window.clearTimeout(timer);
        console.warn("[wildefy3d] oak model failed", error);
        settledSink.current("failed");
      },
    );

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(
    () => () => {
      pineGeometry.dispose();
      fernGeometry.dispose();
      bushGeometry.dispose();
      logGeometry.dispose();
      pineMaterial.dispose();
      fernMaterial.dispose();
      bushMaterial.dispose();
      logMaterial.dispose();
    },
    [pineGeometry, fernGeometry, bushGeometry, logGeometry, pineMaterial, fernMaterial, bushMaterial, logMaterial],
  );

  return (
    <group name="WildefyVegetation">
      <InstanceField geometry={pineGeometry} material={pineMaterial} placements={pines} />
      <InstanceField geometry={fernGeometry} material={fernMaterial} placements={ferns} />
      <InstanceField geometry={bushGeometry} material={bushMaterial} placements={bushes} />
      <InstanceField geometry={logGeometry} material={logMaterial} placements={logs} />
      {oakMeshes.map((mesh) => (
        <OakInstances key={mesh.uuid} mesh={mesh} placements={oaks} />
      ))}
    </group>
  );
}
