import { iconToken } from './icons.js';
import { AUTOSAVE_CHOICES, DEFAULT_KEYS, POTION_THRESHOLD_RANGE } from '../config/constants.js';
import { Events } from '../core/events.js';
import { TREE_NODES } from '../data/soulTree.js';
import { CLASS_MAP } from '../data/classes.js';
import { el } from '../utils/dom.js';
import { formatNumber, formatTime } from '../utils/format.js';

// Sol dikey menü: her sayfa sağdaki içerik alanında açılır
const PAGES = [
  { id: 'look', label: '🔊 Ses & görünüm' },
  { id: 'game', label: '🎮 Oyun' },
  { id: 'save', label: '💾 Kayıt' },
  { id: 'controls', label: '⌨️ Tuşlar' },
  { id: 'stats', label: '📊 İstatistikler' },
];

// Yeniden atanamayan, sabit kısayollar (bilgi amaçlı listelenir)
const FIXED_SHORTCUTS = [
  ['1 – 9', 'Menü sekmeleri'],
  ['Q W E R T', 'Yetenekler'],
  ['Esc', 'Ayarlar / pencereyi kapat'],
  ['Ctrl + tık', 'Eşyayı kilitle'],
];
// Yeniden atanabilir kısayollar: ayar anahtarı ve açıklaması
const REBINDABLE = [
  { id: 'potion', label: 'Can iksiri' },
  { id: 'menu', label: 'Alt menüyü gizle / göster' },
  { id: 'boss', label: "İlerle / Boss'a meydan oku" },
  { id: 'pause', label: 'Duraklat / devam et' },
];

