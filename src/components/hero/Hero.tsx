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
  const birdFlyerRef = useRef<HTMLDivElement>(null);
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

  // Page load: flower stays put; bird rises from below into place.
  useLayoutEffect(() => {
    const flyer = birdFlyerRef.current;
    if (!flyer) return;

    if (prefersReducedMotion()) {
      gsap.set(flyer, { y: 0, clearProps: "transform" });
      return;
    }

    const rise = window.innerHeight * 0.42;
    gsap.fromTo(
      flyer,
      { y: rise, force3D: true },
      {
        y: 0,
        duration: 2.35,
        ease: "power3.out",
        delay: 0.12,
        force3D: true,
        onComplete: () => {
          // Soft hover after arrival — whole bird breathes in place
          gsap.to(flyer, {
            y: 7,
            duration: 2.8,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        },
      },
    );

    return () => {
      gsap.killTweensOf(flyer);
    };
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
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: sticky,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * PIN_VH)}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.65,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onRefreshInit: updateDistances,
          onUpdate: (self) => {
            // Keep cloud hidden until the rise begins (both scroll directions).
            if (self.progress < distances.birdStart * 0.9) {
              gsap.set(cloud, { autoAlpha: 0 });
            }
          },
          // Let the scrub timeline own visibility both ways — no forced leave snaps
          // that stick when scrolling bottom → top back into Hero.
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
        Cloud ENTER: full cloud field rises from bottom as bird exits.
        One image only — soft top & bottom edges, no overlay layers.
      */
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
              duration: () => Math.max(0.22, exitDur() * 0.45),
              ease: "none",
            },
            {
              autoAlpha: 1,
              x: () => distances.cloudDriftX * 0.55,
              y: () => distances.cloudYHigh,
              // Scale up so dense mid covers the full screen when text enters.
              scale: () => distances.cloudScaleHigh,
              duration: () => Math.max(0.2, exitDur() * 0.55),
              ease: "none",
            },
          ],
          immediateRender: false,
        },
        0,
      );

      // Section 2 content fades in ON TOP of the cloud background.
      if (experiences) {
        timeline.to(
          experiences,
          {
            keyframes: [
              {
                autoAlpha: 0,
                duration: () =>
                  Math.max(0.7, distances.birdStart + exitDur() * 0.38),
                ease: "none",
              },
              {
                autoAlpha: 1,
                duration: 0.24,
                ease: "none",
              },
            ],
            immediateRender: false,
          },
          0,
        );
      }

      // Through Section 2: gentle zoom-out backdrop — never mist over content.
      // The cloud stays settled behind §2 all the way to its bottom edge;
      // continuity into the story sequence is handed off to .story-cloud-lip.
      if (experiences) {
        // Kill the green hero photo as soon as §2 owns the screen.
        gsap.fromTo(
          bg,
          { autoAlpha: 1 },
          {
            autoAlpha: 0,
            ease: "none",
            immediateRender: false,
            scrollTrigger: {
              trigger: experiences,
              start: "top 70%",
              end: "top 10%",
              scrub: 0.35,
            },
          },
        );

        // Hold clouds only through the 3D journey entrance, then clear so
        // the terrain canvas owns the viewport for the rest of §2.
        gsap.fromTo(
          cloud,
          {
            x: () => distances.cloudDriftX * 0.55,
            y: () => distances.cloudYHigh,
            scale: () => distances.cloudScaleHigh,
            autoAlpha: 1,
            transformOrigin: "50% 40%",
          },
          {
            x: () => distances.cloudDriftX * 0.35,
            y: () => distances.cloudYHigh - window.innerHeight * 0.08,
            scale: 1.35,
            autoAlpha: 0,
            transformOrigin: "50% 35%",
            ease: "none",
            immediateRender: false,
            scrollTrigger: {
              trigger: experiences,
              start: "top top",
              end: "top+=35% top",
              scrub: 0.65,
            },
          },
        );

        // No fade-out at the §2 bottom: the same cloud field must still be
        // behind the last §2 rows at the section's bottom edge. As the
        // story section enters, its lip (same clouds-section.png) takes
        // over in the same white register, so the join has no gap.
      }

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
                {/* Flower stays fixed at the top while the bird flies up */}
                <img
                  className="hero-bird-layer hero-bird-flower"
                  src="/images/hero/hero-bird-base.png?v=outer9"
                  alt=""
                  width={2880}
                  height={1500}
                  draggable={false}
                  decoding="async"
                  aria-hidden="true"
                />
                <div className="hero-bird-flyer" ref={birdFlyerRef}>
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
