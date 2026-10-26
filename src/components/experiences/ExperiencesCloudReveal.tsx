"use client";

import styles from "./experiences-journey.module.css";

/**
 * Enter reveal for Experiences — full white cloud field covers the section,
 * then clears on scroll so the Experiences image shows through.
 *
 * Uses the site cloud assets (mist landscape + fluffy section banks), not a
 * flat white plate.
 *
 * progress 0 = solid white clouds covering
 * progress 1 = clouds gone
 */
const MIST_SRC = "/images/clouds-mist.png";
const BANK_SRC = "/images/clouds-section.png";

type Props = {
  /** 0–1 dissolve amount (already eased by parent). */
  progress: number;
};

export function ExperiencesCloudReveal({ progress }: Props) {
  const t = Math.min(1, Math.max(0, progress));
  const hidden = t >= 0.995;
  // Hold full cover briefly, then clear — keeps clouds readable mid-reveal
  const cover = Math.min(1, Math.max(0, 1 - t));
  const opacity = cover * cover; // ease out so clouds linger a bit
  const scale = 1 + t * 0.14;
  const lift = t * -6;

  return (
    <div
      className={styles.cloudReveal}
      aria-hidden="true"
      style={{
        visibility: hidden ? "hidden" : "visible",
        opacity: hidden ? 0 : opacity,
        transform: `scale(${scale}) translate3d(0, ${lift}%, 0)`,
        pointerEvents: "none",
      }}
    >
      {/* Bright white underlay so no scene peeks through early */}
      <div className={styles.cloudRevealFill} />

      {/* Full-frame white cloudscape */}
      <img
        className={styles.cloudRevealMist}
        src={MIST_SRC}
        alt=""
        width={1920}
        height={1080}
        draggable={false}
      />
      <img
        className={styles.cloudRevealMistAlt}
        src={MIST_SRC}
        alt=""
        width={1920}
        height={1080}
        draggable={false}
      />

      {/* Fluffy top / bottom banks from journey cloud */}
      <img
        className={styles.cloudRevealBankTop}
        src={BANK_SRC}
        alt=""
        width={1600}
        height={2600}
        draggable={false}
      />
      <img
        className={styles.cloudRevealBankBottom}
        src={BANK_SRC}
        alt=""
        width={1600}
        height={2600}
        draggable={false}
      />
    </div>
  );
}

/** Ease raw 0–1 scrub into organic dissolve. */
export function easeCloudReveal(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - x, 3);
}
