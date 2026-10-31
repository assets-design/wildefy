"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import styles from "./conservation.module.css";

/** Swallow WebGL init failures so the page keeps running. */
class EarthCanvasBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

const MAX_TILT = Math.PI / 2 - 0.12;
/** One full turn across the pinned Conservation runway. */
const SCROLL_TURNS = Math.PI * 2;
/**
 * NASA Earth_1_12756.glb faces lon 0 toward −Z; offset so Africa/Europe
 * sit on the visible half-disc (texture seam stays toward the back).
 */
const SPIN_OFFSET = -Math.PI / 2;
const EARTH_FOV = 42;
/**
 * Exact spherical limb fit: half-angle asin(R/d) = fov/2 → d = 1 / sin(fov/2).
 * Keep scale ≤ 1 so the limb stays inside the view (overfill hits the square
 * canvas edge and looks like a flat rectangular pillar).
 */
const EARTH_CAM_Z = 1 / Math.sin(THREE.MathUtils.degToRad(EARTH_FOV / 2));
const EARTH_MESH_SCALE = 1;
/**
 * Sketchfab Earth (Akshat) — converted from KHR specular-glossiness
 * to metallic-roughness so Three r186+ can bind the diffuse map.
 * https://sketchfab.com/3d-models/earth-41fc80d85dfd480281f21b74b2de2faa
 */
const NASA_EARTH_URL = "/models/nasa-earth1.glb?v=mr1";

type Orientation = {
  spin: number;
  tilt: number;
  manual: boolean;
  revision: number;
};

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
  const gltf = useLoader(GLTFLoader, NASA_EARTH_URL);
  const tiltRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);

  const earth = useMemo(() => {
    const root = gltf.scene.clone(true);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    // Fit longest axis to unit-sphere diameter so the limb matches the disc mask.
    const scale = 2 / maxDim;
    root.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    root.scale.setScalar(scale);
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.frustumCulled = false;
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      const next = mats.map((m) => {
        const src = m as THREE.MeshStandardMaterial & {
          map?: THREE.Texture | null;
          color?: THREE.Color;
        };
        const map =
          src.map ||
          (src as unknown as { map?: THREE.Texture | null }).map ||
          null;
        /*
          Sketchfab exports often land as Basic/raw materials when the old
          specular-glossiness extension is stripped — rebuild a lit PBR mat
          so the Earth texture always shows.
        */
        const mat = new THREE.MeshStandardMaterial({
          map: map ?? undefined,
          color: map ? 0xffffff : (src.color?.getHex() ?? 0xffffff),
          metalness: 0.05,
          roughness: 0.55,
          side: THREE.DoubleSide,
        });
        if (mat.map) {
          mat.map.colorSpace = THREE.SRGBColorSpace;
          mat.map.anisotropy = 8;
          mat.map.needsUpdate = true;
        }
        mat.needsUpdate = true;
        if (m && "dispose" in m) (m as THREE.Material).dispose();
        return mat;
      });
      mesh.material = next.length === 1 ? next[0] : next;
    });
    return root;
  }, [gltf]);

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
  });

  return (
    <group scale={EARTH_MESH_SCALE}>
      <group ref={tiltRef}>
        <group ref={spinRef}>
          {/* Bare NASA surface — no cloud / atmosphere colour veil */}
          <primitive object={earth} />
        </group>
      </group>
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
  const slotRef = useRef<HTMLDivElement>(null);
  /*
   * Once the Conservation section is near the viewport, keep the Earth canvas
   * mounted. Toggling off the half-offscreen disc (left:-500) made the globe
   * intermittently disappear / fall back to a dark plate.
   */
  const [shouldRender, setShouldRender] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const retryRef = useRef(0);

  useEffect(() => {
    const section =
      document.querySelector<HTMLElement>("[aria-label='Conservation']") ||
      slotRef.current;
    if (!section || typeof IntersectionObserver === "undefined") {
      setShouldRender(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          /* Stay mounted — do not flip back to false */
          io.disconnect();
        }
      },
      { root: null, rootMargin: "60% 0px", threshold: 0 },
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  const handleWebglFail = () => {
    if (retryRef.current < 2) {
      retryRef.current += 1;
      setWebglFailed(false);
      window.setTimeout(() => setCanvasKey((k) => k + 1), 350);
      return;
    }
    setWebglFailed(true);
  };

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
    <div className={styles.earthSlot} ref={slotRef}>
      <div className={styles.earthRound}>
        {shouldRender && !webglFailed ? (
          <EarthCanvasBoundary key={canvasKey} onError={handleWebglFail}>
            <Canvas
              className={styles.earthCanvas}
              dpr={[1, 1.5]}
              camera={{
                position: [0, 0, EARTH_CAM_Z],
                fov: EARTH_FOV,
                near: 0.1,
                far: 40,
              }}
              gl={{
                antialias: true,
                alpha: true,
                premultipliedAlpha: false,
                preserveDrawingBuffer: false,
                powerPreference: "default",
                failIfMajorPerformanceCaveat: false,
              }}
              onCreated={({ gl }) => {
                const canvas = gl.domElement;
                const onLost = (ev: Event) => {
                  ev.preventDefault();
                  handleWebglFail();
                };
                canvas.addEventListener("webglcontextlost", onLost, false);
                gl.setClearColor(0x000000, 0);
                gl.setClearAlpha(0);
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.toneMappingExposure = 1.15;
              }}
            >
              <FitDiscCamera />
              <ambientLight intensity={0.45} color="#ffffff" />
              <directionalLight
                position={[5.5, 2.2, 3.5]}
                intensity={2.4}
                color="#ffffff"
              />
              <directionalLight
                position={[-3.5, -0.4, 2]}
                intensity={0.35}
                color="#d8e4f0"
              />
              <hemisphereLight args={["#e8eef5", "#2a3038", 0.28]} />
              <Suspense fallback={null}>
                <EarthMesh
                  progress={progress}
                  orientation={orientation}
                  dragging={dragging}
                  revision={revision}
                />
              </Suspense>
            </Canvas>
          </EarthCanvasBoundary>
        ) : webglFailed ? (
          <div className={styles.earthFallback} aria-hidden="true" />
        ) : null}
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
