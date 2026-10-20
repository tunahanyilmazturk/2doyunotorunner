import { darken, lighten } from '../../../utils/color.js';
import { ellipse, eyes } from './parts.js';

// Zırhlı kınkanatlılar. Kabuk, boynuz ve çeneler silueti diğer kara
// yaratıklarından ayırır; crystal özelliği sırtına parlak kristal plakalar ekler.
export function beetle(ctx, s, c, t, features, m) {
  const has = (f) => features.includes(f);
  const walk = m.state === 'approach';
  const bob = walk ? Math.sin(t * 12) * s * 0.025 : 0;
  const bodyY = -s * 0.3 + bob;

  // Altı eklemli bacak ve küçük pençeler
  for (let i = 0; i < 3; i++) {
    const y = bodyY + (i - 1) * s * 0.09;
    const swing = walk ? Math.sin(t * 13 + i * 2) * s * 0.045 : 0;
    for (const side of [-1, 1]) {
      const x = side * s * (0.2 + i * 0.035);
      ctx.strokeStyle = i === 1 ? c.dark : darken(c.dark, 0.18);
      ctx.lineWidth = Math.max(2, s * 0.055);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + side * s * 0.14, y + s * 0.04 + swing);
      ctx.lineTo(x + side * s * 0.23, -s * 0.015 + swing);
      ctx.stroke();
    }
  }

  // Karın ve ışık alan segmentler
  ellipse(ctx, 0, bodyY + s * 0.02, s * 0.39, s * 0.2, darken(c.body, 0.28));
  for (let i = 0; i < 3; i++) {
    const x = -s * 0.2 + i * s * 0.2;
    ctx.fillStyle = darken(c.body, 0.16);
    ctx.fillRect(x, bodyY + s * 0.08, s * 0.13, s * 0.06);
  }

  // Kubbe kabuk: kalın dış hat, iki parlak kanat kapağı ve orta dikiş
  ellipse(ctx, 0, bodyY - s * 0.08, s * 0.4, s * 0.29, darken(c.dark, 0.15));
  ellipse(ctx, 0, bodyY - s * 0.1, s * 0.35, s * 0.25, c.body);
  ellipse(ctx, -s * 0.11, bodyY - s * 0.2, s * 0.19, s * 0.09, lighten(c.body, 0.24));
  ctx.strokeStyle = darken(c.body, 0.32);
  ctx.lineWidth = Math.max(1, s * 0.025);
  ctx.beginPath();
  ctx.moveTo(0, bodyY - s * 0.32);
  ctx.lineTo(0, bodyY + s * 0.1);
  ctx.stroke();

  if (has('crystal')) {
    for (const [x, h] of [[-0.2, 0.2], [0.02, 0.3], [0.22, 0.18]]) {
      ctx.fillStyle = lighten(c.body, 0.48);
      ctx.beginPath();
      ctx.moveTo(s * x - s * 0.07, bodyY - s * 0.23);
      ctx.lineTo(s * x, bodyY - s * (0.23 + h));
      ctx.lineTo(s * x + s * 0.07, bodyY - s * 0.2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.48)';
      ctx.fillRect(s * x - s * 0.012, bodyY - s * (0.22 + h * 0.72), s * 0.025, s * h * 0.48);
    }
  }

  // Kafa, çeneler ve hareket eden boynuz
  const hx = -s * 0.36;
  ellipse(ctx, hx, bodyY - s * 0.02, s * 0.17, s * 0.15, darken(c.body, 0.08));
  ellipse(ctx, hx - s * 0.08, bodyY - s * 0.11, s * 0.09, s * 0.045, lighten(c.body, 0.18));
  eyes(ctx, hx - s * 0.06, bodyY - s * 0.06, s * 0.035, c.eye);
  ctx.strokeStyle = c.dark;
  ctx.lineWidth = Math.max(1.5, s * 0.045);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(hx - s * 0.04, bodyY + s * 0.06);
    ctx.lineTo(hx - s * 0.13, bodyY + s * 0.13 + side * s * 0.015);
    ctx.stroke();
  }
  if (has('horn')) {
    const jab = m.attackAnim > 0 ? Math.sin(m.attackAnim * Math.PI) * s * 0.08 : 0;
    ctx.fillStyle = lighten(c.body, 0.28);
    ctx.beginPath();
    ctx.moveTo(hx - s * 0.02, bodyY - s * 0.13);
    ctx.lineTo(hx - s * 0.13 - jab, bodyY - s * 0.34);
    ctx.lineTo(hx + s * 0.07, bodyY - s * 0.2);
    ctx.fill();
  }
}
