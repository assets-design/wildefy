# Wildefy — Website Development Guide

> **Purpose:** Single source of truth for building the Wildefy website so every in-range screen paints the same composition.  
> **Audience:** UI/UX developers, frontend engineers, and anyone implementing or reviewing pages.  
> **Design canvas:** **1920px** wide (`Home final`, `1920 × 13329`).  
> **Logo:** [`Brand/WILDEFY_BRAND_GUIDELINES.md`](./Brand/WILDEFY_BRAND_GUIDELINES.md), measured from `Brand/Wildefy Logo.png`. The claw and the site accent are `#F9A01F`. Do not redraw the logo in a font, and do not paint a gradient on the logo file.  
> **Fonts:** titles H1–H6 are Cormorant Garamond Regular. Descriptions are DM Sans Regular. Files live in `Brand/Fonts/`.  
> **This repository:** no Wildefy Figma file and no final page copy. Every Wildefy-only choice is marked **Decision (derived from …)** and names the source rule it comes from. Theories client names, contact details, Mediverse, and footer artwork are not Wildefy facts.

**Conflict rule:** If a later section disagrees with **§0**, **§0 wins**.

---

## 0. Primary objective — one viewport from 15″ through 24″

A section seen on a large display (including a **25″** screen) is the same section on every monitor from **15″ through 24″**. Layout, type scale, spacing, and section composition stay constant. The page does not restack, reflow, or change density inside that band.

Per-token `clamp()` and layout breakpoints below `xl` change painted size token-by-token and change structure at `1280 / 1024 / 768`. **Decision (same homepage, structure unchanged, applied as one canvas):** Wildefy does not use that method. One stage is designed at **1920px**. The stage is centered. Inside the 15″–24″ band there are **no media-query layout changes**. A single scale factor shrinks the whole stage when the CSS viewport is narrower than 1920. The stage never grows past 1920. Extra width letterboxes.

### 0.1 What “15 inch” and “24 inch” mean in CSS

CSS does not know physical inches. **Decision (derived from the source device table in the primary objective):** the band is the CSS widths that table already assigns.

| Class | Source CSS width | Wildefy treatment |
|-------|------------------|-------------------|
| 15″ floor | **1366px** | In band. Uniform scale. Same composition. |
| 15″ upper / 16–17″ | **1440–1680px** | In band. Uniform scale. Same composition. |
| 24″ cap | **1920px** | In band. Scale **1**. Exact canvas. |
| Above the cap, including a **25″** monitor whose CSS width exceeds 1920 | **>1920px** | **Out of range as a design.** Not a second layout. Scale stays **1**. Stage centered. Side letterbox in `--color-bg`. |
| Below the floor | **<1366px** | **Out of range.** Not a second layout. Same stage, same scale formula. No hamburger, no stacked columns, no second type scale. |

A 15″ panel and a 24″ panel that both report **1920 CSS pixels** are the same experience: scale 1, no letterbox. A 25″ panel that reports **1920 CSS pixels** matches them. A 25″ panel that reports **more than 1920 CSS pixels** shows that same 1920 stage in the middle of the screen.

### 0.2 In-band rules (non-negotiable)

1. Author every measurement at canvas pixels (the source Figma maxima). Do not convert them to `clamp()`, `vw` type, or breakpoint utilities.
2. The only width-driven change inside **1366–1920** is the stage scale `S = viewport / 1920`. It is one multiplier on the whole stage and on the header chrome.
3. Do not write `@media` rules between **1366px and 1920px** that change `font-size`, `line-height`, `letter-spacing`, `padding`, `margin`, `gap`, `width`, `height`, `grid-template-columns`, `flex-direction`, `display`, or component variant.
4. Do not use container queries to restack sections.
5. Do not set `min-width: 1920px` on `body` (that forces horizontal scroll on a 15″ CSS viewport instead of scaling).
6. Do not zoom `body` or `html`. The source forbids a body zoom hack. Scale `#stage` and the header only.
7. Browser zoom (Ctrl/Cmd +/-) stays native. The fitter listens to `window` `resize` only, not `visualViewport`, so it does not fight pinch or page zoom.

### 0.3 Letterbox and scale

| CSS viewport `vw` | Band | Scale | What the person sees |
|-------------------|------|-------|----------------------|
| **1920** | In band (24″ cap) | `1` | Canvas 1:1. |
| **1680** | In band | `1680/1920 = 0.875` | Whole page uniformly smaller. No reflow. |
| **1440** | In band | `0.75` | Same composition at three quarters. |
| **1366** | In band (15″ floor) | `1366/1920 ≈ 0.7115` | Same composition, scaled to the width. |
| **1919–1366** | In band | `vw/1920` | Scaled stage fills the width. Side letterbox is **0**. |
| **>1920** (24″ QHD, 25″, ultrawide) | Out of range, same design | `1` | 1920 stage centered. Each side letterbox is `(vw − 1920) / 2` of `--color-bg`. Content does not grow. |
| **<1366** | Out of range, same design | `vw/1920` | Still the 1920 composition, scaled down. Unsupported. Do not design for it. |

**Worked letterbox:** a 2560px-wide viewport (typical unscaled 25″ / QHD) letterboxes `(2560 − 1920) / 2 = 320px` on each side. The section in the middle matches the 1920 stage exactly.

**Worked scale:** at 1440 the stage is 75% of canvas. Overlay a 1920 screenshot scaled to 75% on a 1440 screenshot. They match. That overlay is the acceptance test (§15).

### 0.4 CSS the developer implements

Tokens:

```css
:root {
  --stage-width: 1920px;
  --stage-scale: 1;
  --band-min: 1366;
  --band-max: 1920;
  --header-top: 30px;
  --header-block: 114px; /* 30 + 84, canvas px */
}
```

Stage and frame:

```css
html {
  text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  background: var(--color-bg);
}

body {
  margin: 0;
  background: var(--color-bg);
  overflow-x: hidden;
}

.stage-frame {
  width: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  background: var(--color-bg);
}

.stage {
  width: var(--stage-width);
  flex: 0 0 var(--stage-width);
  transform: scale(var(--stage-scale));
  transform-origin: top center;
}
```

Header chrome sits **outside** `.stage`, because a `transform` on an ancestor changes `position: fixed` into containing-block behavior and the pill would scroll away:

```css
.stage-header {
  position: fixed;
  z-index: 50;
  top: calc(var(--header-top) * var(--stage-scale));
  left: 50%;
  width: 1396px;
  height: 84px;
  transform: translateX(-50%) scale(var(--stage-scale));
  transform-origin: top center;
}
```

