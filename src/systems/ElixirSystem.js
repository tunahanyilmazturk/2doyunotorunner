import { Events } from '../core/events.js';
import { ELIXIRS, ELIXIR_MAP, MAX_ELIXIR_SECONDS } from '../data/shop.js';

// Süreli iksirler. Kalan süreler state.elixirs içinde tutulur (kayıtla korunur).
// StatsSystem etkilerini activeModifiers() ile okur.
export class ElixirSystem {
  constructor(game) {
    this.game = game;
  }

  get active() {
    return this.game.state.elixirs;
  }

  remaining(id) {
    return this.active[id] ?? 0;
  }

  /** İksiri iç: süre eklenir; aktif değilse buff başlar */
  drink(id) {
    const e = ELIXIR_MAP[id];
    if (!e) return false;
    const was = this.remaining(id);
    if (was >= MAX_ELIXIR_SECONDS) return false;
    this.active[id] = Math.min(MAX_ELIXIR_SECONDS, was + e.duration);
    if (!was) this.game.bus.emit(Events.BUFFS_CHANGED, this.active);
    return true;
  }

  activeModifiers() {
    const mods = {};
    for (const id of Object.keys(this.active)) {
      const e = ELIXIR_MAP[id];
      if (e) mods[e.stat] = (mods[e.stat] || 0) + e.value;
    }
    return mods;
  }

  /** HUD için: aktif iksirler */
  activeList() {
    return ELIXIRS.filter((e) => this.remaining(e.id) > 0);
  }

  update(dt) {
    let expired = false;
    for (const id of Object.keys(this.active)) {
      this.active[id] -= dt;
      if (this.active[id] <= 0) {
        delete this.active[id];
        expired = true;
      }
    }
    if (expired) this.game.bus.emit(Events.BUFFS_CHANGED, this.active);
  }
}
