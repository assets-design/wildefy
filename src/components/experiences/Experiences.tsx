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
  ExperiencesCloudReveal,
  easeCloudReveal,
} from "@/components/experiences/ExperiencesCloudReveal";
import styles from "./experiences-journey.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Softer scrub so card slide-up feels slower / more deliberate. */
const SCRUB_LAG = 0.85;
/** Cloud dissolve completes in the first stretch after Experiences hits the viewport. */
const CLOUD_REVEAL_VH = 0.85;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeInOut(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function slideDistancePx() {
  if (typeof window === "undefined") return 420;
  // Big enough to read as “from bottom / to top”, still inside the sticky stage.
  return Math.round(Math.min(window.innerHeight * 0.72, 560));
}

/**
 * Left + right cards: pure slide-up (no fade).
 * Enter from bottom → rest, exit continue upward off the top.
 */
function cardStyleForProgress(item: Experience, progress: number): CSSProperties {
  const { from, hold, to } = item.window;
  const enterEnd = hold;
  const exitStart = Math.min(hold + (to - hold) * 0.55, to);
  const travel = slideDistancePx();

  let phase: "before" | "enter" | "hold" | "exit" | "after" = "before";
  let t = 0;

  if (progress <= from) {
    phase = "before";
    t = 0;
  } else if (progress < enterEnd) {
    phase = "enter";
    t = (progress - from) / Math.max(enterEnd - from, 0.001);
  } else if (progress <= exitStart) {
    phase = "hold";
    t = 1;
  } else if (progress < to) {
    phase = "exit";
    t = 1 - (progress - exitStart) / Math.max(to - exitStart, 0.001);
  } else {
    phase = "after";
    t = 0;
  }

  const eased = easeInOut(Math.min(1, Math.max(0, t)));
  let y = 0;
  if (phase === "before" || phase === "enter") {
    y = (1 - eased) * travel;
  } else if (phase === "exit" || phase === "after") {
    y = -(1 - eased) * travel;
  }

  // Fully opaque while on stage — motion only, no fade-in.
  const onStage = phase === "enter" || phase === "hold" || phase === "exit";

  return {
    opacity: onStage ? 1 : 0,
    ["--card-x" as string]: "0px",
    ["--card-y" as string]: `${Math.round(y)}px`,
    ["--card-scale" as string]: "1",
    pointerEvents: phase === "hold" || (phase === "enter" && eased > 0.55) ? "auto" : "none",
    visibility: onStage ? "visible" : "hidden",
  };
}

/**
 * Intro enters as the arrival cloud dissolves (not deep into the section),
 * then slides up out once the journey cards begin.
 */
function introStyleForProgress(
  cloudReveal: number,
  progress: number,
): CSSProperties {
  const travel = 72;
  // Enter while clouds are parting (driven by arrival trigger).
  const enterT =
    cloudReveal <= 0.35
      ? 0
      : easeInOut(Math.min(1, (cloudReveal - 0.35) / 0.55));

  // Exit on section journey progress after arrival.
  const exitStart = 0.05;
  const exitEnd = 0.12;
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

export function Experiences() {
  const sectionRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [cloudReveal, setCloudReveal] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [booting, setBooting] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || reducedMotion) return;

    let raf = 0;
    let pending = -1;
    let cloudRaf = 0;
    let cloudPending = -1;

    const flushProgress = () => {
      raf = 0;
      if (pending < 0) return;
      const next = pending;
      pending = -1;
      setProgress(next);
    };

    const flushCloud = () => {
      cloudRaf = 0;
      if (cloudPending < 0) return;
      const next = cloudPending;
      cloudPending = -1;
      setCloudReveal(next);
    };

    // Arrival reveal: starts the instant Experiences hits the viewport top —
    // not deep into the long card runway.
    const cloudProxy = { p: 0 };
    const cloudTween = gsap.to(cloudProxy, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: wrap,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * CLOUD_REVEAL_VH)}`,
        scrub: 0.35,
        invalidateOnRefresh: true,
      },
      onUpdate: () => {
        cloudPending = easeCloudReveal(cloudProxy.p);
        if (!cloudRaf) cloudRaf = window.requestAnimationFrame(flushCloud);
      },
    });

    // Progress 0→1 is locked to this section’s pin runway (background + cards).
    const proxy = { progress: 0 };
    const tween = gsap.to(proxy, {
      progress: 1,
      ease: "none",
      scrollTrigger: {
        trigger: wrap,
        start: "top top",
        end: "bottom bottom",
        scrub: SCRUB_LAG,
        invalidateOnRefresh: true,
      },
      onUpdate: () => {
        pending = proxy.progress;
        if (!raf) raf = window.requestAnimationFrame(flushProgress);
      },
    });

    setProgress(proxy.progress);
    setCloudReveal(easeCloudReveal(cloudProxy.p));

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      if (cloudRaf) window.cancelAnimationFrame(cloudRaf);
      cloudTween.scrollTrigger?.kill();
      cloudTween.kill();
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reducedMotion]);

  const onReady = useCallback(() => {
    setBooting(false);
    ScrollTrigger.refresh();
  }, []);

  const onError = useCallback(() => {
    setFailed(true);
    setBooting(false);
  }, []);

  const snowActive = progress >= 0.74;

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
      <div className={styles.wrap} ref={wrapRef}>
        <div className={styles.sticky}>
          <div className={styles.scene}>
            <ExperiencesScrollVideo
              progress={progress}
              onReady={onReady}
              onError={onError}
            />
          </div>

          {/* Journey cloud (clouds-section.png) dissolves to reveal the section */}
          <ExperiencesCloudReveal progress={cloudReveal} />

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
              style={introStyleForProgress(cloudReveal, progress)}
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
