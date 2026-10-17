import { darken, lighten } from '../../../utils/color.js';
import { crown, ellipse, eyes, teeth } from './parts.js';

// Dört ayaklılar, uçanlar ve yılanlar.

// ---------- Dört ayaklılar: kurt, yaban domuzu, akrep, örümcek, cehennem tazısı ----------
// features: tail, tusks, stinger, legs8, flames, mane
export function beast(ctx, s, c, t, features, m) {
  const has = (f) => features.includes(f);
  const walking = m.state === 'approach';
  const spider = has('legs8');
  const bodyY = -s * (spider ? 0.38 : 0.45);
  const bw = s * (spider ? 0.4 : 0.55);
  const bh = s * (spider ? 0.3 : 0.22);

  // Bacaklar: arka çift koyu
  ctx.lineCap = 'butt';
  const legs = spider ? [-0.7, -0.35, 0.1, 0.5] : [-0.6, -0.3, 0.3, 0.6];
  legs.forEach((lx, i) => {
    const ph = walking ? Math.sin(t * 12 + i * 1.7) * (spider ? 4 : 6) : 0;
    ctx.strokeStyle = i % 2 ? c.dark : darken(c.dark, 0.25);
    ctx.lineWidth = spider ? 2.5 : s * 0.1;
    ctx.beginPath();
    if (spider) {
      for (const dir of [-1, 1]) {
        ctx.moveTo(lx * bw * 0.6, bodyY);
        ctx.lineTo(lx * bw * 1.6 + ph * dir, bodyY - s * 0.2);
        ctx.lineTo(lx * bw * 2 + ph * dir, 0);
      }
    } else {
      ctx.moveTo(lx * bw, bodyY);
      ctx.lineTo(lx * bw + ph, -s * 0.04);
    }
    ctx.stroke();
    if (!spider) {
      ctx.fillStyle = darken(c.dark, 0.35);
      ctx.fillRect(lx * bw + ph - s * 0.06, -s * 0.05, s * 0.12, s * 0.05);
    }
  });

  // Kuyruk / iğne
  if (has('tail')) {
    ctx.strokeStyle = c.body;
    ctx.lineWidth = s * 0.1;
    ctx.beginPath();
    ctx.moveTo(bw * 0.9, bodyY);
    ctx.quadraticCurveTo(bw * 1.4, bodyY - s * 0.1, bw * 1.5, bodyY - s * 0.3 + Math.sin(t * 8) * 4);
    ctx.stroke();
  }
  if (has('stinger')) {
    ctx.strokeStyle = c.body;
    ctx.lineWidth = s * 0.1;
    const sting = m.attackAnim > 0 ? m.attackAnim * 10 : Math.sin(t * 3) * 2;
    ctx.beginPath();
    ctx.moveTo(bw * 0.8, bodyY);
    ctx.quadraticCurveTo(bw * 1.4, bodyY - s * 0.5, bw * 0.3 - sting, bodyY - s * 0.6);
    ctx.stroke();
    ellipse(ctx, bw * 0.3 - sting, bodyY - s * 0.6, s * 0.07, s * 0.07, c.dark);
  }

  // Gövde: ana + karın gölgesi + sırt ışığı
  ellipse(ctx, 0, bodyY, bw, bh, c.body);
  ellipse(ctx, 0, bodyY + bh * 0.45, bw * 0.8, bh * 0.4, darken(c.body, 0.18));
  ellipse(ctx, -bw * 0.1, bodyY - bh * 0.5, bw * 0.6, bh * 0.25, lighten(c.body, 0.15));
  if (has('flames')) {
    // Sırtta titreyen alevler
    for (let i = 0; i < 5; i++) {
      const fx = -bw * 0.6 + i * bw * 0.3;
      const fh = s * (0.15 + Math.abs(Math.sin(t * 10 + i)) * 0.12);
      ctx.fillStyle = i % 2 ? '#ff9a2e' : '#ff5a1f';
      ctx.beginPath();
      ctx.moveTo(fx - s * 0.06, bodyY - bh * 0.7);
      ctx.lineTo(fx, bodyY - bh * 0.7 - fh);
      ctx.lineTo(fx + s * 0.06, bodyY - bh * 0.7);
      ctx.fill();
    }
  }
  if (spider) {
    // Sırttaki desen
    ctx.fillStyle = c.eye;
    ctx.fillRect(-s * 0.04, bodyY - bh * 0.5, s * 0.08, bh * 0.6);
  }

  // Kafa
  const hx = -bw * 0.95;
  const hy = bodyY - (spider ? 0 : s * 0.1);
  const hr = s * (spider ? 0.16 : 0.2);
  ellipse(ctx, hx, hy, hr, hr, c.body);
  if (!spider && !has('stinger')) {
    // Burun + kulak
    ellipse(ctx, hx - hr * 0.9, hy + hr * 0.25, hr * 0.6, hr * 0.4, c.body);
    ctx.fillStyle = darken(c.dark, 0.4);
    ctx.fillRect(hx - hr * 1.5, hy + hr * 0.05, hr * 0.25, hr * 0.25);
    ctx.fillStyle = c.body;
    ctx.beginPath();
    ctx.moveTo(hx - hr * 0.2, hy - hr * 0.7);
    ctx.lineTo(hx + hr * 0.1, hy - hr * 1.6);
    ctx.lineTo(hx + hr * 0.6, hy - hr * 0.6);
    ctx.fill();
    // Saldırırken açılan ağız
    if (m.attackAnim > 0.2) teeth(ctx, hx - hr * 1.4, hy + hr * 0.55, hr * 0.9, 3, s * 0.05);
  }
  if (has('tusks')) {
    ctx.fillStyle = '#f4f0e6';
    ctx.beginPath();
    ctx.moveTo(hx - hr * 1.1, hy + hr * 0.5);
    ctx.lineTo(hx - hr * 1.5, hy - hr * 0.3);
    ctx.lineTo(hx - hr * 0.8, hy + hr * 0.4);
    ctx.fill();
  }
  if (has('stinger')) ellipse(ctx, hx - hr * 1.1, hy + hr * 0.3, hr * 0.5, hr * 0.5, c.dark);
  if (spider) {
    eyes(ctx, hx - hr * 0.4, hy - 2, 1.5, c.eye, 5);
    eyes(ctx, hx - hr * 0.2, hy + 3, 1.2, c.eye, 4);
  } else {
    eyes(ctx, hx - hr * 0.35, hy - hr * 0.25, s * 0.035, c.eye);
  }
}

