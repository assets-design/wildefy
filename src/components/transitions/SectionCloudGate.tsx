"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { easeCloudReveal } from "@/components/experiences/ExperiencesCloudReveal";
import styles from "./section-cloud-gate.module.css";

gsap.registerPlugin(ScrollTrigger);

const MIST_SRC = "/images/clouds-mist.png";
const BANK_SRC = "/images/clouds-section.png";

export type CloudTone = "sky" | "cream" | "mist" | "forest" | "amber";

type Props = {
  /** Section that owns the gate (must be position: relative|sticky). */
  sectionRef: RefObject<HTMLElement | null>;
  /** Cover → clear as the section arrives. */
  enter?: boolean;
  /** Clear → cover as the section leaves toward the next. */
  exit?: boolean;
  tone?: CloudTone;
  /** Enter runway in vh (pinned) or fraction of section height. */
  enterVh?: number;
  exitVh?: number;
  /**
   * pinned: scrub from pin top (Story / Awards / Conservation).
   * flow: scrub as section crosses the viewport (Gallery).
   */
  layout?: "pinned" | "flow";
};

function CloudVeil({
  progress,
  mode,
  tone,
}: {
  progress: number;
  mode: "enter" | "exit";
  tone: CloudTone;
}) {
  const t = Math.min(1, Math.max(0, progress));
  const isExit = mode === "exit";
  // enter: 0 covered → 1 clear. exit: 0 clear → 1 covered.
  const cover = isExit ? t : 1 - t;
  const hidden = cover <= 0.02;
  const opacity = Math.min(1, cover * cover * 1.05);
  const scale = isExit ? 1 + cover * 0.12 : 1.12 - t * 0.12;
  const lift = isExit ? cover * 5 : (1 - t) * 5;

  const toneClass =
    tone === "sky"
      ? styles.toneSky
      : tone === "cream"
        ? styles.toneCream
        : tone === "forest"
          ? styles.toneForest
          : tone === "amber"
            ? styles.toneAmber
            : styles.toneMist;

  return (
    <div
      className={`${styles.gate} ${isExit ? styles.gateExit : styles.gateEnter} ${toneClass}`}
      aria-hidden="true"
      style={{
        visibility: hidden ? "hidden" : "visible",
        opacity: hidden ? 0 : opacity,
        transform: `scale(${scale}) translate3d(0, ${isExit ? lift : -lift}%, 0)`,
      }}
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
      <img
        className={styles.bankTop}
        src={BANK_SRC}
        alt=""
        width={1600}
        height={2600}
        draggable={false}
      />
      <img
        className={styles.bankBottom}
        src={BANK_SRC}
        alt=""
        width={1600}
        height={2600}
        draggable={false}
      />
    </div>
  );
}

/**
 * Customizable cloud reveal + close for homepage sections
 * (Gallery, Story, Conservation, Awards). Hero / Experiences / Footer
 * stay untouched — they own their own transitions.
 */
export function SectionCloudGate({
  sectionRef,
  enter = true,
  exit = true,
  tone = "mist",
  enterVh = 0.75,
  exitVh = 0.7,
  layout = "flow",
}: Props) {
  const [enterP, setEnterP] = useState(enter ? 0 : 1);
  const [exitP, setExitP] = useState(0);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEnterP(1);
      setExitP(0);
      return;
    }

    let enterRaf = 0;
    let exitRaf = 0;
    let enterPending = -1;
    let exitPending = -1;

    const flushEnter = () => {
      enterRaf = 0;
      if (enterPending < 0) return;
      const next = enterPending;
      enterPending = -1;
      setEnterP(next);
    };
    const flushExit = () => {
      exitRaf = 0;
      if (exitPending < 0) return;
      const next = exitPending;
      exitPending = -1;
      setExitP(next);
    };

    const tweens: gsap.core.Tween[] = [];

    if (enter) {
      const proxy = { p: 0 };
      const tween = gsap.to(proxy, {
        p: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: layout === "pinned" ? "top top" : "top 92%",
          end:
            layout === "pinned"
              ? () => `+=${Math.round(window.innerHeight * enterVh)}`
              : "top 18%",
          scrub: 0.45,
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          enterPending = easeCloudReveal(proxy.p);
          if (!enterRaf) enterRaf = window.requestAnimationFrame(flushEnter);
        },
      });
      tweens.push(tween);
      setEnterP(easeCloudReveal(proxy.p));
    } else {
      setEnterP(1);
    }

    if (exit) {
      const proxy = { p: 0 };
      const tween = gsap.to(proxy, {
        p: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start:
            layout === "pinned"
              ? () => {
                  const travel = Math.max(
                    1,
                    section.offsetHeight - window.innerHeight,
                  );
                  const exitPx = Math.round(window.innerHeight * exitVh);
                  return `top+=${Math.max(0, travel - exitPx)} top`;
                }
              : "bottom 90%",
          end:
            layout === "pinned"
              ? () => {
                  const travel = Math.max(
                    1,
                    section.offsetHeight - window.innerHeight,
                  );
                  return `top+=${travel} top`;
                }
              : "bottom top",
          scrub: 0.45,
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          exitPending = easeCloudReveal(proxy.p);
          if (!exitRaf) exitRaf = window.requestAnimationFrame(flushExit);
        },
      });
      tweens.push(tween);
      setExitP(easeCloudReveal(proxy.p));
    }

    return () => {
      if (enterRaf) window.cancelAnimationFrame(enterRaf);
      if (exitRaf) window.cancelAnimationFrame(exitRaf);
      tweens.forEach((tween) => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
    };
  }, [sectionRef, enter, exit, enterVh, exitVh, layout]);

  return (
    <div className={styles.host} aria-hidden="true">
      {enter ? (
        <CloudVeil progress={enterP} mode="enter" tone={tone} />
      ) : null}
      {exit ? <CloudVeil progress={exitP} mode="exit" tone={tone} /> : null}
    </div>
  );
}
