import { Balance } from '../config/balance.js';
import { PLAYER_ATTACK_RANGE, RESPAWN_TIME } from '../config/constants.js';
import { Events } from '../core/events.js';
import { chance, rand } from '../utils/random.js';

// Temas tespiti, karşılıklı saldırılar, ölüm ve yeniden doğma.
export class CombatSystem {
  constructor(game) {
    this.game = game;
    /** Şu an temas halinde olunan canavar (yoksa null) — yetenekler kullanır */
    this.engaged = null;
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
      const gap = monster.left - (player.x + 22);
      if (gap <= PLAYER_ATTACK_RANGE) {
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

    if (!monster.dead && monster.stunTimer <= 0) {
      monster.attackCooldown -= dt;
      if (monster.attackCooldown <= 0) {
        this.monsterAttack(monster, stats);
        monster.attackCooldown = 1 / monster.atkSpeed;
      }
    }
  }

  playerAttack(monster, stats) {
    const crit = chance(stats.critChance);
    const damage = stats.atk * rand(0.9, 1.1) * (crit ? stats.critMult : 1);
    this.game.player.attackAnim = 1;
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
    const damage = monster.atk * rand(0.9, 1.1) * (heavy ? monster.heavyMult : 1) * (1 - reduction);

    player.takeDamage(damage);
    if (monster.lifesteal) monster.heal(damage * monster.lifesteal);
    bus.emit(Events.PLAYER_HIT, { amount: damage, source: monster, heavy });
    if (stats.thorns > 0 && !player.dead) this.dealDamage(monster, stats.atk * stats.thorns, false, 'thorns');

    if (player.dead) {
      player.state = 'dead';
      player.respawnTimer = RESPAWN_TIME;
      state.stats.deaths++;
      bus.emit(Events.PLAYER_DIED, { killer: monster });
    }
  }
}
