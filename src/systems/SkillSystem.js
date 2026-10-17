import { Events } from '../core/events.js';
import { SKILLS, SKILL_MAP, skillCost } from '../data/skills.js';
import { chance } from '../utils/random.js';

// Aktif yetenekler: öğrenme/yükseltme, bekleme süreleri, süreli bufflar, otomatik kullanım.
// Bekleme süreleri ve aktif bufflar kaydedilmez (çalışma anı durumu).
export class SkillSystem {
  constructor(game) {
    this.game = game;
    this.cooldowns = Object.fromEntries(SKILLS.map((s) => [s.id, 0]));
    this.buffs = {}; // id → kalan süre
    game.bus.on(Events.PLAYER_DIED, () => this.clearBuffs());
    game.bus.on(Events.PRESTIGE, () => this.clearBuffs());
    game.bus.on(Events.TREE_CHANGED, () => this.grantTreeSkills());
  }

  /** Ruh Ağacı'ndan açılan yeteneklere 1. seviyeyi bedava verir. */
  grantTreeSkills() {
    for (const skill of SKILLS) {
      if (skill.tree && this.isUnlocked(skill) && this.level(skill.id) === 0) {
        this.state.skills[skill.id] = 1;
        this.game.bus.emit(Events.SKILLS_CHANGED, { id: skill.id, level: 1 });
      }
    }
  }

  /** Ruh Ağacı "Büyü Gücü" uygulanmış etki değeri */
  power(skill, level = this.level(skill.id)) {
    return skill.value(level) * (1 + this.game.tree.perk('skillPower') / 100);
  }

  /** Ruh Ağacı "Büyü Akışı" uygulanmış bekleme süresi */
  cooldownOf(skill) {
    return skill.cooldown * (1 - this.game.tree.perk('skillCooldown') / 100);
  }

  get state() {
    return this.game.state;
  }

  level(id) {
    return this.state.skills[id] || 0;
  }

  /** Ağaç yetenekleri düğümle, diğerleri en iyi bölgeyle açılır */
  isUnlocked(skill) {
    if (skill.tree) return this.game.tree.isSkillUnlocked(skill.id);
    return this.state.bestStage >= skill.unlockStage;
  }

  isMaxed(skill) {
    return this.level(skill.id) >= skill.maxLevel;
  }

  cost(skill) {
    return skillCost(skill, this.level(skill.id));
  }

  canUpgrade(skill) {
    return this.isUnlocked(skill) && !this.isMaxed(skill) && this.state.gold >= this.cost(skill);
  }

  upgrade(id) {
    const skill = SKILL_MAP[id];
    if (!skill || !this.isUnlocked(skill) || this.isMaxed(skill)) return false;
    if (!this.game.economy.spend(this.cost(skill))) return false;
    this.state.skills[id] = this.level(id) + 1;
    this.game.bus.emit(Events.SKILLS_CHANGED, { id, level: this.level(id) });
    if (this.buffs[id]) this.game.bus.emit(Events.BUFFS_CHANGED, this.buffs);
    return true;
  }

  setAuto(id, value) {
    this.state.skillAuto[id] = value;
    this.game.bus.emit(Events.SKILLS_CHANGED, { id });
  }

  cooldownRatio(skill) {
    return Math.max(0, Math.min(1, this.cooldowns[skill.id] / this.cooldownOf(skill)));
  }

  buffRemaining(id) {
    return this.buffs[id] ?? 0;
  }

  isReady(skill) {
    return this.level(skill.id) > 0 && this.cooldowns[skill.id] <= 0 && !this.game.player.dead;
  }

  /** Aktif buffların stat katkısı — StatsSystem okur. */
  activeModifiers() {
    const mods = {};
    for (const id of Object.keys(this.buffs)) {
      const skill = SKILL_MAP[id];
      mods[skill.buffStat] = (mods[skill.buffStat] || 0) + this.power(skill);
    }
    return mods;
  }

  activeBuffSkills() {
    return Object.keys(this.buffs).map((id) => SKILL_MAP[id]);
  }

  update(dt) {
    for (const id of Object.keys(this.cooldowns)) {
      if (this.cooldowns[id] > 0) this.cooldowns[id] = Math.max(0, this.cooldowns[id] - dt);
    }
    let expired = false;
    for (const id of Object.keys(this.buffs)) {
      this.buffs[id] -= dt;
      if (this.buffs[id] <= 0) {
        delete this.buffs[id];
        expired = true;
      }
    }
    if (expired) this.game.bus.emit(Events.BUFFS_CHANGED, this.buffs);

    for (const skill of SKILLS) {
      if (this.state.skillAuto[skill.id] && this.isReady(skill) && this.shouldAutoCast(skill)) this.cast(skill.id);
    }
  }

  shouldAutoCast(skill) {
    const { player, combat } = this.game;
    switch (skill.kind) {
      case 'heal':
        return player.hpRatio < 0.5;
      case 'buff':
        return !!combat.engaged && !this.buffs[skill.id];
      default:
        return !!combat.engaged;
    }
  }

  /** @returns {boolean} yetenek kullanıldı mı */
  cast(id) {
    const skill = SKILL_MAP[id];
    if (!skill || !this.isReady(skill)) return false;
    const { player, combat, bus } = this.game;
    const value = this.power(skill);

    if (skill.kind === 'strike' || skill.kind === 'meteor') {
      const target = combat.engaged;
      if (!target) return false;
      const stats = this.game.stats.get();
      const crit = chance(stats.critChance);
      if (skill.kind === 'strike') player.attackAnim = 1;
      else target.stunTimer = skill.stun;
      combat.dealDamage(target, stats.atk * value * (crit ? stats.critMult : 1), crit, skill.id);
    } else if (skill.kind === 'buff') {
      this.buffs[id] = skill.duration;
      bus.emit(Events.BUFFS_CHANGED, this.buffs);
    } else if (skill.kind === 'heal') {
      if (player.hp >= player.maxHp) return false;
      player.heal((player.maxHp * value) / 100);
    }

    this.cooldowns[id] = this.cooldownOf(skill);
    this.state.stats.skillsCast++;
    bus.emit(Events.SKILL_CAST, { skill, value });
    return true;
  }

  clearBuffs() {
    if (!Object.keys(this.buffs).length) return;
    this.buffs = {};
    this.game.bus.emit(Events.BUFFS_CHANGED, this.buffs);
  }
}
