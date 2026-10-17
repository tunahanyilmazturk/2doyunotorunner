import { icon, itemArtKey } from '../icons.js';
import { getRarity } from '../../data/rarities.js';
import { SET_MAP } from '../../data/sets.js';
import { el } from '../../utils/dom.js';

/**
 * Tek bir eşya kutusu. Boşsa yuva simgesini soluk gösterir.
 * Set parçaları üst kenarda renkli bir elmasla işaretlenir.
 * @param {object|null} item
 * @param {{ui:object, onClick?:Function, onContext?:Function, emptyIcon?:string, tooltip?:object, badge?:string, label?:string}} opts
 */
export function createItemSlot(item, opts) {
  const { ui, onClick, onContext, emptyIcon = '', tooltip = {}, badge = null, label = null } = opts;
  const node = el('div', { class: `item-slot${item ? '' : ' empty'}` });

  if (item) {
    const rarity = getRarity(item.tier);
    node.style.setProperty('--rarity', rarity.color);
    node.classList.add(`tier-${item.tier}`);
    node.append(
      el('span', { class: 'slot-icon' }, [icon(itemArtKey(item), item.name)]),
      el('span', { class: 'slot-level', text: item.level })
    );
    if (badge) node.append(el('span', { class: 'slot-badge', text: badge }));
    if (item.enhance) node.append(el('span', { class: 'slot-enhance', text: `+${item.enhance}` }));
    if (item.locked) node.append(el('span', { class: 'slot-lock', text: '🔒' }));

    const set = item.set ? SET_MAP[item.set] : null;
    if (set) {
      node.classList.add('has-set');
      node.style.setProperty('--set', set.color);
    }

    node.addEventListener('mouseenter', (e) => {
      ui.tooltip.anchor = node;
      ui.tooltip.showItem(item, e, typeof tooltip === 'function' ? tooltip() : tooltip);
    });
    node.addEventListener('mousemove', (e) => ui.tooltip.move(e));
    node.addEventListener('mouseleave', () => ui.tooltip.hide());
  } else {
    node.append(el('span', { class: 'slot-icon ghost', text: emptyIcon }));
  }
  if (label) node.append(el('span', { class: 'slot-label', text: label }));

  if (onClick) {
    node.addEventListener('click', (e) => {
      ui.tooltip.hide();
      onClick(e);
    });
  }
  if (onContext) {
    node.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      ui.tooltip.hide();
      onContext(e);
    });
  }
  return node;
}
