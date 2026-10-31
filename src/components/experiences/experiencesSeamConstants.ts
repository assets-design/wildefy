/**
 * Experiences (§2) → Gallery (§3) handoff.
 *
 * Mist is scrubbed on §3 itself: starts as Gallery enters (`top bottom`),
 * ends when Gallery hits the top (`top top`) — ~100vh of travel.
 * RISE/CLEAR only set the rise→clear split ratio inside that travel.
 * No extra sticky seam after card 4 (Gallery enters immediately).
 */
export const EXPERIENCES_CONTENT_VH = 400;
/**
 * Card 4 `window.hold` — end of content runway.
 */
export const EXPERIENCES_CARD4_HOLD_FRAC = 1;
/** Kept for wrap math; must stay 0 so nothing sits after card 4. */
export const EXPERIENCES_POST_CARD_HOLD_VH = 0;
/** Rise/clear split only (actual mist duration = §3 fold→top ≈ 100vh). */
export const EXPERIENCES_RISE_VH = 30;
export const EXPERIENCES_CLEAR_VH = 30;
/** No post-card sticky — mist tracks Gallery entrance instead. */
export const EXPERIENCES_SEAM_HANDOFF_VH = EXPERIENCES_POST_CARD_HOLD_VH;
export const EXPERIENCES_WRAP_VH_WITH_SEAM =
  EXPERIENCES_CONTENT_VH + EXPERIENCES_SEAM_HANDOFF_VH;

/** Legacy offsets (unused by handoff; kept for any leftover imports). */
export const EXPERIENCES_RISE_START_VH = Math.round(
  EXPERIENCES_CONTENT_VH * EXPERIENCES_CARD4_HOLD_FRAC,
);
export const EXPERIENCES_RISE_END_VH =
  EXPERIENCES_RISE_START_VH + EXPERIENCES_RISE_VH;
export const EXPERIENCES_CLEAR_END_VH =
  EXPERIENCES_RISE_END_VH + EXPERIENCES_CLEAR_VH;