Nothing inside `.stage` uses `position: fixed` or `position: sticky`. Transform breaks both. In-section layering uses `position: absolute`.

Fitter (`src/components/layout/StageFrame.tsx`), required, not optional:

```ts
const STAGE = 1920;

export function readStageScale() {
  const vw = document.documentElement.clientWidth;
  return Math.min(1, vw / STAGE);
}

export function applyStage(frame: HTMLElement, stage: HTMLElement) {
  const scale = readStageScale();
  document.documentElement.style.setProperty("--stage-scale", String(scale));
  const unscaled = stage.offsetHeight;
  frame.style.height = `${unscaled * scale}px`;
}
```

- Use `document.documentElement.clientWidth`, not `window.innerWidth` and not `100vw`. `100vw` includes the scrollbar and overflows by about 15px.
- Call `applyStage` in `useLayoutEffect`, on `window` `resize`, and from a `ResizeObserver` on `.stage`.
- Frame height **must** be `unscaledHeight × scale`. `transform` does not shrink layout height; without this assignment the page shows a blank gap under the scaled stage.
- Classify the band for QA only. Do not branch layout on it.

```ts
const band =
  vw >= 1366 && vw <= 1920 ? "in-band" : "out-of-range";
```

Before first paint, set the scale from `layout.tsx` with a `next/script` of strategy `beforeInteractive`:

```html
<script>
  (function () {
    var w = document.documentElement.clientWidth || 1920;
    var s = Math.min(1, w / 1920);
    document.documentElement.style.setProperty("--stage-scale", String(s));
  })();
</script>
```

`scroll-margin-top` on each section is **114px** in canvas coordinates. Screen scroll of `114 × scale` equals 114 canvas pixels, which clears the scaled header.

### 0.5 Section uniqueness

Each screen section has its own layout, its own content role, and its own visual job. Shared chrome (header, close) may repeat across routes. A section pattern may appear once on the site. Do not reuse a pattern to “save a component.” The matrix is §7.0.

---

## Fonts used

Swap families here. Size tokens stay put when the family changes. Two files, two variables, one inventory. Do not hunt components for one-off `font-family` or `font-size` values.

Titles **H1 through H6** use **Cormorant Garamond Regular** (`--font-display`). Descriptions, labels, navigation, buttons, and numbers use **DM Sans Regular** (`--font-body`). The logo is the PNG in `Brand/`. It is not set in either font.

Both files are already in `Brand/Fonts/`. When the app is scaffolded, copy them to `public/fonts/` without renaming the family. `font-synthesis: none` on `body` so the browser does not fake a bold or italic.

Cormorant Garamond and DM Sans are both SIL Open Font License. Self-host these files. Do not load them from a third-party stylesheet.

### Families

| CSS variable | Family | Weight loaded | File | Role |
|--------------|--------|---------------|------|------|
| `--font-display` | **Cormorant Garamond** | 400 Regular | `Brand/Fonts/CormorantGaramond-Regular.ttf` | H1–H6, kicker, quotation mark |
| `--font-body` | **DM Sans** | 400 Regular | `Brand/Fonts/DMSans-Variable.ttf` | Descriptions, buttons, labels, navigation, chips, numbers |

DM Sans is the official variable file, locked to weight **400**. Do not turn on 500 or 700.

### Heading map

| Level | Token | Size | Family |
|-------|-------|------|--------|
| H1 | `--type-display` | `80px` | Cormorant Garamond |
| H2 | `--type-h2` | `64px` | Cormorant Garamond |
| H3 | `--type-h3` | `44px` | Cormorant Garamond |
| H4 | `--type-h4` | `40px` | Cormorant Garamond |
| H5 | `--type-h5` | `32px` | Cormorant Garamond |
| H6 | `--type-h6` | `24px` | Cormorant Garamond |

H5 and H6 are reserved. No current section uses them. Do not restyle an H1–H4 down to H5 to fit a column.

```css
@font-face {
  font-family: "Cormorant Garamond";
  src: url("/fonts/CormorantGaramond-Regular.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "DM Sans";
  src: url("/fonts/DMSans-Variable.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

:root {
  --font-display: "Cormorant Garamond", "Times New Roman", serif;
  --font-body: "DM Sans", system-ui, sans-serif;
}
```

To swap fonts later: replace the two `font-family` names, the two files, and the two `--font-*` values. Leave every `--type-*` size as written.

### Size tokens

Sizes are canvas pixels at scale 1. They do not change between 1366 and 1920.

**Decision (derived — sizes stay, faces change):** line-height is locked so intentional breaks stay stable on the fixed stage.

| Token | Size | Line-height | Family variable | Weight | Where it is used |
|-------|------|-------------|-----------------|--------|------------------|
| `--type-stat` | `100px` | `0.9` | `--font-body` | 400 | Claim rail numbers only |
| `--type-display` | `80px` | `1` | `--font-display` | 400 | H1. Home Claim. Work mast. Practice page statement. |
| `--type-h2` | `64px` | `1.05` | `--font-display` | 400 | H2. Index title, home Practice title, Record quote, Ledger title, Field title, Studio title, Contact title |
| `--type-quote-mark` | `60px` | `1` | `--font-display` | 400 | Record quotation mark only |
| `--type-service-num` | `50px` | `1` | `--font-body` | 400 | Home Practice spine numbers. Practice page column numbers. |
| `--type-h3` | `44px` | `1.05` | `--font-display` | 400 | H3. Index media title, Work feature title |
| `--type-h4` | `40px` | `1.1` | `--font-display` | 400 | H4. Index rail titles, Practice panel title, Practice page column names, Ledger row name, Ledger figure, Catalogue names, Contact social names |
| `--type-h5` | `32px` | `1.15` | `--font-display` | 400 | H5. Reserved. Unused. |
| `--type-kicker` | `30px` | `1.15` | `--font-display` | 400 | Record kicker only |
| `--type-h6` | `24px` | `1.2` | `--font-display` | 400 | H6. Reserved. Unused. |
| `--type-nav` | `24px` | `1` | `--font-body` | 400 | Header links |
| `--type-body` | `22px` | `1.45` | `--font-body` | 400 | Descriptions: Signal sentence, Practice panel body, Practice page column body, Work feature summary, form field text, Contact email and phone values, Close values |
| `--type-cta` | `20px` | `1` | `--font-body` | 400 | Every button label, Index text link, Studio biography |
| `--type-tag` | `18px` | `1` | `--font-body` | 400 | Home Practice tag chips only |
| `--type-metric` | `18px` | `1.4` | `--font-body` | 400 | Index rail numbers, Ledger result phrase, Feature eyebrow and meta, Catalogue discipline, Record name, AI chip label, form labels, Contact channel labels, Close labels |
| `--type-body-sm` | `17px` | `1.45` | `--font-body` | 400 | Claim subcopy, Claim stat labels, Record detail, Close legal |
| `--type-quote` | `16px` | `1.4` | `--font-body` | 400 | Form error hint, Catalogue year |