// Üst bardaki ⚙️ ile açılan pencere: dört sekme (ses ve görünüm, oyun, kayıt, kontroller) ve istatistikler.
export class SettingsModal {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.page = 'look';
    this.waitingFor = null; // yeniden atama bekleyen tuş (id)
  }

  get settings() {
    return this.game.state.settings;
  }

  changed() {
    this.game.bus.emit(Events.SETTINGS_CHANGED, this.settings);
  }

  open() {
    this.page = 'look';
    this.waitingFor = null;
    // Kabuk: solda dikey menü, sağda seçili sayfanın içeriği
    this.body = el('div', { class: 'settings-content' });
    this.tabButtons = PAGES.map((p) => el('button', { class: 'settings-nav-btn', dataset: { page: p.id }, text: p.label, onclick: () => this.show(p.id) }));
    const nav = el('nav', { class: 'settings-nav' }, this.tabButtons);
    this.ui.modal.show({
      title: '⚙️ Ayarlar',
      body: el('div', { class: 'settings-shell' }, [nav, this.body]),
      wide: true,
      buttons: [{ label: 'Kapat', class: 'btn-primary' }],
    });
    this.render();
  }

  show(page) {
    this.page = page;
    this.waitingFor = null;
    this.render();
  }

  render() {
    if (!this.body?.isConnected) return;
    for (const b of this.tabButtons) b.classList.toggle('active', b.dataset.page === this.page);
    const pages = {
      look: () => this.lookPage(),
      game: () => this.gamePage(),
      save: () => this.savePage(),
      controls: () => this.controlsPage(),
      stats: () => this.statsPage(),
    };
    this.body.replaceChildren(pages[this.page]());
  }

  /**
   * Onay kutusu: get() mevcut değeri, set(v) yeni değeri yazar; değişince ayar kaydedilir ve olay yayılır.
   */
  check(label, get, set) {
    return el('label', { class: 'check' }, [
      el('input', {
        type: 'checkbox',
        checked: !!get(),
        onchange: (e) => {
          set(e.target.checked);
          this.changed();
        },
      }),
      ` ${label}`,
    ]);
  }

  // ---------- Ses ve görünüm ----------
  lookPage() {
    const { settings } = this;
    return el('div', { class: 'settings-page' }, [
      el('h4', { class: 'section-title', text: 'Ses' }),
      this.check('Ses efektleri', () => settings.audio !== false, (v) => {
        settings.audio = v;
        if (v) this.game.audio?.play('ui');
      }),
      this.check('Arayüz tıklama sesleri', () => settings.uiSounds !== false, (v) => (settings.uiSounds = v)),
      this.volumeRow(settings),
      el('h4', { class: 'section-title', text: 'Görünüm' }),
      this.check('Piksel sanat görünümü', () => settings.pixelArt !== false, (v) => (settings.pixelArt = v)),
      this.check('Yüksek kontrast', () => !!settings.highContrast, (v) => (settings.highContrast = v)),
      this.check('Hareketi azalt (ekran sarsıntısı kapalı)', () => !!settings.reduceMotion, (v) => (settings.reduceMotion = v)),
    ]);
  }

  /** Ses düzeyi kaydırıcısı; oynatırken kısa bir örnek ses çalar. */
  volumeRow(settings) {
    const { game } = this;
    const value = el('span', { class: 'value', text: `${Math.round((settings.volume ?? 0.7) * 100)}%` });
    const range = el('input', {
      type: 'range',
      min: '0',
      max: '1',
      step: '0.05',
      value: String(settings.volume ?? 0.7),
      oninput: (e) => {
        settings.volume = Number(e.target.value);
        value.textContent = `${Math.round(settings.volume * 100)}%`;
        game.bus.emit(Events.SETTINGS_CHANGED, settings);
        game.audio?.play('ui');
      },
    });
    return el('label', { class: 'slider' }, [range, 'Ses düzeyi', value]);
  }

  // ---------- Oyun ----------
  gamePage() {
    const { game, settings } = this;
    const [minT, maxT] = POTION_THRESHOLD_RANGE;
    const thresholdValue = el('span', { class: 'value', text: `%${Math.round((settings.potionThreshold ?? 0.35) * 100)}` });
    const threshold = el('input', {
      type: 'range',
      min: String(minT),
      max: String(maxT),
      step: '0.05',
      value: String(settings.potionThreshold ?? 0.35),
      oninput: (e) => {
        settings.potionThreshold = Number(e.target.value);
        thresholdValue.textContent = `%${Math.round(settings.potionThreshold * 100)}`;
        this.changed();
      },
    });
    const autosave = el(
      'select',
      {
        class: 'select',
        onchange: (e) => {
          settings.autosaveSeconds = Number(e.target.value);
          this.changed();
        },
      },
      AUTOSAVE_CHOICES.map((s) => el('option', { value: s, text: `${s} saniyede bir`, selected: s === settings.autosaveSeconds }))
    );
    return el('div', { class: 'settings-page' }, [
      el('h4', { class: 'section-title', text: 'Otomatik işlemler' }),
      this.check('Otomatik iksir iç', () => !!settings.autoPotion, (v) => (settings.autoPotion = v)),
      el('label', { class: 'slider' }, [threshold, 'Otomatik iksir eşiği (can)', thresholdValue]),
      this.check(
        'Tüm yetenekleri otomatik kullan',
        () => Object.values(game.state.skillAuto).every(Boolean),
        (v) => {
          for (const id of Object.keys(game.state.skillAuto)) game.skills.setAuto(id, v);
        }
      ),
      el('h4', { class: 'section-title', text: 'Bildirimler' }),
      ...[
        ['loot', 'Eşya düşünce bildir'],
        ['achievements', 'Başarım açılınca bildir'],
        ['quests', 'Görev tamamlanınca bildir'],
        ['rewards', 'Ödül verilince bildir'],
      ].map(([key, label]) =>
        this.check(label, () => settings.notify?.[key] !== false, (v) => {
          settings.notify = { ...settings.notify, [key]: v };
        })
      ),
      el('h4', { class: 'section-title', text: 'Kayıt sıklığı' }),
      el('label', { class: 'slider' }, ['Otomatik kayıt', autosave]),
    ]);
  }

  // ---------- Kayıt ----------
  savePage() {
    const { game, ui } = this;
    const s = game.state;
    const cls = CLASS_MAP[s.classes?.active]?.name ?? 'Savaşçı';
    const summary = el('ul', { class: 'stat-list compact' }, [
      ['Şu anki bölge', s.stage],
      ['En yüksek bölge', s.bestStage],
      ['Ruh', formatNumber(s.souls)],
      ['Sınıf', cls],
      ['Kule mührü / elmas', `🔷 ${formatNumber(s.seals)} · 💎 ${formatNumber(s.gems || 0)}`],
      ['Oynama süresi', formatTime(s.stats.playTime)],
    ].map(([k, v]) => el('li', {}, [el('span', { text: k }), el('b', { text: String(v) })])));

    const backups = game.saveManager.listBackups();
    const backupList = backups.length
      ? el('ul', { class: 'stat-list compact' }, backups.map((b, i) => this.backupRow(b, i)))
      : el('p', { class: 'muted', text: 'Henüz yedek yok. "Şimdi Kaydet" ve içe aktarma/sıfırlama öncesinde yedek alınır.' });

    return el('div', { class: 'settings-page' }, [
      el('h4', { class: 'section-title', text: 'Kayıt özeti' }),
      summary,
      el('h4', { class: 'section-title', text: 'İşlemler' }),
      el('div', { class: 'button-row' }, [
        el('button', {
          class: 'btn btn-sm',
          text: `${iconToken('save')} Şimdi Kaydet`,
          onclick: () => {
            game.saveGame();
            game.saveManager.backup(s);
            ui.toast.show('Oyun kaydedildi (yedek alındı)', 'success');
            this.render();
          },
        }),
        el('button', { class: 'btn btn-sm', text: `${iconToken('export')} Dışa Aktar`, onclick: () => this.exportSave() }),
        el('button', { class: 'btn btn-sm', text: `${iconToken('import')} İçe Aktar`, onclick: () => this.importSave() }),
        el('button', { class: 'btn btn-sm btn-danger', text: `${iconToken('reset')} Sıfırla`, onclick: () => this.reset() }),
      ]),
      el('h4', { class: 'section-title', text: 'Son yedekler' }),
      backupList,
      el('p', { class: 'muted', text: 'Oyun ayarlanan aralıkla otomatik kaydedilir ve sekme kapanırken kaydedilir. Kapalıyken geçen süre için (en fazla 8 saat) altın kazanırsın.' }),
    ]);
  }

  backupRow(entry, index) {
    const when = new Date(entry.at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    return el('li', {}, [
      el('span', { text: `${when} · ${entry.stage ?? '?'}. bölge` }),
      el('button', { class: 'btn btn-sm', text: 'Geri yükle', onclick: () => this.restoreBackup(index, when) }),
    ]);
  }

  async restoreBackup(index, when) {
    const ok = await this.ui.modal.confirm('Yedeği geri yükle?', `${when} tarihli yedek yüklenecek. Mevcut ilerleme yerine geçer.`, 'Geri yükle', true);
    if (!ok) return;
    const code = this.game.saveManager.backupCode(index);
    if (code) this.game.importSave(code);
  }

  // ---------- Kontroller ----------
  controlsPage() {
    const { settings } = this;
    const keys = settings.keys ?? DEFAULT_KEYS;
    const rebind = (action) => {
      const waiting = this.waitingFor === action.id;
      const btn = el('button', {
        class: `kbd-btn${waiting ? ' waiting' : ''}`,
        text: waiting ? 'Bir tuşa bas… (Esc iptal)' : keys[action.id],
        onclick: () => {
          this.waitingFor = waiting ? null : action.id;
          this.render();
          if (this.waitingFor) this.captureKey(action.id);
        },
      });
      return el('li', {}, [el('span', { text: action.label }), btn]);
    };
    return el('div', { class: 'settings-page' }, [
      el('h4', { class: 'section-title', text: 'Oyun tuşları (değiştirilebilir)' }),
      el('ul', { class: 'stat-list compact' }, REBINDABLE.map(rebind)),
      el('div', { class: 'button-row' }, [el('button', { class: 'btn btn-sm', text: 'Varsayılana dön', onclick: () => this.resetKeys() })]),
      el('p', { class: 'muted', text: 'Tuşlar tek harf olmalı; sayı tuşları ve Q W E R T (yetenekler) ayrılmıştır. Aynı tuş iki işleme atanamaz.' }),
      el('h4', { class: 'section-title', text: 'Sabit kısayollar' }),
      el('ul', { class: 'stat-list compact' }, FIXED_SHORTCUTS.map(([k, v]) => el('li', {}, [el('span', { text: v }), el('kbd', { text: k })]))),
    ]);
  }

  /** Bir sonraki basılan tuşu yakalar; Esc iptal eder. */
  captureKey(action) {
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.removeEventListener('keydown', handler, true);
      if (e.key === 'Escape') {
        this.waitingFor = null;
        this.render();
        return;
      }
      this.assignKey(action, e.key.toUpperCase());
    };
    window.addEventListener('keydown', handler, true);
  }

  assignKey(action, key) {
    this.waitingFor = null;
    const keys = this.settings.keys ?? { ...DEFAULT_KEYS };
    if (!/^[A-Z]$/.test(key) || ['Q', 'W', 'E', 'R', 'T'].includes(key)) {
      this.ui.toast.show('Bu tuş atanamaz (harf seç; Q W E R T ayrılmış)', 'error');
    } else if (Object.entries(keys).some(([id, k]) => id !== action && k === key)) {
      this.ui.toast.show(`${key} zaten başka bir işlemde`, 'error');
    } else {
      keys[action] = key;
      this.settings.keys = keys;
      this.changed();
      this.ui.toast.show(`${key} olarak atandı`, 'success');
    }
    this.render();
  }

  resetKeys() {
    this.settings.keys = { ...DEFAULT_KEYS };
    this.changed();
    this.render();
  }

  // ---------- İstatistikler (menüden açılan sayfa) ----------
  statsPage() {
    return el('div', { class: 'settings-page' }, [el('h4', { class: 'section-title', text: '📊 İstatistikler' }), this.statsList()]);
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
      ['Ruh Ağacı düğümü', `${this.game.tree.purchasedCount} / ${TREE_NODES.length}`],
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
      body: el('div', {}, [el('p', { class: 'muted', text: 'Mevcut ilerlemenin üzerine yazılır (önce otomatik yedek alınır).' }), area]),
      buttons: [
        { label: 'Vazgeç' },
        {
          label: 'Yükle',
          class: 'btn-primary',
          onClick: () => {
            try {
              this.game.saveManager.backup(this.game.state); // üzerine yazmadan önce yedek
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
    const ok = await this.ui.modal.confirm('Oyunu sıfırla?', 'Tüm ilerleme <b>kalıcı olarak</b> silinecek (önce yedek alınır).', 'Sil ve Baştan Başla', true);
    if (!ok) return;
    this.game.saveManager.backup(this.game.state);
    this.game.resetGame();
  }
}
