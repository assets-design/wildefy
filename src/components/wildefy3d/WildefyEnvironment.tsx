"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SceneQuality } from "@/lib/wildefy3d/quality";
import {
  BASE_CAMP,
  CROSSING_X,
  CROSSING_Z,
  FALLS_X,
  FALLS_Z,
  FOREST_CAMP,
  SUMMIT,
  bridgeDeckY,
  buildTerrainGeometry,
  buildTrailGeometry,
  terrainHeight,
} from "@/lib/wildefy3d/terrain";
import { applyFoliageWind } from "@/lib/wildefy3d/wind";

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Cabin({
  x,
  z,
  rotation = 0,
  scale = 1,
}: {
  x: number;
  z: number;
  rotation?: number;
  scale?: number;
}) {
  const y = terrainHeight(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.4, 3.4, 3.8]} />
        <meshStandardMaterial color="#8d5a34" roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.05, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[4.3, 2.3, 4]} />
        <meshStandardMaterial color="#5c4030" roughness={0.86} />
      </mesh>
      <mesh position={[1.5, 4.7, 0]}>
        <boxGeometry args={[0.45, 1.1, 0.45]} />
        <meshStandardMaterial color="#4a403c" roughness={1} />
      </mesh>
      <mesh position={[0, 1.15, 1.95]}>
        <boxGeometry args={[1.2, 2.1, 0.12]} />
        <meshStandardMaterial color="#241910" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Tent({ x, z, rotation = 0.4 }: { x: number; z: number; rotation?: number }) {
  const y = terrainHeight(x, z);
  return (
    <mesh position={[x, y + 1.15, z]} rotation={[0, rotation, 0]} castShadow>
      <coneGeometry args={[1.7, 2.3, 4]} />
      <meshStandardMaterial color="#d9c7a4" roughness={0.82} />
    </mesh>
  );
}

function RockField({
  count,
  color,
  snow,
}: {
  count: number;
  color: string;
  snow: boolean;
}) {
  const geometry = useMemo(() => new THREE.DodecahedronGeometry(1.4, 0), []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness: 0.96, metalness: 0 }),
    [color],
  );
  const ref = useRef<THREE.InstancedMesh>(null);
  const placements = useMemo(() => {
    const rand = mulberry32(snow ? 0x534e4f57 : 0x524f434b);
    const matrices: THREE.Matrix4[] = [];
    let attempts = 0;
    while (matrices.length < count && attempts < count * 40) {
      attempts += 1;
      const x = (rand() - 0.5) * 1100;
      const z = rand() * -1500 + 240;
      const y = terrainHeight(x, z);
      if (snow ? y < 198 : y > 230) continue;
      if (Math.hypot(x - BASE_CAMP.x, z - BASE_CAMP.z) < 40) continue;
      const size = THREE.MathUtils.lerp(snow ? 1.2 : 0.45, snow ? 3.4 : 2.6, rand());
      const matrix = new THREE.Matrix4();
      const quaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(rand() * 0.4, rand() * Math.PI * 2, rand() * 0.4),
      );
      matrix.compose(
        new THREE.Vector3(x, y + size * 0.15, z),
        quaternion,
        new THREE.Vector3(size * 1.3, size * 0.7, size),
      );
      matrices.push(matrix);
    }
    return matrices;
  }, [count, snow]);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    placements.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  if (placements.length === 0) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, placements.length]}
      frustumCulled={false}
      receiveShadow
    />
  );
}

