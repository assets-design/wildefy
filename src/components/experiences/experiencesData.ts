export type Experience = {
  id: string;
  title: string;
  tags: string[];
  description: string;
  cta: string;
  href: string;
  image: string;
  imageAlt: string;
  /** Final resting side for the scroll journey. */
  enterFrom: "left" | "right";
  /**
   * Where the card starts on screen (as fractions of viewport), then
   * travels to its left/right rest pose while scaling up.
   * xVw / yVh are offsets from the final position.
   */
  projection: { xVw: number; yVh: number; fromScale: number };
  /** Map-pin coordinates shown at this card’s start point. */
  coords: { lat: number; lng: number };
  /**
   * Scroll progress window for this stage within the pinned journey.
   * from → enter begins, hold → fully readable, to → exit done.
   * Enter span (from→hold) is long so cards arrive slowly.
   */
  window: { from: number; hold: number; to: number };
  stage: "mountains" | "forest" | "waterfalls" | "snow";
};

/**
 * Four narrative stops synced to video_001 environments.
 * Each card starts from a unique screen point and settles on alternating sides.
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
    href: "/world",
    image: "/images/experiences/tours.png",
    imageAlt: "Elephants on a guided safari viewed from a vehicle",
    enterFrom: "right",
    /* Starts after intro clears — mid-right, then settles on the right */
    projection: { xVw: -0.2, yVh: 0.1, fromScale: 0.34 },
    coords: { lat: 22.3347, lng: 80.6112 },
    /* from > intro exit (~0.13) so pin/card never overlap the headline */
    window: { from: 0.15, hold: 0.36, to: 0.42 },
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
    /* Upper-right area → settle on the left */
    projection: { xVw: 0.42, yVh: -0.22, fromScale: 0.28 },
    coords: { lat: -1.2921, lng: 36.8219 },
    window: { from: 0.42, hold: 0.6, to: 0.66 },
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
    /* Lower-left / mid → settle on the right */
    projection: { xVw: -0.38, yVh: 0.26, fromScale: 0.3 },
    coords: { lat: 27.9881, lng: 86.925 },
    window: { from: 0.66, hold: 0.78, to: 0.84 },
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
    /* Lower-center → settle on the left */
    projection: { xVw: 0.3, yVh: 0.3, fromScale: 0.26 },
    coords: { lat: 64.1466, lng: -21.9426 },
    /* Long hold so the 4th card is fully readable before cloud close begins */
    window: { from: 0.84, hold: 0.92, to: 0.995 },
    stage: "snow",
  },
];

/** Left journey rail — one stop per video environment. */
export const STAGE_LABELS = [
  { id: "mountains", label: "Mountains", from: 0.15, to: 0.42 },
  { id: "forest", label: "Forest", from: 0.42, to: 0.66 },
  { id: "waterfalls", label: "Rivers", from: 0.66, to: 0.84 },
  { id: "snow", label: "Snow", from: 0.84, to: 1 },
] as const;
