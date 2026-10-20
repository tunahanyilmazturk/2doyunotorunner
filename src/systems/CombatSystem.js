import { Balance } from '../config/balance.js';
import { PLAYER_ATTACK_RANGE, RESPAWN_TIME } from '../config/constants.js';
// (menzilli saldırılar sınıfın attack.range değerini kullanır; bkz. data/classes.js)
import { Events } from '../core/events.js';
import { chance, rand } from '../utils/random.js';
import { blessingHeal, burstMultiplier, executeMultiplier, incomingMultiplier } from './classPerks.js';

// Temas tespiti, karşılıklı saldırılar, ölüm ve yeniden doğma.
export class CombatSystem {
  constructor(game) {
    this.game = game;
    /** Şu an temas halinde olunan canavar (yoksa null) — yetenekler kullanır */
    this.engaged = null;
    /** Oyuncunun yaptığı saldırı sayısı (sınıf imzası "her n. vuruş" için) */
    this.attackCount = 0;
  }

  /** Aktif sınıfın imza yeteneği (yoksa undefined). */
  get signature() {
    return this.game.classes?.active?.signature;
  }

  update(dt) {
    const { player, world } = this.game;
    const stats = this.game.stats.get();
    const monster = this.game.spawn.current;

    this.engaged = null;
    if (player.dead) {
      world.scrolling = false;
      player.respawnTimer -= dt;
      if (player.respawnTimer <= 0) {
        player.reset(stats);
        this.game.bus.emit(Events.PLAYER_RESPAWNED);
      }
      return;
    }

    player.heal(stats.regen * dt);

    let engaged = false;
    if (monster && !monster.dead) {
      // Menzilli sınıflar daha uzaktan vurur; canavar yine de temas mesafesine kadar yürür
      if (this.gapTo(monster) <= this.attackRange()) {
        engaged = true;
        monster.state = 'fight';
      }
    }

    world.scrolling = !engaged;
    player.state = engaged ? 'fight' : 'run';
    player.attackCooldown = Math.max(0, player.attackCooldown - dt);

    if (!engaged) return;
    this.engaged = monster;

    if (player.attackCooldown <= 0) {
      this.playerAttack(monster, stats);
      player.attackCooldown = 1 / stats.attackSpeed;
    }

    // Canavar yalnızca yakın dövüşte vurur (menzilli oyuncuya uzaktan saldırmaz)
    if (!monster.dead && monster.stunTimer <= 0 && this.gapTo(monster) <= PLAYER_ATTACK_RANGE) {
      monster.attackCooldown -= dt;
      if (monster.attackCooldown <= 0) {
        this.monsterAttack(monster, stats);
        monster.attackCooldown = 1 / monster.atkSpeed;
      }
    }
  }

  /** Aktif sınıfın saldırı tarzı (melee varsayılan). */
  get attackStyle() {
    return this.game.classes?.active?.attack ?? { style: 'melee', anim: 'swing' };
  }

  attackRange() {
    return this.attackStyle.style === 'ranged' ? this.attackStyle.range : PLAYER_ATTACK_RANGE;
  }

  /** Oyuncunun uç noktasından canavarın sol kenarına kadar yatay boşluk. */
  gapTo(monster) {
    return monster.left - (this.game.player.x + 22);
  }

  playerAttack(monster, stats) {
    const crit = chance(stats.critChance);
    this.attackCount++;
    const sig = this.signature;
    const damage = stats.atk * rand(0.9, 1.1) * (crit ? stats.critMult : 1)
      * burstMultiplier(sig, this.attackCount) * executeMultiplier(sig, monster.hpRatio);
    const { player } = this.game;
    player.attackAnim = 1;
    const style = this.attackStyle;
    if (style.style === 'ranged') {
      // Menzilli: hasar mermi varınca uygulanır (ok ya da büyü)
      const from = { x: player.x + 30, y: player.y - 44 };
      this.game.projectiles.fire(from, monster, style, () => this.dealDamage(monster, damage, crit, 'projectile'));
      return;
    }
    this.dealDamage(monster, damage, crit);
  }

  /** Normal saldırı, yetenek ve diken hasarının ortak yolu (boss bonusu, direnç, can çalma, olaylar). */
  dealDamage(monster, damage, crit, source = 'attack') {
    if (!monster || monster.dead) return;
    const { player, bus, state } = this.game;
    const stats = this.game.stats.get();
    if (monster.isBoss) damage *= stats.bossDmgMult;
    damage *= monster.damageTaken; // örn. Zırhlı elitler daha az hasar alır
    monster.takeDamage(damage);
    if (damage > state.stats.maxHit) state.stats.maxHit = damage;
    if (stats.lifesteal > 0) player.heal(damage * stats.lifesteal);
    if (source === 'attack' || source === 'projectile') player.heal(blessingHeal(this.signature, player.maxHp));

    bus.emit(Events.DAMAGE_DEALT, { target: monster, amount: damage, crit, source });
    if (monster.dead) bus.emit(Events.MONSTER_KILLED, { monster });
  }

  monsterAttack(monster, stats) {
    const { player, bus, state } = this.game;
    monster.attackAnim = 1;
    const heavy = monster.nextIsHeavy;
    monster.attackCount++;
    if (monster.nextIsHeavy) bus.emit(Events.HEAVY_WARNING, { monster });
    if (chance(stats.dodgeChance)) {
      state.stats.dodges++;
      bus.emit(Events.PLAYER_DODGED, { source: monster });
      return;
    }
    const reduction = Balance.armorReduction(stats.armor, state.stage) * (heavy ? Balance.heavyArmorFactor : 1);
    let damage = monster.atk * rand(0.9, 1.1) * (heavy ? monster.heavyMult : 1) * (1 - reduction);
    const sig = this.signature;
    if (sig?.id === 'block') damage *= incomingMultiplier(sig, chance(sig.chance));

    player.takeDamage(damage);
    if (monster.lifesteal) monster.heal(damage * monster.lifesteal);
    bus.emit(Events.PLAYER_HIT, { amount: damage, source: monster, heavy });
    if (stats.thorns > 0 && !player.dead) this.dealDamage(monster, stats.atk * stats.thorns, false, 'thorns');

    if (player.dead) {
      player.state = 'dead';
      this.game.projectiles.clear(); // uçan oklar ve büyüler düşer
      player.respawnTimer = RESPAWN_TIME;
      state.stats.deaths++;
      bus.emit(Events.PLAYER_DIED, { killer: monster });
    }
  }
}
