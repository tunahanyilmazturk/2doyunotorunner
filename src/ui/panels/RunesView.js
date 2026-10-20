import { Events } from '../../core/events.js';
import { SLOTS, SLOT_ORDER } from '../../data/items.js';
import { getRarity } from '../../data/rarities.js';
import { RUNES_TO_COMBINE, RUNE_GRADES, RUNE_MAP, RUNE_TYPES, combineCost, runeName, runeValue } from '../../data/runes.js';
import { STAT_DEFS } from '../../data/stats.js';
import { itemDisplayName } from '../../systems/ItemFactory.js';
import { el } from '../../utils/dom.js';
import { formatNumber } from '../../utils/format.js';
import { createItemSlot } from '../components/ItemSlot.js';
import { icon, iconToken } from '../icons.js';

// Demirci > Rünler: solda rün çantası (tür × kademe), sağda kuşanılan eşyaların yuvaları.
// Akış: çantadan rün seç → boş yuvaya tıkla (tak). Dolu yuvaya tıkla → çıkar.
export class RunesView {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.selected = null; // { typeId, grade }
  }

  mount(root) {
    this.bagGrid = el('div', { class: 'rune-bag' });
    this.selInfo = el('div', { class: 'rune-sel' });
    this.combineBtn = el('button', { class: 'btn btn-buy btn-sm', onclick: () => this.combine() });
    this.items = el('div', { class: 'rune-items' });
    this.autoBtn = el('button', { class: 'btn btn-buy btn-sm', text: 'Boş yuvaları doldur', onclick: () => this.autoSocket() });

    root.append(
      el('div', { class: 'rune-layout' }, [
        el('div', { class: 'rune-left' }, [
          el('div', { class: 'section-head' }, [
            el('h4', { class: 'section-title', text: 'Rün çantası' }),
            el('span', { class: 'muted', text: `${RUNES_TO_COMBINE} aynı rün → bir üst kademe` }),
          ]),
          this.bagGrid,
          el('div', { class: 'rune-sel-row' }, [this.selInfo, this.combineBtn]),
        ]),
        el('div', { class: 'rune-right' }, [
          el('div', { class: 'section-head' }, [
            el('h4', { class: 'section-title', text: 'Kuşanılan eşyaların yuvaları' }),
            el('span', { class: 'muted', text: 'Boş yuvaya tıkla: tak · Dolu yuvaya tıkla: çıkar' }),
            this.autoBtn,
          ]),
          this.items,
        ]),
      ])
    );

    const rebuild = () => this.render();
    const { bus } = this.game;
    bus.on(Events.RUNES_CHANGED, rebuild);
    bus.on(Events.EQUIPMENT_CHANGED, rebuild);
    bus.on(Events.TREE_CHANGED, rebuild);
    this.render();
  }

  autoSocket() {
    const n = this.game.runes.autoSocket();
    const text = n ? `${n} rün yuvalandı` : 'Takılacak boş yuva ya da rün yok';
    this.ui.toast.show(text, n ? 'success' : 'info', 1600);
    if (n) this.render();
  }

  select(typeId, grade) {
    const same = this.selected?.typeId === typeId && this.selected?.grade === grade;
    this.selected = same ? null : { typeId, grade };
    this.render();
  }

  combine() {
    const s = this.selected;
    if (s && this.game.runes.combine(s.typeId, s.grade)) {
      if (this.game.runes.count(s.typeId, s.grade) < 1) this.selected = { typeId: s.typeId, grade: s.grade + 1 };
      this.render();
    }
  }

  render() {
    this.renderBag();
    this.renderItems();
    this.tick();
  }

  renderBag() {
    const runes = this.game.runes;
    const header = el('div', { class: 'rune-row rune-head' }, [
      el('span', { class: 'rune-type' }),
      ...Array.from({ length: RUNE_GRADES }, (_, i) => el('span', { class: 'rune-grade-label', text: i + 1 })),
    ]);
    const rows = RUNE_TYPES.map((t) =>
      el('div', { class: 'rune-row' }, [
        el('span', { class: 'rune-type', style: { color: t.color }, title: STAT_DEFS[t.stat].label }, [icon(`rune-${t.id}`, `${t.name} rünü`), document.createTextNode(` ${t.name}`)]),
        ...Array.from({ length: RUNE_GRADES }, (_, i) => {
          const grade = i + 1;
          const n = runes.count(t.id, grade);
          const sel = this.selected?.typeId === t.id && this.selected?.grade === grade;
          const cell = el(
            'button',
            {
              class: `rune-cell${n ? ' has' : ''}${sel ? ' selected' : ''}${n >= RUNES_TO_COMBINE ? ' combinable' : ''}`,
              style: { '--c': t.color },
              title: `${runeName(t.id, grade)}: +%${runeValue(t.id, grade)} ${STAT_DEFS[t.stat].label} (${n} adet)`,
              disabled: !n,
              onclick: () => this.select(t.id, grade),
            },
            [n ? String(n) : '']
          );
          return cell;
        }),
      ])
    );
    this.bagGrid.replaceChildren(header, ...rows);
  }

  renderItems() {
    const { game, ui } = this;
    const rows = SLOT_ORDER.filter((slot) => game.state.equipment[slot]).map((slot) => {
      const item = game.state.equipment[slot];
      const rarity = getRarity(item.tier);
      const max = game.runes.maxSockets(item);
      const sockets = (item.sockets ?? []).map((rune, i) =>
        el(
          'button',
          {
            class: `socket${rune ? ' filled' : ''}`,
            style: rune ? { '--c': RUNE_MAP[rune.type].color } : {},
            title: rune ? `${runeName(rune.type, rune.grade)}: +%${runeValue(rune.type, rune.grade)} ${STAT_DEFS[RUNE_MAP[rune.type].stat].label} (çıkarmak için tıkla)` : 'Boş yuva: önce çantadan bir rün seç',
            onclick: () => this.clickSocket(slot, i),
          },
          [rune ? String(rune.grade) : '']
        )
      );
      const open = el('button', { class: 'btn btn-sm btn-buy socket-open', onclick: () => game.runes.openSocket(slot) });
      open.dataset.slot = slot;
      return el('div', { class: 'rune-item', style: { '--rarity': rarity.color } }, [
        createItemSlot(item, { ui, tooltip: { equipment: game.state.equipment } }),
        el('div', { class: 'rune-item-info' }, [
          el('div', { class: 'shop-name', style: { color: rarity.color }, text: itemDisplayName(item) }),
          el('div', { class: 'sockets' }, sockets.length ? sockets : [el('span', { class: 'muted', text: max ? 'Yuva yok' : 'Bu nadirlikte yuva açılamaz' })]),
        ]),
        (item.sockets?.length ?? 0) < max ? open : null,
      ]);
    });
    this.items.replaceChildren(...(rows.length ? rows : [el('div', { class: 'muted', text: 'Kuşanılmış eşya yok.' })]));
    this.openButtons = [...this.items.querySelectorAll('.socket-open')];
  }

  clickSocket(slot, index) {
    const item = this.game.state.equipment[slot];
    if (item.sockets[index]) {
      this.game.runes.remove(slot, index);
      return;
    }
    const s = this.selected;
    if (!s) {
      this.ui.toast.show('Önce çantadan takılacak rünü seç', 'info', 1600);
      return;
    }
    if (this.game.runes.insert(slot, index, s.typeId, s.grade) && this.game.runes.count(s.typeId, s.grade) < 1) this.selected = null;
  }

  tick() {
    const { game } = this;
    const s = this.selected;
    if (s) {
      const t = RUNE_MAP[s.typeId];
      const n = game.runes.count(s.typeId, s.grade);
      this.selInfo.innerHTML = `<b style="color:${t.color}">${iconToken(`rune-${s.typeId}`)} ${runeName(s.typeId, s.grade)}</b> +%${runeValue(s.typeId, s.grade)} ${STAT_DEFS[t.stat].label} · ${n} adet`;
      const canGrade = s.grade < RUNE_GRADES;
      this.combineBtn.hidden = !canGrade;
      this.combineBtn.textContent = `Birleştir (${RUNES_TO_COMBINE}→1) · 🪙 ${formatNumber(combineCost(s.grade))}`;
      this.combineBtn.disabled = !game.runes.canCombine(s.typeId, s.grade);
    } else {
      this.selInfo.textContent = `Toplam ${game.runes.totalCount} rün. Takmak veya birleştirmek için bir rün seç.`;
      this.combineBtn.hidden = true;
    }
    for (const b of this.openButtons ?? []) {
      const item = game.state.equipment[b.dataset.slot];
      if (!item) continue;
      const cost = game.runes.socketCost(item);
      b.textContent = `+ Yuva · 🪙 ${formatNumber(cost)}`;
      b.disabled = !game.runes.canOpenSocket(item);
      b.title = `${SLOTS[b.dataset.slot].name}: yeni rün yuvası aç`;
    }
  }
}