// ---------- Uçanlar: yarasa, iblisçik, eşek arısı, akbaba ----------
// features: horns, stripes, stinger, beak, crown
export function flyer(ctx, s, c, t, features) {
  const has = (f) => features.includes(f);
  const flap = Math.sin(t * (has('stripes') ? 30 : 16));
  const r = s * 0.32;

  // Kanatlar: arka kanat koyu, zar çizgili
  for (const dir of [1, -1]) {
    ctx.fillStyle = dir > 0 ? darken(c.dark, 0.25) : c.dark;
    if (has('stripes')) ctx.fillStyle = dir > 0 ? 'rgba(220,240,255,0.55)' : 'rgba(240,250,255,0.75)';
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(dir * s * 0.75, -r - s * 0.35 * flap);
    ctx.lineTo(dir * s * 0.55, -r + s * 0.1);
    ctx.lineTo(dir * s * 0.35, -r - s * 0.05 * flap);
    ctx.closePath();
    ctx.fill();
  }
  if (has('stinger')) {
    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.moveTo(r * 0.8, -r * 0.8);
    ctx.lineTo(r * 1.7, -r * 0.6);
    ctx.lineTo(r * 0.8, -r * 0.4);
    ctx.fill();
  }

  ellipse(ctx, 0, -r, r * (has('stripes') ? 1.25 : 1), r, c.body);
  if (has('stripes')) {
    ctx.fillStyle = c.dark;
    for (let i = 0; i < 3; i++) ctx.fillRect(-r * 0.4 + i * r * 0.5, -r * 1.9, r * 0.22, r * 1.8);
  }
  ellipse(ctx, -r * 0.25, -r * 1.45, r * 0.45, r * 0.2, lighten(c.body, 0.18));
  if (has('horns')) {
    ctx.fillStyle = '#2a0a05';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * r * 0.3, -r * 1.8);
      ctx.lineTo(dir * r * 0.8, -r * 2.6);
      ctx.lineTo(dir * r * 0.7, -r * 1.6);
      ctx.fill();
    }
  }
  if (has('beak')) {
    ctx.fillStyle = '#e0b84a';
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, -r * 1.1);
    ctx.lineTo(-r * 1.7, -r * 0.8);
    ctx.lineTo(-r * 0.8, -r * 0.7);
    ctx.fill();
    // Çıplak boyun
    ctx.fillStyle = '#d9a07a';
    ctx.fillRect(-r * 0.6, -r * 1.7, r * 0.4, r * 0.4);
  }
  eyes(ctx, -r * 0.4, -r * 1.15, s * 0.05, c.eye, r * 0.55);
  if (has('crown')) crown(ctx, 0, -r * 2.4, r * 1.4);
}

