import { Balance } from '../config/balance.js';
import { GAME_SPEEDS, KILLS_PER_STAGE, POTION_COOLDOWN } from '../config/constants.js';
import { Events } from '../core/events.js';
import { getBiome, getBiomeTitle, getCycle } from '../data/biomes.js';
import { getRarity } from '../data/rarities.js';
import { iconToken, itemArtKey } from './icons.js';
import { SKILLS } from '../data/skills.js';
import { $, el, setText } from '../utils/dom.js';
import { formatNumber } from '../utils/format.js';

// Üst bar + oyun alanı üzerindeki bilgi katmanı + yetenek/iksir çubuğu.
export class HUD {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.actions = [];
  }

  init() {
    this.els = {
      prestigePill: $('#prestige-pill'),
      towerExit: $('#tower-exit'),
      lootFeed: $('#loot-feed'),
      gold: $('#hud-gold'),
      gps: $('#hud-gps'),
      souls: $('#hud-souls'),
      hpFill: $('#hud-hp-fill'),
      hpText: $('#hud-hp-text'),
      buffs: $('#buff-list'),
      biome: $('#hud-biome'),
      stage: $('#hud-stage'),
      pips: $('#kill-pips'),
      status: $('#hud-status'),
      bossTimer: $('#boss-timer'),
      bossFill: $('#boss-timer .fill'),
      bossText: $('#boss-timer span'),
      bossBtn: $('#boss-btn'),
      dps: $('#hud-dps'),
      speed: $('#speed-controls'),
      saved: $('#save-indicator'),
      actionBar: $('#action-bar'),
    };

    this.els.bossBtn.addEventListener('click', () => this.game.spawn.challengeBoss());
    this.els.prestigePill.addEventListener('click', () => this.ui.showTab('prestige'));
    this.els.towerExit.addEventListener('click', () => this.game.tower.end('exit'));
    this.game.bus.on(Events.PRESTIGE_ADVICE, ({ recommended, souls }) => {
      this.els.prestigePill.hidden = !recommended;
      this.els.prestigePill.textContent = `✨ Yeniden doğ · +${formatNumber(souls)} Ruh`;
    });
    // Son ganimetler akışı (sağ üst): en yeni üstte, 8 sn sonra solar
    this.game.bus.on(Events.LOOT_DROPPED, ({ item, autoSold }) => this.pushLoot(item, autoSold));
    this.buildSpeedControls();
    this.pipEls = Array.from({ length: KILLS_PER_STAGE }, () => el('span', { class: 'pip' }));
    this.els.pips.append(...this.pipEls);
    this.buildActionBar();

    this.game.bus.on(Events.SETTINGS_CHANGED, () => this.renderSpeed());
    this.game.bus.on(Events.GAME_SAVED, () => {
      this.els.saved.classList.add('show');
      clearTimeout(this.savedTimer);
      this.savedTimer = setTimeout(() => this.els.saved.classList.remove('show'), 1200);
    });
  }

  buildSpeedControls() {
    for (const speed of GAME_SPEEDS) {
      const btn = el('button', {
        class: 'speed-btn',
        text: `${speed}x`,
        dataset: { speed },
        onclick: () => {
          this.game.state.settings.speed = speed;
          this.game.bus.emit(Events.SETTINGS_CHANGED, this.game.state.settings);
        },
      });
      this.els.speed.append(btn);
    }
    this.renderSpeed();
  }

  renderSpeed() {
    for (const btn of this.els.speed.children) {
      btn.classList.toggle('active', Number(btn.dataset.speed) === this.game.state.settings.speed);
    }
  }

  /** Yetenek butonları (Q W E R) + iksir (F). Sol tık: kullan, sağ tık: otomatiği aç/kapa. */
  buildActionBar() {
    const { game, ui } = this;
    const makeButton = ({ icon, key, name, onUse, onToggleAuto, tooltip }) => {
      const parts = {
        cd: el('div', { class: 'ab-cd' }),
        timer: el('span', { class: 'ab-timer' }),
        auto: el('span', { class: 'ab-auto', title: 'Otomatik' }),
        count: el('span', { class: 'ab-count' }),
      };
      parts.node = el('button', { class: 'action-btn', 'aria-label': `${name} (${key})` }, [
        el('span', { class: 'ab-icon', text: icon }),
        parts.cd,
        parts.timer,
        el('span', { class: 'ab-key', text: key }),
        parts.auto,
        parts.count,
      ]);
      parts.node.addEventListener('click', onUse);
      parts.node.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        onToggleAuto();
        ui.tooltip.showText(tooltip(), e);
      });
      parts.node.addEventListener('mouseenter', (e) => ui.tooltip.showText(tooltip(), e));
      parts.node.addEventListener('mousemove', (e) => ui.tooltip.move(e));
      parts.node.addEventListener('mouseleave', () => ui.tooltip.hide());
      return parts;
    };

    for (const skill of SKILLS) {
      const parts = makeButton({
        icon: iconToken(`skill-${skill.id}`),
        name: skill.name,
        key: skill.key,
        onUse: () => (game.skills.level(skill.id) > 0 ? game.skills.cast(skill.id) : ui.showTab(skill.tree ? 'prestige' : 'skills')),
        onToggleAuto: () => game.skills.setAuto(skill.id, !game.state.skillAuto[skill.id]),
        tooltip: () => this.skillTooltip(skill),
      });
      this.actions.push({ skill, ...parts });
      this.els.actionBar.append(parts.node);
    }

    this.els.actionBar.append(el('div', { class: 'ab-sep' }));
    const potion = makeButton({
      icon: '🧪',
      name: 'Can İksiri',
      key: 'F',
      onUse: () => game.potions.use(),
      onToggleAuto: () => {
        game.state.settings.autoPotion = !game.state.settings.autoPotion;
        game.bus.emit(Events.SETTINGS_CHANGED, game.state.settings);
      },
      tooltip: () =>
        `<div class="tt-name">🧪 Can İksiri</div>
         <div class="tt-sub">Sahip: ${game.state.potions} · Bekleme ${POTION_COOLDOWN} sn</div>
         Maks. canın %${Balance.potionHealPct * 100}'ını yeniler.<br>
         Otomatik: <b>${game.state.settings.autoPotion ? 'Açık' : 'Kapalı'}</b> (can %35 altına inince)
         <div class="tt-footer"><span class="tt-hint">Sol tık: İç · Sağ tık: Oto aç/kapa</span></div>`,
    });
    this.potion = potion;
    this.els.actionBar.append(potion.node);
  }

  skillTooltip(skill) {
    const sys = this.game.skills;
    const lvl = sys.level(skill.id);
    const head = `<div class="tt-name">${iconToken(`skill-${skill.id}`)} ${skill.name}</div>`;
    if (lvl === 0) {
      const req = sys.isUnlocked(skill)
        ? 'Yetenekler menüsünden öğrenebilirsin.'
        : skill.tree
          ? "Ruh Ağacı'nda açılır."
          : `${skill.unlockStage}. bölgede açılır.`;
      return `${head}<div class="tt-sub">Öğrenilmedi</div>${req}`;
    }
    return `${head}
      <div class="tt-sub">Seviye ${lvl} · Bekleme ${Math.round(sys.cooldownOf(skill))} sn</div>
      ${skill.describe(sys.power(skill), skill)}<br>
      Otomatik: <b>${this.game.state.skillAuto[skill.id] ? 'Açık' : 'Kapalı'}</b>
      <div class="tt-footer"><span class="tt-hint">Sol tık: Kullan · Sağ tık: Oto aç/kapa</span></div>`;
  }

  update() {
    const { game, els } = this;
    const { state, player } = game;
    const stats = game.stats.get();

    setText(els.gold, formatNumber(state.gold));
    setText(els.gps, `${formatNumber(state.stats.goldPerSec)}/sn`);
    setText(els.souls, formatNumber(state.souls));

    els.hpFill.style.width = `${player.hpRatio * 100}%`;
    setText(els.hpText, `${formatNumber(player.hp)} / ${formatNumber(player.maxHp)}`);
    els.hpFill.classList.toggle('low', player.hpRatio < 0.3);

    const biome = getBiome(state.stage);
    setText(els.biome, getBiomeTitle(state.stage));
    els.biome.classList.toggle('nightmare', getCycle(state.stage) > 0);
    setText(els.stage, `Bölge ${state.stage}`);
    // Kuledeyken plaka bölge yerine katı gösterir
    const inTower = game.tower.active;
    if (inTower) {
      setText(els.biome, '🗼 Boss Kulesi');
      setText(els.stage, `Kat ${game.tower.floor}`);
    }
    els.pips.hidden = inTower;
    els.towerExit.hidden = !inTower;

    const spawn = game.spawn;
    const bossNext = spawn.isBossStage && state.autoAdvance && state.kills >= KILLS_PER_STAGE;
    const bossPhase = spawn.bossActive || bossNext;
    els.pips.classList.toggle('boss', bossPhase);
    this.pipEls.forEach((pip, i) => pip.classList.toggle('on', bossPhase || i < state.kills));
    const status = setText(els.status, bossPhase ? '👑 Boss savaşı' : state.autoAdvance ? '' : 'Bu bölgede kasılıyor');
    els.status.hidden = !status || spawn.bossActive;

    els.bossTimer.hidden = !spawn.bossActive;
    if (spawn.bossActive) {
      els.bossFill.style.width = `${(spawn.bossTimer / spawn.bossTimeTotal) * 100}%`;
      // Kalan canı mevcut DPS ile eritmek için gereken süre sayacı aşıyorsa
      // boss kaçacak; bunu önceden söyle (oyuncu boşuna beklemesin).
      const boss = spawn.current;
      const need = boss ? boss.hp / Math.max(0.001, stats.dps * stats.bossDmgMult) : 0;
      const doomed = need > spawn.bossTimer;
      els.bossTimer.classList.toggle('doomed', doomed);
      setText(els.bossText, doomed ? `${spawn.bossTimer.toFixed(1)} sn · yetişmez` : `${spawn.bossTimer.toFixed(1)} sn`);
    } else {
      els.bossTimer.classList.remove('doomed');
    }

    els.bossBtn.hidden = state.autoAdvance || inTower;
    setText(els.dps, `${formatNumber(stats.dps)} hasar/sn`);

    this.updateActionBar();
    this.updateBuffs();
  }

  updateActionBar() {
    const { game } = this;
    for (const a of this.actions) {
      const lvl = game.skills.level(a.skill.id);
      const cd = game.skills.cooldowns[a.skill.id];
      a.node.classList.toggle('locked', lvl === 0);
      a.node.classList.toggle('ready', lvl > 0 && cd <= 0);
      a.node.classList.toggle('active', game.skills.buffRemaining(a.skill.id) > 0);
      a.cd.style.height = `${lvl > 0 ? game.skills.cooldownRatio(a.skill) * 100 : 0}%`;
      setText(a.timer, lvl > 0 && cd > 0 ? Math.ceil(cd) : '');
      a.auto.classList.toggle('on', lvl > 0 && game.state.skillAuto[a.skill.id]);
      setText(a.count, lvl > 0 ? lvl : '🔒');
    }
    const p = this.potion;
    p.cd.style.height = `${game.potions.cooldownRatio * 100}%`;
    setText(p.timer, game.potions.cooldown > 0 ? Math.ceil(game.potions.cooldown) : '');
    setText(p.count, game.state.potions);
    p.auto.classList.toggle('on', game.state.settings.autoPotion);
    p.node.classList.toggle('locked', game.state.potions <= 0);
    p.node.classList.toggle('ready', game.state.potions > 0 && game.potions.cooldown <= 0);
  }

  pushLoot(item, sold) {
    const feed = this.els.lootFeed;
    const rarity = getRarity(item.tier);
    const li = el('li', { class: sold ? 'sold' : '', style: { '--c': rarity.color } }, [
      el('span', { text: iconToken(itemArtKey(item)) }),
      el('b', { text: item.name }),
      sold ? el('small', { text: 'satıldı' }) : null,
    ]);
    feed.prepend(li);
    while (feed.children.length > 4) feed.lastChild.remove();
    setTimeout(() => li.classList.add('fade'), 7000);
    setTimeout(() => li.remove(), 8000);
  }

  /** Yetenek buffları + süreli iksirler, kalan süreleriyle */
  updateBuffs() {
    const { skills, elixirs } = this.game;
    const active = [
      ...skills.activeBuffSkills().map((s) => ({ key: `s:${s.id}`, src: s, left: () => skills.buffRemaining(s.id) })),
      ...elixirs.activeList().map((e) => ({ key: `e:${e.id}`, src: e, left: () => elixirs.remaining(e.id) })),
    ];
    const key = active.map((a) => a.key).join();
    if (key !== this.buffKey) {
      this.buffKey = key;
      this.buffChips = active.map((a) => {
        const time = el('b');
        const chip = el('div', { class: 'buff-chip', style: { '--c': a.src.color }, title: a.src.name }, [iconToken(`${a.key.startsWith('s:') ? 'skill' : 'elixir'}-${a.src.id}`), time]);
        return { ...a, chip, time };
      });
      this.els.buffs.replaceChildren(...this.buffChips.map((b) => b.chip));
    }
    for (const b of this.buffChips ?? []) {
      const s = Math.ceil(b.left());
      b.time.textContent = s >= 60 ? `${Math.floor(s / 60)}dk` : `${s}s`;
    }
  }
}
