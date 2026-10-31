"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  STORY_EXIT_HANDOFF_VH,
  STORY_PAN_SCALE,
} from "@/components/story/storySeamConstants";

gsap.registerPlugin(ScrollTrigger);

/* First slide uses one dedicated cloud only — no soft sky patches */
const SKY_CLOUDS: { left: string; top: string; size: number }[] = [];

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Layer rates (finish order). Clouds lag behind; eagle/images lock to
 * content so wildlife never drifts over the copy.
 */
const RATE_SKY = 10;
const RATE_CLOUDS = 11;
const RATE_SLIDE_CLOUDS = 12;
const RATE_IMAGES = 16;
const RATE_CONTENT = 16;
const RATE_MAX = 16;

/** Smooth settle after wheel stops (~2s lag). */
const STORY_SCRUB = 2;

const PILLARS = [
  {
    title: "Learn",
    copy: ["The classroom teaches", "us to think."] as const,
    icon: "/images/story/icon-learn.png",
  },
  {
    title: "Lead",
    copy: ["The boardroom teaches", "us to decide."] as const,
    icon: "/images/story/icon-lead.png",
  },
  {
    title: "Explore",
    copy: ["The wilderness teaches", "us to observe."] as const,
    icon: "/images/story/icon-explore.png",
  },
] as const;

const MILESTONES = [
  {
    label: "Decades",
    year: "2005 - 2015",
    title: "Corporate Leadership",
    copy: ["Targets, teams, decisions and", "transformation."] as const,
    /* After boardrooms column (~98–150vw) — no overlap */
    left: "158vw",
    width: "22vw",
  },
  {
    label: "Alongside",
    year: "2018",
    title: "The Wilderness",
    copy: ["Years of expeditions across", "continents."] as const,
    left: "182vw",
    width: "20vw",
  },
  {
    label: "The Bridge",
    year: "2018",
    title: "Wildefy",
    copy: ["Where corporate leadership ", "meets the wild."] as const,
    /* Ends before eagle (~232vw) */
    left: "204vw",
    width: "18vw",
  },
] as const;

/* Values sit with conversation copy after the eagle clears. */
const VALUES = [
  {
    title: "Perspective",
    icon: "/images/story/icon-perspective.png",
  },
  {
    title: "Patience",
    icon: "/images/story/icon-patience.png",
  },
  {
    title: "Resilience",
    icon: "/images/story/icon-resilience.png",
  },
  {
    title: "Connection",
    icon: "/images/story/icon-connection.png",
  },
] as const;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

type StoryScrollProps = {
  /** When false, skip StorySeam mist runway (used by /v2). Default true. */
  seamReveal?: boolean;
};

/**
 * Horizontal Our Story strip. Layers share −x direction but different rates
 * so clouds lag behind content (parallax depth).
 */
