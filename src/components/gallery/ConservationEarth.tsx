"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import * as THREE from "three";
import styles from "./conservation.module.css";

const MAX_TILT = Math.PI / 2 - 0.12;
/** One full turn across the pinned Conservation runway. */
const SCROLL_TURNS = Math.PI * 2;
/** Face Africa / Europe on the visible half-disc (texture seam sits at the back). */
const SPIN_OFFSET = -Math.PI / 2;
const EARTH_FOV = 42;
/**
 * Exact spherical limb fit: half-angle asin(R/d) = fov/2 → d = 1 / sin(fov/2).
 * Keep scale ≤ 1 so the limb stays inside the view (overfill hits the square
 * canvas edge and looks like a flat rectangular pillar).
 */
const EARTH_CAM_Z = 1 / Math.sin(THREE.MathUtils.degToRad(EARTH_FOV / 2));
const EARTH_MESH_SCALE = 1;

type Orientation = {
  spin: number;
  tilt: number;
  manual: boolean;
  revision: number;
};

function Atmosphere() {
  const mat = useRef(
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `varying vec3 vN; void main(){ float i = pow(0.55 - dot(vN, vec3(0.0,0.0,1.0)), 4.5); gl_FragColor = vec4(0.4,0.75,1.0,1.0)*i*0.35; }`,
    }),
  );
  return (
    <mesh scale={1.01} material={mat.current}>
      <sphereGeometry args={[1, 64, 64]} />
    </mesh>
  );
}

/** Lock perspective so the unit-sphere silhouette matches the circular disc. */
function FitDiscCamera() {
  const { camera, size } = useThree();

  const apply = (cam: THREE.PerspectiveCamera, aspect: number) => {
    cam.fov = EARTH_FOV;
    cam.aspect = aspect;
    cam.near = 0.1;
    cam.far = 40;
    cam.position.set(0, 0, EARTH_CAM_Z);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  };

  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!cam.isPerspectiveCamera) return;
    apply(cam, size.width / Math.max(size.height, 1));
  }, [camera, size]);

  useFrame(({ camera: cam, size: s }) => {
    const persp = cam as THREE.PerspectiveCamera;
    if (!persp.isPerspectiveCamera) return;
    const aspect = s.width / Math.max(s.height, 1);
    // Always re-assert — R3F can nudge aspect on resize mid-frame.
    if (
      Math.abs(persp.fov - EARTH_FOV) > 0.01 ||
      Math.abs(persp.aspect - aspect) > 0.0005 ||
      Math.abs(persp.position.z - EARTH_CAM_Z) > 0.001
    ) {
      apply(persp, aspect);
    }
  });

  return null;
}

