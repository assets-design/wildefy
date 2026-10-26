"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  CROSSING_Z,
  FALLS_X,
  FALLS_Z,
  LAKE,
  riverX,
  terrainHeight,
} from "@/lib/wildefy3d/terrain";
import { createWaterMaterial } from "@/lib/wildefy3d/wind";

function buildRiver() {
  const rows = 200;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let row = 0; row <= rows; row += 1) {
    const z = THREE.MathUtils.lerp(240, -920, row / rows);
    const center = riverX(z);
    const falls = Math.exp(-((z - FALLS_Z) ** 2) / (80 * 80));
    const half = 10 + Math.sin(row * 0.37) * 2.4 + falls * 12;
    const y = terrainHeight(center, z) + 0.7;
    for (const side of [-1, 1]) {
      positions.push(center + side * half, y, z);
      uvs.push(side < 0 ? 0 : 1, row / 7);
    }
    if (row < rows) {
      const start = row * 2;
      indices.push(start, start + 1, start + 2, start + 1, start + 3, start + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function WildefyWater() {
  const riverGeometry = useMemo(() => buildRiver(), []);
  const riverMaterial = useMemo(() => createWaterMaterial(0.9), []);
  const fallMaterial = useMemo(() => createWaterMaterial(0.72), []);
  const mist = useRef<THREE.Points>(null);
  const mistBase = useMemo(() => {
    const rand = (index: number) => {
      const n = Math.sin(index * 127.1) * 43758.5453;
      return n - Math.floor(n);
    };
    const points: number[] = [];
    for (let index = 0; index < 180; index += 1) {
      points.push(
        FALLS_X + (rand(index) - 0.5) * 22,
        terrainHeight(FALLS_X, FALLS_Z + 16) + rand(index + 3) * 14,
        FALLS_Z + 12 + (rand(index + 9) - 0.5) * 16,
      );
    }
    return points;
  }, []);
  const mistGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(mistBase, 3));
    return geometry;
  }, [mistBase]);

  const lip = terrainHeight(FALLS_X, FALLS_Z - 6);
  const pool = terrainHeight(FALLS_X, FALLS_Z + 22);
  const lakeY = terrainHeight(LAKE.x, LAKE.z) + 0.35;

  useEffect(
    () => () => {
      riverGeometry.dispose();
      riverMaterial.dispose();
      fallMaterial.dispose();
      mistGeometry.dispose();
    },
    [riverGeometry, riverMaterial, fallMaterial, mistGeometry],
  );

  useFrame(({ clock }) => {
    const points = mist.current?.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (!points) return;
    const elapsed = clock.elapsedTime;
    for (let index = 0; index < points.count; index += 1) {
      const origin = index * 3;
      const lift = (elapsed * 6 + index * 1.7) % 16;
      points.setXYZ(
        index,
        mistBase[origin] + Math.sin(elapsed * 1.4 + index) * 1.4,
        mistBase[origin + 1] + lift * 0.35,
        mistBase[origin + 2] + Math.cos(elapsed + index) * 1.2,
      );
    }
    points.needsUpdate = true;
  });

  return (
    <group name="WildefyWater">
      <mesh geometry={riverGeometry} material={riverMaterial} renderOrder={2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[LAKE.x, lakeY, LAKE.z]} material={riverMaterial}>
        <circleGeometry args={[LAKE.radiusX * 0.92, 40]} />
      </mesh>
      <mesh
        position={[FALLS_X, (lip + pool) / 2, FALLS_Z + 8]}
        material={fallMaterial}
        renderOrder={3}
      >
        <planeGeometry args={[16, Math.max(22, lip - pool + 10), 1, 28]} />
      </mesh>
      <mesh
        position={[FALLS_X + 4, (lip + pool) / 2 - 2, FALLS_Z + 11]}
        rotation={[0, 0.18, 0]}
        material={fallMaterial}
        renderOrder={3}
      >
        <planeGeometry args={[7, Math.max(16, (lip - pool) * 0.7), 1, 16]} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[FALLS_X, pool + 0.55, FALLS_Z + 20]}
        material={riverMaterial}
      >
        <circleGeometry args={[18, 36]} />
      </mesh>
      <mesh position={[FALLS_X, lip - 2, FALLS_Z - 2]} castShadow receiveShadow>
        <boxGeometry args={[28, Math.max(18, lip - pool), 8]} />
        <meshStandardMaterial color="#6a6660" roughness={0.97} />
      </mesh>
      <points ref={mist} geometry={mistGeometry}>
        <pointsMaterial color="#e7f3f4" size={2.4} transparent opacity={0.28} depthWrite={false} />
      </points>
      <mesh position={[riverX(CROSSING_Z) + 8, terrainHeight(riverX(CROSSING_Z) + 10, CROSSING_Z) - 0.2, CROSSING_Z + 4]}>
        <dodecahedronGeometry args={[1.6, 0]} />
        <meshStandardMaterial color="#5e675f" roughness={0.96} />
      </mesh>
    </group>
  );
}