Utility names (define once in `src/styles/globals.css`, reuse): `type-stat`, `type-display`, `type-h2`, `type-quote-mark`, `type-service-num`, `type-h3`, `type-h4`, `type-h5`, `type-kicker`, `type-h6`, `type-nav`, `type-body`, `type-cta`, `type-tag`, `type-metric`, `type-body-sm`, `type-quote`. Each utility sets `font-family`, `font-weight`, `font-size`, and `line-height` from the tokens above. Components do not set raw `font-size`.

---

## 1. Project summary

Wildefy is a single marketing site: black ground, claw orange `#F9A01F`, Cormorant Garamond titles, DM Sans descriptions. The page set, section geometries, and sentences are Wildefy’s. They are not a second copy of the Theories homepage.

| Item | Value | Source |
|------|--------|--------|
| Brand | Wildefy | This product. Not Theories Consulting. |
| Design canvas | `1920` wide | Source `Home final` width |
| Content width | `1680px` | Source §1 |
| Side inset | `120px` | Source §1 / `--space-11` |
| Primary accent | `#F9A01F` | Logo claw, **§4.1** |
| Titles H1–H6 | Cormorant Garamond Regular | **Fonts used** |
| Descriptions | DM Sans Regular | **Fonts used** |
| Email | `{{WILDEFY_EMAIL}}` | **Decision (derived):** unset. Do not use `theoriesconsulting@gmail.com`. |
| Phone | `{{WILDEFY_PHONE}}` | **Decision (derived):** unset. Do not use the Theories phone number. |
| Address | none until supplied | **Decision (derived):** the Theories Hyderabad address is not a Wildefy fact. |

```
|← 120 →|←——————— content 1680 ———————→|← 120 →|
|←———————————————— stage 1920 ————————————————→|
```

---

## 2. Design source of truth

### 2.1 What to build from

Build Wildefy from **this file**, using measurements inherited from Theories `Home final` (`1720:4223`) as listed in §4 and §6. There is no Wildefy Figma in the repo. Do not open older Theories frames (`Home 1`, `Home 2`) and do not transplant the Theories section order (§7 of the source) onto these routes.

| Page | Route | Canvas | Sections (each unique — §7) |
|------|-------|--------|-----------------------------|
| Home | `/` | 1920 wide | Claim, Signal, Index, Practice, Record, Ledger, Field, Close |
| Work | `/work` | 1920 wide | Mast, Feature, Catalogue, Close |
| Practice | `/practice` | 1920 wide | Statement, Columns, Close |
| Studio | `/studio` | 1920 wide | Portrait, Close |
| Contact | `/contact` | 1920 wide | Form, Close |

Until real copy exists, ship the placeholder strings in §7 verbatim. Replace them in one content module (§11), not inside components.

### 2.2 How to measure

1. Measure from the **120px** gutter in canvas pixels.
2. Export photos at **2×**. Export the wordmark and icons as **SVG**.
3. Rebuild with flex and grid inside the 1920 stage. Do not paste absolute-positioned Figma output, except the Practice panel’s internal alignment where §7.4 gives percentages.
4. Placeholder copy is marked. Do not “correct” it into Theories headlines.

### 2.3 Known gaps

| Gap | Required handling |
|-----|-------------------|
| No Wildefy Figma | This guide’s canvas numbers are the spec. A future Figma updates this file first. The logo mark is specified in `Brand/WILDEFY_BRAND_GUIDELINES.md`. |
| Fonts are in `Brand/Fonts/`, not yet copied to `public/fonts/` | Copy both files into `public/fonts/` before launch. Paths and family names are in **Fonts used**. |
| No contact facts | Render `{{WILDEFY_EMAIL}}` and `{{WILDEFY_PHONE}}` until replaced. |
| No mobile frames in the source | Still no second design. Below 1366 is out of range (§0). |
| Hover / focus incomplete in the source | Use §6 and §12. |
| `#686868` on `#000` | Keep the token. Record the contrast check in §13. Do not invent a replacement grey. |

---

## 3. Tech stack

Inherited from source §3.

| Layer | Recommendation | Why |
|-------|----------------|-----|
| Framework | **Next.js (App Router) + TypeScript** | Routing, image, metadata |
| Styling | **Tailwind v4** + CSS variables | Tokens in one file; utilities from **Fonts used** |
| Stage | React `StageFrame` + `beforeInteractive` script | §0.4 |
| Animation | CSS keyframes + light Framer Motion | Record crossfade, Index media swap |
| Forms | React Hook Form + Zod | Contact |
| Hosting | Vercel / Netlify | Static + SSR |

---

## 4. Design tokens

Store in `src/styles/tokens.css`. Type tokens live with **Fonts used** and are repeated here only as names.

### 4.1 Color

Taken from the logo file. The old orange gradient `#FE4A01` → `#FEBA07` is retired. It is not in the logo.

```css
:root {
  --color-accent: #F9A01F;

  --color-black: #000000;
  --color-white: #FFFFFF;
  --color-text: #000000;
  --color-text-muted: #686868;
  --color-text-on-dark-muted: rgba(255, 255, 255, 0.6);

  --color-bg: #000000;
  --color-bg-light: #FFFFFF;
  --color-nav-glass: rgba(255, 255, 255, 0.1);
  --color-border-glass: rgba(255, 255, 255, 1);
  --color-hairline: rgba(255, 255, 255, 0.2);

  --color-focus: #F9A01F;
  --color-error: #D64545;
  --color-success: #1F9D55;
}
```

**Usage**

- `--color-accent` (`#F9A01F`) fills the primary pill, the Field band, the Index active bar, and the Record quotation mark. It is a flat color. Do not rebuild it as a gradient.
- Type on `--color-accent` is `#000000`. White on `#F9A01F` is about 2.1:1, so it is not used for text.
- Outline pills: white border on dark, black border on light.
- Muted text uses `--color-text-muted` on light and on the Claim labels. Supporting copy on dark uses `--color-text-on-dark-muted`.
- Letterbox and page ground use `--color-bg`, so a 25″ screen’s side bars match the stage ground.

### 4.2 Spacing

Inherited maxima from source §4.3. On this site they are **fixed canvas pixels**, used directly. They are not clamp maxima.

