import { Events } from '../core/events.js';
import { chance } from '../utils/random.js';

/** Bir ana bölge bossunun elmas düşürme ihtimali */
export const BOSS_GEM_CHANCE = 0.35;
/** Kule kat geçişinde (ilk geçişte fazlası) elmas */
export const TOWER_GEM_PER_FLOOR = 1;
export const TOWER_GEM_FIRST_CLEAR = 3;
/** Her yeni başarım açıldığında elmas */
export const ACHIEVEMENT_GEMS = 2;

// Elmas kazanımı: bosslar, Boss Kulesi kat geçişleri ve başarımlar.
// Elmas, prestijde silinmez; nadir eşya, iksir/rün paketleri ve sınıf açmak için harcanır.
export class GemSystem {
  constructor(game) {
    this.game = game;
    const { bus } = game;
    bus.on(Events.MONSTER_KILLED, ({ monster }) => {
      // Kule bossları kendi kat ödülünü verir; ana bölge bosslarından ara sıra elmas çıkar
      if (monster.isBoss && !monster.towerFloor && chance(BOSS_GEM_CHANCE)) this.add(1, { x: monster.x, y: monster.centerY });
    });
    bus.on(Events.TOWER_FLOOR_CLEARED, ({ firstClear }) => this.add(TOWER_GEM_PER_FLOOR + (firstClear ? TOWER_GEM_FIRST_CLEAR : 0)));
    bus.on(Events.ACHIEVEMENT_UNLOCKED, () => this.add(ACHIEVEMENT_GEMS));
  }

  /** Elmas ekler ve kısa bir bildirim gösterir. */
  add(amount, at = null) {
    this.game.state.gems = (this.game.state.gems || 0) + amount;
    this.game.bus.emit(Events.GEMS_EARNED, { amount, x: at?.x, y: at?.y });
  }

  /** Elmas harcar; yetmezse false. */
  spend(amount) {
    if ((this.game.state.gems || 0) < amount) return false;
    this.game.state.gems -= amount;
    return true;
  }
}
