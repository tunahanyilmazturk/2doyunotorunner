import { drawIconText, measureIconText } from './IconRenderer.js';
import { BASE_VIEW_WIDTH, GAME_HEIGHT, MAX_VIEW_WIDTH, MIN_VIEW_WIDTH, SPRITE_SCALE } from '../config/constants.js';
import { getBiomeIndex, getCycle } from '../data/biomes.js';
import { withAlpha } from '../utils/color.js';
import { easeOutBack } from '../utils/math.js';
import { rand } from '../utils/random.js';
import { Background } from './Background.js';
import { font } from './fonts.js';
import { drawMonster, FLY_HEIGHT } from './sprites/monsters/index.js';
import { drawPlayer, drawPlayerAuras } from './sprites/PlayerSprite.js';
import { SpriteOutliner } from './SpriteOutliner.js';

/** Piksel modunda mantıksal birim başına sanat pikseli (0.5 → 2 birim = 1 piksel) */
const ART_SCALE = 0.5;

/**
 * İki katmanlı çizim:
 *  1) Dünya (arka plan, sprite'lar, partiküller) düşük çözünürlüklü tuvale çizilir ve
 *     yumuşatmasız büyütülür → piksel sanat görünümü.
 *  2) Yazılar, can barları ve afişler ana tuvale tam çözünürlükte çizilir → keskin okunur.
 */