| Token | Value | Use |
|-------|-------|-----|
| `--space-1` | `4px` | Micro |
| `--space-2` | `8px` | Tight |
| `--space-3` | `12px` | Compact |
| `--space-4` | `16px` | Card internal |
| `--space-5` | `24px` | Related blocks |
| `--space-6` | `32px` | Sub-gaps |
| `--space-7` | `40px` | Grids and chip rows |
| `--space-8` | `48px` | Panel pad |
| `--space-9` | `64px` | Large pad |
| `--space-10` | `80px` | Signal vertical pad, Index rail gap |
| `--space-11` | `120px` | Page gutter and section pad |

### 4.3 Layout

```css
:root {
  --page-max: 1920px;
  --content-max: 1680px;
  --gutter: 120px;
  --header-height: 84px;
  --header-width: 1396px;
  --radius-pill: 60px;
  --radius-nav: 42px;
  --radius-tag: 34.5px;
  --radius-ai-chip: 32.5px;
  --btn-height: 59px;
  --tag-height: 57px;
  --ai-chip-height: 65px;
}
```

`.content` inside the stage: `width: 1680px; margin-inline: auto;` which is the same box as `padding-inline: 120px` on a 1920 section. Use one or the other per section, not both.

### 4.4 Elevation and effects

Inherited from source §4.5, at fixed pixels.

| Effect | Spec |
|--------|------|
| Nav glass | `background: rgba(255,255,255,0.1); backdrop-filter: blur(12px); border: 0.5px solid #fff; border-radius: 42px` |
| Brand CTA | `background: var(--color-accent); color: #000; border-radius: 60px; border: 2px solid #F9A01F` |
| Outline CTA on dark | `border: 1px solid #fff; border-radius: 60px; background: transparent; color: #fff` |
| Outline CTA on light | `border: 1px solid #000; border-radius: 60px; background: transparent; color: #000` |
| Black pill on accent | `background: #000; color: #fff; border-radius: 60px; height: 59px` |
| Tag chip | `height: 57px; border-radius: 34.5px; border: 1px solid currentColor; padding-inline: 24px` |
| AI chip | white fill, `height: 65px`, `border-radius: 32.5px`, `box-shadow: 0 0 4px rgba(0,0,0,0.25)` |
| Hairline | `1px solid var(--color-hairline)` on dark, `1px solid rgba(0,0,0,0.12)` on light |
| Index scrim | **Decision (derived from §13 contrast):** `linear-gradient(transparent, rgba(0,0,0,0.55))` over the bottom `200px` of Index media so the 44px white title clears |

### 4.5 Motion

Inherited from source §D6 / §12, with marquees removed because Wildefy has no marquee section.

- Global interactive transition: `150ms ease`. Declare it once on `a, button`. Do not re-declare per component.
- Index media and Record quote: crossfade `150ms ease`.
- `prefers-reduced-motion: reduce` disables crossfades. Content swaps instantly.
- First load: soft fade on the Claim H1 and subcopy only.

---

## 5. Information architecture

**Decision (derived from source §5.1 chrome, not from Theories labels):** the header keeps the source structure — mark, three links, outline button, accent button. Labels are Wildefy’s.

| Label | Type | Target |
|-------|------|--------|
| Wildefy mark | Link | `/` |
| Work | Link | `/work` |
| Practice | Link | `/practice` |
| Studio | Link | `/studio` |
| Start a project | Outline button | `/contact` |
| Book a session | Accent button | `/contact#session` |

There is no showreel and no “Cup of tea?” control. That control belonged to a Theories section this site does not have.

### 5.1 Close (site-wide)

**Component:** `src/components/layout/Close.tsx`, rendered after `<main>` inside `.stage`.

| Block | Content |
|-------|---------|
| Wordmark | `Brand/Wildefy Logo.png`, width `1680`, opacity `0.35`. No retyped wordmark, no Theories RIES paths, no gold glow, no golden-ratio spiral. |
| Reach | Label “Email” + `{{WILDEFY_EMAIL}}` (`mailto:`). Label “Phone” + `{{WILDEFY_PHONE}}` (`tel:`). One row. |
| Legal | `©2026 Wildefy` · Privacy Policy · Terms & Conditions |

Social names and AI chips live on Contact only (§7.14), so Close stays a different pattern from Contact.

---

## 6. Component library

Build these before sections. Metrics are source metrics at canvas size. Behavior is Wildefy’s.

### 6.1 `Header`

| Spec | Canvas | Notes |
|------|--------|-------|
| Box | `1396 × 84`, `top: 30` | Outside `.stage`. See §0.4. |
| Radius | `42px` | `--radius-nav` |
| Surface | Glass, §4.4 | `z-index: 50` |
| Mark | `Brand/Wildefy Logo.png`, height `25px`, width auto | Left inset `32px`. Do not retype it. |
| Links | `type-nav`, white | Work · Practice · Studio, gap `32px` |
| Actions | Outline “Start a project” + accent “Book a session” | `Button`, gap `12px`, right inset `16px` |

The full link row is always visible. There is no hamburger at any width.

### 6.2 `Button`

| Variant | Look | Height | Radius | Type token |
|---------|------|--------|--------|------------|
| `primary` | `#F9A01F` fill, black label, `2px` solid `#F9A01F` | 59 | 60 | `type-cta` |
| `outline-dark` | Transparent, white border, white label | 59 | 60 | `type-cta` |
| `outline-light` | Transparent, black border, black label | 59 | 60 | `type-cta` |
| `on-accent` | Black fill, white label, used on the `#F9A01F` field | 59 | 60 | `type-cta` |
| `tag` | Transparent, black border, black label | 57 | 34.5 | `type-tag` |
| `tag-on-dark` | **Decision (derived from outline-on-dark):** transparent, white border, white label | 57 | 34.5 | `type-tag` |
| `ai` | White fill, soft shadow, black label | 65 | 32.5 | `type-metric` (`--font-body` 400) |

Padding inline for pills: `32px`. Hover: primary and `on-accent` use `filter: brightness(1.06)`. Outline thickens to `2px`. Focus-visible: `outline: 2px solid var(--color-focus); outline-offset: 2px`. Disabled: `opacity: 0.4`.

### 6.3 `StatRail`

Used only by Claim. Vertical list. Number is `type-stat`, white. Label is `type-body-sm`, `--color-text-muted`. Gap from number to label: `8px`. Divider between items: full rail width, hairline, margin-block `28px`.

Values are placeholders (`00`). Do not insert Theories’ 30+ / 25+ / 300+ / 20+.

### 6.4 `IndexRail` and `IndexMedia`

Used only by Index.

