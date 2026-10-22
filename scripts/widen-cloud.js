const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const candidates = [
  "C:/Users/chavv/.cursor/projects/c-Personal-files-Code-Projects1-Wildefy/assets/clouds-black-bg.jpg",
  "C:/Users/chavv/.cursor/projects/c-Personal-files-Code-Projects1-Wildefy/assets/clouds-no-bg.jpg",
];
const src = candidates.find((p) => fs.existsSync(p));
if (!src) {
  console.error("No cloud source found");
  process.exit(1);
}

const outPng = path.join(__dirname, "../public/images/clouds-no-bg.png");

(async () => {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: w, height: h, channels: ch } = info;
  const alpha = Buffer.alloc(w * h);

  for (let i = 0, p = 0; i < data.length; i += ch, p++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = (r + g + b) / 3;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);

    let a = 255;
    // Aggressive black key — kills gray matte fringe
    if (lum < 70 || (sat < 24 && lum < 150)) a = 0;
    else if (lum < 165) a = Math.round(255 * Math.pow((lum - 70) / 95, 1.6));

    alpha[p] = a;

    if (a > 0) {
      data[i] = Math.min(255, Math.round(r + (255 - r) * 0.12));
      data[i + 1] = Math.min(255, Math.round(g + (255 - g) * 0.12));
      data[i + 2] = Math.min(255, Math.round(b + (255 - b) * 0.12));
    }
    data[i + 3] = a;
  }

  // Soften alpha: slight blur then pull mid values down (erode fringe)
  const softAlpha = await sharp(alpha, {
    raw: { width: w, height: h, channels: 1 },
  })
    .blur(1.15)
    .raw()
    .toBuffer();

  for (let i = 0, p = 0; i < data.length; i += ch, p++) {
    let a = softAlpha[p];
    // Extra erode on semi-transparent fringe
    if (a < 210) a = Math.round(a * 0.72);
    if (a < 28) a = 0;
    data[i + 3] = a;
  }

  const widerW = Math.round(w * 1.55);
  const tallerH = Math.round(h * 0.82);

  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .resize(widerW, tallerH, { fit: "fill", kernel: "lanczos3" })
    .png({ compressionLevel: 9 })
    .toFile(outPng);

  const check = await sharp(outPng)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const cw = check.info.width;
  const chh = check.info.height;
  const cornerA = [
    [0, 0],
    [cw - 1, 0],
    [0, chh - 1],
    [cw - 1, chh - 1],
  ].map(([x, y]) => check.data[(y * cw + x) * 4 + 3]);

  const meta = await sharp(outPng).metadata();
  console.log(
    `src=${path.basename(src)} PNG ${meta.width}x${meta.height} cornerA=[${cornerA.join(",")}]`,
  );
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
