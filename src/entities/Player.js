import { Entity } from './Entity.js';
import { GROUND_Y, PLAYER_X } from '../config/constants.js';

export class Player extends Entity {
  constructor() {
    super(PLAYER_X, GROUND_Y);
    this.state = 'run'; // run | fight | dead
    this.attackCooldown = 0;
    this.attackAnim = 0; // 1 → 0 kılıç savurma
    this.runCycle = 0;
    this.respawnTimer = 0;
    this.deathTime = 0;
  }

  /** Statlar değişince can oranını koruyarak maksimum canı günceller. */
  applyStats(stats) {
    const ratio = this.maxHp > 0 ? this.hp / this.maxHp : 1;
    this.maxHp = stats.maxHp;
    if (!this.dead) this.hp = Math.max(1, Math.min(this.maxHp, ratio * this.maxHp));
  }

  reset(stats) {
    this.maxHp = stats.maxHp;
    this.hp = this.maxHp;
    this.dead = false;
    this.state = 'run';
    this.attackCooldown = 0;
    this.attackAnim = 0;
    this.deathTime = 0;
  }

  update(dt, scrollSpeed) {
    super.update(dt);
    if (this.dead) {
      this.deathTime += dt;
      return;
    }
    this.runCycle += dt * (scrollSpeed / 26);
    if (this.attackAnim > 0) this.attackAnim = Math.max(0, this.attackAnim - dt * 4.5);
  }
}