- Media frame: `1040 × 600`, `object-fit: cover`, scrim §4.4, title `type-h3` white, inset `32px` from the bottom-left of the frame.
- Rail width `560px`. Row min-height `88px`. Number `type-metric` in `--color-text-muted`. Title `type-h4` black. Hairline under each row.
- Active row: `3px` bar on the left, `background: var(--color-accent)`, full row height.
- Pointer and keyboard (`ArrowUp` / `ArrowDown`, `Home` / `End`) move the active index. Media crossfades. The section height does not change.

### 6.5 `PracticeSpine` and `PracticePanel`

Used only by the home Practice section.

- Spine item: number `type-service-num`, name `type-body`. Active: white. Inactive: `rgba(255,255,255,0.4)`. Gap between items: `32px`.
- Panel min-height `480px`, padding `48px`. Icon `60 × 60`. Title `type-h4`. Body `type-body`, max measure `640px`, color `--color-text-on-dark-muted`. Tags: `tag-on-dark`, gap `12px`, margin-top `40px`.
- One panel is open. Default is `01`. Activating a spine item crossfades the panel. Height stays `480px` minimum so the band does not jump.

### 6.6 `RecordPoster`

Used only by Record. Centered column, max text width `1440px`. No portrait, no dots, no circular arrows.

- Kicker: `type-kicker`.
- Mark: `type-quote-mark`, color `var(--color-accent)`, `aria-hidden="true"`.
- Quote: `type-h2`, black, centered.
- Bar: name `type-metric` black; detail `type-body-sm` muted; controls are text buttons “Previous” and “Next” at `type-cta`.

Six quotes in data. Previous / Next wrap. One quote is in the DOM as visible text; the rest are not displayed as a carousel track.

### 6.7 `LedgerTable`

Used only by Ledger. Four rows. Row height `120px`. Columns `40% / 36% / 24%`. Name `type-h4` white. Phrase `type-metric` in `--color-text-on-dark-muted`. Figure `type-h4` white, right-aligned. Hairline between rows and on the outer top and bottom. No images and no logos.

### 6.8 `FieldBand`

Used only by Field. Full-bleed `--color-accent`, height `640px`, content centered on both axes. Title `type-h2` black, max-width `1000px`, center. One `Button` variant `on-accent`, margin-top `40px`, label “Let’s begin”, href `/contact`. **Decision (derived from the source Mediverse black pill, reduced to one action so this band is not a two-button split).** No second link and no media. Black type is required: white on `#F9A01F` fails contrast.

### 6.9 `Close`

| Item | Canvas |
|------|--------|
| Band | `#000`, width 1920 |
| Wordmark window | height `300px`, `overflow: hidden`, gutter `120` |
| Wordmark | `Brand/Wildefy Logo.png`, width `1680`, height auto, opacity `0.35` |
| Reach row | padding `0 120 48px`. Labels `type-metric` muted. Values `type-body` white. Column gap `80px`. One line. |
| Legal | hairline, padding `24px 120px`. `type-body-sm`. Copyright muted. Links white. |

### 6.10 `Content` / `SectionTitle`

- `Content`: `1680px` centered.
- `SectionTitle`: `type-h2` plus an optional one-line support sentence at `type-body`. Home sections that use a title use `SectionTitle` once each, in different alignments (see §7). Alignment is part of the section, not a shared centered hero.

### 6.11 `UnderlineField`

Contact only. Label `type-metric` muted, above the control, gap `8px`. Control is a bottom border `1px solid #000`, no box, height `48px`, text `type-body`. Error text `type-quote`, `--color-error`.

### 6.12 `AiChip` row

Contact only. Three chips from `Button` variant `ai`: Ask ChatGPT, Ask Claude, Ask Perplexity. Destinations follow the source share pattern (§5.2): `https://chatgpt.com/?q=…`, `https://claude.ai/new?q=…`, `https://www.perplexity.ai/search/new?q=…`. Query text is `What is Wildefy?` until marketing writes the prompt. Logos: `public/images/icons/ask-chatgpt.png`, `ask-claude.png`, `ask-perplexity.png` when exported. Chip internals: logo `24px` plus label, gap `8px`, padding inline `20px`.

---

## 7. Screen sections

### 7.0 Uniqueness matrix

| Section | Route | Layout | Content role | Visual job |
|---------|-------|--------|--------------|------------|
| Header | all | Fixed glass pill | Wayfinding | Instrument floating on the page |
| Claim | `/` | Type column + vertical number rail | Proposition | Editorial poster |
| Signal | `/` | One sentence on a horizontal rule | Trust, in one line | Typographic ruler |
| Index | `/` | Media plane + text rail | Enter the work | Asymmetric stage |
| Practice | `/` | Number spine + one panel | The offer | Split instrument |
| Record | `/` | Centered quote, no image | Client voice | Type poster |
| Ledger | `/` | Hairline rows, no images | Measured results | Data ledger |
| Field | `/` | Full-bleed `#F9A01F`, one button | Conversion | Color field |
| Close | all | Cropped outline wordmark + one reach line | End matter | Endmark |
| Mast | `/work` | Single baseline title, no media | Name the archive | Short mast |
| Feature | `/work` | Media left, copy right, static | Lead case | Split chapter |
| Catalogue | `/work` | Text rows, no media | The rest of the archive | Index list |
| Statement | `/practice` | One 80px sentence, no rail | Define the practice | Statement |
| Columns | `/practice` | Four text columns, vertical rules | Hold all four offers at once | Column matrix |
| Portrait | `/studio` | Image bleeds off the left edge | Who the studio is | Bleed portrait |
| Form | `/contact` | Underline fields + channel column | Write in | Form split |

If a new section matches an existing row’s layout **and** visual job, it does not ship. Design a new row and update this matrix first.

**Placeholder rule for every string below:** **Decision (derived from source §D4 — keep authored line breaks).** Strings are locked placeholders. Replace in `src/content`. Do not replace them with Theories headlines.

### 7.1 Claim — `/`

| | |
|--|--|
| Role | State what Wildefy holds. |
| Visual job | Poster: oversized type opposite a vertical count. |
| Ground | `#000` |
| Height | `780px` (**Decision (derived from source showreel Y = 780):** the first band ends where the source hero handed off to the reel.) |
| Title origin | `x = 120`, `y = 264` (**Decision (derived from source §6.12 title Y).**) |

Left column, width `1000px`:

- H1, one per page, `type-display`, white. Break after the first line (real `<br>`, always, at every width):  
  `Hold a harder line.`  
  `Then make it public.`
- Subcopy, margin-top `32px`, width `640px`, `type-body-sm`, `--color-text-on-dark-muted`. Break after the first sentence:  
  `A standard you can point at.`  
  `Work, practice, and proof on one canvas.`

