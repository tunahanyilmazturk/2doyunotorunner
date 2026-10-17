import { Events } from '../../core/events.js';
import { SKILLS } from '../../data/skills.js';
import { el } from '../../utils/dom.js';
import { formatNumber } from '../../utils/format.js';

import { iconToken } from '../icons.js';

// Yetenekleri öğren / yükselt / otomatik kullanımı ayarla.
export class SkillsPanel {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.cards = [];
  }

  mount(root) {
    const { game } = this;
    const grid = el('div', { class: 'skill-grid' });

    for (const skill of SKILLS) {
      const c = {
        skill,
        level: el('span', { class: 'up-level' }),
        desc: el('div', { class: 'skill-desc' }),
        req: el('div', { class: 'muted' }),
        btn: el('button', { class: 'btn btn-buy', onclick: () => game.skills.upgrade(skill.id) }),
        auto: el('input', { type: 'checkbox', onchange: (e) => game.skills.setAuto(skill.id, e.target.checked) }),
      };
      c.node = el('div', { class: 'skill-card', style: { '--c': skill.color } }, [
        el('div', { class: 'skill-head' }, [
          el('div', { class: 'skill-icon', text: iconToken(`skill-${skill.id}`) }),
          el('div', {}, [el('div', { class: 'up-name' }, [el('b', { text: skill.name }), c.level]), (c.meta = el('div', { class: 'muted' }))]),
        ]),
        c.desc,
        c.req,
        el('div', { class: 'skill-actions' }, [el('label', { class: 'check' }, [c.auto, ' Otomatik']), c.btn]),
      ]);
      this.cards.push(c);
      grid.append(c.node);
    }

    root.append(grid, el('div', { class: 'hint', text: 'Yetenekler yeniden doğuşta sıfırlanmaz. Oyun alanındaki çubuktan da kullanabilirsin (sağ tık: otomatik).' }));
    game.bus.on(Events.SKILLS_CHANGED, () => this.tick());
    this.tick();
  }

  badge() {
    return SKILLS.filter((s) => this.game.skills.canUpgrade(s) && this.game.skills.level(s.id) === 0).length;
  }

  tick() {
    const sys = this.game.skills;
    for (const c of this.cards) {
      const { skill } = c;
      const lvl = sys.level(skill.id);
      const unlocked = sys.isUnlocked(skill);
      const maxed = sys.isMaxed(skill);
      c.node.classList.toggle('locked', !unlocked);
      c.level.textContent = lvl ? `Sv. ${lvl}/${skill.maxLevel}` : 'Öğrenilmedi';

      const now = lvl ? skill.describe(sys.power(skill), skill) : '';
      const next = !maxed ? skill.describe(sys.power(skill, lvl + 1), skill) : '';
      c.desc.innerHTML = lvl ? `${now}${next ? `<div class="skill-next">Sonraki: ${next}</div>` : ''}` : next;
      c.req.textContent = unlocked ? '' : skill.tree ? "🌳 Ruh Ağacı'nda açılır" : `🔒 ${skill.unlockStage}. bölgede açılır`;

      c.meta.textContent = `Kısayol: ${skill.key} · Bekleme ${Math.round(sys.cooldownOf(skill))} sn`;
      c.auto.checked = !!this.game.state.skillAuto[skill.id];
      c.auto.disabled = lvl === 0;

      if (maxed) {
        c.btn.textContent = 'MAKS';
        c.btn.disabled = true;
      } else {
        c.btn.textContent = `${lvl ? 'Yükselt' : 'Öğren'} · 🪙 ${formatNumber(sys.cost(skill))}`;
        c.btn.disabled = !sys.canUpgrade(skill);
      }
    }
  }
}
