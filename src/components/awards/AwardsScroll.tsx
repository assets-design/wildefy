"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./awards.module.css";
import { SUSTAIN_SLIDES, SUSTAIN_SLIDE_COUNT } from "./sustainSlides";

gsap.registerPlugin(ScrollTrigger);

/**
 * Strip ends at the tiger’s right edge (hold 166.61 + peek/standby + tiger).
 * Shorter than Figma 6081/1920 so no empty gap flashes background.
 */
const STRIP_VIEWPORTS = 308.61 / 100;
/** Vertical scroll distance per step (5 steps across 6 unique slides). */
const VERTICAL_VH_PER_STEP = 0.95;
/** Slide seats only — after slide 06 settles, horizontal resumes (no extra vertical beat). */
const VERTICAL_STEPS = SUSTAIN_SLIDE_COUNT - 1;

/**
 * Horizontal layer parallax (same grammar as Story):
 * all layers start together; finish / hold one-after-one.
 * Vertical sustainability scroll stays 1:1 (layers frozen).
 */
const H_PHASE_BG = { start: 0, end: 1 };
/** Story depth: clouds sit between bg (10) and images (14) → 12/16. */
const H_PHASE_CLOUDS = { start: 0, end: 1 };
const H_PHASE_IMAGES = { start: 0, end: 0.68 };
const H_PHASE_CONTENT = { start: 0, end: 1 };
/** Extra relative travel vs the track (track still owns layout / hold). */
/** Soft plate drift — large values jerked Cons→Awards left on pin engage. */
const H_BG_EXTRA = 0.055;
/** Must match GalleryAwardsBand MAX_PLATE_X_VW (was 0.28 → clamp snap). */
const PLATE_MAX_X_VW = 0.32;
/**
 * Clouds drift ahead of the meadow plate (Story RATE_CLOUDS > RATE_BG) —
 * stronger than images so the fluffy layer clearly tracks with the strip.
 */
const H_CLOUDS_EXTRA = 0.28;
const H_IMAGES_EXTRA = 0.08;
const H_CONTENT_EXTRA = 0.04;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function phaseProgress(
  panT: number,
  phase: { start: number; end: number },
) {
  if (panT <= phase.start) return 0;
  if (panT >= phase.end) return 1;
  const u = (panT - phase.start) / Math.max(0.0001, phase.end - phase.start);
  return u * u * (3 - 2 * u);
}

/**
 * Horizontal Awards strip with a nested Sustainability vertical story.
 *
 * Scroll map (one pin):
 *   1) Horizontal 0 → giraffe / sustainability hold — layered parallax
 *   2) Vertical slides 1 → 6 (track held, layers frozen)
 *   3) Horizontal hold → tiger — layered parallax again (bg → images → content)
 */
