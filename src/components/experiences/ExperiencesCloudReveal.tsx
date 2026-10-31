"use client";

import styles from "./experiences-journey.module.css";

/**
 * Layered cloud mist using site assets (clouds-mist + clouds-section).
 *
 * progress 0 = full cover
 * progress 1 = cleared
 *
 * variant "handoff": §2→§3 seam — lateral/diagonal drift, depth layers,
 * soft cyan→sky tint. Not a flat white rectangle.
 */
const MIST_SRC = "/images/clouds-mist.png";
const BANK_SRC = "/images/clouds-section.png";

type Props = {
  /** 0–1 dissolve amount (already eased by parent). */
  progress: number;
  /** enter: cover→clear. exit: clear→cover. */
  mode?: "enter" | "exit";
  /** Default enter veil vs cinematic Experiences→Gallery handoff. */
  variant?: "default" | "handoff";
};

export function ExperiencesCloudReveal({
  progress,
  mode = "enter",
  variant = "default",
}: Props) {
  const t = Math.min(1, Math.max(0, progress));
  const hidden = t >= 0.995;
  const cover = Math.min(1, Math.max(0, 1 - t));
  const opacity = cover * cover;
  const isExit = mode === "exit";
  const isHandoff = variant === "handoff";

  const scale = isExit ? 1.14 - t * 0.14 : 1 + t * (isHandoff ? 0.1 : 0.14);
  const lift = isExit ? (1 - t) * 6 : t * (isHandoff ? -4 : -6);

  /* Depth drift — opposite lateral motion on mist layers */
  const mistX = isHandoff ? (isExit ? (1 - t) * 4 : t * -5) : 0;
  const mistAltX = isHandoff ? (isExit ? (1 - t) * -5 : t * 6) : 0;
  const mistY = isHandoff ? t * -3 : 0;
  const mistAltY = isHandoff ? t * 2.5 : 0;
  const bankLift = isHandoff ? t * 18 : 0;

  return (
    <div
      className={`${styles.cloudReveal} ${isExit ? styles.cloudRevealExit : ""} ${isHandoff ? styles.cloudRevealHandoffVariant : ""}`}
      aria-hidden="true"
      style={{
        visibility: hidden ? "hidden" : "visible",
        opacity: hidden ? 0 : opacity,
        transform: `scale(${scale}) translate3d(0, ${lift}%, 0)`,
        pointerEvents: "none",
      }}
    >
      <div className={styles.cloudRevealFill} />

      <img
        className={styles.cloudRevealMist}
        src={MIST_SRC}
        alt=""
        width={1920}
        height={1080}
        draggable={false}
        style={
          isHandoff
            ? {
                transform: `translate3d(${mistX}%, ${mistY}%, 0)`,
              }
            : undefined
        }
      />
      <img
        className={styles.cloudRevealMistAlt}
        src={MIST_SRC}
        alt=""
        width={1920}
        height={1080}
        draggable={false}
        style={
          isHandoff
            ? {
                transform: `scaleX(-1) translate3d(${mistAltX}%, ${mistAltY}%, 0)`,
              }
            : undefined
        }
      />

      <img
        className={styles.cloudRevealBankTop}
        src={BANK_SRC}
        alt=""
        width={1600}
        height={2600}
        draggable={false}
        style={
          isHandoff
            ? {
                transform: `translateX(-50%) scaleY(-1) translate3d(${t * -2}%, ${-bankLift}%, 0)`,
                opacity: 0.92 * (0.35 + cover * 0.65),
              }
            : undefined
        }
      />
      <img
        className={styles.cloudRevealBankBottom}
        src={BANK_SRC}
        alt=""
        width={1600}
        height={2600}
        draggable={false}
        style={
          isHandoff
            ? {
                transform: `translateX(-50%) translate3d(${t * 3}%, ${bankLift}%, 0)`,
                opacity: 0.98 * (0.35 + cover * 0.65),
              }
            : undefined
        }
      />
    </div>
  );
}

/** Ease raw 0–1 scrub into organic dissolve. */
export function easeCloudReveal(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - x, 3);
}
