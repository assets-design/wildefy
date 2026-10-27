export type GlobeDestination = {
  slug: string;
  cta: string;
  name: string;
  region: string;
  biome: "forest" | "volcanic" | "savannah" | "arctic";
  lat: number;
  lon: number;
  image: string;
  body: string;
  href: string;
};

export const globeDestinations: GlobeDestination[] = [
  {
    slug: "india",
    cta: "Explore India",
    name: "India",
    region: "Asia",
    biome: "forest",
    lat: 22.3,
    lon: 80.6,
    image: "/globe-kit/tiger.jpg",
    body: "Forests, wildlife and photography experiences.",
    href: "/destination",
  },
  {
    slug: "galapagos",
    cta: "Explore Galápagos",
    name: "Galápagos, Ecuador",
    region: "South America",
    biome: "volcanic",
    lat: -0.8,
    lon: -90.5,
    image: "/globe-kit/galapagos.jpg",
    body: "A world shaped by volcanic landscapes, ocean currents and extraordinary biodiversity.",
    href: "#world",
  },
  {
    slug: "maasai-mara",
    cta: "Explore Maasai Mara",
    name: "Maasai Mara, Kenya",
    region: "Africa",
    biome: "savannah",
    lat: -1.5,
    lon: 35.1,
    image: "/globe-kit/mara.jpg",
    body: "Open plains, dramatic wildlife encounters and one of Africa's most iconic wilderness experiences.",
    href: "#world",
  },
  {
    slug: "svalbard",
    cta: "Explore Svalbard",
    name: "Svalbard, Norway",
    region: "Arctic",
    biome: "arctic",
    lat: 78.2,
    lon: 15.6,
    image: "/globe-kit/svalbard.jpg",
    body: "At the northern edge of the world, ice, ocean and mountains create a remarkable Arctic wilderness.",
    href: "#world",
  },
];

/** Safari parks revealed one by one as the globe zooms into India. */
export const indiaSafariParks = [
  { name: "Gir", lat: 21.1, lon: 70.8 },
  { name: "Ranthambore", lat: 26.0, lon: 76.5 },
  { name: "Jim Corbett", lat: 29.5, lon: 78.8 },
  { name: "Kaziranga", lat: 26.6, lon: 93.4 },
  { name: "Sundarbans", lat: 21.9, lon: 88.9 },
  { name: "Periyar", lat: 9.5, lon: 77.2 },
  { name: "Tadoba", lat: 20.2, lon: 79.3 },
  { name: "Pench", lat: 21.7, lon: 79.3 },
  { name: "Bandhavgarh", lat: 23.7, lon: 81.0 },
  { name: "Kanha", lat: 22.3, lon: 80.6 },
];
