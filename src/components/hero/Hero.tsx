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

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Hero() {
  const { bgRef, cloudRef } = useJourney();
  const experienceRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const birdRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  // Pause wing CSS animation while the hero bird is off-screen.
  useEffect(() => {
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
  }, []);

  useLayoutEffect(() => {
    const experience = experienceRef.current;
    const sticky = stickyRef.current;
    const scene = sceneRef.current;
    const bg = bgRef.current;
    const cloud = cloudRef.current;
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
    // Single cloud bg parked fully below the fold — no overlays.
    gsap.set(cloud, {
      autoAlpha: 0,
      xPercent: -50,
      x: 0,
      y: () => window.innerHeight,
      scale: 1,
      transformOrigin: "50% 45%",
      force3D: true,
      immediateRender: true,
    });
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
      // Rise from below until the cloud field fills behind Section 2.
      distances.cloudYStart = visible;
      // Mid-rise: fluffy TOP lip crossing green (enter stays soft).
      distances.cloudYMid = visible * 0.22;
      // Settled: pull UP past the soft lip so dense mid fills the full viewport
      // when text enters (fluffy lip stays above the fold for the enter beat).
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
          gsap.set(cloud, { autoAlpha: 0 });
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
        Cloud: rise with bird exit → cover handoff → clear so Experiences
        owns the viewport. All on one scrubbed timeline so reverse scroll
        rebuilds the same beats without a second ST fighting these props.
      */
      // Remaining pin after bird-start — always sums to 1 with birdStart.
      const afterBird = () => Math.max(0.2, 1 - distances.birdStart);
      const riseA = () => afterBird() * 0.4;
      const riseB = () => afterBird() * 0.35;
      const clearDur = () => afterBird() * 0.25;

      timeline.to(
        cloud,
        {
          keyframes: [
            {
              autoAlpha: 0,
              x: 0,
              y: () => distances.cloudYStart,
              scale: 1,
              duration: () => distances.birdStart,
              ease: "none",
            },
            {
              autoAlpha: 1,
              x: () => distances.cloudDriftX * 0.25,
              y: () => distances.cloudYMid,
              scale: 1.08,
              duration: riseA,
              ease: "none",
            },
            {
              autoAlpha: 1,
              x: () => distances.cloudDriftX * 0.55,
              y: () => distances.cloudYHigh,
              scale: () => distances.cloudScaleHigh,
              duration: riseB,
              ease: "none",
            },
            {
              autoAlpha: 0,
              x: () => distances.cloudDriftX * 0.35,
              y: () => distances.cloudYHigh - window.innerHeight * 0.08,
              scale: 1.35,
              duration: clearDur,
              ease: "none",
            },
          ],
          immediateRender: false,
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

      // Re-assert load state after ScrollTriggers register.
      gsap.set(cloud, {
        autoAlpha: 0,
        xPercent: -50,
        y: () => distances.cloudYStart,
      });
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

  return (
    <div className="hero-experience" ref={experienceRef}>
      <div className="hero-experience-sticky" ref={stickyRef}>
        <StageFrame>
          <section className="hero journey-scene" ref={sceneRef} aria-label="Introduction">
            <div className="hero-media">
              {/*
                Base keeps body + shoulder roots (above tips). Outer tips
                underlap the cut and sweep in-plane so hinges stay covered.
              */}
              <div
                ref={birdRef}
                className="hero-bird"
                role="img"
                aria-label="A hummingbird hovering beneath a red flower"
              >
                <img
                  className="hero-bird-layer hero-bird-wing hero-bird-wing--left"
                  src="/images/hero/hero-bird-wing-left.png?v=outer9"
                  alt=""
                  width={2880}
                  height={1500}
                  draggable={false}
                  decoding="async"
                  aria-hidden="true"
                />
                <img
                  className="hero-bird-layer hero-bird-wing hero-bird-wing--right"
                  src="/images/hero/hero-bird-wing-right.png?v=outer9"
                  alt=""
                  width={2880}
                  height={1500}
                  draggable={false}
                  decoding="async"
                  aria-hidden="true"
                />
                <img
                  className="hero-bird-layer hero-bird-base"
                  src="/images/hero/hero-bird-base.png?v=outer9"
                  alt=""
                  width={2880}
                  height={1500}
                  draggable={false}
                  decoding="async"
                />
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
                <span className="cta-mark" aria-hidden="true" />
                <img
                  className="cta-bird"
                  src="/images/hero/hummingbird.png"
                  alt=""
                  width={42}
                  height={42}
                />
                <span className="cta-label">Begin your journey</span>
              </a>
            </div>

            <div className="journey-continue" aria-hidden="true" />
          </section>
        </StageFrame>
      </div>
    </div>
  );
}
