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

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Horizontal Awards strip with a nested Sustainability vertical story.
 *
 * Scroll map (one pin):
 *   1) Horizontal 0 → sustainability hold
 *   2) Vertical slides 1 → 6 (track held)
 *   3) Horizontal hold → end (tiger / remaining strip)
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
        const getPanelW = () => {
          const measured = Math.max(panel.scrollWidth, panel.offsetWidth);
          const expected = getViewW() * STRIP_VIEWPORTS;
          return Math.max(measured, expected);
        };
        const getTravel = () => Math.max(1, getPanelW() - getViewW());
        const getHoldX = () => Math.min(hold.offsetLeft, getTravel());
        const getVerticalPx = () =>
          Math.max(
            1,
            Math.round(
              window.innerHeight * VERTICAL_VH_PER_STEP * VERTICAL_STEPS,
            ),
          );

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
            const d = i - textIndex;
            const ad = Math.abs(d);
            let y = 0;
            let opacity = 0;

            if (ad <= 0.02) {
              y = 0;
              opacity = 1;
            } else if (d < 0 && d > -1) {
              y = -56 * -d;
              opacity = clamp(1 + d * 1.35, 0, 1);
            } else if (d > 0 && d < 1) {
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

        gsap.set(track, { x: 0, force3D: true });
        applyVertical(0);

        const trigger = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () => `+=${Math.round(getTravel() + getVerticalPx())}`,
          pin: true,
          pinSpacing: true,
          scrub: 1.15,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
          onUpdate: (self) => {
            const travel = getTravel();
            const holdX = getHoldX();
            const verticalPx = getVerticalPx();
            const total = travel + verticalPx;
            const scrolled = self.progress * total;

            if (scrolled <= holdX) {
              // before → enter sustainability
              gsap.set(track, { x: -scrolled, force3D: true });
              applyVertical(0);
              return;
            }

            if (scrolled <= holdX + verticalPx) {
              // vertical-active through slides 01→06 (unique images)
              gsap.set(track, { x: -holdX, force3D: true });
              const vt = (scrolled - holdX) / verticalPx;
              applyVertical(vt * VERTICAL_STEPS);
              return;
            }

            // after slide 06 → resume horizontal (no further vertical image travel)
            const after = scrolled - holdX - verticalPx;
            gsap.set(track, {
              x: -(holdX + after),
              force3D: true,
            });
            applyVertical(VERTICAL_STEPS);
          },
          onRefresh: (self) => {
            // Re-run mapping after layout changes
            self.update();
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
                src="/images/awards-figma/laurel.png"
                alt=""
                width={2000}
                height={1333}
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
                src="/images/awards-figma/laurel.png"
                alt=""
                width={2000}
                height={1333}
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
