import { Events } from '../core/events.js';
import { UPGRADES, UPGRADE_MAP, upgradeCost as baseCost } from '../data/upgrades.js';

const AUTO_INTERVAL = 0.5;
// Yeniden doğuştan sonra otomatik alım kısa süre bekler; yoksa sıfırlanan
// yükseltmeler ilk altınla birlikte anında geri alınıp "hiç sıfırlanmadı" gibi görünür.
const AUTO_GRACE = 10;

export class UpgradeSystem {
  constructor(game) {
    this.game = game;
    this.buyMode = 1; // 1 | 10 | 'max'
    this.autoTimer = 0;
    this.autoPause = 0;
    game.bus.on(Events.PRESTIGE, () => (this.autoPause = AUTO_GRACE));
  }

  /** Otomatik alım ilk yeniden doğuştan sonra açılır */
  get autoUnlocked() {
    return this.game.state.stats.prestiges > 0;
  }

  get autoEnabled() {
    return this.autoUnlocked && this.game.state.settings.autoBuy;
  }

  setAuto(enabled) {
    this.game.state.settings.autoBuy = enabled;
    this.game.bus.emit(Events.SETTINGS_CHANGED, this.game.state.settings);
  }

  setRowAuto(id, enabled) {
    this.game.state.upgradeAuto[id] = enabled;
  }

  /** İşaretli yükseltmelerden en ucuzunu (x1) alabildiği sürece alır */
  update(dt) {
    if (!this.autoEnabled) return;
    if (this.autoPause > 0) {
      this.autoPause = Math.max(0, this.autoPause - dt);
      return;
    }
    this.autoTimer -= dt;
    if (this.autoTimer > 0) return;
    this.autoTimer = AUTO_INTERVAL;
    const state = this.game.state;
    for (let guard = 0; guard < 50; guard++) {
      let best = null;
      let bestCost = Infinity;
      for (const up of UPGRADES) {
        if (state.upgradeAuto[up.id] === false || this.isMaxed(up)) continue;
        const cost = this.costAt(up, this.level(up.id));
        if (cost < bestCost) {
          best = up;
          bestCost = cost;
        }
      }
      if (!best || !this.game.economy.spend(bestCost)) return;
      state.upgrades[best.id] = this.level(best.id) + 1;
      this.game.bus.emit(Events.UPGRADE_BOUGHT, { id: best.id, level: this.level(best.id), count: 1, auto: true });
    }
  }

  /** Ruh Ağacı indirimi uygulanmış seviye maliyeti */
  costAt(up, level) {
    return Math.ceil(baseCost(up, level) * (1 - this.game.tree.perk('discount') / 100));
  }

  level(id) {
    return this.game.state.upgrades[id] || 0;
  }

  isMaxed(up) {
    return up.maxLevel !== undefined && this.level(up.id) >= up.maxLevel;
  }

  /** Mevcut satın alma moduna göre kaç seviye ve toplam maliyet. */
  quote(up, mode = this.buyMode) {
    const start = this.level(up.id);
    const gold = this.game.state.gold;
    const limit = mode === 'max' ? Infinity : mode;
    let count = 0;
    let cost = 0;
    while (count < limit && count < 1000) {
      if (up.maxLevel !== undefined && start + count >= up.maxLevel) break;
      const next = this.costAt(up, start + count);
      if (mode === 'max' && cost + next > gold) break;
      cost += next;
      count++;
    }
    // MAX modunda hiç alınamıyorsa bir sonraki seviyenin fiyatını göster
    if (mode === 'max' && count === 0 && !this.isMaxed(up)) {
      return { count: 1, cost: this.costAt(up, start), affordable: false };
    }
    return { count, cost, affordable: count > 0 && gold >= cost };
  }

  buy(id) {
    const up = UPGRADE_MAP[id];
    if (!up) return false;
    const q = this.quote(up);
    if (!q.affordable || !this.game.economy.spend(q.cost)) return false;
    this.game.state.upgrades[id] = this.level(id) + q.count;
    this.game.bus.emit(Events.UPGRADE_BOUGHT, { id, level: this.level(id), count: q.count });
    return true;
  }
}
