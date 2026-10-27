"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FooterReveal } from "@/components/footer/FooterReveal";
import { StageFrame } from "@/components/layout/StageFrame";
import { SiteHeader } from "@/components/layout/SiteHeader";
import {
  MapRouteArrow,
  dayFromProgress,
  progressForDay,
  scrollToRouteProgress,
} from "./MapRouteArrow";
import styles from "./destination.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Figma 616:384 artboard — 1680 × 2852 */
const ART_W = 1680;
const ART_H = 2852;

type Beat = { icon: string; label: string };

type MapStop = {
  id: number;
  dayLabel: string;
  place: string;
  headline: string;
  stay: string;
  beats: Beat[];
  card: { left: number; top: number };
};

const STAY =
  "Stay: The Safari Lodge Kanha · Grand Chalet · double sharing · all major meals";

const ICON_CLOCK = "/images/destination/map-v2/icon-hourglass.png";
const ICON_WALK = "/images/destination/map-v2/icon-walk.png";
const ICON_SUNSET = "/images/destination/map-v2/icon-sunset.png";

const MAP_STOPS: MapStop[] = [
  {
    id: 1,
    dayLabel: "Day 1",
    place: "Raipur",
    headline: "Arrive in Raipur; private road transfer to Kanha.",
    stay: STAY,
    beats: [
      { icon: ICON_CLOCK, label: "12:23 PM Arrival in Kanha" },
      { icon: ICON_WALK, label: "Afternoon Nature Walk" },
      { icon: ICON_SUNSET, label: "Afternoon Sunset Lakeside Picnic" },
    ],
    card: { left: (695 / ART_W) * 100, top: (40 / ART_H) * 100 },
  },
  {
    id: 2,
    dayLabel: "Day 2",
    place: "Kanha National Park",
    headline: "Morning and evening private jeep safaris.",
    stay: STAY,
    beats: [
      { icon: ICON_CLOCK, label: "Dawn core-zone jeep safari" },
      { icon: ICON_WALK, label: "Picnic breakfast in the wild" },
      { icon: ICON_SUNSET, label: "Evening jeep safari" },
    ],
    card: { left: (166 / ART_W) * 100, top: (707 / ART_H) * 100 },
  },
  {
    id: 3,
    dayLabel: "Day 3",
    place: "Kanha Safari Zone",
    headline: "Full day of core-zone drives with a bush lunch.",
    stay: STAY,
    beats: [
      { icon: ICON_CLOCK, label: "Dawn jeep safari" },
      { icon: ICON_WALK, label: "Bush lunch between drives" },
      { icon: ICON_SUNSET, label: "Evening jeep safari" },
    ],
    card: { left: (1050 / ART_W) * 100, top: (1257 / ART_H) * 100 },
  },
  {
    id: 4,
    dayLabel: "Day 4",
    place: "Kanha Leisure & Breakfast",
    headline: "Buffer-zone exploration and outdoor bush dinner.",
    stay: STAY,
    beats: [
      { icon: ICON_CLOCK, label: "Buffer-zone morning drive" },
      { icon: ICON_WALK, label: "Village walk & local tea" },
      { icon: ICON_SUNSET, label: "Outdoor bush dinner" },
    ],
    card: { left: (142 / ART_W) * 100, top: (1568 / ART_H) * 100 },
  },
  {
    id: 5,
    dayLabel: "Day 5",
    place: "Kanha Safari Zone",
    headline: "Last full safari day with a photography focus.",
    stay: STAY,
    beats: [
      { icon: ICON_CLOCK, label: "Photography safari" },
      { icon: ICON_WALK, label: "Lodge leisure afternoon" },
      { icon: ICON_SUNSET, label: "Sunset viewpoint" },
    ],
    card: { left: (978 / ART_W) * 100, top: (1936 / ART_H) * 100 },
  },
  {
    id: 6,
    dayLabel: "Day 6",
    place: "Return to Raipur",
    headline: "Breakfast at the lodge, then transfer back to Raipur.",
    stay: STAY,
    beats: [
      { icon: ICON_CLOCK, label: "Leisurely lodge breakfast" },
      { icon: ICON_WALK, label: "Checkout & farewell" },
      { icon: ICON_SUNSET, label: "9:30 AM transfer to Raipur" },
    ],
    card: { left: (17 / ART_W) * 100, top: (2409 / ART_H) * 100 },
  },
];

