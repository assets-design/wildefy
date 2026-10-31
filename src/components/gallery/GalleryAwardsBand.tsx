"use client";

/**
 * Single sticky plate behind Gallery → Story → Conservation → Awards.
 *
 * Each section drives its own H/V motion (not diluted across the tall band):
 *   Gallery     → rise + slight X
 *   Story       → shift RIGHT (also written from StoryScroll via parallaxX)
 *   Conservation→ continue X + deepen Y into meadow
 *   Awards      → keep drifting while the awards pin runs
 * Section→section handoffs keep scrubbing so the plate never freezes.
 */

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  STORY_EXIT_HANDOFF_VH,
  STORY_MIST_START_FRAC,
  STORY_PAN_SCALE,
  STORY_SEAM_CLEAR_VH,
} from "@/components/story/storySeamConstants";
import styles from "./galleryAwardsBand.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Optimized from public/images/plate.png (32768×26624 → web size). */
const SHARED_PLATE = "/images/gallery-awards/shared-plate.png";

/** Gallery: vertical rise only — no horizontal drift. */
const GALLERY_Y_VH = 0.1;
const GALLERY_X_VW = 0;
const STORY_X_VW = 0.12;
/**
 * Conservation: sky-only vertical rise + left X (meadow stays below fold).
 */
const CONS_Y_VH = 0.16;
const CONS_X_VW = 0.16;
/**
 * Extra plate travel across the Cons→Awards gap.
 */
const HANDOFF_Y_VH = 0.1;
const HANDOFF_X_VW = 0.08;
/**
 * Awards pulls the plate’s bottom greenery into the fold (plate meadow
 * starts ~91% down the asset — needs deep Y on the tall crop).
 */
const AWARDS_Y_VH = 2.35;
const AWARDS_X_VW = 0.12;
/** Mist — horizontal only. */
const MIST_ENTER_Y_VH = 0;
const MIST_ENTER_X_VW = 0.02;
const MIST_CLEAR_Y_VH = 0;
const MIST_CLEAR_X_VW = 0.02;
/** Awards X through certs→giraffe. */
const AWARDS_X_FRAC = 0.42;
/** Meadow Y begins as soon as Awards pins. */
const AWARDS_Y_START_FRAC = 0.02;
/** Finish meadow rise through vertical into tiger. */
const AWARDS_Y_END_FRAC = 0.95;
/**
 * Crop top:-25% height:400% → safe up ≈ 2.65vh; seats meadow in Awards.
 */
const MAX_PLATE_UP_VH = 2.65;
/**
 * Shared with AwardsScroll clamp — mismatched 0.32 vs 0.28 caused the
 * Cons→Awards left snap when awards pin engaged.
 */
const MAX_PLATE_X_VW = 0.32;

type Props = { children: ReactNode };

type PlateState = {
  galleryX: number;
  galleryY: number;
  storyX: number;
  consX: number;
  consY: number;
  handoffX: number;
  handoffY: number;
  mistEnterX: number;
  mistEnterY: number;
  mistClearX: number;
  mistClearY: number;
  awardsX: number;
  awardsY: number;
};

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

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function pinEndSpacer(pinId: string, fallbackVh: number) {
  const st = ScrollTrigger.getById(pinId);
  if (st && st.end > st.start) return `+=${Math.round(st.end - st.start)}`;
  return `+=${Math.round(window.innerHeight * fallbackVh)}`;
}

function composePlate(state: PlateState, bg: HTMLElement) {
  /*
    StoryScroll / AwardsScroll may also write dataset.parallaxX.
    Prefer the stronger live value when present; otherwise use section state.
  */
  const externalX = Number(bg.dataset.parallaxX || 0);
  const sectionX =
    state.galleryX +
    state.storyX +
    state.consX +
    state.handoffX +
    state.mistEnterX +
    state.mistClearX +
    state.awardsX;
  const maxX = window.innerWidth * MAX_PLATE_X_VW;
  const rawX = sectionX + externalX;
  let x = Math.max(-maxX, Math.min(maxX, rawX));
  const rawY =
    state.galleryY +
    state.consY +
    state.handoffY +
    state.mistEnterY +
    state.mistClearY +
    state.awardsY;
  const yMin = -window.innerHeight * MAX_PLATE_UP_VH;
  let y = Math.max(yMin, rawY);
  /*
    AwardsScroll freezes the full plate pose for the tiger segment —
    honor both axes so band scrub/refresh cannot shove the meadow.
  */
  const lockedX = Number(bg.dataset.meadowXLock);
  const lockedY = Number(bg.dataset.meadowYLock);
  if (Number.isFinite(lockedX) && bg.dataset.meadowXLock != null) x = lockedX;
  if (Number.isFinite(lockedY) && bg.dataset.meadowYLock != null) y = lockedY;

  bg.dataset.meadowY = String(y);
  bg.dataset.bandX = String(sectionX);
  gsap.set(bg, { x, y, force3D: true });
}

