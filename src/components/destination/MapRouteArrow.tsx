"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import styles from "./destination.module.css";

gsap.registerPlugin(MotionPathPlugin);

/**
 * Dense polyline sampled from the orange dashed route on map-kanha.png
 * (frame 516:83), with day pins snapped to Figma Red Blinking Dot centers.
 * Keep points tight so GSAP curves stay on the dashes instead of cutting corners.
 */
const ROUTE_POINTS = [
  { x: 27.0, y: 8.4 }, // Day 1 — Raipur
  { x: 28.6, y: 10.3 },
  { x: 30.8, y: 11.3 },
  { x: 33.5, y: 12.4 },
  { x: 35.5, y: 13.7 },
  { x: 37.1, y: 15.2 },
  { x: 38.9, y: 16.7 },
  { x: 40.7, y: 18.2 },
  { x: 42.4, y: 19.6 },
  { x: 44.3, y: 21.2 },
  { x: 46.0, y: 22.7 },
  { x: 47.6, y: 24.5 },
  { x: 49.0, y: 26.1 },
  { x: 50.5, y: 28.2 }, // Day 2
  { x: 51.0, y: 29.3 },
  { x: 51.2, y: 31.1 },
  { x: 51.4, y: 33.0 },
  { x: 52.4, y: 34.7 },
  { x: 54.0, y: 36.2 },
  { x: 55.5, y: 37.7 },
  { x: 56.4, y: 39.5 },
  { x: 56.5, y: 41.3 },
  { x: 56.4, y: 43.1 },
  { x: 56.6, y: 44.3 }, // Day 3
  { x: 56.9, y: 46.5 },
  { x: 56.3, y: 48.3 },
  { x: 54.8, y: 49.8 },
  { x: 52.8, y: 51.3 },
  { x: 50.8, y: 52.6 },
  { x: 49.0, y: 54.0 },
  { x: 47.9, y: 55.7 },
  { x: 47.9, y: 58.1 }, // Day 4
  { x: 47.9, y: 59.3 },
  { x: 47.3, y: 61.1 },
  { x: 47.0, y: 63.0 },
  { x: 47.5, y: 64.8 },
  { x: 48.7, y: 66.4 },
  { x: 50.2, y: 68.0 },
  { x: 51.7, y: 69.7 },
  { x: 52.6, y: 71.6 }, // Day 5
  { x: 52.8, y: 72.9 },
  { x: 52.1, y: 75.1 },
  { x: 50.2, y: 76.4 },
  { x: 48.1, y: 77.5 },
  { x: 45.6, y: 78.5 },
  { x: 43.3, y: 79.5 },
  { x: 41.1, y: 80.6 },
  { x: 38.9, y: 81.8 },
  { x: 36.9, y: 83.1 },
  { x: 35.1, y: 84.5 },
  { x: 33.8, y: 86.0 },
  { x: 33.0, y: 87.4 },
  { x: 32.4, y: 88.9 }, // Day 6 — Return Raipur
] as const;

/** Route-point indices that sit on each day pin. */
const DAY_POINT_INDEX = [0, 13, 23, 31, 39, 52] as const;

/** Day pin centers — Figma Red Blinking Dot 8–13 over map 516:83. */
const DAY_PINS = DAY_POINT_INDEX.map((idx) => ROUTE_POINTS[idx]);

const BLINK_DOT_SRC = "/images/destination/red-blinking-dot.gif";

/** nav-arrow-map.png points up; GSAP path angle is along +X, so +90° aims tip along travel. */
const ARROW_ANGLE_OFFSET = 90;

