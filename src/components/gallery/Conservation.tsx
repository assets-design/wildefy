"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./conservation.module.css";

gsap.registerPlugin(ScrollTrigger);

const ConservationEarth = dynamic(() => import("./ConservationEarth"), {
  ssr: false,
});

const UNIQUE = 5;
/** Full ring with each photo thrice — smaller cards, tighter spacing. */
const SEATS = UNIQUE * 3;
const ANGLE_STEP = 360 / SEATS;
const TURN_PER_SLIDE = 360 / UNIQUE;
const STEPS = UNIQUE;

const PHOTOS = [
  {
    src: "/images/conservation/wedge-1.png",
    alt: "A hand holding a bag of green seedlings",
  },
  {
    src: "/images/conservation/wedge-5.png",
    alt: "A seedling growing in dark soil",
  },
  {
    src: "/images/conservation/wedge-4.png",
    alt: "Sunlit tree canopy",
  },
  {
    src: "/images/conservation/wedge-3.png",
    alt: "Hands pressing soil around young plants",
  },
  {
    src: "/images/conservation/wedge-2.png",
    alt: "Hands holding a globe of wildlife and forests",
  },
] as const;

const WEDGES = Array.from({ length: SEATS }, (_, i) => ({
  ...PHOTOS[i % UNIQUE],
  homeAngle: i * ANGLE_STEP,
  key: `${PHOTOS[i % UNIQUE].src}-${i}`,
}));

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

/**
 * Match the left photo ring (scroll down: next card rises from bottom,
 * current exits to top). Copy uses the same vertical direction.
 * delta = t - index: <0 upcoming (below), >0 leaving (above).
 */
function slideMotion(t: number, index: number) {
  const n = UNIQUE;
  let delta = t - index;
  if (delta > n / 2) delta -= n;
  if (delta < -n / 2) delta += n;
  const ad = Math.abs(delta);

  let y = 0;
  let opacity = 0;

  if (ad <= 0.02) {
    y = 0;
    opacity = 1;
  } else if (delta < 0 && delta > -1) {
    // Upcoming — enter from bottom (same as image)
    y = 88 * -delta;
    opacity = Math.min(1, Math.max(0, 1 + delta * 1.45));
  } else if (delta > 0 && delta < 1) {
    // Leaving — exit upward (same as image)
    y = -72 * delta;
    opacity = Math.min(1, Math.max(0, 1 - delta * 1.45));
  } else if (delta <= -1) {
    y = 110;
    opacity = 0;
  } else {
    y = -96;
    opacity = 0;
  }

  return { opacity, y };
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Conservation() {
  const sectionRef = useRef<HTMLElement>(null);
  const earthProgress = useRef(0);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    const orbits = Array.from(
      section.querySelectorAll<HTMLElement>("[data-orbit]"),
    );
    const slides = Array.from(
      section.querySelectorAll<HTMLElement>("[data-slide]"),
    );

    const apply = (progress: number) => {
      earthProgress.current = progress;
      const t = progress * STEPS;
      const slideT = ((t % STEPS) + STEPS) % STEPS;
      const turn = -t * TURN_PER_SLIDE;
      orbits.forEach((orbit, index) => {
        orbit.style.transform = `rotate(${WEDGES[index].homeAngle + turn}deg)`;
      });
      slides.forEach((slide, index) => {
        const { opacity, y } = slideMotion(slideT, index);
        slide.style.opacity = String(opacity);
        // Centered stack like Sustainability — y is offset from vertical middle
        slide.style.transform = `translate3d(0, calc(-50% + ${y}px), 0)`;
        slide.setAttribute("aria-hidden", opacity < 0.4 ? "true" : "false");
      });
    };

    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * STEPS)}`,
        pin: true,
        pinSpacing: true,
        scrub: 0.65,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        snap: {
          snapTo: 1 / STEPS,
          duration: { min: 0.2, max: 0.55 },
          delay: 0.06,
          ease: "power2.inOut",
          directional: true,
        },
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => apply(self.progress),
        onEnterBack: (self) => apply(self.progress),
        onLeaveBack: () => apply(0),
      });

      apply(trigger.progress);

      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh, { once: true });

      return () => {
        trigger.kill();
        window.removeEventListener("load", refresh);
      };
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      className={styles.section}
      aria-label="Conservation"
      ref={sectionRef}
    >
      <div className={styles.frame}>
        <div className={styles.artViewport}>
          <div className={styles.art}>
            <div className={styles.bg} aria-hidden="true">
              <img
                src="/images/conservation/background.png"
                alt=""
                draggable={false}
              />
            </div>

            <div className={styles.wheelClip}>
              <div className={styles.ring}>
                {WEDGES.map((wedge) => (
                  <div
                    key={wedge.key}
                    className={styles.orbit}
                    data-orbit=""
                    style={{ transform: `rotate(${wedge.homeAngle}deg)` }}
                  >
                    <div className={styles.card}>
                      <div className={styles.cardInner}>
                        <img
                          src={wedge.src}
                          alt={wedge.alt}
                          draggable={false}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ConservationEarth progress={earthProgress} />

            <h2 className={styles.label}>Conservation</h2>
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
    </section>
  );
}
