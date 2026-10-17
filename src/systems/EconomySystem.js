import { Events } from '../core/events.js';

export class EconomySystem {
  constructor(game) {
    this.game = game;
    this.earnedThisSecond = 0;
    this.secondTimer = 0;

    game.bus.on(Events.MONSTER_KILLED, ({ monster }) => {
      const amount = Math.max(1, Math.round(monster.gold * game.stats.get().goldMult));
      this.addGold(amount);
      game.bus.emit(Events.GOLD_GAINED, { amount, x: monster.x, y: monster.centerY - monster.size * 0.4 });
    });
  }

  get gold() {
    return this.game.state.gold;
  }

  /** @param {boolean} trackRate  saniyelik kazanç ortalamasına (çevrimdışı ödül) dahil edilsin mi */
  addGold(amount, trackRate = true) {
    const state = this.game.state;
    state.gold += amount;
    state.stats.totalGold += amount;
    if (trackRate) this.earnedThisSecond += amount;
    this.game.bus.emit(Events.GOLD_CHANGED, state.gold);
  }

  canAfford(cost) {
    return this.game.state.gold >= cost;
  }

  spend(cost) {
    if (!this.canAfford(cost)) return false;
    this.game.state.gold -= cost;
    this.game.bus.emit(Events.GOLD_CHANGED, this.game.state.gold);
    return true;
  }

  update(dt) {
    this.secondTimer += dt;
    if (this.secondTimer < 1) return;
    this.secondTimer -= 1;
    const stats = this.game.state.stats;
    // Üstel hareketli ortalama (~20 sn pencere)
    stats.goldPerSec = stats.goldPerSec * 0.95 + this.earnedThisSecond * 0.05;
    this.earnedThisSecond = 0;
  }
}
