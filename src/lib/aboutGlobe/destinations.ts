export type Destination = {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  species: string;
  blurb: string;
  season: string;
  duration: string;
  image?: string;
  lesson?: string;
  paragraphs?: string[];
  takeaway?: string[];
};

/** Six stops from Lovable Pixel Perfect Replica (95). */
export const DESTINATIONS: Destination[] = [
  {
    id: "svalbard",
    name: "Svalbard",
    region: "Arctic Norway",
    lat: 78.2,
    lon: 15.6,
    species: "Polar bear",
    blurb:
      "Drift through the pack ice beneath the midnight sun, where polar bears hunt along the edge of the world.",
    season: "Jun – Aug",
    duration: "10 days",
    lesson: "Patience Is A Discipline, Not A Mood.",
    paragraphs: [
      "In The Arctic, Nothing May Happen For Days.",
      "And Then Everything Can Happen In Ninety Seconds.",
      "The Experience Becomes A Lesson In Patience, Preparation And Being Ready When The Moment Finally Arrives.",
    ],
    takeaway: [
      "The People Who Wait Well Are Often The Ones Who Are Ready When The Opportunity Comes.",
    ],
  },
  {
    id: "kamchatka",
    name: "Kamchatka",
    region: "Russian Far East",
    lat: 56.0,
    lon: 159.6,
    species: "Brown bear",
    blurb:
      "Volcanoes, salmon rivers and the largest brown bears in Eurasia — a wilderness few have seen.",
    season: "Jul – Sep",
    duration: "12 days",
    lesson: "Resilience Is Built, Not Preached.",
    paragraphs: [
      "Nobody Here Survives On A Slogan.",
      "Steadiness Comes From Repetition Under Real Pressure, Season After Season.",
    ],
  },
  {
    id: "borneo",
    name: "Borneo",
    region: "Southeast Asia",
    lat: 1.0,
    lon: 114.0,
    species: "Orangutan",
    blurb:
      "Ancient rainforest canopies, home to the gentle red apes and a chorus of hornbills.",
    season: "Mar – Oct",
    duration: "9 days",
    lesson: "Read What Is Not Being Said.",
    paragraphs: [
      "In The Rainforest Canopy, You Rarely See The Animal First.",
      "You See A Branch Move.",
      "You Notice A Sound.",
      "You Notice A Change In The Environment.",
    ],
    takeaway: ["Good Leaders Notice The Branch."],
  },
  {
    id: "rwanda",
    name: "Rwanda",
    region: "East Africa",
    lat: -1.47,
    lon: 29.5,
    species: "Mountain gorilla",
    blurb:
      "Trek the misty slopes of the Virungas for an hour in the company of a gorilla family.",
    season: "Jun – Sep",
    duration: "7 days",
    lesson: "Trust Arrives At Their Pace, Not Yours.",
    paragraphs: [
      "You Cannot Simply Walk Into A Wild Environment And Expect It To Respond To You.",
      "You Observe.",
      "You Wait.",
      "You Respect Distance.",
      "You Allow Trust To Develop Naturally.",
    ],
    takeaway: ["Trust Cannot Be Demanded. It Has To Be Earned."],
  },
  {
    id: "brazil",
    name: "Brazil",
    region: "The Amazon",
    lat: -3.1,
    lon: -60.0,
    species: "Jaguar",
    blurb:
      "Glide through flooded forest and riverbanks where the jaguar rules the Amazon.",
    season: "May – Nov",
    duration: "11 days",
    lesson: "Do Not Write Off The One Nobody Is Watching.",
    paragraphs: [
      "Some Of The Most Memorable Wildlife Encounters Can Come From The Animal That Everyone Else Has Stopped Looking For.",
      "The Same Can Happen With People.",
    ],
    takeaway: [
      "Sometimes The Individual Who Receives The Least Attention Has The Greatest Potential.",
    ],
  },
  {
    id: "galapagos",
    name: "Ecuador",
    region: "Eastern Pacific",
    lat: -0.8,
    lon: -91.0,
    species: "Giant tortoise",
    blurb:
      "Volcanic islands where evolution unfolds in plain sight — fearless, ancient, extraordinary.",
    season: "Year-round",
    duration: "10 days",
    lesson: "Adapt To The Island You Are On.",
    paragraphs: [
      "The Galápagos Represents Adaptation.",
      "Species Evolved According To The Environment Around Them.",
      "Each Island Created Different Conditions.",
      "Each Species Responded Differently.",
    ],
    takeaway: [
      "Strategy Works In Much The Same Way.",
      "There Is No Single Environment.",
      "There Is No Single Formula.",
      "Adapt To The Island You Are On.",
    ],
  },
];

/** Unit vector on a SphereGeometry for a lat/lon (equirectangular UVs). */
export function latLonToVec(lat: number, lon: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return [
    -Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta),
  ];
}

/** Globe orientation (spin about Y, then tilt about X) facing a point to camera. */
export function orientationsFor(dests: Destination[]) {
  const out: { spin: number; tilt: number }[] = [];
  let prev = 0;
  dests.forEach((d, i) => {
    const [x, , z] = latLonToVec(d.lat, d.lon);
    let spin = -Math.atan2(x, z);
    if (i > 0) {
      while (spin - prev > Math.PI) spin -= 2 * Math.PI;
      while (spin - prev < -Math.PI) spin += 2 * Math.PI;
    }
    prev = spin;
    out.push({ spin, tilt: ((d.lat * Math.PI) / 180) * 0.85 });
  });
  return out;
}

/** Map scroll progress [0..1] to a stage float [0..n-1] with holds at each stop. */
export function stageFromProgress(p: number, n: number) {
  const s = Math.min(Math.max(p, 0), 1) * (n - 1);
  const i = Math.min(Math.floor(s), n - 2);
  const f = s - i;
  // Longer hold at each stop so every card stays readable while scrolling.
  const t = Math.min(Math.max((f - 0.35) / 0.3, 0), 1);
  return i + t * t * (3 - 2 * t);
}

/**
 * Which destination faces the camera for a given globe orientation
 * (spin about Y, then tilt about X — matches GlobeScene).
 */
export function nearestDestinationIndex(spin: number, tilt: number) {
  let best = 0;
  let bestZ = -Infinity;
  DESTINATIONS.forEach((d, i) => {
    const [x, y, z] = latLonToVec(d.lat, d.lon);
    const cosY = Math.cos(spin);
    const sinY = Math.sin(spin);
    const y1 = y;
    const z1 = -x * sinY + z * cosY;
    const cosX = Math.cos(tilt);
    const sinX = Math.sin(tilt);
    const z2 = y1 * sinX + z1 * cosX;
    if (z2 > bestZ) {
      bestZ = z2;
      best = i;
    }
  });
  return best;
}
