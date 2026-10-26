export type Experience = {
  id: string;
  title: string;
  tags: string[];
  description: string;
  cta: string;
  href: string;
  image: string;
  imageAlt: string;
  /** Card entrance side for the scroll journey. */
  enterFrom: "left" | "right";
  /**
   * Scroll progress window for this stage within the pinned journey.
   * from → enter, hold → fully readable, to → exit.
   * Tuned to match NatGeo-style fly-through pacing across 4 video environments.
   */
  window: { from: number; hold: number; to: number };
  stage: "mountains" | "forest" | "waterfalls" | "snow";
};

/**
 * Four narrative stops synced to video_001 environments:
 * mountains → forest river → wide river/rapids → snow.
 * Windows leave gaps so only one card is “on stage” at a time (reference feel).
 */
export const EXPERIENCES: Experience[] = [
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
    enterFrom: "right",
    /* Cards after arrival cloud (short vh-based dissolve). Wider = slower. */
    window: { from: 0.08, hold: 0.22, to: 0.3 },
    stage: "mountains",
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
    enterFrom: "left",
    window: { from: 0.3, hold: 0.44, to: 0.52 },
    stage: "forest",
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
    enterFrom: "right",
    window: { from: 0.52, hold: 0.66, to: 0.74 },
    stage: "waterfalls",
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
    enterFrom: "left",
    window: { from: 0.74, hold: 0.88, to: 0.96 },
    stage: "snow",
  },
];

/** Left journey rail — one stop per video environment. */
export const STAGE_LABELS = [
  { id: "mountains", label: "Mountains", from: 0.1, to: 0.3 },
  { id: "forest", label: "Forest", from: 0.3, to: 0.52 },
  { id: "waterfalls", label: "Rivers", from: 0.52, to: 0.74 },
  { id: "snow", label: "Snow", from: 0.74, to: 1 },
] as const;
