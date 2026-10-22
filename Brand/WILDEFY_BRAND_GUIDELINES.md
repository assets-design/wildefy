# Wildefy — Brand Guidelines

> **Master artwork:** [`Wildefy Logo.png`](./Wildefy%20Logo.png)  
> **Measured from that file on 2026-10-13.** Colors and proportions below are pixel measurements, not estimates from a screenshot.  
> **Scope:** the logo mark only. Website layout, type scale, and the 15″–24″ stage stay in [`WILDEFY_WEBSITE_DEVELOPMENT_GUIDE.md`](../WILDEFY_WEBSITE_DEVELOPMENT_GUIDE.md).

The logo is a locked drawing. It is not a font setting. Do not retype WILDEFY to recreate it.

---

## 1. The mark

The mark is the word **WILDEFY** in one horizontal line.

| Piece | What it is |
|-------|------------|
| Letters W, I, L, D, F, Y | White, high-contrast serif logotype. Thick stems, sharp serifs, tight spacing. |
| Letter E | Not a white letter. Three jagged claw strokes, rising toward the right, occupy the E position and cut across D, F, and the left edge of Y. |
| Ground inside the file | Transparent. The black you see in some previews is the viewer behind the file, not pixels in the PNG. |

Reading order stays WILD + claw-as-E + FY. Removing the claw removes the E. Recoloring the claw to match the white letters hides the E in the word.

The claw is one connected orange shape: three parallel slashes with torn edges and pointed tips. It is not a separate icon, not a pattern, and not a brush that can be redrawn per layout.

---

## 2. Master file

| Property | Value |
|----------|--------|
| File | `Brand/Wildefy Logo.png` |
| Pixel size | **1092 × 417** |
| Aspect | **2.619 : 1** (1092 ÷ 417) |
| Color mode | 32-bit RGBA |
| Background | Transparent (alpha 0 at the corners) |
| Crop | Tight. White stems touch the left edge. Claw tips touch the top and bottom edges. Do not crop this file further. |

There is no alternate file in the repo: no stacked version, no icon-only version, no black version, no SVG. Until those are drawn from this master, use this PNG.

---

## 3. Color

Sampled from opaque pixels in the master (orange sample: 44,238 pixels).

| Role | Token | Hex | Use |
|------|--------|-----|-----|
| Wordmark | `--brand-white` | `#FFFFFF` | W, I, L, D, F, Y. Flat. No grey, no off-white. |
| Claw | `--brand-claw` | `#F9A01F` | The E / claw only. Flat fill. |
| Field | `--brand-field` | `#000000` | Preferred background behind the mark. |
| File background | — | transparent | Leave transparent. Do not flatten the PNG onto white. |

Edge pixels run from about `#F49F20` to `#FBC473`. That spread is anti-aliasing against transparency, not a designed gradient. Do not rebuild the claw as a gradient.

### 3.1 Website orange is a different color

The website accent is the same flat claw color, `#F9A01F` (`--color-accent` in the website guide). Buttons, focus, the Field band, and the quotation mark use it. Text on that orange is black. The logo PNG stays the original artwork: white letters, flat `#F9A01F` claw, no gradient.

| Surface | Color |
|---------|--------|
| Logo claw | `#F9A01F` only |
| Site accent (buttons, focus, Field, quotation mark) | `#F9A01F` |
| Type on the accent | `#000000` |

Do not recolor the logo file, and do not paint a gradient through the claw.

---

## 4. Construction

Measured on the 1092 × 417 master. Scale every number by the same factor. Do not scale width and height differently.

### 4.1 Vertical

| Edge | y (px) | Note |
|------|--------|------|
| Claw top | 0 | Touches the file edge |
| Letter cap line | 100 | Top of the white letters |
| Letter baseline | 404 | Bottom of the white letters |
| Claw bottom | 416 | Touches the file edge |

| Measure | px | Share of cap height (305px) |
|---------|----|------------------------------|
| White letter height | 305 | 1 |
| Claw height | 417 | 1.37 |
| Claw above the cap | 100 | 0.33 |
| Claw below the baseline | 12 | 0.04 |

The claw is taller than the letters, mostly above them. Any container that clips to the cap height cuts the claw off and destroys the E.

### 4.2 Horizontal letter masses

White pixels, left to right. Gaps are the counters and the spaces between letters. The long gap between D and F is the claw, which is the E.

