"use client";

import { storyboardUrl } from "@/config/wildefySceneManifest";
import styles from "@/components/wildefy3d/wildefy3d.module.css";

export function SceneFallback({
  reason,
  onRetry,
}: {
  reason: string;
  onRetry: () => void;
}) {
  return (
    <div className={styles.fallback} role="alert">
      <div>
        <figure className={styles.shot}>
          <img src={storyboardUrl("01_opening_aerial.jpg")} alt="" />
        </figure>
        <div className={styles.panel}>
          <p className={styles.brand}>Wildefy</p>
          <p className={styles.copy}>{reason}</p>
          <p className={styles.note}>
            Static fallback. This still is storyboard frame 01, not the 3D walk.
          </p>
          <button className={styles.button} type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