export function AwardsScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const holdRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const panel = panelRef.current;
    const hold = holdRef.current;
    const stage = stageRef.current;
    if (
      !section ||
      !viewport ||
      !track ||
      !panel ||
      !hold ||
      !stage ||
      prefersReducedMotion()
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const images = Array.from(
          stage.querySelectorAll<HTMLElement>("[data-sustain-img]"),
        );
        const texts = Array.from(
          stage.querySelectorAll<HTMLElement>("[data-sustain-text]"),
        );

        const getViewW = () => viewport.clientWidth || window.innerWidth;
        /** Laid-out width only — scrollWidth inflates from overflow:visible orbit. */
        const getPanelW = () =>
          Math.max(panel.offsetWidth, getViewW() * STRIP_VIEWPORTS);
        /**
         * Max translate that keeps the panel’s right edge flush with the
         * viewport (prevents the light journey backdrop leaking on the right).
         */
        const getTravel = () =>
          Math.max(1, getPanelW() - getViewW());
        const getHoldX = () => Math.min(hold.offsetLeft, getTravel());
        const getVerticalPx = () =>
          Math.max(
            1,
            Math.round(
              window.innerHeight * VERTICAL_VH_PER_STEP * VERTICAL_STEPS,
            ),
          );
        const setTrackX = (x: number) => {
          const minX = Math.min(0, getViewW() - getPanelW());
          gsap.set(track, {
            x: clamp(x, minX, 0),
            force3D: true,
          });
        };

        /*
          Arc stroke tips still meet viewport top/bottom (100vh orbit).
          Preview seats are inset (~58°) so the full disc stays on-screen
          at the start/end of the white line; further scroll slides them off.
          Tip fade band matches #sustain-arc-fade (10% / 90%):
          top → fade out with the line; bottom → fade in with the line.
          Each slide index owns a unique center image (01→lion … 06→07.jpg).
        */
        const ARC_PREVIEW = Math.PI * 0.32;
        const ARC_EXIT = Math.PI * 0.52;
        const ARC_RADIUS = 0.5;
        /** Same band as the SVG stroke tip gradient. */
        const ARC_TIP_FADE = 0.1;

        /** 1 in the mid arc; 0 at top/bottom tips — mirrors the white line fade. */
        const arcTipFade = (angle: number) => {
          const y = 0.5 + 0.5 * Math.sin(angle);
          if (y < ARC_TIP_FADE) return clamp(y / ARC_TIP_FADE, 0, 1);
          if (y > 1 - ARC_TIP_FADE)
            return clamp((1 - y) / ARC_TIP_FADE, 0, 1);
          return 1;
        };

        const applyVertical = (t: number) => {
          const max = SUSTAIN_SLIDE_COUNT - 1;
          // t ∈ [0, 5] — one unique center image per slide; then horizontal
          const progress = clamp(t, 0, max);
          const textIndex = progress;
          const visualCenter = progress;

          images.forEach((img, i) => {
            const d = i - visualCenter;
            const ad = Math.abs(d);
            const sign = d < 0 ? -1 : d > 0 ? 1 : 0;

            let angle = 0;
            let scale = 0.55;
            let opacity = 0;
            let z = 1;

            if (ad <= 1.001) {
              // On the visible arc: top ↔ center ↔ bottom
              angle = d * ARC_PREVIEW;
              scale = 1 - 0.45 * ad;
              opacity = 1;
              z = ad < 0.35 ? 3 : 2;
            } else if (ad < 1.75) {
              // Exit top / enter bottom along the arc
              const u = clamp((ad - 1) / 0.75, 0, 1);
              angle = sign * (ARC_PREVIEW + (ARC_EXIT - ARC_PREVIEW) * u);
              scale = 0.55;
              opacity = 1;
              z = 1;
            }

            // Top tip: disappear with the line; bottom tip: appear with the line
            opacity *= arcTipFade(angle);

            const xPct = 50 + 100 * ARC_RADIUS * Math.cos(angle);
            const yPct = 50 + 100 * ARC_RADIUS * Math.sin(angle);

            img.style.left = `${xPct}%`;
            img.style.top = `${yPct}%`;
            img.style.transform = `translate3d(-50%, -50%, 0) scale(${scale})`;
            img.style.opacity = String(opacity);
            img.style.zIndex = String(z);
          });

          texts.forEach((el, i) => {
            // d = i - textIndex mirrors image seats: <0 above, >0 below.
            const d = i - textIndex;
            const ad = Math.abs(d);
            let y = 0;
            let opacity = 0;

            if (ad <= 0.02) {
              y = 0;
              opacity = 1;
            } else if (d < 0 && d > -1) {
              // Past slide — sit above (image exits to top)
              y = 56 * d;
              opacity = clamp(1 + d * 1.35, 0, 1);
            } else if (d > 0 && d < 1) {
              // Upcoming — sit below (image enters from bottom)
              y = 72 * d;
              opacity = clamp(1 - d * 1.35, 0, 1);
            } else if (d <= -1) {
              y = -72;
              opacity = 0;
            } else {
              y = 88;
              opacity = 0;
            }

            el.style.transform = `translate3d(0, calc(-50% + ${y}px), 0)`;
            el.style.opacity = String(opacity);
            el.setAttribute("aria-hidden", opacity < 0.4 ? "true" : "false");
          });
        };

        /**
         * Same Group_325 plate as Conservation (ConsAwardsBand) —
         * pan it on horizontal scrub; do not use a second background.
         */
        const sharedBg = document.querySelector<HTMLElement>(
          "[data-shared-section-bg]",
        );
        const sharedClouds = document.querySelector<HTMLElement>(
          "[data-shared-section-clouds]",
        );
        /** First horiz segment — never include tiger (keeps right edge flush). */
        const earlyImageEls = [
          panel.querySelector<HTMLElement>(`.${styles.cheetahs}`),
          panel.querySelector<HTMLElement>(`.${styles.giraffe}`),
        ].filter(Boolean) as HTMLElement[];
        /**
         * Tiger parallax moves the inner <img> only — the .tiger frame stays
         * right:0 so no green gutter opens on the viewport edge.
         */
        const tigerFrame = panel.querySelector<HTMLElement>(`.${styles.tiger}`);
        const tigerImg = tigerFrame?.querySelector<HTMLElement>("img") ?? null;
        const earlyContentEls = [
          ...Array.from(
            panel.querySelectorAll<HTMLElement>(`.${styles.laurel}`),
          ),
          panel.querySelector<HTMLElement>(`.${styles.headingGroup}`),
          ...Array.from(panel.querySelectorAll<HTMLElement>(`.${styles.cert}`)),
        ].filter(Boolean) as HTMLElement[];
        /**
         * Late segment copy — only the right card stack parallaxes.
         * sustainLeft stays pinned so “Sustainability…” never clips off-screen.
         */
        const lateContentEls = [
          panel.querySelector<HTMLElement>(`.${styles.sustainRight}`),
        ].filter(Boolean) as HTMLElement[];
        const sustainLeftEl = panel.querySelector<HTMLElement>(
          `.${styles.sustainLeft}`,
        );

        const layerBase = { bg: 0, clouds: 0, images: 0, content: 0 };

        /** Parallax x only — left/right laurels use dedicated l.png / r.png. */
        const setContentX = (els: HTMLElement[], x: number) => {
          els.forEach((el) => {
            gsap.set(el, { x, force3D: true });
          });
        };

        const meadowYOf = (el: HTMLElement | null) => {
          if (!el) return 0;
          const live = Number(gsap.getProperty(el, "y"));
          if (Number.isFinite(live)) return live;
          const fromData = Number(el.dataset.meadowY);
          return Number.isFinite(fromData) ? fromData : 0;
        };

        /** Capture plate pose at sustain — tiger segment must not rewrite it. */
        const lockMeadowPose = () => {
          if (!sharedBg) return;
          const x = Number(gsap.getProperty(sharedBg, "x"));
          const y = meadowYOf(sharedBg);
          sharedBg.dataset.meadowXLock = String(Number.isFinite(x) ? x : 0);
          sharedBg.dataset.meadowYLock = String(y);
          sharedBg.dataset.parallaxXLock = sharedBg.dataset.parallaxX || "0";
          if (sharedClouds) {
            const cx = Number(gsap.getProperty(sharedClouds, "x"));
            const cy = Number(gsap.getProperty(sharedClouds, "y"));
            sharedClouds.dataset.meadowXLock = String(
              Number.isFinite(cx) ? cx : 0,
            );
            sharedClouds.dataset.meadowYLock = String(
              Number.isFinite(cy) ? cy : y,
            );
            sharedClouds.dataset.parallaxXLock =
              sharedClouds.dataset.parallaxX || "0";
          }
        };

        const applyLockedMeadowPose = () => {
          if (!sharedBg?.dataset.meadowYLock) return false;
          const x = Number(sharedBg.dataset.meadowXLock);
          const y = Number(sharedBg.dataset.meadowYLock);
          sharedBg.dataset.parallaxX =
            sharedBg.dataset.parallaxXLock || sharedBg.dataset.parallaxX || "0";
          gsap.set(sharedBg, {
            x: Number.isFinite(x) ? x : 0,
            y: Number.isFinite(y) ? y : 0,
            force3D: true,
          });
          if (sharedClouds) {
            const cx = Number(sharedClouds.dataset.meadowXLock);
            const cy = Number(sharedClouds.dataset.meadowYLock);
            sharedClouds.dataset.parallaxX =
              sharedClouds.dataset.parallaxXLock ||
              sharedClouds.dataset.parallaxX ||
              "0";
            gsap.set(sharedClouds, {
              x: Number.isFinite(cx) ? cx : 0,
              y: Number.isFinite(cy) ? cy : y,
              force3D: true,
            });
          }
          return true;
        };

        const clearMeadowPoseLock = () => {
          if (sharedBg) {
            delete sharedBg.dataset.meadowXLock;
            delete sharedBg.dataset.meadowYLock;
            delete sharedBg.dataset.parallaxXLock;
          }
          if (sharedClouds) {
            delete sharedClouds.dataset.meadowXLock;
            delete sharedClouds.dataset.meadowYLock;
            delete sharedClouds.dataset.parallaxXLock;
          }
        };

        gsap.set(track, { x: 0, force3D: true });
        if (sharedBg) {
          sharedBg.dataset.parallaxX = "0";
          const bandX = Number(sharedBg.dataset.bandX || 0);
          gsap.set(sharedBg, {
            x: bandX,
            y: meadowYOf(sharedBg),
            force3D: true,
          });
        }
        if (sharedClouds) {
          sharedClouds.dataset.parallaxX = "0";
          const bandX = Number(sharedBg?.dataset.bandX || 0);
          gsap.set(sharedClouds, {
            x: bandX * 1.25,
            y: meadowYOf(sharedClouds),
            force3D: true,
          });
        }
        if (tigerFrame) gsap.set(tigerFrame, { x: 0, force3D: true });
        if (tigerImg) gsap.set(tigerImg, { x: 0, force3D: true });
        gsap.set(earlyImageEls, { x: 0, force3D: true });
        setContentX(earlyContentEls, 0);
        setContentX(lateContentEls, 0);
        if (sustainLeftEl) gsap.set(sustainLeftEl, { x: 0, force3D: true });
        gsap.set(hold, { autoAlpha: 1 });
        applyVertical(0);

        /**
         * Segment-local panT (0→1). Start together, stop one-by-one.
         * `late`: tiger + sustain copy only — shared plate pose stays frozen.
         */
        const applyHorizLayers = (
          panT: number,
          spanPx: number,
          mode: "early" | "late" | "freeze-early",
        ) => {
          const t = clamp(panT, 0, 1);
          const span = Math.max(1, spanPx);
          const bgT = phaseProgress(t, H_PHASE_BG);
          const cloudsT = phaseProgress(t, H_PHASE_CLOUDS);
          const imgT = phaseProgress(t, H_PHASE_IMAGES);
          const contentT = phaseProgress(t, H_PHASE_CONTENT);

          layerBase.bg = -span * H_BG_EXTRA * bgT;
          layerBase.clouds = -span * H_CLOUDS_EXTRA * cloudsT;
          layerBase.images = -span * H_IMAGES_EXTRA * imgT;
          layerBase.content = -span * H_CONTENT_EXTRA * contentT;

          /*
            Late (tiger): freeze plate pose so H_BG restart can't shove meadow.
            Freeze-early (sustain vertical): do NOT lock — GalleryAwardsBand
            must keep pulling Y upward while slides scrub.
          */
          if (mode === "late") {
            if (!sharedBg?.dataset.meadowYLock) lockMeadowPose();
            applyLockedMeadowPose();
          } else if (sharedBg) {
            /*
              Clear tiger pose lock whenever we leave late — including
              scroll-back into sustain vertical — so the plate can scrub again.
            */
            clearMeadowPoseLock();
            sharedBg.dataset.parallaxX = String(layerBase.bg);
            const bandX = Number(sharedBg.dataset.bandX || 0);
            const maxX = window.innerWidth * PLATE_MAX_X_VW;
            const x = Math.max(
              -maxX,
              Math.min(maxX, bandX + layerBase.bg),
            );
            const y = meadowYOf(sharedBg);
            gsap.set(sharedBg, { x, y, force3D: true });
            if (sharedClouds) {
              sharedClouds.dataset.parallaxX = String(layerBase.clouds);
              const cx = Math.max(
                -maxX,
                Math.min(maxX, bandX * 1.1 + layerBase.clouds),
              );
              gsap.set(sharedClouds, {
                x: cx,
                y: meadowYOf(sharedClouds),
                force3D: true,
              });
            }
          }

          if (mode === "early" || mode === "freeze-early") {
            gsap.set(earlyImageEls, { x: layerBase.images, force3D: true });
            setContentX(earlyContentEls, layerBase.content);
            // Keep hold copy + tiger frame/img unshifted so vertical stays clean
            setContentX(lateContentEls, 0);
            if (sustainLeftEl) gsap.set(sustainLeftEl, { x: 0, force3D: true });
            if (tigerFrame) gsap.set(tigerFrame, { x: 0, force3D: true });
            if (tigerImg) gsap.set(tigerImg, { x: 0, force3D: true });
            return;
          }

          // late — tiger + right copy only; meadow pose held above
          gsap.set(earlyImageEls, { x: 0, force3D: true });
          setContentX(earlyContentEls, 0);
          if (sustainLeftEl) gsap.set(sustainLeftEl, { x: 0, force3D: true });
          if (tigerFrame) gsap.set(tigerFrame, { x: 0, force3D: true });
          /*
            Inner photo parallax while moving, then ease back to x:0 as the
            segment finishes so the settled tiger sits on the right edge.
          */
          const settle = clamp((t - 0.72) / 0.28, 0, 1);
          const tigerX = layerBase.images * (1 - settle);
          layerBase.images = tigerX;
          if (tigerImg) gsap.set(tigerImg, { x: tigerX, force3D: true });
          setContentX(lateContentEls, layerBase.content);
        };

        const resetHorizLayers = () => {
          layerBase.bg = 0;
          layerBase.clouds = 0;
          layerBase.images = 0;
          layerBase.content = 0;
          clearMeadowPoseLock();
          if (sharedBg) {
            sharedBg.dataset.parallaxX = "0";
            const bandX = Number(sharedBg.dataset.bandX || 0);
            gsap.set(sharedBg, {
              x: bandX,
              y: meadowYOf(sharedBg),
              force3D: true,
            });
          }
          if (sharedClouds) {
            sharedClouds.dataset.parallaxX = "0";
            const bandX = Number(sharedBg?.dataset.bandX || 0);
            gsap.set(sharedClouds, {
              x: bandX * 1.25,
              y: meadowYOf(sharedClouds),
              force3D: true,
            });
          }
          if (tigerFrame) gsap.set(tigerFrame, { x: 0, force3D: true });
          if (tigerImg) gsap.set(tigerImg, { x: 0, force3D: true });
          gsap.set(earlyImageEls, { x: 0, force3D: true });
          setContentX(earlyContentEls, 0);
          setContentX(lateContentEls, 0);
          if (sustainLeftEl) gsap.set(sustainLeftEl, { x: 0, force3D: true });
        };

        const trigger = ScrollTrigger.create({
          id: "awards-pin",
          /* Pin viewport shell — not the section (avoids stuck transforms over footer) */
          trigger: viewport,
          start: "top top",
          end: () => `+=${Math.round(getTravel() + getVerticalPx())}`,
          pin: true,
          pinSpacing: true,
          scrub: 2,
          anticipatePin: 0.2,
          invalidateOnRefresh: true,
          refreshPriority: -5,
          fastScrollEnd: false,
          onUpdate: (self) => {
            const travel = getTravel();
            const holdX = getHoldX();
            const verticalPx = getVerticalPx();
            const total = travel + verticalPx;
            const scrolled = self.progress * total;

            if (scrolled <= holdX) {
              // Horizontal in → giraffe (layered, segment-local 0→1)
              setTrackX(-scrolled);
              applyHorizLayers(
                holdX > 0 ? scrolled / holdX : 1,
                holdX,
                "early",
              );
              gsap.set(hold, { autoAlpha: 1 });
              applyVertical(0);
              return;
            }

            if (scrolled <= holdX + verticalPx) {
              // Vertical — freeze early layers; sustain copy unshifted
              setTrackX(-holdX);
              applyHorizLayers(1, holdX, "freeze-early");
              gsap.set(hold, { autoAlpha: 1 });
              const vt = (scrolled - holdX) / verticalPx;
              applyVertical(vt * VERTICAL_STEPS);
              return;
            }

            // Horizontal out → tiger (fresh layered 0→1)
            const after = scrolled - holdX - verticalPx;
            const maxAfter = Math.max(0, travel - holdX);
            const afterClamped = Math.min(after, maxAfter);

            setTrackX(-(holdX + afterClamped));
            applyHorizLayers(
              maxAfter > 0 ? afterClamped / maxAfter : 1,
              maxAfter,
              "late",
            );
            gsap.set(hold, { autoAlpha: 1 });
            applyVertical(VERTICAL_STEPS);
          },
          onRefresh: (self) => {
            self.update();
          },
          onEnterBack: (self) => {
            self.update();
          },
          onLeaveBack: () => {
            setTrackX(0);
            resetHorizLayers();
            gsap.set(hold, { autoAlpha: 1 });
            applyVertical(0);
          },
        });

        /* One deferred refresh — rapid refresh() was corrupting Conservation pin */
        const refreshLater = window.setTimeout(() => ScrollTrigger.refresh(), 320);

        let refreshQueued = false;
        const ro = new ResizeObserver(() => {
          if (refreshQueued) return;
          refreshQueued = true;
          requestAnimationFrame(() => {
            refreshQueued = false;
            trigger.refresh();
          });
        });
        ro.observe(viewport);
        ro.observe(panel);
        ro.observe(hold);

        return () => {
          window.clearTimeout(refreshLater);
          ro.disconnect();
          trigger.kill();
        };
      });

      // Mobile: no pin — stacked static slides
      mm.add("(max-width: 1023px)", () => {
        gsap.set(track, { clearProps: "transform" });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      className={styles.section}
      aria-label="Recognising the eye behind the lens"
      ref={sectionRef}
    >
      <div className={styles.viewport} ref={viewportRef} data-awards-viewport="">
        <div className={styles.track} ref={trackRef}>
          <article className={styles.panel} ref={panelRef}>
            <div className={styles.cheetahs}>
              <img
                src="/images/awards-figma/cheetahs-photo.png"
                alt="Two cheetah cubs nuzzling affectionately"
                width={1734}
                height={1066}
                draggable={false}
              />
            </div>

            <div
              className={`${styles.laurel} ${styles.laurelLeft}`}
              aria-hidden="true"
            >
              <img
                src="/images/awards-figma/l.png"
                alt=""
                width={456}
                height={920}
                draggable={false}
              />
            </div>
            <div className={styles.headingGroup}>
              <h2 className={styles.heading}>
                Recognising the Eye Behind the Lens
              </h2>
              <p className={styles.subtitle}>
                Every photograph begins with an encounter. Some encounters
                become stories.
              </p>
            </div>
            <div
              className={`${styles.laurel} ${styles.laurelRight}`}
              aria-hidden="true"
            >
              <img
                src="/images/awards-figma/r.png"
                alt=""
                width={456}
                height={920}
                draggable={false}
              />
            </div>

            <img
              className={`${styles.cert} ${styles.certA}`}
              src="/images/awards-figma/cert-a.png"
              alt="35 Awards wildlife photography certificate for Hymakar Valluri"
              width={1024}
              height={1536}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
            <img
              className={`${styles.cert} ${styles.certB}`}
              src="/images/awards-figma/cert-b.png"
              alt="Travel Photographer Society Moment Photo Contest first runner up certificate"
              width={1052}
              height={1495}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
            <img
              className={`${styles.cert} ${styles.certC}`}
              src="/images/awards-figma/cert-c.png"
              alt="Fine Art Photography Awards third prize certificate"
              width={1090}
              height={1443}
              loading="lazy"
              decoding="async"
              draggable={false}
            />

            <div className={styles.giraffe}>
              <img
                src="/images/awards-figma/panel-photo.png"
                alt="Two giraffes looking towards the camera"
                width={1275}
                height={1275}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </div>

            {/* —— Sustainability hold: 1 viewport wide —— */}
            <div
              className={styles.sustainHold}
              ref={holdRef}
              data-sustain-hold=""
            >
              <div className={styles.sustainStage} ref={stageRef}>
                <div className={styles.sustainLeft}>
                  <h3 className={styles.susHeading}>
                    <span className={styles.susHeadingLine}>Sustainability</span>
                    <span className={styles.susHeadingLine}>
                      Protecting What Matters
                    </span>
                  </h3>
                  <p className={styles.susCopy}>
                    At Wildefy, sustainability is at the heart of every journey
                    we create. We believe in exploring the wild with respect,
                    protecting natural habitats, and inspiring people to make
                    conscious choices that preserve the beauty of our planet for
                    generations to come.
                  </p>
                </div>

                {/*
                  Arc + discs share one viewport-centered square so the white
                  half-circle's center matches the page center and images sit
                  on the path (top → active → bottom) as the user scrolls.
                */}
                <div className={styles.orbit} aria-hidden="false">
                  <svg
                    className={styles.arc}
                    viewBox="0 0 1014 1014"
                    preserveAspectRatio="xMidYMid meet"
                    aria-hidden="true"
                  >
                    <defs>
                      {/* Soft tip fade — thin into nothing at top & bottom */}
                      <linearGradient
                        id="sustain-arc-fade"
                        gradientUnits="userSpaceOnUse"
                        x1="507"
                        y1="0"
                        x2="507"
                        y2="1014"
                      >
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                        <stop offset="10%" stopColor="#ffffff" stopOpacity="1" />
                        <stop offset="90%" stopColor="#ffffff" stopOpacity="1" />
                        <stop
                          offset="100%"
                          stopColor="#ffffff"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 507 0 A 507 507 0 0 1 507 1014"
                      stroke="url(#sustain-arc-fade)"
                    />
                  </svg>

                  <div className={styles.imageStack}>
                    {SUSTAIN_SLIDES.map((slide, index) => (
                      <img
                        key={slide.number}
                        className={styles.stackImg}
                        data-sustain-img=""
                        data-index={index}
                        src={slide.src}
                        alt={slide.alt}
                        width={580}
                        height={580}
                        loading={index < 3 ? "eager" : "lazy"}
                        decoding="async"
                        draggable={false}
                      />
                    ))}
                  </div>
                </div>

                <div className={styles.sustainCenter} aria-hidden="true" />

                <div className={styles.sustainRight}>
                  <div className={styles.textStack}>
                    {SUSTAIN_SLIDES.map((slide, index) => (
                      <div
                        key={slide.number}
                        className={styles.textCard}
                        data-sustain-text=""
                        data-index={index}
                        aria-hidden={index === 0 ? "false" : "true"}
                      >
                        <span className={styles.number}>{slide.number}</span>
                        <span className={styles.divider} aria-hidden="true" />
                        <div className={styles.item}>
                          <h4 className={styles.itemTitle}>{slide.title}</h4>
                          <p className={styles.itemCopy}>{slide.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.tiger}>
              <img
                src="/images/awards-figma/sustainability-photo.png"
                alt="A tiger walking through tall grass"
                width={1600}
                height={1066}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
