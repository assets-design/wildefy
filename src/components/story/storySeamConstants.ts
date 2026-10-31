/**
 * Shared Story (§4) → Conservation (§5) handoff metrics.
 * StoryScroll pin end and StorySeam close runway must stay aligned.
 */

/** Horizontal pan runway scale (panel travel × this). Shorter = less eagle scroll. */
export const STORY_PAN_SCALE = 1;

/**
 * Extra pin distance after the pan parks — mist closes over sticky Story
 * while Conservation stays below the fold.
 * Longer runway = slower start/end of the cloud handoff (pan scale unchanged).
 */
export const STORY_EXIT_HANDOFF_VH = 50;

/**
 * Start mist only once the pan has finished — keeps the final cockatoo
 * beat readable before the §4 → §5 cloud handoff begins.
 */
export const STORY_MIST_START_FRAC = 1;

/**
 * Mist clears across this much of Conservation’s pin (vh fraction).
 * Conservation must hold slide 0 for at least this distance so the first
 * point is still showing when the reveal finishes — not already on slide 2.
 */
export const STORY_SEAM_CLEAR_VH = 0.2;

/**
 * Extra hold on Conservation slide 0 after mist clears (vh fraction),
 * so scrolling back to the first point does not immediately re-trigger mist.
 */
export const CONSERVATION_FIRST_HOLD_VH = 0.55;
