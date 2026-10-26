"use client";

import { STORYBOARD_META, storyboardUrl } from "@/config/wildefySceneManifest";
import styles from "@/components/wildefy3d/wildefy3d.module.css";

export function StoryboardReference({ frame, enabled }: { frame: number; enabled: boolean }) {
  if (process.env.NODE_ENV === "production" || !enabled) return null;
  const meta = STORYBOARD_META.find((item) => item.frame === frame) ?? STORYBOARD_META[0];
  return (
    <div className={styles.compare}>
      <img src={storyboardUrl(meta.file)} alt="" />
      <span>Dev reference {String(meta.frame).padStart(2, "0")}</span>
    </div>
  );
}
