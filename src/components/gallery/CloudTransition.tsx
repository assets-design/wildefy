"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/*
  Short cloudy-sky divider between the horizontal storytelling sequence
  and the vertical gallery. Lives in normal document flow, outside the
  story track, overlapping both neighbours by half its height so there
  is no hard boundary. Scroll-scrubbed: fades in as the horizontal
  sequence ends, drifts gently, and clears as the gallery arrives.
  Reuses the site's existing transparent cloud asset.
*/
export function CloudTransition() {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const back = el.querySelector(".cloud-transition-layer--back");
      const front = el.querySelector(".cloud-transition-layer--front");

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      // Fade the band in as it approaches, then let it thin out again
      // once it has scrolled past so it never lingers over the gallery.
      tl.fromTo(
        el,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.35, immediateRender: false },
        0,
      ).to(el, { autoAlpha: 0.55, duration: 0.4 }, 0.6);

      // Two layers drift in opposite directions at different rates,
      // rising slightly against the scroll for atmospheric depth.
      if (back) {
        tl.fromTo(
          back,
          { x: -34, y: 16 },
          { x: 22, y: -16, duration: 1, force3D: true },
          0,
        );
      }
      if (front) {
        tl.fromTo(
          front,
          { x: 28, y: 24 },
          { x: -30, y: -24, duration: 1, force3D: true },
          0,
        );
      }
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div className="cloud-transition" aria-hidden="true" ref={ref}>
      <img
        className="cloud-transition-layer cloud-transition-layer--back"
        src="/images/clouds-no-bg.png"
        alt=""
        width={1984}
        height={590}
        draggable={false}
      />
      <img
        className="cloud-transition-layer cloud-transition-layer--front"
        src="/images/clouds-section.png"
        alt=""
        width={1600}
        height={2600}
        draggable={false}
      />
    </div>
  );
}
