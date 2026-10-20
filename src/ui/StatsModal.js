import { Events } from '../core/events.js';
import { el } from '../utils/dom.js';
import { buildStatRows } from './statRows.js';

// Can barının yanındaki 📊 düğmesiyle açılan karakter statları penceresi.
// Açıkken stat değişirse (kuşanma, yükseltme, iksir) satırlar canlı güncellenir.
export class StatsModal {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.list = null;
    game.bus.on(Events.STATS_CHANGED, () => this.render());
    game.bus.on(Events.STAGE_CHANGED, () => this.render());
  }

  get isOpen() {
    return !!this.list?.isConnected;
  }

  open() {
    this.list = el('ul', { class: 'stat-list stat-modal-list' });
    this.ui.modal.show({
      title: '📊 Karakter Statları',
      body: el('div', { class: 'stat-modal' }, [this.list]),
      buttons: [{ label: 'Kapat', class: 'btn-primary' }],
    });
    this.render();
  }

  /** Pencere açıkken satırları yeniler; kapalıyken hiçbir şey yapmaz. */
  render() {
    if (!this.isOpen) return;
    this.list.replaceChildren(
      ...buildStatRows(this.game).map(([k, v]) => el('li', { class: k.includes('DPS') ? 'stat-dps' : '' }, [el('span', { text: k }), el('b', { text: v })]))
    );
  }
}