Right rail, width `360px`, `x = 1440` (`1920 − 120 − 360`), `y = 264`:

| Value | Label |
|-------|-------|
| `00` | Clients |
| `00` | Fields |
| `00` | Works |
| `00` | People |

`StatRail` (§6.3). No buttons in this band. No video.

### 7.2 Signal — `/`

| | |
|--|--|
| Role | One breath of trust. |
| Visual job | A ruler. One line of type tied to a rule. |
| Ground | `#000` |
| Pad | `80px` block, gutter `120` |

A `1px` rule, color `--color-hairline`, width `1680`, vertically centered in the band. The sentence sits on the same center line, `type-body`, white, and breaks the rule (the rule stops `16px` before the text and resumes `16px` after it).

`Selected work · Measured outcomes · Direct collaboration`

No logos, no motion, no second line.

### 7.3 Index — `/`

| | |
|--|--|
| Role | Open the archive. |
| Visual job | Asymmetric stage: picture left, names right. |
| Ground | `#fff` |
| Pad | `120px` |

- `SectionTitle`, left aligned, black: `Work, indexed.` Margin-bottom `48px`.
- Row: media `1040 × 600`, gap `80px`, rail `560px`.
- Overlay title is the active case name (`type-h3`, white).
- Under the row, left aligned, margin-top `32px`: text link “View the index” `type-cta`, black, underline offset `4px`, href `/work`. This is a link, not a pill.

Placeholder cases (five). Media paths `public/images/work/0N.jpg` until shot:

| # | Name |
|---|------|
| 01 | Case North |
| 02 | Case Harbor |
| 03 | Case Field |
| 04 | Case Kiln |
| 05 | Case Relay |

### 7.4 Practice — `/` (home)

| | |
|--|--|
| Role | Explain the offer, one chapter at a time. |
| Visual job | Instrument: spine selects, panel shows. |
| Ground | `#000` |
| Pad | `120px` |

Columns: spine `520px`, gap `120px`, panel `1040px`.

- Spine heading `type-h2`, white: `The practice.` Margin-bottom `48px`.
- Items:

| # | Name | Panel title | Body placeholder | Tags |
|---|------|-------------|------------------|------|
| 01 | Name | Naming the offer | One paragraph, 22px, two sentences maximum. | Strategy · Language |
| 02 | Position | Placing the offer | One paragraph, 22px, two sentences maximum. | Position · Proof |
| 03 | System | Building the system | One paragraph, 22px, two sentences maximum. | Identity · Rules |
| 04 | Launch | Sending it out | One paragraph, 22px, two sentences maximum. | Campaign · Site |

Icons: `public/images/icons/practice-01.svg` through `practice-04.svg`, `60px`. Do not reuse Theories service PNG names as the content source. The box size matches the source service icon maximum (§D3, 60px).

### 7.5 Record — `/`

| | |
|--|--|
| Role | One client voice. |
| Visual job | Type poster. |
| Ground | `#fff` |
| Pad | `120px` |

Order, all centered: kicker, quotation mark, quote, then the bar (bar is a 1680-wide row, not centered type).

- Kicker: `In their words`
- Quote placeholder: `They set a standard and kept it in the work.`
- Bar left: name placeholder `Name`. Detail placeholder `Role, Company`.
- Bar right: Previous, Next.

No photograph. The source portrait size (`624 × 560`) is not used on Wildefy.

### 7.6 Ledger — `/`

| | |
|--|--|
| Role | Show outcomes as rows. |
| Visual job | Ledger. |
| Ground | `#000` |
| Pad | `120px` |

- `SectionTitle`, left, white: `Outcomes.` Margin-bottom `48px`.
- Four placeholder rows. Figures stay `00` until real results exist. Do not copy Theories metrics (`2.2x increase in Ecommerce sales`) or featured client names.

| Work | Phrase | Figure |
|------|--------|--------|
| Case North | Result line pending. | `00` |
| Case Harbor | Result line pending. | `00` |
| Case Field | Result line pending. | `00` |
| Case Kiln | Result line pending. | `00` |

### 7.7 Field — `/`

| | |
|--|--|
| Role | Ask for the next conversation. |
| Visual job | A color field with a single action. |
| Ground | `--color-accent` (`#F9A01F`, flat) |
| Height | `640px` (**Decision (derived):** shorter than the source Mediverse min-height of 780 so this band is its own proportion.) |

- H2, `type-h2`, black, centered. Break:  
  `Bring the brief.`  
  `Leave with a standard.`
- Button: `Let’s begin` → `/contact`.

Home order: Header, Claim, Signal, Index, Practice, Record, Ledger, Field, Close.

### 7.8 Mast — `/work`

| | |
|--|--|
| Role | Name the archive. |
| Visual job | A short mast on one baseline. |
| Ground | `#000` |
| Box | Title at `y = 264`. Band ends at `y = 420`. |

One line, `type-display`, white, `x = 120`: `The work.`  
No image, no subcopy, no rail. The display size here is the page H1. Home Claim is a different route, so each URL still has one H1.

### 7.9 Feature — `/work`

| | |
|--|--|
| Role | Read the lead case. |
| Visual job | Static split chapter. |
| Ground | `#fff` |
| Pad | `120px` |

Media `980 × 640` on the left. Gap `120px`. Copy column `580px` on the right, top-aligned (not sticky — §0.4).

- Eyebrow `type-metric` muted: `Lead case`
- Title `type-h3` black: `Case North`
- Summary `type-body` black, margin-top `24px`: two sentences of placeholder.
- Meta row, margin-top `40px`, `type-metric`: `Year` / `Role` / `Field`, values `0000` / `Role` / `Field`.

### 7.10 Catalogue — `/work`

| | |
|--|--|
| Role | Scan everything that is not the lead. |
| Visual job | A list. |
| Ground | `#fff` |
| Pad | `0 120px 120px` |

Hairline above the first row. Row height `72px`. Left: name `type-h4`. Right group: year `type-quote` muted, then discipline `type-metric`, gap `32px`. Rows link to `/work#case-harbor` (and so on). No thumbnails.

| Name | Year | Discipline |
|------|------|------------|
| Case Harbor | 0000 | Identity |
| Case Field | 0000 | Campaign |
| Case Kiln | 0000 | Site |
| Case Relay | 0000 | System |

### 7.11 Statement — `/practice`

| | |
|--|--|
| Role | Define the practice in one sentence. |
| Visual job | A statement at display size, with no rail and no panel. |
| Ground | `#000` |
| Title origin | `y = 264`, `x = 120`, width `1680` |
| Band end | `y = 640` |

H1, `type-display`, white, two lines:

