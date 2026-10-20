import { Balance } from '../config/balance.js';
import { PRESTIGE_MIN_STAGE, START_POTIONS } from '../config/constants.js';
import { Events } from '../core/events.js';
import { getBiome } from '../data/biomes.js';

// Yeniden Doğuş: koşuya ait HER ŞEY sıfırlanır — altın, altın yükseltmeleri, bölge,
// envanter, kuşanılan ekipman, yetenek seviyeleri, iksirler ve mağaza vitrini.
// Kalıcı olanlar: Ruhlar, Ruh Ağacı, başarımlar, istatistikler ve ayarlar.
// Ağaç yine de koşuya dokunur: "Altın Miras" altının bir kısmını, "Hızlı Başlangıç"
// başlangıç bölgesini, "Geniş Çanta" envanter yuvalarını, yetenek düğümleri
// ücretsiz 1. seviyeyi korur.
//
// Danışman: ilerleme durduğunda (uzun süre yeni rekor yok, üst üste boss kaçışı veya ölüm)
// yeniden doğuşu önerir; HUD bunu bir düğmeyle gösterir.
export class PrestigeSystem {
  constructor(game) {
    this.game = game;
    this.sinceRecord = 0; // en yüksek bölge son yükseldiğinden beri geçen oyun süresi
    this.setbacks = 0; // son rekordan beri boss kaçışı + ölüm sayısı
    this.recommended = false;
    this.lastRecord = game.state.runMaxStage;

    game.bus.on(Events.STAGE_CHANGED, () => this.checkRecord());
    game.bus.on(Events.BOSS_FAILED, () => this.setbacks++);
    // Kulede ölmek ana koşunun tıkandığı anlamına gelmez
    game.bus.on(Events.PLAYER_DIED, ({ killer } = {}) => !killer?.towerFloor && this.setbacks++);
  }

  get pendingSouls() {
    const base = Balance.prestigeSouls(this.game.state.runMaxStage);
    return Math.floor(base * (1 + this.game.tree.perk('soulGain') / 100));
  }

  get canPrestige() {
    return this.game.state.runMaxStage >= PRESTIGE_MIN_STAGE && this.pendingSouls > 0;
  }

  get startStage() {
    return 1 + this.game.tree.perk('startStage');
  }

  checkRecord() {
    const max = this.game.state.runMaxStage;
    if (max <= this.lastRecord) return;
    if (this.lastRecord < PRESTIGE_MIN_STAGE && max >= PRESTIGE_MIN_STAGE) {
      this.game.bus.emit(Events.PRESTIGE_READY, { souls: this.pendingSouls });
    }
    this.lastRecord = max;
    this.sinceRecord = 0;
    this.setbacks = 0;
  }

  update(dt) {
    this.sinceRecord += dt;
    const stalled = this.sinceRecord >= Balance.prestigeStallSeconds || this.setbacks >= Balance.prestigeStallFails;
    const recommended = this.canPrestige && stalled;
    if (recommended !== this.recommended) {
      this.recommended = recommended;
      this.game.bus.emit(Events.PRESTIGE_ADVICE, { recommended, souls: this.pendingSouls });
    }
  }

  prestige() {
    if (!this.canPrestige) return false;
    const { state, bus, tree } = this.game;
    const gained = this.pendingSouls;

    state.souls += gained;
    state.soulsEarned += gained;
    state.gold = Math.floor(state.gold * (tree.perk('goldKeep') / 100));
    for (const id of Object.keys(state.upgrades)) state.upgrades[id] = 0;
    state.stage = this.startStage;
    state.kills = 0;
    state.runMaxStage = state.stage;
    state.autoAdvance = true;
    state.stats.prestiges++;
    this.resetRun();

    this.lastRecord = state.runMaxStage;
    this.sinceRecord = 0;
    this.setbacks = 0;
    this.recommended = false;
    bus.emit(Events.PRESTIGE_ADVICE, { recommended: false, souls: 0 });

    this.game.spawn.reset();
    bus.emit(Events.PRESTIGE, { gained, total: state.souls });
    this.game.player.reset(this.game.stats.recalculate());
    bus.emit(Events.GOLD_CHANGED, state.gold);
    bus.emit(Events.STAGE_CHANGED, state.stage);
    bus.emit(Events.STAGE_PROGRESS, state);
    bus.emit(Events.BIOME_CHANGED, getBiome(state.stage));
    return true;
  }

  /**
   * Koşuya bağlı her şeyi temizler (bkz. sınıf başlığı), kalıcı alanlara dokunmaz.
   * Altın, yükseltmeler, bölge ve istatistikler `prestige` içinde ayrıca işlenir.
   * Sıra önemli: ekipman/yetenek/iksir temizliği statları kirletir, mağaza vitrini
   * bu yüzden en sonda yeni statlarla yeniden çekilir.
   */
  resetRun() {
    const { state, bus } = this.game;
    this.game.tower.end('prestige');
    this.game.classes?.clearRun(); // sınıfların saklı ekipmanı koşuya aittir
    // Rünler kalıcıdır: silinecek eşyalardaki rünler önce çantaya döner
    const reclaimed = this.game.runes.reclaimAll();
    if (reclaimed) bus.emit(Events.TOAST, { text: `◆ ${reclaimed} rün çantana geri döndü`, type: 'info' });
    this.game.inventory.clear();
    this.game.equipment.clearRun();
    this.game.skills.resetRun();
    state.potions = START_POTIONS;
    state.elixirs = {};
    bus.emit(Events.POTIONS_CHANGED, state.potions);
    bus.emit(Events.BUFFS_CHANGED, state.elixirs);
    this.game.shop.refresh();
  }
}
