"use client";

/**
 * /v2 only — §2→§3: your cloud covers the join, then scrolls up to reveal Gallery.
 */

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { easeCloudReveal } from "@/components/experiences/ExperiencesCloudReveal";
import { V2CloudVeil } from "@/components/v2/V2CloudVeil";
import styles from "@/components/v2/v2-cloud-seam.module.css";

gsap.registerPlugin(ScrollTrigger);

const CONTENT_VH = 680;
const MIST_START_FRAC = 0.88;
const MIST_START_VH = Math.round(CONTENT_VH * MIST_START_FRAC);
const HANDOFF_VH = 90;
const WRAP_VH = MIST_START_VH + HANDOFF_VH;
const CLEAR_VH = 0.55;
const CLOSE_FRAC = 0.4;

type Props = { children: ReactNode };

export function V2HomeSeam({ children }: Props) {
  const seamRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [cover, setCover] = useState(0);
  const [lift, setLift] = useState(0);
  const [seamActive, setSeamActive] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [lifting, setLifting] = useState(false);

  useLayoutEffect(() => {
    const seam = seamRef.current;
    const pin = pinRef.current;
    if (!seam || !pin) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCover(0);
      setLift(1);
      setSeamActive(false);
      setRevealed(true);
      return;
    }

    const wrap = document.querySelector<HTMLElement>(
      "#experiences [data-experiences-wrap]",
    );
    if (!wrap) return;

    let raf = 0;
    let pendingCover = -1;
    let pendingLift = -1;

    const flush = () => {
      raf = 0;
      if (pendingCover >= 0) {
        setCover(pendingCover);
        pendingCover = -1;
      }
      if (pendingLift >= 0) {
        setLift(pendingLift);
        pendingLift = -1;
      }
    };

    const queue = (c: number, l: number) => {
      pendingCover = Math.min(1, Math.max(0, c));
      pendingLift = Math.min(1, Math.max(0, l));
      if (!raf) raf = window.requestAnimationFrame(flush);
    };

    const ctx = gsap.context(() => {
      const build = { c: 0 };
      const clear = { c: 0 };

      /* Phase A — section ends: cloud fades in and covers the join */
      gsap.to(build, {
        c: 1,
        ease: "none",
        scrollTrigger: {
          id: "v2-cloud-home-close",
          trigger: wrap,
          start: () => {
            const px = Math.round(
              wrap.offsetHeight * (MIST_START_VH / WRAP_VH),
            );
            return `top+=${px} top`;
          },
          end: "bottom top",
          scrub: 0.12,
          invalidateOnRefresh: true,
          refreshPriority: -1,
          onEnter: () => {
            setSeamActive(true);
            setRevealed(false);
            setLifting(false);
            queue(0.25, 0);
          },
          onEnterBack: () => {
            setSeamActive(true);
            setRevealed(false);
            setLifting(false);
            queue(0.25, 0);
          },
          onLeaveBack: () => {
            setSeamActive(false);
            setRevealed(false);
            setLifting(false);
            queue(0, 0);
          },
          onUpdate: (self) => {
            setSeamActive(true);
            setRevealed(false);
            setLifting(false);
            const t = self.progress;
            if (t <= CLOSE_FRAC) {
              const u = t / CLOSE_FRAC;
              queue(Math.max(0.2, 1 - (1 - u) * (1 - u)), 0);
            } else {
              queue(1, 0);
            }
          },
          onLeave: () => {
            setSeamActive(true);
            setLifting(false);
            queue(1, 0);
          },
        },
      });

      /* Phase B — cloud scrolls to top, then next section shows */
      gsap.to(clear, {
        c: 1,
        ease: "none",
        scrollTrigger: {
          id: "v2-cloud-home-lift",
          trigger: pin,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * CLEAR_VH)}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.14,
          anticipatePin: 0.5,
          invalidateOnRefresh: true,
          refreshPriority: -2,
          onEnter: () => {
            setSeamActive(true);
            setRevealed(false);
            setLifting(true);
            queue(1, 0);
          },
          onEnterBack: () => {
            setSeamActive(true);
            setRevealed(false);
            setLifting(true);
          },
          onUpdate: (self) => {
            const t = self.progress;
            if (t >= 0.995) {
              queue(0, 1);
              setRevealed(true);
              setSeamActive(false);
              setLifting(false);
              return;
            }
            setSeamActive(true);
            setLifting(true);
            const hold = 0.05;
            const end = 0.9;
            let l = 0;
            if (t <= hold) l = 0;
            else if (t < end) l = easeCloudReveal((t - hold) / (end - hold));
            else l = 1;
            queue(1 - l, l);
            setRevealed(l >= 0.97);
          },
          onLeave: () => {
            queue(0, 1);
            setRevealed(true);
            setSeamActive(false);
            setLifting(false);
          },
          onLeaveBack: () => {
            setRevealed(false);
            setSeamActive(true);
            setLifting(false);
            queue(1, 0);
          },
        },
      });
    }, seam);

    const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 200);

    return () => {
      window.clearTimeout(refreshId);
      if (raf) window.cancelAnimationFrame(raf);
      ctx.revert();
    };
  }, []);

  const showVeil = seamActive && (cover > 0.01 || (lifting && lift < 0.995));
  /* Close: cloud slides up into place. Lift: cloud scrolls off top. */
  const veilEnter = lifting ? 1 : cover;
  const veilProgress = lifting ? lift : 0;

  const mistOverlay =
    showVeil && typeof document !== "undefined"
      ? createPortal(
          <div className={styles.fixed} aria-hidden="true">
            <V2CloudVeil
              progress={veilProgress}
              enter={veilEnter}
              tone="sky"
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={seamRef}
      className={[
        styles.homeSeam,
        seamActive ? styles.homeSeamActive : "",
        revealed ? styles.homeSeamRevealed : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div ref={pinRef} className={styles.homeSeamPin}>
        <div className={styles.homeSeamContent}>{children}</div>
      </div>
      {mistOverlay}
    </div>
  );
}
