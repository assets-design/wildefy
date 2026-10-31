"use client";

/**
 * ExperiencesScrollVideo
 *
 * Reliable scroll-scrubbed background using pre-extracted JPEG frames.
 * Progress 0→1 maps to frames 1→264, covering the full video.
 *
 * Uses canvas for hitch-free, cover-fitted rendering.
 * Falls back to a plain <video> element if frames fail to load.
 */

import { useEffect, useRef } from "react";
import styles from "./experiences-journey.module.css";

export const SCRUB_FRAME_COUNT = 264;
export const VIDEO_SRC         = "/assets/video/video_002.mp4";
export const POSTER_SRC        = "/assets/video/video_002_poster.jpg";

const FRAME_DIR      = "/assets/video/video_002_frames";
const PRELOAD_RADIUS = 8;
const SEEK_EPSILON   = 1 / 50;

export function frameSrc(n: number) {
  const i = Math.min(SCRUB_FRAME_COUNT, Math.max(1, Math.round(n)));
  return `${FRAME_DIR}/frame_${String(i).padStart(4, "0")}.jpg`;
}

export function frameIndexFromProgress(progress: number) {
  const p = Math.min(1, Math.max(0, progress));
  return 1 + Math.round(p * (SCRUB_FRAME_COUNT - 1));
}

type Props = { progress: number; onReady?: () => void; onError?: () => void };

