import { Balance } from '../../config/balance.js';
import { Events } from '../../core/events.js';
import { getRarity } from '../../data/rarities.js';
import { CHESTS, ELIXIRS, GEM_ITEMS, SPECIAL_ITEMS } from '../../data/shop.js';
import { isUpgradeOver, itemDisplayName } from '../../systems/ItemFactory.js';
import { el } from '../../utils/dom.js';
import { formatNumber, formatPercent, formatTime } from '../../utils/format.js';
import { createItemSlot } from '../components/ItemSlot.js';

import { iconToken } from '../icons.js';

const PAGES = [
  { id: 'items', label: '🛡️ Eşyalar' },
  { id: 'chests', label: '🎁 Sandıklar' },
  { id: 'potions', label: '🧪 İksirler' },
  { id: 'specials', label: '✨ Özel' },
];
// Toplu alım adetleri: sandık, iksir ve özel ürün satın alımlarında seçilir
const QUANTITIES = [1, 5, 10];

// Mağaza: alt sekmeler (Eşyalar / Sandıklar / İksirler / Özel). Fiyatlar her tick'te güncellenir.
export class ShopPanel {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.page = 'items';
    this.qty = 1;
    this.offerButtons = [];
    this.chestRows = [];
    this.elixirRows = [];
    this.specialRows = [];
  }

  mount(root) {
    root.classList.add('shop-panel');
    this.subnav = el(
      'div',
      { class: 'subnav' },
      PAGES.map((p) => el('button', { class: 'subnav-btn', dataset: { page: p.id }, text: p.label, onclick: () => this.showPage(p.id) }))
    );
    this.qtyButtons = QUANTITIES.map((q) =>
      el('button', {
        class: 'btn btn-sm qty-btn',
        text: `×${q}`,
        title: `${q} adet satın al`,
        onclick: () => {
          this.qty = q;
          this.tick();
        },
      })
    );
    this.qtyBar = el('div', { class: 'qty-bar' }, [el('span', { class: 'muted', text: 'Adet:' }), ...this.qtyButtons]);
    this.pages = {
      items: this.buildItemsPage(),
      chests: this.buildChestsPage(),
      potions: this.buildPotionsPage(),
      specials: this.buildSpecialsPage(),
    };
    root.append(this.subnav, this.qtyBar, ...Object.values(this.pages));

    const { bus } = this.game;
    bus.on(Events.SHOP_REFRESHED, () => this.renderOffers());
    bus.on(Events.EQUIPMENT_CHANGED, () => this.renderOffers());
    bus.on(Events.TREE_CHANGED, () => this.renderOffers());
    bus.on(Events.SETTINGS_CHANGED, () => (this.autoPotion.checked = this.game.state.settings.autoPotion));
    bus.on(Events.CHEST_OPENED, ({ item }) => this.showChestResult(item));
    this.showPage(this.page);
    this.renderOffers();
  }

  showPage(id) {
    this.page = id;
    for (const [pid, node] of Object.entries(this.pages)) node.hidden = pid !== id;
    for (const b of this.subnav.children) b.classList.toggle('active', b.dataset.page === id);
    // Adet seçici yalnızca çoklu satın alınabilen sayfalarda anlamlı
    this.qtyBar.hidden = id === 'items';
    this.ui.tooltip.hide();
    this.tick();
  }

  // ---------- Eşyalar ----------
  buildItemsPage() {
    const shop = this.game.shop;
    this.countdown = el('span', { class: 'muted' });
    this.refreshBtn = el('button', { class: 'btn btn-sm', onclick: () => shop.manualRefresh() });
    this.offersGrid = el('div', { class: 'shop-grid' });
    return el('div', { class: 'shop-page' }, [
      el('div', { class: 'section-head' }, [
        el('span', { class: 'muted', text: 'Ulaştığın en yüksek bölgenin seviyesinde, yüksek şansla eşyalar. ▲ = kuşanılandan iyi (güç farkı yüzdesiyle).' }),
        el('div', { class: 'toolbar-group' }, [this.countdown, this.refreshBtn]),
      ]),
      this.offersGrid,
    ]);
  }

  renderOffers() {
    if (!this.offersGrid) return;
    const { game, ui } = this;
    const offers = game.state.shop.items;
    this.offerButtons = [];
    this.offersGrid.replaceChildren(
      ...offers.map((offer, i) => {
        const item = offer.item;
        const rarity = getRarity(item.tier);
        const locked = !game.tree.isSlotUnlocked(item.slot);
        const better = !locked && isUpgradeOver(item, game.state.equipment[item.slot], game.state.stage);
        const gain = locked ? null : game.shop.ratingGain(item);
        const btn = el('button', { class: 'btn btn-buy', onclick: () => game.shop.buy(i) });
        this.offerButtons.push({ btn, offer });
        return el('div', { class: `shop-card${offer.sold ? ' sold' : ''}`, style: { '--rarity': rarity.color } }, [
          createItemSlot(item, {
            ui,
            badge: locked ? '🔒' : better ? '▲' : null,
            tooltip: () => ({ equipped: game.state.equipment[item.slot], equipment: game.state.equipment, priceLabel: `Fiyat: 🪙 ${formatNumber(offer.price)}` }),
          }),
          el('div', { class: 'shop-card-info' }, [
            el('div', { class: 'shop-name', style: { color: rarity.color }, text: itemDisplayName(item) }),
            el('div', { class: 'muted', text: `${rarity.name} · Sv.${item.level}` }),
            gain !== null && gain > 0 ? el('div', { class: 'shop-gain', text: `▲ +${formatPercent(+(gain * 100).toFixed(0))} güç` }) : null,
          ]),
          btn,
        ]);
      })
    );
    this.tick();
  }

  // ---------- Sandıklar ----------
  buildChestsPage() {
    this.chestResult = el('div', { class: 'chest-result muted', text: 'Sandık açınca çıkan eşya burada görünür.' });
    const grid = el(
      'div',
      { class: 'chest-grid' },
      CHESTS.map((c) => {
        const btn = el('button', { class: 'btn btn-buy btn-block', onclick: () => this.game.shop.openChests(c.id, this.qty) });
        const deal = el('span', { class: 'deal-badge', text: '🏷️ İndirim', hidden: true });
        this.chestRows.push({ c, btn, deal });
        return el('div', { class: 'chest-card', style: { '--c': c.color } }, [
          deal,
          el('div', { class: 'chest-icon', text: iconToken(`chest-${c.id}`) }),
          el('b', { text: c.name }),
          el('div', { class: 'muted', text: c.desc }),
          btn,
        ]);
      })
    );
    return el('div', { class: 'shop-page' }, [grid, this.chestResult]);
  }

  showChestResult(item) {
    const rarity = getRarity(item.tier);
    this.chestResult.classList.remove('muted');
    this.chestResult.replaceChildren(
      el('span', { text: 'Sandıktan çıktı: ' }),
      createItemSlot(item, { ui: this.ui, tooltip: () => ({ equipped: this.game.state.equipment[item.slot], equipment: this.game.state.equipment }) }),
      el('b', { style: { color: rarity.color }, text: `${rarity.name} ${itemDisplayName(item)}` })
    );
    this.ui.toast.show(`🎁 ${rarity.name} ${item.name}`, item.tier >= 4 ? 'gold' : 'loot', 2200);
  }

  // ---------- İksirler ----------
  buildPotionsPage() {
    const { game } = this;
    const shop = game.shop;
    this.potionOwned = el('b');
    this.potionBuy1 = el('button', { class: 'btn btn-buy', onclick: () => shop.buyPotions(1) });
    this.potionBuy10 = el('button', { class: 'btn btn-buy', onclick: () => shop.buyPotions(10) });
    this.autoPotion = el('input', {
      type: 'checkbox',
      onchange: (e) => {
        game.state.settings.autoPotion = e.target.checked;
        game.bus.emit(Events.SETTINGS_CHANGED, game.state.settings);
      },
    });
    this.autoPotion.checked = game.state.settings.autoPotion;

    const healCard = el('div', { class: 'elixir-card', style: { '--c': '#d64045' } }, [
      el('div', { class: 'elixir-icon', text: '🧪' }),
      el('div', { class: 'elixir-info' }, [
        el('b', { text: 'Can İksiri' }),
        el('div', { class: 'muted', text: `Maks. canın %${Balance.potionHealPct * 100}'ını anında yeniler (F)` }),
        el('div', { class: 'muted' }, ['Sahip: ', this.potionOwned]),
        el('label', { class: 'check' }, [this.autoPotion, ' Can %35 altına inince otomatik iç']),
      ]),
      el('div', { class: 'elixir-actions' }, [this.potionBuy1, this.potionBuy10]),
    ]);

    const cards = ELIXIRS.map((e) => {
      const timer = el('div', { class: 'elixir-timer' });
      const deal = el('span', { class: 'deal-badge', text: '🏷️ İndirim', hidden: true });
      const btn = el('button', { class: 'btn btn-buy', onclick: () => game.shop.buyElixirs(e.id, this.qty) });
      this.elixirRows.push({ e, btn, timer, deal });
      return el('div', { class: 'elixir-card', style: { '--c': e.color } }, [
        deal,
        el('div', { class: 'elixir-icon', text: iconToken(`elixir-${e.id}`) }),
        el('div', { class: 'elixir-info' }, [
          el('b', { text: e.name }),
          el('div', { class: 'muted', text: `${e.desc}, ${formatTime(e.duration)}` }),
          timer,
        ]),
        el('div', { class: 'elixir-actions' }, [btn]),
      ]);
    });
    return el('div', { class: 'shop-page' }, [el('div', { class: 'elixir-grid' }, [healCard, ...cards])]);
  }

  // ---------- Özel ürünler ----------
  buildSpecialsPage() {
    const cards = SPECIAL_ITEMS.map((s) => {
      const deal = el('span', { class: 'deal-badge', text: '🏷️ İndirim', hidden: true });
      const btn = el('button', { class: 'btn btn-buy btn-block', onclick: () => this.game.shop.buySpecial(s.id, this.qty) });
      this.specialRows.push({ s, btn, deal });
      return el('div', { class: 'chest-card', style: { '--c': s.color } }, [
        deal,
        el('div', { class: 'chest-icon', text: s.icon }),
        el('b', { text: s.name }),
        el('div', { class: 'muted', text: s.desc }),
        btn,
      ]);
    });
    // Elmasla alınan ürünler: altın yerine elmas (bosslar, kule, görevler ve başarımlardan kazanılır)
    this.gemRows = GEM_ITEMS.map((g) => {
      const btn = el('button', { class: 'btn btn-buy btn-block', onclick: () => this.game.shop.buyGemItem(g.id) });
      return { g, btn, card: el('div', { class: 'chest-card gem-card', style: { '--c': g.color } }, [
        el('div', { class: 'chest-icon', text: g.icon }),
        el('b', { text: g.name }),
        el('div', { class: 'muted', text: g.desc }),
        btn,
      ]) };
    });
    return el('div', { class: 'shop-page' }, [
      el('div', { class: 'section-head' }, [el('span', { class: 'muted', text: 'Altınla alınan özel ürünler. Yumurta ve anahtar, boss ödüllerinin yerini tutmaz; fiyatları yüksektir.' })]),
      el('div', { class: 'chest-grid' }, cards),
      el('div', { class: 'section-head' }, [el('h4', { class: 'section-title', text: '💎 Elmasla' }), el('span', { class: 'muted', text: 'Elmas bosslardan, kuleden, hedeflerden ve başarımlardan gelir.' })]),
      el('div', { class: 'chest-grid' }, this.gemRows.map((r) => r.card)),
    ]);
  }

  /** Aktif sekmeyken düzenli çağrılır: fiyatlar, geri sayım, süreler */
  tick() {
    const { game } = this;
    const shop = game.shop;
    const gold = game.state.gold;
    const qty = this.qty;
    for (const b of this.qtyButtons) b.classList.toggle('active', Number(b.textContent.slice(1)) === qty);

    if (this.page === 'items') {
      this.countdown.textContent = `Yenilenme: ${formatTime(shop.secondsToRefresh)}`;
      this.refreshBtn.textContent = `🔄 Yenile · 🪙 ${formatNumber(shop.refreshCost)}`;
      this.refreshBtn.disabled = gold < shop.refreshCost;
      for (const { btn, offer } of this.offerButtons) {
        btn.textContent = offer.sold ? 'Satıldı' : `🪙 ${formatNumber(offer.price)}`;
        btn.disabled = offer.sold || gold < offer.price;
      }
    } else if (this.page === 'chests') {
      for (const { c, btn, deal } of this.chestRows) {
        const price = shop.chestPrice(c);
        btn.textContent = `Aç ×${qty} · 🪙 ${formatNumber(price * qty)}`;
        btn.disabled = gold < price;
        deal.hidden = !shop.isDeal('chest', c.id);
      }
    } else if (this.page === 'specials') {
      for (const { s, btn, deal } of this.specialRows) {
        const price = shop.specialPrice(s);
        btn.textContent = `Al ×${qty} · 🪙 ${formatNumber(price * qty)}`;
        btn.disabled = gold < price;
        deal.hidden = !shop.isDeal('special', s.id);
      }
      const gems = game.state.gems || 0;
      for (const { g, btn } of this.gemRows ?? []) {
        btn.textContent = `Al · 💎 ${g.gems}`;
        btn.disabled = gems < g.gems;
      }
    } else {
      const p = shop.potionPrice;
      this.potionOwned.textContent = game.state.potions;
      this.potionBuy1.textContent = `1 · 🪙 ${formatNumber(p)}`;
      this.potionBuy10.textContent = `10 · 🪙 ${formatNumber(p * 10)}`;
      this.potionBuy1.disabled = gold < p;
      this.potionBuy10.disabled = gold < p * 10;
      for (const { e, btn, timer, deal } of this.elixirRows) {
        const price = shop.elixirPrice(e);
        const left = game.elixirs.remaining(e.id);
        btn.textContent = `${left ? 'Uzat' : 'İç'} ×${qty} · 🪙 ${formatNumber(price * qty)}`;
        btn.disabled = gold < price;
        timer.textContent = left ? `Etkin: ${formatTime(left)} kaldı` : '';
        deal.hidden = !shop.isDeal('elixir', e.id);
      }
    }
  }
}
