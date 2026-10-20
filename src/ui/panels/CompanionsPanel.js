import { Events } from '../../core/events.js';
import {
  COMPANIONS, COMPANION_RARITIES, EGG_HATCH_KILLS, MAX_COMPANION_LEVEL, passiveValue, powerMult, xpToNext,
} from '../../data/companions.js';
import { STAT_DEFS } from '../../data/stats.js';
import { el } from '../../utils/dom.js';

// Yoldaşlar sekmesi: solda yumurta/kuluçka, sağda yoldaş koleksiyonu.
export class CompanionsPanel {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.cards = [];
  }

  mount(root) {
    const sys = this.game.companions;
    this.eggCount = el('b');
    this.hatchFill = el('div', { class: 'fill' });
    this.hatchText = el('span');
    this.incubateBtn = el('button', { class: 'btn btn-primary btn-block', text: '🥚 Kuluçkaya koy', onclick: () => sys.startIncubation() });
    this.activeInfo = el('div', { class: 'comp-active' });

    const grid = el('div', { class: 'comp-grid' });
    for (const def of COMPANIONS) {
      const rarity = COMPANION_RARITIES[def.rarity];
      const c = {
        def,
        level: el('span', { class: 'up-level' }),
        xpFill: el('div', { class: 'fill' }),
        xpText: el('span'),
        info: el('div', { class: 'comp-info muted' }),
        btn: el('button', { class: 'btn btn-sm', onclick: () => sys.setActive(def.id) }),
      };
      c.node = el('div', { class: 'comp-card', style: { '--c': rarity.color } }, [
        el('div', { class: 'comp-emoji', 'data-raw-icon': '', text: def.emoji }),
        el('div', { class: 'comp-body' }, [
          el('div', { class: 'up-name' }, [el('b', { text: def.name }), c.level]),
          el('div', { class: 'comp-rarity', text: rarity.name }),
          c.info,
          el('div', { class: 'bar comp-xp' }, [c.xpFill, c.xpText]),
        ]),
        c.btn,
      ]);
      this.cards.push(c);
      grid.append(c.node);
    }

    root.append(
      el('div', { class: 'comp-layout' }, [
        el('aside', { class: 'comp-side' }, [
          el('div', { class: 'egg-box' }, [
            el('div', { class: 'egg-emoji', 'data-raw-icon': '', text: '🥚' }),
            el('div', {}, ['Yumurta: ', this.eggCount]),
            el('div', { class: 'bar egg-bar' }, [this.hatchFill, this.hatchText]),
            this.incubateBtn,
            el('div', {
              class: 'muted',
              text: `Kuluçkadaki yumurta ${EGG_HATCH_KILLS} öldürmede çatlar (boss 5 sayılır). Yumurtalar bosslardan, Boss Kulesi'nden ve günlük görevlerden gelir.`,
            }),
          ]),
          this.activeInfo,
        ]),
        grid,
      ])
    );
    this.game.bus.on(Events.COMPANIONS_CHANGED, () => this.tick());
    this.tick();
  }

  /** Menü rozeti: kuluçkaya konabilecek yumurta varsa */
  badge() {
    const d = this.game.state.companions;
    return d.incubating === null && d.eggs > 0 ? '!' : 0;
  }

  describe(def, level) {
    const parts = [];
    if (def.attack) parts.push(`Saldırı: gücünün %${Math.round(def.attack.pct * powerMult(level) * 100)}'ü, ${def.attack.interval} sn`);
    if (def.heal) parts.push(`İyileştirme: canın %${Math.round(def.heal.pct * powerMult(level) * 100)}'i, ${def.heal.interval} sn`);
    const stat = STAT_DEFS[def.passive.stat];
    parts.push(`Pasif: +${passiveValue(def, level)}${stat.percent ? '%' : ''} ${stat.label}`);
    return parts.join(' · ');
  }

  tick() {
    const sys = this.game.companions;
    const d = this.game.state.companions;
    this.eggCount.textContent = d.eggs;
    const incubating = d.incubating !== null;
    this.hatchFill.style.width = `${sys.hatchProgress * 100}%`;
    this.hatchText.textContent = incubating ? `Kuluçka: ${d.incubating}/${EGG_HATCH_KILLS}` : 'Kuluçka boş';
    this.incubateBtn.hidden = incubating;
    this.incubateBtn.disabled = d.eggs <= 0;

    const a = sys.active;
    this.activeInfo.innerHTML = a
      ? `Yanında: <b>${a.def.name}</b> (Sv.${a.level})<br><span class="muted">${a.def.desc}</span>`
      : '<span class="muted">Henüz yoldaşın yok. İlk yumurtan hediye: kuluçkaya koy ve savaşmaya devam et.</span>';

    for (const c of this.cards) {
      const own = sys.owned(c.def.id);
      c.node.classList.toggle('unknown', !own);
      c.node.classList.toggle('active', d.active === c.def.id);
      if (!own) {
        c.level.textContent = '';
        c.info.textContent = 'Henüz bulunmadı';
        c.xpFill.style.width = '0%';
        c.xpText.textContent = '';
        c.btn.hidden = true;
        continue;
      }
      c.level.textContent = `Sv. ${own.level}/${MAX_COMPANION_LEVEL}`;
      c.info.textContent = this.describe(c.def, own.level);
      const maxed = own.level >= MAX_COMPANION_LEVEL;
      c.xpFill.style.width = maxed ? '100%' : `${(own.xp / xpToNext(own.level)) * 100}%`;
      c.xpText.textContent = maxed ? 'MAKS' : `${own.xp}/${xpToNext(own.level)} dny`;
      c.btn.hidden = false;
      const isActive = d.active === c.def.id;
      c.btn.textContent = isActive ? 'Yanında' : 'Yanına al';
      c.btn.disabled = isActive;
    }
  }
}
