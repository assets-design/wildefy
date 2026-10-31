"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import styles from "./destination.module.css";

gsap.registerPlugin(MotionPathPlugin);

/**
 * Polyline along the orange dashed route centerline on map-v2.
 * Day pins are cream-hole centers on map-bg.png (% of map stage).
 */
const ROUTE_POINTS = [
  // Day 1 — Raipur
  { x: 26.95, y: 7.65},
  { x: 28.76, y: 9.84 },
  { x: 32.88, y: 11.43 },
  { x: 36.09, y: 13.62 },
  { x: 39.24, y: 15.86 },
  { x: 42.3, y: 18.14 },
  { x: 45.3, y: 20.45 },
  { x: 48.0, y: 22.89 },
  // Day 2 — Kanha National Park
  { x: 50.5, y: 25.61 },
  { x: 51.14, y: 27.59 },
  { x: 51.4, y: 29.79 },
  { x: 52.54, y: 31.89 },
  { x: 54.76, y: 33.68 },
  { x: 56.22, y: 35.71 },
  { x: 56.51, y: 37.91 },
  // Day 3 — Kanha Safari Zone
  { x: 56.50, y: 40.32 },
  { x: 56.92, y: 42.02 },
  { x: 56.17, y: 44.03 },
  { x: 54.33, y: 45.8 },
  { x: 51.94, y: 47.31 },
  { x: 49.45, y: 48.79 },
  { x: 47.93, y: 50.64 },
  // Day 4 — Kanha Leisure
  { x: 47.76, y: 52.91 },
  { x: 47.57, y: 54.85 },
  { x: 46.99, y: 57.0 },
  { x: 47.56, y: 59.12 },
  { x: 49.1, y: 61.09 },
  { x: 50.99, y: 62.96 },
  // Day 5 — Kanha Safari Zone
  { x: 52.53, y: 65.13 },
  { x: 52.5, y: 67.29 },
  { x: 50.2, y: 69.53 },
  { x: 46.59, y: 71.11 },
  { x: 42.75, y: 72.51 },
  { x: 39.32, y: 74.24 },
  { x: 36.08, y: 76.1 },
  { x: 33.2, y: 78.14 },
  // Day 6 — Return to Raipur
  { x: 32.47, y: 80.89 },
] as const;

/** Route-point indices on each day pin (Day 1…6). */
const DAY_POINT_INDEX = [0, 8, 15, 22, 28, 36] as const;

const DAY_PINS = DAY_POINT_INDEX.map((idx) => ROUTE_POINTS[idx]);

const BLINK_DOT_SRC = "/images/destination/red-blinking-dot.gif";

type PathPoint = { x: number; y: number; angle: number };

/** includeAngle=true → GSAP returns { x, y, angle }; typings omit `angle`. */
function positionOnPath(
  rawPath: ReturnType<typeof MotionPathPlugin.arrayToRawPath>,
  progress: number,
): PathPoint {
  return MotionPathPlugin.getPositionOnPath(
    rawPath,
    progress,
    true,
  ) as PathPoint;
}

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
 * Scroll checkpoints for each day's arrival.
 * Day 6 lands late (~88%) so only a short beat remains before normal scroll
 * releases into Experiences — no long dead scroll after the final pin.
 */
const DAY_SCROLL_ARRIVE = [0, 0.14, 0.28, 0.42, 0.58, 0.88] as const;

/** Map ScrollTrigger progress → route progress along the dashed path. */
export function scrollToRouteProgress(scrollProgress: number) {
  const p = Math.max(0, Math.min(1, scrollProgress));

  if (p >= DAY_SCROLL_ARRIVE[5]) return 1;

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
    // Slightly into the short Day-6 hold
    return arrive + (1 - arrive) * 0.25;
  }
  const next = DAY_SCROLL_ARRIVE[day] ?? 1;
  return arrive + (next - arrive) * 0.08;
}

export function progressForDay(day: number) {
  const route = DAY_PROGRESS[Math.max(0, Math.min(day, 6) - 1)] ?? 0;
  return routeToScrollProgress(route);
}

/**
 * Active day from route progress (arrow on pin).
 * Prefer dayFromScrollProgress for cards — keeps Day N until Day N+1 arrives.
 */
