"use client";

import type { CSSProperties } from "react";
import type { Experience } from "@/components/experiences/experiencesData";
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
      <div className={styles.cardFrame}>
        <div className={styles.cardMedia}>
          <img
            src={experience.image}
            alt={experience.imageAlt}
            width={800}
            height={520}
            loading="lazy"
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

          <a className={styles.cardCta} href={experience.href}>
            <span className={styles.cardCtaLabel}>{experience.cta}</span>
            <span className={styles.cardCtaMark} aria-hidden="true">
              <img
                src="/images/hero/hummingbird.png"
                alt=""
                width={36}
                height={36}
                className={styles.cardCtaBird}
              />
            </span>
          </a>
        </div>
      </div>
    </article>
  );
}