export function WildefyEnvironment({ quality }: { quality: SceneQuality }) {
  const terrain = useMemo(
    () => buildTerrainGeometry(quality.terrain[0], quality.terrain[1]),
    [quality.terrain],
  );
  const trail = useMemo(() => buildTrailGeometry(), []);
  const terrainMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94, metalness: 0 }),
    [],
  );
  const trailMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#6b4e34",
        roughness: 1,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
    [],
  );
  const flagGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(1.3, 0.78, 4, 2);
    geometry.translate(0.65, 0, 0);
    const winds = new Float32Array(geometry.attributes.position.count);
    winds.fill(1);
    geometry.setAttribute("aWind", new THREE.BufferAttribute(winds, 1));
    return geometry;
  }, []);
  const flagMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: "#2f6a32",
      roughness: 0.7,
      side: THREE.DoubleSide,
    });
    applyFoliageWind(material, 0.18, "attribute");
    return material;
  }, []);
  const fire = useRef<THREE.Mesh>(null);
  const forestFire = useRef<THREE.Mesh>(null);
  const deck = bridgeDeckY();

  useEffect(
    () => () => {
      terrain.dispose();
      trail.dispose();
      terrainMaterial.dispose();
      trailMaterial.dispose();
      flagGeometry.dispose();
      flagMaterial.dispose();
    },
    [terrain, trail, terrainMaterial, trailMaterial, flagGeometry, flagMaterial],
  );

  useFrame(({ clock }) => {
    const flicker = 1 + Math.sin(clock.elapsedTime * 11) * 0.08 + Math.sin(clock.elapsedTime * 23) * 0.04;
    if (fire.current) fire.current.scale.y = flicker;
    if (forestFire.current) forestFire.current.scale.y = 1 + Math.sin(clock.elapsedTime * 9 + 1.2) * 0.1;
  });

  const campY = terrainHeight(BASE_CAMP.x, BASE_CAMP.z);
  const forestY = terrainHeight(FOREST_CAMP.x, FOREST_CAMP.z);
  const summitY = terrainHeight(SUMMIT.x, SUMMIT.z);

  return (
    <group name="WildefyEnvironment">
      <mesh geometry={terrain} material={terrainMaterial} receiveShadow castShadow />
      <mesh geometry={trail} material={trailMaterial} receiveShadow />

      <RockField count={quality.rocks} color="#6e6a64" snow={false} />
      <RockField count={quality.snowRocks} color="#e5e1d8" snow />

      <Cabin x={-98} z={208} rotation={0.4} scale={1.15} />
      <Cabin x={-68} z={186} rotation={-0.5} scale={0.92} />
      <Tent x={-52} z={214} rotation={0.8} />
      <Tent x={-112} z={184} rotation={0.2} />

      <mesh position={[-78, campY + 0.35, 214]} ref={fire}>
        <coneGeometry args={[0.42, 1.05, 7]} />
        <meshStandardMaterial color="#ff8a2a" emissive="#ff4d00" emissiveIntensity={2.4} />
      </mesh>
      <mesh position={[-78, campY + 0.12, 214]}>
        <cylinderGeometry args={[0.85, 0.95, 0.28, 8]} />
        <meshStandardMaterial color="#6a625c" roughness={1} />
      </mesh>
      <pointLight position={[-78, campY + 1.4, 214]} color="#ff7a2a" intensity={8} distance={22} decay={2} />

      <mesh position={[-60, campY + 2.3, 198]}>
        <cylinderGeometry args={[0.07, 0.09, 4.6, 6]} />
        <meshStandardMaterial color="#6b5038" roughness={0.9} />
      </mesh>
      <mesh geometry={flagGeometry} material={flagMaterial} position={[-60, campY + 4.15, 198]} />

      <mesh position={[-58, terrainHeight(-58, 150) + 1.1, 150]} castShadow>
        <boxGeometry args={[0.18, 2.2, 0.18]} />
        <meshStandardMaterial color="#6a4e34" roughness={0.9} />
      </mesh>
      <mesh position={[-58, terrainHeight(-58, 150) + 1.9, 150]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.9, 0.55, 0.08]} />
        <meshStandardMaterial color="#8a6844" roughness={0.85} />
      </mesh>

      <group position={[CROSSING_X, deck, CROSSING_Z]}>
        {Array.from({ length: 15 }, (_, index) => (
          <mesh key={index} position={[-16 + index * 2.15, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[2, 0.28, 5.4]} />
            <meshStandardMaterial color="#7a5230" roughness={0.92} />
          </mesh>
        ))}
        {[-2.4, 2.4].map((z) => (
          <group key={z}>
            <mesh position={[0, 0.7, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.08, 0.08, 32, 6]} />
              <meshStandardMaterial color="#c2b49a" roughness={0.7} />
            </mesh>
            {[-14, -7, 0, 7, 14].map((x) => (
              <mesh key={x} position={[x, 0.45, z]} castShadow>
                <cylinderGeometry args={[0.1, 0.12, 1.1, 5]} />
                <meshStandardMaterial color="#6b4a30" roughness={0.9} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      <Cabin x={FOREST_CAMP.x} z={FOREST_CAMP.z} rotation={0.6} scale={0.72} />
      <Tent x={FOREST_CAMP.x + 10} z={FOREST_CAMP.z + 6} rotation={1.1} />
      <mesh position={[FOREST_CAMP.x + 6, forestY + 0.55, FOREST_CAMP.z - 6]} castShadow>
        <boxGeometry args={[2.4, 0.16, 1.1]} />
        <meshStandardMaterial color="#6d4c32" roughness={0.9} />
      </mesh>
      <mesh position={[FOREST_CAMP.x + 5.2, forestY + 0.32, FOREST_CAMP.z - 6.3]}>
        <boxGeometry args={[0.12, 0.64, 0.12]} />
        <meshStandardMaterial color="#5b4030" />
      </mesh>
      <mesh position={[FOREST_CAMP.x + 6.8, forestY + 0.32, FOREST_CAMP.z - 5.7]}>
        <boxGeometry args={[0.12, 0.64, 0.12]} />
        <meshStandardMaterial color="#5b4030" />
      </mesh>
      <mesh ref={forestFire} position={[FOREST_CAMP.x - 6, forestY + 0.45, FOREST_CAMP.z + 4]}>
        <coneGeometry args={[0.38, 0.9, 6]} />
        <meshStandardMaterial color="#ff8a2a" emissive="#ff4d00" emissiveIntensity={2} />
      </mesh>
      <pointLight
        position={[FOREST_CAMP.x - 6, forestY + 1.3, FOREST_CAMP.z + 4]}
        color="#ff7a2a"
        intensity={5}
        distance={16}
        decay={2}
      />

      <mesh position={[FALLS_X + 6, terrainHeight(FALLS_X + 6, FALLS_Z) + 3.2, FALLS_Z]} castShadow>
        <dodecahedronGeometry args={[4.2, 0]} />
        <meshStandardMaterial color="#6a6660" roughness={0.97} />
      </mesh>
      <mesh position={[FALLS_X - 8, terrainHeight(FALLS_X - 8, FALLS_Z - 2) + 4, FALLS_Z - 2]} castShadow>
        <dodecahedronGeometry args={[5.4, 0]} />
        <meshStandardMaterial color="#746f68" roughness={0.97} />
      </mesh>
      <mesh position={[18, terrainHeight(18, -820) + 2.4, -820]} castShadow>
        <dodecahedronGeometry args={[3.6, 0]} />
        <meshStandardMaterial color="#7a756e" roughness={0.96} />
      </mesh>
      <mesh position={[SUMMIT.x + 4, summitY + 1.6, SUMMIT.z]}>
        <cylinderGeometry args={[0.08, 0.1, 3.4, 6]} />
        <meshStandardMaterial color="#6b5038" />
      </mesh>
      <mesh geometry={flagGeometry} material={flagMaterial} position={[SUMMIT.x + 4.1, summitY + 3.1, SUMMIT.z]} />
    </group>
  );
}
