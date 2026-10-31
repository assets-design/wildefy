"use client";

/**
 * HomeSeam — close mist shortly after §2 cards end, then reveal §3.
 *
 * Sequence: card 4 ends → mist closes over sticky §2 (Gallery still below) →
 * Gallery parks under full mist → short pin reveals §3.
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
import {
  ExperiencesCloudReveal,
  easeCloudReveal,
} from "@/components/experiences/ExperiencesCloudReveal";
import { NatGeoCloudDissolve } from "@/components/experiences/NatGeoCloudDissolve";
import styles from "@/components/experiences/experiences-journey.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Experiences card runway (progress clamp) — keep full section scroll. */
const CONTENT_VH = 680;
/**
 * Start mist as card 4 leaves (card4.to = 0.98). Use 0.90 so clouds are
 * already building when the card finishes exiting — over sticky §2, not when
 * Gallery hits the top.
 */
const MIST_START_FRAC = 0.9;
const MIST_START_VH = Math.round(CONTENT_VH * MIST_START_FRAC);
/**
 * Close runway while sticky §2 still fills the screen and Gallery stays
 * below the fold — longer for slow-motion transition start.
 */
const HANDOFF_VH = 130;
const WRAP_VH = MIST_START_VH + HANDOFF_VH;
/**
 * Pin: mist clear + brief hold with Gallery fully framed before release.
 * Hold after clear prevents §3 tearing straight into §4.
 */
const CLEAR_VH = 0.42;
/** Front-load close so mist is obvious as soon as card 4 ends. */
const CLOSE_FRAC = 0.28;

type Props = { children: ReactNode };

export function HomeSeam({ children }: Props) {
  const seamRef = useRef<HTMLDivElement>(null);
  /* Pin target — separate from seam so GSAP never zeros seam margin/z */
  const pinRef = useRef<HTMLDivElement>(null);
  const [cover, setCover] = useState(0);
  const [seamActive, setSeamActive] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useLayoutEffect(() => {
    const seam = seamRef.current;
    const pin = pinRef.current;
    if (!seam || !pin) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCover(0);
      setSeamActive(false);
      setRevealed(true);
      return;
    }

    const wrap = document.querySelector<HTMLElement>(
      "#experiences [data-experiences-wrap]",
    );
    if (!wrap) return;

    let raf = 0;
    let pending = -1;

    const flush = () => {
      raf = 0;
      if (pending < 0) return;
      const c = pending;
      pending = -1;
      setCover(c);
    };

    const queueCover = (c: number) => {
      pending = Math.min(1, Math.max(0, c));
      if (!raf) raf = window.requestAnimationFrame(flush);
    };

    const ctx = gsap.context(() => {
      const build = { c: 0 };
      const clear = { c: 0 };

      /* Phase A — close over sticky §2 as card 4 ends; hold until Gallery parks. */
      gsap.to(build, {
        c: 1,
        ease: "none",
        scrollTrigger: {
          id: "home-seam-close",
          trigger: wrap,
          /* Use measured wrap height so mist tracks card progress, not stale vh */
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
            /* Visible immediately — don't wait for scrub to climb past 0.02 */
            queueCover(0.22);
          },
          onEnterBack: () => {
            setSeamActive(true);
            setRevealed(false);
            queueCover(0.22);
          },
          onLeaveBack: () => {
            setSeamActive(false);
            setRevealed(false);
            queueCover(0);
          },
          onUpdate: (self) => {
            setSeamActive(true);
            setRevealed(false);
            const t = self.progress;
            if (t <= CLOSE_FRAC) {
              const u = t / CLOSE_FRAC;
              /* Ease-out so dense cover hits before Gallery reaches the fold */
              queueCover(Math.max(0.22, 1 - (1 - u) * (1 - u)));
            } else {
              queueCover(1);
            }
          },
          onLeave: () => {
            setSeamActive(true);
            queueCover(1);
          },
        },
      });

      /* Phase B — pin inner shell only; outer seam keeps stacking + exit pull. */
      gsap.to(clear, {
        c: 1,
        ease: "none",
        scrollTrigger: {
          id: "home-seam-reveal",
          trigger: pin,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * CLEAR_VH)}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.16,
          anticipatePin: 0.5,
          invalidateOnRefresh: true,
          refreshPriority: -2,
          onEnter: () => {
            setSeamActive(true);
            setRevealed(false);
            queueCover(1);
          },
          onEnterBack: () => {
            setSeamActive(true);
            setRevealed(false);
          },
          onUpdate: (self) => {
            const t = self.progress;
            /* Past pin — drop seam stacking so Story can take the viewport */
            if (t >= 0.995) {
              queueCover(0);
              setRevealed(true);
              setSeamActive(false);
              return;
            }
            setSeamActive(true);
            /*
             * 0–04%: hold dense mist
             * 04–90%: cloud clear (same easeCloudReveal curve)
             * 90–100%: Gallery held fully clear before pin releases into §4
             */
            const mistHold = 0.04;
            const clearEnd = 0.9;
            let coverNow: number;
            if (t <= mistHold) {
              coverNow = 1;
            } else if (t < clearEnd) {
              const clearT = (t - mistHold) / (clearEnd - mistHold);
              coverNow = 1 - easeCloudReveal(clearT);
            } else {
              coverNow = 0;
            }
            queueCover(coverNow);
            setRevealed(coverNow <= 0.03);
          },
          onLeave: () => {
            queueCover(0);
            setRevealed(true);
            setSeamActive(false);
            /* No refresh here — it re-applied pin inline styles over Story. */
          },
          onLeaveBack: () => {
            setRevealed(false);
            setSeamActive(true);
            queueCover(1);
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

  const cloudProgress = 1 - cover;
  /* Mount for the whole active seam — including the first frames at card 4 end */
  const showCloud = seamActive && cover > 0.001;
  /* Opaque sky plate once dense — blocks underwater through dissolve holes */
  const dense = cover >= 0.85;

  const softFillStyle = {
    opacity: dense ? 1 : Math.min(1, cover * 1.15),
    backgroundColor: `color-mix(in srgb, #c5dde8 ${Math.round(cover * 55)}%, #eef3f4)`,
  };

  /*
   * Portal mist to document.body. GSAP pin writes transform on the inner
   * pin shell; body portal keeps inset:0 = viewport.
   */
  const mistOverlay =
    showCloud && typeof document !== "undefined"
      ? createPortal(
          <div className={styles.cloudHandoffFixed} aria-hidden="true">
            <div className={styles.handoffSoftFill} style={softFillStyle} />
            <NatGeoCloudDissolve progress={cloudProgress} />
            <ExperiencesCloudReveal
              progress={cloudProgress}
              mode="enter"
              variant="handoff"
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
