"use client";

import type { CSSProperties, MouseEvent } from "react";
import type { Experience } from "@/components/experiences/experiencesData";
import styles from "./experiences-journey.module.css";

type Props = {
  experience: Experience;
  style?: CSSProperties;
  reduced?: boolean;
};

/** Full-page routes (e.g. /world) — whole card is the hit target. */
function isPageHref(href: string) {
  return href.startsWith("/") && !href.startsWith("/#");
}

export function ExperienceJourneyCard({ experience, style, reduced }: Props) {
  const pageLink = isPageHref(experience.href);

  const ctaInner = (
    <>
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
    </>
  );

  const body = (
    <>
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
          {(reduced ? experience.tags : experience.tags.slice(0, 4)).map(
            (tag) => (
              <li key={tag}>
                <span className={styles.cardTag}>{tag}</span>
              </li>
            ),
          )}
        </ul>

        {pageLink ? (
          <span className={styles.cardCta}>{ctaInner}</span>
        ) : (
          <a
            className={styles.cardCta}
            href={experience.href}
            onClick={(event: MouseEvent<HTMLAnchorElement>) => {
              if (
                experience.href.startsWith("http") ||
                experience.href.startsWith("/")
              ) {
                event.stopPropagation();
              }
            }}
          >
            {ctaInner}
          </a>
        )}
      </div>
    </>
  );

  return (
    <article
      className={`${styles.card} ${reduced ? styles.cardStatic : ""}`}
      id={experience.id}
      style={style}
      data-side={experience.enterFrom}
      data-stage={experience.stage}
    >
      {pageLink ? (
        <a
          className={`${styles.cardFrame} ${styles.cardFrameLink}`}
          href={experience.href}
          aria-label={`${experience.title} — ${experience.cta}`}
        >
          {body}
        </a>
      ) : (
        <div className={styles.cardFrame}>{body}</div>
      )}
    </article>
  );
}
