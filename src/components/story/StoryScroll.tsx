"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { StoryCloudTransition } from "@/components/story/StoryCloudTransition";

gsap.registerPlugin(ScrollTrigger);

/** Bird settle while Experiences’ shared handoff veil dissolves. */
const CLOUD_REVEAL_VH = 0.85;

/**
 * Parallax travel factors.
 * Content = 100%. Clouds crawl vs content so slide motion is obvious.
 */
const LAYER_BG = 0.76;
const LAYER_CLOUDS = 0.32;
const LAYER_IMAGES = 0.82;
const LAYER_SLIDE_CLOUDS = 1;
const LAYER_CONTENT = 1;

/** Light scrub — keep reverse (bottom→top) as tight as forward. */
const STORY_SCRUB = 0.3;

/**
 * Soft-cloud patches. Compact sizes avoid hard rectangular cuts.
 * `depth` adds extra local drift while the slide pans.
 */
/* First slide uses one dedicated cloud only — no soft sky patches */
const SKY_CLOUDS = [] as const;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/*
  First horizontal sequence (Figma 507:354).
  Three independently scrolling layers:
    1. Background sky
    2. Top / side imagery (darter, camp, hummingbird, cockatoo)
    3. Editorial scroll content (headings, pillars, milestones, copy)
*/

const PILLARS = [
  {
    title: "Learn",
    copy: "The classroom teaches us to think.",
    icon: "/images/story/icon-learn.png",
    left: "36.56vw",
  },
  {
    title: "Lead",
    copy: "The boardroom teaches us to decide.",
    icon: "/images/story/icon-lead.png",
    left: "58.07vw",
  },
  {
    title: "Explore",
    copy: "The wilderness teaches us to observe.",
    icon: "/images/story/icon-explore.png",
    left: "79.58vw",
  },
] as const;

const MILESTONES = [
  {
    label: "Decades",
    year: "2005 - 2015",
    title: "Corporate Leadership",
    copy: "Targets, teams, decisions and transformation.",
    left: "159.17vw",
    width: "22.71vw",
  },
  {
    label: "Alongside",
    year: "2018",
    title: "The Wilderness",
    copy: "Years of expeditions across continents.",
    left: "183.02vw",
    width: "19.38vw",
  },
  {
    label: "The Bridge",
    year: "2018",
    title: "Wildefy",
    copy: "Where corporate leadership meets the wild.",
    left: "206.98vw",
    width: "22.71vw",
  },
] as const;

/* Tight cluster just after the hummingbird clears (~249–301vw). */
const VALUES = [
  {
    title: "Perspective",
    icon: "/images/story/icon-perspective.png",
    left: "312vw",
  },
  {
    title: "Patience",
    icon: "/images/story/icon-patience.png",
    left: "326vw",
  },
  {
    title: "Resilience",
    icon: "/images/story/icon-resilience.png",
    left: "340vw",
  },
  {
    title: "Connection",
    icon: "/images/story/icon-connection.png",
    left: "354vw",
  },
] as const;

