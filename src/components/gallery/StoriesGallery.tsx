"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/*
  Tiles cropped from the supplied Figma reference — the project has no
  standalone gallery photographs yet. Replace the files in
  /images/gallery/ with the original exports when available; only the
  src paths below need to change.
*/
const TOP_IMAGES = [
  { src: "/images/gallery/top-1.jpg", alt: "A keel-billed toucan" },
  { src: "/images/gallery/top-2.jpg", alt: "A bird silhouetted against a sunset" },
  { src: "/images/gallery/top-3.jpg", alt: "A darter landing on water" },
  { src: "/images/gallery/top-4.jpg", alt: "A green snake coiled on a branch" },
  { src: "/images/gallery/top-5.jpg", alt: "A tiger walking towards the camera" },
  { src: "/images/gallery/top-6.jpg", alt: "Giraffes grazing on the savannah" },
] as const;

const BOTTOM_IMAGES = [
  { src: "/images/gallery/bottom-1.jpg", alt: "A resplendent quetzal perched on a branch" },
  { src: "/images/gallery/bottom-2.jpg", alt: "A giraffe in profile" },
  { src: "/images/gallery/bottom-3.jpg", alt: "Two cheetahs nuzzling" },
  { src: "/images/gallery/bottom-4.jpg", alt: "A bald eagle in flight over water" },
  { src: "/images/gallery/bottom-5.jpg", alt: "A green and black poison dart frog" },
  { src: "/images/gallery/bottom-6.jpg", alt: "A squirrel monkey among leaves" },
] as const;

export function StoriesGallery() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const top = section.querySelector(".gallery-strip--top");
      const bottom = section.querySelector(".gallery-strip--bottom");
      const copy = section.querySelector(".gallery-copy");

      // Vertical scroll drives both strips horizontally, in opposite
      // directions and over different distances (parallax). Scrubbing
      // makes scrolling up reverse the movement naturally.
      if (top) {
        gsap.fromTo(
          top,
          { x: () => window.innerWidth * 0.02 },
          {
            x: () => -window.innerWidth * 0.1,
            ease: "none",
            force3D: true,
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          },
        );
      }

      if (bottom) {
        gsap.fromTo(
          bottom,
          { x: () => -window.innerWidth * 0.08 },
          {
            x: () => window.innerWidth * 0.015,
            ease: "none",
            force3D: true,
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          },
        );
      }

      // Central copy drifts up only slightly, so it stays readable while
      // the strips do the travelling.
      if (copy) {
        gsap.fromTo(
          copy,
          { y: 28 },
          {
            y: -12,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          },
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      className="gallery-section"
      id="gallery"
      aria-label="Stories beyond the frame"
      ref={sectionRef}
    >
      {/* Same sky family as the horizontal storytelling panels. */}
      <img
        className="gallery-bg"
        src="/images/story/bg-3.png"
        alt=""
        width={3286}
        height={925}
        draggable={false}
      />

      <div className="gallery-strip gallery-strip--top" aria-hidden="false">
        {TOP_IMAGES.map((image) => (
          <img
            className="gallery-tile"
            key={image.src}
            src={image.src}
            alt={image.alt}
            width={320}
            height={256}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ))}
      </div>

      <div className="gallery-copy">
        <h2 className="gallery-heading">Stories Beyond The Frame</h2>
        <p className="gallery-lead">
          From quiet encounters to extraordinary moments, explore the wild
          through Hymakar&rsquo;s lens.
        </p>
        {/*
          The primary nav's Gallery link already targets #gallery, which
          is this section — so the CTA uses the same existing anchor
          rather than inventing a new route.
        */}
        <a className="gallery-cta" href="#gallery">
          <span className="gallery-cta-body">Explore Gallery</span>
          <span className="gallery-cta-mark" aria-hidden="true">
            <img
              className="gallery-cta-bird"
              src="/images/hero/hummingbird.png"
              alt=""
              width={42}
              height={42}
            />
          </span>
        </a>
      </div>

      <div className="gallery-strip gallery-strip--bottom">
        {BOTTOM_IMAGES.map((image) => (
          <img
            className="gallery-tile"
            key={image.src}
            src={image.src}
            alt={image.alt}
            width={320}
            height={256}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ))}
      </div>
    </section>
  );
}
