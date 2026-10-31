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
  projection: { xVw: number; yVh: number; fromScale: number };
  coords: { lat: number; lng: number };
  /**
   * Scroll progress window. Runway = EXPERIENCES_CONTENT_VH (400vh).
   * Progress ends with card 4 fully held on screen — no card-4 exit beat.
   */
  window: { from: number; hold: number; to: number };
  stage: "mountains" | "forest" | "waterfalls" | "snow";
};

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
    projection: { xVw: -0.22, yVh: 0.08, fromScale: 0.34 },
    coords: { lat: 22.3347, lng: 80.6112 },
    window: { from: 0.04, hold: 0.14, to: 0.30 },
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
    projection: { xVw: 0.38, yVh: -0.18, fromScale: 0.28 },
    coords: { lat: -1.2921, lng: 36.8219 },
    window: { from: 0.24, hold: 0.36, to: 0.52 },
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
    projection: { xVw: -0.35, yVh: 0.22, fromScale: 0.30 },
    coords: { lat: 27.9881, lng: 86.925 },
    window: { from: 0.46, hold: 0.58, to: 0.72 },
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
    projection: { xVw: 0.28, yVh: 0.26, fromScale: 0.26 },
    coords: { lat: 64.1466, lng: -21.9426 },
    /*
      Card 4 — fully held at EXPERIENCES_CARD4_HOLD_FRAC (1).
      Mist starts at that same scroll; to > 1 so it never exits under the veil.
    */
    window: { from: 0.66, hold: 1, to: 1.05 },
    stage: "snow",
  },
];

/** Stage rail labels */
export const STAGE_LABELS = [
  { id: "mountains", label: "Mountains", from: 0.04, to: 0.30 },
  { id: "forest",    label: "Forest",    from: 0.24, to: 0.52 },
  { id: "waterfalls",label: "Rivers",    from: 0.46, to: 0.72 },
  { id: "snow",      label: "Snow",      from: 0.66, to: 1.0 },
] as const;
