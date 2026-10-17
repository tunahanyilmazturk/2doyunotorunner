import { Balance, PLAYER_BASE } from '../config/balance.js';
import { Events } from '../core/events.js';
import { UPGRADES, upgradeValue } from '../data/upgrades.js';
import { getItemStats } from './ItemFactory.js';

// Taban statlar + yükseltmeler + ekipman + yetenek buffları + Ruh Ağacı + Ruh gücü + başarım → nihai statlar.
// Ruh Ağacı'nın saldırı/can/altın yüzdeleri ayrı bir çarpan olarak uygulanır (ekipmanla toplanmaz).
// Sonuç önbelleğe alınır; sadece ilgili olaylarda yeniden hesaplanır.
export class StatsSystem {
  constructor(game) {
    this.game = game;
    this.current = null;
    this.dirty = true;
    const markDirty = () => (this.dirty = true);
    game.bus.on(Events.EQUIPMENT_CHANGED, markDirty);
    game.bus.on(Events.UPGRADE_BOUGHT, markDirty);
    game.bus.on(Events.PRESTIGE, markDirty);
    game.bus.on(Events.ITEM_ENHANCED, markDirty);
    game.bus.on(Events.BUFFS_CHANGED, markDirty);
    game.bus.on(Events.ACHIEVEMENT_UNLOCKED, markDirty);
    game.bus.on(Events.TREE_CHANGED, markDirty);
  }

  get() {
    if (this.dirty || !this.current) this.recalculate();
    return this.current;
  }

  recalculate() {
    const state = this.game.state;
    const raw = { ...PLAYER_BASE };

    for (const up of UPGRADES) {
      raw[up.stat] = (raw[up.stat] || 0) + upgradeValue(up, state.upgrades[up.id] || 0);
    }
    for (const item of Object.values(state.equipment)) {
      if (!item) continue;
      for (const [key, value] of Object.entries(getItemStats(item))) raw[key] = (raw[key] || 0) + value;
    }
    const buffs = this.game.skills?.activeModifiers() ?? {};
    for (const [key, value] of Object.entries(buffs)) raw[key] = (raw[key] || 0) + value;
    const elixirs = this.game.elixirs?.activeModifiers() ?? {};
    for (const [key, value] of Object.entries(elixirs)) raw[key] = (raw[key] || 0) + value;

    const MULT_STATS = ['atkPct', 'hpPct', 'goldPct'];
    const tree = this.game.tree?.statBonuses() ?? {};
    for (const [key, value] of Object.entries(tree)) {
      if (!MULT_STATS.includes(key)) raw[key] = (raw[key] || 0) + value;
    }
    // Ruh gücü: tüm zamanlarda kazanılan her Ruh küçük kalıcı bonus verir
    const soulPower = 1 + state.soulsEarned * Balance.soulPowerBonus;
    const soulAtk = soulPower * (1 + (tree.atkPct || 0) / 100);
    const soulHp = soulPower * (1 + (tree.hpPct || 0) / 100);
    const soulGold = soulPower * (1 + (tree.goldPct || 0) / 100);
    const achMult = 1 + Object.keys(state.achievements).length * Balance.achievementBonus;

    const s = {
      raw,
      atk: raw.atk * (1 + raw.atkPct / 100) * soulAtk * achMult,
      maxHp: raw.hp * (1 + raw.hpPct / 100) * soulHp,
      armor: raw.armor,
      regen: raw.regen,
      attackSpeed: Math.min(Balance.maxAttackSpeed, raw.attackSpeed * (1 + raw.aspd / 100)),
      critChance: Math.min(100, raw.crit) / 100,
      critMult: raw.critDmg / 100,
      goldMult: (1 + raw.goldPct / 100) * soulGold * achMult,
      soulPower,
      achMult,
      luck: raw.luck,
      lifesteal: Math.min(Balance.maxLifesteal, raw.lifesteal) / 100,
      dodgeChance: Math.min(Balance.maxDodge, raw.dodge) / 100,
      thorns: raw.thorns / 100,
      bossDmgMult: 1 + raw.bossDmg / 100,
    };
    s.dps = s.atk * s.attackSpeed * (1 + s.critChance * (s.critMult - 1));
    s.damageReduction = Balance.armorReduction(s.armor, state.stage);

    this.current = s;
    this.dirty = false;
    this.game.player.applyStats(s);
    this.game.bus.emit(Events.STATS_CHANGED, s);
    return s;
  }
}
