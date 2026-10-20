import { Events } from '../core/events.js';
import {
  ALL_DONE_REWARDS, DAILY_QUEST_COUNT, LOGIN_REWARDS, QUEST_MAP, QUEST_TEMPLATES, dayKey, daysBetween,
} from '../data/quests.js';
import { TOWER_DAILY_ATTEMPTS, TOWER_UNLOCK_STAGE } from '../data/tower.js';
import { shuffle } from '../utils/random.js';
import { grantReward } from './rewards.js';

const DAY_CHECK_INTERVAL = 5;

// Günlük görevler + giriş serisi. Gün yerel takvime göre değişir; oyun açıkken
// gece yarısı geçilirse birkaç saniye içinde yeni gün başlar.
// Kule hakları da günlük yenilendiği için gün değişimini bu sistem yönetir.
export class QuestSystem {
  constructor(game, now = () => Date.now()) {
    this.game = game;
    this.now = now;
    this.timer = 0;

    const { bus } = game;
    bus.on(Events.MONSTER_KILLED, ({ monster }) => {
      this.progress('kill');
      if (monster.isElite) this.progress('elite');
      if (monster.isBoss && !monster.towerFloor) this.progress('boss');
    });
    bus.on(Events.SKILL_CAST, () => this.progress('skill'));
    bus.on(Events.LOOT_DROPPED, ({ item }) => item.tier >= 2 && this.progress('rareLoot'));
    bus.on(Events.CHEST_OPENED, ({ item }) => item.tier >= 2 && this.progress('rareLoot'));
    bus.on(Events.RUNE_FOUND, () => this.progress('rune'));
    bus.on(Events.ITEM_ENHANCED, () => this.progress('enhance'));
    bus.on(Events.TOWER_FLOOR_CLEARED, () => this.progress('towerFloor'));
  }

  get daily() {
    return this.game.state.daily;
  }

  /** Gün değiştiyse görevleri, giriş serisini ve kule haklarını yeniler. */
  ensureDay() {
    const today = dayKey(this.now());
    const d = this.daily;
    if (d.day === today) return false;

    // Giriş serisi: dün girildiyse devam, daha eskiyse baştan
    const gap = d.lastLoginDay ? daysBetween(d.lastLoginDay, today) : Infinity;
    d.streak = gap === 1 ? d.streak + 1 : 1;
    d.lastLoginDay = today;
    d.loginClaimed = false;

    d.day = today;
    d.quests = this.rollQuests();
    d.bonusClaimed = false;

    this.game.state.tower.attempts = TOWER_DAILY_ATTEMPTS;
    this.game.bus.emit(Events.TOWER_CHANGED, this.game.state.tower);
    this.changed();
    return true;
  }

  rollQuests() {
    const best = this.game.state.bestStage;
    // Kule kilitliyken kule görevi tamamlanamaz
    const pool = QUEST_TEMPLATES.filter((t) => t.event !== 'towerFloor' || this.game.state.stage >= TOWER_UNLOCK_STAGE);
    return shuffle(pool)
      .slice(0, DAILY_QUEST_COUNT)
      .map((t) => ({ id: t.id, target: t.target(best), progress: 0, claimed: false, reward: t.reward(best) }));
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = DAY_CHECK_INTERVAL;
    this.ensureDay();
  }

  progress(event, amount = 1) {
    let changed = false;
    for (const q of this.daily.quests) {
      if (q.claimed || q.progress >= q.target || QUEST_MAP[q.id]?.event !== event) continue;
      q.progress = Math.min(q.target, q.progress + amount);
      changed = true;
      if (q.progress >= q.target) this.game.bus.emit(Events.QUEST_COMPLETED, { quest: q, template: QUEST_MAP[q.id] });
    }
    if (changed) this.changed();
  }

  canClaim(i) {
    const q = this.daily.quests[i];
    return !!q && !q.claimed && q.progress >= q.target;
  }

  claim(i) {
    if (!this.canClaim(i)) return false;
    const q = this.daily.quests[i];
    q.claimed = true;
    grantReward(this.game, q.reward);
    this.game.state.stats.questsDone++;
    this.changed();
    return true;
  }

  get allClaimed() {
    return this.daily.quests.length > 0 && this.daily.quests.every((q) => q.claimed);
  }

  canClaimBonus() {
    return this.allClaimed && !this.daily.bonusClaimed;
  }

  claimBonus() {
    if (!this.canClaimBonus()) return false;
    this.daily.bonusClaimed = true;
    for (const r of ALL_DONE_REWARDS) grantReward(this.game, r);
    this.changed();
    return true;
  }

  /** Bugünün giriş ödülü (seri 7 günde bir başa döner) */
  get loginReward() {
    return LOGIN_REWARDS[(Math.max(1, this.daily.streak) - 1) % LOGIN_REWARDS.length];
  }

  claimLogin() {
    if (this.daily.loginClaimed) return false;
    this.daily.loginClaimed = true;
    grantReward(this.game, this.loginReward);
    this.changed();
    return true;
  }

  /** Menü rozeti: alınabilir ödül sayısı */
  get claimableCount() {
    const d = this.daily;
    return d.quests.filter((q, i) => this.canClaim(i)).length + (d.loginClaimed ? 0 : 1) + (this.canClaimBonus() ? 1 : 0);
  }

  changed() {
    this.game.bus.emit(Events.QUESTS_CHANGED, this.daily);
  }
}
