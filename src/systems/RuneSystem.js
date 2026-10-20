import { Events } from '../core/events.js';
import {
  MAX_SOCKETS_BY_TIER, RUNES_TO_COMBINE, RUNE_GRADES, RUNE_IDS, RUNE_MAP,
  combineCost, runeGradeForStage, runeName, runeValue, socketCost,
} from '../data/runes.js';
import { chance, pick } from '../utils/random.js';

// Rün çantası, yuvaya takma/çıkarma, birleştirme, yuva açma ve rün düşürme.
// Takılı rünlerin statları yalnızca KUŞANILAN eşyalardan sayılır (StatsSystem okur).
export class RuneSystem {
  constructor(game) {
    this.game = game;
    game.bus.on(Events.MONSTER_KILLED, ({ monster }) => {
      if (monster.towerFloor) return; // kule ödülleri TowerSystem'de
      this.rollDrop(monster);
    });
  }

  get bag() {
    return this.game.state.runes;
  }

  count(typeId, grade) {
    return this.bag[typeId]?.[grade - 1] ?? 0;
  }

  get totalCount() {
    return RUNE_IDS.reduce((sum, id) => sum + this.bag[id].reduce((a, b) => a + b, 0), 0);
  }

  add(typeId, grade, amount = 1) {
    if (!RUNE_MAP[typeId] || grade < 1 || grade > RUNE_GRADES) return;
    this.bag[typeId][grade - 1] += amount;
    this.trackGrade(grade);
    this.changed();
  }

  /** Canavar öldürünce rün düşürme şansı */
  rollDrop(monster) {
    const luckMult = 1 + this.game.stats.get().luck / 200;
    const p = monster.isBoss ? 1 : monster.isElite ? 0.25 : 0.03;
    if (!chance(p * luckMult)) return;
    const count = monster.isBoss && chance(0.35) ? 2 : 1;
    for (let i = 0; i < count; i++) this.grant(runeGradeForStage(monster.level, Math.random()), { x: monster.x, y: monster.centerY });
  }

  /** Rastgele türde, belirtilen kademede rün verir ve haber verir. */
  grant(grade, at = null, typeId = pick(RUNE_IDS)) {
    this.add(typeId, grade);
    this.game.bus.emit(Events.RUNE_FOUND, { typeId, grade, x: at?.x, y: at?.y });
    return { typeId, grade };
  }

  trackGrade(grade) {
    const st = this.game.state.stats;
    st.maxRuneGrade = Math.max(st.maxRuneGrade || 0, grade);
  }

  canCombine(typeId, grade) {
    return grade < RUNE_GRADES && this.count(typeId, grade) >= RUNES_TO_COMBINE && this.game.state.gold >= combineCost(grade);
  }

  combine(typeId, grade) {
    if (!this.canCombine(typeId, grade)) return false;
    if (!this.game.economy.spend(combineCost(grade))) return false;
    this.bag[typeId][grade - 1] -= RUNES_TO_COMBINE;
    this.bag[typeId][grade] += 1;
    this.trackGrade(grade + 1);
    this.changed();
    this.game.bus.emit(Events.TOAST, { text: `◆ ${runeName(typeId, grade + 1)} elde edildi`, type: 'success' });
    return true;
  }

  maxSockets(item) {
    return MAX_SOCKETS_BY_TIER[item.tier] ?? 0;
  }

  socketCost(item) {
    return socketCost(item);
  }

  canOpenSocket(item) {
    return !!item && (item.sockets?.length ?? 0) < this.maxSockets(item) && this.game.state.gold >= socketCost(item);
  }

  /** Kuşanılan eşyaya yeni boş yuva açar. */
  openSocket(slot) {
    const item = this.game.state.equipment[slot];
    if (!this.canOpenSocket(item)) return false;
    if (!this.game.economy.spend(socketCost(item))) return false;
    item.sockets = [...(item.sockets ?? []), null];
    this.changed(true);
    return true;
  }

  /** Çantadaki rünü kuşanılan eşyanın boş yuvasına takar. */
  insert(slot, index, typeId, grade) {
    const item = this.game.state.equipment[slot];
    if (!item?.sockets || index < 0 || index >= item.sockets.length || item.sockets[index]) return false;
    if (this.count(typeId, grade) < 1) return false;
    this.bag[typeId][grade - 1] -= 1;
    item.sockets[index] = { type: typeId, grade };
    this.changed(true);
    return true;
  }

  /** Yuvadaki rünü çıkarıp çantaya geri koyar (ücretsiz). */
  remove(slot, index) {
    const item = this.game.state.equipment[slot];
    const rune = item?.sockets?.[index];
    if (!rune) return false;
    item.sockets[index] = null;
    this.bag[rune.type][rune.grade - 1] += 1;
    this.changed(true);
    return true;
  }

  /** Eşya satılırken / silinirken üzerindeki rünleri çantaya iade eder. */
  reclaim(item) {
    if (!item?.sockets) return 0;
    let n = 0;
    item.sockets.forEach((rune, i) => {
      if (!rune) return;
      this.bag[rune.type][rune.grade - 1] += 1;
      item.sockets[i] = null;
      n++;
    });
    if (n) this.changed();
    return n;
  }

  /** Yeniden doğuştan önce: envanter + ekipmandaki tüm rünleri çantaya al. */
  reclaimAll() {
    const { state } = this.game;
    let n = 0;
    for (const item of [...state.inventory, ...Object.values(state.equipment)]) n += this.reclaim(item);
    return n;
  }

  /** Kuşanılan eşyalardaki rünlerin toplam stat katkısı */
  statBonuses() {
    const out = {};
    for (const item of Object.values(this.game.state.equipment)) {
      for (const rune of item?.sockets ?? []) {
        if (!rune) continue;
        const stat = RUNE_MAP[rune.type].stat;
        out[stat] = (out[stat] || 0) + runeValue(rune.type, rune.grade);
      }
    }
    return out;
  }

  /** @param {boolean} statsChanged takılı rünler değiştiyse statlar yeniden hesaplanır */
  changed(statsChanged = false) {
    this.game.bus.emit(Events.RUNES_CHANGED, { statsChanged });
  }
}
