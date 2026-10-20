import { Entity } from './Entity.js';
import { GROUND_Y, SPRITE_SCALE } from '../config/constants.js';
import { Balance } from '../config/balance.js';
import { ELITE_TRAITS } from '../data/eliteTraits.js';
import { pick } from '../utils/random.js';

export class Monster extends Entity {
  /**
   * @param {object} def    data/monsters.js tanımı
   * @param {number} stage  bölge (ölçekleme için)
   * @param {{boss?:boolean, elite?:boolean, spawnX?:number}} opts
   */
  constructor(def, stage, { boss = false, elite = false, spawnX = 1000 } = {}) {
    super(spawnX, GROUND_Y);
    this.def = def;
    this.isBoss = boss;
    this.isElite = elite && !boss;
    this.name = def.name;
    this.level = stage;
    this.scale = (boss ? def.scale ?? 1.8 : this.isElite ? 1.25 : 1) * SPRITE_SCALE;
    this.size = def.size * this.scale;
    this.flying = def.shape === 'flyer';

    const hpMult = boss ? Balance.bossHpMult : this.isElite ? Balance.eliteHpMult : 1;
    const atkMult = boss ? Balance.bossAtkMult : this.isElite ? Balance.eliteAtkMult : 1;
    const goldMult = boss ? Balance.bossGoldMult : this.isElite ? Balance.eliteGoldMult : 1;
    // Kabus döngüsü çarpanları
    this.cycle = Balance.cycleOf(stage);
    this.maxHp = Balance.monsterHp(def.hp, stage) * hpMult * Balance.cycleHpMultiplier(stage);
    this.hp = this.maxHp;
    this.atk = Balance.monsterAtk(def.atk, stage) * atkMult * Balance.cycleAtkMultiplier(stage);
    this.gold = Balance.monsterGold(def.gold, stage) * goldMult * Balance.cycleGoldMultiplier(stage);
    this.atkSpeed = def.atkSpeed;
    this.speed = def.speed;
    this.damageTaken = 1; // alınan hasar çarpanı
    this.stunTimer = 0; // > 0 iken saldıramaz (Kıyamet Meteoru)
    // Ağır vuruş sayacı: her N. saldırı sert olur (0 = yok)
    this.heavyEvery = boss ? Balance.heavyEvery.boss : this.isElite ? Balance.heavyEvery.elite : 0;
    this.heavyMult = boss ? Balance.heavyMult.boss : Balance.heavyMult.elite;
    this.attackCount = 0;
    this.lifesteal = 0; // verdiği hasarın iyileştirdiği oranı

    // Elitler rastgele bir özellik taşır (data/eliteTraits.js)
    this.trait = null;
    if (this.isElite) {
      this.trait = pick(ELITE_TRAITS);
      this.trait.apply(this);
      this.name = `${this.trait.name} ${def.name}`;
    }

    this.state = 'approach'; // approach | fight
    this.attackCooldown = 0.6;
    this.attackAnim = 0;
    this.deathTimer = 0;
    this.seed = Math.random() * 100;
  }

  get left() {
    return this.x - this.size * 0.5;
  }

  /** Ekrandaki gövde merkezinin y'si (efektler için) */
  get centerY() {
    return this.y - this.size * 0.5 - (this.flying ? 50 : 0);
  }

  /** Bir sonraki saldırı ağır vuruş mu? (uyarı göstermek için) */
  get nextIsHeavy() {
    return this.heavyEvery > 0 && (this.attackCount + 1) % this.heavyEvery === 0;
  }

  get removable() {
    return this.dead && this.deathTimer > 0.45;
  }

  update(dt) {
    super.update(dt);
    if (this.attackAnim > 0) this.attackAnim = Math.max(0, this.attackAnim - dt * 4);
    if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
    if (this.dead) this.deathTimer += dt;
  }
}
