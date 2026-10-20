import { Events } from '../core/events.js';
import { SET_MAP } from '../data/sets.js';
import { SKILLS } from '../data/skills.js';
import { $, el } from '../utils/dom.js';
import { formatNumber, formatTime } from '../utils/format.js';
import { Modal } from './components/Modal.js';
import { ToastManager } from './components/Toast.js';
import { Tooltip } from './components/Tooltip.js';
import { HUD } from './HUD.js';
import { CharacterPanel } from './panels/CharacterPanel.js';
import { ClassesPanel } from './panels/ClassesPanel.js';
import { CompanionsPanel } from './panels/CompanionsPanel.js';
import { GoalsPanel } from './panels/GoalsPanel.js';
import { TowerPanel } from './panels/TowerPanel.js';
import { ForgePanel } from './panels/ForgePanel.js';
import { SoulTreePanel } from './panels/SoulTreePanel.js';
import { ShopPanel } from './panels/ShopPanel.js';
import { SkillsPanel } from './panels/SkillsPanel.js';
import { UpgradePanel } from './panels/UpgradePanel.js';
import { SettingsModal } from './SettingsModal.js';
import { StatsModal } from './StatsModal.js';
import { GoalsModal } from './GoalsModal.js';

import { ICONS, iconToken } from './icons.js';

const HUD_INTERVAL = 0.05;
const PANEL_INTERVAL = 0.25;
const TAB_KEY = 'idle-runner-rpg-tab';

/**
 * Arayüzün kökü. Menü sekmeleri bir dizi olarak tanımlanır; her panel şunları uygulayabilir:
 *   mount(root)  bir kez — DOM'u kurar
 *   tick()       sekme açıkken düzenli — sayıları/butonları günceller
 *   badge()      her zaman — menüdeki bildirim rozeti (sayı, '!' veya 0)
 *   onShow()     sekme açıldığında
 */
export class UIManager {
  constructor(game) {
    this.game = game;
    this.tooltip = new Tooltip();
    this.toast = new ToastManager();
    this.modal = new Modal();
    this.hud = new HUD(game, this);
    this.settings = new SettingsModal(game, this);
    this.statsModal = new StatsModal(game, this);
    this.goalsModal = new GoalsModal(game, this);
    this.tabs = [
      { id: 'character', icon: '🎒', label: 'Karakter', panel: new CharacterPanel(game, this) },
      { id: 'classes', icon: '🎭', label: 'Sınıflar', panel: new ClassesPanel(game, this) },
      { id: 'upgrades', icon: '⬆️', label: 'Yükseltmeler', panel: new UpgradePanel(game, this) },
      { id: 'skills', icon: '✨', label: 'Yetenekler', panel: new SkillsPanel(game, this) },
      { id: 'forge', icon: '🔨', label: 'Demirci', panel: new ForgePanel(game, this) },
      { id: 'companions', icon: '🐾', label: 'Yoldaşlar', panel: new CompanionsPanel(game, this) },
      { id: 'shop', icon: '🏪', label: 'Mağaza', panel: new ShopPanel(game, this) },
      { id: 'tower', icon: '🗼', label: 'Boss Kulesi', panel: new TowerPanel(game, this) },
      { id: 'achievements', icon: '🏆', label: 'Hedefler', panel: new GoalsPanel(game, this) },
      { id: 'prestige', icon: '🌳', label: 'Ruh Ağacı', panel: new SoulTreePanel(game, this) },
    ];
    this.activeTab = 'character';
    this.hudTimer = 0;
    this.panelTimer = 0;
  }

