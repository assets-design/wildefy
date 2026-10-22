const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

/**
 * Continuous cloud PNG with matching fluffy top + bottom.
 * Source is lit on black — un-premultiply so edges are soft WHITE mist,
 * not a dark jagged fringe against green.
 */
const src =
  "C:/Users/chavv/.cursor/projects/c-Personal-files-Code-Projects1-Wildefy/assets/cloud-both-edges.jpg";
const out = path.join(__dirname, "../public/images/clouds-section.png");

const W = 1600;
const H = 2800;
const BLEED = 20;

(async () => {
  if (!fs.existsSync(src)) throw new Error("Missing cloud-both-edges.jpg");

  const { data } = await sharp(src)
    .resize(W, H, { fit: "fill", kernel: "lanczos3" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const r0 = data[i];
      const g0 = data[i + 1];
      const b0 = data[i + 2];
      // Luma as coverage against black (premultiplied-style source).
      const lum = r0 * 0.299 + g0 * 0.587 + b0 * 0.114;

      if (lum < 6) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 0;
        continue;
      }

      // Alpha from luminance — soft wisps stay translucent.
      let a = Math.min(255, Math.round(255 * Math.pow(lum / 255, 0.92)));

      // Un-premultiply vs black → recover bright cloud color, kill dark fringe.
      const inv = 255 / Math.max(lum, 1);
      let r = Math.min(255, Math.round(r0 * inv));
      let g = Math.min(255, Math.round(g0 * inv));
      let b = Math.min(255, Math.round(b0 * inv));

      // Soft white bias on thin edges; keep mid shade for volume.
      const edge = a < 200;
      if (edge) {
        const t = 0.55;
        r = Math.round(r + (255 - r) * t);
        g = Math.round(g + (255 - g) * t);
        b = Math.round(b + (255 - b) * (t * 0.9));
      } else {
        const lift = 0.12;
        r = Math.min(255, Math.round(r + (255 - r) * lift));
        g = Math.min(255, Math.round(g + (255 - g) * (lift * 0.9)));
        b = Math.min(255, Math.round(b + (255 - b) * (lift * 0.75)));
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }

  let top = H;
  let bottom = 0;
  let left = W;
  let right = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > 8) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }

  const cropLeft = Math.max(0, left - BLEED);
  const cropTop = Math.max(0, top - BLEED);
  const cropRight = Math.min(W - 1, right + BLEED);
  const cropBottom = Math.min(H - 1, bottom + BLEED);
  const cw = cropRight - cropLeft + 1;
  const ch = cropBottom - cropTop + 1;

  const cropped = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const si = ((cropTop + y) * W + (cropLeft + x)) * 4;
      const di = (y * cw + x) * 4;
      cropped[di] = data[si];
      cropped[di + 1] = data[si + 1];
      cropped[di + 2] = data[si + 2];
      cropped[di + 3] = data[si + 3];
    }
  }

  const OUT_W = 1600;
  const OUT_H = 2600;
  await sharp(cropped, { raw: { width: cw, height: ch, channels: 4 } })
    .resize(OUT_W, OUT_H, { fit: "fill", kernel: "lanczos3" })
    .png({ compressionLevel: 9 })
    .toFile(out);

  console.log(`OK soft white lips (no dark fringe) ${OUT_W}x${OUT_H}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