| Glyph | x start | Width (px) | Width ÷ cap height |
|-------|---------|------------|--------------------|
| W | 4 | 219 | 0.72 |
| gap | 223 | 7 | |
| I | 230 | 66 | 0.22 |
| gap | 296 | 16 | |
| L | 312 | 130 | 0.43 |
| gap | 442 | 10 | |
| D | 452 | 147 | 0.48 |
| E (claw, not white) | 443 | orange runs to x 992 | |
| F | 791 | 132 | 0.43 |
| gap | 923 | 9 | |
| Y | 932 | 155 | 0.51 |

The orange occupies **x 439–995** (550px wide) and the full file height. It starts at the right side of L, covers D, replaces E, crosses F, and ends inside the left side of Y.

### 4.3 Clear-space unit

**X = the width of the I = 66px** on this master (0.060 of the file width, 0.216 of the cap height).

Clear space around the **file bounds** is **1X** on every side. The master already has no internal padding, so this space is added in the layout, outside the image.

At any size:

```
clear space = 0.060 × rendered logo width
```

No type, rule, photo edge, or other logo sits inside that margin. The claw tips are inside the file, so the margin is measured from the PNG edge, not from the white cap line.

### 4.4 Minimum size

| Use | Minimum width | Cap height at that width |
|-----|---------------|--------------------------|
| Digital | **240px** | ~67px |
| Favicon, avatar, app icon | Do not use this file | The claw and the I collapse. A separate icon does not exist yet. |

Below 240px wide, do not place this logo.

---

## 5. Placement

Primary placement is the transparent PNG on `#000000`, or on a photograph that is dark enough that `#FFFFFF` and `#F9A01F` both stay intact. On the website, the header wordmark sits on `--color-bg` (`#000000`) inside the 1920 stage. Size it in stage pixels, then let the stage scale. Do not give the logo its own breakpoint.

| Ground | Allowed |
|--------|---------|
| `#000000` | Yes. Primary. |
| Transparent over a near-black field | Yes, if the field stays at or below `#000000` and is not a busy texture under the letters. |
| White or light grey | No. The letters are white and disappear. |
| Orange `#F9A01F` | No. The claw disappears. |
| Photographs | Only with a solid `#000000` plate behind the mark, larger than the mark by 1X on every side. |

Alignment: optical center is the file center. Do not center on the white letters alone. That drops the claw tips out of the frame.

---

## 6. Reproduction rules

**Do**

- Use `Brand/Wildefy Logo.png` unchanged.
- Scale uniformly.
- Keep the transparent background.
- Add 1X clear space outside the file.
- Sit it on black.

**Do not**

- Retype the name in Cormorant Garamond, DM Sans, or any other font and call it the logo.
- Separate the claw from the word, rotate it, or use it as a bullet or divider.
- Rebuild the E as a normal serif E.
- Change `#F9A01F` to a gradient, to red, or to black while leaving the letters white on black (the E vanishes into the field if the claw becomes black).
- Add a stroke, shadow, glow, bevel, or texture.
- Stretch, italicize, or outline the file.
- Crop the claw tips.
- Place the file on white.
- Recolor individual letters.
- Animate by pulling the claw off the word. Motion may fade or wipe the whole mark as one piece.

A one-color version (all white, or all black) is not in the folder. Do not improvise one by flattening the PNG. Commission it from this master if a single-ink print file is required.

---

## 7. Name in text

When the name is set in a sentence, it is the word Wildefy in the surrounding type (DM Sans on the site). Titles use Cormorant Garamond. Capitalize the W only, unless the layout is a display heading that is already all capitals.

The drawn logo is not a substitute for the name in body copy. Do not drop the PNG into a paragraph.

---

## 8. Developer notes

```css
:root {
  --brand-white: #ffffff;
  --brand-claw: #f9a01f;
  --brand-field: #000000;
}
```

- Serve the PNG as-is from `Brand/` for brand use. For the site, copy it to the public assets path without recompression that fringes the orange.
- `alt` text: `Wildefy`.
- Intrinsic ratio: `1092 / 417`. Set width, leave height `auto`. Do not set both width and height to different ratios.
- Minimum rendered width: `240px` before the page’s stage scale. After stage scale, the painted size may be smaller on a 15″ screen; the stage rule in the website guide still wins. Do not swap in a simpler logo at 1366.

---

## 9. Change log

| Date | Change |
|------|--------|
| 2026-10-13 | First guidelines, measured from `Wildefy Logo.png` (1092 × 417, transparent). Claw `#F9A01F`. Wordmark `#FFFFFF`. E is the claw, not a white letter. |
| 2026-10-13 | Site accent aligned to `#F9A01F`. Titles are Cormorant Garamond. Descriptions are DM Sans. |
