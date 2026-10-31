"use client";

/**
 * /v2 only — provided cloud asset as the section join veil.
 *
 * enter 0→1: cloud slides up into place at full opacity (no fade-in)
 * progress 0→1: cloud scrolls off the top; next section shows
 */

import styles from "./v2-cloud-seam.module.css";

const CLOUD_SRC = "/images/transitions/section-cloud.png";

type Props = {
  /** 0 = covering join, 1 = scrolled off top */
  progress: number;
  /** 0 = below viewport, 1 = parked covering the join */
  enter?: number;
  tone?: "sky" | "forest";
};

function easeOut(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - x, 2.2);
}

function easeInOut(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export function V2CloudVeil({ progress, enter = 1, tone = "sky" }: Props) {
  const t = Math.min(1, Math.max(0, progress));
  const e = Math.min(1, Math.max(0, enter));
  const enterEased = easeOut(e);

  /* Arrive from below at full opacity, then lift off the top */
  const hold = 0.06;
  const liftT = t <= hold ? 0 : Math.min(1, (t - hold) / (1 - hold));
  const liftEased = easeInOut(liftT);

  const arriveY = (1 - enterEased) * 95;
  const liftY = liftEased * -118;
  const cloudY = arriveY + liftY;
  const cloudScale = 0.86 - liftEased * 0.1;

  const fillOpacity =
    t >= 0.98
      ? 0
      : e < 0.15
        ? enterEased
        : Math.max(0, 1 - Math.pow(Math.max(0, (t - 0.35) / 0.55), 1.2));

  const show = e > 0.02 && t < 0.995;

  return (
    <div
      className={styles.host}
      aria-hidden="true"
      style={{
        visibility: show ? "visible" : "hidden",
      }}
    >
      <div
        className={`${styles.fill} ${tone === "forest" ? styles.fillForest : ""}`}
        style={{ opacity: fillOpacity }}
      />

      <div
        className={styles.cloudLayer}
        style={{
          transform: `translate3d(0, ${cloudY.toFixed(2)}%, 0) scale(${cloudScale.toFixed(3)})`,
          opacity: 1,
        }}
      >
        <img
          className={styles.cloudAlt}
          src={CLOUD_SRC}
          alt=""
          width={1920}
          height={1080}
          draggable={false}
          style={{
            transform: "translate3d(-18%, 12%, 0) scaleX(-1)",
          }}
        />
        <img
          className={styles.cloud}
          src={CLOUD_SRC}
          alt=""
          width={1920}
          height={1080}
          draggable={false}
        />
        <img
          className={styles.cloudAlt}
          src={CLOUD_SRC}
          alt=""
          width={1920}
          height={1080}
          draggable={false}
          style={{
            transform: "translate3d(22%, -8%, 0)",
            opacity: 0.4,
          }}
        />
      </div>
    </div>
  );
}