`Four moves.`  
`One standard.`

This is the only place the practice page uses `--type-display`. It does not include `StatRail`.

### 7.12 Columns — `/practice`

| | |
|--|--|
| Role | Show all four offers at the same time. |
| Visual job | A matrix of columns. |
| Ground | `#fff` |
| Pad | `120px` |

Four columns inside `1680px`. Each column width `420px`. A `1px` vertical rule `rgba(0,0,0,0.12)` sits in the center of each `20px` gap (three rules). Column padding-right `40px`.

Each column, top to bottom: number `type-service-num`; name `type-h4` margin-top `16px`; body `type-body` margin-top `24px`, black. Same four placeholder chapters as §7.4. No icons, no chips, no accordion. The home Practice section remains the only spine-and-panel.

### 7.13 Portrait — `/studio`

| | |
|--|--|
| Role | Introduce the studio. |
| Visual job | A photograph that bleeds off the left edge of the stage. |
| Ground | `#000` |
| Height | `960px` |

- Image: `x = 0`, `y = 0`, `1080 × 960`, `object-fit: cover`. It ignores the left gutter on purpose. **Decision (derived from the source content width rule, as a single named exception):** this is the only region allowed to cross the 120px inset, and only on the left.
- Text column: `x = 1200`, width `600px` (right edge lands on the 120px gutter: `1200 + 600 = 1800`, `1920 − 1800 = 120`). Top `264px`.
- H1 `type-h2` white: `The studio.`
- Biography `type-cta` (20px Regular, the source agency-body size), color `--color-text-on-dark-muted`, margin-top `32px`, measure `600px`. Three sentences of placeholder. No stats.

Asset: `public/images/studio/portrait.jpg`.

### 7.14 Form — `/contact`

| | |
|--|--|
| Role | Start a project in writing, and list the other channels. |
| Visual job | A split: underline form left, channels right. |
| Ground | `#fff` |
| Pad | top `264px` to the H1, then `48px` to the split, bottom `120px`, gutter `120` |

- H1 `type-h2` black, left: `Start a project.` The `#session` target is this H1 (`id="session"`).
- Split, margin-top `48px`: form `960px`, gap `80px`, channels `640px`.

Form fields, stacked, gap `32px`: Name, Email, Note. Submit is `Button` `primary`, margin-top `40px`, label “Send”. Validate with Zod: name min 2, email format, note min 10. Success replaces the form with one line `type-body`: `Received. We will reply at the address you wrote.` Error uses `--color-error`.

Channel column, stacked, gap `28px`:

- Email and phone, label `type-metric` muted, value `type-body`.
- Then three social names at `type-h4`: Facebook, LinkedIn, Instagram. Each is a link with an external arrow SVG `20px` (source arrow asset, rotated 45°). `href="#"` until real URLs exist.
- Then the AI chip row (§6.12), margin-top `8px`, wrap allowed inside the `640px` column only. Wrapping chips is internal to the column; it is not a page breakpoint.

---

## 8. Viewport QA matrix

Use this instead of a breakpoint map. There is no `sm` / `md` / `lg` / `xl` layout table.

| Viewport width | Scale | Letterbox each side | Sign-off |
|----------------|-------|---------------------|----------|
| 1366 | 0.7115 | 0 | Required |
| 1440 | 0.75 | 0 | Required |
| 1512 | 0.7875 | 0 | Required |
| 1680 | 0.875 | 0 | Required |
| 1920 | 1 | 0 | Required, pixel check |
| 2560 | 1 | 320px | Required as the “25″ / wider” check: same stage, bars only |
| 1280 | 0.6667 | 0 | Out of range. Confirm it did **not** gain a second layout. Do not polish it. |
| 390 | ~0.203 | 0 | Out of range. Same confirmation. Not a phone design. |

Touch targets in canvas pixels are at least `44 × 44` (source §8.2), including tag chips’ hit area and Record’s text buttons (pad the text buttons to 44px height without changing the type size).

---

## 9. Project structure

```text
wildefy/
├── public/
│   ├── fonts/
│   │   ├── CormorantGaramond-Regular.ttf
│   │   └── DMSans-Variable.ttf
│   └── images/
│       ├── brand/              # header mark, favicon
│       ├── work/
│       ├── studio/
│       └── icons/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # beforeInteractive scale script, Header, StageFrame
│   │   ├── page.tsx            # Home
│   │   ├── work/page.tsx
│   │   ├── practice/page.tsx
│   │   ├── studio/page.tsx
│   │   └── contact/page.tsx
│   ├── components/
│   │   ├── layout/             # StageFrame, Header, Close, Content
│   │   ├── ui/                 # Button, UnderlineField
│   │   └── sections/
│   ├── content/                # placeholder copy and lists
│   ├── styles/
│   │   ├── tokens.css
│   │   └── globals.css         # type utilities
│   └── lib/
└── WILDEFY_WEBSITE_DEVELOPMENT_GUIDE.md
```

---

## 10. Development phases

### Phase 0 — Foundations

- [ ] Next.js + TypeScript + Tailwind v4
- [ ] `tokens.css` and type utilities from **Fonts used**
- [ ] `StageFrame` + `beforeInteractive` scale script (§0.4)
- [ ] `Button` variants
- [ ] Copy `Brand/Fonts/CormorantGaramond-Regular.ttf` and `Brand/Fonts/DMSans-Variable.ttf` into `public/fonts/`
- [ ] Header and Close use `Brand/Wildefy Logo.png`

### Phase 1 — Chrome

- [ ] `Header` fixed to the viewport, scaled with `--stage-scale`
- [ ] `Close`
- [ ] Route shells for Work, Practice, Studio, Contact

### Phase 2 — Home

- [ ] Claim, Signal, Index, Practice, Record, Ledger, Field
- [ ] Overlay test at 1920 against 1440 and 1366 (§15)
- [ ] Letterbox check at 2560

### Phase 3 — Inner pages

- [ ] Work: Mast, Feature, Catalogue
- [ ] Practice: Statement, Columns
- [ ] Studio: Portrait
- [ ] Contact: Form, channels, AI chips
- [ ] Metadata, a11y, performance
- [ ] Replace placeholder copy in `src/content` only

---

## 11. Content model

```ts
type WorkCase = {
  slug: string;
  name: string;
  summary: string;
  cover: string;
  year: string;
  role: string;
  field: string;
  lead?: boolean;
};

type PracticeChapter = {
  number: string; // "01"
  name: string;
  title: string;
  body: string;
  icon: string;
  tags: string[];
};

type RecordQuote = {
  kicker: string;
  quote: string;
  name: string;
  detail: string;
};

type LedgerRow = {
  work: string;
  phrase: string;
  figure: string;
};
```

