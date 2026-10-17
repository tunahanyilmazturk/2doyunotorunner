import { Balance } from '../../config/balance.js';
import { Events } from '../../core/events.js';
import { SLOTS, SLOT_ORDER } from '../../data/items.js';
import { RARITIES, getRarity } from '../../data/rarities.js';
import { isUpgradeOver, itemDisplayName, itemSellValue } from '../../systems/ItemFactory.js';
import { el } from '../../utils/dom.js';
import { formatNumber, formatPercent } from '../../utils/format.js';
import { createItemSlot } from '../components/ItemSlot.js';

// Karakter sekmesi: Ekipman | Envanter | Statlar — eşya yönetimi tek ekranda.
export class CharacterPanel {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
  }

  mount(root) {
    const { game } = this;
    root.classList.add('character-layout');

    this.equipGrid = el('div', { class: 'equip-grid' });
    this.countEl = el('span', { class: 'inv-count' });
    this.grid = el('div', { class: 'inventory-grid' });
    this.statList = el('ul', { class: 'stat-list' });

    this.bulkSelect = el(
      'select',
      { class: 'select', title: 'Toplu satılacak en yüksek nadirlik' },
      RARITIES.slice(0, 5).map((r) => el('option', { value: r.tier, text: `≤ ${r.name}` }))
    );
    this.autoSellSelect = el(
      'select',
      {
        class: 'select',
        title: 'Düşen eşyalardan bu nadirlik ve altını otomatik satılır',
        onchange: (e) => {
          game.state.settings.autoSellTier = Number(e.target.value);
          game.bus.emit(Events.SETTINGS_CHANGED, game.state.settings);
        },
      },
      [el('option', { value: -1, text: 'Kapalı' }), ...RARITIES.slice(0, 4).map((r) => el('option', { value: r.tier, text: `≤ ${r.name}` }))]
    );

    root.append(
      el('div', { class: 'char-col equip-col' }, [
        el('h4', { class: 'section-title', text: '🛡️ Ekipman' }),
        this.equipGrid,
        el('button', { class: 'btn btn-sm btn-primary btn-block', text: '⚡ En İyileri Kuşan', onclick: () => this.equipBest() }),
      ]),
      el('div', { class: 'char-col inv-col' }, [
        el('div', { class: 'toolbar' }, [
          el('div', { class: 'toolbar-group' }, [this.countEl, el('button', { class: 'btn btn-sm', text: '↕ Sırala', onclick: () => game.inventory.sort() })]),
          el('div', { class: 'toolbar-group' }, [
            el('label', { text: 'Toplu Sat' }),
            this.bulkSelect,
            el('button', { class: 'btn btn-sm btn-warn', text: 'Sat', onclick: () => this.bulkSell() }),
          ]),
          el('div', { class: 'toolbar-group' }, [el('label', { text: 'Oto-Sat' }), this.autoSellSelect]),
        ]),
        this.grid,
        el('div', { class: 'hint', text: 'Sol tık: Kuşan · Sağ tık: Sat · Ctrl+tık: Kilitle 🔒 · ▲ daha iyi' }),
      ]),
      el('div', { class: 'char-col stats-col' }, [el('h4', { class: 'section-title', text: '📊 Statlar' }), this.statList])
    );

    const bus = game.bus;
    const items = () => {
      this.renderEquipment();
      this.renderInventory();
    };
    bus.on(Events.INVENTORY_CHANGED, items);
    bus.on(Events.EQUIPMENT_CHANGED, items);
    bus.on(Events.ITEM_ENHANCED, () => this.renderEquipment());
    bus.on(Events.TREE_CHANGED, items);
    bus.on(Events.STATS_CHANGED, () => this.renderStats());
    bus.on(Events.STAGE_CHANGED, () => this.renderStats());
    bus.on(Events.SETTINGS_CHANGED, () => (this.autoSellSelect.value = game.state.settings.autoSellTier));
    this.autoSellSelect.value = game.state.settings.autoSellTier;

    items();
    this.renderStats();
  }

  /** Menü rozeti: envanterde kuşanılandan daha iyi eşya sayısı */
  badge() {
    const { state } = this.game;
    return state.inventory.filter((it) => it && this.game.tree.isSlotUnlocked(it.slot) && isUpgradeOver(it, state.equipment[it.slot], state.stage)).length;
  }

  renderEquipment() {
    const { game, ui } = this;
    this.equipGrid.replaceChildren(
      ...SLOT_ORDER.map((slot) => {
        if (!game.tree.isSlotUnlocked(slot)) {
          const locked = createItemSlot(null, { ui, emptyIcon: SLOTS[slot].icon, onClick: () => ui.showTab('prestige') });
          locked.classList.add('slot-locked');
          locked.title = `${SLOTS[slot].name}: Ruh Ağacı'nda açılır`;
          return locked;
        }
        const item = game.state.equipment[slot];
        const node = createItemSlot(item, {
          ui,
          emptyIcon: SLOTS[slot].icon,
          tooltip: { hint: 'Tıkla: Çıkar' },
          onClick: () => game.equipment.unequip(slot),
        });
        if (!item) node.title = `${SLOTS[slot].name} (boş)`;
        return node;
      })
    );
  }

  renderInventory() {
    const { game, ui } = this;
    const inv = game.state.inventory;
    this.countEl.textContent = `🎒 ${game.inventory.usedSlots}/${inv.length}`;
    this.countEl.classList.toggle('full', game.inventory.freeSlots === 0);

    this.grid.replaceChildren(
      ...inv.map((item, i) => {
        if (!item) return createItemSlot(null, { ui });
        return createItemSlot(item, {
          ui,
          badge: !game.tree.isSlotUnlocked(item.slot) ? '🔒' : isUpgradeOver(item, game.state.equipment[item.slot], game.state.stage) ? '▲' : null,
          tooltip: () => ({ equipped: game.state.equipment[item.slot], hint: 'Sol: Kuşan · Sağ: Sat · Ctrl: Kilit' }),
          onClick: (e) => {
            if (e.ctrlKey || e.metaKey) game.inventory.toggleLock(i);
            else if (e.shiftKey) this.sell(i);
            else game.equipment.equipFromInventory(i);
          },
          onContext: () => this.sell(i),
        });
      })
    );
  }

  renderStats() {
    const s = this.game.stats.get();
    const reduction = Balance.armorReduction(s.armor, this.game.state.stage) * 100;
    const pct = (v) => formatPercent(+(v * 100).toFixed(1));
    // Sıfır olan özel statlar gizlenir; böylece liste kısa kalır
    const rows = [
      ['⚔️ Saldırı', formatNumber(s.atk)],
      ['❤️ Can', formatNumber(s.maxHp)],
      ['🛡️ Zırh', `${formatNumber(s.armor)} (−${reduction.toFixed(0)}%)`],
      ['💨 Saldırı Hızı', `${s.attackSpeed.toFixed(2)}/sn`],
      ['🎯 Kritik', `${pct(s.critChance)} · x${s.critMult.toFixed(2)}`],
      ['💚 Yenilenme', `${formatNumber(s.regen)}/sn`],
      s.lifesteal > 0 && ['🩸 Can Çalma', pct(s.lifesteal)],
      s.dodgeChance > 0 && ['🌀 Kaçınma', pct(s.dodgeChance)],
      s.thorns > 0 && ['🌵 Diken', pct(s.thorns)],
      s.bossDmgMult > 1 && ['👑 Boss Hasarı', `x${s.bossDmgMult.toFixed(2)}`],
      ['💰 Altın', `x${s.goldMult.toFixed(2)}`],
      ['🍀 Şans', formatPercent(+s.luck.toFixed(1))],
    ].filter(Boolean);
    this.statList.replaceChildren(
      el('li', { class: 'stat-dps' }, [el('span', { text: 'Toplam DPS' }), el('b', { text: formatNumber(s.dps) })]),
      ...rows.map(([k, v]) => el('li', {}, [el('span', { text: k }), el('b', { text: v })]))
    );
  }

  equipBest() {
    const n = this.game.equipment.equipBest();
    this.ui.toast.show(n ? `${n} eşya kuşanıldı` : 'Zaten en iyi eşyaları kuşanıyorsun', n ? 'success' : 'info', 1600);
  }

  async sell(index) {
    const item = this.game.state.inventory[index];
    if (!item) return;
    if (item.tier >= 3 && !item.locked) {
      const rarity = getRarity(item.tier);
      const ok = await this.ui.modal.confirm(
        'Eşyayı sat?',
        `<span style="color:${rarity.color}">${rarity.name} ${itemDisplayName(item)}</span> 🪙 ${formatNumber(itemSellValue(item))} karşılığında satılacak.`,
        'Sat'
      );
      if (!ok) return;
    }
    const gold = this.game.inventory.sellAt(index);
    if (gold) this.ui.toast.show(`+${formatNumber(gold)} 🪙`, 'gold', 1200);
  }

  bulkSell() {
    const { count, gold } = this.game.inventory.sellAllUpTo(Number(this.bulkSelect.value));
    if (count) this.ui.toast.show(`${count} eşya satıldı: +${formatNumber(gold)} 🪙`, 'gold');
    else this.ui.toast.show('Satılacak eşya yok (kilitliler hariç)', 'info');
  }
}
