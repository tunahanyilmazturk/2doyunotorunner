import { Balance } from '../../config/balance.js';
import { Events } from '../../core/events.js';
import { ITEM_BASES, SLOTS, SLOT_ORDER } from '../../data/items.js';
import { getRarity } from '../../data/rarities.js';
import { formatStatLine } from '../../data/stats.js';
import { getItemStats, itemDisplayName, itemMaxEnhance } from '../../systems/ItemFactory.js';
import { el } from '../../utils/dom.js';
import { formatNumber } from '../../utils/format.js';
import { createItemSlot } from '../components/ItemSlot.js';

// Demirci: kuşanılan eşyaları güçlendir.
export class ForgePanel {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.rows = [];
  }

  mount(root) {
    this.list = el('div', { class: 'forge-list' });
    root.append(
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
