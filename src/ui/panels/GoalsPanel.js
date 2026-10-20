import { Events } from '../../core/events.js';
import { ALL_DONE_REWARDS, LOGIN_REWARDS, QUEST_MAP } from '../../data/quests.js';
import { describeReward } from '../../systems/rewards.js';
import { el } from '../../utils/dom.js';
import { formatTime } from '../../utils/format.js';
import { AchievementsPanel } from './AchievementsPanel.js';

const PAGES = [
  { id: 'daily', label: '📜 Günlük' },
  { id: 'achievements', label: '🏆 Başarımlar' },
];

// Hedefler sekmesi: günlük görevler + giriş serisi ve başarımlar (iki alt sayfa).
export class GoalsPanel {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.page = 'daily';
    this.achievements = new AchievementsPanel(game, ui);
    this.questCards = [];
  }

  mount(root) {
    this.subnav = el(
      'div',
      { class: 'subnav' },
      PAGES.map((p) => el('button', { class: 'subnav-btn', dataset: { page: p.id }, text: p.label, onclick: () => this.showPage(p.id) }))
    );
    this.dailyPage = el('div', { class: 'goals-page' });
    this.achPage = el('div', { class: 'goals-page' });
    root.append(this.subnav, this.dailyPage, this.achPage);
    this.achievements.mount(this.achPage);
    this.buildDaily();
    this.game.bus.on(Events.QUESTS_CHANGED, () => this.renderDaily());
    this.showPage(this.page);
  }

  showPage(id) {
    this.page = id;
    this.dailyPage.hidden = id !== 'daily';
    this.achPage.hidden = id !== 'achievements';
    for (const b of this.subnav.children) b.classList.toggle('active', b.dataset.page === id);
    if (id === 'achievements') this.achievements.onShow?.();
    this.tick();
  }

  onShow() {
    if (this.page === 'achievements') this.achievements.onShow?.();
  }

  badge() {
    return this.game.quests.claimableCount + (this.achievements.badge?.() || 0);
  }

  buildDaily() {
    const quests = this.game.quests;
    this.loginStrip = el('div', { class: 'login-strip' });
    this.loginBtn = el('button', { class: 'btn btn-buy', onclick: () => quests.claimLogin() });
    this.questList = el('div', { class: 'quest-list' });
    this.bonusBtn = el('button', { class: 'btn btn-primary', onclick: () => quests.claimBonus() });
    this.resetIn = el('span', { class: 'muted' });

    this.dailyPage.append(
      el('div', { class: 'section-head' }, [el('h4', { class: 'section-title', text: 'Giriş serisi' }), this.loginBtn]),
      this.loginStrip,
      el('div', { class: 'section-head' }, [el('h4', { class: 'section-title', text: 'Bugünün görevleri' }), this.resetIn]),
      this.questList,
      el('div', { class: 'quest-bonus' }, [
        el('span', { text: `Üçünü de tamamla: ${ALL_DONE_REWARDS.map((r) => describeReward(this.game, r)).join(' + ')}` }),
        this.bonusBtn,
      ])
    );
    this.renderDaily();
  }

  renderDaily() {
    const { game } = this;
    const q = game.quests;
    const d = game.state.daily;
    const dayIndex = (Math.max(1, d.streak) - 1) % LOGIN_REWARDS.length;
    this.loginStrip.replaceChildren(
      ...LOGIN_REWARDS.map((r, i) =>
        el('div', { class: `login-day${i < dayIndex || (i === dayIndex && d.loginClaimed) ? ' done' : ''}${i === dayIndex ? ' today' : ''}` }, [
          el('b', { text: `${i + 1}. gün` }),
          el('span', { text: describeReward(game, r) }),
        ])
      )
    );

    this.questCards = d.quests.map((quest, i) => {
      const t = QUEST_MAP[quest.id];
      const fill = el('div', { class: 'fill', style: { width: `${(quest.progress / quest.target) * 100}%` } });
      const btn = el('button', { class: 'btn btn-buy btn-sm', onclick: () => q.claim(i) });
      const node = el('div', { class: `quest-card${quest.claimed ? ' claimed' : ''}` }, [
        el('div', { class: 'quest-info' }, [
          el('b', { text: t.name }),
          el('div', { class: 'muted', text: t.desc(quest.target) }),
          el('div', { class: 'bar quest-bar' }, [fill, el('span', { text: `${quest.progress} / ${quest.target}` })]),
          el('div', { class: 'quest-reward', text: `Ödül: ${describeReward(game, quest.reward)}` }),
        ]),
        btn,
      ]);
      return { node, btn, i };
    });
    this.questList.replaceChildren(...this.questCards.map((c) => c.node));
    this.tick();
  }

  tick() {
    if (this.page === 'achievements') return this.achievements.tick();
    const { game } = this;
    const q = game.quests;
    const d = game.state.daily;
    this.loginBtn.textContent = d.loginClaimed ? 'Bugünün ödülü alındı' : `🎁 ${Math.max(1, d.streak)}. gün ödülünü al`;
    this.loginBtn.disabled = d.loginClaimed;
    for (const c of this.questCards) {
      const quest = d.quests[c.i];
      c.btn.textContent = quest.claimed ? 'Alındı' : q.canClaim(c.i) ? 'Ödülü al' : 'Devam ediyor';
      c.btn.disabled = !q.canClaim(c.i);
    }
    this.bonusBtn.textContent = d.bonusClaimed ? 'Alındı' : 'Bonus ödülü al';
    this.bonusBtn.disabled = !q.canClaimBonus();
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    this.resetIn.textContent = `Yeni görevler ${formatTime((midnight - now) / 1000)} sonra`;
  }
}
