"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { MutableRefObject } from "react";
import * as THREE from "three";
import { sampleJourney } from "@/config/wildefyCameraPath";

export function WildefyCamera({
  progressRef,
  reducedMotion,
  onFrame,
}: {
  progressRef: MutableRefObject<number>;
  reducedMotion: boolean;
  onFrame: (frame: number) => void;
}) {
  const { camera } = useThree();
  const rendered = useRef(0);
  const frame = useRef(0);
  const lookTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    rendered.current = progressRef.current;
  }, [progressRef]);

  useFrame((_, delta) => {
    const target = progressRef.current;
    const step = Math.min(delta, 0.05);
    if (reducedMotion) rendered.current = target;
    else rendered.current = THREE.MathUtils.damp(rendered.current, target, 5.5, step);
    if (Math.abs(rendered.current - target) < 0.0008) rendered.current = target;

    const sample = sampleJourney(rendered.current);
    camera.position.copy(sample.position);
    lookTarget.current.copy(sample.target);
    camera.lookAt(lookTarget.current);
    const perspective = camera as THREE.PerspectiveCamera;
    if (Math.abs(perspective.fov - sample.fov) > 0.05) {
      perspective.fov = sample.fov;
      perspective.updateProjectionMatrix();
    }
    if (sample.frame !== frame.current) {
      frame.current = sample.frame;
      onFrame(sample.frame);
    }
  });

  return null;
}
