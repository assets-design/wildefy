"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Our Story", href: "/about" },
  { label: "Experiences", href: "/#experiences" },
  { label: "Destination", href: "/destination" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact us", href: "/#contact" },
];

const EXPERIENCE_LINKS = [
  { label: "Guided Wildlife Tours", href: "/world" },
  { label: "Offsites in the Wilderness", href: "#offsites" },
  { label: "Wildlife Stories That Teach", href: "#stories" },
  { label: "Corporate Learning", href: "#learning" },
];

function SocialIcon({
  label,
  href,
  children,
}: {
  label: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      className="footer-social"
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

/**
 * Figma 548:507 (video CTA) + 548:501 (glass footer).
 * Scrubbed pin: reveal CTA → hold video → rise sharp-cornered glass (~70vh).
 */
export function FooterReveal() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    const cta = ctaRef.current;
    const glass = glassRef.current;
    const media = mediaRef.current;
    const video = videoRef.current;
    if (!section || !pin || !cta || !glass || !media) return;

    const markVideoReady = () => {
      video?.classList.add("is-ready");
    };
    if (video) {
      if (video.readyState >= 2) markVideoReady();
      video.addEventListener("loadeddata", markVideoReady);
      video.addEventListener("playing", markVideoReady);
      video.play().catch(() => {});
    }

    const clearVideoListeners = () => {
      if (!video) return;
      video.removeEventListener("loadeddata", markVideoReady);
      video.removeEventListener("playing", markVideoReady);
    };

    if (prefersReducedMotion()) {
      gsap.set(cta, { clearProps: "all", opacity: 1, y: 0 });
      gsap.set(glass, { clearProps: "all", yPercent: 0 });
      return clearVideoListeners;
    }

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      const buildTimeline = (opts: {
        endVh: number;
        scrub: number;
        titleY: number;
      }) => {
        const title = cta.querySelector(".footer-reveal-title");
        const button = cta.querySelector(".footer-cta");

        gsap.set(cta, { opacity: 1 });
        gsap.set(title, { y: opts.titleY, opacity: 0 });
        gsap.set(button, { y: 20, opacity: 0 });
        gsap.set(glass, { yPercent: 105 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * opts.endVh)}`,
            pin: pin,
            pinSpacing: true,
            scrub: opts.scrub,
            anticipatePin: 0.5,
            invalidateOnRefresh: true,
            // Below map pin so destination map refresh wins layout order
            refreshPriority: -1,
            // Scrub already reverses; snap edge states when leaving upward
            // so CTA/glass are not stuck mid-pose above the footer.
            onLeaveBack: () => {
              gsap.set(title, { y: opts.titleY, opacity: 0 });
              gsap.set(button, { y: 20, opacity: 0 });
              gsap.set(glass, { yPercent: 105 });
              gsap.set(media, { scale: 1.03 });
            },
          },
        });

        // Stage 1 — heading, then CTA button.
        tl.to(title, { y: 0, opacity: 1, duration: 0.22 }, 0);
        tl.to(button, { y: 0, opacity: 1, duration: 0.18 }, 0.12);

        // Soft media settle while CTA holds.
        tl.fromTo(
          media,
          { scale: 1.03 },
          { scale: 1, duration: 0.3 },
          0,
        );

        // Hold CTA composition briefly before footer begins.
        tl.to({}, { duration: 0.12 }, 0.28);

        // Stage 3 — glass rises from bottom to final ~70vh coverage.
        tl.to(glass, { yPercent: 0, duration: 0.5 }, 0.4);

        // Settle hold so reverse scroll can park near the 70% checkpoint.
        tl.to({}, { duration: 0.14 });

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      };

      mm.add("(min-width: 768px)", () =>
        buildTimeline({ endVh: 1.85, scrub: 0.45, titleY: 40 }),
      );

      mm.add("(max-width: 767px)", () =>
        buildTimeline({ endVh: 1.45, scrub: 0.4, titleY: 28 }),
      );
    }, section);

    return () => {
      clearVideoListeners();
      ctx.revert();
    };
  }, []);

  return (
    <section
      className="footer-reveal"
      id="contact"
      aria-label="Contact and footer"
      ref={sectionRef}
    >
      <div className="footer-reveal-pin" ref={pinRef}>
        <div className="footer-reveal-media" ref={mediaRef} aria-hidden="true">
          <video
            className="footer-reveal-video"
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/images/footer/landscape-poster.png"
          >
            <source src="/videos/footer-cinematic.mov" type="video/mp4" />
            <source src="/videos/footer-cinematic.mov" type="video/quicktime" />
          </video>
          <img
            className="footer-reveal-poster"
            src="/images/footer/landscape-poster.png"
            alt=""
            width={4096}
            height={1364}
            draggable={false}
          />
          <div className="footer-reveal-veil" />
        </div>

        <div className="footer-reveal-cta" ref={ctaRef}>
          <h2 className="footer-reveal-title">
            The Wild Is Calling.
            <br />
            Where Will It Take You?
          </h2>

          <a className="footer-cta" href="#contact-panel">
            <span className="footer-cta-pill" aria-hidden="true" />
            <span className="footer-cta-mark" aria-hidden="true" />
            <img
              className="footer-cta-bird"
              src="/images/hero/hummingbird.png"
              alt=""
              width={36}
              height={36}
            />
            <span className="footer-cta-label">Let&rsquo;s Talk</span>
          </a>
        </div>

        <div
          className="footer-reveal-glass"
          id="contact-panel"
          ref={glassRef}
        >
          <div className="footer-glass-inner">
            <div className="footer-grid">
              <div className="footer-col footer-col--brand">
                <a className="footer-logo" href="/" aria-label="Wildefy">
                  <img
                    className="footer-logo-word"
                    src="/images/hero/logo-word.svg"
                    alt=""
                    width={192}
                    height={54}
                  />
                  <img
                    className="footer-logo-claw"
                    src="/images/hero/logo-claw.svg"
                    alt=""
                    width={98}
                    height={73}
                  />
                </a>
                <p className="footer-tagline">From The Wild, For The World.</p>
                <p className="footer-tagline footer-tagline--secondary">
                  Learn From The Wild. Lead In The World.
                </p>

                <div className="footer-socials" aria-label="Social links">
                  <SocialIcon label="Facebook" href="https://www.facebook.com/">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.5l.5-3H14V9z"
                      />
                    </svg>
                  </SocialIcon>
                  <SocialIcon label="Instagram" href="https://www.instagram.com/">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 4.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5zm0 7.2A2.7 2.7 0 1 1 14.7 12 2.7 2.7 0 0 1 12 14.7zm5.2-8.4a1.05 1.05 0 1 0 1.05 1.05A1.05 1.05 0 0 0 17.2 6.3z"
                      />
                    </svg>
                  </SocialIcon>
                  <SocialIcon label="YouTube" href="https://www.youtube.com/">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M23 12.2s0-3.1-.4-4.5a2.9 2.9 0 0 0-2-2C18.8 5.2 12 5.2 12 5.2s-6.8 0-8.6.5a2.9 2.9 0 0 0 2 2c1.8.5 8.6.5 8.6.5s6.8 0 8.6-.5a2.9 2.9 0 0 0 2-2c.4-1.4.4-4.5.4-4.5zM9.8 15.5v-6.6l5.8 3.3-5.8 3.3z"
                      />
                    </svg>
                  </SocialIcon>
                  <SocialIcon label="LinkedIn" href="https://www.linkedin.com/">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M6.4 9.3H3.6V20h2.8V9.3zM5 4.2a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zM20.4 20h-2.8v-5.6c0-1.5-.5-2.5-1.8-2.5-1 0-1.5.7-1.8 1.3-.1.2-.1.5-.1.8V20H11v-7.5c0-1.4-.1-2.5-.1-3.2h2.4l.1 1.4h.1c.4-.7 1.4-1.7 3.1-1.7 2.1 0 3.8 1.4 3.8 4.4V20z"
                      />
                    </svg>
                  </SocialIcon>
                </div>
              </div>

              <nav className="footer-col" aria-label="Navigations">
                <h3 className="footer-col-title">Navigations</h3>
                <ul className="footer-list">
                  {NAV_LINKS.map((link) => (
                    <li key={link.label}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </nav>

              <nav className="footer-col" aria-label="Experiences">
                <h3 className="footer-col-title">Experiences</h3>
                <ul className="footer-list">
                  {EXPERIENCE_LINKS.map((link) => (
                    <li key={link.label}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="footer-col footer-col--contact">
                <h3 className="footer-col-title">Contact Info</h3>
                <ul className="footer-list footer-list--contact">
                  <li>
                    <a href="mailto:info@wildefy.in">Info@wildefy.in</a>
                  </li>
                  <li>
                    <a
                      href="tel:+91"
                      aria-label="Phone number partially hidden for privacy"
                    >
                      +91 ************
                    </a>
                  </li>
                  <li>
                    <address>
                      Plot No, 73P, Beverly Hills, Guttala_Begumpet, Kavuri
                      Hills, Jubilee Hills, Hyderabad, Telangana 500081
                    </address>
                  </li>
                </ul>
              </div>
            </div>

            <div className="footer-divider" aria-hidden="true" />

            <div className="footer-bottom">
              <p>© 2026 All Rights Reserved By Wildefy Safaris</p>
              <p>Designed And Developed By Theories Consulting</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
