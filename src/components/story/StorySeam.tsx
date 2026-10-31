"use client";

/**
 * StorySeam — close mist near the end of §4 (Our Story), then reveal §5.
 *
 * Sequence: Story pan finishes → mist closes over pinned Story (Conservation
 * still below) → Conservation parks under full mist → scrub-clear reveals §5
 * (Conservation keeps its own pin — no nested pin).
 *
 * Same grammar as HomeSeam (§2→§3): NatGeo dissolve + layered cloud banks,
 * body-portaled veil so GSAP pin transforms cannot trap fixed mist.
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
  ExperiencesCloudReveal,
  easeCloudReveal,
} from "@/components/experiences/ExperiencesCloudReveal";
import { NatGeoCloudDissolve } from "@/components/experiences/NatGeoCloudDissolve";
import {
  STORY_EXIT_HANDOFF_VH,
  STORY_MIST_START_FRAC,
  STORY_PAN_SCALE,
  STORY_SEAM_CLEAR_VH,
} from "@/components/story/storySeamConstants";
import styles from "@/components/experiences/experiences-journey.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Front-load close so mist fills quickly within the short handoff. */
const CLOSE_FRAC = 0.22;

type Props = { children: ReactNode };

function storyPanRunPx() {
  const section = document.querySelector<HTMLElement>("#our-story");
  const panel = section?.querySelector<HTMLElement>(".sx-panel");
  const viewport = section?.querySelector<HTMLElement>(".sx-viewport");
  if (!panel || !viewport) return Math.round(window.innerHeight * 4);
  const travel = Math.max(0, panel.offsetWidth - (viewport.clientWidth || window.innerWidth));
  return Math.max(1, Math.round(travel * STORY_PAN_SCALE));
}

function storyHandoffPx() {
  return Math.round(window.innerHeight * (STORY_EXIT_HANDOFF_VH / 100));
}

function storyTotalRunPx() {
  return storyPanRunPx() + storyHandoffPx();
}

export function StorySeam({ children }: Props) {
  const seamRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [cover, setCover] = useState(0);
  const [seamActive, setSeamActive] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useLayoutEffect(() => {
    const seam = seamRef.current;
    const pin = pinRef.current;
    if (!seam || !pin) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCover(0);
      setSeamActive(false);
      setRevealed(true);
      return;
    }

    const story = document.querySelector<HTMLElement>("#our-story");
    if (!story) return;

    /* Desktop Story pin only — mobile has no horizontal pin handoff. */
    const desktop = window.matchMedia("(min-width: 1024px)");
    if (!desktop.matches) {
      setCover(0);
      setSeamActive(false);
      setRevealed(true);
      return;
    }

    let raf = 0;
    let pending = -1;

    const flush = () => {
      raf = 0;
      if (pending < 0) return;
      const c = pending;
      pending = -1;
      setCover(c);
    };

    const queueCover = (c: number) => {
      pending = Math.min(1, Math.max(0, c));
      if (!raf) raf = window.requestAnimationFrame(flush);
    };

    const ctx = gsap.context(() => {
      const build = { c: 0 };
      const clear = { c: 0 };

      /* Phase A — close over pinned Story as pan ends / exit handoff runs. */
      gsap.to(build, {
        c: 1,
        ease: "none",
        scrollTrigger: {
          id: "story-seam-close",
          trigger: story,
          start: () => {
            const pan = storyPanRunPx();
            const px = Math.round(pan * STORY_MIST_START_FRAC);
            return `top+=${px} top`;
          },
          end: () => `top+=${storyTotalRunPx()} top`,
          scrub: 0.12,
          invalidateOnRefresh: true,
          refreshPriority: -2,
          onEnter: () => {
            setSeamActive(true);
            setRevealed(false);
            queueCover(0.22);
          },
          onEnterBack: () => {
            setSeamActive(true);
            setRevealed(false);
            queueCover(0.22);
          },
          onLeaveBack: () => {
            setSeamActive(false);
            setRevealed(false);
            queueCover(0);
          },
          onUpdate: (self) => {
            setSeamActive(true);
            setRevealed(false);
            const t = self.progress;
            if (t <= CLOSE_FRAC) {
              const u = t / CLOSE_FRAC;
              queueCover(Math.max(0.22, 1 - (1 - u) * (1 - u)));
            } else {
              queueCover(1);
            }
          },
          onLeave: () => {
            setSeamActive(true);
            queueCover(1);
          },
        },
      });

      /*
       * Phase B — clear mist as Conservation arrives.
       * No second pin: Conservation owns conservation-pin; nesting would fight.
       * Scrub clear across the first CLEAR_VH of §5’s own pin runway.
       */
      gsap.to(clear, {
        c: 1,
        ease: "none",
        scrollTrigger: {
          id: "story-seam-reveal",
          trigger: pin,
          start: "top top",
          end: () =>
            `+=${Math.round(window.innerHeight * STORY_SEAM_CLEAR_VH)}`,
          scrub: 0.1,
          invalidateOnRefresh: true,
          refreshPriority: -3,
          onEnter: () => {
            setSeamActive(true);
            setRevealed(false);
            queueCover(1);
          },
          onEnterBack: () => {
            setSeamActive(true);
            setRevealed(false);
          },
          onUpdate: (self) => {
            const t = self.progress;
            if (t >= 0.995) {
              queueCover(0);
              setRevealed(true);
              setSeamActive(false);
              return;
            }
            setSeamActive(true);
            /* Brief dense hold, then clear most of the short runway */
            const mistHold = 0.03;
            const clearEnd = 0.92;
            let coverNow: number;
            if (t <= mistHold) {
              coverNow = 1;
            } else if (t < clearEnd) {
              const clearT = (t - mistHold) / (clearEnd - mistHold);
              coverNow = 1 - easeCloudReveal(clearT);
            } else {
              coverNow = 0;
            }
            queueCover(coverNow);
            setRevealed(coverNow <= 0.03);
          },
          onLeave: () => {
            queueCover(0);
            setRevealed(true);
            setSeamActive(false);
          },
          onLeaveBack: () => {
            setRevealed(false);
            setSeamActive(true);
            queueCover(1);
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

  const cloudProgress = 1 - cover;
  const showCloud = seamActive && cover > 0.001;
  const dense = cover >= 0.85;

  /* Soft plate leans forest so dissolve holes land on Conservation green */
  const softFillStyle = {
    opacity: dense ? 1 : Math.min(1, cover * 1.15),
    backgroundColor: `color-mix(in srgb, #5a7a62 ${Math.round(cover * 55)}%, #e8efe9)`,
  };

  const mistOverlay =
    showCloud && typeof document !== "undefined"
      ? createPortal(
          <div className={styles.cloudHandoffFixed} aria-hidden="true">
            <div className={styles.handoffSoftFill} style={softFillStyle} />
            <NatGeoCloudDissolve progress={cloudProgress} />
            <ExperiencesCloudReveal
              progress={cloudProgress}
              mode="enter"
              variant="handoff"
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
