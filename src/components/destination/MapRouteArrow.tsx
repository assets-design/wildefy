"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import styles from "./destination.module.css";

gsap.registerPlugin(MotionPathPlugin);

/**
 * Polyline along the orange dashed route centerline on map-v2.
 * Day pins are the refined centers of the orange/white hollow markers
 * in map-bg.png, mapped through object-fit:cover + center top on the
 * 1680×2852 stage. Values are % of the map stage.
 */
const ROUTE_POINTS = [
  // Day 1 — Raipur
  { x: 26.14, y: 7.45 },
  { x: 28.76, y: 9.84 },
  { x: 32.88, y: 11.43 },
  { x: 36.09, y: 13.62 },
  { x: 39.24, y: 15.86 },
  { x: 42.3, y: 18.14 },
  { x: 45.3, y: 20.45 },
  { x: 48.0, y: 22.89 },
  // Day 2 — Kanha National Park
  { x: 50.43, y: 25.42 },
  { x: 51.14, y: 27.59 },
  { x: 51.4, y: 29.79 },
  { x: 52.54, y: 31.89 },
  { x: 54.76, y: 33.68 },
  { x: 56.22, y: 35.71 },
  { x: 56.51, y: 37.91 },
  // Day 3 — Kanha Safari Zone
  { x: 56.65, y: 40.12 },
  { x: 56.92, y: 42.02 },
  { x: 56.17, y: 44.03 },
  { x: 54.33, y: 45.8 },
  { x: 51.94, y: 47.31 },
  { x: 49.45, y: 48.79 },
  { x: 47.93, y: 50.64 },
  // Day 4 — Kanha Leisure
  { x: 47.62, y: 52.7 },
  { x: 47.57, y: 54.85 },
  { x: 46.99, y: 57.0 },
  { x: 47.56, y: 59.12 },
  { x: 49.1, y: 61.09 },
  { x: 50.99, y: 62.96 },
  // Day 5 — Kanha Safari Zone
  { x: 52.5, y: 64.93 },
  { x: 52.5, y: 67.29 },
  { x: 50.2, y: 69.53 },
  { x: 46.59, y: 71.11 },
  { x: 42.75, y: 72.51 },
  { x: 39.32, y: 74.24 },
  { x: 36.08, y: 76.1 },
  { x: 33.2, y: 78.14 },
  // Day 6 — Return to Raipur
  { x: 31.9, y: 80.66 },
] as const;

/** Route-point indices on each day pin (Day 1…6). */
const DAY_POINT_INDEX = [0, 8, 15, 22, 28, 36] as const;

const DAY_PINS = DAY_POINT_INDEX.map((idx) => ROUTE_POINTS[idx]);

const BLINK_DOT_SRC = "/images/destination/red-blinking-dot.gif";

/** nav-arrow-map.png points up; GSAP path angle is along +X. */
const ARROW_ANGLE_OFFSET = 90;

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

/** Route-arc progress at each day pin (0…1 along the orange path). */
export const DAY_PROGRESS = DAY_POINT_INDEX.map((idx) => ROUTE_ARC[idx]);

/**
 * Scroll checkpoints: when each day's card becomes active (tracker arrived).
 * Day 6 arrives early enough (~78%) that the final stretch is a readable dwell
 * before the pin releases — this was the skip bug.
 */
const DAY_SCROLL_ARRIVE = [0, 0.14, 0.28, 0.42, 0.56, 0.78] as const;

/** Map ScrollTrigger progress → route progress along the dashed path. */
export function scrollToRouteProgress(scrollProgress: number) {
  const p = Math.max(0, Math.min(1, scrollProgress));

  // After Day 6 arrival: hold at end of route
  if (p >= DAY_SCROLL_ARRIVE[5]) return 1;

  // Find segment between day i and i+1
  let i = 0;
  for (let d = 0; d < DAY_SCROLL_ARRIVE.length - 1; d++) {
    if (p >= DAY_SCROLL_ARRIVE[d]) i = d;
  }
  const a = DAY_SCROLL_ARRIVE[i];
  const b = DAY_SCROLL_ARRIVE[i + 1];
  const t = b === a ? 1 : (p - a) / (b - a);
  const from = DAY_PROGRESS[i];
  const to = DAY_PROGRESS[i + 1];
  return from + (to - from) * Math.max(0, Math.min(1, t));
}

/** Inverse: route progress → scroll progress (for day-tab jumps). */
export function routeToScrollProgress(routeProgress: number) {
  const r = Math.max(0, Math.min(1, routeProgress));
  let day = 1;
  for (let i = 0; i < DAY_PROGRESS.length; i++) {
    if (r + 1e-6 >= DAY_PROGRESS[i]) day = i + 1;
  }
  const arrive = DAY_SCROLL_ARRIVE[day - 1];
  if (day === 6) {
    // Mid Day-6 dwell so the final card is clearly active
    return arrive + (1 - arrive) * 0.45;
  }
  // Slightly after arrival so the card is settled
  const next = DAY_SCROLL_ARRIVE[day] ?? 1;
  return arrive + (next - arrive) * 0.08;
}

export function progressForDay(day: number) {
  const route = DAY_PROGRESS[Math.max(0, Math.min(day, 6) - 1)] ?? 0;
  return routeToScrollProgress(route);
}

/** Active day once the tracker has reached that pin (reversible). */
export function dayFromProgress(routeProgress: number) {
  const p = Math.max(0, Math.min(1, routeProgress));
  let day = 1;
  for (let i = 0; i < DAY_PROGRESS.length; i++) {
    if (p + 0.0005 >= DAY_PROGRESS[i]) day = i + 1;
  }
  return day;
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
  const focus = viewH * 0.38;
  const raw = focus - arrowY;
  return Math.max(-(stageH - viewH), Math.min(0, raw));
}

type MapRouteArrowProps = {
  /** 0 = Day 1 pin, 1 = Day 6 pin — scrubbed route progress. */
  progress: number;
  stageRef: React.RefObject<HTMLDivElement | null>;
  viewportRef: React.RefObject<HTMLDivElement | null>;
};

export function MapRouteArrow({
  progress,
  stageRef,
  viewportRef,
}: MapRouteArrowProps) {
  const [mounted, setMounted] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLImageElement>(null);
  const rawPathRef = useRef<ReturnType<
    typeof MotionPathPlugin.arrayToRawPath
  > | null>(null);
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
      rawPathRef.current = MotionPathPlugin.arrayToRawPath(
        pointsInFrame(w, h),
        { curviness: 0.35 },
      );
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
        className={styles.mapTrackerArrow}
        src="/images/destination/nav-arrow-map.png"
        alt=""
        width={56}
        height={56}
        draggable={false}
      />
    </div>
  );
}
