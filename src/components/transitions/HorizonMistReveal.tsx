"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import styles from "./horizon-mist-reveal.module.css";

const MIST_SRC = "/images/clouds-mist.png";
const BANK_SRC = "/images/clouds-section.png";

export type HorizonMistRevealHandle = {
  /** 0 = mist closed over Story; 1 = Story fully clear. */
  setProgress: (progress: number) => void;
};

/**
 * Original Gallery (§3) → Our Story (§4) reveal.
 *
 * Wide horizon aperture (soft ellipse — not a circular iris) opens from the
 * midline while top/bottom cloud banks peel apart: fog lifting into Story sky.
 * Progress is applied imperatively from StoryScroll’s enter runway (scrub only).
 */
export const HorizonMistReveal = forwardRef<HorizonMistRevealHandle>(
  function HorizonMistReveal(_, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const bankTopRef = useRef<HTMLImageElement>(null);
    const bankBottomRef = useRef<HTMLImageElement>(null);

    useImperativeHandle(ref, () => ({
      setProgress(progress: number) {
        const host = hostRef.current;
        if (!host) return;

        const t = Math.min(1, Math.max(0, progress));
        // Hold closed briefly, then open — readable mid-frames of the aperture.
        const hold = 0.08;
        const openT =
          t <= hold ? 0 : Math.min(1, (t - hold) / (1 - hold));
        const eased = openT * openT * (3 - 2 * openT);

        const holeX = 4 + Math.pow(eased, 1.35) * 160;
        const holeY = 2.5 + Math.pow(eased, 1.45) * 140;
        const mask = `radial-gradient(ellipse ${holeX}% ${holeY}% at 50% 56%, transparent 0%, transparent 52%, #000 100%)`;

        const veilOpacity =
          t >= 0.98
            ? 0
            : t <= 0.02
              ? 1
              : 1 - Math.pow(Math.max(0, (t - 0.62) / 0.38), 1.35);

        const bankLift = eased * 48;
        const bankFade = 1 - eased * 0.88;
        const glowOpacity =
          Math.sin(Math.min(1, eased * 1.2) * Math.PI) * 0.75;
        const glowScale = 0.68 + eased * 0.6;

        const show = veilOpacity > 0.02 && t < 0.995;
        host.style.visibility = show ? "visible" : "hidden";
        host.style.opacity = show ? String(veilOpacity) : "0";
        host.style.webkitMaskImage = mask;
        host.style.maskImage = mask;
        host.setAttribute("data-progress", t.toFixed(3));

        if (glowRef.current) {
          glowRef.current.style.opacity = String(glowOpacity);
          glowRef.current.style.transform = `scale(${glowScale})`;
        }
        if (bankTopRef.current) {
          bankTopRef.current.style.opacity = String(bankFade);
          bankTopRef.current.style.transform = `translate3d(-50%, ${-bankLift}%, 0) scaleY(-1)`;
        }
        if (bankBottomRef.current) {
          bankBottomRef.current.style.opacity = String(bankFade);
          bankBottomRef.current.style.transform = `translate3d(-50%, ${bankLift}%, 0)`;
        }
      },
    }));

    return (
      <div
        className={styles.host}
        aria-hidden="true"
        ref={hostRef}
        style={{ visibility: "visible", opacity: 1 }}
      >
        <div className={styles.fill} />

        <img
          className={styles.mist}
          src={MIST_SRC}
          alt=""
          width={1920}
          height={1080}
          draggable={false}
        />
        <img
          className={styles.mistAlt}
          src={MIST_SRC}
          alt=""
          width={1920}
          height={1080}
          draggable={false}
        />

        <div className={styles.horizonGlow} ref={glowRef} />

        <img
          className={styles.bankTop}
          src={BANK_SRC}
          alt=""
          width={1600}
          height={2600}
          draggable={false}
          ref={bankTopRef}
        />
        <img
          className={styles.bankBottom}
          src={BANK_SRC}
          alt=""
          width={1600}
          height={2600}
          draggable={false}
          ref={bankBottomRef}
        />
      </div>
    );
  },
);
