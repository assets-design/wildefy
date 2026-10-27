"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { createElement, Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { globeDestinations, indiaSafariParks } from "./content";
import { getGlobeJourney, JOURNEY_WEIGHTS } from "./globeJourney";
import { buildLandscape, landscapeCamera, atmosphere, type Biome } from "./landscapes";
import type { MapDesign } from "./mapDesign";

type Props = { progress: React.MutableRefObject<number>; design: MapDesign };

const R = 1.6;
const EARTH_URL = "/globe-kit/earth.jpg";
const EARTH_FALLBACK = "/textures/earth_atmos_2048.jpg";
const SUNRISE = new THREE.Color("#f2b98a");
const SPACE = new THREE.Color("#0f1412");

function latLonToVec(lat: number, lon: number, r: number) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}
function targetRot(lat: number, lon: number) {
  const l = THREE.MathUtils.degToRad(lon);
  return {
    y: -Math.atan2(Math.cos(l), -Math.sin(l)),
    x: THREE.MathUtils.degToRad(lat),
  };
}
const shortest = (a: number, b: number, t: number) =>
  a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t;

function labelTexture(text: string, main: boolean) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const g = c.getContext("2d");
  if (g) {
    g.font = `${main ? 600 : 500} 54px Manrope, sans-serif`;
    g.textBaseline = "middle";
    g.shadowColor = "rgba(0,0,0,0.85)";
    g.shadowBlur = 14;
    g.fillStyle = main ? "#F5A623" : "#F3EBDD";
    g.fillText(text.toUpperCase(), 24, 64);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function buildParks() {
  const group = new THREE.Group();
  const items = indiaSafariParks.map((p, i) => {
    const main = i === indiaSafariParks.length - 1;
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 16, 16),
      new THREE.MeshBasicMaterial({ color: main ? "#F5A623" : "#F7C860" }),
    );
    dot.position.copy(latLonToVec(p.lat, p.lon, R * 1.02));
    const label = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: labelTexture(p.name, main),
        transparent: true,
        depthWrite: false,
        depthTest: false,
        opacity: 0,
      }),
    );
    label.center.set(-0.04, 0.5);
    label.position.copy(latLonToVec(p.lat, p.lon, R * 1.03));
    label.renderOrder = 10;
    group.add(dot, label);
    return { dot, label, main };
  });
  return { group, items };
}

function useCloudTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const g = c.getContext("2d");
    if (g)
      for (let i = 0; i < 220; i++) {
        const x = Math.random() * 1024,
          y = 60 + Math.random() * 392,
          r = 8 + Math.random() * 40;
        const grd = g.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, "rgba(255,255,255,0.45)");
        grd.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grd;
        g.beginPath();
        g.ellipse(x, y, r * 2.2, r * 0.6, 0, 0, Math.PI * 2);
        g.fill();
      }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