const INCLUSIONS = [
  {
    icon: "/images/destination/incl-jeep.svg",
    title: "Private core-zone jeep safaris",
    copy: "Four drives across Days 2–3, with permits, a guide and a modified vehicle.",
  },
  {
    icon: "/images/destination/incl-walk.svg",
    title: "Guided nature walk",
    copy: "A gentle afternoon walk on arrival day to ease into the forest.",
  },
  {
    icon: "/images/destination/incl-picnic.svg",
    title: "Sunset lakeside picnic",
    copy: "Watch the sky glow over the water on your first evening.",
  },
  {
    icon: "/images/destination/incl-meals.svg",
    title: "Picnic breakfasts & bush dinner",
    copy: "Breakfasts in the wild between drives, and an outdoor bush dinner.",
  },
  {
    icon: "/images/destination/incl-stay.svg",
    title: "Grand Chalet stay",
    copy: "Double sharing at The Safari Lodge Kanha with all major meals.",
  },
  {
    icon: "/images/destination/incl-transfer.svg",
    title: "Private Innova Crysta transfers",
    copy: "Raipur to Kanha and back, door to door.",
  },
] as const;

const TRANSFERS = [
  {
    photo: "/images/destination/transfer-car.png",
    photoAlt: "Private Innova Crysta on the road to Kanha",
    date: "Dec 1",
    from: "Raipur",
    to: "Kanha National Park",
    time: "7:59 AM – 12:23 PM",
  },
  {
    photo: "/images/destination/transfer-jeep.png",
    photoAlt: "Safari jeep on a forest track",
    date: "Dec 6",
    from: "Kanha National Park",
    to: "Raipur",
    time: "9:30 AM – 1:47 PM",
  },
] as const;