  init() {
    this.hud.init();
    this.buildNav();
    this.bindKeys();
    $('#settings-btn').addEventListener('click', () => this.settings.open());
    this.dockToggle = $('#dock-toggle');
    this.dockToggle.addEventListener('click', () => this.setMenuOpen(!this.isMenuOpen));
    this.setMenuOpen(false); // oyun açılışta sade: menü paneli kapalı

    this.pauseBtn = $('#pause-btn');
    this.pauseOverlay = $('#pause-overlay');
    this.pauseBtn.addEventListener('click', () => this.game.togglePause());
    $('#pause-resume').addEventListener('click', () => this.game.togglePause());

    const { bus } = this.game;
    bus.on(Events.PAUSE_CHANGED, ({ paused, reasons }) => this.updatePauseUi(paused, reasons));
    bus.on(Events.TOAST, ({ text, type }) => this.toast.show(text, type));
    bus.on(Events.OFFLINE_REWARD, (r) => this.showOfflineReward(r));
    // Bildirim türleri ayarlardan açılıp kapatılır (dolu envanter uyarısı her zaman gösterilir)
    const notify = () => this.game.state.settings.notify ?? {};
    bus.on(Events.LOOT_DROPPED, ({ item, autoSold, full }) => {
      if (full) this.toast.show('Envanter dolu! Eşya otomatik satıldı.', 'error', 1800);
      else if (!notify().loot) return;
      else if (!autoSold && item.set) this.toast.show(`💠 ${SET_MAP[item.set].name} parçası: ${item.name}`, 'loot', 2600);
      else if (!autoSold && item.tier >= 3) this.toast.show(`Yeni eşya: ${item.name}`, 'loot', 2200);
    });
    bus.on(Events.ACHIEVEMENT_UNLOCKED, ({ achievement, silent }) => {
      if (!silent && notify().achievements !== false) this.toast.show(`🏆 Başarım: ${achievement.name}`, 'gold', 3000);
    });
    bus.on(Events.SKILLS_CHANGED, ({ level, id }) => {
      if (level === 1) this.toast.show(`Yeni yetenek: ${SKILLS.find((s) => s.id === id).name}`, 'success');
    });
    bus.on(Events.PRESTIGE, () => this.tabs.forEach((t) => t.panel.tick?.()));
    bus.on(Events.QUEST_COMPLETED, ({ template }) => {
      if (notify().quests !== false) this.toast.show(`📜 Görev tamamlandı: ${template.name}. Ödülünü Hedefler sekmesinden al`, 'gold', 3200);
    });
    // Kule kat ödülleri afişte görünür; diğer ödüller (görev, giriş, bonus) bildirimle
    bus.on(Events.REWARD_GRANTED, ({ text }) => !this.game.tower.active && notify().rewards !== false && this.toast.show(`🎁 ${text}`, 'success', 2200));
    bus.on(Events.PRESTIGE_READY, ({ souls }) =>
      this.toast.show(`✨ Yeniden doğuş açıldı! Şimdi doğarsan +${formatNumber(souls)} Ruh (Ruh Ağacı)`, 'gold', 4000)
    );
    this.updateBadges();
    this.updatePauseUi(this.game.isPaused, [...this.game.pauseReasons]);
  }

  buildNav() {
    const rail = $('#nav-rail');
    const content = $('#tab-content');
    this.tabs.forEach((tab, i) => {
      tab.badgeEl = el('span', { class: 'nav-badge' });
      tab.button = el('button', { class: 'nav-btn', title: `${tab.label} (${i + 1})`, onclick: () => this.toggleTab(tab.id) }, [
        // Atlasta çizimi olmayan sekmeler (yoldaşlar, kule) kendi emojisini gösterir
        el('span', { class: 'nav-icon', text: ICONS[`menu-${tab.id}`] ? iconToken(`menu-${tab.id}`) : tab.icon }),
        el('span', { class: 'nav-label', text: tab.label }),
        tab.badgeEl,
      ]);
      tab.root = el('div', { class: `tab-page tab-${tab.id}` });
      rail.append(tab.button);
      content.append(tab.root);
      tab.panel.mount(tab.root);
    });

    let saved = null;
    try {
      saved = localStorage.getItem(TAB_KEY);
    } catch {
      /* yoksay */
    }
    this.showTab(this.tabs.some((t) => t.id === saved) ? saved : 'character', { open: false });
  }

  bindKeys() {
    const { game } = this;
    // Yüksek kontrast: ayar değişince sayfa sınıfı güncellenir (CSS token'larını geçersiz kılar)
    const applyDisplay = () => document.body.classList.toggle('high-contrast', !!game.state.settings.highContrast);
    applyDisplay();
    game.bus.on(Events.SETTINGS_CHANGED, applyDisplay);
    window.addEventListener('keydown', (e) => {
      if (e.target.closest?.('input, textarea, select') || e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === 'Escape') {
        if (this.modal.isOpen) this.modal.closeLast();
        else if (this.isMenuOpen) this.setMenuOpen(false);
        else this.settings.open();
        return;
      }
      if (this.modal.isOpen) return;

      const key = e.key.toUpperCase();
      const keys = game.state.settings.keys ?? {};
      const tabIndex = Number(e.key) - 1;
      if (tabIndex >= 0 && tabIndex < this.tabs.length) this.showTab(this.tabs[tabIndex].id);
      else if (key === keys.potion) game.potions.use();
      else if (key === keys.menu) this.setMenuOpen(!this.isMenuOpen);
      else if (key === keys.boss) game.spawn.challengeBoss();
      else if (key === keys.pause) game.togglePause();
      else {
        const skill = SKILLS.find((s) => s.key === key);
        if (!skill) return;
        game.skills.cast(skill.id);
      }
      e.preventDefault();
    });
  }

