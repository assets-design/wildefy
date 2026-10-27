// One scroll timeline drives the globe camera, the dive into each landscape,
// the cloud haze that hides the scene switch, and the location titles.
// Per destination: rotate + zoom on globe → cloud dive → fly through landscape
// → rise into cloud → pull back out to the globe.

function ease(from: number, to: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}
function peak(center: number, width: number, v: number) {
  return ease(center - width, center, v) * (1 - ease(center, center + width, v));
}

// Per destination (~5.5 viewports): globe zoom ≈0.7vh, landscape ≈4.5vh, pull-back ≈0.3vh.
export const DIVE = 0.128;
export const SURFACE = 0.942;
const START = 0.06;
const END = 0.94;

// Relative scroll length per destination. India gets a long exploration stay;
// the globe zoom and pull-back keep the same absolute length for every stop.
export const JOURNEY_WEIGHTS = [6, 1, 1, 1];

export function getGlobeJourney(progress: number, count: number, weights: number[] = []) {
  const p = Math.max(0, Math.min(1, progress));
  const w = Array.from({ length: count }, (_, i) => weights[i] ?? 1);
  const total = w.reduce((a, b) => a + b, 0);
  let s = Math.max(0, Math.min(total - 0.000001, ((p - START) / (END - START)) * total));
  let index = 0;
  while (index < count - 1 && s >= (w[index] ?? 1)) {
    s -= w[index] ?? 1;
    index++;
  }
  const wi = w[index] ?? 1;
  const tail = 1 - SURFACE;
  const phase =
    s < DIVE
      ? s
      : s > wi - tail
        ? 1 - (wi - s)
        : DIVE + ((s - DIVE) / (wi - DIVE - tail)) * (SURFACE - DIVE);
  const active = p >= START && p <= END;
  const inLandscape = active && phase >= DIVE && phase < SURFACE;
  const zoom = ease(0.036, DIVE, phase);
  const retreat = ease(SURFACE, 1, phase);
  const segDistance = phase < SURFACE ? 6.2 - 4.4 * zoom : 1.8 + 4.4 * retreat;
  const distance =
    p < START
      ? 8 - 1.8 * ease(0, START, p)
      : p > END
        ? 6.2 + 4 * ease(END, 1, p)
        : segDistance;
  return {
    index,
    active,
    phase,
    inLandscape,
    rotate: ease(0, 0.086, phase),
    distance,
    haze: active
      ? Math.max(peak(DIVE, 0.025, phase), peak(SURFACE, 0.021, phase))
      : 0,
    landscapeT: Math.max(0, Math.min(1, (phase - DIVE) / (SURFACE - DIVE))),
    titleOpacity: inLandscape
      ? ease(DIVE + 0.04, DIVE + 0.08, phase) *
        (1 - ease(SURFACE - 0.09, SURFACE - 0.05, phase))
      : 0,
  };
}
