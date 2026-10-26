import * as THREE from "three";
import { STORYBOARD_META, type StoryFrameMeta } from "@/config/wildefySceneManifest";
import {
  bridgeDeckY,
  CROSSING_X,
  CROSSING_Z,
  FALLS_X,
  FALLS_Z,
  terrainHeight,
} from "@/lib/wildefy3d/terrain";

export type JourneyKey = {
  frame: number | null;
  progress: number;
  position: readonly [number, number, number];
  target: readonly [number, number, number];
  fov: number;
  /** Minimum camera height above the heightfield. 0 leaves an aerial key untouched. */
  clearance: number;
};

function eye(x: number, z: number, lift: number): [number, number, number] {
  return [x, terrainHeight(x, z) + lift, z];
}

/** Look ahead without locking onto a distant cliff. */
function ahead(fromX: number, fromZ: number, toX: number, toZ: number, lift: number): [number, number, number] {
  return [toX, terrainHeight(fromX, fromZ) + lift, toZ];
}

const deck = bridgeDeckY();

/**
 * One spline for the whole journey. Null frames are shape controls so the
 * path stays on the trail between storyboard compositions.
 */
export const JOURNEY_KEYS: readonly JourneyKey[] = [
  {
    frame: 1,
    progress: 0,
    position: [90, 300, 540],
    target: [-40, 190, -640],
    fov: 50,
    clearance: 0,
  },
  {
    frame: null,
    progress: 0.06,
    position: [40, 210, 420],
    target: [-60, 80, 40],
    fov: 48,
    clearance: 0,
  },
  {
    frame: 2,
    progress: 0.12,
    position: [-10, 120, 310],
    target: [-78, 24, 170],
    fov: 50,
    clearance: 0,
  },
  {
    frame: 3,
    progress: 0.195,
    position: eye(-78, 236, 3.8),
    target: ahead(-78, 236, -84, 190, 2.2),
    fov: 48,
    clearance: 3.4,
  },
  {
    frame: null,
    progress: 0.24,
    position: eye(-62, 180, 3.6),
    target: ahead(-62, 180, -58, 120, 2.4),
    fov: 50,
    clearance: 3.2,
  },
  {
    frame: 4,
    progress: 0.28,
    position: eye(-52, 128, 3.4),
    target: ahead(-52, 128, -60, 48, 2.6),
    fov: 50,
    clearance: 3.2,
  },
  {
    frame: null,
    progress: 0.33,
    position: eye(-64, 55, 3.2),
    target: ahead(-64, 55, -58, -10, 2.4),
    fov: 50,
    clearance: 3.1,
  },
  {
    frame: 5,
    progress: 0.385,
    position: eye(-66, -8, 3.2),
    target: ahead(-66, -8, -42, -95, 2.5),
    fov: 49,
    clearance: 3.1,
  },
  {
    frame: 6,
    progress: 0.455,
    position: eye(-6, -155, 5.5),
    target: ahead(-6, -155, CROSSING_X, CROSSING_Z, 2.4),
    fov: 50,
    clearance: 4,
  },
  {
    frame: 7,
    progress: 0.5,
    position: eye(CROSSING_X + 30, CROSSING_Z + 8, 5.5),
    target: [CROSSING_X - 8, deck + 1.6, CROSSING_Z],
    fov: 48,
    clearance: 3.2,
  },
  {
    frame: 8,
    progress: 0.545,
    position: [CROSSING_X + 12, deck + 3.2, CROSSING_Z],
    target: [CROSSING_X - 18, deck + 1.8, CROSSING_Z],
    fov: 48,
    clearance: 4,
  },
  {
    frame: 9,
    progress: 0.615,
    position: eye(-6, -358, 4.2),
    target: ahead(-6, -358, -34, -392, 2.4),
    fov: 50,
    clearance: 3.4,
  },
  {
    frame: null,
    progress: 0.655,
    position: eye(2, -470, 4.4),
    target: ahead(2, -470, FALLS_X, FALLS_Z, 8),
    fov: 48,
    clearance: 3.6,
  },
  {
    frame: 10,
    progress: 0.685,
    position: eye(10, -512, 5),
    target: ahead(10, -512, FALLS_X, FALLS_Z, 14),
    fov: 46,
    clearance: 4,
  },
  {
    frame: 11,
    progress: 0.735,
    position: eye(46, -534, 8),
    target: ahead(46, -534, FALLS_X, FALLS_Z, 10),
    fov: 44,
    clearance: 5,
  },
  {
    frame: 12,
    progress: 0.795,
    position: eye(-4, -735, 3.8),
    target: ahead(-4, -735, 12, -830, 4),
    fov: 50,
    clearance: 3.4,
  },
  {
    frame: null,
    progress: 0.835,
    position: eye(8, -840, 4),
    target: ahead(8, -840, 16, -940, 5),
    fov: 49,
    clearance: 3.5,
  },
  {
    frame: 13,
    progress: 0.87,
    position: eye(16, -910, 4.4),
    target: ahead(16, -910, 6, -1040, 6),
    fov: 48,
    clearance: 3.8,
  },
  {
    frame: 14,
    progress: 0.94,
    position: eye(20, -1045, 4.2),
    target: ahead(20, -1045, 40, -1140, 8),
    fov: 46,
    clearance: 3.8,
  },
  {
    frame: 15,
    progress: 0.978,
    position: eye(16, -1132, 4.2),
    target: ahead(16, -1132, 44, -1166, 5),
    fov: 48,
    clearance: 3.6,
  },
  {
    frame: 16,
    progress: 1,
    position: eye(62, -1188, 26),
    target: [-90, 110, -360],
    fov: 56,
    clearance: 14,
  },
];

