"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // Manual restoration — browser/Lenis fighting hash + pin spacers was
    // teleporting mid-map (Day 4) straight into the footer reveal.
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const lenis = new Lenis({
      // Softer settle — keep gliding after the wheel stops, then ease out
      lerp: 0.075,
      wheelMultiplier: 0.82,
      touchMultiplier: 1,
      smoothWheel: true,
      autoRaf: false,
    });

    (window as Window & { __lenis?: typeof lenis }).__lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    document.documentElement.classList.add("lenis", "lenis-smooth");
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(tick);
      const w = window as Window & { __lenis?: typeof lenis };
      if (w.__lenis === lenis) delete w.__lenis;
      lenis.destroy();
      document.documentElement.classList.remove("lenis", "lenis-smooth");
      ScrollTrigger.refresh();
    };
  }, []);

  return <>{children}</>;
}
