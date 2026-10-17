import { easeOutBack } from '../utils/math.js';
import { rand } from '../utils/random.js';
import { PIXEL_FONT } from './fonts.js';

import { drawIconText } from './IconRenderer.js';

const MAX_TEXTS = 60;

export class FloatingTextSystem {
  constructor() {
    this.texts = [];
  }

  add(text, x, y, { color = '#fff', size = 18, life = 0.9, vy = -70, vx = rand(-15, 15), bold = true } = {}) {
    if (this.texts.length >= MAX_TEXTS) this.texts.shift();
    this.texts.push({ text, x, y, color, size, life, maxLife: life, vy, vx, bold });
  }

  update(dt) {
    for (const t of this.texts) {
      t.life -= dt;
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.vy *= 1 - 1.8 * dt;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
  }

  draw(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    for (const t of this.texts) {
      const age = 1 - t.life / t.maxLife;
      const pop = age < 0.25 ? easeOutBack(age / 0.25) : 1;
      const size = Math.max(1, t.size * pop);
      ctx.globalAlpha = Math.min(1, (t.life / t.maxLife) * 2.5);
      ctx.font = `${t.bold ? 700 : 500} ${size}px ${PIXEL_FONT}`;
      ctx.lineWidth = Math.max(2, size / 5);
      ctx.strokeStyle = '#160d12';
      ctx.fillStyle = t.color;
      drawIconText(ctx, t.text, t.x, t.y, size);
    }
    ctx.restore();
  }
}
