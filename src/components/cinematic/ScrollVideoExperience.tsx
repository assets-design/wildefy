"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./scroll-video.module.css";

gsap.registerPlugin(ScrollTrigger);

const VIDEO_SRC = "/assets/video/segment_1.mp4";
/** Half-frame at 24fps — ignore seeks smaller than this. */
const SEEK_EPSILON = 1 / 48;
/** Scroll length as multiples of viewport height for the full clip. */
const SCROLL_VH = 10;
/** Seconds for scrub playhead to catch up after the wheel stops. */
const SCRUB_SMOOTH = 6;
const DEFAULT_VOLUME = 0.85;
/** Idle time after last scroll input before audio pauses. */
const SCROLL_IDLE_MS = 180;

type ReadyState = "loading" | "ready" | "error";

export function ScrollVideoExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [readyState, setReadyState] = useState<ReadyState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!section || !video || !audio) return;

    let cancelled = false;
    let duration = 0;
    let targetTime = 0;
    let seeking = false;
    let seekRaf = 0;
    let trigger: ScrollTrigger | null = null;
    let scrubTween: gsap.core.Tween | null = null;
    let frameCallbackId = 0;
    let soundEnabled = false;
    let scrollIdleTimer = 0;
    let isScrollAudioPlaying = false;

    // Visual layer: always muted, scrubbed by scroll only.
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.preload = "auto";
    video.pause();

    // Audio layer: same file, plays at normal 1x only while user is scrolling.
    audio.preload = "auto";
    audio.loop = false;
    audio.volume = DEFAULT_VOLUME;
    audio.playbackRate = 1;

    const clearSeekRaf = () => {
      if (seekRaf) {
        cancelAnimationFrame(seekRaf);
        seekRaf = 0;
      }
    };

    const applySeek = () => {
      seekRaf = 0;
      if (cancelled || !Number.isFinite(duration) || duration <= 0) return;

      const next = Math.min(Math.max(targetTime, 0), Math.max(duration - 0.001, 0));
      if (Math.abs(video.currentTime - next) < SEEK_EPSILON) return;

      if (seeking) return;

      seeking = true;
      try {
        video.currentTime = next;
      } catch (error) {
        seeking = false;
        console.warn("[wildefy cinematic] seek failed", error);
      }
    };

    const scheduleSeek = (scrollProgress: number) => {
      if (!Number.isFinite(duration) || duration <= 0) return;
      targetTime = Math.min(Math.max(scrollProgress, 0), 1) * duration;
      if (!seekRaf) {
        seekRaf = requestAnimationFrame(applySeek);
      }
    };

    const onSeeked = () => {
      seeking = false;
      if (Math.abs(video.currentTime - targetTime) >= SEEK_EPSILON) {
        scheduleSeek(duration > 0 ? targetTime / duration : 0);
      }
    };

    const stopScrollAudio = () => {
      if (scrollIdleTimer) {
        window.clearTimeout(scrollIdleTimer);
        scrollIdleTimer = 0;
      }
      if (!isScrollAudioPlaying && audio.paused) return;
      isScrollAudioPlaying = false;
      audio.pause();
    };

    const startScrollAudio = () => {
      if (!soundEnabled || cancelled) return;

      // Sync once to the current visual frame, then play forward normally (not scrubbed).
      try {
        const t = Math.min(Math.max(video.currentTime, 0), Math.max(duration - 0.05, 0));
        if (!Number.isFinite(t)) return;
        if (Math.abs(audio.currentTime - t) > 0.35) {
          audio.currentTime = t;
        }
      } catch {
        // Ignore seek errors on audio element.
      }

      audio.playbackRate = 1;
      audio.volume = DEFAULT_VOLUME;
      isScrollAudioPlaying = true;
      void audio.play().catch(() => {
        isScrollAudioPlaying = false;
      });
    };

    const onScrollActivity = () => {
      if (!soundEnabled) return;
      startScrollAudio();
      if (scrollIdleTimer) window.clearTimeout(scrollIdleTimer);
      scrollIdleTimer = window.setTimeout(() => {
        scrollIdleTimer = 0;
        stopScrollAudio();
      }, SCROLL_IDLE_MS);
    };

    const teardownTrigger = () => {
      scrubTween?.scrollTrigger?.kill();
      scrubTween?.kill();
      scrubTween = null;
      trigger?.kill();
      trigger = null;
    };

    const initScroll = () => {
      if (cancelled || !Number.isFinite(duration) || duration <= 0) return;
      teardownTrigger();

      const proxy = { progress: 0 };
      scrubTween = gsap.to(proxy, {
        progress: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * SCROLL_VH)}`,
          pin: true,
          pinSpacing: true,
          scrub: SCRUB_SMOOTH,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: () => {
            scheduleSeek(proxy.progress);
          },
        },
        onUpdate: () => {
          scheduleSeek(proxy.progress);
        },
      });
      trigger = scrubTween.scrollTrigger ?? null;

      scheduleSeek(proxy.progress);
      ScrollTrigger.refresh();
    };

    const waitForSeek = (time: number) =>
      new Promise<void>((resolve) => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          video.removeEventListener("seeked", done);
          window.clearTimeout(timer);
          resolve();
        };
        const timer = window.setTimeout(done, 500);
        video.addEventListener("seeked", done);
        try {
          if (Math.abs(video.currentTime - time) < SEEK_EPSILON && video.readyState >= 2) {
            done();
            return;
          }
          video.currentTime = time;
        } catch {
          done();
        }
      });

    const onError = () => {
      const mediaError = video.error;
      const detail = mediaError
        ? `MediaError code ${mediaError.code}`
        : "Unknown media error";
      console.error("[wildefy cinematic] video failed to load", detail, mediaError);
      if (!cancelled) {
        setErrorMessage("This browser could not decode the cinematic video.");
        setReadyState("error");
      }
    };

    const enableSound = async () => {
      soundEnabled = true;
      setSoundOn(true);
      try {
        audio.volume = DEFAULT_VOLUME;
        // Unlock audio element under autoplay policy.
        await audio.play();
        audio.pause();
      } catch {
        // User may need another gesture; button click counts.
      }
    };

    const disableSound = () => {
      soundEnabled = false;
      setSoundOn(false);
      stopScrollAudio();
    };

    const onToggleSound = () => {
      if (soundEnabled) disableSound();
      else void enableSound();
    };

    const onVisibility = () => {
      if (document.hidden) {
        stopScrollAudio();
        video.pause();
      }
    };

    video.addEventListener("error", onError);
    video.addEventListener("seeked", onSeeked);
    document.addEventListener("visibilitychange", onVisibility);
    section.addEventListener("wildefy:toggle-sound", onToggleSound);

    // Scroll / wheel / touch = play normal audio; idle = stop audio.
    section.addEventListener("wheel", onScrollActivity, { passive: true });
    section.addEventListener("touchmove", onScrollActivity, { passive: true });
    window.addEventListener("scroll", onScrollActivity, { passive: true });

    const prepare = async () => {
      if (video.readyState < 1) {
        const metaOk = await new Promise<boolean>((resolve) => {
          const onMeta = () => {
            cleanup();
            resolve(true);
          };
          const onFail = () => {
            cleanup();
            resolve(false);
          };
          const cleanup = () => {
            video.removeEventListener("loadedmetadata", onMeta);
            video.removeEventListener("error", onFail);
          };
          video.addEventListener("loadedmetadata", onMeta);
          video.addEventListener("error", onFail);
          try {
            video.load();
          } catch {
            // Already loading.
          }
        });
        if (!metaOk) {
          onError();
          return;
        }
      }

      if (cancelled || video.error) return;

      duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) {
        console.error("[wildefy cinematic] invalid duration", duration);
        setErrorMessage("Video duration could not be read.");
        setReadyState("error");
        return;
      }

      await waitForSeek(0);
      if (cancelled) return;

      try {
        const playAttempt = video.play();
        if (playAttempt) await playAttempt.catch(() => undefined);
      } catch {
        // Need a decoded still only.
      }
      video.pause();
      video.muted = true;
      await waitForSeek(0);
      if (cancelled) return;

      // Warm audio element metadata from the same asset.
      try {
        audio.load();
      } catch {
        // Ignore.
      }

      initScroll();
      if (!cancelled) setReadyState("ready");

      const anyVideo = video as HTMLVideoElement & {
        requestVideoFrameCallback?: (
          cb: (now: number, meta: { mediaTime: number }) => void,
        ) => number;
      };
      if (typeof anyVideo.requestVideoFrameCallback === "function") {
        const tick = () => {
          if (cancelled) return;
          frameCallbackId = anyVideo.requestVideoFrameCallback!(tick);
        };
        frameCallbackId = anyVideo.requestVideoFrameCallback(tick);
      }
    };

    void prepare();

    const onResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      clearSeekRaf();
      stopScrollAudio();
      teardownTrigger();
      video.removeEventListener("error", onError);
      video.removeEventListener("seeked", onSeeked);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScrollActivity);
      section.removeEventListener("wheel", onScrollActivity);
      section.removeEventListener("touchmove", onScrollActivity);
      section.removeEventListener("wildefy:toggle-sound", onToggleSound);
      const anyVideo = video as HTMLVideoElement & {
        cancelVideoFrameCallback?: (id: number) => void;
      };
      if (frameCallbackId && typeof anyVideo.cancelVideoFrameCallback === "function") {
        anyVideo.cancelVideoFrameCallback(frameCallbackId);
      }
      video.pause();
      audio.pause();
    };
  }, []);

  const toggleSound = () => {
    sectionRef.current?.dispatchEvent(new Event("wildefy:toggle-sound"));
  };

  return (
    <section ref={sectionRef} className={styles.root} aria-label="Wildefy cinematic scroll video">
      <div className={styles.pin}>
        <video
          ref={videoRef}
          className={styles.video}
          src={VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          tabIndex={-1}
          aria-hidden
        />

        {/* Soundtrack plays at normal 1x only while scrolling; paused when scroll stops. */}
        <audio ref={audioRef} src={VIDEO_SRC} preload="auto" />

        {readyState === "ready" ? (
          <button
            type="button"
            className={styles.soundBtn}
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Mute soundtrack" : "Unmute soundtrack"}
          >
            {soundOn ? "Sound on" : "Enable sound"}
          </button>
        ) : null}

        {readyState === "loading" ? (
          <div className={styles.loading} data-hidden="false">
            <p className={styles.status}>Preparing the mountain</p>
          </div>
        ) : null}

        {readyState === "ready" ? (
          <div className={styles.loading} data-hidden="true" aria-hidden>
            <p className={styles.status}>Preparing the mountain</p>
          </div>
        ) : null}

        {readyState === "error" ? (
          <div className={styles.fallback} role="alert">
            <p className={styles.status}>
              {errorMessage ?? "The cinematic video could not be loaded."}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