/** Polyline arc-length table — keep in sync with MotionPath (curviness ~0). */
const ROUTE_ARC = (() => {
  const cum = [0];
  for (let i = 1; i < ROUTE_POINTS.length; i++) {
    const a = ROUTE_POINTS[i - 1];
    const b = ROUTE_POINTS[i];
    cum.push(cum[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
  }
  const total = cum[cum.length - 1] || 1;
  return cum.map((v) => v / total);
})();

/** Arc-length progress at each day pin (not index/(n-1) — that drifts off the dashes). */
const DAY_PROGRESS = DAY_POINT_INDEX.map((idx) => ROUTE_ARC[idx]);

export function progressForDay(day: number) {
  return DAY_PROGRESS[Math.max(0, Math.min(day, 6) - 1)] ?? 0;
}

function pointsInFrame(width: number, height: number) {
  return ROUTE_POINTS.map((p) => ({
    x: (p.x / 100) * width,
    y: (p.y / 100) * height,
  }));
}

/** Keep the arrow in the sticky viewport; bias slightly above center. */
function panOffset(arrowY: number, stageH: number, viewH: number) {
  if (stageH <= viewH + 1) return 0;
  const focus = viewH * 0.42;
  const raw = focus - arrowY;
  return Math.max(-(stageH - viewH), Math.min(0, raw));
}

type MapRouteArrowProps = {
  /** 0 = Day 1 pin, 1 = Day 6 pin — scrubbed by left-column scroll. */
  progress: number;
  stageRef: React.RefObject<HTMLDivElement | null>;
  viewportRef: React.RefObject<HTMLDivElement | null>;
};

export function MapRouteArrow({ progress, stageRef, viewportRef }: MapRouteArrowProps) {
  const [mounted, setMounted] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLImageElement>(null);
  const rawPathRef = useRef<ReturnType<typeof MotionPathPlugin.arrayToRawPath> | null>(null);
  const progressRef = useRef(progress);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;
    const layer = layerRef.current;
    const arrow = arrowRef.current;
    const stage = stageRef.current;
    const viewport = viewportRef.current;
    if (!layer || !arrow || !stage || !viewport) return;

    const rebuildPath = () => {
      const w = stage.offsetWidth;
      const h = stage.offsetHeight;
      // Low curviness + dense samples keeps the motion path on the dashed S-curve.
      rawPathRef.current = MotionPathPlugin.arrayToRawPath(pointsInFrame(w, h), {
        // Flat segments through dense samples — stays on the dashed route
        curviness: 0,
      });
      return { width: w, height: h };
    };

    const place = (p: number) => {
      const rawPath = rawPathRef.current;
      if (!rawPath) return;
      const point = MotionPathPlugin.getPositionOnPath(rawPath, p, true);
      const viewH = viewport.clientHeight;
      const stageH = stage.offsetHeight;
      const pan = panOffset(point.y, stageH, viewH);

      gsap.set(stage, { y: pan });
      gsap.set(arrow, {
        x: point.x,
        y: point.y,
        xPercent: -50,
        yPercent: -50,
        rotation: point.angle + ARROW_ANGLE_OFFSET,
        autoAlpha: 1,
        transformOrigin: "50% 50%",
      });
    };

    rebuildPath();
    place(progressRef.current);

    const onResize = () => {
      rebuildPath();
      place(progressRef.current);
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(viewport);
    ro.observe(stage);

    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [mounted, stageRef, viewportRef]);

  useLayoutEffect(() => {
    if (!mounted) return;
    const clamped = Math.max(0, Math.min(1, progress));
    progressRef.current = clamped;
    const arrow = arrowRef.current;
    const stage = stageRef.current;
    const viewport = viewportRef.current;
    const rawPath = rawPathRef.current;
    if (!arrow || !stage || !viewport || !rawPath) return;

    const point = MotionPathPlugin.getPositionOnPath(rawPath, clamped, true);
    const pan = panOffset(point.y, stage.offsetHeight, viewport.clientHeight);
    gsap.set(stage, { y: pan });
    gsap.set(arrow, {
      x: point.x,
      y: point.y,
      xPercent: -50,
      yPercent: -50,
      rotation: point.angle + ARROW_ANGLE_OFFSET,
      autoAlpha: 1,
    });
  }, [progress, mounted, stageRef, viewportRef]);

  if (!mounted) return null;

  return (
    <div className={styles.mapRouteLayer} ref={layerRef} aria-hidden>
      {DAY_PINS.map((pin, index) => (
        <img
          key={`blink-${index + 1}`}
          className={styles.mapBlinkDot}
          src={BLINK_DOT_SRC}
          alt=""
          width={50}
          height={49}
          draggable={false}
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        />
      ))}
      <img
        ref={arrowRef}
        className={styles.mapArrow}
        src="/images/destination/nav-arrow-map.png"
        alt=""
        width={56}
        height={56}
        draggable={false}
      />
    </div>
  );
}
