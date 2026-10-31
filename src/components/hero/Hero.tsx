"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { StageFrame } from "@/components/layout/StageFrame";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useJourney } from "@/components/journey/JourneyShell";

gsap.registerPlugin(ScrollTrigger);

/** Subtle continuous background rise — slower than bird exit. */
const BG_TRAVEL_RATIO = 0.16;

/** After the first full playthrough, hold on this mid-clip window (clamped to duration). */
const HERO_LOOP_START = 2;
const HERO_LOOP_END = 5;

const HERO_BIRD_VIDEO = "/videos/Bird%2003.mp4";

type HeroBirdMode = "video" | "wings";
type HeroEntrance = "none" | "fadeUp";

type HeroProps = {
  /** Layered wing-sweep PNGs by default; pass `"video"` for the Bird 03.mp4 clip. */
  birdMode?: HeroBirdMode;
  /** Page-enter fade-up for title + copy + CTA (lander only). */
  entrance?: HeroEntrance;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Hero({ birdMode = "wings", entrance = "none" }: HeroProps) {
  const { bgRef, cloudRef, cloudAltRef } = useJourney();
  const experienceRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const birdRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  // Pause wing CSS animation while the layered bird is off-screen.
  useEffect(() => {
    if (birdMode !== "wings") return;
    const bird = birdRef.current;
    if (!bird || prefersReducedMotion()) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        bird.classList.toggle("is-offscreen", !entry.isIntersecting);
      },
      { root: null, threshold: 0.08 },
    );
    io.observe(bird);
    return () => io.disconnect();
  }, [birdMode]);

  // Full play once → then loop 2s–5s. Pause while scrolled off-screen.
  useEffect(() => {
    if (birdMode !== "video") return;
    const bird = birdRef.current;
    const video = videoRef.current;
    if (!bird || !video) return;

    if (prefersReducedMotion()) {
      video.pause();
      video.currentTime = 0;
      return;
    }

    let looping = false;
    let cancelled = false;

    const duration = () => video.duration || 0;
    const loopStart = () => {
      const d = duration();
      if (!d || d <= HERO_LOOP_START + 0.3) return 0;
      return Math.min(HERO_LOOP_START, d * 0.35);
    };
    const loopEnd = () => {
      const d = duration();
      if (!d) return HERO_LOOP_END;
      if (d <= HERO_LOOP_START + 0.3) return Math.max(0.2, d - 0.04);
      return Math.min(HERO_LOOP_END, Math.max(loopStart() + 0.2, d - 0.04));
    };

    const onEnded = () => {
      if (cancelled) return;
      looping = true;
      video.currentTime = loopStart();
      void video.play().catch(() => {});
    };

    const onTimeUpdate = () => {
      if (!looping || cancelled) return;
      if (video.currentTime >= loopEnd()) {
        video.currentTime = loopStart();
      }
    };

    video.loop = false;
    video.addEventListener("ended", onEnded);
    video.addEventListener("timeupdate", onTimeUpdate);

    const tryPlay = () => {
      if (cancelled || looping) return;
      void video.play().catch(() => {});
    };

    if (video.readyState >= 2) tryPlay();
    else video.addEventListener("loadeddata", tryPlay, { once: true });

    const io = new IntersectionObserver(
      ([entry]) => {
        bird.classList.toggle("is-offscreen", !entry.isIntersecting);
        if (entry.isIntersecting) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { root: null, threshold: 0.08 },
    );
    io.observe(bird);

    return () => {
      cancelled = true;
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadeddata", tryPlay);
      io.disconnect();
    };
  }, [birdMode]);

  useLayoutEffect(() => {
    const experience = experienceRef.current;
    const sticky = stickyRef.current;
    const scene = sceneRef.current;
    const bg = bgRef.current;
    const cloud = cloudRef.current;
    const cloudAlt = cloudAltRef.current;
    const header = headerRef.current;
    const bird = birdRef.current;
    const title = titleRef.current;
    const right = rightRef.current;
    if (
      !experience ||
      !sticky ||
      !scene ||
      !bg ||
      !cloud ||
      !cloudAlt ||
      !header ||
      !bird ||
      !title ||
      !right
    )
      return;

    if (prefersReducedMotion()) return;

    const experiences = document.querySelector(".experiences");

    // Deterministic initial transforms — match CSS, prevent FOUC flashes.
    gsap.set([bg, header, bird, title, right], {
      y: 0,
      force3D: true,
      immediateRender: true,
    });

    /** Same density caps as ExperiencesCloudHandoff (§2→§3). */
    const CLOUD_MAX = 0.78;
    const CLOUD_ALT_MAX = 0.52;

    const parkCloudsBelow = () => {
      gsap.set([cloud, cloudAlt], {
        autoAlpha: 0,
        xPercent: -50,
        x: 0,
        y: () => window.innerHeight,
        scale: 1,
        transformOrigin: "50% 45%",
        force3D: true,
        immediateRender: true,
      });
    };
    parkCloudsBelow();
    if (experiences) gsap.set(experiences, { autoAlpha: 0 });

    const SIDE_START = 0.04;
    const SIDE_DUR = 0.32;
    /** Pin distance as a fraction of the viewport — ends when exits finish. */
    const PIN_VH = 0.85;
    const distances = {
      bgTravel: 0,
      contentExit: 0,
      birdExit: 0,
      headerExit: 0,
      cloudDriftX: 0,
      /** y offsets (px): start below → mid cover → fill viewport. */
      cloudYStart: 0,
      cloudYMid: 0,
      cloudYHigh: 0,
      cloudScaleHigh: 1,
      /** Timeline position where the title meets the header — bird + header begin here. */
      birdStart: 0.18,
    };

    const updateDistances = () => {
      const visible = scene.clientHeight || window.innerHeight;
      distances.bgTravel = visible * BG_TRAVEL_RATIO;
      distances.contentExit = visible * 1.1;
      distances.birdExit = visible * 1.02;
      distances.headerExit = visible * 1.02;
      distances.cloudDriftX = visible * 0.03;
      // Same rise geometry as ExperiencesCloudHandoff / StoryCloudHandoff.
      distances.cloudYStart = visible;
      distances.cloudYMid = visible * 0.22;
      distances.cloudYHigh = -visible * 0.72;
      distances.cloudScaleHigh = 1.55;

      const headerBottom = header.offsetTop + header.offsetHeight || 106;
      const titleTop = title.offsetTop;
      const travelToHeader = Math.max(8, titleTop - headerBottom);
      const sideProgressAtTouch = Math.min(
        0.92,
        travelToHeader / Math.max(1, distances.contentExit),
      );
      distances.birdStart = SIDE_START + sideProgressAtTouch * SIDE_DUR;
    };

    updateDistances();

    const setCloudPair = (props: {
      autoAlpha: number;
      x: number;
      y: number;
      scale: number;
    }) => {
      const a = Math.min(1, Math.max(0, props.autoAlpha));
      gsap.set(cloud, {
        autoAlpha: a * CLOUD_MAX,
        xPercent: -50,
        x: props.x,
        y: props.y,
        scale: props.scale,
        transformOrigin: "50% 45%",
        force3D: true,
      });
      gsap.set(cloudAlt, {
        autoAlpha: a * CLOUD_ALT_MAX,
        xPercent: -50,
        x: props.x * 0.65,
        y: props.y + window.innerHeight * 0.05,
        scale: props.scale * 1.08,
        transformOrigin: "50% 45%",
        force3D: true,
      });
    };

    const ctx = gsap.context(() => {
      /**
       * Experiences underlaps Hero (-100vh) at z-index 3. Keep it hidden for
       * almost the entire hero pin so reverse scroll can show bird/cloud —
       * otherwise §2 white clouds sit on top (stuck fog in home.mp4).
       */
      const EXP_FADE_FROM = 0.92;
      const syncExperiencesVisibility = (
        progress: number,
        direction: number,
      ) => {
        if (!experiences) return;
        // Forward: fade §2 in at the end. Reverse: keep §2 clear so Hero
        // bird/cloud exit is visible (was covered by white fog in home.mp4).
        const from = direction < 0 ? 0.97 : EXP_FADE_FROM;
        const t =
          progress <= from ? 0 : (progress - from) / Math.max(0.001, 1 - from);
        gsap.set(experiences, { autoAlpha: Math.min(1, Math.max(0, t)) });
      };

      const syncHeroEdge = (progress: number, direction = 1) => {
        if (progress < distances.birdStart * 0.9) {
          setCloudPair({
            autoAlpha: 0,
            x: 0,
            y: distances.cloudYStart,
            scale: 1,
          });
        }
        syncExperiencesVisibility(progress, direction);
      };

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          id: "hero-pin",
          trigger: sticky,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * PIN_VH)}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.45,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onRefreshInit: updateDistances,
          onUpdate: (self) => {
            syncHeroEdge(self.progress, self.direction);
          },
          onRefresh: (self) => {
            syncHeroEdge(self.progress, self.direction);
          },
          onLeave: () => {
            if (experiences) gsap.set(experiences, { autoAlpha: 1 });
            parkCloudsBelow();
          },
          onEnterBack: (self) => {
            if (experiences) gsap.set(experiences, { autoAlpha: 0 });
            syncHeroEdge(self.progress, -1);
          },
          onLeaveBack: () => {
            syncHeroEdge(0, -1);
            gsap.set(bg, { autoAlpha: 1 });
            if (experiences) gsap.set(experiences, { autoAlpha: 0 });
          },
        },
      });

      // Background rises for the full scroll (starts immediately).
      timeline.fromTo(
        bg,
        { y: 0 },
        { y: () => -distances.bgTravel, duration: 1, immediateRender: false },
        0,
      );

      // Side content exits upward.
      timeline.fromTo(
        [title, right],
        { y: 0 },
        {
          y: () => -distances.contentExit,
          duration: SIDE_DUR,
          immediateRender: false,
        },
        SIDE_START,
      );

      // Bird + header leave together once the title reaches the header.
      const exitHold = {
        y: 0,
        duration: () => distances.birdStart,
        ease: "none" as const,
      };
      const exitDur = () => Math.max(0.2, 0.98 - distances.birdStart);

      timeline.to(
        bird,
        {
          keyframes: [
            exitHold,
            {
              y: () => -distances.birdExit,
              duration: exitDur,
              ease: "none",
            },
          ],
          immediateRender: false,
        },
        0,
      );

      timeline.to(
        header,
        {
          keyframes: [
            exitHold,
            {
              y: () => -distances.headerExit,
              duration: exitDur,
              ease: "none",
            },
          ],
          immediateRender: false,
        },
        0,
      );

      /*
        Dual clouds-section.png — same rise → cover → clear grammar as
        ExperiencesCloudHandoff. Proxy object drives both layers each frame.
      */
      const cloudProxy = { t: 0 };

      timeline.fromTo(
        cloudProxy,
        { t: 0 },
        {
          t: 1,
          duration: 1,
          ease: "none",
          immediateRender: false,
          onUpdate: () => {
            const birdGate = distances.birdStart;
            const t = cloudProxy.t;
            if (t <= birdGate) {
              setCloudPair({
                autoAlpha: 0,
                x: 0,
                y: distances.cloudYStart,
                scale: 1,
              });
              return;
            }
            const uRaw = (t - birdGate) / Math.max(0.001, 1 - birdGate);
            /* Smootherstep bookends — same as ExperiencesCloudHandoff */
            const u = uRaw * uRaw * uRaw * (uRaw * (uRaw * 6 - 15) + 10);
            if (u <= 0.48) {
              const p = u / 0.48;
              setCloudPair({
                autoAlpha: p,
                x: distances.cloudDriftX * 0.25 * p,
                y:
                  distances.cloudYStart +
                  (distances.cloudYMid - distances.cloudYStart) * p,
                scale: 1 + 0.08 * p,
              });
              return;
            }
            if (u <= 0.8) {
              const p = (u - 0.48) / 0.32;
              setCloudPair({
                autoAlpha: 1,
                x:
                  distances.cloudDriftX * 0.25 +
                  distances.cloudDriftX * 0.3 * p,
                y:
                  distances.cloudYMid +
                  (distances.cloudYHigh - distances.cloudYMid) * p,
                scale: 1.08 + (distances.cloudScaleHigh - 1.08) * p,
              });
              return;
            }
            const p = (u - 0.8) / 0.2;
            const fade = 1 - p * p;
            setCloudPair({
              autoAlpha: fade,
              x: distances.cloudDriftX * (0.55 - 0.2 * p),
              y: distances.cloudYHigh - window.innerHeight * 0.1 * p,
              scale: distances.cloudScaleHigh - 0.2 * p,
            });
          },
        },
        0,
      );

      // Fade the green hero photo as Experiences takes over (same pin window).
      timeline.fromTo(
        bg,
        { autoAlpha: 1 },
        {
          autoAlpha: 0,
          duration: 0.28,
          ease: "none",
          immediateRender: false,
        },
        0.72,
      );

      // Experiences visibility is driven in syncExperiencesVisibility (not a
      // competing timeline tween) so reverse scroll cannot leave §2 stuck opaque.

      parkCloudsBelow();
      if (experiences) gsap.set(experiences, { autoAlpha: 0 });
    }, experience);

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        updateDistances();
        ScrollTrigger.refresh();
      }, 120);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
  }, []);

  // Page-enter fade-up for title → copy → CTA (lander). Skips when reduced-motion.
  // Runs after the scroll layout effect so initial gsap.set(y:0) does not wipe start state.
  // Title uses yPercent (not y) so it does not fight the scrubbed exit tween on `y`.
  useLayoutEffect(() => {
    if (entrance !== "fadeUp") return;

    const title = titleRef.current;
    const right = rightRef.current;
    if (!title || !right) return;

    const copy = right.querySelector<HTMLElement>(".hero-copy");
    const cta = right.querySelector<HTMLElement>(".cta");
    const side = [copy, cta].filter(Boolean) as HTMLElement[];

    if (prefersReducedMotion()) {
      gsap.set([title, ...side], { autoAlpha: 1, y: 0, yPercent: 0 });
      return;
    }

    const tl = gsap.timeline({ delay: 0.08 });
    tl.fromTo(
      title,
      { autoAlpha: 0, yPercent: 8 },
      { autoAlpha: 1, yPercent: 0, duration: 0.75, ease: "power2.out" },
      0,
    );
    if (side.length) {
      tl.fromTo(
        side,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: "power2.out",
        },
        0.12,
      );
    }

    return () => {
      tl.kill();
      gsap.set([title, ...side], { autoAlpha: 1, y: 0, yPercent: 0 });
    };
  }, [entrance]);

  return (
    <div className="hero-experience" ref={experienceRef}>
      <div className="hero-experience-sticky" ref={stickyRef}>
        <StageFrame>
          <section
            className="hero journey-scene"
            ref={sceneRef}
            aria-label="Introduction"
            data-entrance={entrance === "fadeUp" ? "fade-up" : undefined}
          >
            <div className="hero-media">
              <div
                ref={birdRef}
                className="hero-bird"
                role="img"
                aria-label="A hummingbird hovering beneath a red flower"
              >
                {birdMode === "wings" ? (
                  <>
                    <img
                      className="hero-bird-layer hero-bird-wing hero-bird-wing--left"
                      src="/images/hero/hero-bird-wing-left.png"
                      alt=""
                      width={2880}
                      height={1500}
                      draggable={false}
                      decoding="async"
                      aria-hidden="true"
                    />
                    <img
                      className="hero-bird-layer hero-bird-wing hero-bird-wing--right"
                      src="/images/hero/hero-bird-wing-right.png"
                      alt=""
                      width={2880}
                      height={1500}
                      draggable={false}
                      decoding="async"
                      aria-hidden="true"
                    />
                    <img
                      className="hero-bird-layer hero-bird-base"
                      src="/images/hero/hero-bird-base.png"
                      alt=""
                      width={2880}
                      height={1500}
                      draggable={false}
                      decoding="async"
                    />
                  </>
                ) : (
                  <video
                    ref={videoRef}
                    className="hero-bird-video"
                    src={HERO_BIRD_VIDEO}
                    muted
                    playsInline
                    preload="auto"
                    autoPlay
                    disablePictureInPicture
                    disableRemotePlayback
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>

            <SiteHeader headerRef={headerRef} />

            <h1 className="hero-title" ref={titleRef}>
              Learn from the Wild.
              <br />
              Lead in the World.
            </h1>

            <div className="hero-right" ref={rightRef}>
              <p className="hero-copy">
                Wildlife journeys, wilderness offsites and{" "}
                <br />
                learning experiences shaped by the field.
              </p>

              <a className="cta" href="#contact">
                <span className="cta-pill" aria-hidden="true" />
                <span className="cta-label">Begin your journey</span>
                <span className="cta-mark" aria-hidden="true">
                  <img
                    className="cta-bird"
                    src="/images/hero/hummingbird.png"
                    alt=""
                    width={37}
                    height={37}
                    draggable={false}
                  />
                </span>
              </a>
            </div>

            <div className="journey-continue" aria-hidden="true" />
          </section>
        </StageFrame>
      </div>
    </div>
  );
}