export function dayFromProgress(routeProgress: number) {
  const p = Math.max(0, Math.min(1, routeProgress));
  let day = 1;
  for (let i = 0; i < DAY_PROGRESS.length; i++) {
    if (p + 0.0005 >= DAY_PROGRESS[i]) day = i + 1;
  }
  return day;
}

/** Active day from pin scroll — card stays until the next day's checkpoint. */
export function dayFromScrollProgress(scrollProgress: number) {
  const p = Math.max(0, Math.min(1, scrollProgress));
  let day = 1;
  for (let i = 0; i < DAY_SCROLL_ARRIVE.length; i++) {
    if (p + 1e-6 >= DAY_SCROLL_ARRIVE[i]) day = i + 1;
  }
  return day;
}

function pointsInFrame(width: number, height: number) {
  return ROUTE_POINTS.map((p) => ({
    x: (p.x / 100) * width,
    y: (p.y / 100) * height,
  }));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0 || 1)));
  return t * t * (3 - 2 * t);
}

/**
 * Keep the arrow framed. From Day 5 onward, ease hard to max pan so the
 * southern map (Day 6 + scale bar) is fully visible before the pin releases.
 */
function panOffset(
  arrowY: number,
  stageH: number,
  viewH: number,
  routeProgress: number,
) {
  if (stageH <= viewH + 1) return 0;
  const maxPan = -(stageH - viewH);
  const focus = viewH * 0.38;
  const follow = Math.max(maxPan, Math.min(0, focus - arrowY));

  // Lock to full-bottom reveal across Day 5 → Day 6
  const lock = smoothstep(DAY_PROGRESS[4], DAY_PROGRESS[5], routeProgress);
  if (lock >= 0.999) return maxPan;
  return follow + (maxPan - follow) * lock;
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

    /**
     * Width-locked stage can be shorter than 100vh (narrow tall browser).
     * Scale up to fill frame height; tall maps keep width:100% and pan.
     * Only write styles when values change — writing every frame fed a
     * ResizeObserver loop that thrashed ScrollTrigger pin spacing.
     */
    const fitStageSize = () => {
      const viewH = viewport.clientHeight;
      const frameW = viewport.clientWidth;
      if (viewH < 2 || frameW < 2) return;
      const naturalH = frameW * (4095 / 2485);
      let nextW: string;
      let nextH: string;
      let nextLeft: string;
      if (naturalH >= viewH - 1) {
        nextW = "100%";
        nextH = "";
        nextLeft = "0px";
      } else {
        const fittedW = viewH * (2485 / 4095);
        nextH = `${viewH}px`;
        nextW = `${fittedW}px`;
        nextLeft = `${(frameW - fittedW) / 2}px`;
      }
      if (stage.style.width !== nextW) stage.style.width = nextW;
      if (stage.style.height !== nextH) stage.style.height = nextH;
      if (stage.style.left !== nextLeft) stage.style.left = nextLeft;
    };

    const rebuildPath = () => {
      fitStageSize();
      const w = stage.offsetWidth;
      const h = stage.offsetHeight;
      rawPathRef.current = MotionPathPlugin.arrayToRawPath(
        pointsInFrame(w, h),
        { curviness: 0.28 },
      );
    };

    const place = (p: number) => {
      const rawPath = rawPathRef.current;
      if (!rawPath) return;
      const point = positionOnPath(rawPath, p);
      const viewH = viewport.clientHeight;
      const stageH = stage.offsetHeight;
      const pan = panOffset(point.y, stageH, viewH, p);

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

    let resizeTimer: number | null = null;
    const onResize = () => {
      if (resizeTimer != null) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resizeTimer = null;
        rebuildPath();
        place(progressRef.current);
      }, 80);
    };
    window.addEventListener("resize", onResize);
    // Observe viewport only — never the stage (fitStageSize writes stage box)
    const ro = new ResizeObserver(onResize);
    ro.observe(viewport);

    return () => {
      window.removeEventListener("resize", onResize);
      if (resizeTimer != null) window.clearTimeout(resizeTimer);
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

    const point = positionOnPath(rawPath, clamped);
    const pan = panOffset(
      point.y,
      stage.offsetHeight,
      viewport.clientHeight,
      clamped,
    );
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
        <span
          key={`blink-${index + 1}`}
          className={styles.mapBlinkAnchor}
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        >
          <img
            className={styles.mapBlinkDot}
            src={BLINK_DOT_SRC}
            alt=""
            width={28}
            height={28}
            draggable={false}
          />
        </span>
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
