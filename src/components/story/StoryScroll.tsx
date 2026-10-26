"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Bird settle while Experiences’ shared handoff veil dissolves. */
const CLOUD_REVEAL_VH = 0.85;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/*
  First horizontal sequence, rebuilt from the Figma frame (node
  507:354, 7890x1000) which replaces the previous story track:
    1. What Happens When We Step Outside The Ordinary?
    2. From Boardrooms To The Wild
    3. The Wild Changes The Conversation.
  Design coordinates map at 1920px = 100vw, 1000px = 100vh over one
  continuous sky panorama. Assets are the Figma originals in
  /images/story-figma/ (sky, camp scene, cockatoo, hummingbird);
  the icons, darter and CTA bird were byte-identical to the existing
  project assets, so those are reused from /images/story/ and
  /images/hero/. Same pinned-track mechanics as before: vertical
  scroll drives the track right-to-left, then vertical flow resumes.
*/

const PILLARS = [
  { title: "Learn", copy: "The classroom teaches us to think.", icon: "/images/story/icon-learn.png", left: "36.56vw" },
  { title: "Lead", copy: "The boardroom teaches us to decide.", icon: "/images/story/icon-lead.png", left: "58.07vw" },
  { title: "Explore", copy: "The wilderness teaches us to observe.", icon: "/images/story/icon-explore.png", left: "79.58vw" },
] as const;

const MILESTONES = [
  { label: "Decades", year: "2005 - 2015", title: "Corporate Leadership", copy: "Targets, teams, decisions and transformation.", left: "159.17vw", width: "22.71vw" },
  { label: "Alongside", year: "2018", title: "The Wilderness", copy: "Years of expeditions across continents.", left: "183.02vw", width: "19.38vw" },
  { label: "The Bridge", year: "2018", title: "Wildefy", copy: "Where corporate leadership meets the wild.", left: "206.98vw", width: "22.71vw" },
] as const;

const VALUES = [
  { title: "Perspective", icon: "/images/story/icon-perspective.png", left: "299.95vw" },
  { title: "Patience", icon: "/images/story/icon-patience.png", left: "318.13vw" },
  { title: "Resilience", icon: "/images/story/icon-resilience.png", left: "336.30vw" },
  { title: "Connection", icon: "/images/story/icon-connection.png", left: "354.74vw" },
] as const;

export function StoryScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const viewport = section.querySelector<HTMLElement>(".sx-viewport");
        const panel = track.querySelector<HTMLElement>(".sx-panel");
        const bird = track.querySelector<HTMLElement>(".sx-darter");
        if (!viewport || !panel) return;

        const getViewW = () => viewport.clientWidth || window.innerWidth;
        const getTravel = () =>
          Math.max(0, panel.offsetLeft + panel.offsetWidth - getViewW());
        // Matches Experiences handoff dissolve so bird settles with the veil.
        const getRevealRun = () =>
          Math.max(420, Math.round(window.innerHeight * CLOUD_REVEAL_VH));

        gsap.set(track, { x: 0, force3D: true });

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

        /*
          Cloud veil is owned by Experiences handoff (one close → one open).
          Here: bird settles during that same runway, then horizontal pan.
        */
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
            p <= revealEnd ? 0 : (p - revealEnd) / Math.max(0.0001, 1 - revealEnd);
          gsap.set(track, { x: -travelPx * panT, force3D: true });
        };

        const storyTrigger = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () =>
            `+=${Math.max(1, Math.round(getRevealRun() + getTravel()))}`,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            applyProgress(self.progress);
          },
          onRefresh: (self) => {
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
        <div className="sx-track" ref={trackRef}>
          <article className="sx-panel">
            {/* ——— Panel 1 · Outside the Ordinary ——— */}
            <div className="sx-darter-stage" aria-hidden="false">
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

            {/* ——— Panel 2 · Boardrooms to the Wild ——— */}
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
                Through experiences in business and time spent observing
                the natural world, Hymakar Valluri discovered a different
                way to think about leadership, people, performance, and
                perspective.
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
            <div className="sx-camp">
              <img
                src="/images/story-figma/camp.png"
                alt=""
                width={2172}
                height={724}
                draggable={false}
              />
            </div>

            {/* ——— Panel 3 · Wild Changes the Conversation ——— */}
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
              Put the same people in the wilderness — and something
              changes.
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
            <div className="sx-cockatoo">
              <img
                src="/images/story-figma/cockatoo.png"
                alt="A white cockatoo perched on a red No Stopping sign"
                width={1170}
                height={1463}
                draggable={false}
              />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
