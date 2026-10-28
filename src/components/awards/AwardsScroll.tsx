"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./awards.module.css";
import { SUSTAIN_SLIDES, SUSTAIN_SLIDE_COUNT } from "./sustainSlides";

gsap.registerPlugin(ScrollTrigger);

/** Figma strip width ÷ 1920 design width (6081 / 1920). */
const STRIP_VIEWPORTS = 6081 / 1920;
/** Vertical scroll distance per step (5 steps across 6 unique slides). */
const VERTICAL_VH_PER_STEP = 0.95;
/** Slide seats only — after slide 06 settles, horizontal resumes (no extra vertical beat). */
const VERTICAL_STEPS = SUSTAIN_SLIDE_COUNT - 1;

/**
 * Horizontal layer parallax (same grammar as Story):
 * all layers start together; finish / hold one-after-one.
 * Vertical sustainability scroll stays 1:1 (layers frozen).
 */
const H_PHASE_BG = { start: 0, end: 0.42 };
const H_PHASE_IMAGES = { start: 0, end: 0.68 };
const H_PHASE_CONTENT = { start: 0, end: 1 };
/** Extra relative travel vs the track (track still owns layout / hold). */
const H_BG_EXTRA = 0.14;
const H_IMAGES_EXTRA = 0.08;
const H_CONTENT_EXTRA = 0.035;

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
          Each slide index owns a unique center image (01→lion … 06→07.jpg).
        */
        const ARC_PREVIEW = Math.PI * 0.32;
        const ARC_EXIT = Math.PI * 0.52;
        const ARC_RADIUS = 0.5;

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
              // On the visible arc: top ↔ center ↔ bottom — full opacity, full circle
              angle = d * ARC_PREVIEW;
              scale = 1 - 0.45 * ad;
              opacity = 1;
              z = ad < 0.35 ? 3 : 2;
            } else if (ad < 1.75) {
              // Exit / enter off-screen along the arc (no fade)
              const u = clamp((ad - 1) / 0.75, 0, 1);
              angle = sign * (ARC_PREVIEW + (ARC_EXIT - ARC_PREVIEW) * u);
              scale = 0.55;
              opacity = 1;
              z = 1;
            }

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

        const bgPlate = panel.querySelector<HTMLElement>(`.${styles.bgPlate}`);
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

        const layerBase = { bg: 0, images: 0, content: 0 };

        /** Parallax x only — right laurel mirror lives on the img CSS. */
        const setContentX = (els: HTMLElement[], x: number) => {
          els.forEach((el) => {
            gsap.set(el, { x, force3D: true });
          });
        };

        gsap.set(track, { x: 0, force3D: true });
        if (bgPlate) gsap.set(bgPlate, { x: 0, force3D: true });
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
         * `late`: tiger img + sustain copy; early awards content held still.
         */
        const applyHorizLayers = (
          panT: number,
          spanPx: number,
          mode: "early" | "late" | "freeze-early",
        ) => {
          const t = clamp(panT, 0, 1);
          const span = Math.max(1, spanPx);
          const bgT = phaseProgress(t, H_PHASE_BG);
          const imgT = phaseProgress(t, H_PHASE_IMAGES);
          const contentT = phaseProgress(t, H_PHASE_CONTENT);

          layerBase.bg = -span * H_BG_EXTRA * bgT;
          layerBase.images = -span * H_IMAGES_EXTRA * imgT;
          layerBase.content = -span * H_CONTENT_EXTRA * contentT;

          if (bgPlate) gsap.set(bgPlate, { x: layerBase.bg, force3D: true });

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

          // late — tiger segment
          gsap.set(earlyImageEls, { x: 0, force3D: true });
          setContentX(earlyContentEls, 0);
          if (sustainLeftEl) gsap.set(sustainLeftEl, { x: 0, force3D: true });
          // Frame always flush to strip/viewport right
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
          layerBase.images = 0;
          layerBase.content = 0;
          if (bgPlate) gsap.set(bgPlate, { x: 0, force3D: true });
          if (tigerFrame) gsap.set(tigerFrame, { x: 0, force3D: true });
          if (tigerImg) gsap.set(tigerImg, { x: 0, force3D: true });
          gsap.set(earlyImageEls, { x: 0, force3D: true });
          setContentX(earlyContentEls, 0);
          setContentX(lateContentEls, 0);
          if (sustainLeftEl) gsap.set(sustainLeftEl, { x: 0, force3D: true });
        };

        const trigger = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () => `+=${Math.round(getTravel() + getVerticalPx())}`,
          pin: true,
          pinSpacing: true,
          scrub: 1.25,
          anticipatePin: 1,
          invalidateOnRefresh: true,
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

        const refresh = () => ScrollTrigger.refresh();
        const refreshSoon = window.setTimeout(refresh, 80);
        const refreshLater = window.setTimeout(refresh, 450);
        window.addEventListener("load", refresh, { once: true });

        let refreshQueued = false;
        const ro = new ResizeObserver(() => {
          if (refreshQueued) return;
          refreshQueued = true;
          requestAnimationFrame(() => {
            refreshQueued = false;
            refresh();
          });
        });
        ro.observe(viewport);
        ro.observe(panel);
        ro.observe(hold);

        return () => {
          window.clearTimeout(refreshSoon);
          window.clearTimeout(refreshLater);
          window.removeEventListener("load", refresh);
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
      <div className={styles.viewport} ref={viewportRef}>
        <div className={styles.track} ref={trackRef}>
          <article className={styles.panel} ref={panelRef}>
            <div className={styles.bgPlate} aria-hidden="true" />

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
              <div className={styles.laurelMirror}>
                <img
                  src="/images/awards-figma/laurel.png"
                  alt=""
                  width={2000}
                  height={1333}
                  draggable={false}
                />
              </div>
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
              <div className={styles.laurelMirror}>
                <img
                  src="/images/awards-figma/laurel.png"
                  alt=""
                  width={2000}
                  height={1333}
                  draggable={false}
                />
              </div>
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
                    <path d="M 507 0 A 507 507 0 0 1 507 1014" />
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
