"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { NatGeoCloudDissolve } from "@/components/experiences/NatGeoCloudDissolve";
import { easeCloudReveal } from "@/components/experiences/ExperiencesCloudReveal";
import styles from "./experiences-journey.module.css";

gsap.registerPlugin(ScrollTrigger);

const CLOUD_REVEAL_VH = 0.85;

type Props = {
  /** Pinned horizontal section element. */
  sectionRef: RefObject<HTMLElement | null>;
};

/**
 * Same white NatGeo FBM dissolve used into Story — for any pinned
 * horizontal scroll section. Scrubs both directions:
 *   progress 0 = covered, 1 = clear.
 */
export function HorizontalCloudReveal({ sectionRef }: Props) {
  const [progress, setProgress] = useState(0);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }

    let raf = 0;
    let pending = -1;
    const flush = () => {
      raf = 0;
      if (pending < 0) return;
      const next = pending;
      pending = -1;
      setProgress(next);
    };

    const proxy = { p: 0 };
    const tween = gsap.to(proxy, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * CLOUD_REVEAL_VH)}`,
        scrub: 0.4,
        invalidateOnRefresh: true,
      },
      onUpdate: () => {
        pending = easeCloudReveal(proxy.p);
        if (!raf) raf = window.requestAnimationFrame(flush);
      },
    });

    setProgress(easeCloudReveal(proxy.p));

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [sectionRef]);

  const hidden = progress >= 0.995;

  return (
    <div
      className={styles.cloudRevealHandoff}
      aria-hidden="true"
      style={{
        visibility: hidden ? "hidden" : "visible",
        opacity: hidden ? 0 : 1,
        background: "#ffffff",
        pointerEvents: "none",
      }}
    >
      <NatGeoCloudDissolve progress={progress} />
    </div>
  );
}

export { CLOUD_REVEAL_VH };