export function DestinationPage() {
  const [activeDay, setActiveDay] = useState(1);
  const [routeProgress, setRouteProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const journeyRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const clickingRef = useRef(false);
  const clickTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    const journey = journeyRef.current;
    const viewport = viewportRef.current;
    const stage = stageRef.current;
    if (!journey || !viewport || !stage) return;

    const applyProgress = (scrollProgress: number) => {
      if (clickingRef.current) return;
      // Map scroll → route so Day 6 has a dwell after the tracker arrives
      const routeP = scrollToRouteProgress(scrollProgress);
      setRouteProgress(routeP);
      setActiveDay(dayFromProgress(routeP));
    };

    const getScrollRun = () => {
      const stageH = stage.offsetHeight;
      const viewH = viewport.clientHeight || window.innerHeight;
      // Extra runway: pan the tall map + readable time per day, including Day 6 hold
      return Math.max(
        stageH - viewH + window.innerHeight * 3.2,
        viewH * 4.2,
      );
    };

    const trigger = ScrollTrigger.create({
      trigger: journey,
      start: "top top",
      end: () => `+=${Math.round(getScrollRun())}`,
      pin: true,
      pinSpacing: true,
      scrub: reduceMotion ? false : 0.4,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => applyProgress(self.progress),
      onRefresh: (self) => applyProgress(self.progress),
    });

    applyProgress(trigger.progress);
    ScrollTrigger.refresh();

    return () => {
      if (clickTimerRef.current != null) {
        window.clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      trigger.kill();
    };
  }, [reduceMotion]);

  const selectDay = (day: number) => {
    const journey = journeyRef.current;
    if (!journey) return;
    // progressForDay returns scroll progress (with Day 6 dwell accounted for)
    const scrollTarget = progressForDay(day);
    const routeTarget = scrollToRouteProgress(scrollTarget);
    setActiveDay(day);
    setRouteProgress(routeTarget);
    clickingRef.current = true;
    if (clickTimerRef.current != null) {
      window.clearTimeout(clickTimerRef.current);
    }

    const st = ScrollTrigger.getAll().find((t) => t.trigger === journey);
    if (st) {
      const scrollTo = st.start + (st.end - st.start) * scrollTarget;
      window.scrollTo({
        top: scrollTo,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }

    clickTimerRef.current = window.setTimeout(
      () => {
        clickingRef.current = false;
        clickTimerRef.current = null;
        // Re-sync from live ScrollTrigger so scrub doesn't stay stuck
        const live = ScrollTrigger.getAll().find((t) => t.trigger === journey);
        if (live) {
          const routeP = scrollToRouteProgress(live.progress);
          setRouteProgress(routeP);
          setActiveDay(dayFromProgress(routeP));
        }
      },
      reduceMotion ? 50 : 900,
    );
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-label="Kanha Wildlife Escape">
        <Image
          className={styles.heroImage}
          src="/images/destination/hero-lions.png"
          alt="Two lions resting in tall grass"
          fill
          priority
          sizes="100vw"
        />
        <div className={styles.heroShade} aria-hidden />
        <div className={styles.heroStage}>
          <StageFrame>
            <div className={styles.heroStageInner}>
              <SiteHeader />
              <h1 className={styles.heroTitle}>Kanha Wildlife Escape</h1>
            </div>
          </StageFrame>
        </div>
      </section>

      <section className={styles.itinerary} aria-labelledby="park-title">
        <div className={styles.section}>
          <div className={styles.itineraryHead}>
            <h2 id="park-title" className={styles.display}>
              Kanha National Park
            </h2>
            <p className={styles.lede}>5 nights · Dec 1 – Dec 6 · 2 adults</p>
          </div>

          <div
            className={styles.dayTabs}
            role="tablist"
            aria-label="Itinerary days"
          >
            {MAP_STOPS.map((stop) => (
              <button
                key={stop.id}
                type="button"
                role="tab"
                id={`day-tab-${stop.id}`}
                aria-controls={`map-day-${stop.id}`}
                aria-selected={activeDay === stop.id}
                tabIndex={activeDay === stop.id ? 0 : -1}
                className={
                  activeDay === stop.id
                    ? `${styles.dayTab} ${styles.dayTabActive}`
                    : styles.dayTab
                }
                onClick={() => selectDay(stop.id)}
              >
                Day - {stop.id}
              </button>
            ))}
          </div>
        </div>

        {/* Centered map with white side margins — Figma 616:384 */}
        <div
          className={styles.mapJourney}
          ref={journeyRef}
          aria-label="Kanha six-day route map"
        >
          <div className={styles.mapFrame} ref={viewportRef}>
            <div className={styles.mapStage} ref={stageRef}>
              <Image
                className={styles.mapArtImage}
                src="/images/destination/map-v2/map-bg.png"
                alt="Illustrated map of Kanha National Park with the six-day route from Raipur"
                width={2485}
                height={4095}
                priority
                sizes="(max-width: 1680px) 100vw, 1680px"
              />

              <MapRouteArrow
                progress={routeProgress}
                stageRef={stageRef}
                viewportRef={viewportRef}
              />

              {MAP_STOPS.map((stop) => {
                const isActive = activeDay === stop.id;
                return (
                  <article
                    key={stop.id}
                    id={`map-day-${stop.id}`}
                    data-map-day={stop.id}
                    role="tabpanel"
                    aria-labelledby={`day-tab-${stop.id}`}
                    aria-hidden={!isActive}
                    className={
                      isActive
                        ? `${styles.glassCard} ${styles.glassCardActive}`
                        : styles.glassCard
                    }
                    style={{
                      left: `${stop.card.left}%`,
                      top: `${stop.card.top}%`,
                    }}
                  >
                    <div className={styles.glassCardInner}>
                      <h3 className={styles.glassHeadline}>{stop.headline}</h3>
                      <p className={styles.glassStay}>{stop.stay}</p>
                      <ul className={styles.glassBeats}>
                        {stop.beats.map((beat) => (
                          <li key={beat.label} className={styles.glassBeat}>
                            <img
                              src={beat.icon}
                              alt=""
                              width={35}
                              height={35}
                              className={styles.glassBeatIcon}
                            />
                            <span>{beat.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.experiences} aria-labelledby="inclusions-title">
        <div className={styles.section}>
          <div className={styles.experiencesHead}>
            <h2 id="inclusions-title" className={styles.display}>
              Experiences & Inclusions
            </h2>
            <p className={styles.lede}>
              From INR 157,500 per adult · 2 adults · 5 nights
            </p>
          </div>
          <div className={styles.experienceGrid}>
            {INCLUSIONS.map((item) => (
              <article key={item.title} className={styles.experienceItem}>
                <img
                  className={styles.experienceIcon}
                  src={item.icon}
                  alt=""
                  width={113}
                  height={113}
                />
                <h3 className={styles.experienceTitle}>{item.title}</h3>
                <p className={styles.experienceCopy}>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.transfers} aria-labelledby="transfers-title">
        <div className={styles.section}>
          <div className={styles.transfersHead}>
            <h2 id="transfers-title" className={styles.display}>
              Getting You There & Back
            </h2>
            <p className={styles.lede}>Every transfer on your trip.</p>
          </div>

          <div className={styles.transferGrid}>
            {TRANSFERS.map((leg) => (
              <article key={leg.date + leg.from} className={styles.transferCard}>
                <div className={styles.transferPhoto}>
                  <Image
                    className={styles.transferPhotoImg}
                    src={leg.photo}
                    alt={leg.photoAlt}
                    fill
                    sizes="251px"
                  />
                </div>
                <div>
                  <h3 className={styles.transferTitle}>Private car</h3>
                  <p className={styles.transferDate}>{leg.date}</p>
                  <div className={styles.route}>
                    <p className={styles.routePlace}>{leg.from}</p>
                    <div className={styles.routeTrack} aria-hidden>
                      <img
                        className={styles.routeCar}
                        src="/images/destination/icon-car-sprite.png"
                        alt=""
                        width={72}
                        height={27}
                      />
                    </div>
                    <p className={styles.routePlace}>{leg.to}</p>
                  </div>
                  <p className={styles.routeTime}>
                    <img
                      src="/images/destination/icon-timer.png"
                      alt=""
                      width={32}
                      height={32}
                    />
                    {leg.time}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FooterReveal />
    </div>
  );
}
