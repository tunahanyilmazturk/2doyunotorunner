import { BASE_VIEW_WIDTH, GAME_HEIGHT, GROUND_Y } from '../config/constants.js';
import { BIOMES } from '../data/biomes.js';
import { lighten, withAlpha } from '../utils/color.js';
import { hash } from '../utils/random.js';
import { EnvironmentLayer } from './EnvironmentLayer.js';

const H = GAME_HEIGHT;

/**
 * Prosedürel paralaks arka plan. Katmanlar (uzaktan yakına):
 *   gökyüzü / kutup ışıkları → uzak manzara → orman / su → biyom kalıntıları
 *   → orta / yakın süslemeler → dokulu yol ve toprak → ortam partikülleri
 *   ... sprite'lar ... → ön plan (karakterlerin önünden geçer)
 * Biyom değişiminde eski ve yeni biyom çapraz geçişle karışır.
 */
export class Background {
  constructor() {
    this.biomeIndex = -1;
    this.prevIndex = -1;
    this.transition = 1;
    this.time = 0;
    this.w = BASE_VIEW_WIDTH; // görünür mantıksal genişlik (Renderer ayarlar)
    this.environment = new EnvironmentLayer();
  }

  setBiome(index) {
    if (index === this.biomeIndex) return;
    this.prevIndex = this.biomeIndex;
    this.biomeIndex = index;
    this.transition = this.prevIndex < 0 ? 1 : 0;
  }

  update(dt) {
    this.time += dt;
    if (this.transition < 1) this.transition = Math.min(1, this.transition + dt * 0.8);
  }

  draw(ctx, distance) {
    this.withTransition(ctx, (biome) => this.drawBiome(ctx, biome, distance));
  }

  drawForeground(ctx, distance) {
    this.withTransition(ctx, (biome) => this.drawFore(ctx, biome, distance));
  }

  withTransition(ctx, fn) {
    if (this.transition < 1 && this.prevIndex >= 0) {
      fn(BIOMES[this.prevIndex]);
      ctx.save();
      ctx.globalAlpha = this.transition;
      fn(BIOMES[this.biomeIndex]);
      ctx.restore();
    } else {
      fn(BIOMES[this.biomeIndex]);
    }
  }

  drawBiome(ctx, biome, distance) {
    this.drawSky(ctx, biome);
    if (biome.stars) this.drawStars(ctx, biome);
    if (biome.id === 'tundra') this.environment.aurora(ctx, this.w, this.time);
    this.drawCelestial(ctx, biome);
    if (biome.id !== 'cave') this.drawClouds(ctx, biome, distance);
    this.drawRidge(ctx, biome.far, distance * 0.07, 238, [30, 0.0035, 19, 0.011, 9, 0.027], biome.id === 'tundra');
    this.environment.distant(ctx, biome, distance, this.w, this.time);
    this.drawHaze(ctx, biome, 160, .28);
    this.drawRidge(ctx, biome.mid, distance * 0.18, 283, [13, 0.006, 9, 0.014, 4, 0.031], false);
    this.environment.decor(ctx, biome, distance, this.w, 'far');
    this.environment.water(ctx, biome, distance, this.w, this.time);
    this.environment.landmarks(ctx, biome, distance, this.w);
    this.drawHaze(ctx, biome, 262, .12);
    this.environment.decor(ctx, biome, distance, this.w, 'middle');
    if (biome.id === 'cave') this.drawCeiling(ctx, biome, distance * .45);
    this.environment.decor(ctx, biome, distance, this.w, 'near');
    this.environment.ground(ctx, biome, distance, this.w);
    this.environment.verge(ctx, biome, distance, this.w);
    this.environment.motes(ctx, biome, this.w, this.time, distance);
    this.drawAmbient(ctx, biome, distance);
  }

