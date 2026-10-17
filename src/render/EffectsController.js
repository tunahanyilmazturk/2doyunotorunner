import { GROUND_Y } from '../config/constants.js';
import { Events } from '../core/events.js';
import { getBiomeTitle, getCycle } from '../data/biomes.js';
import { getRarity } from '../data/rarities.js';
import { formatNumber } from '../utils/format.js';

import { iconToken, itemArtKey } from '../ui/icons.js';

// Oyun olaylarını görsel efektlere (partikül, yazı, sarsıntı, afiş) çevirir.
// Oyun mantığı bu dosyayı hiç bilmez; kaldırılsa oyun çalışmaya devam eder.
export class EffectsController {
  constructor(game) {
    this.game = game;
    const { bus } = game;
    const fx = game.particles;
    const text = game.floatingText;
    const renderer = game.renderer;

    bus.on(Events.DAMAGE_DEALT, ({ target, amount, crit, source }) => {
      const x = target.x - target.size * 0.2;
      const y = target.centerY;
      if (source === 'thorns') {
        text.add(`🌵 ${formatNumber(amount)}`, x + 10, y - target.size * 0.3, { color: '#9be27a', size: 13, life: 0.7 });
        return;
      }
      fx.slash(x, y, crit ? '#ffe066' : '#ffffff', crit);
      fx.burst(x, y, { count: crit ? 10 : 5, color: target.def.colors.body, speed: [80, 220], size: [2, 4], life: [0.25, 0.5], gravity: 600, angle: -0.6, spread: 1.8 });
      text.add(crit ? `${formatNumber(amount)}!` : formatNumber(amount), x, y - target.size * 0.6, {
        color: crit ? '#ffd23b' : '#ffffff',
        size: crit ? 26 : 17,
      });
      if (crit) renderer.shake(3, 0.12);
    });

    bus.on(Events.HEAVY_WARNING, ({ monster }) => {
      text.add('⚠ Ağır vuruş geliyor!', monster.x, monster.centerY - monster.size * 0.9, { color: '#ff9a2e', size: 14, life: 1.2, vy: -25, vx: 0 });
    });

    bus.on(Events.PLAYER_HIT, ({ amount, heavy }) => {
      const p = game.player;
      text.add(`-${formatNumber(amount)}`, p.x - 8, p.y - 92, { color: heavy ? '#ff3b3b' : '#ff6b6b', size: heavy ? 24 : 16, vx: -30 });
      if (heavy) renderer.shake(8, 0.3);
      fx.burst(p.x, p.y - 38, { count: 4, color: '#c0392b', speed: [60, 140], size: [2, 3], life: [0.2, 0.4], angle: -2.4, spread: 1.4 });
    });

    bus.on(Events.PLAYER_DODGED, () => {
      const p = game.player;
      text.add('Kaçtı!', p.x - 10, p.y - 92, { color: '#7fe3ff', size: 15, vx: -25 });
    });

    bus.on(Events.MONSTER_KILLED, ({ monster }) => {
      fx.burst(monster.x, monster.centerY, {
        count: monster.isBoss ? 50 : 18,
        color: [monster.def.colors.body, monster.def.colors.dark, '#ffffff'],
        speed: [80, monster.isBoss ? 420 : 280],
        size: [3, 6],
        life: [0.5, 1.1],
        gravity: 700,
        groundY: GROUND_Y,
      });
      fx.ring(monster.x, monster.centerY, '#ffffff', monster.isBoss ? 120 : 50);
      if (monster.isBoss) {
        renderer.shake(9, 0.5);
        renderer.showBanner('BOSS YENİLDİ!', monster.name, '#ffd34d');
      }
    });

    bus.on(Events.GOLD_GAINED, ({ amount, x, y }) => {
      fx.burst(x, y, { count: Math.min(12, 3 + Math.floor(Math.log10(amount + 1) * 2)), shape: 'coin', color: '#ffd34d', speed: [120, 260], size: [3, 5], life: [0.8, 1.2], gravity: 800, angle: -Math.PI / 2, spread: 1.6, groundY: GROUND_Y - 4, drag: 1 });
      text.add(`+${formatNumber(amount)} 🪙`, x + 10, y - 20, { color: '#ffd34d', size: 16, vy: -50, life: 1.1 });
    });

    bus.on(Events.LOOT_DROPPED, ({ item, x, y, autoSold, full }) => {
      const rarity = getRarity(item.tier);
      const suffix = autoSold ? (full ? ' (dolu → satıldı)' : ' (satıldı)') : '';
      text.add(`${iconToken(itemArtKey(item))} ${rarity.name} ${item.name}${suffix}`, x, y - 50, { color: rarity.color, size: item.tier >= 3 ? 18 : 14, life: 1.8, vy: -40, vx: 0 });
      fx.burst(x, y, { count: 6 + item.tier * 6, color: rarity.color, shape: 'circle', speed: [40, 160], size: [2, 4], life: [0.6, 1.2], gravity: -60, spread: Math.PI * 2 });
      if (item.tier >= 4) {
        renderer.shake(5, 0.3);
        renderer.showBanner(`${rarity.name.toUpperCase()} EŞYA!`, item.name, rarity.color);
      }
    });

    bus.on(Events.BOSS_SPAWNED, ({ monster }) => {
      const limit = Math.round(game.spawn.bossTimeTotal);
      renderer.showBanner(`⚔ BOSS: ${monster.name} ⚔`, `${limit} saniye içinde yen!`, '#ff4060');
      renderer.shake(6, 0.4);
    });

    bus.on(Events.BOSS_FAILED, () =>
      renderer.showBanner('Boss kaçtı...', 'Yeniden doğ ya da daha güçlü ekipmanla gel', '#ff8080')
    );

    bus.on(Events.BIOME_CHANGED, () => {
      const stage = game.state.stage;
      const nightmare = getCycle(stage) > 0;
      renderer.showBanner(getBiomeTitle(stage), nightmare ? 'Canavarlar çok daha güçlü!' : `Bölge ${stage}`, nightmare ? '#ff6a6a' : '#ffffff');
    });

    bus.on(Events.POTION_USED, ({ amount }) => {
      const p = game.player;
      text.add(`+${formatNumber(amount)} ❤`, p.x, p.y - 96, { color: '#6bff8f', size: 17 });
      fx.burst(p.x, p.y - 38, { count: 14, color: '#6bff8f', shape: 'circle', speed: [30, 90], gravity: -120, life: [0.6, 1] });
    });

    bus.on(Events.PLAYER_DIED, () => renderer.shake(8, 0.4));

    bus.on(Events.UPGRADE_BOUGHT, ({ auto }) => {
      if (auto) return; // otomatik alımda partikül yağmuru olmasın
      const p = game.player;
      fx.burst(p.x, p.y - 38, { count: 10, color: '#7fd4ff', shape: 'circle', speed: [40, 120], gravity: -150, life: [0.5, 0.9] });
    });

    bus.on(Events.EQUIPMENT_CHANGED, ({ item }) => {
      if (!item) return;
      const p = game.player;
      fx.ring(p.x, p.y - 38, getRarity(item.tier).color, 50);
    });

    bus.on(Events.MONSTER_SPAWNED, ({ monster }) => {
      if (!monster.isElite) return;
      const trait = monster.trait;
      text.add(`★ Elit: ${trait.desc}`, game.world.viewWidth - 150, 150, { color: trait.color, size: 16, life: 1.8, vy: -18, vx: 0 });
    });

    bus.on(Events.SKILL_CAST, ({ skill }) => {
      const p = game.player;
      text.add(`${iconToken(`skill-${skill.id}`)} ${skill.name}!`, p.x, p.y - 112, { color: skill.color, size: 18, life: 1.1, vy: -45, vx: 0 });
      if (skill.kind === 'meteor') {
        const m = game.spawn.current;
        if (m) {
          // Sağ üstten hedefe doğru düşen ateş topları + patlama
          for (let i = 0; i < 6; i++) {
            const sx = m.x + 160 + i * 12;
            const sy = -20 - i * 15;
            const life = 0.3 + i * 0.03;
            fx.emit({ x: sx, y: sy, vx: (m.x - sx) / life, vy: (m.centerY - sy) / life, life, maxLife: life, size: 14 - i, color: i % 2 ? '#ffd34d' : '#ff7a2e', shape: 'circle' });
          }
          fx.burst(m.x, m.centerY, { count: 50, color: ['#ff7a2e', '#ffd34d', '#5e1208'], speed: [120, 420], size: [3, 7], life: [0.5, 1.1], gravity: 600, groundY: GROUND_Y });
          fx.ring(m.x, m.centerY, '#ff7a2e', 140);
          text.add('💫 Sersemledi!', m.x, m.centerY - m.size, { color: '#ffd34d', size: 15, life: 1.4, vx: 0 });
        }
        renderer.shake(12, 0.5);
      } else if (skill.kind === 'strike') {
        const m = game.spawn.current;
        if (m) {
          fx.slash(m.x - m.size * 0.2, m.centerY, skill.color, true);
          fx.ring(m.x, m.centerY, skill.color, 90);
        }
        renderer.shake(7, 0.25);
      } else if (skill.kind === 'heal') {
        fx.burst(p.x, p.y - 38, { count: 26, color: skill.color, shape: 'circle', speed: [40, 140], gravity: -160, life: [0.7, 1.2] });
        fx.ring(p.x, p.y - 38, skill.color, 70);
      } else if (skill.id === 'goldRush') {
        fx.burst(p.x + 60, 60, { count: 30, shape: 'coin', color: '#ffd34d', speed: [40, 160], size: [3, 5], life: [1, 1.6], gravity: 500, angle: Math.PI / 2, spread: 2.4, groundY: GROUND_Y - 4 });
      } else {
        fx.burst(p.x, p.y - 38, { count: 22, color: [skill.color, '#ffb03a'], shape: 'circle', speed: [60, 180], gravity: -80, life: [0.5, 0.9] });
        fx.ring(p.x, p.y - 38, skill.color, 60);
      }
    });

    bus.on(Events.ITEM_ENHANCED, ({ item }) => {
      const p = game.player;
      const color = getRarity(item.tier).color;
      text.add(`🔨 +${item.enhance} ${item.name}`, p.x, p.y - 106, { color, size: 16, life: 1.3, vy: -40, vx: 0 });
      fx.burst(p.x, p.y - 38, { count: 18, color: ['#ffb03a', '#fff2a8', color], speed: [80, 220], size: [2, 4], life: [0.3, 0.7], gravity: 500 });
    });

    bus.on(Events.ACHIEVEMENT_UNLOCKED, ({ achievement, silent }) => {
      if (silent) return;
      renderer.showBanner(`${iconToken(`achievement-${achievement.group}`)} ${achievement.name}`, achievement.desc, '#ffd34d');
    });

    bus.on(Events.PRESTIGE, ({ gained }) => {
      renderer.showBanner('YENİDEN DOĞUŞ', `+${gained} Ruh kazanıldı`, '#c58bff');
      renderer.shake(10, 0.6);
    });
  }
}
