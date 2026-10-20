import { GENERATED_ATLAS_KEYS, ICONS, icon } from '../../src/ui/icons.js';
import { ABILITY_MAP, CLASS_MAP } from '../../src/data/classes.js';
import { COMPANION_MAP } from '../../src/data/companions.js';
import { RUNE_MAP } from '../../src/data/runes.js';
import { SET_MAP } from '../../src/data/sets.js';
import { WEAPON_KINDS } from '../../src/data/items.js';

const manifest = await fetch('./manifest.json').then((res) => res.json());
const labels = {
  egg: 'Yoldaş yumurtası', 'elixir-swift': 'Çeviklik iksiri', 'elixir-precision': 'Keskin göz özü', 'elixir-vampire': 'Kan damlası',
  'elixir-haven': 'Diriliş özü', 'elixir-shade': 'Gölge tozu', 'reward-elixir': 'Rastgele iksir ödülü', 'tower-key': 'Boss Kulesi anahtarı', gem: 'Zümrüt elmas',
  'class-seal': 'Kule mührü', 'class-unlock': 'Sınıf açma nişanı', 'quest-daily': 'Günlük görev mührü',
  'quest-weekly': 'Haftalık görev mührü', 'quest-monthly': 'Aylık takvim mührü', 'achievement-weapons': 'Silah ustası başarımı',
  'achievement-sets': 'Set koleksiyoncusu başarımı', 'achievement-setTypes': 'Farklı setler başarımı',
  'achievement-tower': 'Kule fatihi başarımı', 'achievement-companions': 'Yoldaş koleksiyoncusu başarımı',
  'achievement-runes': 'Rün ustası başarımı', 'achievement-daily': 'Görev tamamlayıcısı başarımı',
  'menu-tower': 'Boss Kulesi menüsü', 'menu-classes': 'Sınıflar menüsü', 'menu-companions': 'Yoldaşlar menüsü',
  'quest-bonus': 'Görev bonusu mührü', 'companion-rarity-0': 'Yaygın yoldaş nişanı', 'companion-rarity-1': 'Nadir yoldaş nişanı',
  'companion-rarity-2': 'Destansı yoldaş nişanı', 'companion-rarity-3': 'Efsanevi yoldaş nişanı',
};
for (const id of GENERATED_ATLAS_KEYS) {
  const art = ICONS[id];
  let label = labels[id];
  if (!label && id.startsWith('item-')) {
    const [, kind, row] = id.split('-');
    if (kind === 'dagger') label = WEAPON_KINDS.dagger.tiers[Number(row)].name;
    const kindName = { bow: 'Yay', staff: 'Büyücü asası', scepter: 'Kutsal asa' }[kind];
    const levelName = ['Ahşap', 'Demir', 'Çelik', 'Rünlü', 'Mitril', 'Ejderha', 'Yıldız'][Number(row)];
    if (!label) label = `${levelName} ${kindName}`;
  }
  if (!label && id.startsWith('class-')) label = `${CLASS_MAP[id.slice(6)]?.name} sınıf nişanı`;
  if (!label && id.startsWith('ability-')) label = `${ABILITY_MAP[id.slice(8)]?.name} simgesi`;
  if (!label && id.startsWith('set-')) label = `${SET_MAP[id.slice(4)]?.name} set arması`;
  if (!label && id.startsWith('rune-')) label = `${RUNE_MAP[id.slice(5)]?.name} rünü`;
  if (!label && id.startsWith('companion-')) label = COMPANION_MAP[id.slice(10)]?.name;
  if (!label) label = id;
  const generated = {
    id, label, file: art.file, cols: art.cols, rows: art.rows, sheet: art.sheet,
    col: art.col, row: art.row, rect: art.rect,
  };
  const existingIndex = manifest.findIndex((entry) => entry.id === id);
  if (existingIndex >= 0) manifest[existingIndex] = { ...manifest[existingIndex], ...generated };
  else manifest.push(generated);
}
const gallery = document.getElementById('gallery');
const search = document.getElementById('search');
const category = document.getElementById('category');
function render() {
  const query = search.value.toLocaleLowerCase('tr');
  const visible = manifest.filter((a) => (category.value === 'all' || a.sheet === category.value) && `${a.label} ${a.id}`.toLocaleLowerCase('tr').includes(query));
  gallery.replaceChildren(...visible.map((a) => {
    const figure = document.createElement('figure');
    const caption = document.createElement('figcaption');
    caption.textContent = a.label;
    const id = document.createElement('small');
    id.textContent = a.id;
    caption.append(id);
    figure.append(icon(a.id), caption);
    return figure;
  }));
  document.getElementById('count').textContent = `${visible.length} / ${manifest.length} ikon`;
}
search.addEventListener('input', render);
category.addEventListener('change', render);
render();
