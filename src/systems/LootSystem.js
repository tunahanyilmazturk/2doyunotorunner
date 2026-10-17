import { Balance } from '../config/balance.js';
import { Events } from '../core/events.js';
import { chance } from '../utils/random.js';
import { createItem } from './ItemFactory.js';

export class LootSystem {
  constructor(game) {
    this.game = game;
    game.bus.on(Events.MONSTER_KILLED, ({ monster }) => this.onKill(monster));
  }

  onKill(monster) {
    const stats = this.game.stats.get();
    const luckMult = 1 + stats.luck / 100;
    let drops = 0;
    if (monster.isBoss) drops = 1 + (chance(0.25 * luckMult) ? 1 : 0);
    else if (chance(Balance.dropChance * luckMult * (monster.isElite ? Balance.eliteDropMult : 1))) drops = 1;
    if (drops && chance(this.game.tree.perk('doubleDrop') / 100)) drops++;
    const slots = this.game.tree.unlockedSlots();
    const minTier = monster.isBoss ? Balance.bossMinRarityTier : monster.isElite ? Balance.eliteMinRarityTier : 0;

    for (let i = 0; i < drops; i++) {
      const item = createItem(this.game.state, {
        level: monster.level,
        slots,
        luck: stats.luck,
        minTier,
      });
      this.receive(item, { x: monster.x, y: monster.centerY - i * 22 });
    }
  }

  /**
   * Düşen eşyayı otomatik satış ayarına ve envanter durumuna göre işler.
   * Set parçaları oto-satıştan MUAFTIR: koleksiyon eşyası istemeden kaybolmamalı.
   */
  receive(item, at, { autoSell = true } = {}) {
    const state = this.game.state;
    state.stats.itemsFound++;
    if (item.tier >= 4) state.stats.legendariesFound++;
    if (item.tier >= 5) state.stats.mythicsFound++;
    let autoSold = false;
    let full = false;

    if (autoSell && !item.set && item.tier <= state.settings.autoSellTier) {
      autoSold = true;
    } else if (this.game.inventory.add(item) < 0) {
      autoSold = true;
      full = true;
    }
    if (autoSold) this.game.economy.addGold(item.value, false);

    this.game.bus.emit(Events.LOOT_DROPPED, { item, x: at.x, y: at.y, autoSold, full });
  }
}
