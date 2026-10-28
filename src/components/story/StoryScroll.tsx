"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Bird settle while Experiences’ shared handoff veil dissolves. */
const CLOUD_REVEAL_VH = 0.85;

/**
 * Full horizontal travel scale per layer (relative to panel − viewport).
 * Layers start in sequence; each still uses its own distance.
 */
/** Background pan distance — 10% slower than the previous 0.92 scale. */
const LAYER_BG = 0.828;
const LAYER_CLOUDS = 0.55;
const LAYER_SLIDE_CLOUDS = 1;
const LAYER_IMAGES = 0.88;
const LAYER_CONTENT = 1;

/**
 * All layers start together (start: 0). They finish / hold one after another:
 * background stops first → clouds → images → content last.
 */
const PHASE_BG = { start: 0, end: 0.42 };
const PHASE_CLOUDS = { start: 0, end: 0.68 };
const PHASE_IMAGES = { start: 0, end: 0.84 };
const PHASE_CONTENT = { start: 0, end: 1 };

/** Soft scrub lag — layers ease toward scroll instead of snapping. */
const STORY_SCRUB = 0.85;

/** Extra coast after scroll stops (~10% of that layer’s applied travel). */
const COAST_EXTRA = 0.1;
const COAST_DURATION = 2.4;
const COAST_IDLE_MS = 140;
/** Stagger when settling after scroll stop — bg first, content last. */
const COAST_STAGGER = 0.28;

/* First slide uses one dedicated cloud only — no soft sky patches */
const SKY_CLOUDS = [] as const;

