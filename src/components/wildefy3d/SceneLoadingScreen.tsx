"use client";

import styles from "@/components/wildefy3d/wildefy3d.module.css";

export function SceneLoadingScreen({
  progress,
  note,
}: {
  progress: number;
  note?: string | null;
}) {
  const shown = Math.max(0, Math.min(100, Math.round(progress * 100)));
  return (
    <div className={styles.loading} role="status" aria-live="polite" suppressHydrationWarning>
      <div className={styles.panel}>
        <p className={styles.brand}>Wildefy</p>
        <p className={styles.copy}>Preparing the mountain</p>
        <div className={styles.bar} aria-hidden="true">
          <span style={{ transform: `scaleX(${shown / 100})` }} />
        </div>
        <strong className={styles.percent}>{shown}%</strong>
        {note ? <p className={styles.note}>{note}</p> : null}
      </div>
    </div>
  );
}
