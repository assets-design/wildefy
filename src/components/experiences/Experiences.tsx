"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ExperienceJourneyCard } from "@/components/experiences/ExperienceJourneyCard";
import {
  EXPERIENCES,
  STAGE_LABELS,
  type Experience,
} from "@/components/experiences/experiencesData";
import {
  JourneyReveal,
  REVEAL_END,
  cameraProgressFromScroll,
} from "@/components/experiences/JourneyReveal";
import { detectQuality, hasWebGL, type SceneQuality } from "@/lib/wildefy3d/quality";
import styles from "./experiences-journey.module.css";

gsap.registerPlugin(ScrollTrigger);

const WildefyScene = dynamic(
  () => import("@/components/wildefy3d/WildefyScene").then((mod) => mod.WildefyScene),
  { ssr: false },
);

class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Map scroll progress → card opacity + horizontal travel. */
function cardStyleForProgress(item: Experience, progress: number): CSSProperties {
  const { from, hold, to } = item.window;
  const enterEnd = hold;
  const exitStart = Math.min(hold + (to - hold) * 0.45, to);

  let visibility = 0;
  if (progress <= from || progress >= to) visibility = 0;
  else if (progress < enterEnd) visibility = (progress - from) / Math.max(enterEnd - from, 0.001);
  else if (progress <= exitStart) visibility = 1;
  else visibility = 1 - (progress - exitStart) / Math.max(to - exitStart, 0.001);

  visibility = Math.min(1, Math.max(0, visibility));
  const eased = visibility * visibility * (3 - 2 * visibility);

  const travel = item.enterFrom === "right" ? 72 : -72;
  const x = (1 - eased) * travel;

  return {
    opacity: eased,
    ["--card-x" as string]: `${x}%`,
    pointerEvents: eased > 0.45 ? "auto" : "none",
    visibility: eased < 0.02 ? "hidden" : "visible",
  };
}

function introStyleForProgress(progress: number): CSSProperties {
  /* Hold through most of the fly-past, then clear with the mountain reveal. */
  const fadeOut = Math.min(1, Math.max(0, (progress - REVEAL_END * 0.35) / (REVEAL_END * 0.65)));
  const opacity = 1 - fadeOut;
  return {
    opacity,
    transform: `translate3d(0, ${fadeOut * -36}px, 0) scale(${1 + fadeOut * 0.04})`,
    visibility: opacity < 0.04 ? "hidden" : "visible",
  };
}

function activeStageIndex(progress: number) {
  if (progress < STAGE_LABELS[0].from) return -1;
  for (let i = STAGE_LABELS.length - 1; i >= 0; i -= 1) {
    if (progress >= STAGE_LABELS[i].from) return i;
  }
  return 0;
}

export function Experiences() {
  const sectionRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [quality, setQuality] = useState<SceneQuality | null>(null);
  const [webgl, setWebgl] = useState<"unknown" | "yes" | "no">("unknown");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [booting, setBooting] = useState(true);
  const [failed, setFailed] = useState(false);
  const readyOnce = useRef(false);

  useEffect(() => {
    setQuality(detectQuality());
    setWebgl(hasWebGL() ? "yes" : "no");
    setReducedMotion(prefersReducedMotion());
  }, []);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || reducedMotion || webgl === "no" || failed) return;

    const trigger = ScrollTrigger.create({
      trigger: wrap,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        // Camera uses remapped progress (slow during reveal); UI uses raw scroll.
        progressRef.current = cameraProgressFromScroll(self.progress);
        setProgress(self.progress);
      },
    });

    progressRef.current = cameraProgressFromScroll(trigger.progress);
    setProgress(trigger.progress);

    return () => {
      trigger.kill();
    };
  }, [reducedMotion, webgl, failed]);

  const onBoot = useCallback(() => {}, []);
  const onOakProgress = useCallback(() => {}, []);
  const onOakSettled = useCallback(() => {}, []);
  const onReady = useCallback(() => {
    if (readyOnce.current) return;
    readyOnce.current = true;
    window.setTimeout(() => setBooting(false), 400);
  }, []);
  const onFrame = useCallback(() => {}, []);
  const onError = useCallback(() => {
    setFailed(true);
    setBooting(false);
  }, []);

  const showScene = webgl === "yes" && quality && !failed && !reducedMotion;
  const stageIndex = activeStageIndex(progress);
  const snowActive = progress >= 0.74;

  if (reducedMotion || webgl === "no" || failed) {
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
          {(failed || webgl === "no") && (
            <p className={styles.introLead} style={{ marginBottom: 36 }}>
              {failed
                ? "The 3D landscape could not start on this device. Explore the four experiences below."
                : "Showing a simplified view — open on a WebGL-capable browser for the full terrain journey."}
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
            {showScene ? (
              <SceneBoundary onError={onError}>
                <WildefyScene
                  progressRef={progressRef}
                  quality={quality}
                  reducedMotion={false}
                  onBoot={onBoot}
                  onOakProgress={onOakProgress}
                  onOakSettled={onOakSettled}
                  onReady={onReady}
                  onFrame={onFrame}
                  onContextLost={onError}
                />
              </SceneBoundary>
            ) : (
              <div className={styles.fallbackScene} aria-hidden="true" />
            )}
          </div>

          <div
            className={`${styles.atmosphere} ${snowActive ? styles.atmosphereSnow : ""}`}
            aria-hidden="true"
          />
          <div
            className={`${styles.snowLayer} ${snowActive ? styles.snowLayerVisible : ""}`}
            aria-hidden="true"
          />

          <JourneyReveal progress={progress} />

          <div className={styles.overlay}>
            <header className={styles.intro} style={introStyleForProgress(progress)}>
              <h2 className={styles.introTitle}>Four Ways to Experience the Wild</h2>
              <p className={styles.introLead}>
                From unforgettable wildlife journeys to transformative learning
                experiences, discover how Wildefy brings the wisdom of the wild into the
                way we travel, work, learn, and lead.
              </p>
            </header>

            <div className={styles.cardsLayer}>
              <div className={styles.stageRail} aria-hidden="true">
                {STAGE_LABELS.map((stage, index) => (
                  <span
                    key={stage.id}
                    className={`${styles.stageDot} ${
                      index === stageIndex ? styles.stageDotActive : ""
                    }`}
                    title={stage.label}
                  />
                ))}
              </div>

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
