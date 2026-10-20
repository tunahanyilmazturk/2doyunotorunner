import { Balance } from '../config/balance.js';
import { MAX_POTIONS, SHOP_REFRESH_SECONDS, SHOP_SIZE } from '../config/constants.js';
import { Events } from '../core/events.js';
import { CHEST_MAP, CHESTS, ELIXIRS, ELIXIR_MAP, MAX_ELIXIR_SECONDS, SPECIAL_ITEMS, SPECIAL_MAP } from '../data/shop.js';
import { dayKey } from '../data/quests.js';
import { createItem, itemRating } from './ItemFactory.js';
import { grantReward } from './rewards.js';

/** Günlük indirim yüzdesi: her gün mağazadaki tek bir ürün bu kadar ucuzlar */
export const DEAL_PERCENT = 25;

// Mağaza: gerçek zamanla yenilenen eşya vitrini, hazine sandıkları, iksirler ve özel ürünler.
// Tüm fiyatlara Ruh Ağacı "Pazarlıkçı" indirimi uygulanır; günün indirimi ayrıca üstüne biner.
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

  /**
   * Bugünün indirimli ürünü. Yerel güne göre sabit seçilir (kayıtta tutulmaz):
   * aynı gün herkes için aynı ürün, ertesi gün başka bir ürün.
   */
  get dailyDeal() {
    const pool = [
      ...ELIXIRS.map((e) => ({ kind: 'elixir', id: e.id })),
      ...CHESTS.map((c) => ({ kind: 'chest', id: c.id })),
      ...SPECIAL_ITEMS.map((s) => ({ kind: 'special', id: s.id })),
    ];
    let hash = 0;
    for (const ch of dayKey(Date.now())) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return { ...pool[hash % pool.length], percent: DEAL_PERCENT };
  }

  isDeal(kind, id) {
    const d = this.dailyDeal;
    return d.kind === kind && d.id === id;
  }

  dealPrice(kind, id, price) {
    return this.isDeal(kind, id) ? Math.ceil(price * (1 - DEAL_PERCENT / 100)) : price;
  }

  elixirPrice(e) {
    return this.dealPrice('elixir', e.id, Math.ceil(this.potionPrice * e.priceMult));
  }

  chestPrice(c) {
    return this.dealPrice('chest', c.id, Math.ceil(Balance.itemValue(this.game.state.runMaxStage, 1) * c.priceMult * this.discount));
  }

  specialPrice(s) {
    return this.dealPrice('special', s.id, Math.ceil(Balance.itemValue(this.game.state.runMaxStage, 1) * s.priceMult * this.discount));
  }

  /**
   * Vitrin eşyasının kuşanılana göre güç kazancı (0.2 = %20 daha güçlü).
   * Kuşanılan yoksa ya da eşya aynı slotta değilse null.
   */
  ratingGain(item) {
    const equipped = this.game.state.equipment[item.slot];
    if (!equipped) return null;
    const base = itemRating(equipped, this.game.state.stage);
    if (base <= 0) return null;
    return itemRating(item, this.game.state.stage) / base - 1;
  }

  buyElixir(id) {
    return this.buyElixirs(id, 1);
  }

  /** Bir veya daha fazla iksir içer; süre üst sınırına ulaşınca durur. */
  buyElixirs(id, count = 1) {
    const e = ELIXIR_MAP[id];
    if (!e) return false;
    const price = this.elixirPrice(e);
    if (this.game.state.gold < price * count) return this.toast('Yeterli altın yok!', 'error');
    let done = 0;
    for (let i = 0; i < count; i++) {
      if (this.game.elixirs.remaining(id) >= MAX_ELIXIR_SECONDS) break;
      if (!this.game.economy.spend(price)) break;
      this.game.elixirs.drink(id);
      done++;
    }
    if (!done) return this.toast('Bu iksirin süresi dolu', 'error');
    this.toast(`${e.icon} ${e.name}${done > 1 ? ` ×${done}` : ''} içildi`, 'success');
    return true;
  }

  /** Sandığı aç: en az belirli nadirlikte, açık yuvalardan birine eşya (otomatik satılmaz) */
  /** @param {{free?:boolean}} opts free: ödül sandığı (altın harcanmaz; envanter doluysa eşya satılır) */
  openChest(id, { free = false } = {}) {
    const c = CHEST_MAP[id];
    const { state } = this.game;
    if (!c) return null;
    if (!free && this.game.inventory.freeSlots === 0) return this.toast('Envanter dolu!', 'error') && null;
    if (!free && !this.game.economy.spend(this.chestPrice(c))) return this.toast('Yeterli altın yok!', 'error') && null;
    const luck = this.game.stats.get().luck + c.luck;
    const item = createItem(state, { level: state.runMaxStage, luck, minTier: c.minTier, slots: this.game.tree.unlockedSlots() });
    this.game.loot.receive(item, { x: this.game.player.x, y: this.game.player.y - 90 }, { autoSell: false });
    this.game.bus.emit(Events.CHEST_OPENED, { chest: c, item });
    return item;
  }

  /** Birden çok sandık açar; altın ya da yer bitince durur. @returns {number} açılan sandık sayısı */
  openChests(id, count = 1) {
    let opened = 0;
    for (let i = 0; i < count; i++) {
      if (!this.openChest(id)) break;
      opened++;
    }
    return opened;
  }

  /** Özel ürünü alır (ödül rewards.js ile verilir). */
  buySpecial(id, count = 1) {
    const s = SPECIAL_MAP[id];
    if (!s) return false;
    if (!this.game.economy.spend(this.specialPrice(s) * count)) return this.toast('Yeterli altın yok!', 'error');
    for (let i = 0; i < count; i++) grantReward(this.game, s.reward);
    this.toast(`${s.icon} ${s.name}${count > 1 ? ` ×${count}` : ''} alındı`, 'success');
    return true;
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