---

## 12. Interaction

| Interaction | Spec |
|-------------|------|
| Load | Fade Claim H1 and subcopy, `400ms ease`, once |
| Index | Active row swaps media, `150ms` crossfade. Hover does not move the page. |
| Practice spine | Swaps the open panel, `150ms` crossfade. Panel box does not resize. |
| Record | Previous / Next wrap. Crossfade the quote block. |
| Buttons and links | `150ms ease`, once, global |
| Header | Fixed over the scrolling stage. Stays glass. Do not switch it to a solid bar on scroll. |
| Reduced motion | Crossfades and the load fade are off. Swaps are instant. |

---

## 13. Accessibility

- [ ] One `h1` per route (Claim, Mast, Statement, Portrait, Form).
- [ ] Heading order follows the section order. Spine numbers are not headings; the panel title is an `h3`.
- [ ] Meaningful `alt` on Index media, Feature media, and Portrait. Wordmark and quotation mark are `alt=""` / `aria-hidden`.
- [ ] Body text at least 4.5:1. `--color-text-muted` (`#686868`) on white passes. On `#000` it sits near the edge; keep it on labels only (Claim labels, Close labels), never on long paragraphs. Long dark-ground copy uses `--color-text-on-dark-muted` or white.
- [ ] Keyboard: header links, both header buttons, Index rail, Practice spine, Record controls, Catalogue links, form, AI chips.
- [ ] Focus ring uses `--color-focus` (§6.2).
- [ ] Icon-only controls, if any are added later, need `aria-label`. Record’s Previous / Next already have visible names.
- [ ] Landmarks: `banner` (header), `main`, `contentinfo` (Close), `nav`.
- [ ] Index rail is a `tablist` or a listbox with a single active option. Practice spine matches that pattern. Do not rely on hover alone.
- [ ] Form errors are tied to inputs with `aria-describedby`.

---

## 14. SEO and performance

| Topic | Standard |
|-------|----------|
| Titles | `Page — Wildefy` (**Decision (derived from source §14 title pattern).**) |
| Description | Unique per route, about 150–160 characters, written with the real copy |
| Images | `next/image`, WebP or AVIF, explicit width and height matching §7 |
| LCP | Claim H1 on `/`. Feature image on `/work`. Portrait on `/studio`. |
| Fonts | `font-display: swap`. Self-host Cormorant Garamond and DM Sans from `Brand/Fonts/`. |
| CLS | Head script sets `--stage-scale` before paint. `useLayoutEffect` sets frame height before paint. No late type-size changes. |
| Scale | The stage scale is a paint transform. It is not a font-size change, so it does not reflow text. |

---

## 15. Visual QA

For every section:

1. At **1920**, check gutter `120`, the type token for that role, button height `59`, and accent `#F9A01F`.
2. At **1680, 1512, 1440, 1366**, screenshot the same section. Scale the 1920 screenshot by `viewport/1920` and overlay. Composition, line breaks, and density match. A restack is a failure.
3. At **2560**, confirm the 1920 stage is centered, side bars are `#000` (or the section’s own full-bleed color only inside the stage — letterbox ground is `#000`), and nothing has grown past canvas size.
4. At **1280** and **390**, confirm the same stage is still in use. Do not file design bugs about “too small” there.
5. Done when 1920 spacing is within ±4px of this guide and the 1440 overlay matches.

**Tolerances**

- Spacing at 1920: ±4px
- Type at 1920: the exact `--type-*` pixel
- 1366–1920: one scale factor, zero layout differences
- Above 1920: scale 1, letterbox only
- Color: flat `#F9A01F` for accent, `#000000` for ground, `#FFFFFF` for type on black. Black type on the accent.

**Acceptance**

> Someone looking at a section on a 25″ display and someone looking at it on a 15″ or 24″ display are looking at the same section. Between 15″ and 24″ the layout, type scale, spacing, and composition do not change. Only a uniform scale, or side letterbox above 1920 CSS pixels, may differ.

---

## 16. Definition of done (per page)

- [ ] Section order matches §7 for that route
- [ ] Every measurement is a canvas token or a number in §7
- [ ] No `clamp()` sizing and no breakpoint utilities on layout or type
- [ ] `StageFrame` scale and letterbox behave as §0.3
- [ ] Header and Close are the shared chrome
- [ ] Each section on the page occupies a different row of §7.0
- [ ] Images have reserved aspect ratios
- [ ] A11y §13 and title pattern §14
- [ ] Overlay QA signed off at 1920, 1440, and 1366, plus a 2560 letterbox check

---

## 17. Do / don’t

| Do | Don’t |
|----|-------|
| Design on a 1920 stage and scale that stage as one piece | Use `clamp()`, `vw` type, or `md:` / `2xl:` to resize type or spacing |
| Center the stage and letterbox above 1920 | Let the layout grow on a 25″ screen |
| Keep 1366 and 1920 as the same composition | Add a laptop layout, a stacked layout, or a denser layout inside the band |
| Treat below 1366 as out of range, same stage | Design a phone version or a hamburger header |
| Put header chrome outside `.stage` and share `--stage-scale` | Use `position: fixed` or `sticky` inside the transformed stage |
| Set frame height to `unscaled × scale` | Leave a blank gap under a scaled stage |
| Use `clientWidth` for the scale | Use `100vw` or `window.innerWidth` |
| Reuse `Button`, `Content`, and type utilities | One-off font sizes in components |
| Keep each section’s layout unique (§7.0) | Repeat the card grid, the service row, or the quote-and-portrait |
| Self-host Cormorant Garamond and DM Sans from `Brand/Fonts/` | Load Power Grotesk, Poppins, or a font from a remote stylesheet |
| Keep Wildefy copy free of Theories contact facts | Copy Theories email, phone, address, clients, or Mediverse into Wildefy |
| Change fonts only in **Fonts used** | Scatter new `font-family` declarations through sections |

---

## 18. Change log

| Date | Change |
|------|--------|
| 2026-10-13 | Initial Wildefy website guide. Canvas, color, type sizes, radii, and component metrics carried forward. Per-token fluid clamps and layout breakpoints replaced with one fixed 1920 stage for the 15″–24″ band. |
| 2026-10-13 | Titles H1–H6 set to Cormorant Garamond Regular. Descriptions set to DM Sans Regular. Accent set to logo claw `#F9A01F`. Orange gradient `#FE4A01` → `#FEBA07` removed. |

---

*When a Wildefy Figma file or a real contact line arrives, update this guide before changing components. Engineering and design stay on the same canvas.*