// ---------- Yılanlar: kum solucanı, lav yılanı, kemik ejder ----------
// features: burrow (yerden çıkar), teeth, spikes, bones, crown
export function serpent(ctx, s, c, t, features, m) {
  const has = (f) => features.includes(f);
  const segs = 7;
  const segR = s * 0.17;
  const lift = m.attackAnim > 0 ? Math.sin(m.attackAnim * Math.PI) * s * 0.25 : 0;

  if (has('burrow')) {
    // Toprak tümseği
    ellipse(ctx, s * 0.5, -s * 0.03, s * 0.7, s * 0.1, darken(c.dark, 0.2));
  }
  // Kuyruktan başa segmentler (sinüs dalgası)
  const pts = [];
  for (let i = 0; i < segs; i++) {
    const k = i / (segs - 1); // 0 kuyruk, 1 baş
    const x = s * 1.0 - k * s * 1.5;
    const y = -segR - Math.sin(t * 6 - i * 0.9) * s * 0.08 - k * k * (s * 0.45 + lift);
    pts.push([x, y, segR * (0.7 + k * 0.45)]);
  }
  pts.forEach(([x, y, r], i) => {
    ellipse(ctx, x, y, r, r, i % 2 ? c.body : darken(c.body, 0.1));
    ellipse(ctx, x, y + r * 0.4, r * 0.8, r * 0.45, has('bones') ? c.dark : lighten(c.body, 0.25));
    if (has('spikes') && i < segs - 1) {
      ctx.fillStyle = c.dark;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.4, y - r * 0.8);
      ctx.lineTo(x, y - r * 1.6);
      ctx.lineTo(x + r * 0.4, y - r * 0.8);
      ctx.fill();
    }
    if (has('bones')) {
      ctx.fillStyle = c.dark;
      ctx.fillRect(x - r * 0.1, y - r, r * 0.2, r * 2);
    }
  });
  // Baş
  const [hx, hy, hr] = pts[pts.length - 1];
  ellipse(ctx, hx - hr * 0.4, hy, hr * 1.25, hr * 0.95, c.body);
  ellipse(ctx, hx - hr * 0.3, hy - hr * 0.45, hr * 0.8, hr * 0.3, lighten(c.body, 0.2));
  const open = m.attackAnim > 0.15 || has('teeth');
  if (open) {
    ctx.fillStyle = '#3a0a0a';
    ctx.fillRect(hx - hr * 1.6, hy + hr * 0.05, hr * 1.1, hr * 0.45);
    if (has('teeth')) teeth(ctx, hx - hr * 1.6, hy + hr * 0.05, hr * 1.1, 4, hr * 0.25);
  }
  eyes(ctx, hx - hr * 0.7, hy - hr * 0.35, hr * 0.18, c.eye);
  if (has('crown')) crown(ctx, hx - hr * 0.3, hy - hr * 0.9, hr * 1.4);
}
