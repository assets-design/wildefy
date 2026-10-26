"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/*
  Horizontal sequence:
    1. Recognising The Eye Behind The Lens (awards + certificates)
    2. Giraffe portrait
    3. Sustainability — Protecting What Matters
  Awards zones use Figma 506:347 coords at 1920px = 100vw.
  Responsibility lives in its own vertical Conservation section.
*/
export function AwardsScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const viewport = section.querySelector<HTMLElement>(
          ".awards-viewport",
        );
        const panels = Array.from(
          track.querySelectorAll<HTMLElement>(".awards-panel"),
        );
        if (!viewport || panels.length === 0) return;

        const getViewW = () => viewport.clientWidth || window.innerWidth;
        const getTotal = () => {
          const last = panels[panels.length - 1];
          return last.offsetLeft + last.offsetWidth;
        };
        const getTravel = () => Math.max(0, getTotal() - getViewW());

        gsap.set(track, { x: 0, force3D: true });

        // Straight horizontal pan — no cloud mash / reveal runway.
        const applyProgress = (progress: number) => {
          const travelPx = getTravel();
          const p = Math.min(1, Math.max(0, progress));
          gsap.set(track, { x: -travelPx * p, force3D: true });
        };

        const awardsTrigger = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () => `+=${Math.max(1, Math.round(getTravel()))}`,
          pin: true,
          pinSpacing: true,
          scrub: 1.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => applyProgress(self.progress),
          onRefresh: (self) => applyProgress(self.progress),
        });

        applyProgress(awardsTrigger.progress);

        const refresh = () => ScrollTrigger.refresh();
        window.addEventListener("load", refresh, { once: true });
        const ro = new ResizeObserver(refresh);
        ro.observe(viewport);
        panels.forEach((panel) => ro.observe(panel));

        return () => {
          awardsTrigger.kill();
          ro.disconnect();
          window.removeEventListener("load", refresh);
        };
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      className="awards-scroll"
      aria-label="Recognising the eye behind the lens"
      ref={sectionRef}
    >
      <div className="awards-viewport">
        <div className="awards-track" ref={trackRef}>
          <article className="awards-panel awards-panel--journey">
            {/* ——— Panel 1 · Awards ——— */}
            <div className="awd-cheetahs">
              <img
                src="/images/awards-figma/cheetahs-photo.png"
                alt="Two cheetah cubs nuzzling affectionately"
                width={1734}
                height={1066}
                draggable={false}
              />
            </div>

            <div className="awd-laurel awd-laurel--left" aria-hidden="true">
              <img
                src="/images/awards-figma/laurel.png"
                alt=""
                width={2000}
                height={1333}
                draggable={false}
              />
            </div>
            <div className="awd-heading-group">
              <h2 className="awd-heading">
                Recognising The Eye Behind The Lens
              </h2>
              <p className="awd-subtitle">
                Every photograph begins with an encounter. Some encounters
                become stories.
              </p>
            </div>
            <div className="awd-laurel awd-laurel--right" aria-hidden="true">
              <img
                src="/images/awards-figma/laurel.png"
                alt=""
                width={2000}
                height={1333}
                draggable={false}
              />
            </div>

            <img
              className="awd-cert awd-cert--1"
              src="/images/awards-figma/cert-a.png"
              alt="35 Awards 4th International Photography Award winner diploma for Hymakar Valluri"
              width={1024}
              height={1536}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
            <img
              className="awd-cert awd-cert--2"
              src="/images/awards-figma/cert-b.png"
              alt="Travel Photographer Society Moment Photo Contest 2017 First Runner Up certificate for Hymakar Valluri"
              width={1052}
              height={1495}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
            <img
              className="awd-cert awd-cert--3"
              src="/images/awards-figma/cert-c.png"
              alt="Fine Art Photography Awards third prize certificate for Hymakar Valluri"
              width={1090}
              height={1443}
              loading="lazy"
              decoding="async"
              draggable={false}
            />

            {/* ——— Panel 2 · Giraffe portrait ——— */}
            <div className="awd-giraffe">
              <img
                src="/images/awards-figma/panel-photo.png"
                alt="Two giraffes looking towards the camera"
                width={1275}
                height={1275}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </div>

            {/* ——— Panel 3 · Sustainability ——— */}
            <img
              className="awd-arc"
              src="/images/awards-figma/ellipse-arc.svg"
              alt=""
              width={1000}
              height={540}
              aria-hidden="true"
              draggable={false}
            />
            <div className="awd-sus-heading-group">
              <h3 className="awd-sus-heading">
                Sustainability
                <br />
                Protecting What Matters
              </h3>
              <p className="awd-sus-copy">
                At Wildefy, sustainability is at the heart of every journey
                we create. We believe in exploring the wild with respect,
                protecting natural habitats, and inspiring people to make
                conscious choices that preserve the beauty of our planet
                for generations to come.
              </p>
            </div>

            <img
              className="awd-circle awd-circle--lion"
              src="/images/awards-figma/circle-3.png"
              alt="A lion walking down a rock towards the camera"
              width={382}
              height={382}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
            <img
              className="awd-circle awd-circle--toucan"
              src="/images/awards-figma/circle-1.png"
              alt="A keel-billed toucan perched on a mossy branch"
              width={580}
              height={580}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
            <img
              className="awd-circle awd-circle--buffalo"
              src="/images/awards-figma/circle-2.png"
              alt="An egret standing on a buffalo in golden water"
              width={382}
              height={382}
              loading="lazy"
              decoding="async"
              draggable={false}
            />

            <span className="awd-number" aria-hidden="true">
              01.
            </span>
            <span className="awd-line" aria-hidden="true" />
            <div className="awd-item">
              <h4 className="awd-item-title">Protect What Matters</h4>
              <p className="awd-item-copy">
                Travel with awareness, respect wildlife, and leave the
                natural world as undisturbed as possible.
              </p>
            </div>

            <div className="awd-tiger">
              <img
                src="/images/awards-figma/sustainability-photo.png"
                alt="A tiger walking through tall grass"
                width={1600}
                height={1066}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