function EarthMesh({
  progress,
  orientation,
  dragging,
  revision,
}: {
  progress: MutableRefObject<number>;
  orientation: MutableRefObject<Orientation>;
  dragging: MutableRefObject<boolean>;
  revision: MutableRefObject<number>;
}) {
  const [map, spec] = useLoader(THREE.TextureLoader, [
    "/textures/earth_atmos_2048.jpg",
    "/textures/earth_specular_2048.jpg",
  ]) as [THREE.Texture, THREE.Texture];
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  spec.anisotropy = 8;

  const tiltRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const cloudMap = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const g = c.getContext("2d");
    if (g) {
      for (let i = 0; i < 180; i++) {
        const x = Math.random() * 1024;
        const y = 50 + Math.random() * 412;
        const r = 6 + Math.random() * 36;
        const grd = g.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, "rgba(255,255,255,0.4)");
        grd.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grd;
        g.beginPath();
        g.ellipse(x, y, r * 2.1, r * 0.55, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const state = orientation.current;

    if (!dragging.current && revision.current !== state.revision) {
      state.manual = false;
    }
    state.revision = revision.current;

    const targetSpin = progress.current * SCROLL_TURNS + SPIN_OFFSET;
    const targetTilt = Math.sin(progress.current * Math.PI * 2) * 0.12;

    if (!state.manual && !dragging.current) {
      const blend = 1 - Math.exp(-5.5 * dt);
      const diff = Math.atan2(
        Math.sin(targetSpin - state.spin),
        Math.cos(targetSpin - state.spin),
      );
      state.spin += diff * blend;
      state.tilt += (targetTilt - state.tilt) * blend;
    }

    if (spinRef.current) spinRef.current.rotation.y = state.spin;
    if (tiltRef.current) tiltRef.current.rotation.x = state.tilt;
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = state.spin * 1.08 + dt * 0.02;
    }
  });

  return (
    <group scale={EARTH_MESH_SCALE}>
      <group ref={tiltRef}>
        <group ref={spinRef}>
          <mesh>
            <sphereGeometry args={[1, 96, 96]} />
            <meshPhongMaterial
              map={map}
              specularMap={spec}
              specular={new THREE.Color("#3a5a4a")}
              shininess={18}
            />
          </mesh>
          <mesh ref={cloudsRef} scale={1.012}>
            <sphereGeometry args={[1, 64, 64]} />
            <meshPhongMaterial
              map={cloudMap}
              transparent
              opacity={0.2}
              depthWrite={false}
            />
          </mesh>
        </group>
      </group>
      <Atmosphere />
    </group>
  );
}

export default function ConservationEarth({
  progress,
}: {
  progress: MutableRefObject<number>;
}) {
  const orientation = useRef<Orientation>({
    spin: SPIN_OFFSET,
    tilt: 0,
    manual: false,
    revision: 0,
  });
  const dragging = useRef(false);
  const revision = useRef(0);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const surface = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let last = progress.current;
    let raf = 0;
    const tick = () => {
      const p = progress.current;
      if (Math.abs(p - last) > 0.0005) {
        revision.current += 1;
        last = p;
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [progress]);

  const down = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointer.current || (event.pointerType === "mouse" && event.button !== 0))
      return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    dragging.current = true;
    orientation.current.manual = true;
    event.currentTarget.dataset.dragging = "true";
  };

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    const previous = pointer.current;
    if (!previous || previous.id !== event.pointerId) return;
    event.preventDefault();
    const width = event.currentTarget.getBoundingClientRect().width;
    const state = orientation.current;
    state.spin += ((event.clientX - previous.x) * Math.PI) / Math.max(width, 1);
    state.tilt = Math.max(
      -MAX_TILT,
      Math.min(
        MAX_TILT,
        state.tilt + ((event.clientY - previous.y) * Math.PI) / Math.max(width, 1),
      ),
    );
    previous.x = event.clientX;
    previous.y = event.clientY;
  };

  const up = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointer.current?.id !== event.pointerId) return;
    pointer.current = null;
    dragging.current = false;
    event.currentTarget.dataset.dragging = "false";
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className={styles.earthSlot}>
      <div className={styles.earthRound}>
        <Canvas
          className={styles.earthCanvas}
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, EARTH_CAM_Z], fov: EARTH_FOV, near: 0.1, far: 40 }}
          gl={{
            antialias: true,
            alpha: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: true,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
            gl.setClearAlpha(0);
          }}
        >
          <FitDiscCamera />
          <ambientLight intensity={0.75} />
          <directionalLight position={[4, 2, 3]} intensity={2.8} />
          <directionalLight position={[2, 1, 4]} intensity={1.2} />
          <directionalLight position={[-2, 0.5, 1]} intensity={0.5} color="#7aaa8a" />
          <Suspense fallback={null}>
            <EarthMesh
              progress={progress}
              orientation={orientation}
              dragging={dragging}
              revision={revision}
            />
          </Suspense>
        </Canvas>
      </div>
      <div
        ref={surface}
        className={styles.earthDrag}
        role="img"
        aria-label="Interactive Earth — drag to rotate"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onLostPointerCapture={up}
      />
    </div>
  );
}
