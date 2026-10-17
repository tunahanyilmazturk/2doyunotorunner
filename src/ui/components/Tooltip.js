import { decorateIcons, iconHTML, itemArtKey } from '../icons.js';
import { itemTypeName } from '../../data/items.js';
import { getRarity } from '../../data/rarities.js';
import { STAT_DEFS, formatStatLine } from '../../data/stats.js';
import { getItemStats, itemDisplayName, itemMaxEnhance, itemSellValue } from '../../systems/ItemFactory.js';
import { formatNumber } from '../../utils/format.js';

// Fareyi takip eden bilgi kutusu (eşyalar için kuşanılanla karşılaştırmalı).
export class Tooltip {
  constructor() {
    this.el = document.getElementById('tooltip');
  }

  showItem(item, event, { equipped = null, hint = '', priceLabel = null } = {}) {
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
      compare = `<div class="tt-compare"><div class="tt-sub">Kuşanılana göre (${itemDisplayName(equipped)}):</div><ul>${diffs || '<li>Fark yok</li>'}</ul></div>`;
    }

    this.el.innerHTML = `
      <div class="tt-name" style="color:${rarity.color}">${iconHTML(itemArtKey(item))} ${itemDisplayName(item)}${item.locked ? ' 🔒' : ''}</div>
      <div class="tt-sub">${rarity.name} ${itemTypeName(item)} · Sv.${item.level} · Güçlendirme ${item.enhance || 0}/${itemMaxEnhance(item)}</div>
      <ul class="tt-stats">${lines}</ul>
      ${compare}
      <div class="tt-footer">
        <span>${priceLabel ?? `Satış: 🪙 ${formatNumber(itemSellValue(item))}`}</span>
        ${hint ? `<span class="tt-hint">${hint}</span>` : ''}
      </div>`;
    this.el.style.setProperty('--rarity', rarity.color);
    decorateIcons(this.el);
    this.el.hidden = false;
    this.move(event);
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
