const sharp = require('sharp');

async function cleanBg() {
  const inPath = 'C:/Users/nssbh/.gemini/antigravity/scratch/portfolio-3d/public/img/analytics-dark-3d.png';
  const outPath = 'C:/Users/nssbh/.gemini/antigravity/scratch/portfolio-3d/public/img/analytics-dark-3d-clean.png';

  const { data, info } = await sharp(inPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const getIdx = (x, y) => (y * width + x) * 4;

  // 1. Inpaint top-left badge (x: 10..245, y: 10..75)
  // Sample adjacent gradient from x: 260..300, y: 10..75
  for (let y = 10; y <= 75; y++) {
    for (let x = 10; x <= 245; x++) {
      const srcX = Math.min(width - 1, 260 + (x % 40));
      const srcIdx = getIdx(srcX, y);
      const dstIdx = getIdx(x, y);

      data[dstIdx] = data[srcIdx];
      data[dstIdx + 1] = data[srcIdx + 1];
      data[dstIdx + 2] = data[srcIdx + 2];
      data[dstIdx + 3] = 255;
    }
  }

  // 2. Inpaint bottom-right button (x: 915..990, y: 495..565)
  // Sample adjacent dark gradient from x: 860..905, y: 495..565
  for (let y = 495; y <= 565; y++) {
    for (let x = 915; x <= 990; x++) {
      const srcX = 860 + (x - 915);
      const srcIdx = getIdx(srcX, y);
      const dstIdx = getIdx(x, y);

      data[dstIdx] = data[srcIdx];
      data[dstIdx + 1] = data[srcIdx + 1];
      data[dstIdx + 2] = data[srcIdx + 2];
      data[dstIdx + 3] = 255;
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outPath);

  console.log('Cleaned image saved to', outPath);
}

cleanBg().catch(console.error);
