"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { DESTINATIONS, latLonToVec } from "@/lib/aboutGlobe/destinations";
import { ExpeditionArc, routeState } from "@/lib/aboutGlobe/globe-motion";

const TRACKER_URL = "/images/about/globe-tracker.png";
const TRACKER_SIZE = 0.07;

function RouteSegment({
  index,
  arc,
  stage,
  color,
}: {
  index: number;
  arc: ExpeditionArc;
  stage: MutableRefObject<number>;
  color: THREE.Color;
}) {
  const line = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((_, raw) => {
    const state = routeState(stage.current, index, DESTINATIONS.length - 1);
    const opacity = state.active ? 0.9 : state.completed ? 0.48 : 0.16;
    const blend = 1 - Math.exp(-8 * Math.min(raw, 0.05));
    if (line.current) line.current.opacity += (opacity - line.current.opacity) * blend;
    if (glow.current) glow.current.opacity = state.active ? 0.07 : 0.015;
  });

  return (
    <group
      name={`route-${DESTINATIONS[index]?.id}-${DESTINATIONS[index + 1]?.id}`}
    >
      <mesh>
        <tubeGeometry args={[arc, 96, 0.002, 5, false]} />
        <meshBasicMaterial
          ref={line}
          color={color}
          transparent
          opacity={0.16}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <tubeGeometry args={[arc, 96, 0.006, 5, false]} />
        <meshBasicMaterial
          ref={glow}
          color={color}
          transparent
          opacity={0.015}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Red navigation arrow that rides the active expedition arc.
 * Scroll `stage` (0 → N-1) drives both which arc is active and how far
 * along it the tracker has travelled; tip faces the path tangent.
 */
function RouteTracker({
  arcs,
  stage,
  reduced,
}: {
  arcs: ExpeditionArc[];
  stage: MutableRefObject<number>;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const texture = useLoader(THREE.TextureLoader, TRACKER_URL);

  useLayoutEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  const p0 = useMemo(() => new THREE.Vector3(), []);
  const p1 = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const radial = useMemo(() => new THREE.Vector3(), []);
  const side = useMemo(() => new THREE.Vector3(), []);
  const basis = useMemo(() => new THREE.Matrix4(), []);

  useFrame(() => {
    const el = group.current;
    if (!el || arcs.length === 0) return;

    if (reduced) {
      el.visible = false;
      return;
    }

    const s = Math.min(
      Math.max(stage.current, 0),
      DESTINATIONS.length - 1,
    );
    let index: number;
    let t: number;
    if (s >= arcs.length) {
      index = arcs.length - 1;
      t = 1;
    } else {
      index = Math.floor(s);
      t = s - index;
    }

    const arc = arcs[index];
    if (!arc) {
      el.visible = false;
      return;
    }

    el.visible = true;
    arc.getPoint(t, p0);
    // Sample ahead for tangent; fall back behind near the arc end.
    const ahead = Math.min(1, t + 0.02);
    const behind = Math.max(0, t - 0.02);
    arc.getPoint(ahead === t ? behind : ahead, p1);
    if (ahead === t) tangent.copy(p0).sub(p1);
    else tangent.copy(p1).sub(p0);
    if (tangent.lengthSq() < 1e-10) {
      el.position.copy(p0);
      return;
    }
    tangent.normalize();
    radial.copy(p0).normalize();
    side.crossVectors(tangent, radial).normalize();
    if (side.lengthSq() < 1e-10) {
      // Degenerate near poles — pick an arbitrary side.
      side.set(0, 1, 0).cross(radial).normalize();
    }
    // Re-orthogonalize radial so the plane sits flush to the globe.
    radial.crossVectors(side, tangent).normalize();
    basis.makeBasis(side, tangent, radial);
    el.quaternion.setFromRotationMatrix(basis);
    // Lift slightly so the sprite clears the tube.
    el.position.copy(p0).addScaledVector(radial, 0.014);
  });

  return (
    <group ref={group} renderOrder={20}>
      <mesh renderOrder={20}>
        {/* Tip is +Y in the texture — matches basis Y = travel tangent */}
        <planeGeometry args={[TRACKER_SIZE, TRACKER_SIZE]} />
        <meshBasicMaterial
          map={texture}
          transparent
          depthWrite={false}
          depthTest
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export function ExpeditionRoutes({
  stage,
  color,
  reduced,
}: {
  stage: MutableRefObject<number>;
  color: THREE.Color;
  reduced: boolean;
}) {
  const arcs = useMemo(
    () =>
      DESTINATIONS.slice(0, -1).flatMap((destination, index) => {
        const next = DESTINATIONS[index + 1];
        return next
          ? [
              new ExpeditionArc(
                new THREE.Vector3(
                  ...latLonToVec(destination.lat, destination.lon),
                ),
                new THREE.Vector3(...latLonToVec(next.lat, next.lon)),
              ),
            ]
          : [];
      }),
    [],
  );

  return (
    <>
      {arcs.map((arc, index) => (
        <RouteSegment
          key={index}
          index={index}
          arc={arc}
          stage={stage}
          color={color}
        />
      ))}
      <RouteTracker arcs={arcs} stage={stage} reduced={reduced} />
    </>
  );
}
