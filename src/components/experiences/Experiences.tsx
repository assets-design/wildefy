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
import styles from "./experiences-journey.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Near-direct scrub so bottom→top mirrors top→bottom without laggy proxies. */
const SCRUB_LAG = 0.35;
const HOLD_SCALE = 1;
/** First portion of each card’s enter window = pin only, then the card appears. */
const PIN_LEAD = 0.34;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeInOut(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Slow early motion so the grow from afar reads clearly. */
function easeSlowEnter(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return easeInOut(Math.pow(x, 1.45));
}

function projectionOffsetPx(item: Experience) {
  const w = typeof window !== "undefined" ? window.innerWidth : 1280;
  const h = typeof window !== "undefined" ? window.innerHeight : 800;
  const { xVw, yVh, fromScale } = item.projection;
  return {
    x: Math.round(xVw * w),
    y: Math.round(yVh * h),
    fromScale,
  };
}

/**
 * Each card starts at a unique screen point (small), then slowly travels
 * to its left/right rest pose while scaling up. Exit zooms back out.
 * Pin appears first (PIN_LEAD); the card only starts after that.
 */
function cardStyleForProgress(item: Experience, progress: number): CSSProperties {
  const { from, hold, to } = item.window;
  const { x: startX, y: startY, fromScale } = projectionOffsetPx(item);
  const enterEnd = hold;
  const exitStart = Math.min(hold + (to - hold) * 0.35, to);

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

  const clamped = Math.min(1, Math.max(0, t));
  // Card motion only after the pin has been shown alone
  const cardT = Math.max(0, (clamped - PIN_LEAD) / Math.max(1 - PIN_LEAD, 0.001));
  const enterEased = easeSlowEnter(cardT);
  const exitEased = easeInOut(clamped);

  let scale = fromScale;
  let x = startX;
  let y = startY;
  let opacity = 0;

  if (phase === "enter") {
    if (cardT <= 0) {
      // Pin-only beat — keep card hidden at the start point
      opacity = 0;
      scale = fromScale;
      x = startX;
      y = startY;
    } else {
      scale = fromScale + (HOLD_SCALE - fromScale) * enterEased;
      x = startX * (1 - enterEased);
      y = startY * (1 - enterEased);
      opacity = Math.min(1, cardT / 0.22);
    }
  } else if (phase === "hold") {
    scale = HOLD_SCALE;
    x = 0;
    y = 0;
    opacity = 1;
  } else if (phase === "exit") {
    // Shrink + fade in place — no lateral slide while hiding
    scale = fromScale + (HOLD_SCALE - fromScale) * exitEased;
    x = 0;
    y = 0;
    opacity = Math.min(1, Math.max(0, exitEased / 0.28));
  }

  const onStage =
    (phase === "enter" && cardT > 0) || phase === "hold" || phase === "exit";

  const visible = onStage ? opacity : 0;

  return {
    opacity: visible,
    ["--card-x" as string]: `${Math.round(x)}px`,
    ["--card-y" as string]: `${Math.round(y)}px`,
    ["--card-scale" as string]: scale.toFixed(3),
    // Keep CTAs clickable whenever the card is readable (not only the
    // brief hold beat — first card “Explore Tours” → /3d).
    pointerEvents: visible >= 0.55 ? "auto" : "none",
    visibility: onStage && opacity > 0.04 ? "visible" : "hidden",
  };
}

function formatCoord(value: number, pos: string, neg: string) {
  const abs = Math.abs(value);
  const hemi = value >= 0 ? pos : neg;
  return `${abs.toFixed(4)}° ${hemi}`;
}

/**
 * Pin first, then card. Between cards the pin fades out at the old start,
 * then fades in at the next start (no hard jump).
 */
function mapPinForProgress(progress: number): {
  item: Experience;
  enterT: number;
  opacity: number;
} | null {
  const firstFrom = EXPERIENCES[0].window.from;
  // Wait until intro text is gone — no early pin over the headline
  if (progress < firstFrom) return null;

  for (let i = 0; i < EXPERIENCES.length; i++) {
    const item = EXPERIENCES[i];
    const { from, hold } = item.window;
    const nextFrom = EXPERIENCES[i + 1]?.window.from ?? 1.05;

    if (progress >= from && progress < hold) {
      const enterT = (progress - from) / Math.max(hold - from, 0.001);
      // Soft fade-in at each new start (first pin after intro included)
      const fadeIn = Math.min(1, enterT / Math.max(PIN_LEAD * 0.4, 0.08));
      return { item, enterT, opacity: fadeIn };
    }

    // Gap after settle: fade out here → fade in at next start
    if (progress >= hold && progress < nextFrom) {
      if (i + 1 >= EXPERIENCES.length) {
        return { item, enterT: 1, opacity: 1 };
      }
      const gapT = (progress - hold) / Math.max(nextFrom - hold, 0.001);
      if (gapT < 0.5) {
        const fadeOut = 1 - easeInOut(gapT / 0.5);
        return { item, enterT: 1, opacity: fadeOut };
      }
      const fadeIn = easeInOut((gapT - 0.5) / 0.5);
      return {
        item: EXPERIENCES[i + 1],
        enterT: Math.min(PIN_LEAD * 0.9, fadeIn * PIN_LEAD),
        opacity: fadeIn,
      };
    }
  }

  return null;
}

function mapPinStyle(
  item: Experience,
  enterT: number,
  opacity: number,
): CSSProperties {
  const { x: startX, y: startY } = projectionOffsetPx(item);
  const clamped = Math.min(1, Math.max(0, enterT));
  // Stay small through the pin-only beat; only nudge larger once the card travels
  const cardStarted = clamped > PIN_LEAD;
  const afterLead = cardStarted
    ? (clamped - PIN_LEAD) / Math.max(1 - PIN_LEAD, 0.001)
    : 0;
  const pinScale = 0.68 + (cardStarted ? 0.18 * easeInOut(afterLead) : 0);

  return {
    opacity,
    ["--pin-x" as string]: `${startX}px`,
    ["--pin-y" as string]: `${startY}px`,
    ["--pin-scale" as string]: pinScale.toFixed(3),
    visibility: opacity < 0.05 ? "hidden" : "visible",
  };
}

/**
 * Intro fades in at section start, then slides up once journey cards begin.
 * (No cloud enter veil — section shows normally.)
 */
function introStyleForProgress(progress: number): CSSProperties {
  const travel = 72;
  const enterEnd = 0.05;
  const enterT = easeInOut(Math.min(1, progress / enterEnd));

  // Exit fully before the first pin/card (from: 0.15).
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

export function Experiences() {
  const sectionRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
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

    const progressTrigger = ScrollTrigger.create({
      id: "experiences-progress",
      trigger: wrap,
      start: "top top",
      end: "bottom bottom",
      scrub: SCRUB_LAG,
      invalidateOnRefresh: true,
      onUpdate: (self) => queueProgress(self.progress),
      onRefresh: (self) => queueProgress(self.progress),
      onEnterBack: (self) => queueProgress(self.progress),
      onLeaveBack: () => queueProgress(0),
    });

    queueProgress(progressTrigger.progress);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      progressTrigger.kill();
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

  const snowActive = progress >= EXPERIENCES[EXPERIENCES.length - 1].window.from;
  const mapPin = mapPinForProgress(progress);

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

              {mapPin ? (
                <div
                  className={styles.mapPin}
                  data-side={mapPin.item.enterFrom}
                  style={mapPinStyle(mapPin.item, mapPin.enterT, mapPin.opacity)}
                  aria-hidden="true"
                >
                  <div className={styles.mapPinMark}>
                    <svg
                      className={styles.mapPinIcon}
                      viewBox="0 0 40 52"
                      width="40"
                      height="52"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 0C9.5 0 1 8.5 1 19c0 14.2 19 33 19 33s19-18.8 19-33C39 8.5 30.5 0 20 0z"
                        fill="#E85A1B"
                      />
                      <circle cx="20" cy="18" r="7.5" fill="#fff" />
                      <circle cx="20" cy="18" r="3.5" fill="#E85A1B" />
                    </svg>
                    <span className={styles.mapPinPulse} />
                  </div>
                  <div className={styles.mapPinCoords}>
                    <span>
                      {formatCoord(mapPin.item.coords.lat, "N", "S")}
                    </span>
                    <span>
                      {formatCoord(mapPin.item.coords.lng, "E", "W")}
                    </span>
                  </div>
                </div>
              ) : null}
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
