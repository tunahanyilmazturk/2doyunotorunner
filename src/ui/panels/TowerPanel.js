import { Events } from '../../core/events.js';
import { BOSSES } from '../../data/monsters.js';
import { TOWER_DAILY_ATTEMPTS, TOWER_UNLOCK_STAGE, floorRewards, towerBossId, towerStage } from '../../data/tower.js';
import { describeReward } from '../../systems/rewards.js';
import { el } from '../../utils/dom.js';
import { formatTime } from '../../utils/format.js';

const PREVIEW_FLOORS = 6; // alt panel yüksekliğini sınırlı tutmak için kısa önizleme

// Boss Kulesi sekmesi: giriş, haklar, sıradaki katlar ve ödülleri.
export class TowerPanel {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
  }

  mount(root) {
    const tower = this.game.tower;
    this.best = el('b');
    this.attempts = el('b');
    this.keys = el('b');
    this.reset = el('span', { class: 'muted' });
    this.status = el('div', { class: 'tower-status' });
    this.enterBtn = el('button', { class: 'btn btn-prestige', onclick: () => this.enter() });
    this.exitBtn = el('button', { class: 'btn btn-danger btn-block', text: '🚪 Kuleden çık', onclick: () => tower.end('exit') });
    this.floors = el('div', { class: 'tower-floors' });

    root.append(
      el('div', { class: 'tower-layout' }, [
        el('aside', { class: 'tower-side' }, [
          el('div', { class: 'tower-stats' }, [
            el('div', {}, ['🏆 En yüksek kat: ', this.best]),
            el('div', {}, ['🎟️ Bugünkü hak: ', this.attempts, ` / ${TOWER_DAILY_ATTEMPTS}`]),
            el('div', {}, ['🗝️ Anahtar: ', this.keys]),
            this.reset,
          ]),
          this.status,
          this.enterBtn,
          this.exitBtn,
          el('div', {
            class: 'muted',
            text: 'Giriş, en yüksek katın bir üstünden başlar. Ödüller ilk geçişte verilir; kuledeyken bölge ilerlemen donar.',
          }),
        ]),
        el('div', {}, [el('h4', { class: 'section-title', text: 'Sıradaki katlar' }), this.floors]),
      ])
    );
    const { bus } = this.game;
    bus.on(Events.TOWER_CHANGED, () => this.render());
    bus.on(Events.TOWER_STARTED, () => this.render());
    bus.on(Events.TOWER_ENDED, () => this.render());
    this.render();
  }

  enter() {
    if (this.game.tower.enter()) this.ui.setDockCollapsed?.(false);
  }

  /** Menü rozeti: bugünkü hak kullanılmamışsa */
  badge() {
    const t = this.game.state.tower;
    return this.game.tower.unlocked && !this.game.tower.active && t.attempts > 0 ? t.attempts : 0;
  }

  render() {
    const { game } = this;
    const tower = game.tower;
    const start = tower.active ? tower.floor : tower.nextFloor;
    this.floors.replaceChildren(
      ...Array.from({ length: PREVIEW_FLOORS }, (_, i) => {
        const floor = start + i;
        const boss = BOSSES[towerBossId(floor)];
        const rewards = floorRewards(floor).map((r) => describeReward(game, r)).join(' · ');
        return el('div', { class: `tower-floor${tower.active && floor === tower.floor ? ' current' : ''}${floor % 5 === 0 ? ' milestone' : ''}` }, [
          el('span', { class: 'tower-floor-no', text: `Kat ${floor}` }),
          el('div', { class: 'tower-floor-info' }, [
            el('b', { text: boss.name }),
            el('div', { class: 'muted', text: `Güç: ${towerStage(floor)}. bölge bossu · Ödül: ${rewards}` }),
          ]),
        ]);
      })
    );
    this.tick();
  }

  tick() {
    const { game } = this;
    const tower = game.tower;
    const t = game.state.tower;
    this.best.textContent = t.best;
    this.attempts.textContent = t.attempts;
    this.keys.textContent = t.keys;
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    this.reset.textContent = `Haklar ${formatTime((midnight - now) / 1000)} sonra yenilenir`;
    this.enterBtn.hidden = tower.active;
    this.exitBtn.hidden = !tower.active;
    this.status.textContent = tower.active ? `🗼 Şu an ${tower.floor}. kattasın` : `Sıradaki kat: ${tower.nextFloor}`;
    this.enterBtn.disabled = !tower.canEnter;
    this.enterBtn.textContent = !tower.unlocked
      ? `🔒 ${TOWER_UNLOCK_STAGE}. bölgeye ulaşınca açılır`
      : t.attempts > 0 ? '🗼 Kuleye gir (1 hak)' : t.keys > 0 ? '🗼 Kuleye gir (1 anahtar)' : 'Bugünlük hakkın bitti';
  }
}
