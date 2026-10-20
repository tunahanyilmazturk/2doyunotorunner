import { Events } from '../core/events.js';
import { ARMOR_CLASSES, CLASSES } from '../data/classes.js';
import { WEAPON_KINDS } from '../data/items.js';
import { el } from '../utils/dom.js';

// Karakter sınıfları penceresi: açma (Kule Mührü), geçiş ve her sınıfın kullanabildiği eşyalar.
export class ClassModal {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    game.bus.on(Events.CLASS_CHANGED, () => this.refresh());
  }

  get isOpen() {
    return !!this.list?.isConnected;
  }

  open() {
    this.list = el('div', { class: 'class-list' });
    this.ui.modal.show({
      title: '🎭 Sınıflar',
      body: el('div', { class: 'class-modal' }, [
        el('div', { class: 'class-seals', text: `🔷 Kule Mührü: ${this.game.state.seals}` }),
        this.list,
        el('div', { class: 'hint', text: 'Sınıf açmak Kule Mührü harcar; her kat geçişi 1 mühür verir. Geçiş ücretsizdir ve her sınıfın ekipmanı ayrı saklanır.' }),
      ]),
      wide: true,
      buttons: [{ label: 'Kapat', class: 'btn-primary' }],
    });
    this.refresh();
  }

  refresh() {
    if (!this.isOpen) return;
    const sys = this.game.classes;
    this.list.replaceChildren(
      ...CLASSES.map((c) => {
        const active = sys.data.active === c.id;
        const unlocked = sys.isUnlocked(c.id);
        let action;
        if (active) action = el('span', { class: 'class-tag', text: 'Aktif' });
        else if (unlocked) action = el('button', { class: 'btn btn-sm btn-buy', text: 'Geç', onclick: () => this.act(() => sys.switchTo(c.id)) });
        else
          action = el('button', {
            class: 'btn btn-sm btn-prestige',
            text: `Aç · 🔷 ${c.cost}`,
            disabled: !sys.canUnlock(c.id),
            onclick: () => this.act(() => sys.unlock(c.id)),
          });
        return el('div', { class: `class-card${active ? ' active' : ''}${unlocked ? '' : ' locked'}` }, [
          el('div', { class: 'class-icon', text: c.icon }),
          el('div', { class: 'class-info' }, [
            el('b', { text: c.name }),
            el('div', { class: 'muted', text: c.desc }),
            el('div', { class: 'class-meta', text: `Silah: ${c.weaponKinds.map((k) => kindName(k)).join(', ')} · Zırh: ${armorName(c.armorClass)} · ${c.bonusText}` }),
          ]),
          action,
        ]);
      })
    );
  }

  act(fn) {
    fn();
    this.refresh();
  }
}

const kindName = (k) => WEAPON_KINDS[k]?.name ?? k;
const armorName = (k) => ARMOR_CLASSES[k]?.name ?? k;