export class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;
    this.background = new Background();
    this.outliner = new SpriteOutliner();
    this.low = document.createElement('canvas');
    this.lowCtx = this.low.getContext('2d');
    this.shakeTime = 0;
    this.shakePower = 0;
    this.banner = null;

    this.resize();
    new ResizeObserver(() => this.resize()).observe(canvas);
  }

  /**
   * Canvas kapsayıcısını doldurur. Mantıksal yükseklik sabit (GAME_HEIGHT);
   * genişlik ekran oranına göre MIN..MAX_VIEW_WIDTH arasında uyarlanır,
   * aşırı oranlarda kenarlara bant eklenir.
   */
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.max(1, Math.round(rect.width * dpr));
    const ch = Math.max(1, Math.round(rect.height * dpr));
    this.canvas.width = cw;
    this.canvas.height = ch;

    let scale = ch / GAME_HEIGHT;
    let viewWidth = cw / scale;
    this.ox = 0;
    this.oy = 0;
    if (viewWidth > MAX_VIEW_WIDTH) {
      viewWidth = MAX_VIEW_WIDTH;
      this.ox = (cw - viewWidth * scale) / 2;
    } else if (viewWidth < MIN_VIEW_WIDTH) {
      viewWidth = MIN_VIEW_WIDTH;
      scale = cw / viewWidth;
      this.oy = (ch - GAME_HEIGHT * scale) / 2;
    }
    this.scale = scale;
    this.viewWidth = viewWidth;
    this.background.w = viewWidth;
    this.game.world.viewWidth = viewWidth;
    this.game.world.speedScale = viewWidth / BASE_VIEW_WIDTH;
  }

  /** Dünya tuvalinin piksel oranı: piksel modunda sabit, değilse ekran çözünürlüğü */
  get artScale() {
    return this.game.state.settings.pixelArt === false ? this.scale : ART_SCALE;
  }

  shake(power = 4, duration = 0.2) {
    if (this.game.state.settings.reduceMotion) return; // hareketi azalt: ekran sarsıntısı kapalı
    this.shakePower = Math.max(this.shakePower, power);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  showBanner(title, subtitle = '', color = '#f2c14e') {
    this.banner = { title, subtitle, color, time: 0, duration: 2.2 };
  }

  render(dt) {
    const { ctx, game } = this;
    // Boss Kulesi'ndeyken kendi taş sahnesi; çıkınca bölgenin biyomuna dönülür (çapraz geçişle)
    this.background.setBiome(game.tower.active ? 'tower' : getBiomeIndex(game.state.stage));
    this.background.update(dt);

    let sx = 0;
    let sy = 0;
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      sx = rand(-1, 1) * this.shakePower;
      sy = rand(-1, 1) * this.shakePower;
      if (this.shakeTime <= 0) this.shakePower = 0;
    }

    const s = this.scale;
    const vw = this.viewWidth;
    const pr = this.artScale;
    this.drawWorld(pr);

    // Dünyayı ana tuvale bas (piksel modunda yumuşatmasız)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0d0a10';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.imageSmoothingEnabled = pr === this.scale;
    ctx.drawImage(this.low, 0, 0, Math.round(vw * pr), Math.round(GAME_HEIGHT * pr), this.ox + sx * s, this.oy + sy * s, vw * s, GAME_HEIGHT * s);
    ctx.imageSmoothingEnabled = true;

    // Keskin katman
    ctx.save();
    ctx.setTransform(s, 0, 0, s, this.ox, this.oy);
    ctx.beginPath();
    ctx.rect(0, 0, vw, GAME_HEIGHT);
    ctx.clip();
    this.drawVignette(ctx);
    ctx.setTransform(s, 0, 0, s, this.ox + sx * s, this.oy + sy * s);
    const monster = game.spawn.current;
    if (monster && !monster.dead) this.drawMonsterBar(ctx, monster);
    game.floatingText.draw(ctx);
    ctx.setTransform(s, 0, 0, s, this.ox, this.oy);
    this.drawBanner(ctx, dt);
    if (game.player.dead) this.drawDeathOverlay(ctx);
    ctx.restore();
  }

  drawWorld(pr) {
    const { game } = this;
    const w = Math.round(this.viewWidth * pr);
    const h = Math.round(GAME_HEIGHT * pr);
    if (this.low.width !== w || this.low.height !== h) {
      this.low.width = w;
      this.low.height = h;
    }
    const lc = this.lowCtx;
    lc.imageSmoothingEnabled = game.state.settings.pixelArt === false;
    lc.setTransform(1, 0, 0, 1, 0, 0);
    lc.clearRect(0, 0, w, h);
    lc.setTransform(pr, 0, 0, pr, 0, 0);
    this.background.draw(lc, game.world.distance);

    const player = game.player;
    const monster = game.spawn.current;
    const auras = game.skills.activeBuffSkills().map((sk) => sk.color);

    if (monster) {
      this.drawShadow(lc, monster.x, monster.y, monster.size * 0.45 * (monster.flying ? 0.6 : 1), monster.dead ? 1 - monster.deathTimer / 0.45 : 1);
      if ((monster.isElite || monster.isBoss) && !monster.dead) this.drawGlow(lc, monster);
      const boxH = monster.size * 1.9 + (monster.flying ? FLY_HEIGHT + 30 : 16);
      this.outliner.draw(lc, pr, { x: monster.x, y: monster.y + 4, w: monster.size * 2.8 + 40, h: boxH }, (c) => drawMonster(c, monster));
    }

    this.drawCompanion(lc, pr);
    this.drawShadow(lc, player.x, player.y, 22, 1);
    drawPlayerAuras(lc, player, auras);
    // Dış hat kutusu karakterin gerçek sınırlarına göre (silah ucu, miğfer tüyü dahil) küçük tutulur
    this.outliner.draw(lc, pr, { x: player.x, y: player.y + 8, w: 170, h: 130 },(c) => drawPlayer(c, player, game.state.equipment, game.classes.active.look, game.classes.active.attack?.anim));
    this.drawProjectiles(lc);

    game.particles.draw(lc);
    this.background.drawForeground(lc, game.world.distance);

    // Kabus döngülerinde dünyaya kızıl bir ton
    const cycle = getCycle(game.state.stage);
    if (cycle > 0) {
      lc.fillStyle = `rgba(120,0,30,${Math.min(0.28, 0.1 + cycle * 0.06)})`;
      lc.fillRect(0, 0, this.viewWidth, GAME_HEIGHT);
    }
  }

  /**
   * Yanındaki yoldaş: oyuncunun arkasında koşar, saldırırken öne atılır.
   * Canavar çizimlerini yeniden kullanır; onlar sola baktığı için yatay aynalanır.
   */
  drawCompanion(lc, pr) {
    const { game } = this;
    const a = game.companions.active;
    if (!a) return;
    const player = game.player;
    const look = a.def.look;
    const anim = game.companions.attackAnim;
    const v = (this.companionView ??= { seed: 0, hitFlash: 0, deathTimer: 0, dead: false, stunTimer: 0 });
    v.def = look;
    v.scale = SPRITE_SCALE * 0.9;
    v.size = look.size * v.scale;
    v.flying = look.shape === 'flyer';
    v.x = player.x - 62;
    v.y = player.y;
    v.animTime = player.animTime;
    v.attackAnim = anim;
    v.state = player.state === 'run' ? 'approach' : 'fight';
    if (player.dead) return;

    this.drawShadow(lc, v.x, v.y, v.size * 0.4 * (v.flying ? 0.6 : 1), 1);
    const boxH = v.size * 1.9 + (v.flying ? FLY_HEIGHT + 30 : 16);
    this.outliner.draw(lc, pr, { x: v.x, y: v.y + 4, w: v.size * 2.8 + 60, h: boxH }, (c) => {
      c.translate(v.x, 0);
      c.scale(-1, 1);
      c.translate(-v.x, 0);
      drawMonster(c, v);
    });
  }

  /** Menzilli saldırıların mermileri: ok (gövde, uç, tüy) ve büyü küresi (iz + parıltı). */
  drawProjectiles(ctx) {
    for (const p of this.game.projectiles.items) {
      if (p.shot.shot === 'arrow') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.strokeStyle = '#7a5a2b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(6, 0);
        ctx.stroke();
        ctx.fillStyle = '#cfd6de';
        ctx.beginPath();
        ctx.moveTo(11, 0);
        ctx.lineTo(5, -3);
        ctx.lineTo(5, 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#d64045';
        ctx.fillRect(-16, -2.5, 4, 5);
        ctx.restore();
      } else {
        // Büyü: solan iz ve parlayan küre
        p.trail.forEach((pt, i) => {
          ctx.globalAlpha = ((i + 1) / p.trail.length) * 0.4;
          ctx.fillStyle = p.shot.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2 + i * 0.4, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 10);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.4, p.shot.color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawShadow(ctx, x, y, rx, alpha) {
    ctx.fillStyle = `rgba(10,5,10,${0.3 * Math.max(0, alpha)})`;
    ctx.beginPath();
    ctx.ellipse(x, y + 2, rx, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Elit ve bossların arkasındaki yumuşak ışık (dış hattın dışında kalır) */
  drawGlow(ctx, m) {
    // Ağır vuruş hazırlanıyorsa kırmızı ve hızlı yanıp söner
    const warn = m.nextIsHeavy;
    const color = warn ? '#ff2020' : m.isElite ? m.trait?.color ?? '#ffcc33' : '#ff4060';
    const cy = m.centerY;
    const r = m.size * (warn ? 1.4 : 1.1);
    const pulse = warn ? 0.45 + Math.sin(m.animTime * 14) * 0.2 : 0.35 + Math.sin(m.animTime * 4) * 0.1;
    const g = ctx.createRadialGradient(m.x, cy, 2, m.x, cy, r);
    g.addColorStop(0, withAlpha(color, pulse));
    g.addColorStop(1, withAlpha(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(m.x - r, cy - r, r * 2, r * 2);
  }

  drawVignette(ctx) {
    const vw = this.viewWidth;
    const g = ctx.createRadialGradient(vw / 2, GAME_HEIGHT * 0.55, GAME_HEIGHT * 0.35, vw / 2, GAME_HEIGHT * 0.55, vw * 0.62);
    g.addColorStop(0, 'rgba(10,5,15,0)');
    g.addColorStop(1, 'rgba(10,5,15,0.3)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, vw, GAME_HEIGHT);
  }

  drawMonsterBar(ctx, m) {
    const w = m.isBoss ? 140 : 62;
    const h = m.isBoss ? 9 : 6;
    const x = Math.round(m.x - w / 2);
    const y = Math.round(m.y - m.size * 1.05 - (m.flying ? FLY_HEIGHT : 0) - 16);
    const color = m.isBoss ? '#e8364f' : m.isElite ? '#b36bff' : '#d64045';

    // Çerçeve: koyu dış hat + ince açık iç kenar
    ctx.fillStyle = '#160d12';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#3a2430';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * m.hpRatio, h);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x, y, w * m.hpRatio, Math.max(1, h / 3));
    // Bölmeler: her %10'da bir çentik
    ctx.fillStyle = 'rgba(22,13,18,0.55)';
    for (let i = 1; i < 10; i++) ctx.fillRect(x + (w * i) / 10, y, 1, h);

    const icon = m.isBoss ? '👑 ' : m.isElite ? `${m.trait?.icon ?? '★'} ` : '';
    const label = `${icon}${m.name}`;
    ctx.font = font(m.isBoss ? 14 : 11, 600);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const lvl = `${m.level}`;
    const lw = measureIconText(ctx, label, m.isBoss ? 18 : 14);
    ctx.font = font(m.isBoss ? 11 : 9, 700);
    const vw = ctx.measureText(lvl).width + 6;
    const total = lw + vw + 4;
    const tx = m.x - total / 2;
    const ty = y - 6;

    ctx.fillStyle = '#160d12';
    ctx.fillRect(Math.round(tx + lw + 4), ty - (m.isBoss ? 11 : 9), vw, m.isBoss ? 13 : 11);
    ctx.fillStyle = '#efe2c4';
    ctx.fillText(lvl, tx + lw + 7, ty);

    ctx.font = font(m.isBoss ? 14 : 11, 600);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#160d12';
    ctx.fillStyle = m.isBoss || m.isElite ? '#f2c14e' : '#efe2c4';
    drawIconText(ctx, label, tx, ty, m.isBoss ? 18 : 14);
  }

  drawBanner(ctx, dt) {
    const b = this.banner;
    if (!b) return;
    b.time += dt;
    if (b.time > b.duration) {
      this.banner = null;
      return;
    }
    const vw = this.viewWidth;
    const inT = Math.min(1, b.time / 0.3);
    const outT = Math.max(0, (b.time - (b.duration - 0.4)) / 0.4);
    const bandH = b.subtitle ? 62 : 46;
    const y = 112;

    ctx.save();
    ctx.globalAlpha = 1 - outT;
    // Bant soldan sağa açılır
    const bw = vw * Math.min(1, inT * 1.4);
    ctx.fillStyle = 'rgba(22,13,18,0.78)';
    ctx.fillRect((vw - bw) / 2, y - bandH / 2, bw, bandH);
    ctx.fillStyle = b.color;
    ctx.fillRect((vw - bw) / 2, y - bandH / 2, bw, 2);
    ctx.fillRect((vw - bw) / 2, y + bandH / 2 - 2, bw, 2);

    ctx.translate(vw / 2, y);
    const k = easeOutBack(inT);
    ctx.scale(k, k);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.font = font(30, 700);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#160d12';
    const ty = b.subtitle ? -8 : 0;
    ctx.fillStyle = b.color;
    drawIconText(ctx, b.title, 0, ty, 32);
    if (b.subtitle) {
      ctx.font = font(14, 500);
      ctx.lineWidth = 4;
      ctx.strokeText(b.subtitle, 0, 18);
      ctx.fillStyle = '#efe2c4';
      ctx.fillText(b.subtitle, 0, 18);
    }
    ctx.restore();
  }

  drawDeathOverlay(ctx) {
    const p = this.game.player;
    const vw = this.viewWidth;
    ctx.fillStyle = 'rgba(70,0,10,0.3)';
    ctx.fillRect(0, 0, vw, GAME_HEIGHT);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = font(22, 700);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#160d12';
    const text = `Yeniden doğuyorsun… ${Math.max(0, p.respawnTimer).toFixed(1)} sn`;
    ctx.strokeText(text, vw / 2, 200);
    ctx.fillStyle = '#ffb3b3';
    ctx.fillText(text, vw / 2, 200);
  }
}