/** 0 before phase, 1 after phase, eased inside. */
function phaseProgress(
  panT: number,
  phase: { start: number; end: number },
) {
  if (panT <= phase.start) return 0;
  if (panT >= phase.end) return 1;
  const u = (panT - phase.start) / Math.max(0.0001, phase.end - phase.start);
  // Smoothstep — no hard start/stop at phase edges
  return u * u * (3 - 2 * u);
}

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

        const layerTargets = [
          layerBg,
          layerClouds,
          layerImages,
          layerSlideClouds,
          layerContent,
        ];
        gsap.set(layerTargets, { x: 0, force3D: true });
        gsap.set(cloudNodes, { x: 0, y: 0, force3D: true });
        gsap.set(slideClouds, { x: 0, y: 0, force3D: true });
        if (thirdCloud) gsap.set(thirdCloud, { x: 0, y: 0, force3D: true });

        /** Last scrubbed x per layer — used for +10% coast after scroll stops. */
        const layerBaseX = {
          bg: 0,
          clouds: 0,
          images: 0,
          slideClouds: 0,
          content: 0,
        };
        let scrollDir: 1 | -1 = 1;
        let lastProgress = 0;
        let idleTimer = 0;
        const coastTweens: gsap.core.Tween[] = [];

        const killCoast = () => {
          if (idleTimer) {
            window.clearTimeout(idleTimer);
            idleTimer = 0;
          }
          while (coastTweens.length) coastTweens.pop()?.kill();
        };

        const coastAfterStop = () => {
          killCoast();
          const dir = scrollDir;
          // Settle one-after-one: bg → clouds → images → content
          const entries: { el: HTMLElement; base: number; order: number }[] = [
            { el: layerBg, base: layerBaseX.bg, order: 0 },
            { el: layerClouds, base: layerBaseX.clouds, order: 1 },
            { el: layerSlideClouds, base: layerBaseX.slideClouds, order: 1 },
            { el: layerImages, base: layerBaseX.images, order: 2 },
            { el: layerContent, base: layerBaseX.content, order: 3 },
          ];
          entries.forEach(({ el, base, order }) => {
            if (Math.abs(base) < 1) return;
            const coastX =
              dir > 0
                ? base - Math.abs(base) * COAST_EXTRA
                : base + Math.abs(base) * COAST_EXTRA;
            coastTweens.push(
              gsap.to(el, {
                x: coastX,
                duration: COAST_DURATION,
                delay: order * COAST_STAGGER,
                ease: "power3.out",
                force3D: true,
                overwrite: "auto",
              }),
            );
          });
          slideClouds.forEach((el) => {
            const cur = Number(gsap.getProperty(el, "x")) || 0;
            if (Math.abs(cur) < 1) return;
            const coastX =
              dir > 0
                ? cur - Math.abs(cur) * COAST_EXTRA
                : cur + Math.abs(cur) * COAST_EXTRA;
            coastTweens.push(
              gsap.to(el, {
                x: coastX,
                duration: COAST_DURATION,
                delay: 1 * COAST_STAGGER,
                ease: "power3.out",
                force3D: true,
                overwrite: "auto",
              }),
            );
          });
          if (thirdCloud) {
            const cur = Number(gsap.getProperty(thirdCloud, "x")) || 0;
            if (Math.abs(cur) >= 1) {
              const coastX =
                dir > 0
                  ? cur - Math.abs(cur) * COAST_EXTRA
                  : cur + Math.abs(cur) * COAST_EXTRA;
              coastTweens.push(
                gsap.to(thirdCloud, {
                  x: coastX,
                  duration: COAST_DURATION,
                  delay: 1 * COAST_STAGGER,
                  ease: "power3.out",
                  force3D: true,
                  overwrite: "auto",
                }),
              );
            }
          }
        };

        const scheduleCoast = () => {
          if (idleTimer) window.clearTimeout(idleTimer);
          idleTimer = window.setTimeout(coastAfterStop, COAST_IDLE_MS);
        };

        if (bird) {
          // Keep full opacity while entering — low alpha washed the bird white
          gsap.set(bird, {
            transformOrigin: "32% 72%",
            autoAlpha: 1,
            opacity: 1,
            scale: 0.86,
            yPercent: 12,
            xPercent: -6,
            force3D: true,
          });
        }

        /**
         * After bird reveal: every layer starts sliding together.
         * Each finishes / holds at a different panT so they stop one-by-one
         * (bg first → clouds → images → content last).
         */
        const applyProgress = (progress: number) => {
          const revealPx = getRevealRun();
          const travelPx = getTravel();
          const total = Math.max(1, revealPx + travelPx);
          const revealEnd = revealPx / total;
          const p = Math.min(1, Math.max(0, progress));

          if (p > lastProgress + 0.0001) scrollDir = 1;
          else if (p < lastProgress - 0.0001) scrollDir = -1;
          lastProgress = p;

          const t = p <= revealEnd ? p / revealEnd : 1;

          if (bird) {
            gsap.set(bird, {
              autoAlpha: 1,
              opacity: 1,
              scale: 0.86 + 0.14 * t,
              yPercent: 12 * (1 - t),
              xPercent: -6 * (1 - t),
            });
          }

          const panT =
            p <= revealEnd
              ? 0
              : (p - revealEnd) / Math.max(0.0001, 1 - revealEnd);

          const bgT = phaseProgress(panT, PHASE_BG);
          const cloudsT = phaseProgress(panT, PHASE_CLOUDS);
          const imagesT = phaseProgress(panT, PHASE_IMAGES);
          const contentT = phaseProgress(panT, PHASE_CONTENT);

          layerBaseX.bg = -travelPx * LAYER_BG * bgT;
          layerBaseX.clouds = -travelPx * LAYER_CLOUDS * cloudsT;
          layerBaseX.images = -travelPx * LAYER_IMAGES * imagesT;
          layerBaseX.slideClouds = -travelPx * LAYER_SLIDE_CLOUDS * cloudsT;
          layerBaseX.content = -travelPx * LAYER_CONTENT * contentT;

          gsap.set(layerBg, { x: layerBaseX.bg, force3D: true });
          gsap.set(layerClouds, { x: layerBaseX.clouds, force3D: true });
          gsap.set(layerImages, { x: layerBaseX.images, force3D: true });
          gsap.set(layerSlideClouds, {
            x: layerBaseX.slideClouds,
            force3D: true,
          });
          gsap.set(layerContent, { x: layerBaseX.content, force3D: true });

          cloudNodes.forEach((node, i) => {
            const depth = SKY_CLOUDS[i]?.depth ?? 0.9;
            gsap.set(node, {
              x: -(travelPx * 0.2 * depth * cloudsT),
              y: Math.sin(cloudsT * Math.PI * 1.2 + i * 0.9) * 12 * depth,
              force3D: true,
            });
          });

          slideClouds.forEach((el) => {
            const extra = Math.round(el.offsetWidth * 0.1) * cloudsT;
            gsap.set(el, { x: -extra, force3D: true });
          });

          if (thirdCloud) {
            const thirdX = -Math.round(thirdCloud.offsetWidth * 0.1) * cloudsT;
            gsap.set(thirdCloud, { x: thirdX, force3D: true });
          }
        };

        // Longer runway so each sequential phase has room to breathe
        const getStoryRun = () => {
          const travel = getTravel();
          // ~1.35× travel so bg/clouds/images/content phases don't feel rushed
          return Math.max(1, Math.round(getRevealRun() + travel * 1.35));
        };

        const storyTrigger = ScrollTrigger.create({
          id: "story-pin",
          trigger: section,
          start: "top top",
          end: () => `+=${getStoryRun()}`,
          pin: true,
          pinSpacing: true,
          scrub: STORY_SCRUB,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          fastScrollEnd: false,
          onUpdate: (self) => {
            killCoast();
            applyProgress(self.progress);
            scheduleCoast();
          },
          onRefresh: (self) => {
            killCoast();
            applyProgress(self.progress);
          },
          onEnter: (self) => {
            killCoast();
            applyProgress(self.progress);
          },
          onLeave: () => {
            killCoast();
            applyProgress(1);
          },
          onLeaveBack: () => {
            killCoast();
            applyProgress(0);
          },
          onEnterBack: (self) => {
            killCoast();
            applyProgress(self.progress);
          },
        });

        applyProgress(storyTrigger.progress);

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
          killCoast();
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
