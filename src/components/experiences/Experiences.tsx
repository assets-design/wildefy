"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Experience = {
  id: string;
  title: string;
  tags: string[];
  description: string;
  cta: string;
  href: string;
  image: string;
  imageAlt: string;
};

const EXPERIENCES: Experience[] = [
  {
    id: "tours",
    title: "Guided Wildlife Tours",
    tags: [
      "Wildlife Safaris Across India",
      "Five International Countries",
      "Bespoke Wildlife Journeys",
      "Photography-Focused Experiences",
    ],
    description:
      "Explore extraordinary wildlife habitats through guided safaris and personalised journeys across India and international destinations.",
    cta: "Explore Tours",
    href: "#tours",
    image: "/images/experiences/tours.png",
    imageAlt: "Elephants on a guided safari viewed from a vehicle",
  },
  {
    id: "offsites",
    title: "Offsites in the Wilderness",
    tags: [
      "Corporate Team Experiences",
      "Wildlife Safaris",
      "Founder-Led Workshops",
      "Campfire Conversations",
    ],
    description:
      "Bring your team beyond the boardroom through wildlife encounters, leadership workshops, and meaningful shared experiences in nature.",
    cta: "Explore Offsites",
    href: "#offsites",
    image: "/images/experiences/offsites.png",
    imageAlt: "A small group gathered around a wilderness campfire",
  },
  {
    id: "stories",
    title: "Wildlife Stories That Teach",
    tags: [
      "Keynotes and Town Halls",
      "Photography Workshops",
      "Photoshop and Photo-Editing Workshops",
      "Campus Sessions",
      "International Photography Professionals",
    ],
    description:
      "Real encounters from the wild become stories, conversations, and learning experiences revealing lessons in patience, resilience, observation, decision-making, and leadership.",
    cta: "Explore Wildlife Stories",
    href: "#stories",
    image: "/images/experiences/stories.png",
    imageAlt: "A wildlife photographer with a telephoto lens in the field",
  },
  {
    id: "learning",
    title: "Corporate Learning",
    tags: [
      "Financial Awareness",
      "Profit and Loss",
      "Business Performance",
      "Financial Decision-Making",
      "Leadership and Business Fundamentals",
    ],
    description:
      "Build financial awareness and business understanding through practical learning focused on financial performance, decision-making, and leadership.",
    cta: "Explore Corporate Learning",
    href: "#learning",
    image: "/images/experiences/learning.png",
    imageAlt: "A corporate learning session in a warm nature-inspired venue",
  },
];

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function ExperienceCta({ label, href }: { label: string; href: string }) {
  return (
    <a className="experience-cta" href={href}>
      <span className="experience-cta-body">
        <span className="experience-cta-label">{label}</span>
      </span>
      <span className="experience-cta-mark" aria-hidden="true">
        <img
          className="experience-cta-bird"
          src="/images/hero/hummingbird.png"
          alt=""
          width={42}
          height={42}
        />
      </span>
    </a>
  );
}

export function Experiences() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const intro = section.querySelector(".experiences-intro");
        if (intro) {
          gsap.fromTo(
            intro.children,
            { y: 28, opacity: 0.4 },
            {
              y: 0,
              opacity: 1,
              ease: "none",
              stagger: 0.06,
              scrollTrigger: {
                trigger: intro,
                start: "top 85%",
                end: "top 55%",
                scrub: 0.4,
              },
            },
          );
        }

        section.querySelectorAll<HTMLElement>(".experience-row").forEach((row) => {
          const left = row.querySelector(".experience-left");
          const mid = row.querySelector(".experience-mid");
          const media = row.querySelector(".experience-media");
          if (!left || !mid || !media) return;

          // Modest travel — editorial opposing motion without clipping the grid.
          gsap.fromTo(
            [left, mid],
            { x: -40 },
            {
              x: 0,
              ease: "none",
              scrollTrigger: {
                trigger: row,
                start: "top 92%",
                end: "top 45%",
                scrub: 0.4,
              },
            },
          );

          gsap.fromTo(
            media,
            { x: 48 },
            {
              x: 0,
              ease: "none",
              scrollTrigger: {
                trigger: row,
                start: "top 92%",
                end: "top 45%",
                scrub: 0.4,
              },
            },
          );
        });
      });

      mm.add("(max-width: 1023px)", () => {
        section.querySelectorAll<HTMLElement>(".experience-row").forEach((row) => {
          gsap.fromTo(
            row,
            { y: 28, opacity: 0.55 },
            {
              y: 0,
              opacity: 1,
              ease: "none",
              scrollTrigger: {
                trigger: row,
                start: "top 92%",
                end: "top 60%",
                scrub: 0.35,
              },
            },
          );
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      className="experiences"
      id="experiences"
      aria-label="Four ways to experience the wild"
      ref={sectionRef}
    >
      <div className="experiences-inner">
        <header className="experiences-intro">
          <h2 className="experiences-title">Four Ways to Experience the Wild</h2>
          <p className="experiences-lead">
            From unforgettable wildlife journeys to transformative learning
            experiences, discover how Wildefy brings the wisdom of the wild into
            the way we travel, work, learn, and lead.
          </p>
        </header>

        <div className="experiences-list">
          {EXPERIENCES.map((item) => (
            <article className="experience-row" key={item.id} id={item.id}>
              <div className="experience-left">
                <h3 className="experience-heading">{item.title}</h3>
                <ul className="experience-tags">
                  {item.tags.map((tag) => (
                    <li key={tag}>
                      <span className="experience-tag">{tag}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="experience-mid">
                <p className="experience-description">{item.description}</p>
                <ExperienceCta label={item.cta} href={item.href} />
              </div>

              <div className="experience-media">
                <div className="experience-media-frame">
                  <img
                    src={item.image}
                    alt={item.imageAlt}
                    width={800}
                    height={600}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
