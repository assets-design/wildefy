"use client";

import { useLayoutEffect, useRef } from "react";

const STAGE_WIDTH = 1920;
const MOBILE_MAX = 1023;

export function readStageScale() {
  const vw = document.documentElement.clientWidth;
  if (vw <= MOBILE_MAX) return 1;
  return Math.min(1, vw / STAGE_WIDTH);
}

export function applyStage(frame: HTMLElement) {
  const scale = readStageScale();
  const vh = document.documentElement.clientHeight;
  document.documentElement.style.setProperty("--stage-scale", String(scale));
  document.documentElement.style.setProperty("--stage-visible", `${vh / scale}px`);
  frame.style.height = "100%";
}

export function StageFrame({ children }: { children: React.ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    let timer = 0;
    const update = () => applyStage(frame);
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(update, 80);
    };

    update();
    // Observe the frame (viewport shell), not the scaled stage — avoids
    // height feedback loops when --stage-visible updates hero size.
    const observer = new ResizeObserver(onResize);
    observer.observe(frame);
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="stage-frame" ref={frameRef}>
      <div className="stage">{children}</div>
    </div>
  );
}
