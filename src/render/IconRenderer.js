import { ICONS, iconRuns } from '../ui/icons.js';

const images = new Map();
function imageFor(file) {
  if (!images.has(file)) {
    const img = new Image();
    img.src = `/assets/icons/${file}`;
    images.set(file, img);
  }
  return images.get(file);
}

export function drawIcon(ctx, key, x, y, size) {
  const a = ICONS[key];
  if (!a) return;
  const img = imageFor(a.file);
  if (!img.complete || !img.naturalWidth) return;
  const [left, top, w, h] = a.rect;
  const scale = size * .9 / Math.max(w, h);
  const smoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, left, top, w, h, x + (size - w * scale) / 2, y + (size - h * scale) / 2, w * scale, h * scale);
  ctx.imageSmoothingEnabled = smoothing;
}

export function measureIconText(ctx, text, size) {
  return iconRuns(text).reduce((w, run) => w + (run.key ? size + 3 : ctx.measureText(run.text).width), 0);
}

// Same atlas artwork in combat labels, floating rewards and achievement banners.
export function drawIconText(ctx, text, x, y, size) {
  const runs = iconRuns(text);
  const width = measureIconText(ctx, text, size);
  const align = ctx.textAlign;
  let cursor = x - (align === 'center' ? width / 2 : align === 'right' || align === 'end' ? width : 0);
  ctx.textAlign = 'left';
  for (const run of runs) {
    if (run.key) {
      drawIcon(ctx, run.key, cursor, y - size * (ctx.textBaseline === 'middle' ? .5 : .85), size);
      cursor += size + 3;
    } else {
      ctx.strokeText(run.text, cursor, y);
      ctx.fillText(run.text, cursor, y);
      cursor += ctx.measureText(run.text).width;
    }
  }
  ctx.textAlign = align;
}