export function StoryScroll({ seamReveal = true }: StoryScrollProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const panel = panelRef.current;
    if (!section || !viewport || !track || !panel || prefersReducedMotion()) {
      return;
    }

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        ScrollTrigger.getById("story-pin")?.kill();

        const layerClouds =
          panel.querySelector<HTMLElement>(".sx-layer--clouds");
        const layerSlideClouds = panel.querySelector<HTMLElement>(
          ".sx-layer--slide-clouds",
        );
        const layerImages =
          panel.querySelector<HTMLElement>(".sx-layer--images");
        const layerContent =
          panel.querySelector<HTMLElement>(".sx-layer--content");
        /* Same shared sky as Gallery — do not swap in a second plate */
        const skyPlate = document.querySelector<HTMLElement>(
          "[data-gallery-story-sky]",
        );
        if (
          !layerClouds ||
          !layerSlideClouds ||
          !layerImages ||
          !layerContent
        ) {
          return;
        }

        const getViewW = () => viewport.clientWidth || window.innerWidth;
        const getPanelW = () => Math.max(panel.offsetWidth, getViewW());
        const getTravel = () => Math.max(1, getPanelW() - getViewW());

        const getPanRun = () =>
          Math.max(1, Math.round(getTravel() * STORY_PAN_SCALE));
        const getHandoffRun = () =>
          seamReveal
            ? Math.round(window.innerHeight * (STORY_EXIT_HANDOFF_VH / 100))
            : 0;
        const getStoryRun = () => getPanRun() + getHandoffRun();

        const layerEls = [
          layerClouds,
          layerSlideClouds,
          layerImages,
          layerContent,
        ];

        gsap.set(track, { x: 0, clearProps: "transform" });
        gsap.set(layerEls, { x: 0, force3D: true });
        if (skyPlate) gsap.set(skyPlate, { x: 0, force3D: true });

        /**
         * Same −x direction for every layer; lower rates travel less so
         * clouds stay behind content (readable delay / depth).
         */
        const applyParallax = (panT: number) => {
          const t = clamp(panT, 0, 1);
          const travel = getTravel();
          const xFor = (rate: number) => -travel * (rate / RATE_MAX) * t;
          gsap.set(layerClouds, { x: xFor(RATE_CLOUDS), force3D: true });
          gsap.set(layerSlideClouds, {
            x: xFor(RATE_SLIDE_CLOUDS),
            force3D: true,
          });
          gsap.set(layerImages, { x: xFor(RATE_IMAGES), force3D: true });
          gsap.set(layerContent, { x: xFor(RATE_CONTENT), force3D: true });
          if (skyPlate) gsap.set(skyPlate, { x: xFor(RATE_SKY), force3D: true });
        };

        const panFromPinProgress = (progress: number) => {
          const pan = getPanRun();
          const total = getStoryRun();
          if (total <= 0) return 0;
          return clamp((progress * total) / pan, 0, 1);
        };

        const storyTrigger = ScrollTrigger.create({
          id: "story-pin",
          trigger: viewport,
          start: "top top",
          end: () => `+=${getStoryRun()}`,
          pin: true,
          pinSpacing: true,
          scrub: STORY_SCRUB,
          anticipatePin: 0,
          invalidateOnRefresh: true,
          refreshPriority: -3,
          fastScrollEnd: true,
          onUpdate: (self) => {
            applyParallax(panFromPinProgress(self.progress));
          },
          onRefresh: (self) => {
            applyParallax(panFromPinProgress(self.progress));
          },
          onLeave: () => {
            applyParallax(1);
          },
          onLeaveBack: () => {
            applyParallax(0);
          },
        });

        applyParallax(panFromPinProgress(storyTrigger.progress));

        const refreshLater = window.setTimeout(
          () => ScrollTrigger.refresh(),
          320,
        );

        let refreshQueued = false;
        const ro = new ResizeObserver(() => {
          if (refreshQueued) return;
          refreshQueued = true;
          requestAnimationFrame(() => {
            refreshQueued = false;
            storyTrigger.refresh();
          });
        });
        ro.observe(viewport);
        ro.observe(panel);

        return () => {
          window.clearTimeout(refreshLater);
          ro.disconnect();
          storyTrigger.kill();
          if (skyPlate) gsap.set(skyPlate, { clearProps: "transform" });
        };
      });

      mm.add("(max-width: 1023px)", () => {
        gsap.set(track, { clearProps: "transform" });
        gsap.set(panel.querySelectorAll<HTMLElement>(".sx-layer"), {
          clearProps: "transform",
        });
      });
    }, section);

    return () => ctx.revert();
  }, [seamReveal]);

  return (
    <section
      className="sx-scroll"
      id="our-story"
      aria-label="Our story"
      ref={sectionRef}
    >
      <div className="sx-viewport" ref={viewportRef}>
        <div className="sx-track" ref={trackRef}>
          <article className="sx-panel" ref={panelRef}>
            {/* Part 1a — sky base (Figma image 22) */}
            <div className="sx-layer sx-layer--bg" aria-hidden="true" />

            {/* Part 1b — soft clouds on top of sky */}
            <div className="sx-layer sx-layer--clouds" aria-hidden="true">
              {SKY_CLOUDS.map((cloud, i) => (
                <div
                  key={i}
                  className={`sx-sky-cloud sx-sky-cloud--${i + 1}`}
                  style={{
                    left: cloud.left,
                    top: cloud.top,
                    ["--cloud-size" as string]: String(cloud.size),
                    ["--cloud-delay" as string]: `${i * 0.55}s`,
                  }}
                >
                  <img
                    src="/images/story-figma/clouds-soft-light.png"
                    alt=""
                    width={4096}
                    height={2234}
                    draggable={false}
                    decoding="async"
                  />
                </div>
              ))}
            </div>

            {/*
              Part 2 — front images (left / middle / bottom / right).
              Parallax rate 14 — ahead of sky & clouds, behind copy.
            */}
            <div className="sx-layer sx-layer--images" aria-hidden="false">
              <div className="sx-darter-stage">
                <div className="sx-darter">
                  <img
                    src="/images/story/darter.png"
                    alt="A darter perched on a leafy branch"
                    width={1223}
                    height={1223}
                    draggable={false}
                    decoding="async"
                  />
                </div>
              </div>
              <div className="sx-camp" aria-hidden="true">
                <img
                  src="/images/story-figma/camp.png"
                  alt=""
                  width={2172}
                  height={724}
                  draggable={false}
                />
              </div>
              <div className="sx-hummingbird">
                <img
                  src="/images/story-figma/seam/eagle-1.png"
                  alt="A bald eagle soaring"
                  width={2128}
                  height={3296}
                  draggable={false}
                  decoding="async"
                />
              </div>
            </div>

            {/* Part 2b — fluffy clouds from Figma 729:24 */}
            <div
              className="sx-layer sx-layer--slide-clouds"
              aria-hidden="true"
            >
              <div className="sx-bottom-cloud">
                <img
                  src="/images/story-figma/seam/cloud-fluffy-cutout.png"
                  alt=""
                  width={3207}
                  height={1683}
                  draggable={false}
                  decoding="async"
                />
              </div>
              <div className="sx-boardrooms-cloud">
                <img
                  src="/images/story-figma/seam/cloud-fluffy-cutout.png"
                  alt=""
                  width={3207}
                  height={1683}
                  draggable={false}
                  decoding="async"
                />
              </div>
              <div className="sx-conversation-cloud">
                <img
                  src="/images/story-figma/seam/cloud-fluffy-cutout.png"
                  alt=""
                  width={3207}
                  height={1683}
                  draggable={false}
                  decoding="async"
                />
              </div>
            </div>

            {/* Part 3 — editorial copy (parallax rate 16 — finishes last) */}
            <div className="sx-layer sx-layer--content">
              <div className="sx-intro">
                <h2 className="sx-heading sx-heading--ordinary">
                  What Happens When We Step
                  <br />
                  Outside The Ordinary?
                </h2>
                <p className="sx-lead sx-lead--ordinary">
                  The wild has a way of changing our perspective. We begin to
                  observe differently, listen more closely, and notice what we
                  normally miss.
                </p>
                <div className="sx-pillars">
                  {PILLARS.map((item) => (
                    <div className="sx-pillar" key={item.title}>
                      <img
                        className="sx-icon"
                        src={item.icon}
                        alt=""
                        width={512}
                        height={512}
                      />
                      <h3 className="sx-pillar-title">{item.title}</h3>
                      <p className="sx-pillar-copy">
                        {item.copy[0]}
                        <br />
                        {item.copy[1]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/*
                Boardrooms CTA beat — vertically centered column, nudged
                30px left from the prior absolute projection.
              */}
              <div className="sx-boardrooms">
                <h2 className="sx-heading sx-heading--boardrooms">
                  From Boardrooms To The Wild
                </h2>
                <div className="sx-boardrooms-copy">
                  <p>
                    Wildefy brings together a journey shaped by years in the
                    corporate world and a deep connection with wildlife,
                    photography, and the wilderness.
                  </p>
                  <p>
                    Through experiences in business and time spent observing the
                    natural world, Hymakar Valluri discovered a different way to
                    think about leadership, people, performance, and perspective.
                  </p>
                </div>
                <a className="cta sx-cta" href="#our-story">
                  <span className="cta-pill" aria-hidden="true" />
                  <span className="cta-label">Read Full Story</span>
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
              {MILESTONES.map((item) => (
                <div
                  className="sx-milestone"
                  key={item.label}
                  style={{ left: item.left, width: item.width }}
                >
                  <span className="sx-milestone-label">{item.label}</span>
                  <span className="sx-milestone-year">{item.year}</span>
                  <span className="sx-milestone-title">{item.title}</span>
                  <span className="sx-milestone-copy">
                    {item.copy[0]}
                    <br />
                    {item.copy[1]}
                  </span>
                </div>
              ))}

              <div className="sx-conversation">
                <h2 className="sx-heading sx-heading--conversation">
                  The Wild Changes The Conversation.
                </h2>
                <p className="sx-lead sx-lead--conversation">
                  Put a leadership team in a boardroom and the conversation
                  follows familiar patterns.
                  <br />
                  Put the same people in the wilderness — and something
                  changes.
                </p>
                <div className="sx-values">
                  {VALUES.map((item) => (
                    <div className="sx-value" key={item.title}>
                      <img
                        className="sx-icon"
                        src={item.icon}
                        alt=""
                        width={512}
                        height={512}
                      />
                      <h3 className="sx-value-title">{item.title}</h3>
                    </div>
                  ))}
                </div>
              </div>

              {/*
                Final fauna beat — rides content rate (16) so it fully enters
                view before the exit mist. Kept out of the slower images layer.
              */}
              <div className="sx-cockatoo">
                <img
                  src="/images/story-figma/cockatoo.png"
                  alt="A white cockatoo perched on a red No Stopping sign"
                  width={1170}
                  height={1463}
                  draggable={false}
                />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
