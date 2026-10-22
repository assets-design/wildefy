"use client";

import { useEffect, useRef } from "react";

/*
  Premium custom cursor — small solid dot + thin trailing ring.
  - Dot tracks the pointer closely; ring lerps behind it (rAF, no React state).
  - Amber (#f5a623) by default; deep forest green over the site's light
    cloud / sky sections so it stays readable on every background.
  - Only enabled for precise pointers (hover + fine) and full motion.
*/
const INTERACTIVE_SELECTOR =
  "a, button, [role='button'], input, select, textarea, label, summary";
const LIGHT_SECTION_SELECTOR = ".experiences, .sx-scroll";

function backgroundIsLight(el: Element | null): boolean {
  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    const bg = window.getComputedStyle(node).backgroundColor;
    const match = bg.match(/rgba?\(([^)]+)\)/);
    if (match) {
      const parts = match[1].split(",").map((v) => parseFloat(v));
      const [r, g, b] = parts;
      const a = parts.length > 3 ? parts[3] : 1;
      if (a > 0.15) {
        // Relative luminance (sRGB approximation).
        return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.72;
      }
    }
    node = node.parentElement;
  }
  return false;
}

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    document.documentElement.classList.add("has-custom-cursor");

    let mouseX = -100;
    let mouseY = -100;
    let dotX = -100;
    let dotY = -100;
    let ringX = -100;
    let ringY = -100;
    let ringScale = 1;
    let ringScaleTarget = 1;
    let visible = false;
    let raf = 0;
    let lastSample = 0;

    const render = () => {
      // Dot: tight tracking. Ring: softer lerp for the trailing effect.
      dotX += (mouseX - dotX) * 0.55;
      dotY += (mouseY - dotY) * 0.55;
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      ringScale += (ringScaleTarget - ringScale) * 0.18;

      dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${ringScale})`;
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    const sampleTheme = (x: number, y: number) => {
      const now = performance.now();
      if (now - lastSample < 90) return;
      lastSample = now;
      const el = document.elementFromPoint(x, y);
      if (!el) return;
      // The site's light sections (white cloud §2, warm sky story) sit over
      // photographic backdrops, so section detection is more reliable there
      // than sampling transparent element backgrounds.
      const dark =
        el.closest(LIGHT_SECTION_SELECTOR) !== null || backgroundIsLight(el);
      ring.style.setProperty("--cursor-color", dark ? "#123f32" : "#f5a623");
      dot.style.setProperty("--cursor-color", dark ? "#123f32" : "#f5a623");
    };

    const onMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      if (!visible) {
        visible = true;
        dotX = ringX = mouseX;
        dotY = ringY = mouseY;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
      sampleTheme(mouseX, mouseY);
    };

    const onMouseOver = (event: MouseEvent) => {
      const target = event.target as Element | null;
      ringScaleTarget = target?.closest(INTERACTIVE_SELECTOR) ? 1.45 : 1;
    };

    const onMouseLeave = () => {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseover", onMouseOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="custom-cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="custom-cursor-dot" aria-hidden="true" />
    </>
  );
}
