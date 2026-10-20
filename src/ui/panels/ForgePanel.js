import { Balance } from '../../config/balance.js';
import { Events } from '../../core/events.js';
import { ITEM_BASES, SLOTS, SLOT_ORDER } from '../../data/items.js';
import { getRarity } from '../../data/rarities.js';
import { formatStatLine } from '../../data/stats.js';
import { getItemStats, itemDisplayName, itemMaxEnhance } from '../../systems/ItemFactory.js';
import { el } from '../../utils/dom.js';
import { formatNumber } from '../../utils/format.js';
import { createItemSlot } from '../components/ItemSlot.js';
import { RunesView } from './RunesView.js';

const PAGES = [
  { id: 'enhance', label: '🔨 Güçlendir' },
  { id: 'runes', label: '◆ Rünler' },
];

// Demirci: kuşanılan eşyaları güçlendir + rün yuvaları (iki alt sayfa).
export class ForgePanel {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.rows = [];
    this.page = 'enhance';
    this.runes = new RunesView(game, ui);
  }

  mount(root) {
    this.subnav = el(
      'div',
      { class: 'subnav' },
      PAGES.map((p) => el('button', { class: 'subnav-btn', dataset: { page: p.id }, text: p.label, onclick: () => this.showPage(p.id) }))
    );
    this.enhancePage = el('div', { class: 'forge-page' });
    this.runesPage = el('div', { class: 'forge-page' });
    root.append(this.subnav, this.enhancePage, this.runesPage);
    this.runes.mount(this.runesPage);

    this.list = el('div', { class: 'forge-list' });
    this.enhancePage.append(
      el('div', {
        class: 'muted forge-intro',
        text: `Kuşandığın eşyaları güçlendir: her seviye eşyanın tüm statlarına +%${Balance.enhanceStatPerLevel * 100} ekler. Maksimum seviye nadirliğe bağlıdır (Sıradan +5 … Mitik +15). Güçlendirilmiş eşyalar daha pahalıya satılır.`,
      }),
      this.list
    );
    const rebuild = () => this.build();
    this.game.bus.on(Events.EQUIPMENT_CHANGED, rebuild);
    this.game.bus.on(Events.ITEM_ENHANCED, rebuild);
    this.build();
    this.showPage(this.page);
  }

  showPage(id) {
    this.page = id;
    this.enhancePage.hidden = id !== 'enhance';
    this.runesPage.hidden = id !== 'runes';
    for (const b of this.subnav.children) b.classList.toggle('active', b.dataset.page === id);
    this.ui.tooltip.hide();
    this.tick();
  }

  build() {
    const { game, ui } = this;
    this.rows = SLOT_ORDER.map((slot) => {
      const item = game.state.equipment[slot];
      const row = { slot, item, btn: el('button', { class: 'btn btn-buy', onclick: () => game.forge.enhance(slot) }) };
      if (!item) {
        row.node = el('div', { class: 'forge-row empty' }, [
          createItemSlot(null, { ui, emptyIcon: SLOTS[slot].icon }),
          el('div', { class: 'muted', text: `${SLOTS[slot].name} kuşanılmamış` }),
        ]);
        return row;
      }
      const rarity = getRarity(item.tier);
      const primary = ITEM_BASES[slot].primary;
      const max = itemMaxEnhance(item);
      const now = getItemStats(item)[primary];
      const next = item.enhance < max ? getItemStats({ ...item, enhance: (item.enhance || 0) + 1 })[primary] : null;
      row.node = el('div', { class: 'forge-row', style: { '--rarity': rarity.color } }, [
        createItemSlot(item, { ui, tooltip: { equipment: game.state.equipment } }),
        el('div', { class: 'forge-info' }, [
          el('div', { class: 'shop-name', style: { color: rarity.color }, text: itemDisplayName(item) }),
          el('div', { class: 'forge-pips' }, Array.from({ length: max }, (_, i) => el('span', { class: i < (item.enhance || 0) ? 'on' : '' }))),
          el('div', { class: 'up-effect', html: next !== null ? `${formatStatLine(primary, now)} → <span class="up">${formatStatLine(primary, next)}</span>` : `${formatStatLine(primary, now)} (MAKS)` }),
        ]),
        row.btn,
      ]);
      return row;
    });
    this.list.replaceChildren(...this.rows.map((r) => r.node));
    this.tick();
  }

  tick() {
    if (this.page === 'runes') return this.runes.tick();
    const forge = this.game.forge;
    for (const r of this.rows) {
      if (!r.item) continue;
      if (forge.isMaxed(r.item)) {
        r.btn.textContent = 'MAKS';
        r.btn.disabled = true;
      } else {
        const cost = forge.cost(r.item);
        r.btn.textContent = `🔨 🪙 ${formatNumber(cost)}`;
        r.btn.disabled = this.game.state.gold < cost;
      }
    }
  }
}
