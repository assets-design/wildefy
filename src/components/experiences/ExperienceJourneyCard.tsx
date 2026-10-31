"use client";

import type { CSSProperties } from "react";
import type { Experience } from "@/components/experiences/experiencesData";
import GlassSurface from "@/components/ui/GlassSurface";
import { CtaLink } from "@/components/ui/CtaLink";
import styles from "./experiences-journey.module.css";

type Props = {
  experience: Experience;
  style?: CSSProperties;
  reduced?: boolean;
};

export function ExperienceJourneyCard({ experience, style, reduced }: Props) {
  return (
    <article
      className={`${styles.card} ${reduced ? styles.cardStatic : ""}`}
      id={experience.id}
      style={style}
      data-side={experience.enterFrom}
      data-stage={experience.stage}
    >
      <GlassSurface
        width="100%"
        height="auto"
        borderRadius={16}
        borderWidth={0.04}
        distortionScale={-120}
        displace={3}
        backgroundOpacity={0.18}
        saturation={1.35}
        brightness={52}
        opacity={0.88}
        blur={40}
        /* Frosted glassmorphism — heavy backdrop blur over the journey film */
        refraction={false}
        className={styles.cardGlass}
      >
        <div className={styles.cardMedia}>
          <img
            src={experience.image}
            alt={experience.imageAlt}
            width={800}
            height={520}
            loading={reduced ? "lazy" : "eager"}
            decoding="async"
            draggable={false}
          />
        </div>

        <div className={styles.cardBody}>
          <h3 className={styles.cardTitle}>{experience.title}</h3>

          <ul className={styles.cardTags}>
            {experience.tags.map((tag) => (
              <li key={tag}>
                <span className={styles.cardTag}>{tag}</span>
              </li>
            ))}
          </ul>

          <CtaLink href={experience.href} className={styles.cardCta}>
            {experience.cta}
          </CtaLink>
        </div>
      </GlassSurface>
    </article>
  );
}
