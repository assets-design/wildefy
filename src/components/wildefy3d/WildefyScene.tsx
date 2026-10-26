"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { MutableRefObject } from "react";
import * as THREE from "three";
import { SUN_POSITION } from "@/config/wildefySceneManifest";
import { auditJourney } from "@/config/wildefyCameraPath";
import type { SceneQuality } from "@/lib/wildefy3d/quality";
import { windUniforms, waterUniforms } from "@/lib/wildefy3d/wind";
import { WildefyCamera } from "@/components/wildefy3d/WildefyCamera";
import { WildefyEnvironment } from "@/components/wildefy3d/WildefyEnvironment";
import { WildefySky } from "@/components/wildefy3d/WildefySky";
import { WildefyVegetation } from "@/components/wildefy3d/WildefyVegetation";
import { WildefyWater } from "@/components/wildefy3d/WildefyWater";

function SceneClock({
  reducedMotion,
  settledRef,
  onReady,
}: {
  reducedMotion: boolean;
  settledRef: MutableRefObject<boolean>;
  onReady: () => void;
}) {
  const painted = useRef(false);
  useEffect(() => {
    windUniforms.uStrength.value = reducedMotion ? 0 : 1;
  }, [reducedMotion]);

  useFrame(({ clock }) => {
    windUniforms.uTime.value = reducedMotion ? 0 : clock.elapsedTime;
    waterUniforms.uTime.value = reducedMotion ? 0 : clock.elapsedTime;
    if (!painted.current && settledRef.current) {
      painted.current = true;
      onReady();
    }
  });
  return null;
}

function ContextLost({ onContextLost }: { onContextLost: () => void }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onContextLost();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onContextLost]);
  return null;
}

function Lights({ quality }: { quality: SceneQuality }) {
  const target = useRef<THREE.Object3D>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  useEffect(() => {
    if (sun.current && target.current) sun.current.target = target.current;
  }, []);
  return (
    <>
      <hemisphereLight args={["#d5e7f4", "#3d5a34", 0.72]} />
      <object3D ref={target} position={[-20, 50, -260]} />
      <directionalLight
        ref={sun}
        position={SUN_POSITION}
        color="#ffd2a4"
        intensity={3.1}
        castShadow={quality.shadows}
        shadow-mapSize-width={quality.shadows ? 2048 : 256}
        shadow-mapSize-height={quality.shadows ? 2048 : 256}
        shadow-camera-near={20}
        shadow-camera-far={1600}
        shadow-camera-left={-420}
        shadow-camera-right={420}
        shadow-camera-top={420}
        shadow-camera-bottom={-420}
        shadow-bias={-0.0004}
        shadow-normalBias={0.35}
      />
      <directionalLight position={[180, 120, 240]} color="#9eb6c8" intensity={0.45} />
    </>
  );
}

export function WildefyScene({
  progressRef,
  quality,
  reducedMotion,
  onBoot,
  onOakProgress,
  onOakSettled,
  onReady,
  onFrame,
  onContextLost,
}: {
  progressRef: MutableRefObject<number>;
  quality: SceneQuality;
  reducedMotion: boolean;
  onBoot: () => void;
  onOakProgress: (ratio: number) => void;
  onOakSettled: (status: "ready" | "failed") => void;
  onReady: () => void;
  onFrame: (frame: number) => void;
  onContextLost: () => void;
}) {
  const settledRef = useRef(false);

  useEffect(() => {
    onBoot();
    if (process.env.NODE_ENV === "development") {
      const report = auditJourney();
      if (report.issues.length > 0) {
        console.warn("[wildefy3d] camera audit", report.minGap, report.issues.slice(0, 8));
      } else {
        console.info("[wildefy3d] camera audit ok", report.minGap.toFixed(2));
      }
    }
  }, [onBoot]);

  return (
    <Canvas
      shadows={quality.shadows}
      dpr={quality.dpr as [number, number]}
      camera={{ fov: 50, near: 0.35, far: 5200, position: [90, 300, 540] }}
      gl={{
        antialias: quality.antialias,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
      }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor("#d5e0ea");
        gl.outputColorSpace = THREE.SRGBColorSpace;
        camera.lookAt(-40, 190, -640);
      }}
    >
      <color attach="background" args={["#d5e0ea"]} />
      <fogExp2 attach="fog" args={["#d5e0ea", quality.tier === "mobile" ? 0.00115 : 0.00082]} />
      <SceneClock reducedMotion={reducedMotion} settledRef={settledRef} onReady={onReady} />
      <ContextLost onContextLost={onContextLost} />
      <WildefyCamera progressRef={progressRef} reducedMotion={reducedMotion} onFrame={onFrame} />
      <Lights quality={quality} />
      <WildefySky quality={quality} progressRef={progressRef} />
      <WildefyEnvironment quality={quality} />
      <WildefyWater />
      <WildefyVegetation
        quality={quality}
        onOakProgress={onOakProgress}
        onOakSettled={(status) => {
          settledRef.current = true;
          onOakSettled(status);
        }}
      />
    </Canvas>
  );
}
