"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./conservation.module.css";

gsap.registerPlugin(ScrollTrigger);

/* Slot angles around the disc, top → bottom. 0° is the center photo. */
const SLOT_ANGLES = [53.21, 25.9, -0.17, -26.14, -53.39];
const STEPS = 4;

const WEDGES = [
  {
    src: "/images/conservation/wedge-3.png",
    alt: "Hands pressing soil around young plants",
    className: styles.wedgeC,
    homeSlot: 0,
  },
  {
    src: "/images/conservation/wedge-2.png",
    alt: "Hands holding a globe of wildlife and forests",
    className: styles.wedgeB,
    homeSlot: 1,
  },
  {
    src: "/images/conservation/wedge-1.png",
    alt: "A hand holding a bag of green seedlings",
    className: styles.wedgeA,
    homeSlot: 2,
  },
  {
    src: "/images/conservation/wedge-5.png",
    alt: "A seedling growing in dark soil",
    className: styles.wedgeE,
    homeSlot: 3,
  },
  {
    src: "/images/conservation/wedge-4.png",
    alt: "Sunlit tree canopy",
    className: styles.wedgeD,
    homeSlot: 4,
  },
] as const;

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

function pathFor(homeSlot: number) {
  const angles = [SLOT_ANGLES[homeSlot]];
  let slot = homeSlot;
  let prev = angles[0];
  for (let step = 0; step < 5; step++) {
    slot = (slot + 4) % 5;
    let next = SLOT_ANGLES[slot];
    while (next <= prev + 0.01) next += 360;
    angles.push(next);
    prev = next;
  }
  return angles;
}

const PATHS = WEDGES.map((wedge) => pathFor(wedge.homeSlot));

function angleFor(path: number[], t: number) {
  const max = path.length - 1;
  const clamped = Math.min(max, Math.max(0, t));
  const index = Math.min(max - 1, Math.floor(clamped));
  const fraction = clamped - index;
  return path[index] + (path[index + 1] - path[index]) * fraction;
}

function slideOpacity(t: number, index: number) {
  const distance = Math.abs(t - index);
  if (distance <= 0.28) return 1;
  if (distance >= 0.72) return 0;
  return 1 - (distance - 0.28) / 0.44;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Conservation() {
  const sectionRef = useRef<HTMLElement>(null);

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
      const t = Math.min(STEPS, Math.max(0, progress * STEPS));
      orbits.forEach((orbit, index) => {
        const natural = PATHS[index][0];
        const angle = angleFor(PATHS[index], t);
        orbit.style.transform = `rotate(${natural - angle}deg)`;
      });
      slides.forEach((slide, index) => {
        const opacity = slideOpacity(t, index);
        slide.style.opacity = String(opacity);
        slide.setAttribute("aria-hidden", opacity < 0.45 ? "true" : "false");
      });
    };

    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * 4)}`,
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
        },
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => apply(self.progress),
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

            <div className={styles.wheel}>
              {WEDGES.map((wedge) => (
                <div
                  key={wedge.src}
                  className={styles.orbit}
                  data-orbit=""
                >
                  <div className={`${styles.wedge} ${wedge.className}`}>
                    <div className={styles.wedgeInner}>
                      <img src={wedge.src} alt={wedge.alt} draggable={false} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.discSlot} aria-hidden="true">
              <div className={styles.discRot}>
                <div className={styles.discHalf}>
                  <img
                    src="/images/conservation/disc.svg"
                    alt=""
                    draggable={false}
                  />
                </div>
              </div>
            </div>

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
