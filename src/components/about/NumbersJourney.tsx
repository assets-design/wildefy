"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { NUMBERS_STORY } from "./aboutData";
import styles from "./about.module.css";
import journeyPath from "./journeyPath.json";

gsap.registerPlugin(ScrollTrigger);

const MILESTONES = NUMBERS_STORY.milestones;

/** Path-length fractions where each red milestone sits (from journeyPath.json). */
const FRACTIONS = journeyPath.fractions as number[];

/**
 * Scroll progress → active milestone index.
 * A milestone becomes active once the tracker reaches it; the last seat
 * holds through the end of the pin so Point 3 is fully readable.
 */
function milestoneIndex(progress: number) {
  const p = Math.min(1, Math.max(0, progress));
  // Activate as the tracker arrives at each seat (small lead-in so the
  // copy is readable by the time the arrow sits on the dot).
  if (p >= FRACTIONS[2] - 0.06) return 2;
  if (p >= FRACTIONS[1] - 0.05) return 1;
  return 0;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Scroll-driven journey tracker for the Numbers story.
 * Arrow position/rotation come from the same SVG path used for the dashed
 * stroke and milestone dots (getPointAtLength), so geometry stays locked.
 */
export function NumbersJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const copyRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const path = pathRef.current;
    const arrow = arrowRef.current;
    if (!section || !path || !arrow) return;

    const reduce = prefersReducedMotion();

    // Kill any prior Numbers triggers and unwrap orphaned pin-spacers
    // left by HMR / Strict Mode so a fresh pin can attach cleanly.
    ScrollTrigger.getAll().forEach((t) => {
      if (t.trigger === section) t.kill(true);
    });
    const orphan = section.parentElement;
    if (orphan?.classList.contains("pin-spacer")) {
      orphan.parentElement?.insertBefore(section, orphan);
      orphan.remove();
    }

    let activeCopy = -1;
    const applyCopy = (index: number, immediate = false) => {
      if (index === activeCopy && !immediate) return;
      activeCopy = index;
      copyRefs.current.forEach((el, i) => {
        if (!el) return;
        const on = i === index;
        el.getAnimations?.().forEach((a) => a.cancel());
        // Drive visibility via data-active + CSS (avoids stuck inline/transition fights).
        el.dataset.active = on ? "true" : "false";
        el.style.pointerEvents = on ? "auto" : "none";
        el.setAttribute("aria-hidden", on ? "false" : "true");
      });
    };

    const placeArrow = (progress: number) => {
      const len = path.getTotalLength();
      if (!len) return;
      const d = Math.min(1, Math.max(0, progress)) * len;
      const p0 = path.getPointAtLength(d);
      const p1 = path.getPointAtLength(Math.min(len, d + 1.5));
      const angle = (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI + 90;
      arrow.style.left = `${(p0.x / journeyPath.width) * 100}%`;
      arrow.style.top = `${(p0.y / journeyPath.height) * 100}%`;
      arrow.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    };

    const apply = (progress: number) => {
      placeArrow(progress);
      const idx = milestoneIndex(progress);
      applyCopy(idx);
      section.dataset.journeyProgress = progress.toFixed(3);
      section.dataset.journeyMilestone = String(idx);
    };

    copyRefs.current.forEach((el) => {
      if (!el) return;
      el.dataset.active = "false";
    });
    applyCopy(0, true);
    placeArrow(0);
    section.dataset.journeyProgress = "0.000";
    section.dataset.journeyMilestone = "0";

    if (reduce) {
      copyRefs.current.forEach((el) => {
        if (!el) return;
        el.dataset.active = "true";
        el.style.pointerEvents = "auto";
        el.setAttribute("aria-hidden", "false");
      });
      placeArrow(0);
      return;
    }

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${Math.round(window.innerHeight * 3.2)}`,
      pin: true,
      pinSpacing: true,
      scrub: 0.45,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      snap: {
        snapTo: (value) => {
          let best = FRACTIONS[0];
          let bestDist = Math.abs(value - best);
          for (const f of FRACTIONS) {
            const dist = Math.abs(value - f);
            if (dist < bestDist) {
              best = f;
              bestDist = dist;
            }
          }
          return best;
        },
        duration: { min: 0.15, max: 0.4 },
        delay: 0.04,
        ease: "power2.inOut",
      },
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    });

    apply(trigger.progress);
    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener("resize", onResize);
      trigger.kill(true);
    };
  }, []);

  return (
    <section
      className={styles.numbers}
      id="about-numbers"
      aria-labelledby="numbers-title"
      ref={sectionRef}
    >
      <div className={styles.numbersInner}>
        <h2 id="numbers-title" className={styles.sectionTitle}>
          The Numbers Were Never the Whole Story.
        </h2>
        <p className={styles.lead}>
          Hymakar’s 27-year corporate journey taught him that true leadership
          goes beyond numbers and performance. It lies in understanding people,
          recognising hidden potential, and helping individuals achieve what
          others thought was impossible.
        </p>

        <div className={styles.numbersLower}>
          <div className={styles.numbersCopy}>
            {MILESTONES.map((m, i) => (
              <div
                key={m.heading}
                className={styles.milestoneSlide}
                ref={(el) => {
                  copyRefs.current[i] = el;
                }}
                data-active={i === 0 ? "true" : "false"}
                aria-hidden={i === 0 ? "false" : "true"}
              >
                <h3 className={styles.subhead}>{m.heading}</h3>
                <p className={styles.bodyText}>{m.body}</p>
              </div>
            ))}
          </div>

          <div className={styles.graph} aria-hidden>
            <svg
              className={styles.graphSvg}
              viewBox={journeyPath.viewBox}
              preserveAspectRatio="xMidYMid meet"
              role="presentation"
            >
              <path
                ref={pathRef}
                className={styles.graphPath}
                d={journeyPath.d}
                fill="none"
              />
            </svg>

            {journeyPath.milestones.map(([x, y], i) => (
              <span
                key={`dot-${i}`}
                className={`${styles.graphDot} ${styles[`graphDot${i + 1}` as "graphDot1"]}`}
                style={{
                  left: `${(x / journeyPath.width) * 100}%`,
                  top: `${(y / journeyPath.height) * 100}%`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/about/red-dot.png" alt="" width={49} height={50} />
              </span>
            ))}

            <span className={styles.graphArrow} ref={arrowRef}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/about/nav-arrow.png"
                alt=""
                width={61}
                height={61}
              />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
