import { Balance } from '../config/balance.js';
import { AUTO_POTION_THRESHOLD, POTION_COOLDOWN } from '../config/constants.js';
import { Events } from '../core/events.js';

export class PotionSystem {
  constructor(game) {
    this.game = game;
    this.cooldown = 0;
  }

  get cooldownRatio() {
    return Math.max(0, this.cooldown / POTION_COOLDOWN);
  }

  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    const { player, state } = this.game;
    const threshold = state.settings.potionThreshold ?? AUTO_POTION_THRESHOLD;
    if (state.settings.autoPotion && !player.dead && player.hpRatio < threshold) this.use();
  }

  use() {
    const { player, state, bus } = this.game;
    if (this.cooldown > 0 || state.potions <= 0 || player.dead || player.hp >= player.maxHp) return false;
    state.potions--;
    const amount = player.maxHp * Balance.potionHealPct;
    player.heal(amount);
    this.cooldown = POTION_COOLDOWN;
    bus.emit(Events.POTION_USED, { amount });
    bus.emit(Events.POTIONS_CHANGED, state.potions);
    return true;
  }
}
