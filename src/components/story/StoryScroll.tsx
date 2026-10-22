"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const PILLARS = [
  {
    title: "Learn",
    copy: "The classroom teaches us to think.",
    icon: "/images/story/icon-learn.png",
  },
  {
    title: "Lead",
    copy: "The boardroom teaches us to decide.",
    icon: "/images/story/icon-lead.png",
  },
  {
    title: "Explore",
    copy: "The wilderness teaches us to observe.",
    icon: "/images/story/icon-explore.png",
  },
] as const;

const VALUES = [
  { title: "Perspective", icon: "/images/story/icon-perspective.png" },
  { title: "Patience", icon: "/images/story/icon-patience.png" },
  { title: "Resilience", icon: "/images/story/icon-resilience.png" },
  { title: "Connection", icon: "/images/story/icon-connection.png" },
] as const;

const MILESTONES = [
  {
    label: "Decades",
    year: "2005 - 2015",
    title: "Corporate Leadership",
    copy: "Targets, teams, decisions and transformation.",
  },
  {
    label: "Alongside",
    year: "2018",
    title: "The Wilderness",
    copy: "Years of Expeditions Across Continents.",
  },
  {
    label: "The Bridge",
    year: "2018",
    title: "Wildefy",
    copy: "Where Corporate Leadership Meets The Wild.",
  },
] as const;

function StoryCta({ label, href }: { label: string; href: string }) {
  return (
    <a className="story-cta" href={href}>
      <span className="story-cta-body">
        <span className="story-cta-label">{label}</span>
      </span>
      <span className="story-cta-mark" aria-hidden="true">
        <img
          className="story-cta-bird"
          src="/images/hero/hummingbird.png"
          alt=""
          width={42}
          height={42}
        />
      </span>
    </a>
  );
}

