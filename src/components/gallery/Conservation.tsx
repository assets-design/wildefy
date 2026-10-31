"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CONSERVATION_FIRST_HOLD_VH,
  STORY_SEAM_CLEAR_VH,
} from "@/components/story/storySeamConstants";
import styles from "./conservation.module.css";

gsap.registerPlugin(ScrollTrigger);

const ConservationEarth = dynamic(() => import("./ConservationEarth"), {
  ssr: false,
});

const SLIDE_COUNT = 5;
/**
 * Same vertical grammar as Awards sustainability hold:
 * steps = slideCount − 1, 0.95vh per step, scrub 1.25, no snap.
 */
const VERTICAL_STEPS = SLIDE_COUNT - 1;
const VERTICAL_VH_PER_STEP = 0.95;

const SLIDES = [
  {
    title: "Protects Wildlife & Habitats",
    body: "Ensures a safe future for species and their natural homes by protecting ecosystems, preserving biodiversity, and supporting wildlife conservation.",
  },
  {
    title: "Preserves Nature for Generations",
    body: "Encourages responsible choices that reduce environmental impact, protect natural resources, and create a more sustainable future.",
  },
  {
    title: "Explore Without Leaving a Trace",
    body: "Promotes mindful travel experiences that respect wildlife, protect fragile habitats, and support the communities connected to them.",
  },
  {
    title: "Helps Nature Thrive Again",
    body: "Supports the restoration of damaged ecosystems, nurtures new growth, and helps natural landscapes recover and flourish.",
  },
  {
    title: "Connects People with Nature",
    body: "Builds awareness of the natural world through meaningful experiences that encourage people to understand, value, and protect the planet.",
  },
] as const;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Same copy motion as Awards applyVertical texts —
 * scroll down: next rises from below, current exits upward.
 */
