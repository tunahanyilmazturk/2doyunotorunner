import { ICON_RECTS } from './iconRects.js';

// Generated pixel-art atlases. The original sheets remain intact; each new sheet is registered by cell.
const sheets = {
  weapons: { file: 'weapons-v1.png', cols: 5, rows: 7 },
  equipment: { file: 'equipment-v1.png', cols: 9, rows: 7 },
  powers: { file: 'powers-v1.png', cols: 8, rows: 6 },
  interface: { file: 'interface-v1.png', cols: 8, rows: 8 },
  weaponsV2: { file: 'weapons-v2.png', cols: 3, rows: 7 },
  assassinDaggersV2: { file: 'assassin-daggers-v2.png', cols: 3, rows: 3 },
  factionsV2: { file: 'factions-v2.png', cols: 5, rows: 5 },
  collectionV2: { file: 'collection-v2.png', cols: 6, rows: 6 },
};

export const ICONS = {};
function register(sheet, keys) {
  keys.forEach((key, i) => {
    const { cols, rows, file } = sheets[sheet];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const png = sheet === 'weaponsV2' ? [821, 1916] : ['assassinDaggersV2', 'factionsV2', 'collectionV2'].includes(sheet) ? [1254, 1254] : null;
    const rect = sheet === 'assassinDaggersV2'
      ? [col * png[0] / cols, row * png[1] / rows, png[0] / cols, png[1] / rows, ...png]
      : ICON_RECTS[key] ?? (png ? [col * png[0] / cols, row * png[1] / rows, png[0] / cols, png[1] / rows, ...png] : undefined);
    ICONS[key] = { ...sheets[sheet], sheet, file, col, row, rect };
  });
}

const weaponKinds = ['sword', 'axe', 'hammer', 'spear', 'dagger'];
const equipmentSlots = ['helmet', 'armor', 'boots', 'ring', 'amulet', 'cape', 'shield', 'gloves', 'belt'];
register('weapons', Array.from({ length: 7 }, (_, row) => weaponKinds.map((kind) => `item-${kind}-${row}`)).flat());
register('equipment', Array.from({ length: 7 }, (_, row) => equipmentSlots.map((slot) => `item-${slot}-${row}`)).flat());
export const GENERATED_WEAPON_KEYS = Array.from({ length: 7 }, (_, row) => ['bow', 'staff', 'scepter'].map((kind) => `item-${kind}-${row}`)).flat();
register('weaponsV2', GENERATED_WEAPON_KEYS);
export const GENERATED_ASSASSIN_WEAPON_KEYS = Array.from({ length: 7 }, (_, row) => `item-dagger-${row}`);
register('assassinDaggersV2', GENERATED_ASSASSIN_WEAPON_KEYS);
register('powers', [
  'skill-powerStrike', 'skill-frenzy', 'skill-goldRush', 'skill-divineHeal', 'skill-meteor', 'branch-combat', 'branch-survival', 'branch-wealth',
  'branch-gear', 'branch-arcane', 'upgrade-power', 'upgrade-vitality', 'upgrade-defense', 'upgrade-regen', 'upgrade-haste', 'upgrade-precision',
  'upgrade-brutality', 'upgrade-greed', 'upgrade-fortune', 'upgrade-vampirism', 'upgrade-slayer', 'upgrade-evasion', 'tree-c1', 'tree-c2',
  'tree-c3', 'tree-c4', 'tree-c5', 'tree-s1', 'tree-s2', 'tree-s3', 'tree-s4', 'tree-s5',
  'tree-w1', 'tree-w2', 'tree-w3', 'tree-w4', 'tree-w5', 'tree-g1', 'tree-g2', 'tree-g3',
  'tree-g4', 'tree-g5', 'tree-a1', 'tree-a2', 'tree-a3', 'tree-a4', 'tree-a5', 'stat-thorns',
]);
register('interface', [
  'menu-character', 'menu-upgrades', 'menu-skills', 'menu-forge', 'menu-shop', 'menu-achievements', 'menu-prestige', 'settings',
  'gold', 'soul', 'health', 'save', 'lock', 'equip-best', 'stats', 'inventory',
  'achievement-kills', 'achievement-stage', 'achievement-boss', 'achievement-elite', 'achievement-gold', 'achievement-items', 'achievement-legend', 'achievement-enhance',
  'achievement-skills', 'achievement-prestige', 'achievement-mythic', 'achievement-gear', 'achievement-weapons', 'achievement-traits', 'achievement-bestiary', 'achievement-maxHit',
  'achievement-fastBoss', 'achievement-dodge', 'achievement-playtime', 'achievement-tree', 'achievement-upgrades', 'chest-wood', 'chest-iron', 'chest-gold',
  'potion', 'elixir-wrath', 'elixir-ironskin', 'elixir-fortune', 'elixir-luck', 'gift', 'gamepad', 'keyboard',
  'refresh', 'sort', 'auto', 'combat', 'boss', 'info', 'sound', 'warning',
  'export', 'import', 'reset', 'confirm', 'close', 'expand', 'collapse', 'link',
]);

