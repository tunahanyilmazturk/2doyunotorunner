import { INVENTORY_SIZE } from '../config/constants.js';
import { Events } from '../core/events.js';
import { SLOT_ORDER } from '../data/items.js';
import { itemSellValue } from './ItemFactory.js';

export class InventorySystem {
  constructor(game) {
    this.game = game;
    game.bus.on(Events.TREE_CHANGED, () => this.syncCapacity());
  }

  /** Taban boyut + Ruh Ağacı'ndaki "Geniş Çanta" kadar yuva (sadece büyür, eşya kaybolmaz) */
  get capacity() {
    return INVENTORY_SIZE + this.game.tree.perk('inventorySlots');
  }

  syncCapacity() {
    if (this.items.length >= this.capacity) return;
    while (this.items.length < this.capacity) this.items.push(null);
    this.changed();
  }

  get items() {
    return this.game.state.inventory;
  }

  get freeSlots() {
    return this.items.filter((i) => i === null).length;
  }

  get usedSlots() {
    return this.items.length - this.freeSlots;
  }

  /** @returns {number} eklenen yuva indeksi, doluysa -1 */
  add(item) {
    const index = this.items.indexOf(null);
    if (index < 0) return -1;
    this.items[index] = item;
    this.changed();
    return index;
  }

  removeAt(index) {
    const item = this.items[index];
    this.items[index] = null;
    this.changed();
    return item;
  }

  sellAt(index) {
    const item = this.items[index];
    if (!item) return 0;
    if (item.locked) {
      this.game.bus.emit(Events.TOAST, { text: 'Kilitli eşya satılamaz 🔒', type: 'error' });
      return 0;
    }
    const gold = itemSellValue(item);
    this.items[index] = null;
    this.game.economy.addGold(gold, false);
    this.game.bus.emit(Events.ITEM_SOLD, { items: [item], gold });
    this.changed();
    return gold;
  }

  toggleLock(index) {
    const item = this.items[index];
    if (!item) return;
    item.locked = !item.locked;
    this.changed();
  }

  /** Belirtilen nadirlik seviyesine kadar (dahil) kilitsiz tüm eşyaları satar. */
  sellAllUpTo(maxTier) {
    const sold = [];
    let gold = 0;
    this.items.forEach((item, i) => {
      if (item && !item.locked && item.tier <= maxTier) {
        sold.push(item);
        gold += itemSellValue(item);
        this.items[i] = null;
      }
    });
    if (!sold.length) return { count: 0, gold: 0 };
    this.game.economy.addGold(gold, false);
    this.game.bus.emit(Events.ITEM_SOLD, { items: sold, gold });
    this.changed();
    return { count: sold.length, gold };
  }

  sort() {
    const sorted = this.items
      .filter(Boolean)
      .sort(
        (a, b) =>
          SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot) || b.tier - a.tier || b.level - a.level
      );
    for (let i = 0; i < this.items.length; i++) this.items[i] = sorted[i] ?? null;
    this.changed();
  }

  /** Yeniden doğuş: çantadaki tüm eşyalar silinir (Ruh Ağacı yuvaları korunur). */
  clear() {
    this.items.fill(null);
    this.changed();
  }

  changed() {
    this.game.bus.emit(Events.INVENTORY_CHANGED, this.items);
  }
}