export function StoryScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      const bridge = section.querySelector(".story-sky-bridge");
      const lip = section.querySelector(".story-cloud-lip");

      // Soften sky bridge once §3 owns the viewport.
      if (bridge) {
        gsap.fromTo(
          bridge,
          { autoAlpha: 1 },
          {
            autoAlpha: 0,
            ease: "none",
            immediateRender: false,
            scrollTrigger: {
              trigger: section,
              start: "top 50%",
              end: "top top",
              scrub: 0.45,
            },
          },
        );
      }

      // Lip visible at the join, then fades once §3 fills the screen.
      if (lip) {
        gsap.set(lip, { autoAlpha: 1, scale: 1, transformOrigin: "50% 0%" });

        gsap.to(lip, {
          autoAlpha: 0,
          ease: "none",
          immediateRender: false,
          scrollTrigger: {
            trigger: section,
            start: "top 8%",
            end: "top -12%",
            scrub: 0.4,
          },
        });
      }

      /*
        First slide enter: BG stays still. Bird (left) + copy (right)
        slide up and slightly left into place.
      */
      const bird = section.querySelector(".story-ordinary-bird");
      const copy = section.querySelector(".story-ordinary-copy");

      if (bird) {
        // Start lower-right → settle up and further left (same scrub).
        gsap.fromTo(
          bird,
          { y: 110, x: 120, autoAlpha: 0.7 },
          {
            y: 0,
            x: -48,
            autoAlpha: 1,
            ease: "none",
            immediateRender: true,
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              end: "top 18%",
              scrub: 0.55,
            },
          },
        );
      }

      if (copy) {
        // Start lower-right → settle up and further left (same scrub).
        gsap.fromTo(
          copy,
          { y: 96, x: 140, autoAlpha: 0.65 },
          {
            y: 0,
            x: -56,
            autoAlpha: 1,
            ease: "none",
            immediateRender: true,
            scrollTrigger: {
              trigger: section,
              start: "top 75%",
              end: "top 12%",
              scrub: 0.55,
            },
          },
        );
      }

      mm.add("(min-width: 1024px)", () => {
        const viewport = section.querySelector<HTMLElement>(
          ".story-scroll-viewport",
        );
        const panels = Array.from(
          track.querySelectorAll<HTMLElement>(".story-panel"),
        );
        const trackBg = track.querySelector<HTMLElement>(".story-track-bg");
        if (!viewport || panels.length === 0) return;

        // Travel = last panel's right edge → viewport right.
        // Use clientWidth (not innerWidth) so scrollbar / vw mismatch
        // doesn't end the pin before the track finishes.
        const getViewW = () => viewport.clientWidth || window.innerWidth;

        const getTotal = () => {
          const last = panels[panels.length - 1];
          return last.offsetLeft + last.offsetWidth;
        };

        const getTravel = () => Math.max(0, getTotal() - getViewW());

        const syncTrackBg = () => {
          if (!trackBg) return;
          gsap.set(trackBg, { width: getTotal(), height: "100%" });
        };

        gsap.set(track, { x: 0, force3D: true });
        syncTrackBg();

        gsap.to(track, {
          x: () => -getTravel(),
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${Math.max(1, Math.round(getTravel()))}`,
            pin: true,
            pinSpacing: true,
            // Higher scrub = smoother inertia; no fastScrollEnd snap.
            scrub: 1.35,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: syncTrackBg,
          },
        });

        const refresh = () => {
          syncTrackBg();
          ScrollTrigger.refresh();
        };

        const bgImg = track.querySelector<HTMLImageElement>(".story-track-bg");
        if (bgImg && !bgImg.complete) {
          bgImg.addEventListener("load", refresh, { once: true });
        } else {
          requestAnimationFrame(() => requestAnimationFrame(refresh));
        }

        window.addEventListener("load", refresh, { once: true });

        const ro = new ResizeObserver(() => {
          syncTrackBg();
          ScrollTrigger.refresh();
        });
        ro.observe(viewport);
        panels.forEach((panel) => ro.observe(panel));

        return () => {
          ro.disconnect();
          window.removeEventListener("load", refresh);
        };
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      className="story-scroll"
      id="our-story"
      aria-label="Our story"
      ref={sectionRef}
    >
      {/* Sky underlay — blocks green flash under soft cloud alpha at the join. */}
      <div className="story-sky-bridge" aria-hidden="true" />
      {/*
        Same clouds-section.png — BOTTOM curvy lip sits ABOVE the story panels
        (z-index) so it can hang into §3. Zoomed-out crop mirrors the top enter.
      */}
      <div className="story-cloud-lip" aria-hidden="true">
        {/* Opaque sky fill masked by the cloud PNG — blocks green bleed. */}
        <div className="story-cloud-lip-fill" />
        <img
          src="/images/clouds-section.png"
          alt=""
          width={1600}
          height={2600}
          draggable={false}
        />
      </div>
      <div className="story-scroll-viewport">
        <div className="story-track" ref={trackRef}>
          {/* Continuous sky across all 3 slides — top alignment locked. */}
          <img
            className="story-track-bg"
            src="/images/story/bg.png"
            alt=""
            width={4096}
            height={1024}
            draggable={false}
          />
          {/* Slide 1 — Outside the Ordinary */}
          <article className="story-panel story-panel--ordinary">
            <img
              className="story-ordinary-bird"
              src="/images/story/darter.png"
              alt="A darter perched on a leafy branch"
              width={705}
              height={713}
              draggable={false}
            />
            <div className="story-ordinary-copy">
              <h2 className="story-heading story-heading--center story-heading--two-line">
                <span className="story-heading-line">
                  What Happens When We Step
                </span>
                <span className="story-heading-line">
                  Outside the Ordinary?
                </span>
              </h2>
              <p className="story-lead story-lead--center">
                The wild has a way of changing our perspective. We begin to
                observe differently, listen more closely, and notice what we
                normally miss.
              </p>
              <ul className="story-pillars">
                {PILLARS.map((item) => (
                  <li className="story-pillar" key={item.title}>
                    <img
                      className="story-pillar-icon"
                      src={item.icon}
                      alt=""
                      width={107}
                      height={107}
                    />
                    <h3 className="story-pillar-title">{item.title}</h3>
                    <p className="story-pillar-copy">{item.copy}</p>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          {/* Slide 2 — Boardrooms to the Wild */}
          <article className="story-panel story-panel--boardrooms">
            <img
              className="story-boardrooms-silhouettes"
              src="/images/story/silhouettes.png"
              alt=""
              width={3079}
              height={1000}
              draggable={false}
            />
            <div className="story-boardrooms-inner">
              <div className="story-boardrooms-intro">
                <h2 className="story-heading">From Boardrooms to the Wild</h2>
                <div className="story-boardrooms-lead">
                  <p>
                    Wildefy brings together a journey shaped by years in the
                    corporate world and a deep connection with
                    <br />
                    wildlife, photography, and the wilderness.
                  </p>
                  <p>
                    Through experiences in business and time spent observing the
                    natural world, Hymakar Valluri discovered a
                    <br />
                    different way to think about leadership, people,
                    performance, and perspective.
                  </p>
                </div>
                <StoryCta label="Read full story" href="#our-story" />
              </div>

              <ol className="story-milestones">
                {MILESTONES.map((item) => (
                  <li className="story-milestone" key={item.label}>
                    <span className="story-milestone-label">{item.label}</span>
                    <span className="story-milestone-year">{item.year}</span>
                    <span className="story-milestone-title">{item.title}</span>
                    <span className="story-milestone-copy">{item.copy}</span>
                  </li>
                ))}
              </ol>
            </div>
          </article>

          {/* Slide 3 — Wild Changes the Conversation */}
          <article className="story-panel story-panel--conversation">
            <img
              className="story-conversation-cheetahs"
              src="/images/story/cheetahs.png"
              alt="Two cheetahs grooming"
              width={704}
              height={591}
              draggable={false}
            />
            <img
              className="story-conversation-tiger"
              src="/images/story/tiger.png"
              alt="A tiger walking forward"
              width={991}
              height={527}
              draggable={false}
            />
            <div className="story-conversation-copy">
              <h2 className="story-heading story-heading--center story-heading--conversation">
                The Wild Changes the Conversation.
              </h2>
              <p className="story-lead story-lead--center story-conversation-lead">
                Put a leadership team in a boardroom and the conversation
                follows familiar patterns.
                <br />
                Put the same people in the wilderness — and something changes.
              </p>
              <ul className="story-values">
                {VALUES.map((item) => (
                  <li className="story-value" key={item.title}>
                    <img
                      className="story-value-icon"
                      src={item.icon}
                      alt=""
                      width={107}
                      height={107}
                    />
                    <h3 className="story-value-title">{item.title}</h3>
                  </li>
                ))}
              </ul>
              <div className="story-conversation-footer">
                <p className="story-conversation-lines">
                  The pace slows.
                  <br />
                  Attention sharpens.
                  <br />
                  People observe.
                  <br />
                  People listen.
                  <br />
                  People respond differently.
                </p>
                <p className="story-conversation-close">
                  Wildefy uses the wilderness to create experiences that stay
                  with people long
                  <br />
                  after they return.
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
