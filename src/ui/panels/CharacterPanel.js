import { Events } from '../../core/events.js';
import { SLOTS } from '../../data/items.js';
import { RARITIES, getRarity } from '../../data/rarities.js';
import { activeSetBonuses } from '../../data/sets.js';
import { formatStatLine } from '../../data/stats.js';
import { isUpgradeOver, itemDisplayName, itemSellValue } from '../../systems/ItemFactory.js';
import { SORT_MODES } from '../../systems/InventorySystem.js';
import { BAG_EXPANSION_SLOTS, MAX_BAG_EXPANSIONS } from '../../config/constants.js';
import { drawPlayerDoll } from '../../render/sprites/PlayerSprite.js';
import { el } from '../../utils/dom.js';
import { formatNumber } from '../../utils/format.js';
import { createItemSlot } from '../components/ItemSlot.js';

// Kağıt bebek: yuvalar figürün iki yanına, gövde yüksekliğine göre dizilir.
// Sol sütun figürün solunda kalan parçalar (kalkan sol elde tutulur), sağ sütun sağdakiler.
const DOLL_SLOTS_LEFT = ['helmet', 'cape', 'shield', 'belt', 'boots'];
const DOLL_SLOTS_RIGHT = ['amulet', 'weapon', 'armor', 'gloves', 'ring'];
// Tuval ölçüsü CSS ile birebir aynı olmalı (drawPlayerDoll bu kutuya sığdırır).
const DOLL_CANVAS = { w: 140, h: 220 };

// Envanter filtreleri: eşleşmeyen eşyalar soluk gösterilir (indeksler değişmez, eylemler bozulmaz)
const FILTERS = [
  ['all', 'Hepsi'],
  ['usable', 'Bu sınıfta kuşanılabilir'],
  ['better', 'Daha iyi (▲)'],
  ['locked', 'Kilitli'],
  ['sets', 'Set parçaları'],
];

