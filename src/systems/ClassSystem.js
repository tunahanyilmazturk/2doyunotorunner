import { Events } from '../core/events.js';
import { CLASS_MAP, CLASS_IDS } from '../data/classes.js';
import { SLOT_ORDER } from '../data/items.js';

// Karakter sınıfları: açma (Kule Mührü ile), geçiş (ekipman setlerini takas eder),
// eşya kullanım kısıtı ve sınıfın stat bonusu. Durum state.classes ve state.seals içindedir.
export class ClassSystem {
  constructor(game) {
    this.game = game;
  }

  get data() {
    return this.game.state.classes;
  }

  get active() {
    return CLASS_MAP[this.data.active];
  }

  isUnlocked(id) {
    return !!this.data.unlocked[id];
  }

  canUnlock(id) {
    const c = CLASS_MAP[id];
    return !!c && !this.isUnlocked(id) && this.game.state.seals >= c.cost;
  }

  /** Sınıfı Kule Mührü karşılığında açar. */
  unlock(id) {
    if (!this.canUnlock(id)) return false;
    const c = CLASS_MAP[id];
    this.game.state.seals -= c.cost;
    this.data.unlocked[id] = true;
    this.game.bus.emit(Events.TOAST, { text: `🎭 ${c.name} sınıfı açıldı`, type: 'success' });
    this.changed();
    return true;
  }

  canSwitch(id) {
    return CLASS_IDS.includes(id) && this.isUnlocked(id) && id !== this.data.active;
  }

  /**
   * Aktif sınıfın ekipmanını saklar, hedef sınıfın ekipmanını kuşanır (takas).
   * Ekipman yuvaları bildirilir; statlar buradan yeniden hesaplanır.
   */
  switchTo(id) {
    if (!this.canSwitch(id)) return false;
    const { state } = this.game;
    this.data.sets[this.data.active] = state.equipment;
    state.equipment = this.data.sets[id] ?? Object.fromEntries(SLOT_ORDER.map((s) => [s, null]));
    delete this.data.sets[id];
    this.data.active = id;
    for (const slot of SLOT_ORDER) {
      this.game.bus.emit(Events.EQUIPMENT_CHANGED, { slot, item: state.equipment[slot], previous: null });
    }
    this.changed();
    return true;
  }

  /** Yeniden doğuş: koşuya ait eşyalar silinir; açılmış sınıflar ve mühürler kalır. */
  clearRun() {
    this.data.sets = {};
  }

  /** Eşya bu sınıfta kuşanılabilir mi? Sınıf kısıtı yoksa (kolye, yüzük vb.) evet. */
  canUse(item) {
    if (!item) return true;
    const c = this.active;
    if (item.slot === 'weapon' && item.kind && !c.weaponKinds.includes(item.kind)) return false;
    if (item.armorClass && item.armorClass !== c.armorClass) return false;
    return true;
  }

  /** Aktif sınıfın sabit stat bonusu (StatsSystem okur). */
  bonuses() {
    return { ...this.active.bonus };
  }

  changed() {
    this.game.bus.emit(Events.CLASS_CHANGED, { active: this.data.active });
  }
}
