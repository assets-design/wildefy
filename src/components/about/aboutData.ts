/** About Us copy — Figma node 585:563 */

export const HERO = {
  title: "From the Wild, For the World",
  image: "/images/about/hero-sunset.png",
  imageAlt: "Wild asses silhouetted against a blazing sunset on the open plains",
} as const;

export const EVERY_DOT = {
  title: "Every Dot Was a Number Once.",
  headline: "Hymakar Valluri was a CFO for 27 years.",
  accent: "Rows. Columns. Quarter ends. Balance sheets.",
  body: [
    "But what he became known for was the people.",
    "He took performers others had written off and helped turn them around.",
  ],
  ctaLabel: "Book Hymakar",
  ctaHref: "/#contact",
  portrait: "/images/about/hymakar-portrait.png",
  portraitAlt:
    "Hymakar Valluri in field gear with a telephoto lens against a coastal landscape",
} as const;

export const NUMBERS_STORY = {
  title: "The Numbers Were Never the Whole Story.",
  lead:
    "Hymakar’s 27-year corporate journey taught him that true leadership goes beyond numbers and performance. It lies in understanding people, recognising hidden potential, and helping individuals achieve what others thought was impossible.",
  milestones: [
    {
      heading: "27 Years In Finance",
      body: "Hymakar’s Corporate Journey Was Shaped By More Than Balance Sheets And Business Performance.",
    },
    {
      heading: "Recognising Hidden Potential",
      body: "True Leadership Lies In Understanding People, Recognising Their Strengths, And Helping Them Achieve What Others Thought Was Impossible.",
    },
    {
      heading: "Leadership Beyond Numbers",
      body: "The Lessons Of The Wild Reinforce The Importance Of Patience, Awareness, Trust, And Adapting To Every Situation.",
    },
  ],
} as const;

export const PLANET = {
  title: "Then the Spreadsheet Became a Planet.",
  paragraphs: [
    "The same grid that once organised numbers begins to reveal a much larger world.",
    "The principles of observation, patience, adaptation and understanding people take on new meaning when seen through the natural world.",
    "Corporate life becomes the starting point for a different kind of journey.",
  ],
  metrics: [
    { value: "27", label: "Years in Finance" },
    { value: "06", label: "Continents" },
    { value: "100+", label: "Honours" },
  ],
} as const;