export function StoryScroll() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const viewport = section.querySelector<HTMLElement>(".sx-viewport");
        const panel = section.querySelector<HTMLElement>(".sx-panel");
        const layerBg = section.querySelector<HTMLElement>(".sx-layer--bg");
        const layerClouds =
          section.querySelector<HTMLElement>(".sx-layer--clouds");
        const layerImages =
          section.querySelector<HTMLElement>(".sx-layer--images");
        const layerSlideClouds = section.querySelector<HTMLElement>(
          ".sx-layer--slide-clouds",
        );
        const layerContent =
          section.querySelector<HTMLElement>(".sx-layer--content");
        const cloudNodes = Array.from(
          section.querySelectorAll<HTMLElement>(".sx-sky-cloud"),
        );
        /* First + second: +10% with pan, hold on stop */
        const slideClouds = [
          section.querySelector<HTMLElement>(".sx-bottom-cloud"),
          section.querySelector<HTMLElement>(".sx-boardrooms-cloud"),
        ].filter(Boolean) as HTMLElement[];
        /* Third: +10% with pan, then another +10% coast after scroll stops */
        const thirdCloud = section.querySelector<HTMLElement>(
          ".sx-conversation-cloud",
        );

        const bird = section.querySelector<HTMLElement>(".sx-darter");
        if (
          !viewport ||
          !panel ||
          !layerBg ||
          !layerClouds ||
          !layerImages ||
          !layerSlideClouds ||
          !layerContent
        )
          return;

        const getViewW = () => viewport.clientWidth || window.innerWidth;
        const getTravel = () =>
          Math.max(0, panel.offsetWidth - getViewW());
        const getRevealRun = () =>
          Math.max(420, Math.round(window.innerHeight * CLOUD_REVEAL_VH));

        gsap.set(
          [layerBg, layerClouds, layerImages, layerSlideClouds, layerContent],
          {
            x: 0,
            force3D: true,
          },
        );
        gsap.set(cloudNodes, { x: 0, y: 0, force3D: true });
        gsap.set(slideClouds, { x: 0, y: 0, force3D: true });
        if (thirdCloud) gsap.set(thirdCloud, { x: 0, y: 0, force3D: true });

        let thirdBaseX = 0;
        let thirdIdleTimer = 0;
        let thirdCoast: gsap.core.Tween | null = null;

        const killThirdCoast = () => {
          if (thirdIdleTimer) {
            window.clearTimeout(thirdIdleTimer);
            thirdIdleTimer = 0;
          }
          thirdCoast?.kill();
          thirdCoast = null;
        };

        const coastThirdAfterStop = () => {
          if (!thirdCloud) return;
          thirdCoast?.kill();
          const extra = Math.round(thirdCloud.offsetWidth * 0.1);
          thirdCoast = gsap.to(thirdCloud, {
            x: thirdBaseX - extra,
            duration: 2.4,
            ease: "power2.out",
            force3D: true,
          });
        };

        if (bird) {
          gsap.set(bird, {
            transformOrigin: "32% 72%",
            autoAlpha: 0.2,
            scale: 0.8,
            yPercent: 18,
            xPercent: -9,
            force3D: true,
          });
        }

        /** Immediate set — mirrors scroll progress both directions (no quickTo lag). */
        const applyProgress = (progress: number) => {
          const revealPx = getRevealRun();
          const travelPx = getTravel();
          const total = Math.max(1, revealPx + travelPx);
          const revealEnd = revealPx / total;
          const p = Math.min(1, Math.max(0, progress));

          const t = p <= revealEnd ? p / revealEnd : 1;

          if (bird) {
            gsap.set(bird, {
              autoAlpha: 0.2 + 0.8 * t,
              scale: 0.8 + 0.2 * t,
              yPercent: 18 * (1 - t),
              xPercent: -9 * (1 - t),
            });
          }

          const panT =
            p <= revealEnd
              ? 0
              : (p - revealEnd) / Math.max(0.0001, 1 - revealEnd);

          gsap.set(layerBg, { x: -travelPx * LAYER_BG * panT, force3D: true });
          gsap.set(layerClouds, {
            x: -travelPx * LAYER_CLOUDS * panT,
            force3D: true,
          });
          gsap.set(layerImages, {
            x: -travelPx * LAYER_IMAGES * panT,
            force3D: true,
          });
          gsap.set(layerSlideClouds, {
            x: -travelPx * LAYER_SLIDE_CLOUDS * panT,
            force3D: true,
          });
          gsap.set(layerContent, {
            x: -travelPx * LAYER_CONTENT * panT,
            force3D: true,
          });

          cloudNodes.forEach((node, i) => {
            const depth = SKY_CLOUDS[i]?.depth ?? 0.9;
            gsap.set(node, {
              x: -(travelPx * 0.2 * depth * panT),
              y: Math.sin(panT * Math.PI * 1.2 + i * 0.9) * 12 * depth,
              force3D: true,
            });
          });

          slideClouds.forEach((el) => {
            const extra = Math.round(el.offsetWidth * 0.1) * panT;
            gsap.set(el, { x: -extra, force3D: true });
          });

          if (thirdCloud) {
            thirdBaseX = -Math.round(thirdCloud.offsetWidth * 0.1) * panT;
            gsap.set(thirdCloud, { x: thirdBaseX, force3D: true });
          }
        };

        const storyTrigger = ScrollTrigger.create({
          id: "story-pin",
          trigger: section,
          start: "top top",
          end: () =>
            `+=${Math.max(1, Math.round(getRevealRun() + getTravel()))}`,
          pin: true,
          pinSpacing: true,
          scrub: STORY_SCRUB,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
          onUpdate: (self) => {
            killThirdCoast();
            applyProgress(self.progress);
            if (thirdCloud) {
              thirdIdleTimer = window.setTimeout(coastThirdAfterStop, 160);
            }
          },
          onRefresh: (self) => {
            killThirdCoast();
            applyProgress(self.progress);
          },
          // Bidirectional snaps — reverse re-entry must rebuild bird reveal + pan.
          onEnter: (self) => {
            killThirdCoast();
            applyProgress(self.progress);
          },
          onLeave: () => {
            killThirdCoast();
            applyProgress(1);
          },
          onLeaveBack: () => {
            killThirdCoast();
            applyProgress(0);
          },
          onEnterBack: (self) => {
            killThirdCoast();
            applyProgress(self.progress);
          },
        });

        applyProgress(storyTrigger.progress);
        if (thirdCloud) {
          thirdIdleTimer = window.setTimeout(coastThirdAfterStop, 400);
        }

        let refreshQueued = false;
        const refresh = () => {
          if (refreshQueued) return;
          refreshQueued = true;
          requestAnimationFrame(() => {
            refreshQueued = false;
            ScrollTrigger.refresh();
          });
        };
        window.addEventListener("load", refresh, { once: true });
        const ro = new ResizeObserver(refresh);
        ro.observe(viewport);
        ro.observe(panel);

        return () => {
          killThirdCoast();
          ro.disconnect();
          window.removeEventListener("load", refresh);
          storyTrigger.kill();
        };
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      className="sx-scroll"
      id="our-story"
      aria-label="Our story"
      ref={sectionRef}
    >
      <div className="sx-viewport">
        {/* Fresh cloudy open + close for §4 Our Story */}
        <StoryCloudTransition sectionRef={sectionRef} />

        <div className="sx-track">
          <article className="sx-panel">
            {/* Part 1a — sky base (Figma image 22) */}
            <div className="sx-layer sx-layer--bg" aria-hidden="true" />

            {/* Part 1b — soft clouds on top of sky; pan after background */}
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

            {/* Part 2 — top / side imagery */}
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
            </div>

            {/* Part 2b — white clouds lead; content layer follows after */}
            <div
              className="sx-layer sx-layer--slide-clouds"
              aria-hidden="true"
            >
              <div className="sx-bottom-cloud">
                <img
                  src="/images/story-figma/cloud-bottom-white.png"
                  alt=""
                  width={1024}
                  height={544}
                  draggable={false}
                  decoding="async"
                />
              </div>
              <div className="sx-boardrooms-cloud">
                <img
                  src="/images/story-figma/cloud-boardrooms-white.png"
                  alt=""
                  width={1200}
                  height={600}
                  draggable={false}
                  decoding="async"
                />
              </div>
              <div className="sx-conversation-cloud">
                <img
                  src="/images/story-figma/cloud-bottom-white.png"
                  alt=""
                  width={1024}
                  height={544}
                  draggable={false}
                  decoding="async"
                />
              </div>
            </div>

            {/* Part 3 — editorial scroll content (lags behind slide clouds) */}
            <div className="sx-layer sx-layer--content">
              {/*
                Camp / ridge photo sits in the content stack (above slide
                clouds) so silhouettes read in front of the white mist.
              */}
              <div className="sx-camp" aria-hidden="true">
                <img
                  src="/images/story-figma/camp.png"
                  alt=""
                  width={2172}
                  height={724}
                  draggable={false}
                />
              </div>
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
              {PILLARS.map((item) => (
                <div
                  className="sx-pillar"
                  key={item.title}
                  style={{ left: item.left }}
                >
                  <img
                    className="sx-icon"
                    src={item.icon}
                    alt=""
                    width={512}
                    height={512}
                  />
                  <h3 className="sx-pillar-title">{item.title}</h3>
                  <p className="sx-pillar-copy">{item.copy}</p>
                </div>
              ))}

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
              <a className="sx-cta" href="#our-story">
                <span className="sx-cta-body">Read Full Story</span>
                <span className="sx-cta-mark" aria-hidden="true">
                  <img
                    src="/images/hero/hummingbird.png"
                    alt=""
                    width={512}
                    height={512}
                  />
                </span>
              </a>
              {MILESTONES.map((item) => (
                <div
                  className="sx-milestone"
                  key={item.label}
                  style={{ left: item.left, width: item.width }}
                >
                  <span className="sx-milestone-label">{item.label}</span>
                  <span className="sx-milestone-year">{item.year}</span>
                  <span className="sx-milestone-title">{item.title}</span>
                  <span className="sx-milestone-copy">{item.copy}</span>
                </div>
              ))}

              {/* Bird beat — conversation copy follows to the right */}
              <div className="sx-hummingbird">
                <img
                  src="/images/story-figma/hummingbird-photo.png"
                  alt="A hummingbird hovering beneath a hanging flower"
                  width={1600}
                  height={1066}
                  draggable={false}
                />
              </div>

              <h2 className="sx-heading sx-heading--conversation">
                The Wild Changes The Conversation.
              </h2>
              <p className="sx-lead sx-lead--conversation">
                Put a leadership team in a boardroom and the conversation
                follows familiar patterns.
                <br />
                Put the same people in the wilderness — and something changes.
              </p>
              {VALUES.map((item) => (
                <div
                  className="sx-value"
                  key={item.title}
                  style={{ left: item.left }}
                >
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
              <div className="sx-footer">
                <p>
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
                <p>
                  Wildefy uses the wilderness to create experiences that stay
                  with people long after they return.
                </p>
              </div>

              {/* Final beat — keeps the horizontal end flush with content */}
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
