/**
 * Asset and storyboard registry for /3d.
 * Image files are the supplied frames, copied unchanged.
 * Camera positions live on the journey keys and are merged by getStoryboardRegistry().
 */

export const STORYBOARD_DIR = "/assets/wildefy/storyboard";

export type StoryFrameMeta = {
  frame: number;
  file: string;
  title: string;
  interval: readonly [number, number];
  progress: number;
  elements: string;
  light: string;
  transition: string;
  notes: string;
};

export const STORYBOARD_META: readonly StoryFrameMeta[] = [
  {
    frame: 1,
    file: "01_opening_aerial.jpg",
    title: "Opening aerial",
    interval: [0, 0.08],
    progress: 0,
    elements: "Dominant summit, layered ridges, valley forest, river, lake, low mist",
    light: "Low warm sun ahead-left of the opening view",
    transition: "Holds the wide sunrise, then begins the descent",
    notes: "High wide framing. Summit stays readable. Valley mist sits below the camera.",
  },
  {
    frame: 2,
    file: "02_approaching_base_camp.jpg",
    title: "Approaching Base Camp",
    interval: [0.08, 0.16],
    progress: 0.12,
    elements: "Valley floor, cabin roofs, forest closing around the clearing",
    light: "Same sun, now raking the valley",
    transition: "Aerial descent toward the camp",
    notes: "Camera drops but stays above the canopy so roofs read before the ground shot.",
  },
  {
    frame: 3,
    file: "03_base_camp_details.jpg",
    title: "Base Camp details",
    interval: [0.16, 0.23],
    progress: 0.195,
    elements: "Cabins, tents, fire, flag, clearing, peaks behind",
    light: "Warm side light on cabin faces",
    transition: "Settle into the clearing, then turn onto the trail",
    notes: "Ground-level view through the camp toward the range. No floating labels.",
  },
  {
    frame: 4,
    file: "04_forest_trail_begins.jpg",
    title: "Forest trail begins",
    interval: [0.23, 0.34],
    progress: 0.28,
    elements: "Trail corridor, foreground trunks, signpost, denser trees ahead",
    light: "Dappled sun from the same world direction",
    transition: "Lower to a forward hiking angle",
    notes: "Trail stays in frame. Trees are kept out of the camera corridor.",
  },
  {
    frame: 5,
    file: "05_deep_forest_trail.jpg",
    title: "Deep forest trail",
    interval: [0.34, 0.43],
    progress: 0.385,
    elements: "Dense conifers, ferns, fallen wood, enclosed path",
    light: "Broken light, stronger shade",
    transition: "Continue forward through the trees",
    notes: "Immersive forward view. Ferns line the corridor, trunks frame both sides.",
  },
  {
    frame: 6,
    file: "06_river_crossing.jpg",
    title: "River crossing",
    interval: [0.43, 0.48],
    progress: 0.455,
    elements: "River channel, boulders, first view of the bridge line",
    light: "Sun on the water, banks in partial shade",
    transition: "Open from the trees onto the water",
    notes: "Reveal the river before the deck fills the frame.",
  },
  {
    frame: 7,
    file: "07_approaching_river_crossing.jpg",
    title: "Approaching the bridge",
    interval: [0.48, 0.52],
    progress: 0.5,
    elements: "Near bank, bridge deck, moving water",
    light: "Low sun glancing off the channel",
    transition: "Approach along the bank onto the deck",
    notes: "Camera stays on the bank, aimed across the span.",
  },
  {
    frame: 8,
    file: "08_river_crossing_bridge.jpg",
    title: "On the bridge",
    interval: [0.52, 0.58],
    progress: 0.545,
    elements: "Planks, posts, rails, water on both sides",
    light: "Sun along the channel",
    transition: "Cross, then rejoin the forest trail",
    notes: "Forward view down the deck. Deck sits on the bank height above the cut.",
  },
  {
    frame: 9,
    file: "09_forest_camp.jpg",
    title: "Forest camp",
    interval: [0.58, 0.65],
    progress: 0.615,
    elements: "Shelter, tent, table, fire, clearing",
    light: "Warm fill in the clearing, forest shade around it",
    transition: "Move through the clearing and on toward the falls",
    notes: "Camp is built on the route terrace, not a separate scene.",
  },
  {
    frame: 10,
    file: "10_waterfall_approach.jpg",
    title: "Waterfall approach",
    interval: [0.65, 0.71],
    progress: 0.685,
    elements: "Trail, framing trees, first sight of the falls and rock",
    light: "Sun catching mist and the rock face",
    transition: "Gradual reveal through the trees",
    notes: "Falls are the same river, upstream of the bridge.",
  },
  {
    frame: 11,
    file: "11_waterfall_view.jpg",
    title: "Waterfall view",
    interval: [0.71, 0.76],
    progress: 0.735,
    elements: "Full sheet, cliff, receiving pool, mist",
    light: "Highlight on the falling water",
    transition: "Widen beside the pool, then start the climb",
    notes: "Pool connects back into the river ribbon.",
  },
  {
    frame: 12,
    file: "12_rocky_ascent.jpg",
    title: "Rocky ascent",
    interval: [0.76, 0.83],
    progress: 0.795,
    elements: "Exposed rock, thinning trees, rising trail",
    light: "Harder light on stone, less canopy shade",
    transition: "Climb with the grade",
    notes: "Tree placement thins as elevation rises.",
  },
  {
    frame: 13,
    file: "13_high_ridge_trail.jpg",
    title: "High ridge trail",
    interval: [0.83, 0.91],
    progress: 0.87,
    elements: "Ridge path, distant ranges, valley dropping away",
    light: "Open sun, long atmospheric depth",
    transition: "Follow the exposed ridge toward the crown",
    notes: "Valley cloud layer becomes visible below the camera.",
  },
  {
    frame: 14,
    file: "14_summit_approach.jpg",
    title: "Summit approach",
    interval: [0.91, 0.96],
    progress: 0.94,
    elements: "Final rocky trail, dominant summit ahead",
    light: "Sun near the skyline",
    transition: "Rise onto the crown",
    notes: "The same massif, closer. No scene swap.",
  },
  {
    frame: 15,
    file: "15_summit_arrival.jpg",
    title: "Summit arrival",
    interval: [0.96, 0.99],
    progress: 0.978,
    elements: "Summit rocks, flag, cloud deck, far peaks",
    light: "Sun in the sky beyond the crown",
    transition: "Arrive, then open into the panorama",
    notes: "Highest viewpoint on the route.",
  },
  {
    frame: 16,
    file: "16_final_summit_view.jpg",
    title: "Final summit view",
    interval: [0.99, 1],
    progress: 1,
    elements: "Panorama, sun, moving clouds, layered peaks",
    light: "Sun held in the panorama",
    transition: "Holds until the visitor scrolls back",
    notes: "Progress 1 stays on this view. Scroll reversal retraces the same spline.",
  },
];

