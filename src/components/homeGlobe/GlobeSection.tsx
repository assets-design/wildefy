"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { globeDestinations } from "./content";
import { getGlobeJourney, JOURNEY_WEIGHTS } from "./globeJourney";
import styles from "./homeGlobe.module.css";

gsap.registerPlugin(ScrollTrigger);

const Globe3D = dynamic(() => import("./Globe3D"), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

const N = globeDestinations.length;

export function HomeGlobeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const hazeRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [state, setState] = useState({ idx: -1, landscape: false });

  useEffect(() => {
    setMounted(true);
    setWebgl(hasWebGL());
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.2,
      onUpdate: (self) => {
        const p = self.progress;
        progress.current = p;
        const j = getGlobeJourney(p, N, JOURNEY_WEIGHTS);
        const idx = j.active ? j.index : -1;
        setState((s) =>
          s.idx === idx && s.landscape === j.inLandscape
            ? s
            : { idx, landscape: j.inLandscape },
        );
        if (hazeRef.current) hazeRef.current.style.opacity = String(j.haze);
        if (copyRef.current) {
          copyRef.current.style.opacity = String(j.titleOpacity);
          copyRef.current.style.transform = `translateY(${(1 - j.titleOpacity) * 24}px)`;
        }
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  const active = state.idx >= 0 ? globeDestinations[state.idx] : null;

  return (
    <section
      id="world"
      ref={sectionRef}
      className={styles.section}
      aria-label="The Wildefy world"
    >
      <div className={styles.sticky}>
        <div className={styles.canvas}>
          {mounted && webgl ? (
            <Suspense
              fallback={
                <p className={styles.loading}>Loading the world…</p>
              }
            >
              <Globe3D progress={progress} design="original" />
            </Suspense>
          ) : mounted ? (
            <>
              {active ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className={styles.fallbackImg}
                  src={active.image}
                  alt={`Landscape of ${active.name}`}
                />
              ) : (
                <div className={styles.fallbackGlobe}>
                  <div className={styles.fallbackOrb} />
                </div>
              )}
            </>
          ) : null}
        </div>

        <div ref={hazeRef} className={styles.haze} aria-hidden />
        {state.landscape ? (
          <div className={styles.scrim} aria-hidden />
        ) : null}

        <div
          ref={copyRef}
          className={styles.copy}
          style={{ visibility: active ? "visible" : "hidden" }}
          aria-hidden={!active}
        >
          {active ? (
            <>
              <p className={styles.eyebrow}>
                <span className={styles.dot} aria-hidden />
                {String(state.idx + 1).padStart(2, "0")} — {active.region}
              </p>
              <h3 className={styles.title}>{active.name}</h3>
              <p className={styles.body}>{active.body}</p>
              <Link href={active.href} className={styles.cta}>
                {active.cta}
                <span className={styles.ctaArrow} aria-hidden>
                  ↗
                </span>
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
