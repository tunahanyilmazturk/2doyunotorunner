import { darken, lighten } from '../../utils/color.js';

// Biyom süslemeleri: (ctx, x, zeminY, ölçek, biyom, zaman)

function tree(ctx, x, y, s, biome) {
  // Gövde: gölge tarafı + kök
  ctx.fillStyle = '#4a2f1a';
  ctx.fillRect(x - 5 * s, y - 52 * s, 10 * s, 52 * s);
  ctx.fillStyle = '#362113';
  ctx.fillRect(x - 5 * s, y - 52 * s, 3 * s, 52 * s);
  ctx.fillRect(x - 9 * s, y - 4 * s, 18 * s, 4 * s);
  // Taç: koyu → orta → ışık
  const blobs = [[0, -72, 30], [-22, -54, 22], [22, -56, 22], [-8, -88, 18], [12, -84, 18]];
  ctx.fillStyle = darken(biome.near, 0.25);
  for (const [dx, dy, r] of blobs) {
    ctx.beginPath();
    ctx.arc(x + dx * s, y + (dy + 3) * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = biome.near;
  for (const [dx, dy, r] of blobs) {
    ctx.beginPath();
    ctx.arc(x + dx * s, y + dy * s, r * s * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = lighten(biome.near, 0.18);
  for (const [dx, dy, r] of blobs.slice(0, 3)) {
    ctx.beginPath();
    ctx.arc(x + (dx - r * 0.25) * s, y + (dy - r * 0.3) * s, r * s * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

function cactus(ctx, x, y, s, biome) {
  ctx.fillStyle = '#4f8a3a';
  const w = 12 * s;
  ctx.fillRect(x - w / 2, y - 70 * s, w, 70 * s);
  ctx.fillRect(x - 24 * s, y - 45 * s, 8 * s, 22 * s);
  ctx.fillRect(x - 24 * s, y - 27 * s, 18 * s, 7 * s);
  ctx.fillRect(x + 14 * s, y - 55 * s, 8 * s, 26 * s);
  ctx.fillRect(x + 4 * s, y - 33 * s, 18 * s, 7 * s);
  ctx.fillStyle = '#3c6e2c';
  ctx.fillRect(x - 1 * s, y - 68 * s, 2 * s, 66 * s);
  ctx.fillStyle = biome.near;
  ctx.beginPath();
  ctx.ellipse(x + 40 * s, y, 22 * s, 9 * s, 0, Math.PI, 0);
  ctx.fill();
}

function crystal(ctx, x, y, s, biome, t) {
  ctx.fillStyle = biome.near;
  ctx.beginPath();
  ctx.moveTo(x - 30 * s, y);
  ctx.lineTo(x - 18 * s, y - 40 * s);
  ctx.lineTo(x + 10 * s, y - 55 * s);
  ctx.lineTo(x + 32 * s, y);
  ctx.fill();
  const glow = 0.5 + Math.sin(t * 2) * 0.2;
  ctx.save();
  ctx.shadowColor = '#7ef0ff';
  ctx.shadowBlur = 14;
  ctx.fillStyle = `rgba(110,230,255,${glow})`;
  const shards = [[-8, 30, -0.2], [4, 44, 0.1], [16, 26, 0.35]];
  for (const [dx, h, a] of shards) {
    ctx.save();
    ctx.translate(x + dx * s, y - 10 * s);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(-5 * s, 0);
    ctx.lineTo(0, -h * s);
    ctx.lineTo(5 * s, 0);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function pine(ctx, x, y, s, biome) {
  ctx.fillStyle = '#4a3020';
  ctx.fillRect(x - 4 * s, y - 20 * s, 8 * s, 20 * s);
  for (let i = 0; i < 3; i++) {
    const ty = y - 20 * s - i * 22 * s;
    const w = (34 - i * 8) * s;
    ctx.fillStyle = '#2f5a4a';
    ctx.beginPath();
    ctx.moveTo(x - w, ty);
    ctx.lineTo(x, ty - 36 * s);
    ctx.lineTo(x + w, ty);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.45, ty - 20 * s);
    ctx.lineTo(x, ty - 36 * s);
    ctx.lineTo(x + w * 0.45, ty - 20 * s);
    ctx.fill();
  }
}

function rock(ctx, x, y, s, biome, t) {
  ctx.fillStyle = biome.near;
  ctx.beginPath();
  ctx.moveTo(x - 36 * s, y);
  ctx.lineTo(x - 26 * s, y - 34 * s);
  ctx.lineTo(x - 4 * s, y - 48 * s);
  ctx.lineTo(x + 20 * s, y - 30 * s);
  ctx.lineTo(x + 36 * s, y);
  ctx.fill();
  ctx.save();
  ctx.strokeStyle = `rgba(255,110,30,${0.6 + Math.sin(t * 3) * 0.3})`;
  ctx.shadowColor = '#ff6a1f';
  ctx.shadowBlur = 10;
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(x - 20 * s, y - 6 * s);
  ctx.lineTo(x - 8 * s, y - 24 * s);
  ctx.lineTo(x + 2 * s, y - 16 * s);
  ctx.lineTo(x + 12 * s, y - 30 * s);
  ctx.stroke();
  ctx.restore();
}

export const DECOR_DRAWERS = { tree, cactus, crystal, pine, rock };
