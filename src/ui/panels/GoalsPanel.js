import { ACHIEVEMENTS } from '../../data/achievements.js';
import { Events } from '../../core/events.js';
import { ALL_DONE_REWARDS, LOGIN_REWARDS, WEEKLY_BONUS_REWARDS, dayKey, daysBetween } from '../../data/quests.js';
import { describeReward } from '../../systems/rewards.js';
import { el } from '../../utils/dom.js';
import { formatTime } from '../../utils/format.js';
import { createQuestCard, updateQuestCard } from '../components/QuestCard.js';
import { AchievementsPanel } from './AchievementsPanel.js';

const PAGES = [
  { id: 'daily', label: '📜 Görevler' },
  { id: 'achievements', label: '🏆 Başarımlar' },
];
const NEAR_COUNT = 2; // "yakında tamamlanacak" başarım sayısı (dar ekranda tek satır)

// Hedefler sekmesi: günlük ve haftalık görevler, giriş serisi, yakın başarımlar; başarımlar ayrı alt sayfa.
export class GoalsPanel {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.page = 'daily';
    this.achievements = new AchievementsPanel(game, ui);
    this.cards = { daily: [], weekly: [] };
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
    this.game.bus.on(Events.TREE_CHANGED, () => this.renderNear());
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
    this.renderNear();
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

    this.weeklyList = el('div', { class: 'quest-list' });
    this.weeklyBonusBtn = el('button', { class: 'btn btn-primary', onclick: () => quests.claimWeeklyBonus() });
    this.weekResetIn = el('span', { class: 'muted' });
    this.nearList = el('div', { class: 'near-list' });

    // İki sütun: sol günlük (giriş serisi + bugünün görevleri), sağ haftalık + yakın başarımlar.
    // Dar ekranda tek sütuna düşer (CSS), böylece kaydırma gerekmez.
    this.dailyPage.append(
      el('div', { class: 'goals-cols' }, [
        el('div', { class: 'goals-col' }, [
          el('div', { class: 'section-head' }, [el('h4', { class: 'section-title', text: 'Giriş serisi' }), this.loginBtn]),
          this.loginStrip,
          el('div', { class: 'section-head' }, [el('h4', { class: 'section-title', text: 'Bugünün görevleri' }), this.resetIn]),
          this.questList,
          el('div', { class: 'quest-bonus' }, [
            el('span', { text: `Üçünü de tamamla: ${ALL_DONE_REWARDS.map((r) => describeReward(this.game, r)).join(' + ')}` }),
            this.bonusBtn,
          ]),
        ]),
        el('div', { class: 'goals-col' }, [
          el('div', { class: 'section-head' }, [el('h4', { class: 'section-title', text: 'Haftalık hedefler' }), this.weekResetIn]),
          this.weeklyList,
          el('div', { class: 'quest-bonus' }, [
            el('span', { text: `Üçünü de tamamla: ${WEEKLY_BONUS_REWARDS.map((r) => describeReward(this.game, r)).join(' + ')}` }),
            this.weeklyBonusBtn,
          ]),
          el('div', { class: 'section-head' }, [el('h4', { class: 'section-title', text: 'Yakında tamamlanacak başarımlar' })]),
          this.nearList,
        ]),
      ])
    );
    this.renderDaily();
    this.renderNear();
  }

  /** Bir görev kartı: ilerleme çubuğu, ödül ve alma düğmesi. */
  questCard(kind, i, quest) {
    return createQuestCard(this.game, kind, i, quest);
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

    this.cards.daily = d.quests.map((quest, i) => this.questCard('daily', i, quest));
    this.questList.replaceChildren(...this.cards.daily.map((c) => c.node));
    this.cards.weekly = game.state.weekly.quests.map((quest, i) => this.questCard('weekly', i, quest));
    this.weeklyList.replaceChildren(...this.cards.weekly.map((c) => c.node));
    this.tick();
  }

  /** Yakında tamamlanacak başarımlar: henüz açılmamış, en yüksek ilerlemeli üç tanesi. */
  renderNear() {
    const { game } = this;
    if (!this.nearList) return;
    const ach = game.achievements;
    const near = ACHIEVEMENTS.filter((a) => !ach.unlocked[a.id])
      .map((a) => ({ a, ratio: ach.progress(a) }))
      .filter((x) => x.ratio > 0)
      .sort((x, y) => y.ratio - x.ratio)
      .slice(0, NEAR_COUNT);
    if (!near.length) {
      this.nearList.replaceChildren(el('div', { class: 'muted', text: 'Henüz ilerleme yok. Savaşa devam et!' }));
      return;
    }
    this.nearList.replaceChildren(
      ...near.map(({ a, ratio }) =>
        el('button', { class: 'near-row', onclick: () => this.showPage('achievements') }, [
          el('span', { class: 'near-icon', text: a.icon }),
          el('div', { class: 'near-info' }, [
            el('b', { text: a.name }),
            el('div', { class: 'bar near-bar' }, [el('div', { class: 'fill', style: { width: `${ratio * 100}%` } }), el('span', { text: `%${Math.round(ratio * 100)}` })]),
          ]),
        ])
      )
    );
  }

  tick() {
    if (this.page === 'achievements') return this.achievements.tick();
    const { game } = this;
    const q = game.quests;
    const d = game.state.daily;
    const w = game.state.weekly;
    this.loginBtn.textContent = d.loginClaimed ? 'Bugünün ödülü alındı' : `🎁 ${Math.max(1, d.streak)}. gün ödülünü al`;
    this.loginBtn.disabled = d.loginClaimed;
    for (const c of this.cards.daily) this.updateCard(c, d.quests[c.i]);
    for (const c of this.cards.weekly) this.updateCard(c, w.quests[c.i]);
    this.bonusBtn.textContent = d.bonusClaimed ? 'Alındı' : 'Bonus ödülü al';
    this.bonusBtn.disabled = !q.canClaimBonus();
    this.weeklyBonusBtn.textContent = w.bonusClaimed ? 'Alındı' : 'Haftalık bonusu al';
    this.weeklyBonusBtn.disabled = !q.canClaimWeeklyBonus();
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    this.resetIn.textContent = `Yeni görevler ${formatTime((midnight - now) / 1000)} sonra`;
    // Hafta 7 günde bir döner (weekKey ile aynı 1970 referansı)
    const daysIntoWeek = daysBetween('1970-01-01', dayKey(now.getTime())) % 7;
    const daysLeft = 7 - daysIntoWeek;
    this.weekResetIn.textContent = `Haftalık hedefler ${daysLeft} gün sonra yenilenir`;
  }

  /** Kart durumu: ödül alınabilir, tamamlanmak üzere ya da devam ediyor. */
  updateCard(c, quest) {
    updateQuestCard(this.game, c, quest);
  }
}
