import { Events } from '../../core/events.js';
import { STAT_DEFS } from '../../data/stats.js';
import { MILESTONE_EVERY, UPGRADES, nextMilestone, upgradeValue } from '../../data/upgrades.js';
import { el } from '../../utils/dom.js';
import { formatNumber } from '../../utils/format.js';

import { iconToken } from '../icons.js';

const MODES = [1, 10, 'max'];

// Altın yükseltmeleri: toplu alım, kilometre taşları (her 25 seviyede ×2) ve otomatik alım.
export class UpgradePanel {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.rows = [];
  }

  mount(root) {
    const { game } = this;
    const sys = game.upgrades;

    this.modeButtons = MODES.map((mode) =>
      el('button', {
        class: 'btn btn-sm mode-btn',
        text: mode === 'max' ? 'MAX' : `x${mode}`,
        onclick: () => {
          sys.buyMode = mode;
          this.tick();
        },
      })
    );
    this.autoToggle = el('input', { type: 'checkbox', onchange: (e) => sys.setAuto(e.target.checked) });
    this.autoLabel = el('label', { class: 'check auto-check' }, [this.autoToggle, ' 🤖 Otomatik al']);

    const list = el('div', { class: 'upgrade-list' });
    for (const up of UPGRADES) {
      const row = {
        up,
        level: el('span', { class: 'up-level' }),
        effect: el('div', { class: 'up-effect' }),
        mile: el('div', { class: 'up-mile' }, [el('span')]),
        btn: el('button', { class: 'btn btn-buy', onclick: () => sys.buy(up.id) }),
        auto: el('input', { type: 'checkbox', title: 'Otomatik alıma dahil', onchange: (e) => sys.setRowAuto(up.id, e.target.checked) }),
      };
      row.node = el('div', { class: 'upgrade-row', title: `${up.name}: ${up.desc}` }, [
        el('div', { class: 'up-icon', text: iconToken(`upgrade-${up.id}`) }),
        el('div', { class: 'up-info' }, [el('div', { class: 'up-name' }, [el('b', { text: up.name }), row.level]), row.effect, row.mile]),
        el('div', { class: 'up-actions' }, [row.btn, row.auto]),
      ]);
      this.rows.push(row);
      list.append(row.node);
    }

    root.append(
      el('div', { class: 'toolbar' }, [
        el('div', { class: 'toolbar-group' }, [el('label', { text: 'Satın alma:' }), ...this.modeButtons]),
        el('div', { class: 'toolbar-group' }, [
          el('span', { class: 'muted', text: `⭐ Her ${MILESTONE_EVERY} seviyede etki ×2` }),
          this.autoLabel,
        ]),
      ]),
      list
    );
    game.bus.on(Events.SETTINGS_CHANGED, () => this.tick());
    this.tick();
  }

  /** Menü rozeti: şu an alınabilecek (x1) yükseltme sayısı (otomatik alım açıksa gösterilmez) */
  badge() {
    const sys = this.game.upgrades;
    if (sys.autoEnabled) return 0;
    const gold = this.game.state.gold;
    return UPGRADES.filter((u) => !sys.isMaxed(u) && gold >= sys.costAt(u, sys.level(u.id))).length;
  }

  formatValue(stat, v) {
    const def = STAT_DEFS[stat];
    if (def.percent) return `${+v.toFixed(1)}%`;
    return formatNumber(v);
  }

  tick() {
    const { game } = this;
    const sys = game.upgrades;
    this.modeButtons.forEach((b, i) => b.classList.toggle('active', MODES[i] === sys.buyMode));
    this.autoToggle.checked = sys.autoEnabled;
    this.autoToggle.disabled = !sys.autoUnlocked;
    this.autoLabel.title = sys.autoUnlocked ? 'En ucuz işaretli yükseltmeyi kendiliğinden alır' : 'İlk yeniden doğuştan sonra açılır';
    this.autoLabel.classList.toggle('disabled', !sys.autoUnlocked);

    for (const row of this.rows) {
      const { up } = row;
      const lvl = sys.level(up.id);
      const maxed = sys.isMaxed(up);
      row.level.textContent = up.maxLevel ? `Sv. ${lvl}/${up.maxLevel}` : `Sv. ${lvl}`;
      row.auto.hidden = !sys.autoEnabled;
      row.auto.checked = game.state.upgradeAuto[up.id] !== false;

      // Kilometre taşı ilerlemesi
      const next = nextMilestone(up, lvl);
      row.mile.hidden = !next;
      if (next) {
        const into = lvl % MILESTONE_EVERY;
        row.mile.firstChild.style.width = `${(into / MILESTONE_EVERY) * 100}%`;
        row.mile.title = `${next}. seviyede etki ×2 (${next - lvl} seviye kaldı)`;
      }

      if (maxed) {
        row.effect.textContent = `+${this.formatValue(up.stat, upgradeValue(up, lvl))} (MAKS)`;
        row.btn.textContent = 'MAKS';
        row.btn.disabled = true;
        row.node.classList.add('maxed');
        continue;
      }
      const q = sys.quote(up);
      const crossesMilestone = next && lvl + q.count >= next;
      row.effect.innerHTML = `+${this.formatValue(up.stat, upgradeValue(up, lvl))} → <span class="up">+${this.formatValue(up.stat, upgradeValue(up, lvl + q.count))}</span>${crossesMilestone ? ' <span class="up-star">⭐×2</span>' : ''}`;
      row.btn.textContent = `🪙 ${formatNumber(q.cost)}${q.count > 1 ? ` (x${q.count})` : ''}`;
      row.btn.disabled = !q.affordable;
    }
  }
}
