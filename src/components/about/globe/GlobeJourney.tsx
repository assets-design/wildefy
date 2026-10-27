"use client";

import dynamic from "next/dynamic";
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
import { DESTINATIONS, stageFromProgress } from "@/lib/aboutGlobe/destinations";
import { DestinationCard } from "./DestinationCard";
import styles from "./globe.module.css";

gsap.registerPlugin(ScrollTrigger);

const GlobeScene = dynamic(() => import("./GlobeScene"), { ssr: false });

const N = DESTINATIONS.length;
/** Scroll distance per stop — scroll down through all 6 cards, then release. */
const VH_PER_STOP = 120;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeInOut(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Per-stop windows along progress 0→1 while scrolling down. */
function windowForIndex(index: number) {
  const span = 1 / N;
  const from = index * span;
  const to = (index + 1) * span;
  // Short enter, long hold so each of the 6 cards can be read while scrolling down.
  const enterEnd = from + span * 0.18;
  const exitStart = from + span * 0.78;
  return { from, enterEnd, exitStart, to };
}

/**
 * Cards slide upward as the user scrolls down (enter from below → hold → exit up).
 */
function cardStyleForProgress(index: number, progress: number): CSSProperties {
  const { from, enterEnd, exitStart, to } = windowForIndex(index);
  const travel =
    typeof window === "undefined"
      ? 420
      : Math.round(Math.min(window.innerHeight * 0.55, 480));

  let phase: "before" | "enter" | "hold" | "exit" | "after" = "before";
  let t = 0;

  // First card is already on stage when the globe pins (progress ≈ 0).
  if (index === 0 && progress < enterEnd) {
    phase = progress <= 0.001 ? "hold" : "enter";
    t = progress <= 0.001 ? 1 : progress / Math.max(enterEnd, 0.001);
  } else if (progress < from) {
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

  const onStage = phase === "enter" || phase === "hold" || phase === "exit";

  return {
    opacity: onStage ? 1 : 0,
    ["--card-y" as string]: `${Math.round(y)}px`,
    pointerEvents:
      phase === "hold" || (phase === "enter" && eased > 0.55) ? "auto" : "none",
    visibility: onStage ? "visible" : "hidden",
  };
}

export function GlobeJourney() {
  const section = useRef<HTMLElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef(0);
  const revision = useRef(0);
  const draggingCard = useRef(false);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  const setActiveSafe = useCallback((idx: number) => {
    const next = Math.min(Math.max(0, idx), N - 1);
    setActive((prev) => (prev === next ? prev : next));
  }, []);

  useLayoutEffect(() => {
    const track = wrap.current;
    if (!track || reducedMotion) return;

    let raf = 0;
    let pending = -1;

    const flush = () => {
      raf = 0;
      if (pending < 0) return;
      const p = pending;
      pending = -1;
      if (!draggingCard.current) {
        const s = stageFromProgress(p, N);
        stage.current = s;
        revision.current += 1;
        setProgress(p);
        // Equal windows along the downward runway: one card per sixth of scroll.
        setActiveSafe(Math.min(N - 1, Math.max(0, Math.floor(p * N))));
      }
    };

    const proxy = { progress: 0 };
    const tween = gsap.to(proxy, {
      progress: 1,
      ease: "none",
      scrollTrigger: {
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // Prefer ScrollTrigger progress directly so scrub + programmatic scroll stay in sync.
          pending = self.progress;
          if (!raf) raf = window.requestAnimationFrame(flush);
        },
      },
      onUpdate: () => {
        pending = proxy.progress;
        if (!raf) raf = window.requestAnimationFrame(flush);
      },
    });

    const s0 = stageFromProgress(0, N);
    stage.current = s0;
    setProgress(0);
    setActiveSafe(0);

    // Refresh after layout / WebGL mount so pin runway is accurate.
    const refresh = () => ScrollTrigger.refresh();
    const t = window.setTimeout(refresh, 120);
    window.addEventListener("load", refresh);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("load", refresh);
      if (raf) window.cancelAnimationFrame(raf);
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reducedMotion, setActiveSafe]);

  const onActiveChange = useCallback(
    (index: number) => {
      draggingCard.current = true;
      stage.current = index;
      setActiveSafe(index);
    },
    [setActiveSafe],
  );

  useEffect(() => {
    const onScroll = () => {
      draggingCard.current = false;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (reducedMotion) {
    return (
      <section
        id="about-globe"
        className={styles.journey}
        aria-label="Wildefy destinations around the Earth"
      >
        <div className={styles.reducedStack}>
          {DESTINATIONS.map((d, i) => (
            <article key={d.id} className={styles.reducedCard}>
              <p className={styles.eyebrow}>
                {String(i + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
              </p>
              <h3 className={styles.destName}>{d.name}</h3>
              {d.lesson ? (
                <h4 className={styles.destLesson}>{d.lesson}</h4>
              ) : null}
              {d.paragraphs?.map((p) => (
                <p key={p} className={styles.para}>
                  {p}
                </p>
              ))}
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={section}
      id="about-globe"
      className={styles.journey}
      aria-label="Wildefy destinations around the Earth"
    >
      {/* Tall runway: scroll down through all 6 cards, then the section continues down */}
      <div
        ref={wrap}
        className={styles.wrap}
        style={{ height: `${N * VH_PER_STOP}vh` }}
      >
        <div className={styles.sticky}>
          <div className={styles.sceneFrame}>
            <GlobeScene
              stage={stage}
              revision={revision}
              onActiveChange={onActiveChange}
            />
          </div>

          {DESTINATIONS.map((d, i) => (
            <DestinationCard
              key={d.id}
              dest={d}
              index={i}
              total={N}
              visible={i === active}
              side="left"
              style={cardStyleForProgress(i, progress)}
            />
          ))}

          <div className={styles.dots} aria-hidden>
            {DESTINATIONS.map((d, i) => (
              <span
                key={d.id}
                className={i === active ? styles.dotActive : styles.dot}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
