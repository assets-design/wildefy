"use client";

import { useEffect, useRef } from "react";
import styles from "./experiences-journey.module.css";

/** 12fps JPEG sequence from video_001.mp4 (22s @ 24fps → 264 frames). */
export const SCRUB_FRAME_COUNT = 264;
export const VIDEO_SRC = "/assets/video/video_001.mp4";
export const POSTER_SRC = "/assets/video/video_001_poster.jpg";

const FRAME_DIR = "/assets/video/video_001_frames";
const PRELOAD_RADIUS = 8;
const SEEK_EPSILON = 1 / 48;

export function frameSrc(index1Based: number) {
  const n = Math.min(SCRUB_FRAME_COUNT, Math.max(1, Math.round(index1Based)));
  return `${FRAME_DIR}/frame_${String(n).padStart(4, "0")}.jpg`;
}

/**
 * Map section scroll 0→1 across the full frame loop once.
 * Progress is section-local (pinned wrap), so the background stays in-loop here.
 */
export function frameIndexFromProgress(progress: number) {
  const p = Math.min(1, Math.max(0, progress));
  return 1 + Math.round(p * (SCRUB_FRAME_COUNT - 1));
}

type Props = {
  progress: number;
  onReady?: () => void;
  onError?: () => void;
};

/**
 * Scroll-scrubbed Experiences background.
 * Draws divided JPEG frames to a canvas (hitch-free); falls back to mp4 seeking.
 */
