import { Curve, Vector3 } from "three";

export const MAX_TILT = Math.PI / 2 - 0.08;
export const MARKER_RADIUS = 1.008;

/** Shortest spherical route, with endpoints touching the location markers. */
export class ExpeditionArc extends Curve<Vector3> {
  private angle: number;
  private axis: Vector3;
  constructor(
    private start: Vector3,
    end: Vector3,
  ) {
    super();
    this.start = start.clone().normalize();
    const finish = end.clone().normalize();
    this.angle = Math.acos(
      Math.max(-1, Math.min(1, this.start.dot(finish))),
    );
    this.axis = new Vector3().crossVectors(this.start, finish).normalize();
  }
  override getPoint(t: number, target = new Vector3()) {
    return target
      .copy(this.start)
      .applyAxisAngle(this.axis, this.angle * t)
      .multiplyScalar(MARKER_RADIUS + Math.sin(Math.PI * t) * 0.045);
  }
}

export function routeState(stage: number, index: number, count = 5) {
  const active = Math.min(Math.round(stage), count - 1);
  return { active: index === active, completed: index < active };
}

export type Orientation = {
  spin: number;
  tilt: number;
  manual: boolean;
  revision: number;
};

export function dragOrientation(
  state: Orientation,
  dx: number,
  dy: number,
  diameter: number,
) {
  state.manual = true;
  state.spin += (dx * Math.PI) / Math.max(diameter, 1);
  state.tilt = Math.max(
    -MAX_TILT,
    Math.min(MAX_TILT, state.tilt + (dy * Math.PI) / Math.max(diameter, 1)),
  );
}

export function reconcileOrientation(
  state: Orientation,
  target: { spin: number; tilt: number },
  revision: number,
  dragging: boolean,
  dt: number,
) {
  if (!dragging && revision !== state.revision) state.manual = false;
  state.revision = revision;
  if (state.manual || dragging) return;
  const blend = 1 - Math.exp(-6 * Math.min(dt, 0.05));
  const difference = Math.atan2(
    Math.sin(target.spin - state.spin),
    Math.cos(target.spin - state.spin),
  );
  state.spin += difference * blend;
  state.tilt += (target.tilt - state.tilt) * blend;
}
