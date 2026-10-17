import { Balance } from '../../config/balance.js';
import { PRESTIGE_MIN_STAGE } from '../../config/constants.js';
import { Events } from '../../core/events.js';
import { BRANCHES, TREE_MAP, TREE_NODES, previousInBranch } from '../../data/soulTree.js';
import { el } from '../../utils/dom.js';
import { formatNumber } from '../../utils/format.js';

import { iconToken } from '../icons.js';

// Ruh Ağacı sekmesi: soldan sağa açılan 5 dal + yeniden doğuş + seçili düğüm ayrıntısı.
export class SoulTreePanel {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.nodes = new Map(); // id → { node, el, badge, link }
    this.selected = 'c1';
  }

  mount(root) {
    root.classList.add('tree-layout');
    const tree = el('div', { class: 'tree' });

    for (const branch of BRANCHES) {
      const row = el('div', { class: 'tree-row', style: { '--branch': branch.color } }, [
        el('div', { class: 'tree-branch' }, [el('span', { class: 'tree-branch-icon', text: iconToken(`branch-${branch.id}`) }), el('span', { text: branch.name })]),
      ]);
      const nodes = TREE_NODES.filter((n) => n.branch === branch.id).sort((a, b) => a.tier - b.tier);
      nodes.forEach((n, i) => {
        if (i > 0) {
          const link = el('span', { class: 'tree-link' });
          row.append(link);
          this.linkFor(n, link);
        }
        const badge = el('span', { class: 'tree-level' });
        const node = el('button', { class: 'tree-node', 'aria-label': n.name }, [el('span', { class: 'tree-icon', text: iconToken(`tree-${n.id}`) }), badge]);
        if (n.requires.length) node.append(el('span', { class: 'tree-cross', text: '🔗', title: 'Başka daldan şart var' }));
        node.addEventListener('click', () => this.select(n.id));
        node.addEventListener('dblclick', () => this.buy(n.id));
        node.addEventListener('mouseenter', (e) => this.ui.tooltip.showText(this.tooltipHtml(n), e));
        node.addEventListener('mousemove', (e) => this.ui.tooltip.move(e));
        node.addEventListener('mouseleave', () => this.ui.tooltip.hide());
        this.nodes.set(n.id, { ...(this.nodes.get(n.id) ?? {}), node: n, el: node, badge });
        row.append(node);
      });
      tree.append(row);
    }

    // Sağ kolon: yeniden doğuş + düğüm ayrıntısı
    this.soulsEl = el('div', { class: 'tree-souls' });
    this.soulInfo = el('div', { class: 'muted' });
    this.pendingEl = el('div', { class: 'tree-pending' });
    this.prestigeBtn = el('button', { class: 'btn btn-prestige', text: '✨ Yeniden Doğ', onclick: () => this.confirmPrestige() });
    this.detail = el('div', { class: 'tree-detail' });

    root.append(
      tree,
      el('aside', { class: 'tree-side' }, [
        el('div', { class: 'prestige-box' }, [this.soulsEl, this.soulInfo, this.pendingEl, this.prestigeBtn]),
        this.detail,
      ])
    );

    const refresh = () => this.tick();
    this.game.bus.on(Events.TREE_CHANGED, refresh);
    this.game.bus.on(Events.PRESTIGE, refresh);
    this.tick();
  }

  linkFor(n, link) {
    const entry = this.nodes.get(n.id) ?? {};
    entry.link = link;
    this.nodes.set(n.id, entry);
  }

  select(id) {
    this.selected = id;
    this.tick();
  }

  buy(id) {
    if (this.game.tree.buy(id)) {
      const n = TREE_MAP[id];
      this.ui.toast.show(`${iconToken(`tree-${n.id}`)} ${n.name} → Sv. ${this.game.tree.level(id)}`, 'success', 1600);
    }
  }

  /** Menü rozeti: yeniden doğuş mümkünse "!", değilse alınabilir düğüm sayısı */
  badge() {
    if (this.game.prestige.canPrestige) return '!';
    return TREE_NODES.filter((n) => this.game.tree.canBuy(n)).length;
  }

  tooltipHtml(n) {
    const tree = this.game.tree;
    const { now, next } = tree.describe(n);
    const lvl = tree.level(n.id);
    const missing = tree.missingRequirements(n);
    return `<div class="tt-name">${iconToken(`tree-${n.id}`)} ${n.name}</div>
      <div class="tt-sub">Seviye ${lvl}/${n.maxLevel}</div>
      ${now ? `<div>Şu an: ${now}</div>` : ''}
      ${next ? `<div class="tt-next">Sonraki: ${next}</div>` : '<div>Maksimum seviye</div>'}
      ${missing.length ? `<div class="tt-req">Gerekli: ${missing.map((m) => m.name).join(', ')}</div>` : ''}
      ${next ? `<div class="tt-footer"><span>👻 ${formatNumber(tree.cost(n))} Ruh</span><span class="tt-hint">Çift tık: Al</span></div>` : ''}`;
  }

  tick() {
    const { game } = this;
    const { tree, state, prestige } = game;

    for (const { node: n, el: node, badge, link } of this.nodes.values()) {
      const lvl = tree.level(n.id);
      const available = tree.isAvailable(n);
      node.classList.toggle('locked', !available);
      node.classList.toggle('owned', lvl > 0);
      node.classList.toggle('maxed', tree.isMaxed(n));
      node.classList.toggle('affordable', tree.canBuy(n));
      node.classList.toggle('selected', n.id === this.selected);
      badge.textContent = n.maxLevel > 1 ? `${lvl}/${n.maxLevel}` : lvl ? '✔' : '';
      if (link) {
        const prev = previousInBranch(n);
        link.classList.toggle('on', !!prev && tree.level(prev.id) > 0);
      }
    }

    // Yeniden doğuş kutusu
    this.soulsEl.innerHTML = `👻 <b>${formatNumber(state.souls)}</b> Ruh`;
    this.soulInfo.textContent = `Toplam kazanılan ${formatNumber(state.soulsEarned)} · Ruh gücü +%${formatNumber(state.soulsEarned * Balance.soulPowerBonus * 100)}`;
    const pending = prestige.pendingSouls;
    if (prestige.canPrestige) {
      this.pendingEl.innerHTML = `Şimdi yeniden doğarsan <b>+${formatNumber(pending)} Ruh</b> kazanırsın ve <b>${prestige.startStage}. bölgeden</b> başlarsın.`;
    } else {
      this.pendingEl.innerHTML = `Yeniden doğmak için ${PRESTIGE_MIN_STAGE}. bölgeye ulaş (bu turda en yüksek: <b>${state.runMaxStage}</b>).`;
    }
    this.prestigeBtn.disabled = !prestige.canPrestige;

    this.renderDetail();
  }

  renderDetail() {
    const tree = this.game.tree;
    const n = TREE_MAP[this.selected];
    const branch = BRANCHES.find((b) => b.id === n.branch);
    const lvl = tree.level(n.id);
    const { now, next } = tree.describe(n);
    const missing = tree.missingRequirements(n);
    const reqs = [previousInBranch(n), ...n.requires.map((id) => TREE_MAP[id])].filter(Boolean);

    const btn = el('button', { class: 'btn btn-buy btn-block', onclick: () => this.buy(n.id) });
    if (tree.isMaxed(n)) {
      btn.textContent = 'Maksimum seviye';
      btn.disabled = true;
    } else {
      btn.textContent = `${lvl ? 'Yükselt' : 'Aç'} · 👻 ${formatNumber(tree.cost(n))}`;
      btn.disabled = !tree.canBuy(n);
    }

    this.detail.replaceChildren(
      el('div', { class: 'tree-detail-head', style: { '--branch': branch.color } }, [
        el('span', { class: 'tree-detail-icon', text: iconToken(`tree-${n.id}`) }),
        el('div', {}, [el('b', { text: n.name }), el('div', { class: 'muted', text: `${branch.name} · Seviye ${lvl}/${n.maxLevel}` })]),
      ]),
      el('div', { class: 'tree-effect' }, [
        now ? el('div', { text: `Şu an: ${now}` }) : null,
        next ? el('div', { class: 'tree-next', text: `${lvl ? 'Sonraki' : 'Açınca'}: ${next}` }) : null,
      ]),
      reqs.length
        ? el(
            'div',
            { class: 'tree-reqs' },
            reqs.map((r) => el('span', { class: missing.includes(r) ? 'req no' : 'req ok', text: `${missing.includes(r) ? '✗' : '✓'} ${r.name}` }))
          )
        : document.createDocumentFragment(),
      btn
    );
  }

  async confirmPrestige() {
    const p = this.game.prestige;
    const keep = this.game.tree.perk('goldKeep');
    const ok = await this.ui.modal.confirm(
      'Yeniden doğ?',
      `Altın${keep ? ` (%${keep} korunur)` : ''}, altın yükseltmeleri ve bölge sıfırlanacak.
       <b>+${formatNumber(p.pendingSouls)} Ruh</b> kazanacak ve <b>${p.startStage}. bölgeden</b> başlayacaksın.
       Envanter, ekipman, yetenekler ve Ruh Ağacı korunur.`,
      'Yeniden Doğ'
    );
    if (ok) p.prestige();
  }
}
