export type SceneQuality = {
  tier: "mobile" | "desktop";
  pines: number;
  oaks: number;
  ferns: number;
  bushes: number;
  rocks: number;
  snowRocks: number;
  clouds: number;
  valleyClouds: number;
  mist: number;
  terrain: readonly [number, number];
  shadows: boolean;
  antialias: boolean;
  dpr: readonly [number, number];
};

export function detectQuality(): SceneQuality {
  const mobile =
    window.innerWidth < 820 || window.matchMedia("(pointer: coarse)").matches;
  if (mobile) {
    return {
      tier: "mobile",
      pines: 150,
      oaks: 6,
      ferns: 60,
      bushes: 36,
      rocks: 70,
      snowRocks: 24,
      clouds: 14,
      valleyClouds: 16,
      mist: 36,
      terrain: [110, 150],
      shadows: false,
      antialias: false,
      dpr: [1, 1.25],
    };
  }
  return {
    tier: "desktop",
    pines: 420,
    oaks: 16,
    ferns: 220,
    bushes: 110,
    rocks: 180,
    snowRocks: 56,
    clouds: 28,
    valleyClouds: 34,
    mist: 80,
      terrain: [260, 340],
    shadows: true,
    antialias: true,
    dpr: [1, 1.6],
  };
}

export function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
