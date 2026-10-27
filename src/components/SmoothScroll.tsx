"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Extra coast after wheel/touch settles (~10% of viewport). */
const COAST_VH = 0.1;
const COAST_IDLE_MS = 140;
const COAST_DURATION = 1.2;

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const lenis = new Lenis({
      // Lower lerp = longer glide after input stops
      lerp: 0.068,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.05,
      smoothWheel: true,
      autoRaf: false,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    let lastDeltaY = 0;
    let coastTimer: ReturnType<typeof setTimeout> | null = null;
    let coasting = false;

    const clearCoastTimer = () => {
      if (coastTimer !== null) {
        clearTimeout(coastTimer);
        coastTimer = null;
      }
    };

    const onVirtualScroll = ({ deltaY }: { deltaY: number }) => {
      if (coasting) return;
      if (Math.abs(deltaY) > 0.4) {
        lastDeltaY = deltaY;
      }

      clearCoastTimer();
      coastTimer = setTimeout(() => {
        coastTimer = null;
        if (Math.abs(lastDeltaY) < 1.2) return;

        const direction = Math.sign(lastDeltaY) || 1;
        const coastPx = direction * window.innerHeight * COAST_VH;
        lastDeltaY = 0;
        coasting = true;

        lenis.scrollTo(lenis.targetScroll + coastPx, {
          duration: COAST_DURATION,
          easing: (t) => 1 - Math.pow(1 - t, 3),
          onComplete: () => {
            coasting = false;
          },
        });
      }, COAST_IDLE_MS);
    };

    lenis.on("virtual-scroll", onVirtualScroll);
    document.documentElement.classList.add("lenis", "lenis-smooth");
    ScrollTrigger.refresh();

    return () => {
      clearCoastTimer();
      gsap.ticker.remove(tick);
      lenis.off("virtual-scroll", onVirtualScroll);
      lenis.destroy();
      document.documentElement.classList.remove("lenis", "lenis-smooth");
      ScrollTrigger.refresh();
    };
  }, []);

  return <>{children}</>;
}
