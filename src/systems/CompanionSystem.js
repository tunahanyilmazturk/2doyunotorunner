import { Events } from '../core/events.js';
import {
  COMPANIONS, COMPANION_MAP, COMPANION_RARITIES, EGG_HATCH_KILLS, MAX_COMPANION_LEVEL, MAX_EGGS,
  duplicateXp, passiveValue, powerMult, xpToNext,
} from '../data/companions.js';
import { chance, weightedPick } from '../utils/random.js';

const BOSS_EGG_CHANCE = 0.12;

// Yoldaşlar: yumurta/kuluçka, deneyim ve seviye, savaşta saldırı/iyileştirme, pasif bonus.
// Durum state.companions içinde kalıcıdır (yeniden doğuştan etkilenmez).
export class CompanionSystem {
  constructor(game) {
    this.game = game;
    this.timer = 0;
    /** Çizim için: son saldırıdan beri geçen animasyon (1 → 0) */
    this.attackAnim = 0;
    game.bus.on(Events.MONSTER_KILLED, ({ monster }) => this.onKill(monster));
  }

  get data() {
    return this.game.state.companions;
  }

  owned(id) {
    return this.data.owned[id] ?? null;
  }

  get ownedCount() {
    return Object.keys(this.data.owned).length;
  }

  /** Yanındaki yoldaşın tanımı + seviyesi (yoksa null) */
  get active() {
    const id = this.data.active;
    const own = id && this.owned(id);
    return own ? { def: COMPANION_MAP[id], ...own } : null;
  }

  setActive(id) {
    if (!this.owned(id)) return false;
    this.data.active = id;
    this.timer = 0;
    this.changed(true);
    return true;
  }

  addEggs(n) {
    this.data.eggs = Math.min(MAX_EGGS, this.data.eggs + n);
    if (this.data.incubating === null && this.data.eggs > 0) this.startIncubation();
    this.changed();
  }

  /** Bir yumurtayı kuluçkaya koyar (zaten kuluçka varsa hiçbir şey yapmaz). */
  startIncubation() {
    if (this.data.incubating !== null || this.data.eggs <= 0) return false;
    this.data.eggs--;
    this.data.incubating = 0;
    this.changed();
    return true;
  }

  get hatchProgress() {
    return this.data.incubating === null ? 0 : this.data.incubating / EGG_HATCH_KILLS;
  }

  onKill(monster) {
    // Deneyim: yanındaki yoldaş öğrenir
    const a = this.active;
    if (a) this.gainXp(a.def.id, monster.isBoss ? 12 : monster.isElite ? 4 : 1);
    // Kuluçka: her öldürme yumurtayı biraz daha çatlatır
    if (this.data.incubating !== null) {
      this.data.incubating += monster.isBoss ? 5 : 1;
      if (this.data.incubating >= EGG_HATCH_KILLS) this.hatch();
    }
    // Bosslar arada yumurta düşürür (kule bossları değil; onların ödülü ayrı)
    if (monster.isBoss && !monster.towerFloor && chance(BOSS_EGG_CHANCE)) {
      this.addEggs(1);
      this.game.bus.emit(Events.TOAST, { text: '🥚 Boss bir yumurta düşürdü!', type: 'loot' });
    }
  }

  gainXp(id, amount) {
    const own = this.owned(id);
    if (!own || own.level >= MAX_COMPANION_LEVEL) return;
    own.xp += amount;
    let leveled = false;
    while (own.level < MAX_COMPANION_LEVEL && own.xp >= xpToNext(own.level)) {
      own.xp -= xpToNext(own.level);
      own.level++;
      leveled = true;
    }
    if (own.level >= MAX_COMPANION_LEVEL) own.xp = 0;
    if (leveled) {
      this.game.bus.emit(Events.COMPANION_LEVELED, { def: COMPANION_MAP[id], level: own.level });
      this.changed(id === this.data.active);
    }
  }

  /** Kuluçkadaki yumurtayı çatlatır: yeni yoldaş ya da tekrar ise deneyim. */
  hatch(rng = Math.random) {
    const rarity = weightedPick(COMPANION_RARITIES, (r) => r.weight, rng);
    const pool = COMPANIONS.filter((c) => c.rarity === rarity.tier);
    const def = pool[Math.floor(rng() * pool.length)] ?? COMPANIONS[0];
    this.data.incubating = null;
    let isNew = false;
    if (this.owned(def.id)) {
      this.gainXp(def.id, duplicateXp(def));
    } else {
      this.data.owned[def.id] = { level: 1, xp: 0 };
      isNew = true;
      if (!this.data.active) this.data.active = def.id;
    }
    this.game.bus.emit(Events.COMPANION_HATCHED, { def, isNew });
    if (this.data.eggs > 0) this.startIncubation();
    this.changed(true);
    return { def, isNew };
  }

  /** Savaş: yanındaki yoldaş saldırır veya iyileştirir. */
  update(dt) {
    if (this.attackAnim > 0) this.attackAnim = Math.max(0, this.attackAnim - dt * 3);
    const a = this.active;
    const { player, combat } = this.game;
    if (!a || player.dead) return;
    const def = a.def;
    const act = def.attack ?? def.heal;
    if (!act) return;
    // Saldıranlar sadece temas varken, iyileştiren can eksikken çalışır
    const ready = def.attack ? !!combat.engaged : player.hp < player.maxHp;
    if (!ready) return;
    this.timer += dt;
    if (this.timer < act.interval) return;
    this.timer = 0;
    this.attackAnim = 1;
    const mult = powerMult(a.level);
    if (def.attack) {
      const stats = this.game.stats.get();
      combat.dealDamage(combat.engaged, stats.atk * def.attack.pct * mult, false, 'companion');
    } else {
      const amount = player.maxHp * def.heal.pct * mult;
      player.heal(amount);
      this.game.bus.emit(Events.COMPANION_HEALED, { amount });
    }
  }

  /** Yanındaki yoldaşın pasif stat bonusu */
  statBonuses() {
    const a = this.active;
    if (!a) return {};
    return { [a.def.passive.stat]: passiveValue(a.def, a.level) };
  }

  /** @param {boolean} statsChanged yanındaki yoldaş veya seviyesi değiştiyse */
  changed(statsChanged = false) {
    this.game.bus.emit(Events.COMPANIONS_CHANGED, { statsChanged });
  }
}