  get isMenuOpen() {
    return document.querySelector('.stage')?.classList.contains('menu-open') ?? false;
  }

  /**
   * Menü panelini aç/kapa. Panel oyun alanının içinde, menü şeridinin üstünde
   * modal gibi açılır; kapalıyken oyun alanı tüm yüksekliği kullanır.
   */
  setMenuOpen(open) {
    document.querySelector('.stage')?.classList.toggle('menu-open', open);
    if (this.dockToggle) {
      this.dockToggle.textContent = `${iconToken(open ? 'collapse' : 'expand')} Menü`;
      this.dockToggle.setAttribute('aria-expanded', String(open));
    }
    for (const tab of this.tabs) tab.button?.classList.toggle('open', open && tab.id === this.activeTab);
    this.tooltip.hide();
  }

  /** Alt menü düğmesi / M tuşu: açıksa kapatır, kapalıysa son sekmeyle açar. */
  setDockCollapsed(collapsed) {
    this.setMenuOpen(!collapsed);
  }

  /** Menü düğmesi: aynı sekmeye tekrar basılırsa panel kapanır; başka sekmeye basılırsa o açılır. */
  toggleTab(id) {
    if (this.isMenuOpen && this.activeTab === id) this.setMenuOpen(false);
    else this.showTab(id);
  }

  /** Duraklatma düğmesi, kaplama ve menü görünürlüğünü eşitler. */
  updatePauseUi(paused, reasons = []) {
    const byUser = paused && reasons.includes('user');
    this.pauseBtn.textContent = paused ? '▶' : '⏸';
    this.pauseBtn.classList.toggle('active', paused);
    this.pauseBtn.setAttribute('aria-label', paused ? 'Devam et' : 'Duraklat');
    this.pauseBtn.title = paused ? 'Devam et (P)' : 'Duraklat (P)';
    // Kaplama yalnızca kullanıcı duraklatmasında görünür; sekme gizliyken zaten görünmez.
    this.pauseOverlay.hidden = !byUser;
  }

  /**
   * Sekmeyi göster. open: panel de açılsın mı (varsayılan evet; açılışta false).
   */
  showTab(id, { open = true } = {}) {
    if (this.activeTab !== id) this.game.audio?.play('ui');
    this.activeTab = id;
    if (open) this.setMenuOpen(true);
    for (const tab of this.tabs) {
      const active = tab.id === id;
      tab.button.classList.toggle('active', active);
      tab.root.hidden = !active;
      if (active) {
        tab.panel.onShow?.();
        tab.panel.tick?.();
      }
    }
    this.tooltip.hide();
    this.updateBadges();
    try {
      localStorage.setItem(TAB_KEY, id);
    } catch {
      /* yoksay */
    }
  }

  updateBadges() {
    for (const tab of this.tabs) {
      const value = tab.panel.badge?.() ?? 0;
      tab.badgeEl.textContent = value ? (value === true ? '!' : String(value)) : '';
      tab.badgeEl.hidden = !value;
    }
  }

  update(dt) {
    this.hudTimer += dt;
    if (this.hudTimer >= HUD_INTERVAL) {
      this.hudTimer = 0;
      this.hud.update();
      this.tooltip.checkAnchor();
    }
    this.panelTimer += dt;
    if (this.panelTimer >= PANEL_INTERVAL) {
      this.panelTimer = 0;
      this.tabs.find((t) => t.id === this.activeTab)?.panel.tick?.();
      this.updateBadges();
    }
  }

  showOfflineReward({ seconds, gold, capped }) {
    this.modal.show({
      title: '🌙 Hoş geldin!',
      body: `Sen yokken <b>${formatTime(seconds)}</b> boyunca kahramanın savaşmaya devam etti.<br><br>
             <div class="offline-gold">+${formatNumber(gold)} 🪙</div>
             ${capped ? '<div class="muted">(Çevrimdışı kazanç en fazla 8 saat ile sınırlıdır)</div>' : ''}`,
      buttons: [{ label: 'Topla', class: 'btn-primary' }],
    });
  }
}
