import { Events } from '../core/events.js';
import {
  ALL_DONE_REWARDS, DAILY_QUEST_COUNT, LOGIN_REWARDS, MONTHLY_BONUS_REWARDS, MONTHLY_QUEST_COUNT, MONTHLY_TEMPLATES,
  QUEST_MAP, QUEST_TEMPLATES, WEEKLY_BONUS_REWARDS, WEEKLY_QUEST_COUNT, WEEKLY_TEMPLATES, dayKey, daysBetween, monthKey, weekKey,
} from '../data/quests.js';
import { TOWER_DAILY_ATTEMPTS, TOWER_UNLOCK_STAGE } from '../data/tower.js';
import { shuffle } from '../utils/random.js';
import { grantReward } from './rewards.js';

const DAY_CHECK_INTERVAL = 5;
const MAX_LOGIN_HISTORY = 62;

// Günlük görevler, haftalık hedefler ve giriş serisi. Gün yerel takvime göre değişir;
// oyun açıkken gece yarısı geçilirse birkaç saniye içinde yeni gün başlar.
// Kule hakları günlük yenilendiği için gün değişimini bu sistem yönetir.
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
    bus.on(Events.UPGRADE_BOUGHT, ({ count = 1 }) => this.progress('upgrade', count));
    bus.on(Events.COMPANION_LEVELED, () => this.progress('companionLevel'));
    bus.on(Events.ELIXIR_DRUNK, () => this.progress('elixir'));
    bus.on(Events.SOCKET_OPENED, () => this.progress('socket'));
    bus.on(Events.RUNE_COMBINED, () => this.progress('combine'));
  }

  get daily() {
    return this.game.state.daily;
  }

  get weekly() {
    return this.game.state.weekly;
  }

  get monthly() {
    return this.game.state.monthly;
  }

  /** Türe göre görev listesi: 'daily', 'weekly' ya da 'monthly' */
  list(kind = 'daily') {
    if (kind === 'weekly') return this.weekly.quests;
    if (kind === 'monthly') return this.monthly.quests;
    return this.daily.quests;
  }

  /** Gün değiştiyse görevleri, giriş serisini ve kule haklarını yeniler; hafta değiştiyse haftalık hedefleri. */
  ensureDay() {
    this.ensureWeek();
    this.ensureMonth();
    const today = dayKey(this.now());
    const d = this.daily;
    // Gün değişmese de bugün takvime işlensin (eski kayıtlarda geçmiş yoksa)
    if (d.day === today) {
      if (!(d.loginDays ?? []).includes(today)) d.loginDays = [...(d.loginDays ?? []), today].slice(-MAX_LOGIN_HISTORY);
      return false;
    }

    // Giriş serisi: dün girildiyse devam, daha eskiyse baştan
    const gap = d.lastLoginDay ? daysBetween(d.lastLoginDay, today) : Infinity;
    d.streak = gap === 1 ? d.streak + 1 : 1;
    d.lastLoginDay = today;
    d.loginClaimed = false;

    d.day = today;
    // Giriş takvimi: girilen günlerin son 62 günü (takvim görünümü için)
    d.loginDays = [...(d.loginDays ?? []), today].slice(-MAX_LOGIN_HISTORY);
    d.quests = this.rollQuests();
    d.bonusClaimed = false;

    this.game.state.tower.attempts = TOWER_DAILY_ATTEMPTS;
    this.game.bus.emit(Events.TOWER_CHANGED, this.game.state.tower);
    this.game.bus.emit(Events.TOAST, { text: '📜 Yeni günlük görevler hazır', type: 'info' });
    this.changed();
    return true;
  }

  /** Hafta değiştiyse haftalık hedefleri yeniler. */
  ensureWeek() {
    const key = weekKey(this.now());
    const w = this.weekly;
    if (w.week === key) return false;
    w.week = key;
    w.quests = this.rollWeekly();
    w.bonusClaimed = false;
    this.changed();
    return true;
  }

  /** Ay değiştiyse aylık hedefleri yeniler. */
  ensureMonth() {
    const key = monthKey(this.now());
    const m = this.monthly;
    if (m.month === key) return false;
    m.month = key;
    m.quests = this.rollMonthly();
    m.bonusClaimed = false;
    this.changed();
    return true;
  }

  rollMonthly() {
    const best = this.game.state.bestStage;
    const pool = MONTHLY_TEMPLATES.filter((t) => t.event !== 'towerFloor' || this.game.state.stage >= TOWER_UNLOCK_STAGE);
    return shuffle(pool)
      .slice(0, MONTHLY_QUEST_COUNT)
      .map((t) => ({ id: t.id, target: t.target(best), progress: 0, claimed: false, reward: t.reward(best) }));
  }

  rollQuests() {
    const best = this.game.state.bestStage;
    // Kule kilitliyken kule görevi tamamlanamaz
    const pool = QUEST_TEMPLATES.filter((t) => t.event !== 'towerFloor' || this.game.state.stage >= TOWER_UNLOCK_STAGE);
    return shuffle(pool)
      .slice(0, DAILY_QUEST_COUNT)
      .map((t) => ({ id: t.id, target: t.target(best), progress: 0, claimed: false, reward: t.reward(best) }));
  }

  rollWeekly() {
    const best = this.game.state.bestStage;
    const pool = WEEKLY_TEMPLATES.filter((t) => t.event !== 'towerFloor' || this.game.state.stage >= TOWER_UNLOCK_STAGE);
    return shuffle(pool)
      .slice(0, WEEKLY_QUEST_COUNT)
      .map((t) => ({ id: t.id, target: t.target(best), progress: 0, claimed: false, reward: t.reward(best) }));
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = DAY_CHECK_INTERVAL;
    this.ensureDay();
  }

  /** Olayı dinleyen tüm aktif görevlerin ilerlemesini artırır (günlük ve haftalık). */
  progress(event, amount = 1) {
    let changed = false;
    for (const kind of ['daily', 'weekly', 'monthly']) {
      for (const q of this.list(kind)) {
        if (q.claimed || q.progress >= q.target || QUEST_MAP[q.id]?.event !== event) continue;
        q.progress = Math.min(q.target, q.progress + amount);
        changed = true;
        if (q.progress >= q.target) this.game.bus.emit(Events.QUEST_COMPLETED, { quest: q, template: QUEST_MAP[q.id], kind });
      }
    }
    if (changed) this.changed();
  }

  canClaim(i, kind = 'daily') {
    const q = this.list(kind)[i];
    return !!q && !q.claimed && q.progress >= q.target;
  }

  claim(i, kind = 'daily') {
    if (!this.canClaim(i, kind)) return false;
    const q = this.list(kind)[i];
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

  get allWeeklyClaimed() {
    return this.weekly.quests.length > 0 && this.weekly.quests.every((q) => q.claimed);
  }

  canClaimWeeklyBonus() {
    return this.allWeeklyClaimed && !this.weekly.bonusClaimed;
  }

  /** Haftanın üç hedefi de alınınca verilen büyük ödül */
  claimWeeklyBonus() {
    if (!this.canClaimWeeklyBonus()) return false;
    this.weekly.bonusClaimed = true;
    for (const r of WEEKLY_BONUS_REWARDS) grantReward(this.game, r);
    this.changed();
    return true;
  }

  get allMonthlyClaimed() {
    return this.monthly.quests.length > 0 && this.monthly.quests.every((q) => q.claimed);
  }

  canClaimMonthlyBonus() {
    return this.allMonthlyClaimed && !this.monthly.bonusClaimed;
  }

  /** Ayın üç hedefi de alınınca verilen büyük ödül */
  claimMonthlyBonus() {
    if (!this.canClaimMonthlyBonus()) return false;
    this.monthly.bonusClaimed = true;
    for (const r of MONTHLY_BONUS_REWARDS) grantReward(this.game, r);
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

  /** Menü rozeti: alınabilir ödül sayısı (günlük + haftalık) */
  get claimableCount() {
    const d = this.daily;
    const dailyClaimable = d.quests.filter((q, i) => this.canClaim(i, 'daily')).length + (d.loginClaimed ? 0 : 1) + (this.canClaimBonus() ? 1 : 0);
    const weeklyClaimable = this.weekly.quests.filter((q, i) => this.canClaim(i, 'weekly')).length + (this.canClaimWeeklyBonus() ? 1 : 0);
    const monthlyClaimable = this.monthly.quests.filter((q, i) => this.canClaim(i, 'monthly')).length + (this.canClaimMonthlyBonus() ? 1 : 0);
    return dailyClaimable + weeklyClaimable + monthlyClaimable;
  }

  /** Açılışta bekleyen ödüller varsa kısa bir hatırlatma. */
  announce() {
    const n = this.claimableCount;
    if (n > 0) this.game.bus.emit(Events.TOAST, { text: `🎁 ${n} hedef ödülü bekliyor (Hedefler sekmesi)`, type: 'gold', ms: 3000 });
  }

  changed() {
    this.game.bus.emit(Events.QUESTS_CHANGED, this.daily);
  }
}