  drawSky(ctx, biome) {
    const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, biome.sky[0]);
    g.addColorStop(0.75, biome.sky[1]);
    g.addColorStop(1, lighten(biome.sky[1], 0.15));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, H);
  }

  drawStars(ctx, biome) {
    const t = this.time;
    const color = biome.id === 'volcano' ? '255,170,120' : '200,190,255';
    for (let i = 0; i < 70; i++) {
      const x = hash(i * 3.1) * this.w;
      const y = hash(i * 7.7) * 190;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + hash(i) * 1.5) + i));
      ctx.fillStyle = `rgba(${color},${tw * 0.8})`;
      const s = hash(i * 1.3) > 0.85 ? 3 : 2;
      ctx.fillRect(Math.round(x), Math.round(y), s, s);
    }
  }

  drawCelestial(ctx, biome) {
    const cfg = {
      forest: ['#fff3c4', 'rgba(255,243,196,', 30],
      desert: ['#fff0c8', 'rgba(255,220,150,', 44],
      tundra: ['#ffffff', 'rgba(255,255,255,', 30],
      volcano: ['#ff5a2a', 'rgba(255,90,42,', 40],
    }[biome.id];
    if (!cfg) return;
    const [core, glow, r] = cfg;
    const x = this.w * 0.78;
    const y = 82;
    // Halka halka (bantlı) ışık — piksel sanat stili
    for (let i = 4; i >= 1; i--) {
      ctx.fillStyle = `${glow}${0.08 * (5 - i)})`;
      ctx.beginPath();
      ctx.arc(x, y, r + i * 14, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    if (biome.rays) {
      ctx.save();
      ctx.globalAlpha *= 0.07 + Math.sin(this.time * 0.6) * 0.02;
      ctx.fillStyle = '#fff6d8';
      for (let i = 0; i < 5; i++) {
        const a = 1.9 + i * 0.22 + Math.sin(this.time * 0.2 + i) * 0.02;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * 900, y + Math.sin(a) * 900);
        ctx.lineTo(x + Math.cos(a + 0.06) * 900, y + Math.sin(a + 0.06) * 900);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawClouds(ctx, biome, distance) {
    const offset = distance * 0.04 + this.time * 6;
    const smoky = biome.id === 'volcano';
    const top = smoky ? 'rgba(70,35,30,0.7)' : 'rgba(255,255,255,0.9)';
    const bottom = smoky ? 'rgba(40,18,16,0.7)' : withAlpha(lighten(biome.far, 0.45), 0.9);
    const spacing = 260;
    const start = Math.floor(offset / spacing) - 1;
    for (let i = start; i < start + this.w / spacing + 3; i++) {
      const x = i * spacing - offset + hash(i) * 120;
      const y = 36 + hash(i + 3) * 80;
      const s = 0.7 + hash(i + 9) * 0.7;
      const puffs = [
        [0, 0, 36, 13],
        [24, -9, 24, 14],
        [-22, 1, 20, 10],
        [8, -14, 16, 10],
      ];
      ctx.fillStyle = bottom;
      for (const [dx, dy, rx, ry] of puffs) {
        ctx.beginPath();
        ctx.ellipse(x + dx * s, y + dy * s + 3, rx * s, ry * s, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = top;
      for (const [dx, dy, rx, ry] of puffs) {
        ctx.beginPath();
        ctx.ellipse(x + dx * s, y + dy * s, rx * s, ry * s * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ridgePath(ctx, offset, baseY, waves, dy = 0) {
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= this.w + 8; x += 8) {
      const wx = x + offset;
      let y = baseY;
      for (let i = 0; i < waves.length; i += 2) y -= Math.sin(wx * waves[i + 1] + i) * waves[i];
      ctx.lineTo(x, y + dy);
    }
    ctx.lineTo(this.w + 8, GROUND_Y);
    ctx.closePath();
  }

  /** Sinüs toplamıyla dağ/tepe silueti; üst kenarda ışık şeridi, istenirse kar örtüsü */
  drawRidge(ctx, color, offset, baseY, waves, snow) {
    ctx.fillStyle = snow ? '#f4f8ff' : lighten(color, 0.22);
    this.ridgePath(ctx, offset, baseY, waves);
    ctx.fill();
    ctx.fillStyle = color;
    this.ridgePath(ctx, offset, baseY, waves, snow ? 9 : 3);
    ctx.fill();
  }

  drawHaze(ctx, biome, top, alpha) {
    const g = ctx.createLinearGradient(0, top, 0, GROUND_Y);
    g.addColorStop(0, withAlpha(biome.sky[1], 0));
    g.addColorStop(1, withAlpha(biome.sky[1], alpha));
    ctx.fillStyle = g;
    ctx.fillRect(0, top, this.w, GROUND_Y - top);
  }

  drawCeiling(ctx, biome, offset) {
    ctx.fillStyle = biome.near;
    ctx.fillRect(0, 0, this.w, 22);
    const spacing = 46;
    const start = Math.floor(offset / spacing) - 1;
    ctx.beginPath();
    for (let i = start; i < start + this.w / spacing + 3; i++) {
      const x = i * spacing - offset;
      const len = 20 + hash(i) * 55;
      ctx.moveTo(x, 20);
      ctx.lineTo(x + 12, 20 + len);
      ctx.lineTo(x + 24, 20);
    }
    ctx.fill();
    ctx.fillStyle = lighten(biome.near, 0.12);
    for (let i = start; i < start + this.w / spacing + 3; i++) {
      const x = i * spacing - offset;
      ctx.fillRect(x + 4, 20, 3, 10 + hash(i) * 20);
    }
  }

  /** Karakterlerin önünden geçen ön plan siluetleri (zeminden hızlı kayar → derinlik) */
  drawFore(ctx, biome, distance) {
    const offset = distance * 1.35;
    const spacing = 230;
    const start = Math.floor(offset / spacing) - 1;
    ctx.fillStyle = biome.fore;
    for (let i = start; i < start + this.w / spacing + 3; i++) {
      if (hash(i + 77) < 0.35) continue;
      const x = i * spacing - offset + hash(i * 5) * 120;
      const s = 0.7 + hash(i * 9) * 0.6;
      ctx.beginPath();
      if (biome.decor === 'rock' || biome.decor === 'crystal' || hash(i * 2) > 0.6) {
        // Kaya
        ctx.moveTo(x - 34 * s, H);
        ctx.lineTo(x - 22 * s, H - 20 * s);
        ctx.lineTo(x + 2 * s, H - 26 * s);
        ctx.lineTo(x + 26 * s, H - 14 * s);
        ctx.lineTo(x + 36 * s, H);
      } else {
        // Çalı / ot öbeği: sivri yapraklar
        ctx.moveTo(x - 40 * s, H);
        for (let k = 0; k <= 8; k++) {
          const bx = x - 40 * s + k * 10 * s;
          ctx.lineTo(bx + 5 * s, H - (14 + hash(i * 13 + k) * 18) * s);
          ctx.lineTo(bx + 10 * s, H - 6 * s);
        }
        ctx.lineTo(x + 50 * s, H);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  /** Durumsuz ortam partikülleri — zamana göre hesaplanır, kayıt tutmaz. */
  drawAmbient(ctx, biome, distance) {
    if (!biome.particle) return;
    const t = this.time;
    const W = this.w;
    const cfg = {
      snow: { n: 70, colors: ['rgba(255,255,255,0.95)'], vx: -20, vy: 40, size: 3, scroll: 0.8 },
      ember: { n: 45, colors: ['rgba(255,150,60,0.95)', 'rgba(255,220,120,0.9)'], vx: -10, vy: -35, size: 2, scroll: 0.6 },
      dust: { n: 35, colors: ['rgba(170,140,255,0.6)', 'rgba(120,230,255,0.5)'], vx: -5, vy: 6, size: 2, scroll: 0.4 },
      leaf: { n: 14, colors: ['#e0a83a', '#9cc95a', '#d26a32'], vx: -30, vy: 28, size: 4, scroll: 0.9 },
      sand: { n: 30, colors: ['rgba(255,236,190,0.5)'], vx: -120, vy: 4, size: 2, scroll: 1, streak: true },
    }[biome.particle];
    for (let i = 0; i < cfg.n; i++) {
      const x = (((hash(i) * W - distance * cfg.scroll + t * cfg.vx + Math.sin(t + i) * 10) % W) + W) % W;
      const y = (((hash(i + 99) * H + t * cfg.vy) % H) + H) % H;
      ctx.fillStyle = cfg.colors[i % cfg.colors.length];
      if (cfg.streak) ctx.fillRect(x, y, 10, 1);
      else if (biome.particle === 'leaf') {
        const flip = Math.sin(t * 3 + i) > 0 ? 1 : 0.5;
        ctx.fillRect(x, y, cfg.size, cfg.size * flip);
      } else ctx.fillRect(x, y, cfg.size, cfg.size);
    }
  }
}
