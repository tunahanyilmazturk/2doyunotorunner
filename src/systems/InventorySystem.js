import { BAG_EXPANSION_SLOTS, INVENTORY_SIZE, MAX_BAG_EXPANSIONS } from '../config/constants.js';
import { Balance } from '../config/balance.js';
import { Events } from '../core/events.js';
import { SLOT_ORDER } from '../data/items.js';
import { isUpgradeOver, itemRating, itemSellValue } from './ItemFactory.js';

/** Sıralama modları: "Sırala" düğmesi ve sıralama seçicisi bu anahtarları kullanır */
export const SORT_MODES = {
  slot: 'Yuva',
  tier: 'Nadirlik',
  level: 'Seviye',
  value: 'Değer',
  rating: 'Güç',
};

export class InventorySystem {
  constructor(game) {
    this.game = game;
    game.bus.on(Events.TREE_CHANGED, () => this.syncCapacity());
  }

  /** Taban boyut + Ruh Ağacı'ndaki "Geniş Çanta" + satın alınan genişletmeler (sadece büyür) */
  get capacity() {
    return INVENTORY_SIZE + this.game.tree.perk('inventorySlots') + this.expansions * BAG_EXPANSION_SLOTS;
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

  // ---------- Çanta genişletme ----------

  get expansions() {
    return this.game.state.bagExpansions ?? 0;
  }

  /** Bir sonraki genişletmenin altın fiyatı: bölgeye göre ölçeklenir, her alımda artar. */
  get expansionCost() {
    return Math.ceil(Balance.itemValue(this.game.state.runMaxStage, 1) * 60 * Math.pow(1.5, this.expansions));
  }

  canExpand() {
    return this.expansions < MAX_BAG_EXPANSIONS && this.game.state.gold >= this.expansionCost;
  }

  /** Çantayı +BAG_EXPANSION_SLOTS yuva genişletir. */
  expand() {
    if (this.expansions >= MAX_BAG_EXPANSIONS) return false;
    if (!this.game.economy.spend(this.expansionCost)) return false;
    this.game.state.bagExpansions = this.expansions + 1;
    this.syncCapacity();
    this.game.bus.emit(Events.TOAST, { text: `🎒 Çanta +${BAG_EXPANSION_SLOTS} yuva genişledi`, type: 'success' });
    return true;
  }

  // ---------- Ekleme / çıkarma ----------

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
    this.game.runes?.reclaim(item); // takılı rünler çantaya döner
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

  /** Verilen yuvaları kilitler ya da açar. */
  setLocked(indices, locked) {
    for (const i of indices) if (this.items[i]) this.items[i].locked = locked;
    this.changed();
  }

  // ---------- Koruma ve toplu satış ----------

  /**
   * Oto-sat ve toplu satışın dokunmadığı eşya:
   * kilitli, set parçası, kuşanılandan daha iyi (▲) ya da boş yuvanın ihtiyacı olan eşya,
   * ve açık başka bir sınıfa ait silah/zırh.
   */
  isProtected(item) {
    if (item.locked || item.set) return true;
    const classes = this.game.classes;
    if (classes && !classes.canUse(item)) return classes.isReservedForOther(item);
    return this.game.tree.isSlotUnlocked(item.slot) && isUpgradeOver(item, this.game.state.equipment[item.slot], this.game.state.stage);
  }

  /** Oto-sat ve toplu satış için: en fazla maxTier nadirlikteki satılabilir eşyaların planı. */
  planSellUpTo(maxTier) {
    const indices = [];
    let gold = 0;
    let kept = 0;
    this.items.forEach((item, i) => {
      if (!item || item.tier > maxTier) return;
      if (this.isProtected(item)) {
        kept++;
        return;
      }
      indices.push(i);
      gold += itemSellValue(item);
    });
    return { indices, gold, kept };
  }

  /** Belirtilen nadirlik seviyesine kadar korunmayan tüm eşyaları satar. */
  sellAllUpTo(maxTier) {
    const plan = this.planSellUpTo(maxTier);
    if (!plan.indices.length) return { count: 0, gold: 0, kept: plan.kept };
    const sold = plan.indices.map((i) => this.items[i]);
    for (const i of plan.indices) {
      this.game.runes?.reclaim(this.items[i]);
      this.items[i] = null;
    }
    this.game.economy.addGold(plan.gold, false);
    this.game.bus.emit(Events.ITEM_SOLD, { items: sold, gold: plan.gold });
    this.changed();
    return { count: sold.length, gold: plan.gold, kept: plan.kept };
  }

  /** Seçili yuvaları satar; kilitliler atlanır (kullanıcı açıkça seçtiği için koruma uygulanmaz). */
  planSellIndices(indices) {
    const valid = indices.filter((i) => this.items[i] && !this.items[i].locked);
    return { indices: valid, gold: valid.reduce((sum, i) => sum + itemSellValue(this.items[i]), 0) };
  }

  sellIndices(indices) {
    const plan = this.planSellIndices(indices);
    if (!plan.indices.length) return { count: 0, gold: 0 };
    const sold = plan.indices.map((i) => this.items[i]);
    for (const i of plan.indices) {
      this.game.runes?.reclaim(this.items[i]);
      this.items[i] = null;
    }
    this.game.economy.addGold(plan.gold, false);
    this.game.bus.emit(Events.ITEM_SOLD, { items: sold, gold: plan.gold });
    this.changed();
    return { count: sold.length, gold: plan.gold };
  }

  // ---------- Sıralama ----------

  /** Eşyaları seçilen ölçüte göre sıralar (varsayılan: yuva, sonra nadirlik ve seviye). */
  sort(mode = 'slot') {
    const stage = this.game.state.stage;
    const bySlot = (a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot);
    const comparators = {
      slot: (a, b) => bySlot(a, b) || b.tier - a.tier || b.level - a.level,
      tier: (a, b) => b.tier - a.tier || b.level - a.level || bySlot(a, b),
      level: (a, b) => b.level - a.level || b.tier - a.tier || bySlot(a, b),
      value: (a, b) => b.value - a.value || bySlot(a, b),
      rating: (a, b) => itemRating(b, stage) - itemRating(a, stage) || bySlot(a, b),
    };
    const cmp = comparators[mode] ?? comparators.slot;
    const sorted = this.items.filter(Boolean).sort(cmp);
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
