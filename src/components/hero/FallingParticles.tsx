"use client";

import { useEffect, useRef } from "react";

type Flake = {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function particleCountForWidth(width: number) {
  if (width < 640) return 28;
  if (width < 1024) return 40;
  return 48;
}

function createFlakes(count: number, width: number, height: number): Flake[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = (i * 97) % 251;
    return {
      x: ((i * 53 + seed * 13) % 1000) / 1000 * width,
      y: ((i * 79 + seed * 7) % 1000) / 1000 * height,
      size: 0.7 + (seed % 4) * 0.35,
      speed: 14 + (seed % 9) * 5,
      drift: ((seed % 2 === 0 ? 1 : -1) * (3 + (seed % 5) * 2)) / 60,
      opacity: 0.14 + (seed % 5) * 0.06,
      wobble: seed,
      wobbleSpeed: 0.35 + (seed % 5) * 0.12,
    };
  });
}

export function FallingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    if (prefersReducedMotion()) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let flakes: Flake[] = [];
    let raf = 0;
    let last = performance.now();
    let width = 0;
    let height = 0;
    let dpr = 1;
    let running = true;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      // Prefer layout size (not transformed visual size) so the buffer
      // matches the CSS 100% box and snowfall stays dense.
      width = parent.clientWidth || window.innerWidth;
      height = parent.clientHeight || window.innerHeight;
      // Clamp floor to 1: fractional DPRs (common in scaled/embedded browsers)
      // otherwise shrink flakes below one buffer pixel and they vanish.
      dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 1.75);
      const nextW = Math.max(1, Math.floor(width * dpr));
      const nextH = Math.max(1, Math.floor(height * dpr));
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = particleCountForWidth(width);
      // Preserve continuity: remap existing flakes into new bounds when possible.
      if (flakes.length === count && width > 0 && height > 0) {
        for (const flake of flakes) {
          flake.x = ((flake.x % width) + width) % width;
          flake.y = ((flake.y % height) + height) % height;
        }
      } else {
        flakes = createFlakes(count, width, height);
      }
    };

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      ctx.clearRect(0, 0, width, height);

      for (const flake of flakes) {
        flake.wobble += flake.wobbleSpeed * dt;
        flake.y += flake.speed * dt;
        flake.x += flake.drift + Math.sin(flake.wobble) * 0.35;

        if (flake.y > height + 8) {
          flake.y = -8;
          flake.x = Math.random() * width;
        }
        if (flake.x < -8) flake.x = width + 8;
        if (flake.x > width + 8) flake.x = -8;

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 252, 245, ${flake.opacity})`;
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = window.requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        window.cancelAnimationFrame(raf);
      } else {
        running = true;
        last = performance.now();
        raf = window.requestAnimationFrame(tick);
      }
    };

    resize();
    // Stage scale / sticky layout can settle one frame later.
    const settleId = window.requestAnimationFrame(() => {
      resize();
      window.requestAnimationFrame(resize);
    });

    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    document.addEventListener("visibilitychange", onVisibility);
    last = performance.now();
    raf = window.requestAnimationFrame(tick);

    return () => {
      running = false;
      window.cancelAnimationFrame(raf);
      window.cancelAnimationFrame(settleId);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas className="journey-particles" ref={canvasRef} aria-hidden="true" />;
}
