import { Events } from '../../core/events.js';
import { STAT_DEFS } from '../../data/stats.js';
import { MILESTONE_EVERY, UPGRADES, nextMilestone, upgradeValue } from '../../data/upgrades.js';
import { PROFILES, rankRows } from '../../systems/UpgradeAdvisor.js';
import { el } from '../../utils/dom.js';
import { formatNumber } from '../../utils/format.js';

import { iconToken } from '../icons.js';

const MODES = [1, 10, 'max'];
// Alım geri bildirimi: satır bu süre boyunca parlar (CSS .bought animasyonu).
const GLOW_MS = 350;

const SORTS = [
  { id: 'default', name: 'Katalog' },
  { id: 'value', name: 'Verim' },
  { id: 'cost', name: 'Fiyat' },
  { id: 'level', name: 'Seviye' },
];
const FILTERS = [
  { id: 'all', name: 'Tümü' },
  { id: 'affordable', name: 'Alınabilir' },
  { id: 'marked', name: 'İşaretli' },
  { id: 'maxed', name: 'MAKS' },
];

// Altın yükseltmeleri: toplu alım, kilometre taşları (her 25 seviyede ×2),
// tahmini verim göstergesi ("ne alsam?"), sıralama/filtre/arama ve oto-alım.
export class UpgradePanel {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.rows = [];
    this.view = { sort: 'default', filter: 'all', query: '' };
    // DOM yalnızca sıra/filtre imzası değişince yeniden dizilir (kare başına
    // düğüm taşıma animasyonları ve imleci bozar).
    this.orderSignature = '';
    this.glowTimers = new Map();
    // Parıltılar tek karede toplanır: her alım için zorunlu yerleşim (reflow)
    // tetiklemek oto-alımda (tur başına 50 alım) kareyi düşürüyordu.
    this.pendingGlow = new Set();
    this.glowFrame = 0;
  }

  mount(root) {
    const { game } = this;
    const sys = game.upgrades;

    this.modeButtons = MODES.map((mode) =>
      el('button', {
        class: 'btn btn-sm mode-btn',
        text: mode === 'max' ? 'MAX' : `x${mode}`,
        onclick: () => {
          sys.buyMode = mode;
          this.tick();
        },
      })
    );
    this.autoToggle = el('input', { type: 'checkbox', onchange: (e) => sys.setAuto(e.target.checked) });
    this.autoLabel = el('label', { class: 'check auto-check' }, [this.autoToggle, ' 🤖 Otomatik al']);
    this.profileSelect = el(
      'select',
      { class: 'select up-profile', title: 'Oto-alım önceliği', onchange: (e) => sys.setProfile(e.target.value) },
      PROFILES.map((p) => el('option', { value: p.id, text: `${p.icon} ${p.name}` }))
    );

    this.bestBtn = el('button', {
      class: 'btn btn-sm btn-primary',
      text: '⚡ En iyisini al',
      onclick: () => {
        if (sys.buyBest() > 0) this.tick();
      },
    });

    this.sortSelect = el(
      'select',
      {
        class: 'select',
        title: 'Sıralama',
        onchange: (e) => {
          this.view.sort = e.target.value;
          this.tick();
        },
      },
      SORTS.map((s) => el('option', { value: s.id, text: `↕ ${s.name}` }))
    );
    this.filterSelect = el(
      'select',
      {
        class: 'select',
        title: 'Filtre',
        onchange: (e) => {
          this.view.filter = e.target.value;
          this.tick();
        },
      },
      FILTERS.map((f) => el('option', { value: f.id, text: `⌛ ${f.name}` }))
    );
    this.searchInput = el('input', {
      class: 'input up-search',
      type: 'search',
      placeholder: 'Yükseltme ara…',
      oninput: (e) => {
        this.view.query = e.target.value;
        this.tick();
      },
    });

    this.empty = el('div', { class: 'up-empty muted', text: '🔍 Bu sıralama/filtreye uyan yükseltme yok.' });

    this.list = el('div', { class: 'upgrade-list' });
    for (const up of UPGRADES) {
      const row = {
        up,
        level: el('span', { class: 'up-level' }),
        effect: el('div', { class: 'up-effect' }),
        mile: el('div', { class: 'up-mile' }, [el('span')]),
        effBar: el('span'),
        effLabel: el('span', { class: 'up-eff-label' }),
        btn: el('button', { class: 'btn btn-buy', onclick: (e) => this.buy(up.id, e) }),
        auto: el('input', { type: 'checkbox', title: 'Otomatik alıma dahil', onchange: (e) => sys.setRowAuto(up.id, e.target.checked) }),
      };
      row.eff = el('div', { class: 'up-eff' }, [el('div', { class: 'up-eff-track' }, [row.effBar]), row.effLabel]);
      row.node = el('div', { class: 'upgrade-row', title: `${up.name}: ${up.desc}` }, [
        el('div', { class: 'up-icon', text: iconToken(`upgrade-${up.id}`) }),
        el('div', { class: 'up-info' }, [el('div', { class: 'up-name' }, [el('b', { text: up.name }), row.level]), row.effect, row.mile, row.eff]),
        el('div', { class: 'up-actions' }, [row.btn, row.auto]),
      ]);
      this.rows.push(row);
      this.list.append(row.node);
    }

    root.append(
      el('div', { class: 'toolbar' }, [
        el('div', { class: 'toolbar-group' }, [el('label', { text: 'Satın alma:' }), ...this.modeButtons]),
        el('div', { class: 'toolbar-group' }, [this.bestBtn, this.autoLabel, this.profileSelect]),
      ]),
      el('div', { class: 'toolbar up-filters' }, [
        el('div', { class: 'toolbar-group' }, [this.sortSelect, this.filterSelect, this.searchInput]),
        el('div', { class: 'toolbar-group' }, [el('span', { class: 'muted', text: `⭐ Her ${MILESTONE_EVERY} seviyede etki ×2` })]),
      ]),
      this.list,
      this.empty
    );
    game.bus.on(Events.SETTINGS_CHANGED, () => this.tick());
    game.bus.on(Events.UPGRADE_BOUGHT, ({ id }) => this.glow(id));
    this.tick();
  }

  /** Shift → x10, Ctrl/Cmd → MAX; başka türlü panelin seçili modu. */
  buy(id, event) {
    const sys = this.game.upgrades;
    const mode = event?.ctrlKey || event?.metaKey ? 'max' : event?.shiftKey ? 10 : sys.buyMode;
    if (sys.buy(id, mode)) this.tick();
  }

  /**
   * Alım geri bildirimi: satırı kısa bir süre parlatır. Sekme kapalıysa hiç
   * uğraşmaz; açıkken aynı karedeki tüm alımlar tek yerleşimle başlatılır.
   */
  glow(id) {
    const row = this.rows.find((r) => r.up.id === id);
    if (!row || !row.node.offsetParent) return;
    this.pendingGlow.add(id);
    if (this.glowFrame) return;
    this.glowFrame = requestAnimationFrame(() => {
      this.glowFrame = 0;
      const glowing = [...this.pendingGlow].map((pid) => this.rows.find((r) => r.up.id === pid)).filter(Boolean);
      this.pendingGlow.clear();
      if (!glowing.length) return;
      for (const r of glowing) r.node.classList.remove('bought');
      void this.list.offsetWidth; // animasyonu baştan başlatmak için tek yeniden akış
      for (const r of glowing) {
        r.node.classList.add('bought');
        clearTimeout(this.glowTimers.get(r.up.id));
        this.glowTimers.set(
          r.up.id,
          setTimeout(() => r.node.classList.remove('bought'), GLOW_MS)
        );
      }
    });
  }

  /** Menü rozeti: şu an alınabilecek (x1) yükseltme sayısı (otomatik alım açıksa gösterilmez) */
  badge() {
    const sys = this.game.upgrades;
    if (sys.autoEnabled) return 0;
    const gold = this.game.state.gold;
    return UPGRADES.filter((u) => !sys.isMaxed(u) && gold >= sys.costAt(u, sys.level(u.id))).length;
  }

  formatValue(stat, v) {
    const def = STAT_DEFS[stat];
    if (def.percent) return `${+v.toFixed(1)}%`;
    return formatNumber(v);
  }

  tick() {
    const { game } = this;
    const sys = game.upgrades;
    this.modeButtons.forEach((b, i) => b.classList.toggle('active', MODES[i] === sys.buyMode));
    this.autoToggle.checked = sys.autoEnabled;
    this.autoToggle.disabled = !sys.autoUnlocked;
    this.profileSelect.value = sys.profile;
    this.profileSelect.disabled = !sys.autoUnlocked;
    this.autoLabel.title = sys.autoUnlocked ? 'İşaretli yükseltmeleri seçili önceliğe göre kendiliğinden alır' : 'İlk yeniden doğuştan sonra açılır';
    this.autoLabel.classList.toggle('disabled', !sys.autoUnlocked);

    // 1) Tüm satırların anlık durumu (seviye, fiyat, tahmini verim)
    const query = this.view.query.trim().toLocaleLowerCase('tr');
    const items = [];
    for (const row of this.rows) {
      const { up } = row;
      const lvl = sys.level(up.id);
      const maxed = sys.isMaxed(up);
      const m = maxed ? null : sys.metrics(up);
      const cost = m ? m.cost : sys.costAt(up, lvl);
      const affordable = !!m && m.affordable;
      const marked = game.state.upgradeAuto[up.id] !== false;
      const matchesQuery = !query || up.name.toLocaleLowerCase('tr').includes(query) || up.stat.toLocaleLowerCase('tr').includes(query);
      const visible =
        matchesQuery &&
        (this.view.filter === 'all' ||
          (this.view.filter === 'affordable' ? affordable : this.view.filter === 'marked' ? marked && !maxed : maxed));
      items.push({ row, up, lvl, maxed, m, cost, affordable, marked, visible });
    }

    // 2) Verim sıralaması: en iyi satır 100 (çubuk ölçeği)
    const pool = items.filter((i) => !i.maxed && i.m);
    const ranks = rankRows(pool.map((i) => ({ eff: i.m.eff })));
    pool.forEach((item, i) => (item.rank = ranks[i]));
    // Şeritteki ⚡ "en iyisini al"ın ilk alacağı satırı (işaretli + alınabilir) gösterir
    let best = null;
    for (const item of pool) {
      if (!item.affordable || !item.marked) continue;
      if (!best || item.rank > best.rank) best = item;
    }

    // 3) Sıralama + dizilim (imza değişmediyse DOM'a dokunulmaz)
    const sorted = [...items];
    if (this.view.sort === 'value') sorted.sort((a, b) => (b.rank ?? -1) - (a.rank ?? -1));
    else if (this.view.sort === 'cost') sorted.sort((a, b) => a.cost - b.cost);
    else if (this.view.sort === 'level') sorted.sort((a, b) => b.lvl - a.lvl);

    const signature = `${this.view.sort}|${this.view.filter}|${query}|${sorted.map((i) => `${i.up.id}${i.visible ? 1 : 0}`).join(',')}`;
    if (signature !== this.orderSignature) {
      this.orderSignature = signature;
      this.list.append(...sorted.filter((i) => i.visible).map((i) => i.row.node));
    }

    // 4) Satır içerikleri
    let anyAffordableMarked = false;
    for (const item of items) {
      const { row, up, lvl } = item;
      row.node.hidden = !item.visible;
      row.node.classList.toggle('best', item === best);
      row.node.classList.toggle('poor', !item.maxed && !item.affordable);
      row.level.textContent = up.maxLevel ? `Sv. ${lvl}/${up.maxLevel}` : `Sv. ${lvl}`;
      row.auto.hidden = !sys.autoEnabled;
      row.auto.checked = item.marked;
      if (item.affordable && item.marked) anyAffordableMarked = true;

      // Kilometre taşı ilerlemesi
      const next = nextMilestone(up, lvl);
      row.mile.hidden = !next || item.maxed;
      if (next) {
        const into = lvl % MILESTONE_EVERY;
        row.mile.firstChild.style.width = `${(into / MILESTONE_EVERY) * 100}%`;
        row.mile.title = `${next}. seviyede etki ×2 (${next - lvl} seviye kaldı)`;
      }

      if (item.maxed) {
        row.effect.textContent = `+${this.formatValue(up.stat, upgradeValue(up, lvl))} (MAKS)`;
        row.btn.textContent = 'MAKS';
        row.btn.disabled = true;
        row.btn.title = 'Bu yükseltme tamamlandı';
        row.eff.hidden = true;
        continue;
      }

      const q = item.m;
      const crossesMilestone = next && lvl + q.count >= next;
      row.effect.innerHTML = `+${this.formatValue(up.stat, upgradeValue(up, lvl))} → <span class="up">+${this.formatValue(up.stat, upgradeValue(up, lvl + q.count))}</span>${crossesMilestone ? ' <span class="up-star">⭐×2</span>' : ''}`;
      row.btn.textContent = `🪙 ${formatNumber(q.cost)}${q.count > 1 ? ` (x${q.count})` : ''}`;
      row.btn.disabled = !item.affordable;
      row.btn.title = 'Shift: x10 · Ctrl: MAKS';

      // Tahmini verim: altın başına stat kazancı (en iyi satır = 100)
      row.eff.hidden = false;
      row.effBar.style.width = `${item.rank ?? 0}%`;
      row.effLabel.textContent = item === best ? '⚡ en iyi' : item.rank > 0 ? `≈%${item.rank}` : '—';
      row.eff.title = `Tahmini verim ${item.rank ?? 0}/100 · stat kazancı ≈%${(q.gain * 100).toFixed(1)} · fiyat 🪙${formatNumber(item.cost)}`;
    }

    this.bestBtn.disabled = !anyAffordableMarked;
    this.bestBtn.title = anyAffordableMarked
      ? 'İşaretli yükseltmelerden altın başına en verimlisini, altın yettiğince alır'
      : 'Alınabilir ve işaretli yükseltme yok';
    this.empty.hidden = items.some((i) => i.visible);
  }
}
