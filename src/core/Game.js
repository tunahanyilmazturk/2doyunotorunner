import { AUTOSAVE_INTERVAL, RUN_SPEED } from '../config/constants.js';
import { Player } from '../entities/Player.js';
import { EffectsController } from '../render/EffectsController.js';
import { FloatingTextSystem } from '../render/FloatingTextSystem.js';
import { ParticleSystem } from '../render/ParticleSystem.js';
import { Renderer } from '../render/Renderer.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { ElixirSystem } from '../systems/ElixirSystem.js';
import { EquipmentSystem } from '../systems/EquipmentSystem.js';
import { ForgeSystem } from '../systems/ForgeSystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { LootSystem } from '../systems/LootSystem.js';
import { OfflineSystem } from '../systems/OfflineSystem.js';
import { PotionSystem } from '../systems/PotionSystem.js';
import { PrestigeSystem } from '../systems/PrestigeSystem.js';
import { ShopSystem } from '../systems/ShopSystem.js';
import { SkillSystem } from '../systems/SkillSystem.js';
import { SoulTreeSystem } from '../systems/SoulTreeSystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { StatsSystem } from '../systems/StatsSystem.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import { UIManager } from '../ui/UIManager.js';
import { damp } from '../utils/math.js';
import { EventBus } from './EventBus.js';
import { Events } from './events.js';
import { GameLoop } from './GameLoop.js';
import { SaveManager } from './SaveManager.js';

// Tüm sistemleri bir araya getiren kompozisyon kökü.
export class Game {
  constructor(canvas) {
    this.bus = new EventBus();
    this.saveManager = new SaveManager();
    this.state = this.saveManager.load();
    // viewWidth / speedScale: ekran oranına göre Renderer tarafından güncellenir
    this.world = { scrolling: true, scrollSpeed: 0, distance: 0, viewWidth: 960, speedScale: 1 };

    // Varlıklar
    this.player = new Player();

    // Oyun mantığı sistemleri
    this.tree = new SoulTreeSystem(this); // diğer sistemler etkilerini buradan okur
    this.stats = new StatsSystem(this);
    this.economy = new EconomySystem(this);
    this.inventory = new InventorySystem(this);
    this.equipment = new EquipmentSystem(this);
    this.loot = new LootSystem(this);
    this.upgrades = new UpgradeSystem(this);
    this.spawn = new SpawnSystem(this);
    this.combat = new CombatSystem(this);
    this.skills = new SkillSystem(this);
    this.potions = new PotionSystem(this);
    this.elixirs = new ElixirSystem(this);
    this.forge = new ForgeSystem(this);
    this.achievements = new AchievementSystem(this);
    this.shop = new ShopSystem(this);
    this.prestige = new PrestigeSystem(this);
    this.offline = new OfflineSystem(this);
    this.audio = new AudioSystem(this); // olaylara abone olur, sesleri kendi üretir

    // Görsel katman
    this.particles = new ParticleSystem();
    this.floatingText = new FloatingTextSystem();
    this.renderer = new Renderer(canvas, this);
    this.effects = new EffectsController(this);

    // Arayüz
    this.ui = new UIManager(this);

    this.saveTimer = 0;
    this.savingDisabled = false; // sıfırlama/içe aktarmada eski durumun tekrar yazılmasını engeller
    // Duraklatma nedenleri: 'user' (düğme/kısayol), 'hidden' (sekme arka planda).
    // Herhangi biri etkinken döngü tamamen durur; böylece arka planda hem
    // simülasyon hem çevrimdışı ödül aynı anda işlemez.
    this.pauseReasons = new Set();
    this.loop = new GameLoop(
      (dt) => this.update(dt),
      (dt) => this.renderer.render(dt)
    );
  }

  get isPaused() {
    return this.pauseReasons.size > 0;
  }

  /** Oyunu duraklatır/devam ettirir. @returns {boolean} şu an duraklatılmış mı */
  setPaused(reason, value) {
    if (value) this.pauseReasons.add(reason);
    else this.pauseReasons.delete(reason);
    const paused = this.pauseReasons.size > 0;
    if (paused) {
      this.saveGame(); // duraklatırken ilerlemeyi kaybetme
      this.loop.stop();
    } else this.loop.start();
    this.bus.emit(Events.PAUSE_CHANGED, { paused, reasons: [...this.pauseReasons] });
    return paused;
  }

  /** Kullanıcı duraklatmasını aç/kapat. */
  togglePause() {
    return this.setPaused('user', !this.pauseReasons.has('user'));
  }

  start() {
    // Ruh Ağacı durumunu uygula: kilitli yuvalardaki eşyalar, envanter boyutu, ağaç yetenekleri
    this.equipment.enforceLockedSlots();
    this.inventory.syncCapacity();
    this.skills.grantTreeSkills();
    this.achievements.check(); // kayıttaki ilerlemeyi sessizce işle
    this.player.reset(this.stats.recalculate());
    this.ui.init();
    this.offline.checkOnLoad();
    window.addEventListener('beforeunload', () => this.saveGame());
    this.loop.start();
  }

  update(dt) {
    const steps = this.state.settings.speed || 1;
    for (let i = 0; i < steps; i++) this.tick(dt);
    this.ui.update(dt);

    this.saveTimer += dt;
    if (this.saveTimer >= AUTOSAVE_INTERVAL) {
      this.saveTimer = 0;
      this.saveGame();
    }
  }

  tick(dt) {
    const w = this.world;
    w.scrollSpeed = damp(w.scrollSpeed, w.scrolling ? RUN_SPEED * w.speedScale : 0, 14, dt);
    if (w.scrollSpeed < 1 && !w.scrolling) w.scrollSpeed = 0;
    w.distance += w.scrollSpeed * dt;

    this.player.update(dt, w.scrollSpeed / w.speedScale);
    this.spawn.update(dt);
    this.combat.update(dt);
    this.skills.update(dt);
    this.potions.update(dt);
    this.elixirs.update(dt);
    this.achievements.update(dt);
    this.prestige.update(dt);
    this.upgrades.update(dt);
    this.shop.update(dt);
    this.economy.update(dt);
    this.particles.update(dt);
    this.floatingText.update(dt);
    this.state.stats.playTime += dt;
  }

  saveGame() {
    if (this.savingDisabled) return;
    if (this.saveManager.save(this.state)) this.bus.emit(Events.GAME_SAVED);
  }

  resetGame() {
    this.savingDisabled = true;
    this.saveManager.clear();
    location.reload();
  }

  importSave(str) {
    const state = this.saveManager.importString(str);
    this.saveManager.save(state);
    this.savingDisabled = true;
    location.reload();
  }
}