const positionCurve = new THREE.CatmullRomCurve3(
  JOURNEY_KEYS.map((key) => new THREE.Vector3(...key.position)),
  false,
  "centripetal",
  0.35,
);
const targetCurve = new THREE.CatmullRomCurve3(
  JOURNEY_KEYS.map((key) => new THREE.Vector3(...key.target)),
  false,
  "centripetal",
  0.35,
);
positionCurve.arcLengthDivisions = 400;
targetCurve.arcLengthDivisions = 400;

function cumulativeLengths(curve: THREE.Curve<THREE.Vector3>, samples = 500) {
  const lengths = [0];
  let previous = curve.getPoint(0);
  for (let index = 1; index <= samples; index += 1) {
    const point = curve.getPoint(index / samples);
    lengths.push(lengths[index - 1] + point.distanceTo(previous));
    previous = point;
  }
  return lengths;
}

const positionLengths = cumulativeLengths(positionCurve);
const targetLengths = cumulativeLengths(targetCurve);

function parameterToArc(lengths: number[], t: number) {
  const samples = lengths.length - 1;
  const x = THREE.MathUtils.clamp(t, 0, 1) * samples;
  const index = Math.min(samples - 1, Math.floor(x));
  const fraction = x - index;
  const distance = lengths[index] * (1 - fraction) + lengths[index + 1] * fraction;
  return distance / lengths[samples];
}

function arcToParameter(lengths: number[], arc: number) {
  const total = lengths[lengths.length - 1] || 1;
  const target = THREE.MathUtils.clamp(arc, 0, 1) * total;
  let low = 0;
  let high = lengths.length - 1;
  while (low < high - 1) {
    const mid = (low + high) >> 1;
    if (lengths[mid] < target) low = mid;
    else high = mid;
  }
  const span = lengths[high] - lengths[low] || 1;
  const fraction = (target - lengths[low]) / span;
  return (low + fraction) / (lengths.length - 1);
}

const positionArc = JOURNEY_KEYS.map((_, index) =>
  parameterToArc(positionLengths, index / (JOURNEY_KEYS.length - 1)),
);
const targetArc = JOURNEY_KEYS.map((_, index) =>
  parameterToArc(targetLengths, index / (JOURNEY_KEYS.length - 1)),
);

const samplePosition = new THREE.Vector3();
const sampleTarget = new THREE.Vector3();

export type JourneySample = {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  frame: number;
};

function smooth(value: number) {
  return value * value * (3 - 2 * value);
}

