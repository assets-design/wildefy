import * as THREE from "three";

export type WildlifeBehaviour =
  | "standing-elephant"
  | "resting-elephant"
  | "grazing-deer";
const smooth = (a: number, b: number, x: number) =>
  THREE.MathUtils.smoothstep(x, a, b);

// Image-based articulation, not a skeleton: deform only the appropriate silhouette
// regions. World transforms and the ground-contact row never change.
export function createWildlifeAnimator(
  geometry: THREE.PlaneGeometry,
  behaviour: WildlifeBehaviour,
  phase: number,
) {
  const positions = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  const rest = Float32Array.from(positions.array as ArrayLike<number>);
  geometry.userData["behaviour"] = behaviour;
  return (time: number) => {
    const t = time + phase;
    const breath = Math.sin(t * 0.95) * 0.003;
    const height = geometry.parameters.height;
    const width = geometry.parameters.width;
    for (let i = 0; i < positions.count; i++) {
      const x = uv.getX(i),
        y = uv.getY(i);
      const rx = rest[i * 3] ?? 0,
        ry = rest[i * 3 + 1] ?? 0;
      let dx = 0,
        dy = 0;
      const planted = smooth(0.08, 0.3, y);
      if (behaviour === "standing-elephant") {
        const body =
          smooth(0.25, 0.6, y) *
          smooth(0.13, 0.25, x) *
          (1 - smooth(0.6, 0.8, x));
        dy = height * breath * body;
        const tail = (1 - smooth(0.075, 0.14, x)) * (1 - smooth(0.7, 0.85, y));
        dx = width * 0.009 * Math.sin(t * 0.75) * tail;
      } else if (behaviour === "resting-elephant") {
        dy =
          height *
          breath *
          smooth(0.28, 0.65, y) *
          (1 - smooth(0.62, 0.8, x));
        const trunk = smooth(0.75, 0.9, x) * (1 - smooth(0.45, 0.65, y));
        dy += height * 0.012 * Math.sin(t * 0.55) * trunk;
        dx = width * 0.004 * Math.sin(t * 0.55 + 0.8) * trunk;
      } else {
        const head = smooth(0.57, 0.73, x);
        const lift = Math.pow((Math.sin(t * 0.28) + 1) / 2, 12);
        const angle = lift * 0.45 + Math.sin(t * 1.3) * 0.018;
        const px = (0.63 - 0.5) * width,
          py = 0.69 * height;
        const ax = rx - px,
          ay = ry - py;
        dx = ((Math.cos(angle) - 1) * ax - Math.sin(angle) * ay) * head;
        dy = (Math.sin(angle) * ax + (Math.cos(angle) - 1) * ay) * head;
        dy += height * breath * smooth(0.55, 0.8, y) * (1 - head);
      }
      positions.setXYZ(
        i,
        rx + dx * planted,
        ry + dy * planted,
        rest[i * 3 + 2] ?? 0,
      );
    }
    positions.needsUpdate = true;
  };
}

export function parkSafariJeep(
  jeep: THREE.Object3D,
  x: number,
  y: number,
  z: number,
) {
  jeep.name = "india-parked-safari-jeep";
  jeep.position.set(x, y, z);
  jeep.rotation.set(0, 0, 0);
  jeep.updateMatrix();
  jeep.matrixAutoUpdate = false;
}
