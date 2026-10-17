import { darken, lighten } from '../../../utils/color.js';
import { crown, ellipse, eyes } from './parts.js';

// Yumuşak gövdeli canavarlar: balçık, mantar, hayalet.

export function slime(ctx, s, c, t, features) {
  const sq = Math.sin(t * 6) * 0.08;
  const w = s * 0.6 * (1 + sq);
  const h = s * 0.42 * (1 - sq);
  // Gövde: koyu taban + ana renk + üst ışık
  ellipse(ctx, 0, -h, w, h, c.dark);
  ellipse(ctx, 0, -h - 2, w * 0.92, h * 0.9, c.body);
  ellipse(ctx, w * 0.1, -h * 1.15, w * 0.6, h * 0.45, lighten(c.body, 0.15));
  // İçindeki kabarcıklar
  ctx.fillStyle = lighten(c.body, 0.35);
  ctx.fillRect(w * 0.3, -h * 0.8, s * 0.06, s * 0.06);
  ctx.fillRect(w * 0.45, -h * 1.1, s * 0.04, s * 0.04);
  // Parlama
  ellipse(ctx, -w * 0.35, -h * 1.45, w * 0.16, h * 0.18, 'rgba(255,255,255,0.6)');
  // Damlalar
  ctx.fillStyle = c.dark;
  ctx.fillRect(w * 0.55, -s * 0.06, s * 0.06, s * 0.08 + Math.abs(Math.sin(t * 3)) * 3);
  eyes(ctx, -w * 0.5, -h * 1.15, s * 0.06, c.eye, s * 0.22, true);
  // Ağız
  ctx.fillStyle = darken(c.dark, 0.3);
  ctx.fillRect(-w * 0.45, -h * 0.75, s * 0.18, s * 0.04);
  if (features.includes('crown')) crown(ctx, 0, -h * 2 - 2, s * 0.5);
}

export function mushroom(ctx, s, c, t, features, m) {
  const walking = m.state === 'approach';
  const hop = walking ? Math.abs(Math.sin(t * 5)) * 6 : 0;
  // Ayaklar
  ctx.fillStyle = darken(c.body, 0.25);
  ctx.fillRect(-s * 0.18, -s * 0.08, s * 0.14, s * 0.08);
  ctx.fillRect(s * 0.05, -s * 0.08, s * 0.14, s * 0.08);
  ctx.translate(0, -hop);
  // Sap
  ctx.fillStyle = c.body;
  ctx.fillRect(-s * 0.2, -s * 0.5, s * 0.4, s * 0.44);
  ctx.fillStyle = darken(c.body, 0.15);
  ctx.fillRect(s * 0.08, -s * 0.5, s * 0.12, s * 0.44);
  // Kollar
  ctx.fillStyle = darken(c.body, 0.1);
  ctx.fillRect(-s * 0.3, -s * 0.3 + Math.sin(t * 8) * 2, s * 0.1, s * 0.16);
  // Şapka: alt kenar gölgesi + ana + benekler
  ctx.fillStyle = darken(c.dark, 0.3);
  ctx.fillRect(-s * 0.55, -s * 0.52, s * 1.1, s * 0.06);
  ctx.fillStyle = c.dark;
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.52, s * 0.55, s * 0.4, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = lighten(c.dark, 0.2);
  ctx.beginPath();
  ctx.ellipse(-s * 0.1, -s * 0.72, s * 0.25, s * 0.12, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#fff6e8';
  for (const [dx, dy, r] of [[-0.28, -0.66, 0.07], [0.12, -0.8, 0.09], [0.36, -0.6, 0.06], [-0.05, -0.62, 0.05]]) {
    ctx.fillRect((dx - r) * s, (dy - r) * s, r * 2 * s, r * 2 * s);
  }
  eyes(ctx, -s * 0.14, -s * 0.34, s * 0.045, c.eye, s * 0.14, true);
}

export function ghost(ctx, s, c, t, features, m) {
  const float = Math.sin(t * 3) * 4 + s * 0.15;
  const w = s * 0.42;
  const h = s * 0.8;
  ctx.translate(0, -float);
  ctx.globalAlpha *= 0.88;
  // Dalgalı kuyruklu gövde
  const body = (color, inset) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-w + inset, -h * 0.55);
    ctx.quadraticCurveTo(-w + inset, -h - inset, 0, -h + inset);
    ctx.quadraticCurveTo(w - inset, -h - inset, w - inset, -h * 0.55);
    ctx.lineTo(w - inset, -s * 0.1);
    for (let i = 0; i <= 4; i++) {
      const x = w - inset - (i * (2 * (w - inset))) / 4;
      const y = -s * 0.1 + (i % 2 ? -s * 0.1 : s * 0.05) + Math.sin(t * 6 + i) * 2;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  };
  body(c.dark, 0);
  body(c.body, s * 0.05);
  ellipse(ctx, -w * 0.3, -h * 0.85, w * 0.25, h * 0.08, 'rgba(255,255,255,0.5)');
  // Oyuk gözler ve ağız
  ctx.fillStyle = c.eye;
  ctx.fillRect(-w * 0.6, -h * 0.68, s * 0.1, s * 0.14);
  ctx.fillRect(-w * 0.1, -h * 0.68, s * 0.1, s * 0.14);
  ctx.fillRect(-w * 0.45, -h * 0.45 + Math.sin(t * 4) * 1, s * 0.14, s * 0.08);
  if (features.includes('wisp')) {
    // Başın üstünde titreyen alev
    const f = Math.sin(t * 12) * 2;
    ctx.fillStyle = lighten(c.body, 0.4);
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, -h);
    ctx.lineTo(f, -h - s * 0.3);
    ctx.lineTo(s * 0.12, -h);
    ctx.fill();
  }
  if (features.includes('crown')) crown(ctx, 0, -h - 2, s * 0.4);
}
