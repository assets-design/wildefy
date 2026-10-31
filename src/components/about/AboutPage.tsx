"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FooterReveal } from "@/components/footer/FooterReveal";
import { StageFrame } from "@/components/layout/StageFrame";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { EVERY_DOT, HERO, PLANET } from "./aboutData";
import { NumbersJourney } from "./NumbersJourney";
import { CountUp } from "@/components/ui/CountUp";
import styles from "./about.module.css";

gsap.registerPlugin(ScrollTrigger);

const GlobeJourney = dynamic(
  () =>
    import("./globe/GlobeJourney").then((m) => m.GlobeJourney),
  { ssr: false },
);

/**
 * About Us — Figma node 585:563
 * Hero → Every Dot: solid white color reveal (section has no bg image).
 * No filament, no title morph — only veil + hero collapse + content settle.
 */
export function AboutPage() {
  const seamRef = useRef<HTMLDivElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    const seam = seamRef.current;
    if (!seam) return;

    const hero = seam.querySelector<HTMLElement>("[data-seam-hero]");
    const heroShade = seam.querySelector<HTMLElement>("[data-seam-shade]");
    const heroTitle = seam.querySelector<HTMLElement>("[data-seam-hero-title]");
    const paperVeil = seam.querySelector<HTMLElement>("[data-seam-veil]");
    const sectionTitle = seam.querySelector<HTMLElement>("#every-dot-title");
    const copy = seam.querySelector<HTMLElement>("[data-seam-copy]");
    const portrait = seam.querySelector<HTMLElement>("[data-seam-portrait]");
    const intro = seam.querySelector<HTMLElement>(`.${styles.seamIntro}`);

    if (
      !hero ||
      !heroTitle ||
      !paperVeil ||
      !sectionTitle ||
      !copy ||
      !portrait ||
      !intro
    ) {
      return;
    }

    const markComplete = (on: boolean) => {
      seam.classList.toggle(styles.seamComplete, on);
    };

    const ctx = gsap.context(() => {
      if (reduceMotion) {
        gsap.set(heroTitle, { autoAlpha: 0 });
        gsap.set(hero, { autoAlpha: 0, height: 0, minHeight: 0 });
        gsap.set(paperVeil, { autoAlpha: 0 });
        gsap.set(intro, {
          marginTop: 0,
          paddingTop: "clamp(4rem, 8.3vw, 10rem)",
        });
        markComplete(true);
        return;
      }

      markComplete(false);
      gsap.set([sectionTitle, copy, portrait], { autoAlpha: 0 });
      gsap.set(paperVeil, { autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          id: "about-every-dot-seam",
          trigger: seam,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * 0.75)}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.45,
          anticipatePin: 0.4,
          invalidateOnRefresh: true,
          refreshPriority: 0,
          onUpdate: (self) => {
            markComplete(self.progress > 0.9);
          },
          onLeave: () => markComplete(true),
          onLeaveBack: () => markComplete(false),
        },
      });

      /* White color veil only — no filament, no title morph */
      if (heroShade) {
        tl.to(heroShade, { autoAlpha: 0.2, duration: 0.3 }, 0.05);
      }
      tl.to(paperVeil, { autoAlpha: 1, duration: 0.4 }, 0.08);
      tl.to(heroTitle, { autoAlpha: 0, duration: 0.15 }, 0.28);

      /* Section content appears in place (no slide-in); hero collapses */
      tl.to([sectionTitle, copy, portrait], { autoAlpha: 1, duration: 0.25 }, 0.45);
      tl.to(
        hero,
        {
          autoAlpha: 0,
          height: 0,
          minHeight: 0,
          duration: 0.28,
        },
        0.5,
      );
      tl.to(
        intro,
        {
          marginTop: 0,
          paddingTop: "clamp(4rem, 8.3vw, 10rem)",
          duration: 0.28,
        },
        0.5,
      );
    }, seam);

    const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 80);
    return () => {
      window.clearTimeout(refreshId);
      ctx.revert();
    };
  }, [reduceMotion]);

  return (
    <div className={styles.page}>
      <div className={styles.seam} ref={seamRef}>
        <section
          className={styles.hero}
          id="about-hero"
          aria-label="About Wildefy"
          data-seam-hero
        >
          <Image
            className={styles.heroPhoto}
            src={HERO.image}
            alt={HERO.imageAlt}
            fill
            priority
            sizes="100vw"
          />
          <div className={styles.heroShade} aria-hidden data-seam-shade />
          <div className={styles.heroStage}>
            <StageFrame>
              <div className={styles.heroInner}>
                <SiteHeader />
                <h1 className={styles.heroTitle} data-seam-hero-title>
                  {HERO.title}
                </h1>
              </div>
            </StageFrame>
          </div>
        </section>

        <div className={styles.seamCanvas} aria-hidden="true">
          {/* Color-only veil — everyDot background is #ffffff, no section bg image */}
          <div className={styles.paperVeil} data-seam-veil />
        </div>

        <section
          className={`${styles.everyDot} ${styles.seamIntro}`}
          id="about-every-dot"
          aria-labelledby="every-dot-title"
        >
          <div className={styles.everyDotInner}>
            <h2 id="every-dot-title" className={styles.sectionTitle}>
              {EVERY_DOT.title}
            </h2>
            <div className={styles.everyDotGrid}>
              <div className={styles.everyDotCopy} data-seam-copy>
                <h3 className={styles.subhead}>{EVERY_DOT.headline}</h3>
                <p className={styles.mutedLine}>{EVERY_DOT.accent}</p>
                <div className={styles.bodyBlock}>
                  {EVERY_DOT.body.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                <a className={`cta ${styles.ctaGroup}`} href={EVERY_DOT.ctaHref}>
                  <span className="cta-pill" aria-hidden="true" />
                  <span className="cta-label">{EVERY_DOT.ctaLabel}</span>
                  <span className="cta-mark" aria-hidden="true">
                    <img
                      className="cta-bird"
                      src="/images/hero/hummingbird.png"
                      alt=""
                      width={37}
                      height={37}
                      draggable={false}
                    />
                  </span>
                </a>
              </div>
              <div className={styles.portraitWrap} data-seam-portrait>
                <Image
                  className={styles.portrait}
                  src={EVERY_DOT.portrait}
                  alt={EVERY_DOT.portraitAlt}
                  width={830}
                  height={553}
                  sizes="(max-width: 1023px) 100vw, 43vw"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <NumbersJourney />

      <section
        className={styles.planet}
        id="about-planet"
        aria-labelledby="planet-title"
      >
        <div className={styles.planetInner}>
          <h2 id="planet-title" className={styles.sectionTitle}>
            {PLANET.title}
          </h2>
          <div className={styles.planetBody}>
            {PLANET.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className={styles.metrics}>
            {PLANET.metrics.map((m) => (
              <div className={styles.metric} key={m.label}>
                <CountUp
                  as="p"
                  className={styles.metricValue}
                  value={m.value}
                />
                <p className={styles.metricLabel}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <GlobeJourney />

      <FooterReveal />
    </div>
  );
}
