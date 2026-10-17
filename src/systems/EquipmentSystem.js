import { Events } from '../core/events.js';
import { SLOT_ORDER } from '../data/items.js';
import { itemRating, itemSellValue } from './ItemFactory.js';

export class EquipmentSystem {
  constructor(game) {
    this.game = game;
  }

  get slots() {
    return this.game.state.equipment;
  }

  getEquipped(slot) {
    return this.slots[slot] ?? null;
  }

  isUnlocked(slot) {
    return this.game.tree.isSlotUnlocked(slot);
  }

  /** Envanterdeki eşyayı kuşanır; eski eşya aynı yuvaya geri döner (takas). */
  equipFromInventory(index) {
    const inv = this.game.state.inventory;
    const item = inv[index];
    if (!item) return false;
    if (!this.isUnlocked(item.slot)) {
      this.game.bus.emit(Events.TOAST, { text: 'Bu yuva kilitli. Ruh Ağacı\'ndan açılır 🔒', type: 'error' });
      return false;
    }
    const previous = this.slots[item.slot];
    this.slots[item.slot] = item;
    const kinds = this.game.state.stats.weaponKinds;
    if (item.kind && !kinds.includes(item.kind)) kinds.push(item.kind);
    inv[index] = previous ?? null;
    this.game.bus.emit(Events.INVENTORY_CHANGED, inv);
    this.game.bus.emit(Events.EQUIPMENT_CHANGED, { slot: item.slot, item, previous });
    return true;
  }

  /** Her yuva için envanterdeki en güçlü eşyayı kuşanır. @returns {number} değişen yuva sayısı */
  equipBest() {
    const inv = this.game.state.inventory;
    const ref = this.game.state.stage;
    let changed = 0;
    for (const slot of SLOT_ORDER) {
      if (!this.isUnlocked(slot)) continue;
      const current = this.slots[slot];
      let bestIndex = -1;
      let bestScore = current ? itemRating(current, ref) * 1.02 : -1;
      inv.forEach((item, i) => {
        if (!item || item.slot !== slot) return;
        const score = itemRating(item, ref);
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      });
      if (bestIndex >= 0 && this.equipFromInventory(bestIndex)) changed++;
    }
    return changed;
  }

  /** Kilitli yuvalarda kalmış eşyaları (eski kayıtlar) envantere taşır; yer yoksa satar. */
  enforceLockedSlots() {
    const inv = this.game.state.inventory;
    for (const slot of SLOT_ORDER) {
      const item = this.slots[slot];
      if (!item || this.isUnlocked(slot)) continue;
      const index = inv.indexOf(null);
      if (index >= 0) inv[index] = item;
      else this.game.economy.addGold(itemSellValue(item), false);
      this.slots[slot] = null;
    }
  }

  unequip(slot) {
    const item = this.slots[slot];
    if (!item) return false;
    const inv = this.game.state.inventory;
    const index = inv.indexOf(null);
    if (index < 0) {
      this.game.bus.emit(Events.TOAST, { text: 'Envanter dolu!', type: 'error' });
      return false;
    }
    inv[index] = item;
    this.slots[slot] = null;
    this.game.bus.emit(Events.INVENTORY_CHANGED, inv);
    this.game.bus.emit(Events.EQUIPMENT_CHANGED, { slot, item: null, previous: item });
    return true;
  }
}