// Yeni sınıflar, yetenekler, setler ve kalıcı koleksiyonlar için özgün çizimler.
export const GENERATED_FACTION_KEYS = [
  'class-warrior', 'class-archer', 'class-mage', 'class-assassin', 'class-healer', 'ability-warCry', 'ability-eagleEye',
  'ability-arcaneBlast', 'ability-shadowStep', 'ability-sanctuary', 'set-crimson', 'set-glacier', 'set-storm', 'set-life',
  'set-oracle', 'set-hunter', 'set-arcane', 'set-shadow', 'set-sanctum', 'rune-ruby', 'rune-emerald',
  'rune-sapphire', 'rune-topaz', 'rune-amethyst', 'rune-onyx',
];
register('factionsV2', GENERATED_FACTION_KEYS);

export const GENERATED_COLLECTION_KEYS = [
  'companion-wolfPup', 'companion-goldBeetle', 'companion-owl', 'companion-fairy', 'companion-golemling', 'companion-sparrow',
  'companion-shadowWolf', 'companion-dragonling', 'egg', 'elixir-swift', 'elixir-precision', 'elixir-vampire',
  'elixir-haven', 'elixir-shade', 'reward-elixir', 'achievement-sets', 'achievement-setTypes', 'achievement-tower',
  'achievement-companions', 'achievement-runes', 'achievement-daily', 'tower-key', 'gem', 'class-seal', 'class-unlock',
  'quest-daily', 'quest-weekly', 'quest-monthly', 'menu-tower', 'menu-classes', 'menu-companions',
  'companion-rarity-0', 'companion-rarity-1', 'companion-rarity-2', 'companion-rarity-3', 'quest-bonus',
];
register('collectionV2', GENERATED_COLLECTION_KEYS);
export const GENERATED_ATLAS_KEYS = [...GENERATED_WEAPON_KEYS, ...GENERATED_ASSASSIN_WEAPON_KEYS, ...GENERATED_FACTION_KEYS, ...GENERATED_COLLECTION_KEYS];

export function itemArtKey(item) {
  const type = item.slot === 'weapon' ? (item.kind || 'sword') : item.slot;
  const level = Number(item.level) || 1;
  const thresholds = [1, 6, 14, 25, 40, 60, 85];
  const row = thresholds.reduce((result, min, i) => level >= min ? i : result, 0);
  return `item-${type}-${row}`;
}

export const iconToken = (key) => `[[icon:${key}]]`;

export function iconHTML(key, label = '') {
  const a = ICONS[key];
  if (!a) throw new Error(`Unknown icon: ${key}`);
  const [left, top, width, height, sheetWidth, sheetHeight] = a.rect;
  const side = Math.max(width, height);
  const x = left * 100 / (sheetWidth - width);
  const y = top * 100 / (sheetHeight - height);
  const url = `/assets/icons/${a.file}`;
  // Keys/labels are project-owned constants, never user input.
  const accessible = label ? `role="img" aria-label="${label.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')}"` : 'aria-hidden="true"';
  return `<span class="pixel-icon" data-icon="${key}" ${accessible}><span class="pixel-icon-art" style="width:${width / side * 90}%;height:${height / side * 90}%;background-image:url('${url}');background-size:${sheetWidth / width * 100}% ${sheetHeight / height * 100}%;background-position:${x}% ${y}%"></span></span>`;
}

export function icon(key, label = '') {
  const template = document.createElement('template');
  template.innerHTML = iconHTML(key, label);
  return template.content.firstElementChild;
}

