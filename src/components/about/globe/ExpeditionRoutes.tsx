"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { DESTINATIONS, latLonToVec } from "@/lib/aboutGlobe/destinations";
import { ExpeditionArc, routeState } from "@/lib/aboutGlobe/globe-motion";

function RouteSegment({
  index,
  arc,
  stage,
  color,
  reduced,
}: {
  index: number;
  arc: ExpeditionArc;
  stage: MutableRefObject<number>;
  color: THREE.Color;
  reduced: boolean;
}) {
  const line = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const pulse = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, raw) => {
    const state = routeState(stage.current, index);
    const opacity = state.active ? 0.9 : state.completed ? 0.48 : 0.16;
    const blend = 1 - Math.exp(-8 * Math.min(raw, 0.05));
    if (line.current) line.current.opacity += (opacity - line.current.opacity) * blend;
    if (glow.current) glow.current.opacity = state.active ? 0.07 : 0.015;
    if (pulse.current) {
      pulse.current.visible = state.active && !reduced;
      arc.getPoint((clock.elapsedTime * 0.22) % 1, pulse.current.position);
    }
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
      <mesh ref={pulse}>
        <sphereGeometry args={[0.008, 12, 8]} />
        <meshBasicMaterial color={color} toneMapped={false} />
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
                new THREE.Vector3(...latLonToVec(destination.lat, destination.lon)),
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
          reduced={reduced}
        />
      ))}
    </>
  );
}
