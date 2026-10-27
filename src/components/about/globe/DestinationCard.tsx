"use client";

import type { CSSProperties } from "react";
import type { Destination } from "@/lib/aboutGlobe/destinations";
import styles from "./globe.module.css";

type Props = {
  dest: Destination;
  index: number;
  total: number;
  visible: boolean;
  side: "left" | "right";
  style?: CSSProperties;
};

export function DestinationCard({
  dest,
  index,
  total,
  visible,
  side,
  style,
}: Props) {
  const sideClass = side === "left" ? styles.cardLeft : styles.cardRight;

  if (dest.lesson) {
    return (
      <article
        aria-hidden={!visible}
        className={`${styles.card} ${styles.editorial} ${sideClass}`}
        style={style}
      >
        <div className={styles.cardInner}>
          <h3 className={styles.destName}>{dest.name}</h3>
          <h4 className={styles.destLesson}>{dest.lesson}</h4>
          <div className={styles.paras}>
            {dest.paragraphs?.map((p) => (
              <p key={p} className={styles.para}>
                {p}
              </p>
            ))}
          </div>
          {dest.takeaway ? (
            <div className={styles.takeawayGroup}>
              {dest.takeaway.map((line) => (
                <p key={line} className={styles.takeaway}>
                  {line}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article
      aria-hidden={!visible}
      className={`${styles.card} ${styles.photo} ${sideClass}`}
      style={style}
    >
      <div className={styles.cardInner}>
        <p className={styles.eyebrow}>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} ·{" "}
          {dest.species}
        </p>
        <h3 className={styles.destName}>{dest.name}</h3>
        <p className={styles.blurb}>{dest.blurb}</p>
      </div>
    </article>
  );
}
