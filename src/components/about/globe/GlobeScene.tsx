"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent,
} from "react";
import * as THREE from "three";
import {
  DESTINATIONS,
  latLonToVec,
  nearestDestinationIndex,
  orientationsFor,
} from "@/lib/aboutGlobe/destinations";
import {
  dragOrientation,
  MARKER_RADIUS,
  reconcileOrientation,
  type Orientation,
} from "@/lib/aboutGlobe/globe-motion";
import { ExpeditionRoutes } from "./ExpeditionRoutes";
import styles from "./globe.module.css";

const ORIENT = orientationsFor(DESTINATIONS);
const MARKER_HEX = "#f9a01f";

function Atmosphere() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `varying vec3 vN; void main(){ float i = pow(0.72 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(0.55,0.85,0.7,1.0)*i*0.7; }`,
      }),
    [],
  );
  return (
    <mesh scale={1.1} material={mat}>
      <sphereGeometry args={[1, 64, 64]} />
    </mesh>
  );
}

function Marker({
  index,
  stage,
  color,
  reduced,
}: {
  index: number;
  stage: MutableRefObject<number>;
  color: THREE.Color;
  reduced: boolean;
}) {
  const d = DESTINATIONS[index];
  const pos = useMemo(
    () =>
      d
        ? new THREE.Vector3(...latLonToVec(d.lat, d.lon)).multiplyScalar(
            MARKER_RADIUS,
          )
        : new THREE.Vector3(),
    [d],
  );
  const ring = useRef<THREE.Mesh>(null);
  const dot = useRef<THREE.Mesh>(null);
  const quat = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        pos.clone().normalize(),
      ),
    [pos],
  );

  useFrame(({ clock }) => {
    const active = Math.max(0, 1 - Math.abs(stage.current - index) * 2.2);
    const t = (clock.elapsedTime * 0.8) % 1;
    if (ring.current) {
      const m = ring.current.material as THREE.MeshBasicMaterial;
      ring.current.scale.setScalar(reduced ? 1.2 : 1 + t * 2.6);
      m.opacity = reduced ? active * 0.65 : active * (1 - t) * 0.9;
    }
    if (dot.current) {
      const m = dot.current.material as THREE.MeshBasicMaterial;
      const blink = reduced ? 1 : 0.75 + 0.25 * Math.sin(clock.elapsedTime * 4);
      m.opacity = 0.65 + active * 0.35 * blink;
      dot.current.scale.setScalar(0.6 + active * 0.6);
    }
  });

  return (
    <group position={pos} quaternion={quat}>
      <mesh ref={dot}>
        <circleGeometry args={[0.018, 24]} />
        <meshBasicMaterial color={color} transparent toneMapped={false} />
      </mesh>
      <mesh ref={ring}>
        <ringGeometry args={[0.02, 0.026, 40]} />
        <meshBasicMaterial
          color={color}
          transparent
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <ringGeometry args={[0.023, 0.026, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

type Controls = {
  orientation: MutableRefObject<Orientation>;
  dragging: MutableRefObject<boolean>;
  revision: MutableRefObject<number>;
  surface: MutableRefObject<HTMLDivElement | null>;
};

function Earth({
  stage,
  controls,
  color,
  reduced,
}: {
  stage: MutableRefObject<number>;
  controls: Controls;
  color: THREE.Color;
  reduced: boolean;
}) {
  const [map, spec] = useLoader(THREE.TextureLoader, [
    "/textures/earth_atmos_2048.jpg",
    "/textures/earth_specular_2048.jpg",
  ]) as [THREE.Texture, THREE.Texture];
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const tiltRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const smooth = useRef(0);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    smooth.current += (stage.current - smooth.current) * (1 - Math.exp(-8 * dt));
    const s = smooth.current;
    const i = Math.min(Math.floor(s), ORIENT.length - 2);
    const f = s - i;
    const a = ORIENT[i];
    const b = ORIENT[i + 1];
    if (!a || !b) return;
    const spin = a.spin + (b.spin - a.spin) * f;
    const tilt =
      a.tilt + (b.tilt - a.tilt) * f + Math.sin(f * Math.PI) * 0.18;
    const orientation = controls.orientation.current;
    reconcileOrientation(
      orientation,
      { spin, tilt },
      controls.revision.current,
      controls.dragging.current,
      dt,
    );
    if (spinRef.current) spinRef.current.rotation.y = orientation.spin;
    if (tiltRef.current) tiltRef.current.rotation.x = orientation.tilt;
    if (controls.surface.current) {
      controls.surface.current.dataset.spin = orientation.spin.toFixed(4);
      controls.surface.current.dataset.tilt = orientation.tilt.toFixed(4);
      controls.surface.current.dataset.control = orientation.manual
        ? "manual"
        : "scroll";
      controls.surface.current.dataset.activeRoute = String(
        Math.min(Math.round(stage.current), 4),
      );
    }
  });

  return (
    <group ref={tiltRef}>
      <group ref={spinRef}>
        <mesh>
          <sphereGeometry args={[1, 128, 128]} />
          <meshPhongMaterial
            map={map}
            specularMap={spec}
            specular={new THREE.Color("#3a5a4a")}
            shininess={14}
          />
        </mesh>
        {DESTINATIONS.map((_, i) => (
          <Marker
            key={i}
            index={i}
            stage={stage}
            color={color}
            reduced={reduced}
          />
        ))}
        <ExpeditionRoutes stage={stage} color={color} reduced={reduced} />
      </group>
    </group>
  );
}

export default function GlobeScene({
  stage,
  revision: suppliedRevision,
  onActiveChange,
}: {
  stage: MutableRefObject<number>;
  revision?: MutableRefObject<number>;
  /** Fires while dragging so the matching destination card stays visible. */
  onActiveChange?: (index: number) => void;
}) {
  const fallbackRevision = useRef(0);
  const revision = suppliedRevision ?? fallbackRevision;
  const onActiveRef = useRef(onActiveChange);
  onActiveRef.current = onActiveChange;

  useEffect(() => {
    if (suppliedRevision) return;
    const onScroll = () => {
      fallbackRevision.current += 1;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [suppliedRevision]);

  const orientation = useRef<Orientation>({
    spin: ORIENT[0]?.spin ?? 0,
    tilt: ORIENT[0]?.tilt ?? 0,
    manual: false,
    revision: revision.current,
  });
  const dragging = useRef(false);
  const surface = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const [reduced, setReduced] = useState(false);
  const color = useMemo(() => new THREE.Color(MARKER_HEX), []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const syncCardFromOrientation = () => {
    const { spin, tilt } = orientation.current;
    const idx = nearestDestinationIndex(spin, tilt);
    stage.current = idx;
    onActiveRef.current?.(idx);
  };

  const down = (event: PointerEvent<HTMLDivElement>) => {
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

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const previous = pointer.current;
    if (!previous || previous.id !== event.pointerId) return;
    event.preventDefault();
    dragOrientation(
      orientation.current,
      event.clientX - previous.x,
      event.clientY - previous.y,
      event.currentTarget.getBoundingClientRect().width,
    );
    previous.x = event.clientX;
    previous.y = event.clientY;
    syncCardFromOrientation();
  };

  const up = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current?.id !== event.pointerId) return;
    pointer.current = null;
    dragging.current = false;
    event.currentTarget.dataset.dragging = "false";
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    syncCardFromOrientation();
  };

  return (
    <div className={styles.interactive}>
      <Canvas
        dpr={[1, 2]}
        // Mild left look + right Earth offset → left hemisphere fills
        // the right half of the stage (half-globe composition).
        camera={{ position: [-0.15, 0.02, 2.95], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[-3, 2, 4]} intensity={2.2} />
        <directionalLight
          position={[4, -1, -2]}
          intensity={0.3}
          color="#7fb79a"
        />
        <group position={[0.72, 0, 0]}>
          <Suspense fallback={null}>
            <Earth
              stage={stage}
              controls={{ orientation, dragging, revision, surface }}
              color={color}
              reduced={reduced}
            />
          </Suspense>
          <Atmosphere />
        </group>
      </Canvas>
      <div
        ref={surface}
        className={styles.dragSurface}
        role="img"
        aria-label="Interactive Earth globe"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onLostPointerCapture={up}
      />
    </div>
  );
}
