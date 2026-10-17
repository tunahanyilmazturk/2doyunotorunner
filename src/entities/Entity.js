export class Entity {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 1;
    this.maxHp = 1;
    this.dead = false;
    this.hitFlash = 0;
    this.animTime = 0;
  }

  get hpRatio() {
    return this.maxHp > 0 ? this.hp / this.maxHp : 0;
  }

  takeDamage(amount) {
    if (this.dead) return;
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.12;
    if (this.hp <= 0) this.dead = true;
  }

  heal(amount) {
    if (this.dead) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  update(dt) {
    this.animTime += dt;
    if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt);
  }
}
