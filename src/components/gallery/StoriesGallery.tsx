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

type Tile = { src: string; alt: string };

function StripSet({
  images,
  duplicate,
}: {
  images: readonly Tile[];
  duplicate?: boolean;
}) {
  return (
    <div
      className="gallery-strip-set"
      aria-hidden={duplicate ? true : undefined}
    >
      {images.map((image) => (
        <img
          className="gallery-tile"
          key={`${duplicate ? "dup-" : ""}${image.src}`}
          src={image.src}
          alt={duplicate ? "" : image.alt}
          width={320}
          height={256}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      ))}
    </div>
  );
}

/**
 * Seamless infinite strip. direction -1 = left, +1 = right.
 */
function setupInfiniteStrip(
  track: HTMLElement,
  options: { direction: 1 | -1; duration: number },
) {
  const firstSet = track.querySelector<HTMLElement>(".gallery-strip-set");
  if (!firstSet) {
    return { tween: gsap.to({}, {}), refresh: () => undefined };
  }

  const measure = () => {
    const gap =
      parseFloat(
        getComputedStyle(track).columnGap || getComputedStyle(track).gap,
      ) || 0;
    return firstSet.offsetWidth + gap;
  };

  let distance = Math.max(1, measure());
  const fromX = options.direction < 0 ? 0 : -distance;
  const toX = options.direction < 0 ? -distance : 0;

  gsap.set(track, { x: fromX, force3D: true });

  const tween = gsap.fromTo(
    track,
    { x: fromX },
    {
      x: toX,
      duration: options.duration,
      ease: "none",
      repeat: -1,
      force3D: true,
    },
  );

  const refresh = () => {
    const progress = tween.progress();
    distance = Math.max(1, measure());
    const nextFrom = options.direction < 0 ? 0 : -distance;
    const nextTo = options.direction < 0 ? -distance : 0;
    tween.vars.x = nextTo;
    gsap.set(track, {
      x: nextFrom + (nextTo - nextFrom) * progress,
    });
    tween.invalidate();
    tween.progress(progress);
  };

  return { tween, refresh };
}

/**
 * Stories Beyond The Frame — natural page-flow gallery.
 */
export function StoriesGallery() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    const topTrack = section.querySelector<HTMLElement>(
      ".gallery-strip--top .gallery-strip-track",
    );
    const bottomTrack = section.querySelector<HTMLElement>(
      ".gallery-strip--bottom .gallery-strip-track",
    );
    if (!topTrack || !bottomTrack) return;

    const ctx = gsap.context(() => {
      const top = setupInfiniteStrip(topTrack, {
        direction: -1,
        duration: 18,
      });
      const bottom = setupInfiniteStrip(bottomTrack, {
        direction: 1,
        duration: 20,
      });

      const velProxy = { v: 0 };
      const syncSpeed = () => {
        const boost = gsap.utils.clamp(-5, 5, velProxy.v / 420);
        const speed = gsap.utils.clamp(0.7, 5.5, 1 + Math.abs(boost));
        top.tween.timeScale(speed);
        bottom.tween.timeScale(speed);
      };

      top.tween.timeScale(1);
      bottom.tween.timeScale(1);

      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          velProxy.v = self.getVelocity();
          syncSpeed();
        },
      });

      const tick = () => {
        velProxy.v += (0 - velProxy.v) * 0.08;
        if (Math.abs(velProxy.v) < 8) velProxy.v = 0;
        syncSpeed();
      };
      gsap.ticker.add(tick);

      /* No copy slide-in — HomeSeam mist reveals the whole section as one unit */

      const onResize = () => {
        top.refresh();
        bottom.refresh();
      };
      window.addEventListener("resize", onResize);
      const ro = new ResizeObserver(onResize);
      ro.observe(topTrack);
      ro.observe(bottomTrack);

      const imgs = section.querySelectorAll<HTMLImageElement>(".gallery-tile");
      const onImg = () => {
        top.refresh();
        bottom.refresh();
      };
      imgs.forEach((img) => {
        if (!img.complete) img.addEventListener("load", onImg, { once: true });
      });

      return () => {
        gsap.ticker.remove(tick);
        window.removeEventListener("resize", onResize);
        ro.disconnect();
        imgs.forEach((img) => img.removeEventListener("load", onImg));
      };
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
      <div className="gallery-strip gallery-strip--top">
        <div className="gallery-strip-track">
          <StripSet images={TOP_IMAGES} />
          <StripSet images={TOP_IMAGES} duplicate />
        </div>
      </div>

      <div className="gallery-copy">
        <h2 className="gallery-heading">Stories Beyond The Frame</h2>
        <p className="gallery-lead">
          From quiet encounters to extraordinary moments, explore the wild
          through Hymakar&rsquo;s lens.
        </p>
        <a className="cta" href="/gallery">
          <span className="cta-pill" aria-hidden="true" />
          <span className="cta-label">Explore Gallery</span>
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

      <div className="gallery-strip gallery-strip--bottom">
        <div className="gallery-strip-track">
          <StripSet images={BOTTOM_IMAGES} />
          <StripSet images={BOTTOM_IMAGES} duplicate />
        </div>
      </div>
    </section>
  );
}
