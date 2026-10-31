import type { ReactNode } from "react";
import styles from "./galleryStoryBand.module.css";

type Props = { children: ReactNode };

/**
 * One continuous sky plate behind Gallery (§3) + Our Story (§4).
 * Removes the hard patch line where two separate sky crops used to meet.
 */
export function GalleryStoryBand({ children }: Props) {
  return (
    <div className={styles.band} data-gallery-story-band="">
      <div className={styles.bg} aria-hidden="true">
        <img
          className={styles.bgImg}
          data-gallery-story-sky=""
          src="/images/story-figma/seam/sky-left.png"
          alt=""
          width={2605}
          height={630}
          draggable={false}
          decoding="async"
        />
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
