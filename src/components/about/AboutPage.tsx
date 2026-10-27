"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { FooterReveal } from "@/components/footer/FooterReveal";
import { StageFrame } from "@/components/layout/StageFrame";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { EVERY_DOT, HERO, NUMBERS_STORY, PLANET } from "./aboutData";
import styles from "./about.module.css";

const GlobeJourney = dynamic(
  () =>
    import("./globe/GlobeJourney").then((m) => m.GlobeJourney),
  { ssr: false },
);

/**
 * About Us — Figma node 585:563
 * https://www.figma.com/design/pZZEavRwbXM8gLGvMy5VIV/WIldefy?node-id=585-563
 */
export function AboutPage() {
  return (
    <div className={styles.page}>
      {/* —— Hero (Frame 12 / 591:731) —— */}
      <section className={styles.hero} id="about-hero" aria-label="About Wildefy">
        <Image
          className={styles.heroPhoto}
          src={HERO.image}
          alt={HERO.imageAlt}
          fill
          priority
          sizes="100vw"
        />
        <div className={styles.heroShade} aria-hidden />
        <div className={styles.heroStage}>
          <StageFrame>
            <div className={styles.heroInner}>
              <SiteHeader />
              <h1 className={styles.heroTitle}>{HERO.title}</h1>
            </div>
          </StageFrame>
        </div>
      </section>

      {/* —— Every Dot (Frame 13 / 591:738) —— */}
      <section
        className={styles.everyDot}
        id="about-every-dot"
        aria-labelledby="every-dot-title"
      >
        <div className={styles.everyDotInner}>
          <h2 id="every-dot-title" className={styles.sectionTitle}>
            {EVERY_DOT.title}
          </h2>
          <div className={styles.everyDotGrid}>
            <div className={styles.everyDotCopy}>
              <h3 className={styles.subhead}>{EVERY_DOT.headline}</h3>
              <p className={styles.mutedLine}>{EVERY_DOT.accent}</p>
              <div className={styles.bodyBlock}>
                {EVERY_DOT.body.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <a className={styles.ctaGroup} href={EVERY_DOT.ctaHref}>
                <span className={styles.ctaLabel}>{EVERY_DOT.ctaLabel}</span>
                <span className={styles.ctaBird} aria-hidden>
                  <Image
                    src="/images/about/hummingbird-cta.png"
                    alt=""
                    width={42}
                    height={42}
                  />
                </span>
              </a>
            </div>
            <div className={styles.portraitWrap}>
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

      {/* —— Numbers story (Frame 14 / 591:739) —— */}
      <section
        className={styles.numbers}
        id="about-numbers"
        aria-labelledby="numbers-title"
      >
        <div className={styles.numbersInner}>
          <h2 id="numbers-title" className={styles.sectionTitle}>
            {NUMBERS_STORY.title}
          </h2>
          <p className={styles.lead}>{NUMBERS_STORY.lead}</p>
          <div className={styles.numbersLower}>
            <div className={styles.numbersCopy}>
              <h3 className={styles.subhead}>{NUMBERS_STORY.subhead}</h3>
              <p className={styles.bodyText}>{NUMBERS_STORY.body}</p>
            </div>
            <div className={styles.graph} aria-hidden>
              <div className={styles.graphTrack}>
                <Image
                  className={styles.graphLine}
                  src="/images/about/graph-wave.png"
                  alt=""
                  width={1375}
                  height={401}
                  sizes="(max-width: 1023px) 100vw, 62vw"
                />
              </div>
              <span className={`${styles.graphDot} ${styles.graphDot1}`}>
                <Image src="/images/about/red-dot.png" alt="" width={49} height={50} />
              </span>
              <span className={`${styles.graphDot} ${styles.graphDot2}`}>
                <Image src="/images/about/red-dot.png" alt="" width={49} height={50} />
              </span>
              <span className={`${styles.graphDot} ${styles.graphDot3}`}>
                <Image src="/images/about/red-dot.png" alt="" width={49} height={50} />
              </span>
              <span className={styles.graphArrow}>
                <Image
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

      {/* —— Spreadsheet → Planet (Frame 15 / 591:740) —— */}
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
                <p className={styles.metricValue}>{m.value}</p>
                <p className={styles.metricLabel}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* —— 3D globe journey (from Lovable Pixel Perfect Replica 95) —— */}
      <GlobeJourney />

      <FooterReveal />
    </div>
  );
}