function World({ progress }: Props) {
  const { scene, camera, size } = useThree();
  const earth = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const markers = useRef<THREE.Mesh[]>([]);
  const tex = useLoader(THREE.TextureLoader, EARTH_URL, undefined, () => {
    /* fall through — Canvas remounts with fallback if needed */
  });
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const cloudTex = useCloudTexture();
  const targets = useMemo(
    () => globeDestinations.map((d) => targetRot(d.lat, d.lon)),
    [],
  );
  const lands = useMemo(
    () =>
      globeDestinations.map((d) =>
        buildLandscape(d.biome as Biome, size.width < 768),
      ),
    [size.width],
  );
  const mode = useRef<"globe" | number>("globe");
  const parks = useMemo(() => buildParks(), []);
  useEffect(
    () => () =>
      parks.group.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Sprite) {
          const m = o.material as THREE.Material & {
            map?: THREE.Texture | null;
          };
          m.map?.dispose();
          m.dispose();
          o.geometry.dispose();
        }
      }),
    [parks],
  );
  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      look: new THREE.Vector3(),
      curLook: new THREE.Vector3(),
    }),
    [],
  );

  useEffect(
    () => () => {
      scene.background = null;
      scene.fog = null;
    },
    [scene],
  );
  useEffect(
    () => () => {
      const textures = new Set<THREE.Texture>();
      lands.forEach((group) =>
        group.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) =>
            Object.values(material).forEach((value) => {
              if (value instanceof THREE.Texture) textures.add(value);
            }),
          );
        }),
      );
      textures.forEach((texture) => texture.dispose());
    },
    [lands],
  );

  useFrame((state, raw) => {
    const dt = Math.min(raw, 0.05);
    const p = progress.current;
    const j = getGlobeJourney(p, targets.length, JOURNEY_WEIGHTS);
    const k = 1 - Math.exp(-6 * dt);
    const nextMode = j.inLandscape ? j.index : "globe";
    const snap = nextMode !== mode.current;
    mode.current = nextMode;

    lands.forEach((g, i) => {
      g.visible = j.inLandscape && i === j.index;
    });
    if (earth.current) earth.current.visible = !j.inLandscape;

    if (j.inLandscape) {
      const destination = globeDestinations[j.index];
      if (!destination) return;
      const biome = destination.biome as Biome;
      const climate = atmosphere[biome];
      scene.background = new THREE.Color(climate.sky);
      if (
        !(scene.fog instanceof THREE.Fog) ||
        scene.fog.near !== climate.fogNear
      )
        scene.fog = new THREE.Fog(climate.sky, climate.fogNear, climate.fogFar);
      if (biome === "forest") {
        const f = THREE.MathUtils.smoothstep(j.landscapeT, 0.5, 0.85);
        (scene.background as THREE.Color).lerp(SUNRISE, f);
        if (scene.fog instanceof THREE.Fog)
          scene.fog.color.copy(scene.background as THREE.Color);
      }
      landscapeCamera(biome, j.landscapeT, tmp.pos, tmp.look);
      if (snap) {
        camera.position.copy(tmp.pos);
        tmp.curLook.copy(tmp.look);
      }
      camera.position.lerp(tmp.pos, k);
      tmp.curLook.lerp(tmp.look, k);
      camera.lookAt(tmp.curLook);
      const upd = lands[j.index]?.userData["update"] as
        | ((t: number, camera?: THREE.Camera) => void)
        | undefined;
      upd?.(state.clock.elapsedTime, camera);
      return;
    }

    scene.background = SPACE;
    scene.fog = null;
    const idx = j.active ? j.index : p < 0.5 ? 0 : targets.length - 1;
    const dest = targets[idx];
    if (!dest) return;
    const from =
      (j.active && idx > 0 ? targets[idx - 1] : undefined) ?? {
        y: dest.y - 0.9,
        x: 0.3,
      };
    const blend = j.active ? j.rotate : p < 0.5 ? 0 : 1;
    const ty = shortest(from.y, dest.y, blend);
    const tx = THREE.MathUtils.lerp(from.x, dest.x, blend);
    if (spin.current && tilt.current) {
      if (snap) {
        spin.current.rotation.y = ty;
        tilt.current.rotation.x = tx;
      }
      spin.current.rotation.y = shortest(spin.current.rotation.y, ty, k);
      tilt.current.rotation.x += (tx - tilt.current.rotation.x) * k;
    }
    if (clouds.current) clouds.current.rotation.y += dt * 0.015;
    const target = new THREE.Vector3(0, 0, j.distance);
    if (snap) camera.position.copy(target);
    camera.position.lerp(target, k);
    camera.lookAt(0, 0, 0);
    const near = THREE.MathUtils.clamp((camera.position.z - R) / 2.4, 0.05, 1);
    const inIndia = j.active && idx === 0;
    markers.current.forEach((m, i) => {
      if (!m) return;
      m.visible = !(inIndia && i === 0);
      const s = i === idx ? 1.4 + Math.sin(state.clock.elapsedTime * 3) * 0.3 : 0.8;
      m.scale.setScalar(s * near);
    });
    parks.group.visible = inIndia;
    parks.items.forEach((it, i) => {
      const start = 0.02 + i * 0.0065;
      const r = inIndia
        ? THREE.MathUtils.smoothstep(j.phase, start, start + 0.008)
        : 0;
      const pulse = it.main ? 1.3 + Math.sin(state.clock.elapsedTime * 3) * 0.3 : 1;
      it.dot.scale.setScalar(Math.max(0.0001, r * pulse * near * 0.55));
      (it.label.material as THREE.SpriteMaterial).opacity = r;
      it.label.scale.set(0.32 * near, 0.08 * near, 1);
    });
  });

  return createElement(
    "group",
    null,
    ...lands.map((g, i) =>
      createElement("primitive", { key: `land-${i}`, object: g }),
    ),
    createElement(
      "group",
      { ref: earth },
      createElement("ambientLight", { intensity: 0.35 }),
      createElement("directionalLight", {
        position: [5, 3, 5],
        intensity: 2.4,
      }),
      createElement(
        "group",
        { ref: tilt },
        createElement(
          "group",
          { ref: spin },
          createElement(
            "mesh",
            null,
            createElement("sphereGeometry", { args: [R, 128, 128] }),
            createElement("meshStandardMaterial", {
              map: tex,
              roughness: 0.85,
              metalness: 0,
            }),
          ),
          createElement(
            "mesh",
            { ref: clouds },
            createElement("sphereGeometry", { args: [R * 1.012, 64, 64] }),
            createElement("meshStandardMaterial", {
              map: cloudTex,
              transparent: true,
              depthWrite: false,
              opacity: 0.4,
            }),
          ),
          ...globeDestinations.map((d, i) =>
            createElement(
              "mesh",
              {
                key: d.name,
                position: latLonToVec(d.lat, d.lon, R * 1.02),
                ref: (el: THREE.Mesh | null) => {
                  if (el) markers.current[i] = el;
                },
              },
              createElement("sphereGeometry", { args: [0.022, 16, 16] }),
              createElement("meshBasicMaterial", { color: "#F5A623" }),
            ),
          ),
          createElement("primitive", { object: parks.group }),
        ),
      ),
      createElement(
        "mesh",
        { scale: 1.1 },
        createElement("sphereGeometry", { args: [R, 64, 64] }),
        createElement("shaderMaterial", {
          transparent: true,
          side: THREE.BackSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
          fragmentShader: `varying vec3 vN; void main(){ float i = pow(0.65 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(0.45,0.7,1.0,1.0)*i; }`,
        }),
      ),
      createElement(Stars),
    ),
  );
}

function Stars() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pts = new Float32Array(1500 * 3);
    for (let i = 0; i < pts.length; i++) pts[i] = (Math.random() - 0.5) * 120;
    g.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    return g;
  }, []);
  return createElement(
    "points",
    { geometry: geo },
    createElement("pointsMaterial", {
      size: 0.08,
      color: "#E8DCC6",
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    }),
  );
}

export default function Globe3D({ progress, design }: Props) {
  void design;
  void EARTH_FALLBACK;
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 8], fov: 45, near: 0.05, far: 600 }}
      gl={{ antialias: true }}
    >
      <Suspense fallback={null}>
        <World progress={progress} design="original" />
      </Suspense>
    </Canvas>
  );
}