export const SUPPLEMENTARY_REFERENCES = [
  {
    file: "ref_ridge_hiker.jpg",
    role: "Extra ridge reference supplied with the storyboard. Not one of the 16 frames. Not used as geometry.",
  },
  {
    file: "ref_dusk_camp.jpg",
    role: "Extra camp-mood reference. Not one of the 16 frames. Not used as geometry.",
  },
  {
    file: "ref_alpine_lake.jpg",
    role: "Extra aerial-lake reference. Not one of the 16 frames. Not used as geometry.",
  },
  {
    file: "ref_fern_trail.jpg",
    role: "Extra fern-trail reference. Not one of the 16 frames. Not used as geometry.",
  },
] as const;

export const MISSING_ASSETS = [
  {
    file: "index.html",
    expected: "public/assets/wildefy/storyboard/index.html",
    note: "The storyboard package did not include index.html. The 16 frames and four extra stills were supplied as images and copied unchanged.",
  },
] as const;

export const MODEL_MANIFEST = [
  {
    id: "oak-web-lod",
    path: "/models/oak_tree_web.glb",
    source: "Existing Wildefy oak, website/public/models/oak_tree_web.glb",
    status: "integrated",
    notes:
      "About 10 m source height, web LOD (trunk ~25k verts, canopy ~60k). No skeleton. Canopy uses vertex wind; trunk stays fixed. If the file fails to load, conifer instances remain and the page still runs.",
  },
  {
    id: "terrain",
    path: null,
    status: "procedural",
    notes:
      "Deterministic heightfield from the Wildefy route map. Replace buildTerrainGeometry() with a GLB when a surveyed mesh exists. No terrain GLB is in this repository.",
  },
  {
    id: "conifers-ferns-rocks-camps-bridge-water-clouds",
    path: null,
    status: "procedural",
    notes:
      "No pine, rock, cabin, bridge, water, or HDRI assets are in the repository. Those are built in code and labeled as procedural placeholders in this manifest.",
  },
] as const;

export function storyboardUrl(file: string) {
  return `${STORYBOARD_DIR}/${file}`;
}

/** Fixed world-space sun. The disc and the directional light share it. */
export const SUN_POSITION: readonly [number, number, number] = [-460, 320, -220];
