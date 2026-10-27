export type MapDesign = "original" | "illustrated";
export const MAP_DESIGN_KEY = "wildefy-map-design";
export function readMapDesign(): MapDesign {
  try {
    return localStorage.getItem(MAP_DESIGN_KEY) === "illustrated"
      ? "illustrated"
      : "original";
  } catch {
    return "original";
  }
}
export function saveMapDesign(design: MapDesign) {
  try {
    localStorage.setItem(MAP_DESIGN_KEY, design);
  } catch {
    /* Selection still works without storage. */
  }
}
