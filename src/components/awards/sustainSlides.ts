/** Six vertical wildlife slides inside the Sustainability hold. */
export type SustainSlide = {
  number: string;
  title: string;
  body: string;
  src: string;
  alt: string;
};

export const SUSTAIN_SLIDES: readonly SustainSlide[] = [
  {
    number: "01.",
    title: "Protect What Matters",
    body: "Travel with awareness, respect wildlife, and leave the natural world as undisturbed as possible.",
    src: "/images/awards-figma/circle-lion.png",
    alt: "A lion walking down a rock",
  },
  {
    number: "02.",
    title: "Observe Without Disturbing",
    body: "Patience is part of the journey. Watch quietly, keep your distance, and let wild moments unfold on their own.",
    src: "/images/awards-figma/circle-toucan.png",
    alt: "A keel-billed toucan perched on a mossy branch",
  },
  {
    number: "03.",
    title: "Respect Every Habitat",
    body: "Forests, rivers, and grasslands are living systems. Move lightly through them and leave trails as you found them.",
    src: "/images/awards-figma/circle-buffalo.png",
    alt: "An egret standing on a buffalo in golden water",
  },
  {
    number: "04.",
    title: "Support Local Guardians",
    body: "Communities closest to the wild protect it every day. Choose journeys that honor their knowledge and livelihoods.",
    src: "/images/gallery/forest-circle.jpg",
    alt: "Sunlit forest canopy forming a natural circle of light",
  },
  {
    number: "05.",
    title: "Travel With Intention",
    body: "Fewer vehicles, quieter camps, and thoughtful routes reduce pressure on fragile ecosystems and wildlife corridors.",
    src: "/images/gallery/hymakar/05.jpg",
    alt: "A close wildlife encounter in the field",
  },
  {
    number: "06.",
    title: "Leave It Better",
    body: "Conservation is a shared responsibility. Carry the wild forward — for the next traveler, and the next generation.",
    src: "/images/gallery/hymakar/10.jpg",
    alt: "Wild landscape preserved for the next generation",
  },
] as const;

export const SUSTAIN_SLIDE_COUNT = SUSTAIN_SLIDES.length;
