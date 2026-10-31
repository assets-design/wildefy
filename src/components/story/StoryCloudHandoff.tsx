"use client";

/**
 * Story → Conservation cloud handoff — same dual clouds-section.png grammar
 * as ExperiencesCloudHandoff. Soft density only (no colour plate) so the
 * shared GalleryAwardsBand meadow keeps scrolling through PNG gaps.
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
  STORY_EXIT_HANDOFF_VH,
  STORY_MIST_START_FRAC,
  STORY_PAN_SCALE,
  STORY_SEAM_CLEAR_VH,
} from "@/components/story/storySeamConstants";
import styles from "./storyCloudHandoff.module.css";

gsap.registerPlugin(ScrollTrigger);

type Props = { children: ReactNode };

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function storyPanRunPx() {
  const section = document.querySelector<HTMLElement>("#our-story");
  const panel = section?.querySelector<HTMLElement>(".sx-panel");
  const viewport = section?.querySelector<HTMLElement>(".sx-viewport");
  if (!panel || !viewport) return Math.round(window.innerHeight * 4);
  const travel = Math.max(
    0,
    panel.offsetWidth - (viewport.clientWidth || window.innerWidth),
  );
  return Math.max(1, Math.round(travel * STORY_PAN_SCALE));
}

function storyHandoffPx() {
  return Math.round(window.innerHeight * (STORY_EXIT_HANDOFF_VH / 100));
}

function storyTotalRunPx() {
  return storyPanRunPx() + storyHandoffPx();
}

function easeInOut(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export function StoryCloudHandoff({ children }: Props) {
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

    const story = document.querySelector<HTMLElement>("#our-story");
    if (!story) return;

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

    /*
      Soft-hide Conservation content only — never touch
      [data-shared-section-bg]; meadow parallax keeps running underneath.
    */
    const hideNext = () => gsap.set(wrap, { autoAlpha: 0.2 });
    const showNext = () => gsap.set(wrap, { autoAlpha: 1 });
    const NEXT_REVEAL_FROM = 0.35;
    const syncNextVisibility = (clearProgress: number) => {
      if (clearProgress <= NEXT_REVEAL_FROM) {
        hideNext();
        return;
      }
      const t =
        (clearProgress - NEXT_REVEAL_FROM) /
        Math.max(0.001, 1 - NEXT_REVEAL_FROM);
      gsap.set(wrap, { autoAlpha: 0.2 + 0.8 * Math.min(1, Math.max(0, t)) });
    };

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

    const fullCover = () => {
      hideNext();
      setCloud({
        autoAlpha: 1,
        x: distances.cloudDriftX * 0.55,
        y: distances.cloudYHigh,
        scale: distances.cloudScaleHigh,
      });
    };

    const ctx = gsap.context(() => {
      hideNext();
      parkBelow();

      const rise = { t: 0 };
      gsap.to(rise, {
        t: 1,
        ease: "none",
        scrollTrigger: {
          id: "story-cons-cloud-rise",
          trigger: story,
          start: () => {
            const pan = storyPanRunPx();
            const px = Math.round(pan * STORY_MIST_START_FRAC);
            return `top+=${px} top`;
          },
          end: () => `top+=${storyTotalRunPx()} top`,
          scrub: 0.45,
          invalidateOnRefresh: true,
          refreshPriority: -2,
          onRefreshInit: updateDistances,
          onUpdate: (self) => {
            hideNext();
            const raw = self.progress;
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
              x:
                distances.cloudDriftX * 0.25 +
                distances.cloudDriftX * 0.3 * u,
              y:
                distances.cloudYMid +
                (distances.cloudYHigh - distances.cloudYMid) * u,
              scale: 1.08 + (distances.cloudScaleHigh - 1.08) * u,
            });
          },
          onLeave: fullCover,
          onLeaveBack: () => {
            hideNext();
            parkBelow();
          },
        },
      });

      /* Clear as Conservation parks — meadow plate keeps its own ST scrub */
      const clear = { t: 0 };
      gsap.to(clear, {
        t: 1,
        ease: "none",
        scrollTrigger: {
          id: "story-cons-cloud-clear",
          trigger: wrap,
          start: "top top",
          end: () =>
            `+=${Math.round(window.innerHeight * STORY_SEAM_CLEAR_VH)}`,
          scrub: 0.4,
          invalidateOnRefresh: true,
          refreshPriority: -3,
          onEnter: fullCover,
          onEnterBack: fullCover,
          onLeaveBack: fullCover,
          onUpdate: (self) => {
            const u = easeInOut(self.progress);
            const fade = 1 - u * u;
            setCloud({
              autoAlpha: fade,
              x: distances.cloudDriftX * (0.55 - 0.2 * u),
              y: distances.cloudYHigh - window.innerHeight * 0.1 * u,
              scale: distances.cloudScaleHigh - 0.2 * u,
            });
            syncNextVisibility(u);
          },
          onLeave: () => {
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
