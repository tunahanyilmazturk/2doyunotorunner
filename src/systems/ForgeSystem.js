import { Balance } from '../config/balance.js';
import { Events } from '../core/events.js';
import { itemMaxEnhance } from './ItemFactory.js';

// Demirci: kuşanılan eşyaları altınla güçlendirir (+1, +2 ...).
// Güçlendirme her zaman başarılıdır; maksimum seviye eşyanın nadirliğine bağlıdır.
export class ForgeSystem {
  constructor(game) {
    this.game = game;
  }

  cost(item) {
    return Balance.enhanceCost(item);
  }

  isMaxed(item) {
    return (item.enhance || 0) >= itemMaxEnhance(item);
  }

  canEnhance(item) {
    return !!item && !this.isMaxed(item) && this.game.state.gold >= this.cost(item);
  }

  enhance(slot) {
    const item = this.game.state.equipment[slot];
    if (!item || this.isMaxed(item)) return false;
    if (!this.game.economy.spend(this.cost(item))) {
      this.game.bus.emit(Events.TOAST, { text: 'Yeterli altın yok!', type: 'error' });
      return false;
    }
    item.enhance = (item.enhance || 0) + 1;
    const stats = this.game.state.stats;
    stats.maxEnhance = Math.max(stats.maxEnhance, item.enhance);
    this.game.bus.emit(Events.ITEM_ENHANCED, { item, slot });
    return true;
  }
}
