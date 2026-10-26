"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { MutableRefObject } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SUN_POSITION } from "@/config/wildefySceneManifest";
import type { SceneQuality } from "@/lib/wildefy3d/quality";
import { terrainHeight } from "@/lib/wildefy3d/terrain";

const skyVertex = `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 world = modelMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const skyFragment = `
uniform vec3 uSun;
uniform vec3 uTop;
uniform vec3 uHorizon;
varying vec3 vDir;
void main() {
  vec3 dir = normalize(vDir);
  float height = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 color = mix(uHorizon, uTop, smoothstep(0.02, 0.72, height));
  float sunDot = max(dot(dir, normalize(uSun)), 0.0);
  color += vec3(1.0, 0.62, 0.28) * pow(sunDot, 18.0) * 0.55;
  color += vec3(1.0, 0.95, 0.82) * pow(sunDot, 1400.0);
  gl_FragColor = vec4(color, 1.0);
}
`;

function cloudTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const puff = (x: number, y: number, radius: number, alpha: number) => {
    const gradient = context.createRadialGradient(x, y, radius * 0.15, x, y, radius);
    gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  };
  puff(128, 146, 78, 0.62);
  puff(86, 156, 52, 0.42);
  puff(176, 152, 56, 0.4);
  puff(128, 112, 42, 0.34);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function cloudGeometry() {
  const flat = new THREE.PlaneGeometry(1, 0.72);
  flat.rotateX(-Math.PI / 2);
  const upright = new THREE.PlaneGeometry(0.72, 0.28);
  upright.translate(0, 0.08, 0);
  const merged = mergeGeometries([flat, upright], false);
  flat.dispose();
  upright.dispose();
  if (merged) return merged;
  const fallback = new THREE.PlaneGeometry(1, 0.72);
  fallback.rotateX(-Math.PI / 2);
  return fallback;
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function CloudLayer({
  count,
  seed,
  yMin,
  yMax,
  opacity,
  valley,
  progressRef,
}: {
  count: number;
  seed: number;
  yMin: number;
  yMax: number;
  opacity: number;
  valley: boolean;
  progressRef?: MutableRefObject<number>;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D());
  const geometry = useMemo(() => cloudGeometry(), []);
  const material = useMemo(() => {
    const texture = cloudTexture();
    return new THREE.MeshBasicMaterial({
      map: texture,
      color: valley ? "#f4f1ea" : "#ffffff",
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, [opacity, valley]);
  const clouds = useMemo(() => {
    const rand = mulberry32(seed);
    const items: { x: number; y: number; z: number; speed: number; scale: THREE.Vector3 }[] = [];
    let attempts = 0;
    while (items.length < count && attempts < count * 30) {
      attempts += 1;
      const x = (rand() - 0.5) * 1400;
      const z = rand() * -1700 + 280;
      const ground = terrainHeight(x, z);
      if (valley && ground > 90) continue;
      if (!valley && Math.hypot(x - 40, z + 1085) < 160) continue;
      const radius = THREE.MathUtils.lerp(valley ? 48 : 36, valley ? 110 : 86, rand());
      items.push({
        x,
        y: valley ? THREE.MathUtils.lerp(yMin, yMax, rand()) : Math.max(ground + 80, THREE.MathUtils.lerp(yMin, yMax, rand())),
        z,
        speed: THREE.MathUtils.lerp(1.6, 4.2, rand()),
        scale: new THREE.Vector3(radius, radius * THREE.MathUtils.lerp(0.45, 0.7, rand()), radius),
      });
    }
    return items;
  }, [count, seed, valley, yMin, yMax]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    clouds.forEach((cloud, index) => {
      dummy.current.position.set(cloud.x, cloud.y, cloud.z);
      dummy.current.scale.copy(cloud.scale);
      dummy.current.updateMatrix();
      mesh.setMatrixAt(index, dummy.current.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [clouds]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.map?.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((_, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    clouds.forEach((cloud) => {
      cloud.x += cloud.speed * delta;
      if (cloud.x > 780) cloud.x = -780;
    });
    clouds.forEach((cloud, index) => {
      dummy.current.position.set(cloud.x, cloud.y, cloud.z);
      dummy.current.scale.copy(cloud.scale);
      dummy.current.updateMatrix();
      mesh.setMatrixAt(index, dummy.current.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (valley && progressRef) {
      const progress = progressRef.current;
      const opening = 1 - THREE.MathUtils.smoothstep(progress, 0.08, 0.2);
      const summit = THREE.MathUtils.smoothstep(progress, 0.9, 0.98);
      material.opacity = 0.05 + opening * 0.28 + summit * 0.34;
    }
  });

  if (clouds.length === 0) return null;
  return (
    <instancedMesh ref={ref} args={[geometry, material, clouds.length]} frustumCulled={false} />
  );
}

export function WildefySky({
  quality,
  progressRef,
}: {
  quality: SceneQuality;
  progressRef: MutableRefObject<number>;
}) {
  const uniforms = useMemo(
    () => ({
      uSun: { value: new THREE.Vector3(...SUN_POSITION).normalize() },
      uTop: { value: new THREE.Color("#6ea4d6") },
      uHorizon: { value: new THREE.Color("#f2c7a2") },
    }),
    [],
  );
  const mistGeometry = useMemo(() => {
    const rand = mulberry32(0x4d495354);
    const positions: number[] = [];
    for (let index = 0; index < quality.mist; index += 1) {
      const x = (rand() - 0.5) * 900;
      const z = rand() * -1200 + 80;
      positions.push(x, terrainHeight(x, z) + THREE.MathUtils.lerp(8, 36, rand()), z);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, [quality.mist]);

  useEffect(() => () => mistGeometry.dispose(), [mistGeometry]);

  const sky = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => {
    if (sky.current) sky.current.position.copy(camera.position);
  });

  return (
    <group name="WildefySky">
      <mesh ref={sky} frustumCulled={false} renderOrder={-10}>
        <sphereGeometry args={[3000, 40, 24]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={skyVertex}
          fragmentShader={skyFragment}
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>
      <CloudLayer
        count={quality.clouds}
        seed={0x434c4448}
        yMin={680}
        yMax={860}
        opacity={0.55}
        valley={false}
      />
      <CloudLayer
        count={quality.valleyClouds}
        seed={0x56414c4c}
        yMin={78}
        yMax={130}
        opacity={0.4}
        valley
        progressRef={progressRef}
      />
      <points geometry={mistGeometry} frustumCulled={false}>
        <pointsMaterial color="#e7eef2" size={6} transparent opacity={0.08} depthWrite={false} />
      </points>
    </group>
  );
}
