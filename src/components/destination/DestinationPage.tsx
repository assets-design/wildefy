"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FooterReveal } from "@/components/footer/FooterReveal";
import { StageFrame } from "@/components/layout/StageFrame";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MapRouteArrow, progressForDay } from "./MapRouteArrow";
import styles from "./destination.module.css";

gsap.registerPlugin(ScrollTrigger);

const DAYS = [1, 2, 3, 4, 5, 6] as const;

const DAY_CONTENT = [
  {
    id: 1,
    pill: "Day 1 · Tue, Dec 1",
    image: "/images/destination/day1-sunset.png",
    imageAlt: "Sunset over a lakeside landscape in Kanha",
    headline: "Arrive in Raipur; private road transfer to Kanha.",
    beats: [
      {
        icon: "/images/destination/icon-clock.png",
        text: "12:23 PM, Arrival in Kanha National Park from Raipur",
      },
      {
        icon: "/images/destination/icon-walk.png",
        text: "Nature walk, A gentle guided walk to experience the forest surroundings and begin the Kanha stay at an easy pace.",
      },
      {
        icon: "/images/destination/icon-sunset.png",
        text: "Sunset lakeside picnic, Relax by the lake at sunset with a scenic picnic in the reserve setting.",
      },
    ],
  },
  {
    id: 2,
    pill: "Day 2 · Wed, Dec 2",
    image: "/images/destination/day2-jeep.png",
    imageAlt: "Open jeep safari entering a Kanha forest trail",
    headline: "Morning and evening private jeep safaris, picnic breakfasts and lodge dining.",
    beats: [
      {
        icon: "/images/destination/icon-clock.png",
        title: "Private core-zone jeep safari",
        text: "Included safari with permits, guide, and modified vehicle.",
      },
      {
        icon: "/images/destination/icon-walk.png",
        title: "Picnic breakfast",
        text: "Breakfast enjoyed picnic-style as part of the safari day.",
      },
      {
        icon: "/images/destination/icon-sunset.png",
        title: "Private core-zone jeep safari",
        text: "The second included safari of the day in the core zone.",
      },
    ],
  },
  {
    id: 3,
    pill: "Day 3 · Thu, Dec 3",
    image: "/images/destination/day2-jeep.png",
    imageAlt: "Safari jeep on a Kanha forest track at dawn",
    headline: "Full day of core-zone drives with a bush lunch between safaris.",
    beats: [
      {
        icon: "/images/destination/icon-clock.png",
        title: "Dawn jeep safari",
        text: "Early start into the core zone while mist still hangs over the meadows.",
      },
      {
        icon: "/images/destination/icon-walk.png",
        title: "Bush lunch",
        text: "Hot meal served in a shaded clearing between the morning and evening drives.",
      },
      {
        icon: "/images/destination/icon-sunset.png",
        title: "Evening jeep safari",
        text: "Return drive focused on predator movement as the light softens.",
      },
    ],
  },
  {
    id: 4,
    pill: "Day 4 · Fri, Dec 4",
    image: "/images/destination/day1-sunset.png",
    imageAlt: "Golden-hour light over Kanha grasslands",
    headline: "Buffer-zone exploration, village visit, and an outdoor bush dinner.",
    beats: [
      {
        icon: "/images/destination/icon-clock.png",
        title: "Buffer-zone morning drive",
        text: "Slower pace through buffer forests with time for birding and photography.",
      },
      {
        icon: "/images/destination/icon-walk.png",
        title: "Village walk",
        text: "Guided visit to a nearby Baiga village with local hosts and tea.",
      },
      {
        icon: "/images/destination/icon-sunset.png",
        title: "Bush dinner",
        text: "Outdoor dinner under the trees after your final evening at the lodge.",
      },
    ],
  },
  {
    id: 5,
    pill: "Day 5 · Sat, Dec 5",
    image: "/images/destination/day2-jeep.png",
    imageAlt: "Open jeep paused on a Kanha meadow track",
    headline: "Last full safari day with a photography focus and lodge leisure.",
    beats: [
      {
        icon: "/images/destination/icon-clock.png",
        title: "Photography safari",
        text: "Extended morning drive timed for soft light and longer stops at sightings.",
      },
      {
        icon: "/images/destination/icon-walk.png",
        title: "Lodge leisure",
        text: "Afternoon at the Grand Chalet — spa time, pool, or quiet reading on the deck.",
      },
      {
        icon: "/images/destination/icon-sunset.png",
        title: "Sunset viewpoint",
        text: "Short transfer to a hillside lookout for the last Kanha sunset of the trip.",
      },
    ],
  },
  {
    id: 6,
    pill: "Day 6 · Sun, Dec 6",
    image: "/images/destination/day1-sunset.png",
    imageAlt: "Morning light on the road leaving Kanha",
    headline: "Breakfast at the lodge, then private transfer back to Raipur.",
    beats: [
      {
        icon: "/images/destination/icon-clock.png",
        title: "Leisurely breakfast",
        text: "Final lodge breakfast with time to pack and settle departure details.",
      },
      {
        icon: "/images/destination/icon-walk.png",
        title: "Checkout & farewell",
        text: "Brief walk around the property before boarding the private transfer.",
      },
      {
        icon: "/images/destination/icon-sunset.png",
        title: "Transfer to Raipur",
        text: "9:30 AM departure for Raipur, arriving around 1:47 PM for onward travel.",
      },
    ],
  },
] as const;

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
  const clickingRef = useRef(false);
  const dayColRef = useRef<HTMLDivElement>(null);
  const mapViewportRef = useRef<HTMLDivElement>(null);
  const mapStageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    const root = dayColRef.current;
    if (!root) return;

    const cards = [...root.querySelectorAll<HTMLElement>("[data-day-card]")];
    if (!cards.length) return;

    /**
     * Progress is driven by a single scroll sample: the 45% viewport line
     * walks from each day card's top to the next card's top. That way when
     * Day 5's header reaches the line, the arrow is on the Day 5 pin — not
     * still scrubbing through a tall Day 4 card (old end: "bottom 45%").
     */
    const sampleProgress = () => {
      if (clickingRef.current) return;

      const line = window.innerHeight * 0.45;
      let progress = progressForDay(1);
      let active = 1;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const dayNum = Number(card.dataset.dayCard) || i + 1;
        const from = progressForDay(dayNum);
        const to = progressForDay(Math.min(dayNum + 1, 6));
        const top = card.getBoundingClientRect().top;
        const next = cards[i + 1];
        const segmentEnd = next
          ? next.getBoundingClientRect().top
          : card.getBoundingClientRect().bottom;

        if (line < top) {
          if (i === 0) {
            progress = from;
            active = dayNum;
          }
          break;
        }

        if (line <= segmentEnd) {
          const t = (line - top) / Math.max(segmentEnd - top, 1);
          const clamped = Math.min(1, Math.max(0, t));
          progress = dayNum >= 6 ? from : from + (to - from) * clamped;
          active = clamped >= 0.85 && dayNum < 6 ? dayNum + 1 : dayNum;
          break;
        }

        progress = dayNum >= 6 ? from : to;
        active = Math.min(dayNum + (dayNum < 6 ? 1 : 0), 6);
      }

      setRouteProgress(progress);
      setActiveDay(active);
    };

    const trigger = ScrollTrigger.create({
      trigger: root,
      start: "top bottom",
      end: "bottom top",
      onUpdate: sampleProgress,
      onRefresh: sampleProgress,
    });

    sampleProgress();
    ScrollTrigger.refresh();

    return () => {
      trigger.kill();
    };
  }, [reduceMotion]);

  const selectDay = (day: number) => {
    setActiveDay(day);
    setRouteProgress(progressForDay(day));
    clickingRef.current = true;
    const target = document.getElementById(`day-${day}`);
    target?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    window.setTimeout(() => {
      clickingRef.current = false;
    }, reduceMotion ? 50 : 900);
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

          <div className={styles.dayTabs} role="tablist" aria-label="Itinerary days">
            {DAYS.map((day) => (
              <button
                key={day}
                type="button"
                role="tab"
                id={`day-tab-${day}`}
                aria-controls={`day-panel-${day}`}
                aria-selected={activeDay === day}
                tabIndex={activeDay === day ? 0 : -1}
                className={
                  activeDay === day
                    ? `${styles.dayTab} ${styles.dayTabActive}`
                    : styles.dayTab
                }
                onClick={() => selectDay(day)}
              >
                Day - {day}
              </button>
            ))}
          </div>

          <div className={styles.itineraryGrid}>
            <div className={styles.dayCol} ref={dayColRef}>
              <h3 className={styles.stayTitle}>
                Stay: The Safari Lodge Kanha · Grand Chalet · double sharing · all major meals
              </h3>
              <p className={styles.overview}>
                Five nights at The Safari Lodge Kanha. Start with a nature walk and sunset
                lakeside picnic, then enjoy private core-zone jeep safaris with picnic
                breakfasts. Finish with an outdoor bush dinner before your transfer back to Raipur.
              </p>

              {DAY_CONTENT.map((day) => (
                <article
                  key={day.id}
                  id={`day-${day.id}`}
                  data-day-card={day.id}
                  role="tabpanel"
                  aria-labelledby={`day-tab-${day.id}`}
                  className={
                    activeDay === day.id
                      ? `${styles.dayCard} ${styles.dayCardActive}`
                      : styles.dayCard
                  }
                >
                  <div className={styles.dayImageWrap}>
                    <Image
                      className={styles.dayImage}
                      src={day.image}
                      alt={day.imageAlt}
                      fill
                      sizes="(max-width: 1100px) 100vw, 605px"
                    />
                  </div>
                  <div className={styles.dayPill}>{day.pill}</div>
                  <h4 className={styles.dayHeadline}>{day.headline}</h4>
                  <ul className={styles.beatList}>
                    {day.beats.map((beat, beatIndex) => (
                      <li key={`${day.id}-${beatIndex}`} className={styles.beat}>
                        <img
                          className={styles.beatIcon}
                          src={beat.icon}
                          alt=""
                          width={35}
                          height={35}
                        />
                        <p className={styles.beatText}>
                          {"title" in beat && beat.title ? <strong>{beat.title}</strong> : null}
                          {beat.text}
                        </p>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <aside className={styles.mapCol} aria-label="Kanha route map">
              <div className={styles.mapFrame} ref={mapViewportRef}>
                <div className={styles.mapStage} ref={mapStageRef}>
                  <Image
                    className={styles.mapImage}
                    src="/images/destination/map-kanha.png"
                    alt="Illustrated map of Kanha National Park with the six-day route"
                    fill
                    sizes="(max-width: 1100px) 100vw, 1045px"
                    priority
                  />
                  <MapRouteArrow
                    progress={routeProgress}
                    stageRef={mapStageRef}
                    viewportRef={mapViewportRef}
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className={styles.experiences} aria-labelledby="inclusions-title">
        <div className={styles.section}>
          <div className={styles.experiencesHead}>
            <h2 id="inclusions-title" className={styles.display}>
              Experiences & Inclusions
            </h2>
            <p className={styles.lede}>From INR 157,500 per adult · 2 adults · 5 nights</p>
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
                    <img src="/images/destination/icon-timer.png" alt="" width={32} height={32} />
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
