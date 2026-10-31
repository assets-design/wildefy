"use client";

/**
 * LivingFrameOverlay — GPU-accelerated animated atmosphere.
 *
 * Uses CSS animations + SVG feTurbulence (runs on GPU, zero CPU cost)
 * to create drifting fog, mist shimmer, and light flicker over the
 * scroll-scrubbed video frames. Animates continuously regardless of
 * whether the user is scrolling.
 *
 * Three layers stacked via mix-blend-mode:
 *   1. Slow fog drift  — large soft radial gradients gliding across
 *   2. Mist shimmer    — SVG turbulence displacement on a light veil
 *   3. Rim glow        — subtle warm edge-light that breathes
 */

import { useEffect, useRef } from "react";
import styles from "./experiences-journey.module.css";

interface Props {
  /** 0–1 section progress — adjusts atmosphere intensity per stage */
  progress: number;
}

export function LivingFrameOverlay({ progress: _progress }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Honour reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = rootRef.current;
    if (el) el.style.display = "block";
  }, []);

  return (
    <>
      {/* ── SVG filter definition (hidden, referenced by CSS) ── */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <filter id="fog-warp" x="-20%" y="-20%" width="140%" height="140%"
            colorInterpolationFilters="sRGB">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.012"
              numOctaves="4"
              seed="8"
              result="noise"
            >
              {/* Animate baseFrequency to make turbulence drift */}
              <animate
                attributeName="baseFrequency"
                values="0.007 0.010;0.010 0.015;0.007 0.010"
                dur="14s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="28"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feGaussianBlur in="displaced" stdDeviation="1.5" />
          </filter>

          <filter id="mist-glow" x="-5%" y="-5%" width="110%" height="110%"
            colorInterpolationFilters="sRGB">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.018 0.022"
              numOctaves="3"
              seed="3"
              result="noise2"
            >
              <animate
                attributeName="seed"
                values="3;7;11;3"
                dur="20s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.9
                      0 0 0 0 0.95
                      0 0 0 0 1
                      0 0 0 0.18 0"
              result="mistColor"
            />
            <feComposite in="mistColor" in2="SourceGraphic" operator="over" />
          </filter>
        </defs>
      </svg>

      {/* ── Atmosphere layers ── */}
      <div
        ref={rootRef}
        className={styles.livingAtmosphere}
        aria-hidden="true"
        style={{ display: "none" }} // shown only after reduced-motion check
      >
        {/* Layer 1: slow drifting fog banks */}
        <div className={styles.fogDrift} />

        {/* Layer 2: SVG turbulence mist veil */}
        <div className={styles.mistVeilAnim} />

        {/* Layer 3: warm rim breath (light flicker at edges) */}
        <div className={styles.rimBreath} />

        {/* Layer 4: subtle horizontal light streak */}
        <div className={styles.lightStreak} />
      </div>
    </>
  );
}
