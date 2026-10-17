import { Events } from '../core/events.js';
import { BASE_SLOTS, TREE_MAP, TREE_NODES, nodeCost, previousInBranch } from '../data/soulTree.js';
import { SLOT_ORDER } from '../data/items.js';

// Ruh Ağacı: düğüm seviyeleri state.tree içinde tutulur ve yeniden doğuşta SIFIRLANMAZ.
// Diğer sistemler etkileri buradan sorar: perk(), statBonuses(), isSlotUnlocked(), isSkillUnlocked().
export class SoulTreeSystem {
  constructor(game) {
    this.game = game;
    this.cache = null;
  }

  get state() {
    return this.game.state;
  }

  level(id) {
    return this.state.tree[id] || 0;
  }

  isMaxed(n) {
    return this.level(n.id) >= n.maxLevel;
  }

  cost(n) {
    return nodeCost(n, this.level(n.id));
  }

  /** Karşılanmamış ön koşulların listesi (boşsa düğüm açık) */
  missingRequirements(n) {
    const prev = previousInBranch(n);
    const reqs = [...(prev ? [prev.id] : []), ...n.requires];
    return reqs.filter((id) => this.level(id) < 1).map((id) => TREE_MAP[id]);
  }

  isAvailable(n) {
    return this.missingRequirements(n).length === 0;
  }

  canBuy(n) {
    return this.isAvailable(n) && !this.isMaxed(n) && this.state.souls >= this.cost(n);
  }

  buy(id) {
    const n = TREE_MAP[id];
    if (!n || !this.canBuy(n)) return false;
    this.state.souls -= this.cost(n);
    this.state.tree[id] = this.level(id) + 1;
    this.cache = null;
    this.game.bus.emit(Events.TREE_CHANGED, { node: n, level: this.level(id) });
    return true;
  }

  get purchasedCount() {
    return TREE_NODES.filter((n) => this.level(n.id) > 0).length;
  }

  /** Tüm etkileri bir kez hesaplayıp önbellekte tutar */
  effects() {
    if (this.cache) return this.cache;
    const perks = {};
    const stats = {};
    const slots = new Set(BASE_SLOTS);
    const skills = new Set();
    for (const n of TREE_NODES) {
      const lvl = this.level(n.id);
      if (!lvl) continue;
      const e = n.effect;
      if (e.type === 'stat') stats[e.stat] = (stats[e.stat] || 0) + e.per * lvl;
      else if (e.type === 'perk') perks[e.key] = (perks[e.key] || 0) + e.per * lvl;
      else if (e.type === 'slot') slots.add(e.slot);
      else if (e.type === 'skill') skills.add(e.skill);
    }
    this.cache = { perks, stats, slots, skills };
    return this.cache;
  }

  perk(key) {
    return this.effects().perks[key] || 0;
  }

  statBonuses() {
    return this.effects().stats;
  }

  isSlotUnlocked(slot) {
    return this.effects().slots.has(slot);
  }

  unlockedSlots() {
    return SLOT_ORDER.filter((s) => this.isSlotUnlocked(s));
  }

  isSkillUnlocked(skillId) {
    return this.effects().skills.has(skillId);
  }

  /** Düğümün mevcut ve bir sonraki seviyedeki etkisini açıklar */
  describe(n) {
    const lvl = this.level(n.id);
    const per = n.effect.per ?? 0;
    return {
      now: lvl ? n.desc(per * lvl) : null,
      next: lvl < n.maxLevel ? n.desc(per * (lvl + 1)) : null,
    };
  }
}
