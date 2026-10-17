import { STAGES_PER_BIOME } from '../config/constants.js';

// Her biyom 10 bölge sürer; sonra sıradakine geçilir (döngüsel).
// bosses: [bölge 5'teki boss, bölge 10'daki boss]
export const BIOMES = [
  {
    id: 'forest', name: 'Yeşil Orman',
    sky: ['#72b9c4', '#d8e6bd'], far: '#7d9f8c', mid: '#527f65', near: '#2f6749',
    ground: '#67513a', groundTop: '#8caa59', groundLine: '#473b2a', path: '#91856a', fore: '#203d32',
    decor: 'tree', particle: 'leaf', rays: true,
    monsters: ['slime', 'mushroom', 'goblin', 'wolf', 'boar', 'hornet', 'treant'], bosses: ['kingSlime', 'ancientTreant'],
  },
  {
    id: 'desert', name: 'Kavurucu Çöl',
    sky: ['#c38169', '#f4d5a0'], far: '#c89872', mid: '#d1a56f', near: '#a47d49',
    ground: '#b88b57', groundTop: '#e7c68b', groundLine: '#92673f', path: '#c8a16d', fore: '#75583c',
    decor: 'cactus', particle: 'sand', rays: true,
    monsters: ['scorpion', 'mummy', 'sandSlime', 'sandworm', 'vulture'], bosses: ['pharaoh', 'sandWyrm'],
  },
  {
    id: 'cave', name: 'Karanlık Mağara',
    sky: ['#101726', '#284354'], far: '#27394d', mid: '#35465b', near: '#202d41',
    ground: '#333447', groundTop: '#607c80', groundLine: '#202634', path: '#4f596b', fore: '#111c2b', stars: true,
    decor: 'crystal', particle: 'dust',
    monsters: ['bat', 'skeleton', 'spider', 'ghost', 'troll'], bosses: ['lich', 'boneDragon'],
  },
  {
    id: 'tundra', name: 'Buzul Diyarı',
    sky: ['#425f82', '#becfd5'], far: '#819db3', mid: '#8caebc', near: '#496f86',
    ground: '#829faf', groundTop: '#edf4e5', groundLine: '#566f83', path: '#b4cbd0', fore: '#334f68', stars: true,
    decor: 'pine', particle: 'snow',
    monsters: ['iceSlime', 'snowWolf', 'yeti', 'iceGolem', 'frostWisp'], bosses: ['frostGiant', 'iceQueen'],
  },
  {
    id: 'volcano', name: 'Volkan Dağı',
    sky: ['#291c2b', '#b26243'], far: '#683b40', mid: '#4b2e39', near: '#30212e',
    ground: '#372a33', groundTop: '#85624f', groundLine: '#201a25', path: '#5d464b', fore: '#1a1421', stars: true,
    decor: 'rock', particle: 'ember',
    monsters: ['imp', 'fireSlime', 'golem', 'lavaSerpent', 'hellhound'], bosses: ['demonLord', 'magmaWyrm'],
  },
];

export const getBiomeIndex = (stage) => Math.floor((stage - 1) / STAGES_PER_BIOME) % BIOMES.length;
export const getBiome = (stage) => BIOMES[getBiomeIndex(stage)];

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
/** Kabus döngüsü (0 = normal). Her 50 bölgede bir artar. */
export const getCycle = (stage) => Math.floor((stage - 1) / 50);
/** "Yeşil Orman" veya "Yeşil Orman · Kabus II" */
export const getBiomeTitle = (stage) => {
  const c = getCycle(stage);
  const name = getBiome(stage).name;
  return c ? `${name} · Kabus ${ROMAN[c] ?? c}` : name;
};
