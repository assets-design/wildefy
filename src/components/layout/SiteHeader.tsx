"use client";

import type { RefObject } from "react";
import { MobileNav } from "@/components/hero/MobileNav";

const linksLeft = [
  { label: "Home", href: "/", x: 330 },
  { label: "Our Story", href: "/about", x: 430 },
  { label: "Experiences", href: "/#experiences", x: 575 },
] as const;

const linksRight = [
  { label: "Destination", href: "/destination", x: 1169.813 },
  { label: "Gallery", href: "/#gallery", x: 1343.813 },
  { label: "Contact us", href: "/#contact", x: 1474.813 },
] as const;

const allLinks = [...linksLeft, ...linksRight].map(({ label, href }) => ({ label, href }));

const PILL_PATH =
  "M0 38.7007C0 18.1394 16.6394 1.45598 37.2006 1.40159L567 0L577 76H37.2993C16.6994 76 0 59.3005 0 38.7007Z";

function NavPill({ side }: { side: "left" | "right" }) {
  return (
    <div className={`nav-pill nav-pill-${side}`} aria-hidden="true">
      <svg width="577" height="76" viewBox="0 0 577 76" fill="none">
        <path className="nav-pill-fill" d={PILL_PATH} />
        <path className="nav-pill-edge" d={PILL_PATH} />
      </svg>
    </div>
  );
}

type SiteHeaderProps = {
  /** Optional ref for scroll animations (homepage hero). */
  headerRef?: RefObject<HTMLElement | null>;
};

export function SiteHeader({ headerRef }: SiteHeaderProps) {
  return (
    <header className="site-header" ref={headerRef}>
      <NavPill side="left" />
      <NavPill side="right" />
      <nav className="nav-links" aria-label="Primary">
        {linksLeft.map((link) => (
          <a key={link.label} href={link.href} style={{ left: link.x }}>
            {link.label}
          </a>
        ))}
        {linksRight.map((link) => (
          <a key={link.label} href={link.href} style={{ left: link.x }}>
            {link.label}
          </a>
        ))}
      </nav>
      <a className="logo" href="/" aria-label="Wildefy">
        <img
          className="logo-word"
          src="/images/hero/logo-word.svg"
          alt=""
          width={191.813}
          height={53.529}
        />
        <img
          className="logo-claw"
          src="/images/hero/logo-claw.svg"
          alt=""
          width={97.826}
          height={73.248}
        />
      </a>
      <MobileNav links={allLinks} />
    </header>
  );
}
