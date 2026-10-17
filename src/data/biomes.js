import { STAGES_PER_BIOME } from '../config/constants.js';

// Her biyom 10 bölge sürer; sonra sıradakine geçilir (döngüsel).
// bosses: [bölge 5'teki boss, bölge 10'daki boss]
export const BIOMES = [
  {
    id: 'forest', name: 'Yeşil Orman',
    sky: ['#5aa7e0', '#cfeaf5'], far: '#86a9c2', mid: '#4e8a63', near: '#2c5e3a',
    ground: '#5b3b25', groundTop: '#6cc04a', groundLine: '#43291a', path: '#7a5636', fore: '#1e3d26',
    decor: 'tree', particle: 'leaf', rays: true,
    monsters: ['slime', 'mushroom', 'goblin', 'wolf', 'boar', 'hornet', 'treant'], bosses: ['kingSlime', 'ancientTreant'],
  },
  {
    id: 'desert', name: 'Kavurucu Çöl',
    sky: ['#e98b4f', '#ffd9a0'], far: '#d08a5a', mid: '#d9a15c', near: '#b07a3c',
    ground: '#c8924c', groundTop: '#ecc47e', groundLine: '#a3743a', path: '#dcae6a', fore: '#7c5326',
    decor: 'cactus', particle: 'sand', rays: true,
    monsters: ['scorpion', 'mummy', 'sandSlime', 'sandworm', 'vulture'], bosses: ['pharaoh', 'sandWyrm'],
  },
  {
    id: 'cave', name: 'Karanlık Mağara',
    sky: ['#120e1e', '#2c2342'], far: '#231b38', mid: '#2e2446', near: '#1e1730',
    ground: '#332c42', groundTop: '#5a5072', groundLine: '#221c2e', path: '#433a56', fore: '#0e0a16', stars: true,
    decor: 'crystal', particle: 'dust',
    monsters: ['bat', 'skeleton', 'spider', 'ghost', 'troll'], bosses: ['lich', 'boneDragon'],
  },
  {
    id: 'tundra', name: 'Buzul Diyarı',
    sky: ['#8fb8e0', '#eaf4ff'], far: '#c1d6ea', mid: '#8fb1cd', near: '#5f84a3',
    ground: '#d6e3ee', groundTop: '#ffffff', groundLine: '#a6b9cb', path: '#bccbd9', fore: '#4c6d88',
    decor: 'pine', particle: 'snow',
    monsters: ['iceSlime', 'snowWolf', 'yeti', 'iceGolem', 'frostWisp'], bosses: ['frostGiant', 'iceQueen'],
  },
  {
    id: 'volcano', name: 'Volkan Dağı',
    sky: ['#1f0908', '#7a2410'], far: '#3d1510', mid: '#30110d', near: '#220b09',
    ground: '#2b2120', groundTop: '#ff6a1f', groundLine: '#181211', path: '#3a2b29', fore: '#140807', stars: true,
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
