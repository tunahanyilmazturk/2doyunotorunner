import { Balance } from '../../config/balance.js';
import { Events } from '../../core/events.js';
import { ACHIEVEMENTS } from '../../data/achievements.js';
import { el } from '../../utils/dom.js';
import { formatNumber } from '../../utils/format.js';

import { iconToken } from '../icons.js';

// Başarımlar grup grup gösterilir: her kart sıradaki kademeyi ve tamamlanan kademe sayısını gösterir.
export class AchievementsPanel {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.cards = [];
  }

  mount(root) {
    this.summary = el('div', { class: 'ach-summary' });
    const grid = el('div', { class: 'ach-grid' });

    const groups = new Map();
    for (const a of ACHIEVEMENTS) {
      if (!groups.has(a.group)) groups.set(a.group, []);
      groups.get(a.group).push(a);
    }
    for (const tiers of groups.values()) {
      const c = {
        tiers,
        icon: el('div', { class: 'ach-icon', text: iconToken(`achievement-${tiers[0].group}`) }),
        name: el('b'),
        desc: el('div', { class: 'muted' }),
        pips: el('div', { class: 'ach-pips' }, tiers.map(() => el('span'))),
        fill: el('div', { class: 'fill' }),
        text: el('span'),
        count: el('span', { class: 'ach-count' }),
      };
      c.node = el('div', { class: 'ach-card' }, [
        c.icon,
        el('div', { class: 'ach-info' }, [
          el('div', { class: 'ach-title' }, [c.name, c.pips]),
          c.desc,
          el('div', { class: 'ach-progress' }, [el('div', { class: 'bar ach-bar' }, [c.fill, c.text]), c.count]),
        ]),
      ]);
      this.cards.push(c);
      grid.append(c.node);
    }

    root.append(this.summary, grid);
    this.game.bus.on(Events.ACHIEVEMENT_UNLOCKED, () => this.tick());
    this.tick();
  }

  badge() {
    return this.game.achievements.unseen;
  }

  onShow() {
    this.game.achievements.unseen = 0;
  }

  tick() {
    const sys = this.game.achievements;
    const state = this.game.state;
    this.summary.innerHTML = `🏆 <b>${sys.unlockedCount}/${ACHIEVEMENTS.length}</b> başarım · Bonus: <b>+%${formatNumber(sys.bonusPercent)}</b> saldırı ve altın <span class="muted">(her başarım +%${Balance.achievementBonus * 100})</span>`;

    for (const c of this.cards) {
      const doneCount = c.tiers.filter((a) => sys.isUnlocked(a)).length;
      const allDone = doneCount === c.tiers.length;
      const current = allDone ? c.tiers[c.tiers.length - 1] : c.tiers[doneCount];
      const value = Math.min(current.target, current.progress(state) || 0);

      c.node.classList.toggle('done', allDone);
      c.name.textContent = current.name;
      c.desc.textContent = current.desc;
      [...c.pips.children].forEach((pip, i) => pip.classList.toggle('on', i < doneCount));
      c.fill.style.width = `${(allDone ? 1 : sys.progress(current)) * 100}%`;
      c.text.textContent = allDone ? '✔ Tüm kademeler tamam' : `${formatNumber(value)} / ${formatNumber(current.target)}`;
      c.count.textContent = allDone ? '✔' : `${formatNumber(value)}/${formatNumber(current.target)}`;
      c.node.title = `${current.name}: ${current.desc}`;
    }
  }
}