export function ExperiencesScrollVideo({ progress, onReady, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef(progress);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);

  progressRef.current = progress;
  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    let cancelled = false;
    let mode: "frames" | "video" = "frames";
    let ready = false;
    let drawn = 0;
    let duration = 0;
    let seeking = false;
    let seekRaf = 0;
    let videoWired = false;

    const cache = new Map<number, HTMLImageElement>();
    const loading = new Set<number>();

    const markReady = () => {
      if (cancelled || ready) return;
      ready = true;
      onReadyRef.current?.();
    };

    const markError = () => {
      if (cancelled) return;
      onErrorRef.current?.();
    };

    const drawCover = (source: CanvasImageSource, naturalW: number, naturalH: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx || naturalW <= 0 || naturalH <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.clientWidth || window.innerWidth;
      const cssH = canvas.clientHeight || window.innerHeight;
      const pixelW = Math.max(1, Math.round(cssW * dpr));
      const pixelH = Math.max(1, Math.round(cssH * dpr));
      if (canvas.width !== pixelW || canvas.height !== pixelH) {
        canvas.width = pixelW;
        canvas.height = pixelH;
      }

      const scale = Math.max(pixelW / naturalW, pixelH / naturalH);
      const drawW = naturalW * scale;
      const drawH = naturalH * scale;
      ctx.clearRect(0, 0, pixelW, pixelH);
      ctx.drawImage(source, (pixelW - drawW) / 2, (pixelH - drawH) / 2, drawW, drawH);
    };

    const ensureFrame = (index: number) => {
      if (cache.has(index) || loading.has(index)) return;
      loading.add(index);
      const img = new Image();
      img.decoding = "async";
      img.src = frameSrc(index);
      img.onload = () => {
        loading.delete(index);
        if (cancelled) return;
        cache.set(index, img);
        const active = frameIndexFromProgress(progressRef.current);
        for (const key of [...cache.keys()]) {
          if (Math.abs(key - active) > PRELOAD_RADIUS * 3) cache.delete(key);
        }
        if (index === active) {
          drawCover(img, img.naturalWidth, img.naturalHeight);
          drawn = index;
          markReady();
        }
      };
      img.onerror = () => {
        loading.delete(index);
        if (cancelled) return;
        if (index <= 2 && mode === "frames") {
          mode = "video";
          canvas.style.display = "none";
          bootVideo();
        }
      };
    };

    const preloadAround = (center: number) => {
      for (let i = center - PRELOAD_RADIUS; i <= center + PRELOAD_RADIUS; i += 1) {
        if (i >= 1 && i <= SCRUB_FRAME_COUNT) ensureFrame(i);
      }
    };

    const paintFrame = (index: number) => {
      const hit = cache.get(index);
      if (hit?.complete && hit.naturalWidth > 0) {
        drawCover(hit, hit.naturalWidth, hit.naturalHeight);
        drawn = index;
        markReady();
        return;
      }
      ensureFrame(index);
      for (let d = 1; d <= PRELOAD_RADIUS; d += 1) {
        const left = cache.get(index - d);
        if (left?.complete && left.naturalWidth > 0) {
          drawCover(left, left.naturalWidth, left.naturalHeight);
          drawn = index - d;
          return;
        }
        const right = cache.get(index + d);
        if (right?.complete && right.naturalWidth > 0) {
          drawCover(right, right.naturalWidth, right.naturalHeight);
          drawn = index + d;
          return;
        }
      }
    };

    const onVideoSeeked = () => {
      seeking = false;
      if (!Number.isFinite(duration) || duration <= 0) return;
      const desired = progressRef.current * Math.max(duration - 0.001, 0);
      if (Math.abs(video.currentTime - desired) >= SEEK_EPSILON) {
        seeking = true;
        try {
          video.currentTime = desired;
        } catch {
          seeking = false;
        }
      }
    };

    const bootVideo = () => {
      if (videoWired) return;
      videoWired = true;
      video.hidden = false;
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      video.playsInline = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.preload = "auto";
      video.pause();
      video.addEventListener("seeked", onVideoSeeked);
      video.addEventListener("error", markError);

      const readyMeta = () => {
        duration = video.duration;
        if (!Number.isFinite(duration) || duration <= 0) {
          markError();
          return;
        }
        try {
          video.currentTime = progressRef.current * Math.max(duration - 0.001, 0);
        } catch {
          // Ignore.
        }
        markReady();
      };

      if (video.readyState >= 1 && Number.isFinite(video.duration) && video.duration > 0) {
        readyMeta();
      } else {
        video.addEventListener("loadedmetadata", readyMeta, { once: true });
        try {
          video.load();
        } catch {
          // Already loading.
        }
      }
    };

    const applyProgress = () => {
      if (cancelled) return;
      const p = progressRef.current;

      if (mode === "frames") {
        const index = frameIndexFromProgress(p);
        if (index !== drawn) paintFrame(index);
        preloadAround(index);
        return;
      }

      if (!Number.isFinite(duration) || duration <= 0) return;
      if (seekRaf) return;
      seekRaf = requestAnimationFrame(() => {
        seekRaf = 0;
        const next = Math.min(Math.max(p, 0), 1) * Math.max(duration - 0.001, 0);
        if (Math.abs(video.currentTime - next) < SEEK_EPSILON) return;
        if (seeking) return;
        seeking = true;
        try {
          video.currentTime = next;
        } catch {
          seeking = false;
        }
      });
    };

    const onResize = () => {
      if (mode !== "frames") return;
      const img = cache.get(drawn || 1);
      if (img?.complete) drawCover(img, img.naturalWidth, img.naturalHeight);
    };

    window.addEventListener("resize", onResize);

    // Boot frames: first still + neighbors.
    const first = new Image();
    first.decoding = "async";
    first.src = frameSrc(1);
    first.onload = () => {
      if (cancelled) return;
      cache.set(1, first);
      drawCover(first, first.naturalWidth, first.naturalHeight);
      drawn = 1;
      markReady();
      preloadAround(1);
      applyProgress();
    };
    first.onerror = () => {
      if (cancelled) return;
      mode = "video";
      canvas.style.display = "none";
      bootVideo();
    };

    // Drive from progress updates via a cheap poll tied to rAF when parent sets progress.
    let pollRaf = 0;
    let lastProgress = -1;
    const poll = () => {
      if (cancelled) return;
      pollRaf = requestAnimationFrame(poll);
      if (progressRef.current === lastProgress) return;
      lastProgress = progressRef.current;
      applyProgress();
    };
    pollRaf = requestAnimationFrame(poll);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(pollRaf);
      if (seekRaf) cancelAnimationFrame(seekRaf);
      video.removeEventListener("seeked", onVideoSeeked);
      video.removeEventListener("error", markError);
      video.pause();
      cache.clear();
      loading.clear();
    };
  }, []);

  return (
    <div className={styles.scrollVideoScene} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.scrollVideoCanvas} />
      <video
        ref={videoRef}
        className={styles.scrollVideo}
        src={VIDEO_SRC}
        poster={POSTER_SRC}
        muted
        playsInline
        preload="metadata"
        controls={false}
        disablePictureInPicture
        tabIndex={-1}
        hidden
      />
    </div>
  );
}
