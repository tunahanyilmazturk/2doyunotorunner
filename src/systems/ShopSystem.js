import { Balance } from '../config/balance.js';
import { MAX_POTIONS, SHOP_REFRESH_SECONDS, SHOP_SIZE } from '../config/constants.js';
import { Events } from '../core/events.js';
import { CHEST_MAP, ELIXIR_MAP, MAX_ELIXIR_SECONDS } from '../data/shop.js';
import { createItem } from './ItemFactory.js';

// Mağaza: gerçek zamanla yenilenen eşya vitrini, hazine sandıkları, can iksiri ve süreli iksirler.
// Tüm fiyatlara Ruh Ağacı "Pazarlıkçı" indirimi uygulanır.
export class ShopSystem {
  constructor(game) {
    this.game = game;
    this.checkTimer = 0;
  }

  get shop() {
    return this.game.state.shop;
  }

  get secondsToRefresh() {
    return Math.max(0, (this.shop.refreshAt - Date.now()) / 1000);
  }

  /** Ruh Ağacı "Pazarlıkçı" indirimi (fiyat çarpanı) */
  get discount() {
    return 1 - this.game.tree.perk('discount') / 100;
  }

  get refreshCost() {
    return Math.ceil(Balance.shopRefreshCost(this.game.state.runMaxStage) * this.discount);
  }

  get potionPrice() {
    return Math.ceil(Balance.potionCost(this.game.state.runMaxStage) * this.discount);
  }

  elixirPrice(e) {
    return Math.ceil(this.potionPrice * e.priceMult);
  }

  chestPrice(c) {
    return Math.ceil(Balance.itemValue(this.game.state.runMaxStage, 1) * c.priceMult * this.discount);
  }

  buyElixir(id) {
    const e = ELIXIR_MAP[id];
    if (!e) return false;
    if (this.game.elixirs.remaining(id) >= MAX_ELIXIR_SECONDS) return this.toast('Bu iksirin süresi dolu', 'error');
    if (!this.game.economy.spend(this.elixirPrice(e))) return this.toast('Yeterli altın yok!', 'error');
    this.game.elixirs.drink(id);
    this.toast(`${e.icon} ${e.name} içildi`, 'success');
    return true;
  }

  /** Sandığı aç: en az belirli nadirlikte, açık yuvalardan birine eşya (otomatik satılmaz) */
  openChest(id) {
    const c = CHEST_MAP[id];
    const { state } = this.game;
    if (!c) return null;
    if (this.game.inventory.freeSlots === 0) return this.toast('Envanter dolu!', 'error') && null;
    if (!this.game.economy.spend(this.chestPrice(c))) return this.toast('Yeterli altın yok!', 'error') && null;
    const luck = this.game.stats.get().luck + c.luck;
    const item = createItem(state, { level: state.runMaxStage, luck, minTier: c.minTier, slots: this.game.tree.unlockedSlots() });
    this.game.loot.receive(item, { x: this.game.player.x, y: this.game.player.y - 90 }, { autoSell: false });
    this.game.bus.emit(Events.CHEST_OPENED, { chest: c, item });
    return item;
  }

  update(dt) {
    this.checkTimer -= dt;
    if (this.checkTimer > 0) return;
    this.checkTimer = 1;
    if (Date.now() >= this.shop.refreshAt) this.refresh();
  }

  refresh() {
    const { state } = this.game;
    const luck = this.game.stats.get().luck + Balance.shopLuckBonus;
    this.shop.items = Array.from({ length: SHOP_SIZE }, () => {
      const item = createItem(state, { level: state.runMaxStage, luck, slots: this.game.tree.unlockedSlots() });
      return { item, price: Math.ceil(item.value * Balance.shopPriceMult * this.discount), sold: false };
    });
    this.shop.refreshAt = Date.now() + SHOP_REFRESH_SECONDS * 1000;
    this.game.bus.emit(Events.SHOP_REFRESHED, this.shop);
  }

  manualRefresh() {
    if (!this.game.economy.spend(this.refreshCost)) return this.toast('Yeterli altın yok!', 'error');
    this.refresh();
  }

  buy(index) {
    const offer = this.shop.items[index];
    if (!offer || offer.sold) return false;
    if (this.game.inventory.freeSlots === 0) return this.toast('Envanter dolu!', 'error');
    if (!this.game.economy.spend(offer.price)) return this.toast('Yeterli altın yok!', 'error');
    this.game.inventory.add(offer.item);
    offer.sold = true;
    this.game.bus.emit(Events.SHOP_REFRESHED, this.shop);
    this.toast(`${offer.item.name} satın alındı`, 'success');
    return true;
  }

  buyPotions(count) {
    const { state } = this.game;
    count = Math.min(count, MAX_POTIONS - state.potions);
    if (count <= 0) return this.toast('İksir çantası dolu!', 'error');
    if (!this.game.economy.spend(this.potionPrice * count)) return this.toast('Yeterli altın yok!', 'error');
    state.potions += count;
    this.game.bus.emit(Events.POTIONS_CHANGED, state.potions);
    return true;
  }

  toast(text, type) {
    this.game.bus.emit(Events.TOAST, { text, type });
    return false;
  }
}
