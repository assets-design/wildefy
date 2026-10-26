"use client";

import type { CSSProperties } from "react";
import styles from "./experiences-journey.module.css";

/** Scroll window for the NatGeo-style fly-past reveal. */
export const REVEAL_END = 0.12;

/**
 * Remap section scroll so the first ~12% only eases into the mountain aerial,
 * then the remaining journey uses the full camera spline.
 */
export function cameraProgressFromScroll(scrollProgress: number): number {
  const p = Math.min(1, Math.max(0, scrollProgress));
  if (p <= REVEAL_END) {
    return (p / REVEAL_END) * 0.065;
  }
  return 0.065 + ((p - REVEAL_END) / (1 - REVEAL_END)) * 0.935;
}

function easeInOut(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

type Props = {
  /** Raw sticky-section scroll progress 0–1. */
  progress: number;
};

/**
 * Foreground cutouts (bird + branches) + mist that scale/translate outward
 * on scroll — same reveal grammar as NatGeo Into the Amazon: fly past the
 * near layer to open the landscape beyond.
 */
export function JourneyReveal({ progress }: Props) {
  if (progress >= REVEAL_END + 0.02) return null;
  const t = easeInOut(Math.min(1, Math.max(0, progress / REVEAL_END)));

  const fade = 1 - Math.min(1, Math.max(0, (t - 0.72) / 0.28));
  const mistOpacity = (1 - t * 0.92) * fade;
  const birdScale = 1 + t * 1.35;
  const birdX = -8 - t * 42;
  const birdY = 6 + t * 38;
  const branchLScale = 1 + t * 1.15;
  const branchLX = -t * 55;
  const branchLY = 8 + t * 28;
  const branchRScale = 1 + t * 1.25;
  const branchRX = t * 58;
  const branchRY = -4 - t * 32;

  const birdStyle: CSSProperties = {
    opacity: fade,
    transform: `translate3d(${birdX}%, ${birdY}%, 0) scale(${birdScale})`,
  };
  const branchLStyle: CSSProperties = {
    opacity: fade * 0.95,
    transform: `translate3d(${branchLX}%, ${branchLY}%, 0) scale(${branchLScale})`,
  };
  const branchRStyle: CSSProperties = {
    opacity: fade * 0.95,
    transform: `translate3d(${branchRX}%, ${branchRY}%, 0) scale(${branchRScale})`,
  };
  const mistStyle: CSSProperties = {
    opacity: mistOpacity,
    transform: `scale(${1 + t * 0.45})`,
  };
  const veilStyle: CSSProperties = {
    opacity: Math.max(0, 0.55 * (1 - t) * fade),
  };

  return (
    <div className={styles.reveal} aria-hidden="true">
      <div className={styles.revealVeil} style={veilStyle} />
      <div className={styles.revealMist} style={mistStyle} />

      <div className={styles.revealBranchLeft} style={branchLStyle}>
        <BranchSilhouette side="left" />
      </div>
      <div className={styles.revealBranchRight} style={branchRStyle}>
        <BranchSilhouette side="right" />
      </div>

      <div className={styles.revealBird} style={birdStyle}>
        <img
          src="/images/hero/hero-bird.png"
          alt=""
          width={900}
          height={700}
          draggable={false}
          decoding="async"
        />
      </div>
    </div>
  );
}

function BranchSilhouette({ side }: { side: "left" | "right" }) {
  const flip = side === "right" ? -1 : 1;
  return (
    <svg
      className={styles.revealBranchSvg}
      viewBox="0 0 640 720"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `scaleX(${flip})` }}
    >
      <defs>
        <linearGradient id={`branchGrad-${side}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a4a38" />
          <stop offset="55%" stopColor="#0f2f24" />
          <stop offset="100%" stopColor="#071a14" />
        </linearGradient>
      </defs>
      {/* Main limb */}
      <path
        d="M-40 520 C80 480, 160 400, 240 300 C310 220, 360 150, 420 40"
        fill="none"
        stroke={`url(#branchGrad-${side})`}
        strokeWidth="28"
        strokeLinecap="round"
      />
      <path
        d="M180 360 C240 340, 300 300, 360 220"
        fill="none"
        stroke="#143d2e"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d="M120 430 C170 410, 220 390, 270 340"
        fill="none"
        stroke="#123528"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* Leaf clusters */}
      {[
        [250, 280, 54, -28],
        [310, 210, 48, 18],
        [360, 140, 42, -12],
        [200, 340, 46, 32],
        [150, 400, 40, -22],
        [400, 80, 38, 24],
        [280, 250, 36, 40],
        [330, 170, 34, -36],
        [100, 450, 44, 10],
        [380, 110, 40, 8],
      ].map(([cx, cy, r, rot], i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={r}
          ry={r * 0.42}
          transform={`rotate(${rot} ${cx} ${cy})`}
          fill={i % 2 === 0 ? "#1f6b4a" : "#16553a"}
          opacity={0.92}
        />
      ))}
    </svg>
  );
}