// Legacy text decorations share the same art, including prices, hints and toasts.
// Specific content (skills, equipment, achievements) uses explicit keys instead.
export const aliases = {
  '🎒': 'inventory', '⬆️': 'menu-upgrades', '✨': 'menu-skills', '🔨': 'menu-forge', '🏪': 'menu-shop', '🏆': 'menu-achievements', '🌳': 'menu-prestige',
  '⚙️': 'settings', '🪙': 'gold', '💰': 'gold', '👻': 'soul', '❤️': 'health', '♥': 'health', '💾': 'save', '🔒': 'lock', '⚡': 'equip-best', '📊': 'stats',
  '🪖': 'item-helmet-1', '📿': 'item-amulet-2', '🧣': 'item-cape-1', '⚔️': 'combat', '🛡️': 'item-shield-1', '🦺': 'item-armor-2', '🧤': 'item-gloves-1', '🪢': 'item-belt-1', '💍': 'item-ring-2', '👢': 'item-boots-1',
  '🗡️': 'item-sword-1', '🪓': 'item-axe-1', '🔱': 'item-spear-1', '🔪': 'item-dagger-1', '🏹': 'item-bow-1', '🪄': 'item-staff-1',
  '💨': 'elixir-swift', '🔍': 'elixir-precision', '🩸': 'elixir-vampire', '🌿': 'elixir-haven', '🌑': 'elixir-shade',
  '💥': 'skill-powerStrike', '🔥': 'skill-frenzy', '☄️': 'skill-meteor', '🧪': 'potion', '👑': 'boss', '💨': 'upgrade-haste', '🎯': 'upgrade-precision', '💚': 'upgrade-regen', '🩸': 'upgrade-vampirism', '🍃': 'upgrade-evasion', '🍀': 'upgrade-fortune', '🌵': 'stat-thorns',
  '📦': 'chest-wood', '🧰': 'chest-iron', '🍷': 'elixir-wrath', '🧉': 'elixir-ironskin', '🍯': 'elixir-fortune', '📜': 'elixir-luck', '🎁': 'gift', '🎮': 'gamepad', '⌨️': 'keyboard',
  '🔄': 'refresh', '↕': 'sort', '🤖': 'auto', '⚠️': 'warning', '⚠': 'warning', '🔗': 'link', '🔮': 'tree-a3', '🌀': 'tree-a1', '📯': 'tree-a4', '⏳': 'tree-c4', '⏱️': 'achievement-fastBoss', '⭐': 'achievement-elite', '🌟': 'achievement-legend', '🔴': 'achievement-mythic', '📖': 'achievement-bestiary', '🗺️': 'achievement-stage', '🏦': 'tree-w3', '🚀': 'tree-w4', '🤝': 'tree-w5', '😡': 'skill-frenzy', '⛰️': 'upgrade-slayer', '⚔': 'combat', '❤': 'health', '💫': 'tree-a1', '★': 'achievement-elite',
  '🦅': 'ability-eagleEye', '🕊️': 'ability-sanctuary', '🎭': 'menu-classes', '🐾': 'menu-companions', '🗼': 'menu-tower', '🔷': 'class-seal', '💎': 'gem', '🎟️': 'tower-key', '🗝️': 'tower-key', '🥚': 'egg', '📅': 'quest-weekly', '🗓️': 'quest-monthly',
  '💠': 'achievement-sets',
};
const escapedAliases = Object.keys(aliases).sort((a, b) => b.length - a.length).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const pattern = new RegExp(`\\[\\[icon:([a-zA-Z0-9-]+)\\]\\]|${escapedAliases.join('|')}`, 'gu');
const ignored = 'script, style, textarea, input, select, option, canvas, .pixel-icon, [data-raw-icon], [contenteditable="true"]';

export function iconRuns(text) {
  pattern.lastIndex = 0;
  const runs = [];
  let last = 0;
  for (const match of String(text).matchAll(pattern)) {
    if (match.index > last) runs.push({ text: text.slice(last, match.index) });
    const key = match[1] || aliases[match[0]];
    runs.push(ICONS[key] ? { key } : { text: match[0] });
    last = match.index + match[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last) });
  return runs;
}

export function decorateIcons(root) {
  if (root.nodeType === Node.TEXT_NODE) {
    replaceText(root);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE || root.matches(ignored) || root.closest(ignored)) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  texts.forEach(replaceText);
}

function replaceText(node) {
  if (!node.parentElement || node.parentElement.closest(ignored)) return;
  pattern.lastIndex = 0;
  if (!pattern.test(node.data)) return;
  pattern.lastIndex = 0;
  const content = document.createDocumentFragment();
  let last = 0;
  for (const match of node.data.matchAll(pattern)) {
    content.append(document.createTextNode(node.data.slice(last, match.index)));
    const key = match[1] || aliases[match[0]];
    content.append(ICONS[key] ? icon(key) : rawToken(match[0]));
    last = match.index + match[0].length;
  }
  content.append(document.createTextNode(node.data.slice(last)));
  node.replaceWith(content);
}

/**
 * Bilinmeyen anahtar/emoji: metni olduğu gibi korur ama `data-raw-icon` ile
 * işaretler. İşaret olmadan bu metin yeniden taranır, her tarama aynı metni
 * yeniden üretir ve MutationObserver sonsuz döngüye girer (sayfa kilitlenir).
 */
function rawToken(text) {
  const span = document.createElement('span');
  span.setAttribute('data-raw-icon', '');
  span.textContent = text;
  return span;
}

export function initIconTheme() {
  decorateIcons(document.body);
  // Watch only nodes the game changes. No polling or rescanning of the whole UI.
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData') decorateIcons(record.target);
      else for (const node of record.addedNodes) decorateIcons(node);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  return observer;
}
