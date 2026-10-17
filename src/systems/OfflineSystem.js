import { OFFLINE_CAP_SECONDS, OFFLINE_EFFICIENCY, OFFLINE_MIN_SECONDS } from '../config/constants.js';
import { Events } from '../core/events.js';

// Oyun kapalıyken veya sekme arka plandayken geçen süre için altın ödülü.
// Hesap: geçen süre × ortalama saniyelik kazanç × verim.
//
// Sekme gizlendiğinde döngü tamamen durdurulur (game.setPaused('hidden')). Aksi halde
// hem yavaşlatılmış simülasyon hem çevrimdışı ödül aynı aralık için çalışır ve
// oyuncu hak etmediği kazancı alır.
export class OfflineSystem {
  constructor(game) {
    this.game = game;
    this.hiddenAt = 0;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.hiddenAt = Date.now();
        game.setPaused('hidden', true); // içinde saveGame() çağrılır
      } else if (this.hiddenAt) {
        game.setPaused('hidden', false);
        this.grant((Date.now() - this.hiddenAt) / 1000);
        this.hiddenAt = 0;
      }
    });
  }

  checkOnLoad() {
    this.grant((Date.now() - this.game.state.lastSave) / 1000);
  }

  grant(seconds) {
    if (seconds < OFFLINE_MIN_SECONDS) return;
    const capped = Math.min(seconds, OFFLINE_CAP_SECONDS);
    const gold = Math.floor(capped * this.game.state.stats.goldPerSec * OFFLINE_EFFICIENCY);
    if (gold <= 0) return;
    this.game.economy.addGold(gold, false);
    this.game.bus.emit(Events.OFFLINE_REWARD, { seconds: capped, gold, capped: seconds > OFFLINE_CAP_SECONDS });
  }
}
