import { Balance } from '../config/balance.js';
import { Events } from '../core/events.js';
import { ACHIEVEMENTS } from '../data/achievements.js';

const CHECK_INTERVAL = 1;

// Başarımları saniyede bir kontrol eder ve açılanları kalıcı olarak kaydeder.
export class AchievementSystem {
  constructor(game) {
    this.game = game;
    this.timer = 0;
    this.unseen = 0; // menü rozeti için, sekme açılınca sıfırlanır
    this.initialized = false;
  }

  get unlocked() {
    return this.game.state.achievements;
  }

  get unlockedCount() {
    return Object.keys(this.unlocked).length;
  }

  get bonusPercent() {
    return this.unlockedCount * Balance.achievementBonus * 100;
  }

  isUnlocked(a) {
    return !!this.unlocked[a.id];
  }

  progress(a) {
    return Math.min(1, (a.progress(this.game.state) || 0) / a.target);
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = CHECK_INTERVAL;
    this.check();
  }

  check() {
    const state = this.game.state;
    // İlk kontrol (kayıt yüklenince) sessizdir: eski ilerleme için bildirim yağmuru olmasın
    const silent = !this.initialized;
    this.initialized = true;
    for (const a of ACHIEVEMENTS) {
      if (this.unlocked[a.id] || (a.progress(state) || 0) < a.target) continue;
      this.unlocked[a.id] = Date.now();
      if (!silent) this.unseen++;
      this.game.bus.emit(Events.ACHIEVEMENT_UNLOCKED, { achievement: a, silent });
    }
  }
}
