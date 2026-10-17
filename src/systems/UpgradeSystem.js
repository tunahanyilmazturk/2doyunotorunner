import { Events } from '../core/events.js';
import { UPGRADES, UPGRADE_MAP, upgradeCost as baseCost } from '../data/upgrades.js';
import { efficiency, pickNext, resolveProfile, rowMetrics } from './UpgradeAdvisor.js';

const AUTO_INTERVAL = 0.5;
// Yeniden doğuştan sonra otomatik alım kısa süre bekler; yoksa sıfırlanan
// yükseltmeler ilk altınla birlikte anında geri alınıp "hiç sıfırlanmadı" gibi görünür.
const AUTO_GRACE = 10;
// Tek turda alınabilecek en fazla seviye (oto-alım ve "En iyisini al" güvenlik sınırı)
const MAX_BATCH = 50;

export class UpgradeSystem {
  constructor(game) {
    this.game = game;
    this.buyMode = 1; // 1 | 10 | 'max'
    this.autoTimer = 0;
    this.autoPause = 0;
    game.bus.on(Events.PRESTIGE, () => (this.autoPause = AUTO_GRACE));
  }

  get state() {
    return this.game.state;
  }

  /** Otomatik alım ilk yeniden doğuştan sonra açılır */
  get autoUnlocked() {
    return this.state.stats.prestiges > 0;
  }

  get autoEnabled() {
    return this.autoUnlocked && this.state.settings.autoBuy;
  }

  /** Oto-alım öncelik profili (bilinmeyen değer varsayılana çekilir) */
  get profile() {
    return resolveProfile(this.state.settings.autoBuyProfile).id;
  }

  setProfile(id) {
    this.state.settings.autoBuyProfile = resolveProfile(id).id;
    this.game.bus.emit(Events.SETTINGS_CHANGED, this.state.settings);
  }

  setAuto(enabled) {
    this.state.settings.autoBuy = enabled;
    this.game.bus.emit(Events.SETTINGS_CHANGED, this.state.settings);
  }

  setRowAuto(id, enabled) {
    this.state.upgradeAuto[id] = enabled;
  }

  /**
   * Kazanç/verim hesabının girdisi (ham stat havuzu + bölge).
   * DİKKAT: bir alım turu içinde BİR KEZ okunur; her satın alma sonrası yeniden
   * okumak `StatsSystem.recalculate` + `STATS_CHANGED` fırtınası yaratırdı.
   */
  get context() {
    const stats = this.game.stats.get();
    return { raw: stats?.raw ?? {}, stage: this.state.stage };
  }

  /** İşaretli (🤖), makslanmamış ve parası yeten satırlar — karar verilebilecekler. */
  affordable(mode = 1, ctx = this.context) {
    const gold = this.state.gold;
    const rows = [];
    for (const up of UPGRADES) {
      if (this.state.upgradeAuto[up.id] === false || this.isMaxed(up)) continue;
      const cost = this.costAt(up, this.level(up.id));
      if (cost > gold) continue;
      rows.push({ up, level: this.level(up.id), cost });
    }
    for (const row of rows) {
      const m = rowMetrics(row.up, row.level, 1, ctx.raw, ctx.stage);
      row.from = m.from;
      row.to = m.to;
      row.gain = m.gain;
      row.eff = efficiency({ gain: m.gain, cost: row.cost });
    }
    return rows;
  }

  /** Panel satırı ölçümü: seviye + fiyat (seçili mod) + kazanç + verim. */
  metrics(up, mode = this.buyMode) {
    const level = this.level(up.id);
    const q = this.quote(up, mode);
    const ctx = this.context;
    const m = rowMetrics(up, level, Math.max(1, q.count), ctx.raw, ctx.stage);
    return { level, ...q, ...m, eff: efficiency({ gain: m.gain, cost: q.cost }) };
  }

  /** İşaretli yükseltmelerden profilin seçtiğini alabildiği sürece alır */
  update(dt) {
    if (!this.autoEnabled) return;
    if (this.autoPause > 0) {
      this.autoPause = Math.max(0, this.autoPause - dt);
      return;
    }
    this.autoTimer -= dt;
    if (this.autoTimer > 0) return;
    this.autoTimer = AUTO_INTERVAL;

    const ctx = this.context;
    const profile = this.profile;
    for (let guard = 0; guard < MAX_BATCH; guard++) {
      const pick = pickNext(this.affordable(1, ctx), profile);
      if (!pick || !this.game.economy.spend(pick.cost)) return;
      this.state.upgrades[pick.up.id] = this.level(pick.up.id) + 1;
      this.game.bus.emit(Events.UPGRADE_BOUGHT, { id: pick.up.id, level: this.level(pick.up.id), count: 1, auto: true });
    }
  }

  /**
   * "⚡ En iyisini al": altın yettiğince (en fazla MAX_BATCH) o an en verimli
   * işaretli yükseltmeyi alır. `pickNext(..., 'value')` = altın başına kazanç.
   * @returns {number} alınan seviye sayısı
   */
  buyBest(maxBuys = MAX_BATCH) {
    const ctx = this.context;
    let bought = 0;
    for (let i = 0; i < maxBuys; i++) {
      const pick = pickNext(this.affordable(1, ctx), 'value');
      if (!pick || !this.game.economy.spend(pick.cost)) break;
      this.state.upgrades[pick.up.id] = this.level(pick.up.id) + 1;
      this.game.bus.emit(Events.UPGRADE_BOUGHT, { id: pick.up.id, level: this.level(pick.up.id), count: 1 });
      bought++;
    }
    return bought;
  }

  /** Ruh Ağacı indirimi uygulanmış seviye maliyeti */
  costAt(up, level) {
    return Math.ceil(baseCost(up, level) * (1 - this.game.tree.perk('discount') / 100));
  }

  level(id) {
    return this.state.upgrades[id] || 0;
  }

  isMaxed(up) {
    return up.maxLevel !== undefined && this.level(up.id) >= up.maxLevel;
  }

  /** Mevcut satın alma moduna göre kaç seviye ve toplam maliyet. */
  quote(up, mode = this.buyMode) {
    const start = this.level(up.id);
    const gold = this.state.gold;
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

  /**
   * @param {number|'max'} [mode] verilmezse panelin seçili modu.
   *                             Shift → 10, Ctrl → 'max' için kullanılır.
   */
  buy(id, mode = this.buyMode) {
    const up = UPGRADE_MAP[id];
    if (!up) return false;
    const q = this.quote(up, mode);
    if (!q.affordable || !this.game.economy.spend(q.cost)) return false;
    this.state.upgrades[id] = this.level(id) + q.count;
    this.game.bus.emit(Events.UPGRADE_BOUGHT, { id, level: this.level(id), count: q.count });
    return true;
  }
}
