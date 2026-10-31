"use client";

/**
 * Experiences → Gallery cloud handoff.
 *
 * Mist starts when §3 (Gallery) enters the viewport, peaks mid-travel,
 * and fully clears when §3 hits the top.
 */

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  EXPERIENCES_CLEAR_VH,
  EXPERIENCES_RISE_VH,
} from "@/components/experiences/experiencesSeamConstants";
import styles from "@/components/story/storyCloudHandoff.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Rise share of the §3 fold→top travel (rest is clear). */
const RISE_FRAC =
  EXPERIENCES_RISE_VH / Math.max(1, EXPERIENCES_RISE_VH + EXPERIENCES_CLEAR_VH);

type Props = { children: ReactNode };

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ExperiencesCloudHandoff({ children }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cloudRef = useRef<HTMLImageElement>(null);
  const cloudAltRef = useRef<HTMLImageElement>(null);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;
    const wrap = wrapRef.current;
    const cloud = cloudRef.current;
    const cloudAlt = cloudAltRef.current;
    if (!wrap || !cloud || !cloudAlt) return;

    if (prefersReducedMotion()) {
      gsap.set([cloud, cloudAlt], { autoAlpha: 0 });
      gsap.set(wrap, { autoAlpha: 1 });
      return;
    }

    const desktop = window.matchMedia("(min-width: 1024px)");
    if (!desktop.matches) {
      gsap.set([cloud, cloudAlt], { autoAlpha: 0 });
      gsap.set(wrap, { autoAlpha: 1 });
      return;
    }

    const distances = {
      cloudYStart: 0,
      cloudYMid: 0,
      cloudYHigh: 0,
      cloudScaleHigh: 1.55,
      cloudDriftX: 0,
    };

    const updateDistances = () => {
      const visible = window.innerHeight;
      distances.cloudYStart = visible;
      distances.cloudYMid = visible * 0.22;
      distances.cloudYHigh = -visible * 0.72;
      distances.cloudScaleHigh = 1.55;
      distances.cloudDriftX = visible * 0.03;
    };

    updateDistances();

    const showNext = () => gsap.set(wrap, { autoAlpha: 1 });

    const parkBelow = () => {
      gsap.set([cloud, cloudAlt], {
        autoAlpha: 0,
        xPercent: -50,
        x: 0,
        y: distances.cloudYStart,
        scale: 1,
        transformOrigin: "50% 45%",
        force3D: true,
        immediateRender: true,
      });
    };

    /** Cap density so sticky §2 / Gallery stay visible through cloud gaps. */
    const CLOUD_MAX = 0.78;
    const CLOUD_ALT_MAX = 0.52;

    const setCloud = (props: {
      autoAlpha: number;
      x: number;
      y: number;
      scale: number;
    }) => {
      const a = Math.min(1, Math.max(0, props.autoAlpha));
      gsap.set(cloud, {
        autoAlpha: a * CLOUD_MAX,
        xPercent: -50,
        x: props.x,
        y: props.y,
        scale: props.scale,
        transformOrigin: "50% 45%",
        force3D: true,
      });
      gsap.set(cloudAlt, {
        autoAlpha: a * CLOUD_ALT_MAX,
        xPercent: -50,
        x: props.x * 0.65,
        y: props.y + window.innerHeight * 0.05,
        scale: props.scale * 1.08,
        transformOrigin: "50% 45%",
        force3D: true,
      });
    };

    const finishClear = () => {
      parkBelow();
      showNext();
    };

    const applyRise = (raw: number) => {
      const t = raw * raw * (3 - 2 * raw);
      if (t <= 0.32) {
        const u = t / 0.32;
        setCloud({
          autoAlpha: Math.min(1, u * 1.35),
          x: distances.cloudDriftX * 0.25 * u,
          y:
            distances.cloudYStart +
            (distances.cloudYMid - distances.cloudYStart) * u,
          scale: 1 + 0.08 * u,
        });
        return;
      }
      const u = (t - 0.32) / 0.68;
      setCloud({
        autoAlpha: 1,
        x: distances.cloudDriftX * 0.25 + distances.cloudDriftX * 0.3 * u,
        y:
          distances.cloudYMid +
          (distances.cloudYHigh - distances.cloudYMid) * u,
        scale: 1.08 + (distances.cloudScaleHigh - 1.08) * u,
      });
    };

    const applyClear = (raw: number) => {
      const ease = raw * raw * (3 - 2 * raw);
      const fade = 1 - ease;
      setCloud({
        autoAlpha: fade,
        x: distances.cloudDriftX * (0.55 - 0.35 * ease),
        y: distances.cloudYHigh - window.innerHeight * 0.55 * ease,
        scale: distances.cloudScaleHigh - 0.35 * ease,
      });
    };

    const ctx = gsap.context(() => {
      showNext();
      parkBelow();

      const handoff = { t: 0 };
      gsap.to(handoff, {
        t: 1,
        ease: "none",
        scrollTrigger: {
          id: "exp-gallery-cloud-handoff",
          trigger: wrap,
          /* Mist in as §3 enters; mist out as §3 parks at top */
          start: "top bottom",
          end: "top top",
          scrub: 0.4,
          invalidateOnRefresh: true,
          refreshPriority: -2,
          onRefreshInit: updateDistances,
          onRefresh: (self) => {
            if (self.progress >= 1 || wrap.getBoundingClientRect().top <= 1) {
              finishClear();
            } else if (self.progress <= 0) {
              parkBelow();
              showNext();
            }
          },
          onUpdate: (self) => {
            showNext();
            const p = self.progress;
            if (p >= 1 || wrap.getBoundingClientRect().top <= 1) {
              finishClear();
              return;
            }
            if (p <= 0) {
              parkBelow();
              return;
            }
            if (p < RISE_FRAC) {
              applyRise(p / Math.max(0.001, RISE_FRAC));
              return;
            }
            applyClear((p - RISE_FRAC) / Math.max(0.001, 1 - RISE_FRAC));
          },
          onLeave: finishClear,
          onLeaveBack: () => {
            parkBelow();
            showNext();
          },
        },
      });
    }, wrap);

    const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 220);

    return () => {
      window.clearTimeout(refreshId);
      ctx.revert();
      gsap.set(wrap, { clearProps: "opacity,visibility" });
    };
  }, [mounted]);

  return (
    <div ref={wrapRef} className={styles.wrap}>
      {children}
      {mounted
        ? createPortal(
            <div className={styles.veil} aria-hidden="true">
              <img
                ref={cloudRef}
                className={`${styles.cloud} ${styles.cloudSoft}`}
                src="/images/clouds-section.png"
                alt=""
                width={1600}
                height={2600}
                draggable={false}
                decoding="async"
              />
              <img
                ref={cloudAltRef}
                className={`${styles.cloud} ${styles.cloudAltSoft}`}
                src="/images/clouds-section.png"
                alt=""
                width={1600}
                height={2600}
                draggable={false}
                decoding="async"
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