export function GalleryAwardsBand({ children }: Props) {
  const bandRef = useRef<HTMLDivElement>(null);
  const bgImgRef = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    const band = bandRef.current;
    const bg = bgImgRef.current;
    if (!band || !bg) return;

    if (prefersReducedMotion()) {
      gsap.set(bg, { x: 0, y: 0 });
      return;
    }

    const state: PlateState = {
      galleryX: 0,
      galleryY: 0,
      storyX: 0,
      consX: 0,
      consY: 0,
      handoffX: 0,
      handoffY: 0,
      mistEnterX: 0,
      mistEnterY: 0,
      mistClearX: 0,
      mistClearY: 0,
      awardsX: 0,
      awardsY: 0,
    };

    const paint = () => composePlate(state, bg);

    const ctx = gsap.context(() => {
      const gallery = document.querySelector<HTMLElement>("#gallery");
      const storyViewport =
        document.querySelector<HTMLElement>("#our-story .sx-viewport") ||
        document.querySelector<HTMLElement>("#our-story");
      const consPin = document.querySelector<HTMLElement>(
        "[data-conservation-pin]",
      );
      const awardsViewport = document.querySelector<HTMLElement>(
        "[data-awards-viewport]",
      );

      /* —— Gallery —— */
      if (gallery) {
        const syncGallery = (progress: number) => {
          const u = smoothstep(progress);
          state.galleryY = -window.innerHeight * GALLERY_Y_VH * u;
          state.galleryX = window.innerWidth * GALLERY_X_VW * u;
          paint();
        };
        ScrollTrigger.create({
          id: "shared-plate-gallery",
          trigger: gallery,
          start: "top top",
          end: "bottom top",
          scrub: 0.3,
          invalidateOnRefresh: true,
          refreshPriority: -5,
          onUpdate: (self) => syncGallery(self.progress),
          onRefresh: (self) => syncGallery(self.progress),
          onLeave: () => syncGallery(1),
          onLeaveBack: () => syncGallery(0),
        });
      }

      /* —— Story (matches story-pin length when available) —— */
      if (storyViewport) {
        const syncStory = (progress: number) => {
          const u = smoothstep(progress);
          /* Positive X = move plate to the RIGHT */
          state.storyX = window.innerWidth * STORY_X_VW * u;
          paint();
        };
        ScrollTrigger.create({
          id: "shared-plate-story",
          trigger: storyViewport,
          start: "top top",
          end: () => pinEndSpacer("story-pin", 4),
          scrub: 0.35,
          invalidateOnRefresh: true,
          refreshPriority: -5,
          onUpdate: (self) => syncStory(self.progress),
          onRefresh: (self) => syncStory(self.progress),
          onLeave: () => syncStory(1),
          onLeaveBack: () => syncStory(0),
        });
      }

      /* —— Conservation (matches conservation-pin) —— */
      if (consPin) {
        const syncCons = (progress: number) => {
          const u = smoothstep(progress);
          /* Vertical sky rise + leftward X while Cons slides scrub */
          state.consX = -window.innerWidth * CONS_X_VW * u;
          state.consY = -window.innerHeight * CONS_Y_VH * u;
          paint();
        };
        ScrollTrigger.create({
          id: "shared-plate-conservation",
          trigger: consPin,
          start: "top top",
          end: () => pinEndSpacer("conservation-pin", 3.8),
          scrub: 0.45,
          invalidateOnRefresh: true,
          refreshPriority: -5,
          onUpdate: (self) => syncCons(self.progress),
          onRefresh: (self) => syncCons(self.progress),
          onLeave: () => syncCons(1),
          onLeaveBack: () => syncCons(0),
        });
      }

      /*
        Awards — X + meadow Y follow pin progress both ways so scroll-back
        restores the plate (peak-lock previously froze reverse travel).
        While tiger pose-lock is set, skip writing Y.
      */
      if (awardsViewport) {
        const syncAwards = (progress: number) => {
          const xU = smoothstep(Math.min(1, progress / AWARDS_X_FRAC));
          state.awardsX = -window.innerWidth * AWARDS_X_VW * xU;
          if (bg.dataset.meadowYLock == null) {
            const ySpan = Math.max(
              0.0001,
              AWARDS_Y_END_FRAC - AWARDS_Y_START_FRAC,
            );
            const yRaw = (progress - AWARDS_Y_START_FRAC) / ySpan;
            const yU = smoothstep(Math.min(1, Math.max(0, yRaw)));
            state.awardsY = -window.innerHeight * AWARDS_Y_VH * yU;
          }
          paint();
        };
        ScrollTrigger.create({
          id: "shared-plate-awards",
          trigger: awardsViewport,
          start: "top top",
          end: () => pinEndSpacer("awards-pin", 8),
          scrub: 0.45,
          invalidateOnRefresh: true,
          refreshPriority: -5,
          onUpdate: (self) => syncAwards(self.progress),
          onRefresh: (self) => syncAwards(self.progress),
          onLeave: () => syncAwards(1),
          onLeaveBack: () => syncAwards(0),
        });
      }

      /*
        Story → Conservation handoff: keep plate easing while Cons rises
        into the fold (covers the “frozen between sections” gap).
      */
      if (storyViewport && consPin) {
        const syncStoryConsHandoff = (progress: number) => {
          /* Only while Cons is rising into view — once pinned, syncCons owns pose */
          const u = smoothstep(Math.min(1, progress));
          state.consX = -window.innerWidth * CONS_X_VW * 0.15 * u;
          state.consY = -window.innerHeight * CONS_Y_VH * 0.1 * u;
          paint();
        };
        ScrollTrigger.create({
          id: "shared-plate-story-cons-handoff",
          trigger: consPin,
          start: "top bottom",
          end: "top top",
          scrub: 0.4,
          invalidateOnRefresh: true,
          refreshPriority: -5,
          onUpdate: (self) => {
            if (self.progress >= 1) return;
            syncStoryConsHandoff(self.progress);
          },
          onRefresh: (self) => {
            if (self.progress >= 1) return;
            syncStoryConsHandoff(self.progress);
          },
          onLeaveBack: () => syncStoryConsHandoff(0),
        });
      }

      /*
        Mist enter (rise) — same runway as story-cons-cloud-rise so the
        meadow plate drifts while the veil closes over Story.
      */
      const story = document.querySelector<HTMLElement>("#our-story");
      if (story) {
        const syncMistEnter = (progress: number) => {
          const u = smoothstep(progress);
          state.mistEnterX = window.innerWidth * MIST_ENTER_X_VW * u;
          state.mistEnterY = -window.innerHeight * MIST_ENTER_Y_VH * u;
          paint();
        };
        ScrollTrigger.create({
          id: "shared-plate-mist-enter",
          trigger: story,
          start: () => {
            const px = Math.round(storyPanRunPx() * STORY_MIST_START_FRAC);
            return `top+=${px} top`;
          },
          end: () =>
            `top+=${storyPanRunPx() + storyHandoffPx()} top`,
          scrub: 0.45,
          invalidateOnRefresh: true,
          refreshPriority: -5,
          onUpdate: (self) => syncMistEnter(self.progress),
          onRefresh: (self) => syncMistEnter(self.progress),
          onLeave: () => syncMistEnter(1),
          onLeaveBack: () => syncMistEnter(0),
        });
      }

      /*
        Mist clear window — same start/end/scrub as story-cons-cloud-clear
        so the meadow plate travels with the veil.
      */
      if (consPin) {
        const syncMistClear = (progress: number) => {
          const u = smoothstep(progress);
          state.mistClearX = window.innerWidth * MIST_CLEAR_X_VW * u;
          state.mistClearY = -window.innerHeight * MIST_CLEAR_Y_VH * u;
          paint();
        };
        ScrollTrigger.create({
          id: "shared-plate-mist-clear",
          trigger: consPin,
          start: "top top",
          end: () =>
            `+=${Math.round(window.innerHeight * STORY_SEAM_CLEAR_VH)}`,
          scrub: 0.4,
          invalidateOnRefresh: true,
          refreshPriority: -5,
          onUpdate: (self) => syncMistClear(self.progress),
          onRefresh: (self) => syncMistClear(self.progress),
          onLeave: () => syncMistClear(1),
          onLeaveBack: () => syncMistClear(0),
        });
      }

      /*
        Cons → Awards gap — keep the plate moving (was frozen at cons end).
        Once Awards pins, syncAwards continues; handoff eases out.
      */
      if (consPin && awardsViewport) {
        const syncConsAwardsHandoff = (progress: number) => {
          if (bg.dataset.meadowYLock != null) return;
          const u = smoothstep(Math.min(1, Math.max(0, progress)));
          state.consX = -window.innerWidth * CONS_X_VW;
          state.consY = -window.innerHeight * CONS_Y_VH;
          state.handoffX = -window.innerWidth * HANDOFF_X_VW * u;
          state.handoffY = -window.innerHeight * HANDOFF_Y_VH * u;
          paint();
        };
        ScrollTrigger.create({
          id: "shared-plate-cons-awards-handoff",
          trigger: awardsViewport,
          start: "top bottom",
          end: "top top",
          scrub: 0.45,
          invalidateOnRefresh: true,
          refreshPriority: -5,
          onUpdate: (self) => syncConsAwardsHandoff(self.progress),
          onRefresh: (self) => syncConsAwardsHandoff(self.progress),
          onLeave: () => syncConsAwardsHandoff(1),
          onLeaveBack: () => {
            state.handoffX = 0;
            state.handoffY = 0;
            paint();
          },
        });
      }

      paint();
    }, band);

    /* Pins register after children mount — refresh once they’re up */
    const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    const refreshId2 = window.setTimeout(() => ScrollTrigger.refresh(), 900);

    return () => {
      window.clearTimeout(refreshId);
      window.clearTimeout(refreshId2);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={bandRef} className={styles.band} data-gallery-awards-band="">
      <div className={styles.bg} aria-hidden="true">
        <img
          ref={bgImgRef}
          className={styles.bgImg}
          data-shared-section-bg=""
          src={SHARED_PLATE}
          alt=""
          width={2800}
          height={2275}
          draggable={false}
          decoding="async"
        />
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
