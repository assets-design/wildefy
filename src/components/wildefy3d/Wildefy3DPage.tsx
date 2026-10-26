"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { SceneFallback } from "@/components/wildefy3d/SceneFallback";
import { SceneLoadingScreen } from "@/components/wildefy3d/SceneLoadingScreen";
import { StoryboardReference } from "@/components/wildefy3d/StoryboardReference";
import styles from "@/components/wildefy3d/wildefy3d.module.css";
import { detectQuality, hasWebGL, type SceneQuality } from "@/lib/wildefy3d/quality";

const WildefyScene = dynamic(
  () => import("@/components/wildefy3d/WildefyScene").then((mod) => mod.WildefyScene),
  { ssr: false },
);

class SceneBoundary extends Component<
  { children: ReactNode; onError: (message: string) => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error.message);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

export function Wildefy3DPage() {
  const progressRef = useRef(0);
  const spacerRef = useRef<HTMLDivElement>(null);
  const readyOnce = useRef(false);
  const [webgl, setWebgl] = useState<"unknown" | "yes" | "no">("unknown");
  const [quality, setQuality] = useState<SceneQuality | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [progress, setProgress] = useState(0.06);
  const [booting, setBooting] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [frame, setFrame] = useState(1);
  const [compare, setCompare] = useState(false);

  useEffect(() => {
    setQuality(detectQuality());
    setWebgl(hasWebGL() ? "yes" : "no");
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (process.env.NODE_ENV !== "development") return;
    const params = new URLSearchParams(window.location.search);
    setCompare(params.get("compare") === "1");
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "c" || event.key === "C") setCompare((value) => !value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (webgl !== "yes") return;
    let alive = true;
    const holder: { kill: (() => void) | null } = { kill: null };
    void import("gsap").then(async ({ default: gsap }) => {
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (!alive || !spacerRef.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const trigger = ScrollTrigger.create({
        trigger: spacerRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          progressRef.current = self.progress;
        },
      });
      progressRef.current = trigger.progress;
      holder.kill = () => trigger.kill();
    });
    return () => {
      alive = false;
      holder.kill?.();
    };
  }, [webgl]);

  const onBoot = useCallback(() => {
    setProgress((value) => Math.max(value, 0.42));
  }, []);
  const onOakProgress = useCallback((ratio: number) => {
    setProgress((value) => Math.max(value, 0.42 + Math.min(ratio, 1) * 0.48));
  }, []);
  const onOakSettled = useCallback((status: "ready" | "failed") => {
    if (status === "failed") {
      setNote("Oak model unavailable. The conifer forest is the fallback.");
    }
    setProgress((value) => Math.max(value, 0.92));
  }, []);
  const onReady = useCallback(() => {
    if (readyOnce.current) return;
    readyOnce.current = true;
    setProgress(1);
    window.setTimeout(() => setBooting(false), 450);
  }, []);
  const onFrame = useCallback((next: number) => setFrame(next), []);
  const onError = useCallback((message: string) => {
    setFailed(message || "The 3D scene failed to start.");
    setBooting(false);
  }, []);
  const retry = useCallback(() => {
    window.location.reload();
  }, []);

  const showScene = webgl === "yes" && quality && !failed;

  return (
    <main className={styles.page}>
      {showScene ? (
        <>
          <div className={styles.viewport}>
            <SceneBoundary onError={onError}>
              <WildefyScene
                progressRef={progressRef}
                quality={quality}
                reducedMotion={reducedMotion}
                onBoot={onBoot}
                onOakProgress={onOakProgress}
                onOakSettled={onOakSettled}
                onReady={onReady}
                onFrame={onFrame}
                onContextLost={() => onError("The graphics context was lost.")}
              />
            </SceneBoundary>
          </div>
          <div ref={spacerRef} className={styles.spacer} />
          <StoryboardReference frame={frame} enabled={compare && !booting} />
        </>
      ) : null}
      {booting && !failed && webgl !== "no" ? <SceneLoadingScreen progress={progress} note={note} /> : null}
      {webgl === "no" || failed ? (
        <SceneFallback
          reason={
            failed ??
            "This walk needs WebGL. Turn on hardware acceleration, or open it in a browser that supports WebGL."
          }
          onRetry={retry}
        />
      ) : null}
    </main>
  );
}