export function ExperiencesScrollVideo({ progress, onReady, onError }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const videoRef    = useRef<HTMLVideoElement>(null);
  const progressRef = useRef(progress);
  const onReadyRef  = useRef(onReady);
  const onErrorRef  = useRef(onError);

  progressRef.current = progress;
  onReadyRef.current  = onReady;
  onErrorRef.current  = onError;

  useEffect(() => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    let alive    = true;
    let ready    = false;
    let mode: "frames" | "video" = "frames";
    let drawn    = 0;
    let duration = 0;
    let seeking  = false;
    let seekRaf  = 0;

    const cache   = new Map<number, HTMLImageElement>();
    const loading = new Set<number>();

    /* ── helpers ──────────────────────────────────────────────────── */
    const markReady = () => {
      if (!alive || ready) return;
      ready = true;
      onReadyRef.current?.();
    };
    const markError = () => {
      if (!alive) return;
      onErrorRef.current?.();
    };

    const drawCover = (src: CanvasImageSource, natW: number, natH: number) => {
      if (natW <= 0 || natH <= 0) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr  = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.clientWidth  || window.innerWidth;
      const cssH = canvas.clientHeight || window.innerHeight;
      const pxW  = Math.max(1, Math.round(cssW * dpr));
      const pxH  = Math.max(1, Math.round(cssH * dpr));
      if (canvas.width !== pxW || canvas.height !== pxH) {
        canvas.width  = pxW;
        canvas.height = pxH;
      }
      const s  = Math.max(pxW / natW, pxH / natH);
      const dW = natW * s;
      const dH = natH * s;
      ctx.clearRect(0, 0, pxW, pxH);
      ctx.drawImage(src, (pxW - dW) / 2, (pxH - dH) / 2, dW, dH);
    };

    /* ── JPEG frame path ──────────────────────────────────────────── */
    const ensureFrame = (idx: number) => {
      if (cache.has(idx) || loading.has(idx)) return;
      loading.add(idx);
      const img = new Image();
      img.decoding = "async";
      img.src = frameSrc(idx);
      img.onload = () => {
        loading.delete(idx);
        if (!alive) return;
        cache.set(idx, img);
        /* Evict frames far from current */
        const active = frameIndexFromProgress(progressRef.current);
        for (const k of [...cache.keys()]) {
          if (Math.abs(k - active) > PRELOAD_RADIUS * 3) cache.delete(k);
        }
        if (idx === active) {
          drawCover(img, img.naturalWidth, img.naturalHeight);
          drawn = idx;
          markReady();
        }
      };
      img.onerror = () => {
        loading.delete(idx);
        /* If the very first frame fails, fall back to video */
        if (idx <= 2 && mode === "frames") {
          mode = "video";
          canvas.style.display = "none";
          bootVideo();
        }
      };
    };

    const paintFrame = (idx: number) => {
      const hit = cache.get(idx);
      if (hit?.complete && hit.naturalWidth > 0) {
        drawCover(hit, hit.naturalWidth, hit.naturalHeight);
        drawn = idx;
        markReady();
        return;
      }
      ensureFrame(idx);
      for (let d = 1; d <= PRELOAD_RADIUS; d++) {
        const L = cache.get(idx - d);
        if (L?.complete && L.naturalWidth > 0) { drawCover(L, L.naturalWidth, L.naturalHeight); drawn = idx - d; return; }
        const R = cache.get(idx + d);
        if (R?.complete && R.naturalWidth > 0) { drawCover(R, R.naturalWidth, R.naturalHeight); drawn = idx + d; return; }
      }
    };

    /* ── video fallback path ──────────────────────────────────────── */
    const onVideoSeeked = () => {
      seeking = false;
      if (!Number.isFinite(duration) || duration <= 0) return;
      const desired = progressRef.current * Math.max(duration - 0.04, 0);
      if (Math.abs(video.currentTime - desired) >= SEEK_EPSILON) {
        seeking = true;
        try { video.currentTime = desired; } catch { seeking = false; }
      }
    };

    const bootVideo = () => {
      video.hidden       = false;
      video.muted        = true;
      video.defaultMuted = true;
      video.volume       = 0;
      video.playsInline  = true;
      video.preload      = "auto";
      video.autoplay     = false;
      video.loop         = false;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.removeAttribute("autoplay");
      video.pause();
      /* Scrub-only — kill any browser free-play of the section film */
      const blockFreePlay = () => {
        if (!alive) return;
        try { video.pause(); } catch { /**/ }
      };
      video.addEventListener("play", blockFreePlay);
      video.addEventListener("seeked", onVideoSeeked);
      video.addEventListener("error", markError, { once: true });

      const onMeta = () => {
        duration = video.duration;
        if (!Number.isFinite(duration) || duration <= 0) { markError(); return; }
        try { video.currentTime = progressRef.current * Math.max(duration - 0.04, 0); } catch { /**/ }
        blockFreePlay();
        markReady();
      };

      if (video.readyState >= 1 && Number.isFinite(video.duration) && video.duration > 0) {
        onMeta();
      } else {
        video.addEventListener("loadedmetadata", onMeta, { once: true });
        try { video.load(); } catch { /**/ }
      }

      /* Stash for cleanup */
      (video as HTMLVideoElement & { __blockFreePlay?: () => void }).__blockFreePlay =
        blockFreePlay;
    };

    /* ── progress → frame/seek ────────────────────────────────────── */
    const applyProgress = () => {
      if (!alive) return;
      const p = progressRef.current;

      if (mode === "frames") {
        const idx = frameIndexFromProgress(p);
        if (idx !== drawn) paintFrame(idx);
        /* Preload window around current frame */
        for (let i = idx - PRELOAD_RADIUS; i <= idx + PRELOAD_RADIUS; i++) {
          if (i >= 1 && i <= SCRUB_FRAME_COUNT) ensureFrame(i);
        }
        return;
      }

      /* Video mode */
      if (!Number.isFinite(duration) || duration <= 0 || seekRaf) return;
      seekRaf = requestAnimationFrame(() => {
        seekRaf = 0;
        if (!alive) return;
        const t = Math.min(Math.max(progressRef.current, 0), 1) * Math.max(duration - 0.04, 0);
        if (Math.abs(video.currentTime - t) < SEEK_EPSILON || seeking) return;
        seeking = true;
        try { video.currentTime = t; } catch { seeking = false; }
      });
    };

    /* ── rAF poll — only fires when progress actually changes ─────── */
    let rafId   = 0;
    let lastP   = -1;
    const poll  = () => {
      if (!alive) return;
      rafId = requestAnimationFrame(poll);
      if (progressRef.current === lastP) return;
      lastP = progressRef.current;
      applyProgress();
    };

    /* ── Boot: load frame 1; on error → video ─────────────────────── */
    const first = new Image();
    first.decoding = "async";
    first.src = frameSrc(1);
    first.onload = () => {
      if (!alive) return;
      cache.set(1, first);
      drawCover(first, first.naturalWidth, first.naturalHeight);
      drawn = 1;
      markReady();
      /* Preload neighbours */
      for (let i = 1; i <= PRELOAD_RADIUS; i++) ensureFrame(i + 1);
      applyProgress();
      rafId = requestAnimationFrame(poll);
    };
    first.onerror = () => {
      if (!alive) return;
      mode = "video";
      canvas.style.display = "none";
      bootVideo();
      rafId = requestAnimationFrame(poll);
    };

    /* Resize: repaint */
    const onResize = () => {
      if (mode === "frames") {
        const img = cache.get(drawn || 1);
        if (img?.complete) drawCover(img, img.naturalWidth, img.naturalHeight);
      }
    };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
      if (seekRaf) cancelAnimationFrame(seekRaf);
      window.removeEventListener("resize", onResize);
      video.removeEventListener("seeked", onVideoSeeked);
      const block = (video as HTMLVideoElement & { __blockFreePlay?: () => void })
        .__blockFreePlay;
      if (block) video.removeEventListener("play", block);
      try { video.pause(); } catch { /**/ }
      cache.clear();
      loading.clear();
    };
  }, []);

  return (
    <div className={styles.scrollVideoScene} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.scrollVideoCanvas} />
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        poster={POSTER_SRC}
        muted
        playsInline
        preload="metadata"
        controls={false}
        autoPlay={false}
        loop={false}
        disablePictureInPicture
        tabIndex={-1}
        hidden
      />
    </div>
  );
}
