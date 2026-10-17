import { darken, lighten } from '../../../utils/color.js';
import { crown, eyes, teeth } from './parts.js';

// İki ayaklılar: goblin, iskelet, mumya, yeti, golem, ent, trol, firavun, lich...
// Özellikler (features):
//   ears, tusks, fur, bulky, block (köşeli kafa), cracks (parlayan çatlaklar),
//   bones, wraps, bark, leaves, crystal, crown, club / sword / staff (silah)

export function humanoid(ctx, s, c, t, features, m) {
  const has = (f) => features.includes(f);
  const walking = m.state === 'approach';
  const swing = walking ? Math.sin(t * 9) * 0.5 : 0.1;
  const bulky = has('fur') || has('block') || has('bulky') || has('bark');
  const bw = s * (bulky ? 0.5 : 0.36);
  const legH = s * 0.3;
  const torsoH = s * 0.38;
  const headR = s * 0.15;
  const top = -legH - torsoH;
  const cloth = c.cloth ?? c.body;

  // ---- Bacaklar (arka koyu, ön normal) ----
  [[-bw * 0.22, swing, darken(c.dark, 0.25)], [bw * 0.22, -swing, c.dark]].forEach(([dx, a, col]) => {
    ctx.save();
    ctx.translate(dx, -legH);
    ctx.rotate(a);
    ctx.fillStyle = col;
    ctx.fillRect(-s * 0.065, 0, s * 0.13, legH);
    ctx.fillStyle = darken(col, 0.3);
    ctx.fillRect(-s * 0.08, legH - s * 0.05, s * 0.17, s * 0.05);
    ctx.restore();
  });

  // ---- Arka kol ----
  ctx.save();
  ctx.translate(bw * 0.4, top + torsoH * 0.15);
  ctx.rotate(walking ? -swing * 0.8 : 0.2);
  ctx.fillStyle = darken(c.body, 0.25);
  ctx.fillRect(-s * 0.05, 0, s * 0.1, torsoH * 0.85);
  ctx.restore();

  // ---- Gövde: ana + gölge tarafı + ışık ----
  ctx.fillStyle = cloth;
  ctx.fillRect(-bw / 2, top, bw, torsoH);
  ctx.fillStyle = darken(cloth, 0.2);
  ctx.fillRect(bw * 0.2, top, bw * 0.3, torsoH);
  ctx.fillStyle = lighten(cloth, 0.15);
  ctx.fillRect(-bw / 2, top, bw * 0.25, torsoH * 0.5);

  if (has('fur')) {
    ctx.fillStyle = lighten(c.body, 0.1);
    for (let i = 0; i < 5; i++) ctx.fillRect(-bw / 2 + i * bw * 0.2, top + torsoH - s * 0.04, bw * 0.12, s * 0.07);
    ctx.fillRect(-bw * 0.55, top - s * 0.02, bw * 1.1, s * 0.07);
  }
  if (has('bones')) {
    ctx.fillStyle = c.body;
    for (let i = 0; i < 3; i++) ctx.fillRect(-bw * 0.35, top + s * 0.06 + i * s * 0.09, bw * 0.7, s * 0.04);
    ctx.fillRect(-s * 0.02, top, s * 0.04, torsoH);
  }
  if (has('wraps')) {
    ctx.fillStyle = c.dark;
    for (let i = 0; i < 4; i++) ctx.fillRect(-bw / 2, top + s * 0.03 + i * torsoH * 0.26, bw, s * 0.025);
  }
  if (has('bark')) {
    ctx.fillStyle = darken(cloth, 0.3);
    for (let i = 0; i < 4; i++) ctx.fillRect(-bw * 0.4 + i * bw * 0.25, top + s * 0.03, s * 0.025, torsoH * 0.85);
  }
  if (has('cracks')) {
    ctx.fillStyle = c.cloth;
    ctx.fillRect(-bw * 0.3, top + torsoH * 0.2, s * 0.03, torsoH * 0.3);
    ctx.fillRect(-bw * 0.3, top + torsoH * 0.5, bw * 0.3, s * 0.03);
    ctx.fillRect(bw * 0.05, top + torsoH * 0.5, s * 0.03, torsoH * 0.35);
  }
  if (has('crystal')) {
    ctx.fillStyle = lighten(c.body, 0.4);
    for (const [dx, h] of [[-0.45, 0.22], [-0.25, 0.3], [0.3, 0.26]]) {
      ctx.beginPath();
      ctx.moveTo(bw * dx - s * 0.05, top + 2);
      ctx.lineTo(bw * dx, top - s * h);
      ctx.lineTo(bw * dx + s * 0.05, top + 2);
      ctx.fill();
    }
  }

  // ---- Kafa ----
  const headY = top - headR * 0.9;
  if (has('block')) {
    ctx.fillStyle = c.body;
    ctx.fillRect(-headR * 1.1, headY - headR, headR * 2.2, headR * 2);
    ctx.fillStyle = darken(c.body, 0.2);
    ctx.fillRect(headR * 0.3, headY - headR, headR * 0.8, headR * 2);
  } else {
    ctx.fillStyle = c.body;
    ctx.beginPath();
    ctx.arc(0, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = darken(c.body, 0.18);
    ctx.beginPath();
    ctx.arc(headR * 0.25, headY + headR * 0.1, headR * 0.8, -0.6, 1.6);
    ctx.fill();
  }
  if (has('ears')) {
    ctx.fillStyle = c.body;
    ctx.beginPath();
    ctx.moveTo(-headR * 0.6, headY - headR * 0.5);
    ctx.lineTo(-headR * 2.1, headY - headR * 1.2);
    ctx.lineTo(-headR * 0.4, headY + headR * 0.2);
    ctx.moveTo(headR * 0.6, headY - headR * 0.5);
    ctx.lineTo(headR * 2.1, headY - headR * 1.2);
    ctx.lineTo(headR * 0.4, headY + headR * 0.2);
    ctx.fill();
  }
  if (has('leaves')) {
    const sway = Math.sin(t * 2) * 2;
    ctx.fillStyle = '#4e8a3a';
    ctx.beginPath();
    ctx.arc(-headR * 0.3 + sway, headY - headR * 1.1, headR * 1.1, 0, Math.PI * 2);
    ctx.arc(headR * 0.8 + sway, headY - headR * 0.7, headR * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6cb04a';
    ctx.beginPath();
    ctx.arc(-headR * 0.6 + sway, headY - headR * 1.4, headR * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  eyes(ctx, -headR * 0.6, headY - 1, s * 0.035, c.eye, headR * 0.65);
  if (has('tusks')) {
    ctx.fillStyle = '#f4f0e6';
    ctx.fillRect(-headR * 0.75, headY + headR * 0.35, s * 0.03, s * 0.06);
    ctx.fillRect(-headR * 0.05, headY + headR * 0.35, s * 0.03, s * 0.06);
  }
  if (has('bones')) teeth(ctx, -headR * 0.8, headY + headR * 0.45, headR * 1.1, 3, s * 0.03);

  // ---- Ön (silah) kolu ----
  const armA = m.attackAnim > 0 ? -1.6 + (1 - m.attackAnim) * 2.2 : -0.4 + Math.sin(t * 4) * 0.1;
  ctx.save();
  ctx.translate(-bw * 0.45, top + torsoH * 0.15);
  ctx.rotate(Math.PI + armA);
  ctx.fillStyle = c.body;
  ctx.fillRect(0, -s * 0.045, s * 0.24, s * 0.09);
  if (has('club')) {
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(s * 0.18, -s * 0.05, s * 0.32, s * 0.1);
    ctx.fillStyle = '#7d5230';
    ctx.fillRect(s * 0.4, -s * 0.1, s * 0.16, s * 0.2);
    ctx.fillStyle = '#c8c0b0';
    ctx.fillRect(s * 0.5, -s * 0.12, s * 0.03, s * 0.04);
  } else if (has('sword')) {
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(s * 0.18, -s * 0.07, s * 0.04, s * 0.14);
    ctx.fillStyle = '#b8bec8';
    ctx.fillRect(s * 0.22, -s * 0.03, s * 0.42, s * 0.06);
  } else if (has('staff')) {
    ctx.fillStyle = '#4a2f1a';
    ctx.fillRect(s * 0.1, -s * 0.025, s * 0.7, s * 0.05);
    ctx.fillStyle = c.eye;
    ctx.fillRect(s * 0.76, -s * 0.08, s * 0.14, s * 0.16);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(s * 0.78, -s * 0.06, s * 0.04, s * 0.04);
  } else if (has('bark')) {
    // Dal kollar
    ctx.fillStyle = darken(cloth, 0.1);
    ctx.fillRect(s * 0.2, -s * 0.04, s * 0.2, s * 0.08);
    ctx.fillRect(s * 0.36, -s * 0.1, s * 0.05, s * 0.08);
  }
  ctx.restore();

  if (has('crown')) crown(ctx, 0, headY - headR - (has('leaves') ? headR : 2), headR * 1.8);
}