/** XZ samples of the camera route, used to keep trees out of the lens. */
export function cameraTrail(samples = 100) {
  const points: Array<readonly [number, number]> = [];
  for (let index = 0; index <= samples; index += 1) {
    const sample = sampleJourney(index / samples);
    points.push([sample.position.x, sample.position.z]);
  }
  return points;
}

export function frameForProgress(progress: number) {
  let frame = 1;
  for (const key of JOURNEY_KEYS) {
    if (key.frame && progress + 1e-4 >= key.progress) frame = key.frame;
  }
  return frame;
}

/** Arc-length sample. Returned vectors are reused on the next call. */
export function sampleJourney(progress: number): JourneySample {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  let index = 0;
  while (index < JOURNEY_KEYS.length - 2 && JOURNEY_KEYS[index + 1].progress < t) index += 1;
  const from = JOURNEY_KEYS[index];
  const to = JOURNEY_KEYS[index + 1];
  const span = to.progress - from.progress || 1;
  const local = smooth((t - from.progress) / span);

  const positionU = THREE.MathUtils.lerp(positionArc[index], positionArc[index + 1], local);
  const targetU = THREE.MathUtils.lerp(targetArc[index], targetArc[index + 1], local);
  samplePosition.copy(positionCurve.getPoint(arcToParameter(positionLengths, positionU)));
  sampleTarget.copy(targetCurve.getPoint(arcToParameter(targetLengths, targetU)));

  const clearance = THREE.MathUtils.lerp(from.clearance, to.clearance, local);
  // Stay above the coarse mesh, which can sit higher than a narrow dip in the field.
  let ground = terrainHeight(samplePosition.x, samplePosition.z);
  for (const offset of [5, -5]) {
    ground = Math.max(
      ground,
      terrainHeight(samplePosition.x + offset, samplePosition.z),
      terrainHeight(samplePosition.x, samplePosition.z + offset),
    );
  }
  samplePosition.y = Math.max(samplePosition.y, ground + Math.max(clearance, 3));

  return {
    position: samplePosition,
    target: sampleTarget,
    fov: THREE.MathUtils.lerp(from.fov, to.fov, local),
    frame: frameForProgress(t),
  };
}

export type StoryboardRecord = StoryFrameMeta & {
  position: readonly [number, number, number];
  target: readonly [number, number, number];
  fov: number;
  clearance: number;
  image: string;
  integration: "reference-loaded";
};

export function getStoryboardRegistry(): StoryboardRecord[] {
  return STORYBOARD_META.map((meta) => {
    const key = JOURNEY_KEYS.find((item) => item.frame === meta.frame);
    if (!key) throw new Error(`Missing camera key for storyboard frame ${meta.frame}`);
    return {
      ...meta,
      position: key.position,
      target: key.target,
      fov: key.fov,
      clearance: key.clearance,
      image: `/assets/wildefy/storyboard/${meta.file}`,
      integration: "reference-loaded" as const,
    };
  });
}

export function auditJourney(steps = 240) {
  const issues: string[] = [];
  let minGap = Number.POSITIVE_INFINITY;
  let previous: THREE.Vector3 | null = null;
  const seen = new Set<number>();

  for (let index = 0; index <= steps; index += 1) {
    const progress = index / steps;
    const sample = sampleJourney(progress);
    seen.add(sample.frame);
    const gap = sample.position.y - terrainHeight(sample.position.x, sample.position.z);
    minGap = Math.min(minGap, gap);
    if (gap < 1.2) issues.push(`clearance ${gap.toFixed(2)} at ${progress.toFixed(3)}`);
    if (previous) {
      const jump = previous.distanceTo(sample.position);
      if (jump > 55) issues.push(`jump ${jump.toFixed(1)} at ${progress.toFixed(3)}`);
    }
    previous = sample.position.clone();
  }

  for (let frame = 1; frame <= 16; frame += 1) {
    if (!seen.has(frame)) issues.push(`frame ${frame} not visited`);
  }

  const startSample = sampleJourney(0);
  const start = {
    position: startSample.position.toArray(),
    target: startSample.target.toArray(),
    frame: startSample.frame,
  };
  const endSample = sampleJourney(1);
  const end = {
    position: endSample.position.toArray(),
    target: endSample.target.toArray(),
    frame: endSample.frame,
  };
  return { minGap, issues, start, end };
}
