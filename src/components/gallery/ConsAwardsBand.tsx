"use client";

import type { CSSProperties, ReactNode } from "react";
import styles from "./consAwardsBand.module.css";

type Props = { children: ReactNode };

/**
 * Figma 772:64 — Pastel meadow sky plate + three fluffy clouds.
 * Positions are % of the panoramic plate (Group 326 / 11153×2469).
 * AwardsScroll pans [data-shared-section-bg] and [data-shared-section-clouds]
 * at Story-like depth rates (bg slower, clouds faster).
 */
/* Tops biased into the upper sky — plate is taller for Conservation→Awards pan */
const CLOUDS = [
  { left: "26%", top: "22%", width: "20%" },
  { left: "52%", top: "14%", width: "24%" },
  { left: "78%", top: "10%", width: "22%" },
] as const;

export function ConsAwardsBand({ children }: Props) {
  return (
    <div className={styles.band} data-cons-awards-band="">
      {/* Scrolls with the join — softens enter; sticky plate stays opaque */}
      <div className={styles.join} aria-hidden="true">
        <img
          className={styles.joinImg}
          src="/images/cons-awards/meadow-sky.png"
          alt=""
          width={4094}
          height={994}
          draggable={false}
          decoding="async"
        />
      </div>
      <div className={styles.bg} aria-hidden="true">
        <img
          className={styles.bgImg}
          data-shared-section-bg=""
          src="/images/cons-awards/meadow-sky.png"
          alt=""
          width={4094}
          height={994}
          draggable={false}
          decoding="async"
        />
        <div className={styles.clouds} data-shared-section-clouds="">
          {CLOUDS.map((cloud, i) => (
            <div
              key={i}
              className={styles.cloud}
              style={
                {
                  left: cloud.left,
                  top: cloud.top,
                  ["--cloud-w"]: cloud.width,
                } as CSSProperties
              }
            >
              <img
                src="/images/cons-awards/cloud-fluffy.png"
                alt=""
                width={979}
                height={521}
                draggable={false}
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
