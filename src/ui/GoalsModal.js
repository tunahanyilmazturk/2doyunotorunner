import { Events } from '../core/events.js';
import { ALL_DONE_REWARDS, LOGIN_REWARDS, MONTHLY_BONUS_REWARDS, WEEKLY_BONUS_REWARDS, dayKey, daysBetween } from '../data/quests.js';
import { describeReward } from '../systems/rewards.js';
import { el } from '../utils/dom.js';
import { formatTime } from '../utils/format.js';
import { createQuestCard, updateQuestCard } from './components/QuestCard.js';
import { iconToken } from './icons.js';

const PAGES = [
  { id: 'daily', label: `${iconToken('quest-daily')} Günlük` },
  { id: 'weekly', label: `${iconToken('quest-weekly')} Haftalık` },
  { id: 'monthly', label: `${iconToken('quest-monthly')} Aylık` },
  { id: 'calendar', label: `${iconToken('quest-monthly')} Giriş takvimi` },
];
const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
const pad = (n) => String(n).padStart(2, '0');

// Oyun ekranındaki görev penceresi: günlük, haftalık, aylık hedefler ve giriş takvimi.
// Açıkken hedef ilerlemeleri ve geri sayımlar canlı güncellenir.
export class GoalsModal {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.page = 'daily';
    this.cards = [];
    this.timer = 0;
    game.bus.on(Events.QUESTS_CHANGED, () => this.render());
  }

  get isOpen() {
    return !!this.body?.isConnected;
  }

  open(page = this.page) {
    this.page = page;
    this.tabButtons = PAGES.map((p) => el('button', { class: 'subnav-btn', dataset: { page: p.id }, text: p.label, onclick: () => this.show(p.id) }));
    this.body = el('div', { class: 'goals-modal-body' });
    this.ui.modal.show({
      title: '🎯 Görevler ve Ödüller',
      body: el('div', { class: 'goals-modal' }, [el('div', { class: 'subnav' }, this.tabButtons), this.body]),
      wide: true,
      buttons: [{ label: 'Kapat', class: 'btn-primary' }],
    });
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), 1000);
    this.render();
  }

  show(page) {
    this.page = page;
    this.render();
  }

  render() {
    if (!this.isOpen) return;
    for (const b of this.tabButtons) b.classList.toggle('active', b.dataset.page === this.page);
    const sections = { daily: () => this.dailySection(), weekly: () => this.boardSection('weekly'), monthly: () => this.boardSection('monthly'), calendar: () => this.calendarSection() };
    this.body.replaceChildren(sections[this.page]());
    this.tick();
  }

  /** Bugünün görevleri + giriş ödülü + bonus. */
  dailySection() {
    const { game } = this;
    const d = game.state.daily;
    this.cards = d.quests.map((quest, i) => createQuestCard(game, 'daily', i, quest));
    const loginBtn = el('button', { class: 'btn btn-buy', onclick: () => game.quests.claimLogin() });
    this.loginBtn = loginBtn;
    this.bonusBtn = el('button', { class: 'btn btn-primary', onclick: () => game.quests.claimBonus() });
    this.dailyReset = el('span', { class: 'muted' });
    return el('div', { class: 'goals-section' }, [
      el('div', { class: 'section-head' }, [el('h4', { class: 'section-title', text: 'Bugünün görevleri' }), this.dailyReset]),
      el('div', { class: 'quest-list' }, this.cards.map((c) => c.node)),
      el('div', { class: 'quest-bonus' }, [el('span', { text: `${iconToken('quest-bonus')} Üçünü de tamamla: ${ALL_DONE_REWARDS.map((r) => describeReward(game, r)).join(' + ')}` }), this.bonusBtn]),
      el('div', { class: 'section-head' }, [el('h4', { class: 'section-title', text: 'Günlük giriş ödülü' }), loginBtn]),
      el('div', { class: 'muted', text: `Seri: ${Math.max(1, d.streak)}. gün · bugünün ödülü: ${describeReward(game, game.quests.loginReward)}` }),
    ]);
  }

  /** Haftalık ya da aylık hedef tahtası (aynı yapı). */
  boardSection(kind) {
    const { game } = this;
    const board = game.state[kind];
    this.cards = board.quests.map((quest, i) => createQuestCard(game, kind, i, quest));
    this.boardBtn = el('button', { class: 'btn btn-primary', onclick: () => (kind === 'weekly' ? game.quests.claimWeeklyBonus() : game.quests.claimMonthlyBonus()) });
    this.boardReset = el('span', { class: 'muted' });
    const bonus = kind === 'weekly' ? WEEKLY_BONUS_REWARDS : MONTHLY_BONUS_REWARDS;
    const title = kind === 'weekly' ? 'Bu haftanın hedefleri' : 'Bu ayın hedefleri';
    this.boardKind = kind;
    return el('div', { class: 'goals-section' }, [
      el('div', { class: 'section-head' }, [el('h4', { class: 'section-title', text: `${iconToken(kind === 'weekly' ? 'quest-weekly' : 'quest-monthly')} ${title}` }), this.boardReset]),
      el('div', { class: 'quest-list' }, this.cards.map((c) => c.node)),
      el('div', { class: 'quest-bonus' }, [el('span', { text: `${iconToken('quest-bonus')} Üçünü de tamamla: ${bonus.map((r) => describeReward(game, r)).join(' + ')}` }), this.boardBtn]),
    ]);
  }

  /** Giriş takvimi: bu ayın girilen günleri, 7 günlük ödül merdiveni ve giriş ödülü. */
  calendarSection() {
    const { game } = this;
    const d = game.state.daily;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7; // Pazartesi'den başla
    const logged = new Set(d.loginDays ?? []);
    const today = dayKey(now.getTime());
    const monthName = now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(el('div', { class: 'cal-cell blank' }));
    let loggedThisMonth = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${year}-${pad(month + 1)}-${pad(day)}`;
      const isLogged = logged.has(key);
      if (isLogged) loggedThisMonth++;
      const cls = ['cal-cell'];
      if (isLogged) cls.push('logged');
      if (key === today) cls.push('today');
      if (key > today) cls.push('future');
      cells.push(el('div', { class: cls.join(' '), text: String(day) }));
    }

    const dayIndex = (Math.max(1, d.streak) - 1) % LOGIN_REWARDS.length;
    this.calLoginBtn = el('button', { class: 'btn btn-buy', onclick: () => game.quests.claimLogin() });
    this.calLoginBtn.textContent = d.loginClaimed ? 'Bugünün ödülü alındı' : `🎁 ${Math.max(1, d.streak)}. gün ödülünü al`;
    this.calLoginBtn.disabled = d.loginClaimed;

    return el('div', { class: 'goals-section' }, [
      el('div', { class: 'section-head' }, [el('h4', { class: 'section-title', text: monthName }), el('span', { class: 'muted', text: `Bu ay ${loggedThisMonth} gün giriş · seri ${Math.max(1, d.streak)} gün` })]),
      el('div', { class: 'cal-grid' }, [...WEEKDAYS.map((w) => el('div', { class: 'cal-head', text: w })), ...cells]),
      el('div', { class: 'section-head' }, [el('h4', { class: 'section-title', text: '7 günlük giriş ödülleri' }), this.calLoginBtn]),
      el(
        'div',
        { class: 'login-strip' },
        LOGIN_REWARDS.map((r, i) =>
          el('div', { class: `login-day${i < dayIndex || (i === dayIndex && d.loginClaimed) ? ' done' : ''}${i === dayIndex ? ' today' : ''}` }, [
            el('b', { text: `${i + 1}. gün` }),
            el('span', { text: describeReward(game, r) }),
          ])
        )
      ),
    ]);
  }

  /** Geri sayımlar ve kart durumları (her saniye). */
  tick() {
    if (!this.isOpen) {
      clearInterval(this.timer);
      return;
    }
    const { game } = this;
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    if (this.dailyReset) this.dailyReset.textContent = `Yeni görevler ${formatTime((midnight - now) / 1000)} sonra`;
    if (this.boardReset) {
      if (this.boardKind === 'weekly') {
        const daysIntoWeek = daysBetween('1970-01-01', dayKey(now.getTime())) % 7;
        this.boardReset.textContent = `${7 - daysIntoWeek} gün sonra yenilenir`;
      } else {
        const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1;
        this.boardReset.textContent = `${daysLeft} gün sonra yenilenir`;
      }
    }
    const pageData = this.page === 'daily' ? game.state.daily.quests : this.page === 'weekly' || this.page === 'monthly' ? game.state[this.page === 'weekly' ? 'weekly' : 'monthly'].quests : null;
    if (pageData) this.cards.forEach((c, i) => updateQuestCard(game, c, pageData[i]));
    if (this.bonusBtn) {
      this.bonusBtn.textContent = game.state.daily.bonusClaimed ? 'Alındı' : 'Bonus ödülü al';
      this.bonusBtn.disabled = !game.quests.canClaimBonus();
    }
    if (this.boardBtn) {
      const board = this.boardKind === 'weekly' ? game.state.weekly : game.state.monthly;
      const can = this.boardKind === 'weekly' ? game.quests.canClaimWeeklyBonus() : game.quests.canClaimMonthlyBonus();
      this.boardBtn.textContent = board.bonusClaimed ? 'Alındı' : 'Bonus ödülü al';
      this.boardBtn.disabled = !can;
    }
    if (this.loginBtn) {
      this.loginBtn.textContent = game.state.daily.loginClaimed ? 'Bugünün ödülü alındı' : `🎁 ${Math.max(1, game.state.daily.streak)}. gün ödülünü al`;
      this.loginBtn.disabled = game.state.daily.loginClaimed;
    }
  }
}
