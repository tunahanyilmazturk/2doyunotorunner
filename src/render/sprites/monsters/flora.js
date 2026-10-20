import { darken, lighten } from '../../../utils/color.js';
import { ellipse, eyes } from './parts.js';

// Kökleri ayak, geniş yaprakları kol, tomurcuğu baş olan orman yaratığı.
export function flora(ctx, s, c, t, features, m) {
  const has = (f) => features.includes(f);
  const sway = m.state === 'approach' ? Math.sin(t * 7) * s * 0.035 : Math.sin(t * 2) * s * 0.02;
  const baseY = -s * 0.08;

  // Kök bacaklar ve parmak kökleri
  ctx.strokeStyle = c.dark;
  ctx.lineWidth = s * 0.11;
  for (const side of [-1, 1]) {
    const x = side * s * 0.16;
    ctx.beginPath();
    ctx.moveTo(x, baseY - s * 0.05);
    ctx.lineTo(x + sway * side, -s * 0.02);
    ctx.lineTo(x + side * s * 0.15, 0);
    ctx.moveTo(x + side * s * 0.07, -s * 0.01);
    ctx.lineTo(x + side * s * 0.19, -s * 0.04);
    ctx.stroke();
  }

  // Gövde: damla biçimli odun ve kabuk çizgileri
  ctx.fillStyle = c.dark;
  ctx.beginPath();
  ctx.moveTo(-s * 0.25, baseY);
  ctx.lineTo(-s * 0.21, -s * 0.52);
  ctx.quadraticCurveTo(0, -s * 0.67, s * 0.21, -s * 0.5);
  ctx.lineTo(s * 0.26, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c.body;
  ctx.beginPath();
  ctx.moveTo(-s * 0.19, baseY - s * 0.02);
  ctx.lineTo(-s * 0.16, -s * 0.49);
  ctx.quadraticCurveTo(0, -s * 0.6, s * 0.15, -s * 0.47);
  ctx.lineTo(s * 0.2, baseY - s * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = darken(c.body, 0.25);
  for (const x of [-0.1, 0.02, 0.12]) ctx.fillRect(s * x, -s * 0.42, s * 0.035, s * 0.28);
  ctx.fillStyle = lighten(c.body, 0.22);
  ctx.fillRect(-s * 0.13, -s * 0.48, s * 0.08, s * 0.13);

  // Yaprak kollar ve diken uçları
  for (const side of [-1, 1]) {
    const ax = side * (s * 0.2 + sway * side);
    ctx.fillStyle = darken(c.body, 0.12);
    ctx.beginPath();
    ctx.moveTo(side * s * 0.13, -s * 0.38);
    ctx.lineTo(ax, -s * 0.42);
    ctx.lineTo(ax + side * s * 0.25, -s * 0.56);
    ctx.lineTo(ax + side * s * 0.2, -s * 0.35);
    ctx.lineTo(side * s * 0.15, -s * 0.22);
    ctx.fill();
    if (has('thorns')) {
      ctx.fillStyle = lighten(c.body, 0.34);
      ctx.beginPath();
      ctx.moveTo(ax - s * 0.04, -s * 0.37);
      ctx.lineTo(ax + side * s * 0.11, -s * 0.48);
      ctx.lineTo(ax + side * s * 0.04, -s * 0.3);
      ctx.fill();
    }
  }

  // Baş tomurcuğu ve canlı gözler
  ellipse(ctx, 0, -s * 0.53, s * 0.2, s * 0.17, darken(c.dark, 0.06));
  ellipse(ctx, -s * 0.025, -s * 0.56, s * 0.15, s * 0.12, c.body);
  eyes(ctx, -s * 0.07, -s * 0.55, s * 0.035, c.eye, s * 0.11);
  if (has('bud')) {
    const open = m.attackAnim > 0.1;
    ctx.fillStyle = '#d85c82';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * s * 0.07, -s * 0.72, s * 0.07, s * 0.13, side * -0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f2c14e';
    ellipse(ctx, 0, -s * (open ? 0.66 : 0.7), s * 0.055, s * 0.055, '#f2c14e');
  }
}
