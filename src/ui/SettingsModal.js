import { iconToken } from './icons.js';
import { Events } from '../core/events.js';
import { el } from '../utils/dom.js';
import { formatNumber, formatTime } from '../utils/format.js';

const SHORTCUTS = [
  ['1 – 7', 'Menü sekmeleri'],
  ['Q W E R T', 'Yetenekler'],
  ['M', 'Alt menüyü gizle / göster'],
  ['F', 'Can iksiri'],
  ['B', "İlerle / Boss'a meydan oku"],
  ['Esc', 'Ayarlar / pencereyi kapat'],
  ['Ctrl + tık', 'Eşyayı kilitle'],
];

// Üst bardaki ⚙️ ile açılan pencere: oyun ayarları, kayıt işlemleri, kısayollar, istatistikler.
export class SettingsModal {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
  }

  open() {
    const { game } = this;
    const settings = game.state.settings;

    const toggle = (label, checked, onChange) =>
      el('label', { class: 'check' }, [el('input', { type: 'checkbox', checked, onchange: (e) => onChange(e.target.checked) }), ` ${label}`]);

    const body = el('div', { class: 'settings-grid' }, [
      el('section', {}, [
        el('h4', { class: 'section-title', text: '🎮 Oyun' }),
        toggle('Can %35 altına inince otomatik iksir iç', settings.autoPotion, (v) => {
          settings.autoPotion = v;
          game.bus.emit(Events.SETTINGS_CHANGED, settings);
        }),
        toggle('Piksel sanat görünümü', settings.pixelArt !== false, (v) => {
          settings.pixelArt = v;
          game.bus.emit(Events.SETTINGS_CHANGED, settings);
        }),
        toggle('Tüm yetenekleri otomatik kullan', Object.values(game.state.skillAuto).every(Boolean), (v) => {
          for (const id of Object.keys(game.state.skillAuto)) game.skills.setAuto(id, v);
        }),
        el('h4', { class: 'section-title', text: '💾 Kayıt' }),
        el('div', { class: 'button-row' }, [
          el('button', {
            class: 'btn btn-sm',
            text: `${iconToken('save')} Şimdi Kaydet`,
            onclick: () => {
              game.saveGame();
              this.ui.toast.show('Oyun kaydedildi', 'success');
            },
          }),
          el('button', { class: 'btn btn-sm', text: `${iconToken('export')} Dışa Aktar`, onclick: () => this.exportSave() }),
          el('button', { class: 'btn btn-sm', text: `${iconToken('import')} İçe Aktar`, onclick: () => this.importSave() }),
          el('button', { class: 'btn btn-sm btn-danger', text: `${iconToken('reset')} Sıfırla`, onclick: () => this.reset() }),
        ]),
        el('p', { class: 'muted', text: 'Oyun her 10 saniyede ve sekme kapanırken otomatik kaydedilir. Kapalıyken geçen süre için (en fazla 8 saat) altın kazanırsın.' }),
        el('h4', { class: 'section-title', text: '⌨️ Kısayollar' }),
        el('ul', { class: 'stat-list compact' }, SHORTCUTS.map(([k, v]) => el('li', {}, [el('span', { text: v }), el('kbd', { text: k })]))),
      ]),
      el('section', {}, [el('h4', { class: 'section-title', text: '📊 İstatistikler' }), this.statsList()]),
    ]);

    this.ui.modal.show({ title: '⚙️ Ayarlar', body, wide: true, buttons: [{ label: 'Kapat', class: 'btn-primary' }] });
  }

  statsList() {
    const { state } = this.game;
    const s = state.stats;
    const rows = [
      ['Oynama süresi', formatTime(s.playTime)],
      ['En yüksek bölge', state.bestStage],
      ['Toplam öldürme', formatNumber(s.totalKills)],
      ['Elit öldürme', formatNumber(s.elitesKilled)],
      ['Yenilen boss', formatNumber(s.bossKills)],
      ['Toplam altın', formatNumber(s.totalGold)],
      ['Bulunan eşya', formatNumber(s.itemsFound)],
      ['Efsanevi+ eşya', formatNumber(s.legendariesFound)],
      ['En yüksek güçlendirme', `+${s.maxEnhance}`],
      ['Yetenek kullanımı', formatNumber(s.skillsCast)],
      ['Ölüm', formatNumber(s.deaths)],
      ['Yeniden doğuş', formatNumber(s.prestiges)],
      ['Kazanılan Ruh', formatNumber(state.soulsEarned)],
      ['Ruh Ağacı düğümü', `${this.game.tree.purchasedCount} / 25`],
    ];
    return el('ul', { class: 'stat-list compact' }, rows.map(([k, v]) => el('li', {}, [el('span', { text: k }), el('b', { text: String(v) })])));
  }

  exportSave() {
    const code = this.game.saveManager.exportString(this.game.state);
    const area = el('textarea', { class: 'save-area', readonly: true });
    area.value = code;
    this.ui.modal.show({
      title: 'Kaydı Dışa Aktar',
      body: el('div', {}, [el('p', { class: 'muted', text: 'Bu kodu bir yere kopyala:' }), area]),
      buttons: [
        {
          label: 'Kopyala',
          class: 'btn-primary',
          keepOpen: true,
          onClick: () => {
            area.select();
            navigator.clipboard?.writeText(code).then(
              () => this.ui.toast.show('Panoya kopyalandı', 'success'),
              () => this.ui.toast.show('Kopyalanamadı, elle seç', 'error')
            );
          },
        },
        { label: 'Kapat' },
      ],
    });
  }

  importSave() {
    const area = el('textarea', { class: 'save-area', placeholder: 'Kayıt kodunu yapıştır...' });
    this.ui.modal.show({
      title: 'Kaydı İçe Aktar',
      body: el('div', {}, [el('p', { class: 'muted', text: 'Mevcut ilerlemenin üzerine yazılır.' }), area]),
      buttons: [
        { label: 'Vazgeç' },
        {
          label: 'Yükle',
          class: 'btn-primary',
          onClick: () => {
            try {
              this.game.importSave(area.value);
            } catch {
              this.ui.toast.show('Geçersiz kayıt kodu', 'error');
              return false;
            }
          },
        },
      ],
    });
  }

  async reset() {
    const ok = await this.ui.modal.confirm('Oyunu sıfırla?', 'Tüm ilerleme <b>kalıcı olarak</b> silinecek.', 'Sil ve Baştan Başla', true);
    if (ok) this.game.resetGame();
  }
}
