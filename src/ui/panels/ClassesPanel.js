import { Events } from '../../core/events.js';
import { ARMOR_CLASSES, CLASSES } from '../../data/classes.js';
import { WEAPON_KINDS } from '../../data/items.js';
import { drawPlayerDoll } from '../../render/sprites/PlayerSprite.js';
import { el } from '../../utils/dom.js';

// Sınıflar sekmesi: her sınıfın karakter tasarımı, silah/zırh türleri ve açma/geçiş.
// Önizleme seçili sınıfın görünümünü gösterir; aktif sınıfta kuşanılmış ekipman da görünür.
const NO_GEAR = {};

export class ClassesPanel {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.selected = game.classes.data.active;
    this.cards = [];
    this.dirty = true;
  }

  mount(root) {
    this.sealsEl = el('div', { class: 'class-seals' });
    this.previewCanvas = el('canvas', { class: 'class-preview-canvas', width: 120, height: 180 });
    this.previewName = el('h3', { class: 'class-preview-name' });
    this.previewInfo = el('div', { class: 'class-preview-info' });
    this.previewAction = el('button', { class: 'btn btn-block', onclick: () => this.act(this.selected) });

    const grid = el('div', { class: 'class-grid' });
    for (const c of CLASSES) {
      const canvas = el('canvas', { class: 'class-thumb', width: 64, height: 96 });
      const action = el('button', { class: 'btn btn-sm', onclick: (e) => { e.stopPropagation(); this.act(c.id); } });
      const card = el('div', { class: 'class-card', dataset: { class: c.id }, onclick: () => this.select(c.id) }, [
        canvas,
        el('div', { class: 'class-info' }, [
          el('b', { text: c.name }),
          el('div', { class: 'class-meta', text: `Silah: ${c.weaponKinds.map((k) => WEAPON_KINDS[k]?.name ?? k).join(', ')} · Zırh: ${ARMOR_CLASSES[c.armorClass]?.name ?? c.armorClass} · ${c.bonusText}` }),
          action,
        ]),
      ]);
      this.cards.push({ id: c.id, card, canvas, action });
      grid.append(card);
    }

    root.append(
      el('div', { class: 'classes-layout' }, [
        el('aside', { class: 'class-preview' }, [this.sealsEl, this.previewCanvas, this.previewName, this.previewInfo, this.previewAction]),
        grid,
      ])
    );

    const { bus } = this.game;
    for (const ev of [Events.CLASS_CHANGED, Events.EQUIPMENT_CHANGED, Events.TOWER_CHANGED]) bus.on(ev, () => (this.dirty = true));
    this.tick();
  }

  onShow() {
    this.dirty = true;
  }

  /** Menü rozeti: açılabilecek (mühürü yeten) sınıf sayısı */
  badge() {
    return CLASSES.filter((c) => this.game.classes.canUnlock(c.id)).length;
  }

  select(id) {
    this.selected = id;
    this.dirty = true;
  }

  /** Açık sınıfı geçer; kilitliyse önce açar. */
  act(id) {
    const sys = this.game.classes;
    if (sys.data.active === id) return;
    if (!sys.isUnlocked(id)) sys.unlock(id);
    if (sys.isUnlocked(id)) sys.switchTo(id);
    this.dirty = true;
  }

  tick() {
    if (!this.dirty) return;
    this.dirty = false;
    const { game } = this;
    const sys = game.classes;
    const active = sys.data.active;
    this.sealsEl.textContent = `🔷 Kule Mührü: ${game.state.seals}`;

    for (const { id, card, canvas, action } of this.cards) {
      const c = CLASSES.find((x) => x.id === id);
      drawThumb(canvas, c.look);
      const isActive = id === active;
      const unlocked = sys.isUnlocked(id);
      card.classList.toggle('active', isActive);
      card.classList.toggle('selected', id === this.selected);
      card.classList.toggle('locked', !unlocked);
      if (isActive) {
        action.textContent = 'Aktif';
        action.disabled = true;
      } else if (unlocked) {
        action.textContent = 'Geç';
        action.disabled = false;
      } else {
        action.textContent = `Aç · 🔷 ${c.cost}`;
        action.disabled = !sys.canUnlock(id);
      }
    }

    const sel = CLASSES.find((x) => x.id === this.selected) ?? CLASSES[0];
    const ctx = this.previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    // Kuşanılmış ekipman yalnızca aktif sınıfın önizlemesinde görünür
    drawPlayerDoll(ctx, sel.id === active ? game.state.equipment : NO_GEAR, this.previewCanvas.width, this.previewCanvas.height, sel.look);
    this.previewName.textContent = `${sel.icon} ${sel.name}`;
    this.previewInfo.textContent = `${sel.desc} · ${sel.bonusText}`;
    const isActive = sel.id === active;
    this.previewAction.textContent = isActive ? 'Aktif sınıf' : sys.isUnlocked(sel.id) ? 'Bu sınıfa geç' : `Aç · 🔷 ${sel.cost}`;
    this.previewAction.disabled = isActive || (!sys.isUnlocked(sel.id) && !sys.canUnlock(sel.id));
  }
}

/** Kart küçük resmi: ekipmansız sınıf tasarımı */
function drawThumb(canvas, look) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPlayerDoll(ctx, NO_GEAR, canvas.width, canvas.height, look);
}
