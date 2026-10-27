"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { NatGeoCloudDissolve } from "@/components/experiences/NatGeoCloudDissolve";
import { easeCloudReveal } from "@/components/experiences/ExperiencesCloudReveal";
import styles from "./story-cloud.module.css";

gsap.registerPlugin(ScrollTrigger);

const MIST_SRC = "/images/clouds-mist.png";
const BANK_SRC = "/images/clouds-section.png";

/** Enter runway — matches Story pin reveal beat. */
export const STORY_CLOUD_ENTER_VH = 0.85;
/** Exit runway — close into Conservation. */
const STORY_CLOUD_EXIT_VH = 0.7;

type Props = {
  sectionRef: RefObject<HTMLElement | null>;
};

function CloudPlate({
  cover,
  mode,
  dissolveProgress,
}: {
  /** 0 = clear, 1 = full cloud cover */
  cover: number;
  mode: "enter" | "exit";
  /** NatGeo dissolve 0 covered → 1 clear (enter only). */
  dissolveProgress: number;
}) {
  const c = Math.min(1, Math.max(0, cover));
  const hidden = c <= 0.02;
  const opacity = Math.min(1, c * c * 1.08);
  const isExit = mode === "exit";
  const scale = isExit ? 1 + c * 0.14 : 1.14 - (1 - c) * 0.14;
  const lift = isExit ? c * 6 : (1 - c) * -5;

  return (
    <div
      className={`${styles.veil} ${isExit ? styles.veilExit : ""}`}
      style={{
        visibility: hidden ? "hidden" : "visible",
        opacity: hidden ? 0 : opacity,
        transform: `scale(${scale}) translate3d(0, ${lift}%, 0)`,
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
      {!isExit ? (
        <div className={styles.dissolve}>
          <NatGeoCloudDissolve progress={dissolveProgress} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Fresh cloudy open + close for homepage §4 (Our Story).
 * Enter: NatGeo FBM dissolve through fluffy mist banks.
 * Exit: soft cloud close toward Conservation.
 */
export function StoryCloudTransition({ sectionRef }: Props) {
  const [enterClear, setEnterClear] = useState(0);
  const [exitCover, setExitCover] = useState(0);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEnterClear(1);
      setExitCover(0);
      return;
    }

    let raf = 0;
    let enterPending = -1;
    let exitPending = -1;

    const flush = () => {
      raf = 0;
      if (enterPending >= 0) {
        setEnterClear(enterPending);
        enterPending = -1;
      }
      if (exitPending >= 0) {
        setExitCover(exitPending);
        exitPending = -1;
      }
    };

    const queue = (enter: number, exit: number) => {
      enterPending = enter;
      exitPending = exit;
      if (!raf) raf = window.requestAnimationFrame(flush);
    };

    const findPin = () =>
      ScrollTrigger.getAll().find(
        (st) => st.trigger === section && Boolean(st.vars.pin),
      );

    let gate: ScrollTrigger | null = null;
    let cancelled = false;
    let tries = 0;

    const apply = (progress: number, distance: number) => {
      const total = Math.max(1, distance);
      const scrolled = progress * total;
      const enterPx = Math.round(window.innerHeight * STORY_CLOUD_ENTER_VH);
      const exitPx = Math.round(window.innerHeight * STORY_CLOUD_EXIT_VH);

      const enter = easeCloudReveal(
        Math.min(1, scrolled / Math.max(1, enterPx)),
      );
      const exitStart = Math.max(0, total - exitPx);
      const exit = easeCloudReveal(
        Math.min(1, Math.max(0, (scrolled - exitStart) / Math.max(1, exitPx))),
      );
      queue(enter, exit);
    };

    const mount = () => {
      if (cancelled) return true;
      const pin = findPin();
      if (!pin && tries++ < 45) {
        requestAnimationFrame(mount);
        return false;
      }

      gate?.kill();
      gate = ScrollTrigger.create({
        id: "story-cloud-transition",
        trigger: section,
        start: () => findPin()?.start ?? "top top",
        end: () =>
          findPin()?.end ??
          `+=${Math.round(window.innerHeight * (STORY_CLOUD_ENTER_VH + 3))}`,
        scrub: 0.35,
        invalidateOnRefresh: true,
        onUpdate: (self) =>
          apply(self.progress, Math.max(1, self.end - self.start)),
        onRefresh: (self) =>
          apply(self.progress, Math.max(1, self.end - self.start)),
      });
      apply(gate.progress, Math.max(1, gate.end - gate.start));
      return true;
    };

    requestAnimationFrame(mount);

    return () => {
      cancelled = true;
      if (raf) window.cancelAnimationFrame(raf);
      gate?.kill();
    };
  }, [sectionRef]);

  const enterCover = 1 - enterClear;
  const show = enterCover > 0.02 || exitCover > 0.02;

  return (
    <div
      className={styles.host}
      aria-hidden="true"
      style={{
        visibility: show ? "visible" : "hidden",
        pointerEvents: "none",
      }}
    >
      <CloudPlate
        cover={enterCover}
        mode="enter"
        dissolveProgress={enterClear}
      />
      <CloudPlate cover={exitCover} mode="exit" dissolveProgress={1} />
    </div>
  );
}
