"use client";

/**
 * /v2 only — §4→§5: your cloud covers the join, then scrolls up to reveal Conservation.
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
import { easeCloudReveal } from "@/components/experiences/ExperiencesCloudReveal";
import {
  STORY_EXIT_HANDOFF_VH,
  STORY_MIST_START_FRAC,
  STORY_PAN_SCALE,
  STORY_SEAM_CLEAR_VH,
} from "@/components/story/storySeamConstants";
import { V2CloudVeil } from "@/components/v2/V2CloudVeil";
import styles from "@/components/v2/v2-cloud-seam.module.css";

gsap.registerPlugin(ScrollTrigger);

const CLOSE_FRAC = 0.4;
const CLEAR_VH = Math.max(STORY_SEAM_CLEAR_VH, 0.55);

type Props = { children: ReactNode };

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

export function V2StorySeam({ children }: Props) {
  const seamRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [cover, setCover] = useState(0);
  const [lift, setLift] = useState(0);
  const [seamActive, setSeamActive] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [lifting, setLifting] = useState(false);

  useLayoutEffect(() => {
    const seam = seamRef.current;
    const pin = pinRef.current;
    if (!seam || !pin) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCover(0);
      setLift(1);
      setSeamActive(false);
      setRevealed(true);
      return;
    }

    const story = document.querySelector<HTMLElement>("#our-story");
    if (!story) return;

    const desktop = window.matchMedia("(min-width: 1024px)");
    if (!desktop.matches) {
      setCover(0);
      setLift(1);
      setSeamActive(false);
      setRevealed(true);
      return;
    }

    let raf = 0;
    let pendingCover = -1;
    let pendingLift = -1;

    const flush = () => {
      raf = 0;
      if (pendingCover >= 0) {
        setCover(pendingCover);
        pendingCover = -1;
      }
      if (pendingLift >= 0) {
        setLift(pendingLift);
        pendingLift = -1;
      }
    };

    const queue = (c: number, l: number) => {
      pendingCover = Math.min(1, Math.max(0, c));
      pendingLift = Math.min(1, Math.max(0, l));
      if (!raf) raf = window.requestAnimationFrame(flush);
    };

    const ctx = gsap.context(() => {
      const build = { c: 0 };
      const clear = { c: 0 };

      gsap.to(build, {
        c: 1,
        ease: "none",
        scrollTrigger: {
          id: "v2-cloud-story-close",
          trigger: story,
          start: () => {
            const pan = storyPanRunPx();
            return `top+=${Math.round(pan * STORY_MIST_START_FRAC)} top`;
          },
          end: () => `top+=${storyTotalRunPx()} top`,
          scrub: 0.12,
          invalidateOnRefresh: true,
          refreshPriority: -2,
          onEnter: () => {
            setSeamActive(true);
            setRevealed(false);
            setLifting(false);
            queue(0.25, 0);
          },
          onEnterBack: () => {
            setSeamActive(true);
            setRevealed(false);
            setLifting(false);
            queue(0.25, 0);
          },
          onLeaveBack: () => {
            setSeamActive(false);
            setRevealed(false);
            setLifting(false);
            queue(0, 0);
          },
          onUpdate: (self) => {
            setSeamActive(true);
            setRevealed(false);
            setLifting(false);
            const t = self.progress;
            if (t <= CLOSE_FRAC) {
              const u = t / CLOSE_FRAC;
              queue(Math.max(0.2, 1 - (1 - u) * (1 - u)), 0);
            } else {
              queue(1, 0);
            }
          },
          onLeave: () => {
            setSeamActive(true);
            setLifting(false);
            queue(1, 0);
          },
        },
      });

      gsap.to(clear, {
        c: 1,
        ease: "none",
        scrollTrigger: {
          id: "v2-cloud-story-lift",
          trigger: pin,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * CLEAR_VH)}`,
          scrub: 0.12,
          invalidateOnRefresh: true,
          refreshPriority: -3,
          onEnter: () => {
            setSeamActive(true);
            setRevealed(false);
            setLifting(true);
            queue(1, 0);
          },
          onEnterBack: () => {
            setSeamActive(true);
            setRevealed(false);
            setLifting(true);
          },
          onUpdate: (self) => {
            const t = self.progress;
            if (t >= 0.995) {
              queue(0, 1);
              setRevealed(true);
              setSeamActive(false);
              setLifting(false);
              return;
            }
            setSeamActive(true);
            setLifting(true);
            const hold = 0.05;
            const end = 0.9;
            let l = 0;
            if (t <= hold) l = 0;
            else if (t < end) l = easeCloudReveal((t - hold) / (end - hold));
            else l = 1;
            queue(1 - l, l);
            setRevealed(l >= 0.97);
          },
          onLeave: () => {
            queue(0, 1);
            setRevealed(true);
            setSeamActive(false);
            setLifting(false);
          },
          onLeaveBack: () => {
            setRevealed(false);
            setSeamActive(true);
            setLifting(false);
            queue(1, 0);
          },
        },
      });
    }, seam);

    const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 220);

    return () => {
      window.clearTimeout(refreshId);
      if (raf) window.cancelAnimationFrame(raf);
      ctx.revert();
    };
  }, []);

  const showVeil = seamActive && (cover > 0.01 || (lifting && lift < 0.995));
  const veilEnter = lifting ? 1 : cover;
  const veilProgress = lifting ? lift : 0;

  const mistOverlay =
    showVeil && typeof document !== "undefined"
      ? createPortal(
          <div className={styles.fixed} aria-hidden="true">
            <V2CloudVeil
              progress={veilProgress}
              enter={veilEnter}
              tone="forest"
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={seamRef}
      className={[
        styles.storySeam,
        seamActive ? styles.storySeamActive : "",
        revealed ? styles.storySeamRevealed : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div ref={pinRef} className={styles.storySeamPin}>
        <div className={styles.storySeamContent}>{children}</div>
      </div>
      {mistOverlay}
    </div>
  );
}