// Karakter sekmesi: Ekipman | Envanter | Statlar — eşya yönetimi tek ekranda.
export class CharacterPanel {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
  }

  mount(root) {
    const { game } = this;
    root.classList.add('character-layout');

    this.classBtn = el('button', { class: 'btn btn-sm btn-block', title: 'Sınıflar sekmesini aç', onclick: () => this.ui.showTab('classes') });
    this.updateClassBtn();
    game.bus.on(Events.CLASS_CHANGED, () => this.updateClassBtn());
    game.bus.on(Events.TOWER_CHANGED, () => this.updateClassBtn()); // kule mührü kazanımı
    this.dollCanvas = el('canvas', { class: 'doll-canvas' });
    this.dollLeft = el('div', { class: 'doll-col doll-left' });
    this.dollRight = el('div', { class: 'doll-col doll-right' });
    this.doll = el('div', { class: 'equip-doll', title: 'Kuşandığın eşyalar karakterin üzerinde görünür' }, [
      this.dollCanvas,
      this.dollLeft,
      this.dollRight,
    ]);
    this.setList = el('div', { class: 'set-summary' });
    this.countEl = el('span', { class: 'inv-count' });
    this.grid = el('div', { class: 'inventory-grid' });

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

    this.sortSelect = el(
      'select',
      { class: 'select', title: 'Çantayı bu ölçüte göre sırala' },
      Object.entries(SORT_MODES).map(([value, text]) => el('option', { value, text }))
    );
    this.filterSelect = el(
      'select',
      { class: 'select', title: 'Eşleşmeyen eşyalar soluk görünür', onchange: () => this.renderInventory() },
      FILTERS.map(([value, text]) => el('option', { value, text }))
    );
    this.selectBtn = el('button', { class: 'btn btn-sm', text: '☑ Seç', onclick: () => this.toggleSelecting() });
    this.expandBtn = el('button', { class: 'btn btn-sm btn-buy', onclick: () => game.inventory.expand() });
    this.selBar = el('div', { class: 'sel-bar', hidden: true });
    this.selected = new Set();
    this.selecting = false;

    root.append(
      el('div', { class: 'char-col equip-col' }, [
        el('h4', { class: 'section-title', text: '🛡️ Ekipman' }),
        this.doll,
        el('button', { class: 'btn btn-sm btn-primary btn-block', text: '⚡ En İyileri Kuşan', onclick: () => this.equipBest() }),
        this.classBtn,
        this.setList,
      ]),
      el('div', { class: 'char-col inv-col' }, [
        el('div', { class: 'toolbar' }, [
          el('div', { class: 'toolbar-group' }, [this.countEl, this.expandBtn]),
          el('div', { class: 'toolbar-group' }, [
            el('label', { text: 'Sırala' }),
            this.sortSelect,
            el('button', { class: 'btn btn-sm', text: '↕', title: 'Sırala', onclick: () => game.inventory.sort(this.sortSelect.value) }),
            el('label', { text: 'Filtre' }),
            this.filterSelect,
          ]),
          el('div', { class: 'toolbar-group' }, [
            el('label', { text: 'Toplu Sat' }),
            this.bulkSelect,
            el('button', { class: 'btn btn-sm btn-warn', text: 'Sat', onclick: () => this.bulkSell() }),
          ]),
          el('div', { class: 'toolbar-group' }, [el('label', { text: 'Oto-Sat' }), this.autoSellSelect, this.selectBtn]),
        ]),
        this.selBar,
        this.grid,
        el('div', { class: 'hint', text: 'Sol tık: Kuşan · Sağ tık: Sat · Ctrl+tık: Kilitle 🔒 · ▲ daha iyi' }),
      ])
    );

    const bus = game.bus;
    const items = () => {
      this.renderEquipment();
      this.renderInventory();
      this.renderSets();
    };
    bus.on(Events.INVENTORY_CHANGED, items);
    bus.on(Events.EQUIPMENT_CHANGED, items);
    bus.on(Events.ITEM_ENHANCED, () => this.renderEquipment());
    bus.on(Events.TREE_CHANGED, items);
    bus.on(Events.SETTINGS_CHANGED, () => (this.autoSellSelect.value = game.state.settings.autoSellTier));
    this.autoSellSelect.value = game.state.settings.autoSellTier;

    items();
  }

  /** Sınıf düğmesi: aktif sınıf adı ve kalan Kule Mührü */
  updateClassBtn() {
    const { game } = this;
    this.classBtn.textContent = `🎭 ${game.classes.active.name} · 🔷 ${game.state.seals}`;
  }

  /** Menü rozeti: envanterde kuşanılandan daha iyi eşya sayısı */
  badge() {
    const { state } = this.game;
    return state.inventory.filter((it) => it && this.game.tree.isSlotUnlocked(it.slot) && isUpgradeOver(it, state.equipment[it.slot], state.stage)).length;
  }

  renderEquipment() {
    const { game, ui } = this;
    const slot = (key) => {
      if (!game.tree.isSlotUnlocked(key)) {
        const locked = createItemSlot(null, { ui, emptyIcon: SLOTS[key].icon, onClick: () => ui.showTab('prestige') });
        locked.classList.add('slot-locked');
        locked.dataset.slot = key;
        locked.title = `${SLOTS[key].name}: Ruh Ağacı'nda açılır`;
        return locked;
      }
      const item = game.state.equipment[key];
      const node = createItemSlot(item, {
        ui,
        emptyIcon: SLOTS[key].icon,
        tooltip: { hint: 'Tıkla: Çıkar', equipment: game.state.equipment },
        onClick: () => game.equipment.unequip(key),
      });
      node.dataset.slot = key;
      if (!item) node.title = `${SLOTS[key].name} (boş)`;
      return node;
    };
    this.dollLeft.replaceChildren(...DOLL_SLOTS_LEFT.map(slot));
    this.dollRight.replaceChildren(...DOLL_SLOTS_RIGHT.map(slot));
    this.renderDoll();
  }

  /**
   * Kağıt bebeği çizer. Yalnızca ekipman değiştiğinde çalışır (her karede değil),
   * bu yüzden tuvali baştan ölçeklemek bedava sayılır.
   */
  renderDoll() {
    const { w, h } = DOLL_CANVAS;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = this.dollCanvas;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    drawPlayerDoll(ctx, this.game.state.equipment, w, h, this.game.classes.active.look);
  }

  renderInventory() {
    const { game, ui } = this;
    const inv = game.state.inventory;
    this.countEl.textContent = `🎒 ${game.inventory.usedSlots}/${inv.length}`;
    this.countEl.classList.toggle('full', game.inventory.freeSlots === 0);
    // Seçim, eşya silinince geçersiz indeksleri taşımasın
    this.selected = new Set([...this.selected].filter((i) => inv[i]));

    this.grid.replaceChildren(
      ...inv.map((item, i) => {
        if (!item) return createItemSlot(null, { ui });
        const node = createItemSlot(item, {
          ui,
          badge: !game.tree.isSlotUnlocked(item.slot) ? '🔒' : isUpgradeOver(item, game.state.equipment[item.slot], game.state.stage) ? '▲' : null,
          tooltip: () => ({
            equipped: game.state.equipment[item.slot],
            equipment: game.state.equipment,
            hint: 'Sol: Kuşan · Sağ: Sat · Ctrl: Kilit',
            warning: game.classes.canUse(item) ? '' : `⛔ Bu eşya ${game.classes.active.name} sınıfı tarafından kuşanılamaz`,
          }),
          onClick: (e) => {
            if (this.selecting) this.toggleSelected(i);
            else if (e.ctrlKey || e.metaKey) game.inventory.toggleLock(i);
            else if (e.shiftKey) this.sell(i);
            else game.equipment.equipFromInventory(i);
          },
          onContext: () => this.sell(i),
        });
        node.classList.toggle('dim', !this.matchesFilter(item));
        node.classList.toggle('selected', this.selected.has(i));
        return node;
      })
    );
    this.renderSelectionBar();
    this.updateExpandBtn();
  }

  /** Filtre seçimine uyan eşya mı? (Eşleşmeyenler soluk gösterilir.) */
  matchesFilter(item) {
    const { game } = this;
    switch (this.filterSelect.value) {
      case 'usable':
        return game.classes.canUse(item);
      case 'better':
        return game.tree.isSlotUnlocked(item.slot) && isUpgradeOver(item, game.state.equipment[item.slot], game.state.stage);
      case 'locked':
        return !!item.locked;
      case 'sets':
        return !!item.set;
      default:
        return true;
    }
  }

  toggleSelecting() {
    this.selecting = !this.selecting;
    if (!this.selecting) this.selected.clear();
    this.selectBtn.classList.toggle('active', this.selecting);
    this.renderInventory();
  }

  toggleSelected(i) {
    if (this.selected.has(i)) this.selected.delete(i);
    else this.selected.add(i);
    this.renderInventory();
  }

  /** Seçim modundayken alt çubuk: seçilenleri sat, kilitle/aç, temizle. */
  renderSelectionBar() {
    this.selBar.hidden = !this.selecting;
    if (!this.selecting) return;
    const { inventory, state } = this.game;
    const indices = [...this.selected];
    const anyUnlocked = indices.some((i) => state.inventory[i] && !state.inventory[i].locked);
    this.selBar.replaceChildren(
      el('span', { class: 'sel-count', text: `${indices.length} eşya seçildi` }),
      el('button', {
        class: 'btn btn-sm btn-warn',
        text: `Seçilenleri sat${indices.length ? ` · 🪙 ${formatNumber(inventory.planSellIndices(indices).gold)}` : ''}`,
        disabled: !indices.length,
        onclick: () => this.sellSelected(),
      }),
      el('button', {
        class: 'btn btn-sm',
        text: anyUnlocked ? '🔒 Kilitle' : '🔓 Kilidi aç',
        disabled: !indices.length,
        onclick: () => {
          inventory.setLocked(indices, anyUnlocked);
        },
      }),
      el('button', { class: 'btn btn-sm', text: 'Temizle', onclick: () => { this.selected.clear(); this.renderInventory(); } })
    );
  }

  async sellSelected() {
    const indices = [...this.selected];
    const plan = this.game.inventory.planSellIndices(indices);
    if (!plan.indices.length) {
      this.ui.toast.show('Seçilenlerde satılabilecek eşya yok (kilitliler hariç)', 'info');
      return;
    }
    const ok = await this.ui.modal.confirm('Seçilenleri sat?', `${plan.indices.length} eşya · 🪙 ${formatNumber(plan.gold)} karşılığında satılacak.`, 'Sat');
    if (!ok) return;
    const { count, gold } = this.game.inventory.sellIndices(indices);
    this.selected.clear();
    this.ui.toast.show(`${count} eşya satıldı: +${formatNumber(gold)} 🪙`, 'gold');
  }

  /** Çanta genişletme düğmesi: fiyat ve kalan hak. */
  updateExpandBtn() {
    const inv = this.game.inventory;
    const maxed = inv.expansions >= MAX_BAG_EXPANSIONS;
    this.expandBtn.textContent = maxed ? '🎒 Çanta tam' : `🎒 +${BAG_EXPANSION_SLOTS} yuva · 🪙 ${formatNumber(inv.expansionCost)}`;
    this.expandBtn.disabled = maxed || !inv.canExpand();
  }

  /** Panel sekmesi açıkken düzenli: genişletme fiyatı altınla birlikte değişir. */
  tick() {
    this.updateExpandBtn();
  }

  async bulkSell() {
    const max = Number(this.bulkSelect.value);
    const plan = this.game.inventory.planSellUpTo(max);
    if (!plan.indices.length) {
      this.ui.toast.show('Satılacak eşya yok (korunanlar hariç)', 'info');
      return;
    }
    const note = plan.kept ? ` · ${plan.kept} eşya korunuyor (▲ daha iyi, set, kilitli ya da başka sınıfa ait)` : '';
    const ok = await this.ui.modal.confirm('Toplu sat?', `${plan.indices.length} eşya · 🪙 ${formatNumber(plan.gold)}${note}`, 'Sat');
    if (!ok) return;
    const { count, gold } = this.game.inventory.sellAllUpTo(max);
    if (count) this.ui.toast.show(`${count} eşya satıldı: +${formatNumber(gold)} 🪙`, 'gold');
  }


  /**
   * Aktif set bonusları: hangi setten kaç parça kuşanıldı, hangi kademeler açık
   * ve bir sonraki eşik ne kazandırır. Boşken kısa bir ipucu gösterilir.
   */
  renderSets() {
    const { sets } = activeSetBonuses(this.game.state.equipment);
    if (!sets.length) {
      this.setList.replaceChildren(el('div', { class: 'hint', text: '💠 Aynı setten 2/4/6 parça kuşanınca bonus açılır.' }));
      return;
    }
    this.setList.replaceChildren(
      ...sets.map(({ set, pieces, active }) => {
        // Kademeler birikimli olduğu için aynı stat birden çok kez gelebilir; toplanır.
        const merged = {};
        for (const tier of active) {
          for (const [key, value] of Object.entries(tier.stats)) merged[key] = (merged[key] || 0) + value;
        }
        const next = set.bonuses.find((b) => pieces < b.pieces);
        return el('div', { class: 'set-row', style: { '--set': set.color } }, [
          el('div', { class: 'set-head' }, [
            el('span', { class: 'set-name', text: `${set.icon} ${set.name}` }),
            el('span', { class: 'set-pieces', text: `${pieces}/${set.slots.length}` }),
          ]),
          el('div', { class: 'set-chips' }, Object.entries(merged).map(([key, value]) => el('span', { class: 'set-chip', text: formatStatLine(key, value) }))),
          next && el('div', { class: 'set-next', text: `${next.pieces} parça: ${Object.entries(next.stats).map(([k, v]) => formatStatLine(k, v)).join(' · ')}` }),
        ].filter(Boolean));
      })
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


}
