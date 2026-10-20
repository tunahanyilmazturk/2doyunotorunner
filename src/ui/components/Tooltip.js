import { decorateIcons, iconHTML, itemArtKey } from '../icons.js';
import { itemTypeName } from '../../data/items.js';
import { getRarity } from '../../data/rarities.js';
import { SET_MAP, countSetPieces } from '../../data/sets.js';
import { STAT_DEFS, formatStatLine } from '../../data/stats.js';
import { getItemStats, itemDisplayName, itemMaxEnhance, itemSellValue } from '../../systems/ItemFactory.js';
import { formatNumber } from '../../utils/format.js';
import { escapeHtml } from '../../utils/dom.js';

// Fareyi takip eden bilgi kutusu (eşyalar için kuşanılanla karşılaştırmalı).
export class Tooltip {
  constructor() {
    this.el = document.getElementById('tooltip');
  }

  showItem(item, event, { equipped = null, equipment = null, hint = '', priceLabel = null, warning = '' } = {}) {
    const rarity = getRarity(item.tier);
    const stats = getItemStats(item);
    const lines = Object.entries(stats)
      .map(([k, v]) => `<li>${formatStatLine(k, v)}</li>`)
      .join('');

    let compare = '';
    if (equipped && equipped.id !== item.id) {
      const eqStats = getItemStats(equipped);
      const keys = new Set([...Object.keys(stats), ...Object.keys(eqStats)]);
      const diffs = [...keys]
        .map((k) => {
          const d = (stats[k] || 0) - (eqStats[k] || 0);
          if (Math.abs(d) < 0.05) return '';
          const cls = d > 0 ? 'up' : 'down';
          const def = STAT_DEFS[k];
          const val = def.percent || Math.abs(d) < 10 ? Math.abs(d).toFixed(1) : formatNumber(Math.abs(d));
          return `<li class="${cls}">${d > 0 ? '▲' : '▼'} ${val}${def.percent ? '%' : ''} ${def.label}</li>`;
        })
        .join('');
      compare = `<div class="tt-compare"><div class="tt-sub">Kuşanılana göre (${escapeHtml(itemDisplayName(equipped))}):</div><ul>${diffs || '<li>Fark yok</li>'}</ul></div>`;
    }

    // Eşya adı/türü kaçış karakterlerinden geçer: kayıt dosyasından gelen metin
    // innerHTML'e ham girmesin (savunma derinliği; ad zaten doğrulanırken yeniden üretilir).
    this.el.innerHTML = `
      <div class="tt-name" style="color:${rarity.color}">${iconHTML(itemArtKey(item))} ${escapeHtml(itemDisplayName(item))}${item.locked ? ' 🔒' : ''}</div>
      <div class="tt-sub">${escapeHtml(rarity.name)} ${escapeHtml(itemTypeName(item))} · Sv.${item.level} · Güçlendirme ${item.enhance || 0}/${itemMaxEnhance(item)}</div>
      <ul class="tt-stats">${lines}</ul>
      ${this.setBlock(item, equipment)}
      ${compare}
      ${warning ? `<div class="tt-warn">${escapeHtml(warning)}</div>` : ''}
      <div class="tt-footer">
        <span>${priceLabel ?? `Satış: 🪙 ${formatNumber(itemSellValue(item))}`}</span>
        ${hint ? `<span class="tt-hint">${hint}</span>` : ''}
      </div>`;
    this.el.style.setProperty('--rarity', rarity.color);
    decorateIcons(this.el);
    this.el.hidden = false;
    this.move(event);
  }

  /**
   * Set bilgisi: parça sayısı, eşikler ve "kuşanılırsa" durumu.
   * `equipment` verilmezse yalnızca hangi kademelerin açık olduğu gösterilir.
   */
  setBlock(item, equipment) {
    const set = item.set ? SET_MAP[item.set] : null;
    if (!set) return '';
    const total = set.slots.length;
    const now = equipment ? (countSetPieces(equipment)[set.id] || 0) : 0;
    // Eşya zaten kuşanılıyorsa bu yuva hesaba katıldığı için sonuç değişmez.
    const projected = equipment ? (countSetPieces({ ...equipment, [item.slot]: item })[set.id] || 0) : now;
    const gains = projected > now;

    const rows = set.bonuses
      .map((b) => {
        const on = projected >= b.pieces;
        const gained = on && now < b.pieces;
        const stats = Object.entries(b.stats)
          .map(([k, v]) => escapeHtml(formatStatLine(k, v)))
          .join(' · ');
        return `<li class="${on ? 'on' : ''}${gained ? ' gain' : ''}"><b>${b.pieces} parça</b> ${stats}</li>`;
      })
      .join('');
    const label = gains ? `${now} → ${projected}/${total} <span class="tt-gain">kuşanılırsa</span>` : `${now}/${total}`;
    return `<div class="tt-set" style="--set:${set.color}">
      <div class="tt-sub">${set.icon} <b>${escapeHtml(set.name)}</b> ${label}</div>
      <ul>${rows}</ul>
    </div>`;
  }

  showText(html, event) {
    this.el.innerHTML = html;
    this.el.style.setProperty('--rarity', '#556');
    decorateIcons(this.el);
    this.el.hidden = false;
    this.move(event);
  }

  move(event) {
    if (this.el.hidden || !event) return;
    const pad = 14;
    const rect = this.el.getBoundingClientRect();
    let x = event.clientX + pad;
    let y = event.clientY + pad;
    if (x + rect.width > window.innerWidth - 8) x = event.clientX - rect.width - pad;
    if (y + rect.height > window.innerHeight - 8) y = window.innerHeight - rect.height - 8;
    this.el.style.left = `${Math.max(8, x)}px`;
    this.el.style.top = `${Math.max(8, y)}px`;
  }

  hide() {
    this.el.hidden = true;
    this.anchor = null;
  }

  /** Bağlı olduğu eleman DOM'dan kalktıysa (panel yeniden çizildi) gizle. */
  checkAnchor() {
    if (this.anchor && !this.anchor.isConnected) this.hide();
  }
}
