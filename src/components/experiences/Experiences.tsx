"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ExperienceJourneyCard } from "@/components/experiences/ExperienceJourneyCard";
import {
  EXPERIENCES,
  type Experience,
} from "@/components/experiences/experiencesData";
import { ExperiencesScrollVideo } from "@/components/experiences/ExperiencesScrollVideo";
import {
  EXPERIENCES_CONTENT_VH as CONTENT_VH,
  EXPERIENCES_WRAP_VH_WITH_SEAM as WRAP_VH_WITH_SEAM,
} from "@/components/experiences/experiencesSeamConstants";
import styles from "./experiences-journey.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Near-direct scrub so bottom→top mirrors top→bottom without laggy proxies. */
const SCRUB_LAG = 0.35;

type ExperiencesProps = {
  /** When false, skip HomeSeam mist runway (used by /v2). Default true. */
  seamReveal?: boolean;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Smootherstep — spends more scroll near start & end (slow-motion bookends). */
function easeInOut(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/**
 * Cards slide purely vertically — no horizontal motion.
 * - Enter: slides up from below the viewport (translateY +110vh → 0)
 * - Hold:  centered at natural resting position
 * - Exit:  slides up and out of viewport (translateY 0 → -120vh)
 * Left/right anchoring is handled by CSS [data-side] rules — not by JS.
 */
function cardStyleForProgress(item: Experience, progress: number): CSSProperties {
  const { from, hold, to } = item.window;

  if (progress <= from || progress >= to) {
    return { visibility: "hidden", opacity: 0, pointerEvents: "none" };
  }

  // Enter: from → hold
  const enterT = progress < hold
    ? (progress - from) / Math.max(hold - from, 0.001)
    : 1;
  // Exit: hold → to
  const exitT = progress >= hold
    ? (progress - hold) / Math.max(to - hold, 0.001)
    : 0;

  const enterEased = easeInOut(enterT);
  const exitEased = easeInOut(exitT);

  // Bottom → center → top (all vertical)
  const enterY = (1 - enterEased) * 110; // vh, positive = below screen
  const exitY  = exitEased * -120;        // vh, negative = above screen
  const totalVh = enterY + exitY;

  // Fast fade-in on enter, fast fade-out on exit
  const opacity = Math.min(enterEased * 3, 1) * Math.max(1 - exitEased * 3, 0);
  // Slight scale: starts 0.90, reaches 1.0 at hold, shrinks to 0.94 on exit
  const scale   = 0.90 + enterEased * 0.10 - exitEased * 0.06;
  const vis     = opacity > 0.02;

  return {
    opacity: Math.max(0, Math.min(1, opacity)),
    transform: `translateY(calc(-50% + ${totalVh.toFixed(2)}vh)) scale(${scale.toFixed(3)})`,
    visibility: vis ? "visible" : "hidden",
    pointerEvents: opacity >= 0.55 ? "auto" : "none",
  };
}

/**
 * Intro fades in at section start, then slides up once journey cards begin.
 */
function introStyleForProgress(progress: number): CSSProperties {
  const travel = 72;
  const enterEnd = 0.05;
  const enterT = easeInOut(Math.min(1, progress / enterEnd));

  const exitStart = 0.04;
  const exitEnd = 0.14;
  let exitT = 0;
  if (progress >= exitEnd) exitT = 1;
  else if (progress > exitStart) {
    exitT = easeInOut((progress - exitStart) / (exitEnd - exitStart));
  }

  const opacity = enterT * (1 - exitT);
  const y = (1 - enterT) * travel + exitT * -travel;

  return {
    opacity,
    transform: `translate(-50%, calc(-50% + ${y}px))`,
    visibility: opacity < 0.04 ? "hidden" : "visible",
  };
}

function mistStyleForProgress(progress: number): CSSProperties {
  const early = 1 - easeInOut(Math.min(1, progress / 0.18));
  const late = easeInOut(Math.max(0, (progress - 0.78) / 0.22));
  const opacity = Math.min(0.45, early * 0.42 + late * 0.28);
  return {
    opacity,
    transform: `translate3d(0, ${progress * -4}%, 0) scale(${1.04 + progress * 0.03})`,
  };
}

export function Experiences({ seamReveal = true }: ExperiencesProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [booting, setBooting] = useState(true);
  const [failed, setFailed] = useState(false);

  const wrapVh = seamReveal ? WRAP_VH_WITH_SEAM : CONTENT_VH;
  const contentFrac = CONTENT_VH / wrapVh;

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || reducedMotion) return;

    let raf = 0;
    let pending = -1;

    const flushProgress = () => {
      raf = 0;
      if (pending < 0) return;
      const next = pending;
      pending = -1;
      setProgress(next);
    };

    const queueProgress = (v: number) => {
      pending = v;
      if (!raf) raf = window.requestAnimationFrame(flushProgress);
    };

    const clampContent = (raw: number) =>
      Math.min(1, Math.max(0, raw / contentFrac));

    const progressTrigger = ScrollTrigger.create({
      id: "experiences-progress",
      trigger: wrap,
      start: "top top",
      end: "bottom bottom",
      scrub: SCRUB_LAG,
      invalidateOnRefresh: true,
      onUpdate: (self) => queueProgress(clampContent(self.progress)),
      onRefresh: (self) => queueProgress(clampContent(self.progress)),
      onEnterBack: (self) => queueProgress(clampContent(self.progress)),
      onLeaveBack: () => queueProgress(0),
    });

    queueProgress(progressTrigger.progress);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      progressTrigger.kill();
    };
  }, [reducedMotion, contentFrac]);

  const onReady = useCallback(() => {
    setBooting(false);
    ScrollTrigger.refresh();
  }, []);

  const onError = useCallback(() => {
    /* Don't crash the section — just hide the loading overlay */
    setBooting(false);
  }, []);

  const snowActive = progress >= EXPERIENCES[EXPERIENCES.length - 1].window.from;

  /**
   * Map frames across the full card runway (0→1). Last frame lands exactly
   * when card 4 holds / content ends — no post-hold freeze scrub.
   */
  const videoProgress = Math.min(1, Math.max(0, progress));

  if (reducedMotion || failed) {
    return (
      <section
        className={`experiences ${styles.journey}`}
        id="experiences"
        aria-label="Four ways to experience the wild"
        ref={sectionRef}
      >
        <div className={styles.staticStack}>
          <header className={styles.staticIntro}>
            <h2 className={styles.introTitle}>Four Ways to Experience the Wild</h2>
            <p className={styles.introLead}>
              From unforgettable wildlife journeys to transformative learning experiences,
              discover how Wildefy brings the wisdom of the wild into the way we travel,
              work, learn, and lead.
            </p>
          </header>
          {failed && (
            <p className={styles.introLead} style={{ marginBottom: 36 }}>
              The cinematic background could not start on this device. Explore the four
              experiences below.
            </p>
          )}
          {EXPERIENCES.map((item) => (
            <ExperienceJourneyCard key={item.id} experience={item} reduced />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      className={`experiences ${styles.journey}`}
      id="experiences"
      aria-label="Four ways to experience the wild"
      ref={sectionRef}
    >
      <div
        className={styles.wrap}
        ref={wrapRef}
        data-experiences-wrap
        data-content-vh={CONTENT_VH}
        data-wrap-vh={wrapVh}
        style={{ height: `${wrapVh}vh` }}
      >
        <div className={styles.sticky}>
          <div className={styles.scene}>
            <ExperiencesScrollVideo
              progress={videoProgress}
              onReady={onReady}
              onError={onError}
            />
          </div>

          <div
            className={styles.mistVeil}
            style={mistStyleForProgress(progress)}
            aria-hidden="true"
          />

          <div
            className={`${styles.atmosphere} ${snowActive ? styles.atmosphereSnow : ""}`}
            aria-hidden="true"
          />
          <div
            className={`${styles.snowLayer} ${snowActive ? styles.snowLayerVisible : ""}`}
            aria-hidden="true"
          />

          <div className={styles.overlay}>
            <header
              className={styles.intro}
              style={introStyleForProgress(progress)}
            >
              <p className={styles.introEyebrow}>Experiences</p>
              <h2 className={styles.introTitle}>Four Ways to Experience the Wild</h2>
              <p className={styles.introLead}>
                From unforgettable wildlife journeys to transformative learning
                experiences, discover how Wildefy brings the wisdom of the wild into the
                way we travel, work, learn, and lead.
              </p>
            </header>

            <div className={styles.cardsLayer}>
              {EXPERIENCES.map((item) => (
                <ExperienceJourneyCard
                  key={item.id}
                  experience={item}
                  style={cardStyleForProgress(item, progress)}
                />
              ))}

            </div>
          </div>

          <div
            className={`${styles.loading} ${booting ? "" : styles.loadingHidden}`}
            aria-hidden={!booting}
          >
            <p className={styles.loadingCopy}>Entering the wild</p>
          </div>
        </div>
      </div>
    </section>
  );
}