function slideMotion(t: number, index: number) {
  const d = index - t;
  const ad = Math.abs(d);
  let y = 0;
  let opacity = 0;

  if (ad <= 0.02) {
    y = 0;
    opacity = 1;
  } else if (d < 0 && d > -1) {
    y = 56 * d;
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

  return { opacity, y };
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type ConservationProps = {
  /** When false, skip StorySeam clear/hold intro (used by /v2). Default true. */
  seamReveal?: boolean;
};

export function Conservation({ seamReveal = true }: ConservationProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const earthProgress = useRef(0);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    if (!section || !pin || prefersReducedMotion()) return;

    const slides = Array.from(
      section.querySelectorAll<HTMLElement>("[data-slide]"),
    );

    const introPx = () =>
      seamReveal
        ? Math.round(
            window.innerHeight *
              (STORY_SEAM_CLEAR_VH + CONSERVATION_FIRST_HOLD_VH),
          )
        : 0;

    const contentPx = () =>
      Math.round(window.innerHeight * VERTICAL_VH_PER_STEP * VERTICAL_STEPS);

    const getVerticalPx = () => Math.max(1, introPx() + contentPx());

    const contentProgressFromPin = (pinProgress: number) => {
      const introFrac = introPx() / Math.max(1, getVerticalPx());
      if (pinProgress <= introFrac) return 0;
      return clamp(
        (pinProgress - introFrac) / Math.max(0.0001, 1 - introFrac),
        0,
        1,
      );
    };

    const apply = (pinProgress: number) => {
      const contentP = contentProgressFromPin(pinProgress);
      earthProgress.current = contentP;
      const t = contentP * VERTICAL_STEPS;
      slides.forEach((slide, index) => {
        const { opacity, y } = slideMotion(t, index);
        slide.style.opacity = String(opacity);
        slide.style.transform = `translate3d(0, calc(-50% + ${y}px), 0)`;
        slide.setAttribute("aria-hidden", opacity < 0.4 ? "true" : "false");
      });
    };

    const ctx = gsap.context(() => {
      /**
       * Allow bottom overflow into Awards; top is clipped via artViewport
       * clip-path so Earth never paints over Story.
       */
      const keepBottomTravelOpen = () => {
        pin.style.overflow = "visible";
        const spacer = pin.parentElement;
        if (spacer?.classList.contains("pin-spacer")) {
          spacer.style.overflow = "visible";
        }
      };

      const trigger = ScrollTrigger.create({
        id: "conservation-pin",
        trigger: pin,
        start: "top top",
        end: () => `+=${getVerticalPx()}`,
        pin: true,
        pinSpacing: true,
        /* Longer scrub = softer Story→Conservation rise + slide blend */
        scrub: 2,
        anticipatePin: 0,
        invalidateOnRefresh: true,
        refreshPriority: -4,
        fastScrollEnd: true,
        onUpdate: (self) => {
          keepBottomTravelOpen();
          apply(self.progress);
        },
        onRefresh: (self) => {
          keepBottomTravelOpen();
          apply(self.progress);
        },
        onEnter: (self) => {
          keepBottomTravelOpen();
          apply(self.progress);
        },
        onEnterBack: (self) => {
          keepBottomTravelOpen();
          apply(self.progress);
        },
        onLeave: () => keepBottomTravelOpen(),
        onLeaveBack: (self) => apply(self.progress),
      });

      /*
        When Conservation starts entering, snap it to the top in 0.1s —
        no need to scroll the rest of the way normally.
      */
      let snapLock = false;
      const snapToTop = () => {
        if (snapLock || prefersReducedMotion()) return;
        const top = trigger.start;
        const delta = Math.abs(window.scrollY - top);
        if (delta < 8) return;
        snapLock = true;
        const lenis = (
          window as Window & {
            __lenis?: { scrollTo: (v: number, o?: object) => void };
          }
        ).__lenis;
        if (lenis) {
          lenis.scrollTo(top, { duration: 0.1, force: true });
        } else {
          const state = { y: window.scrollY };
          gsap.to(state, {
            y: top,
            duration: 0.1,
            ease: "power2.out",
            onUpdate: () => window.scrollTo(0, state.y),
          });
        }
        window.setTimeout(() => {
          snapLock = false;
        }, 180);
      };

      const snapIn = ScrollTrigger.create({
        id: "conservation-snap-in",
        trigger: pin,
        /* Fires as soon as the section begins to enter the viewport */
        start: "top bottom",
        end: "top top",
        invalidateOnRefresh: true,
        refreshPriority: -4,
        onEnter: (self) => {
          if (self.direction === 1) snapToTop();
        },
      });

      apply(trigger.progress);
      keepBottomTravelOpen();

      const refreshLater = window.setTimeout(
        () => ScrollTrigger.refresh(),
        320,
      );

      let refreshQueued = false;
      const ro = new ResizeObserver(() => {
        if (refreshQueued) return;
        refreshQueued = true;
        requestAnimationFrame(() => {
          refreshQueued = false;
          trigger.refresh();
        });
      });
      ro.observe(pin);

      return () => {
        window.clearTimeout(refreshLater);
        ro.disconnect();
        snapIn.kill();
        trigger.kill();
      };
    }, section);

    return () => ctx.revert();
  }, [seamReveal]);

  return (
    <section
      className={styles.section}
      aria-label="Conservation"
      ref={sectionRef}
    >
      <div className={styles.pin} ref={pinRef} data-conservation-pin="">
        <div className={styles.frame}>
          <div className={styles.artViewport}>
            <div className={styles.art}>
              <ConservationEarth progress={earthProgress} />
            </div>
          </div>

          <div className={styles.copy} aria-live="polite">
            {SLIDES.map((slide, index) => (
              <div
                key={slide.title}
                className={styles.slide}
                data-slide=""
                aria-hidden={index === 0 ? "false" : "true"}
              >
                <h3 className={styles.title}>{slide.title}</h3>
                <p className={styles.lead}>{slide.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
