// Canavar tanımları. shape: hangi çizim fonksiyonunun kullanılacağı (render/sprites/monsters/)
// hp / atk / gold: 1. bölgedeki taban değerler (balance.js ile bölgeye göre ölçeklenir)
// atkSpeed: saniyedeki saldırı, speed: oyuncuya yaklaşma hızı (px/sn)
// features: şekle göre görsel ayrıntılar (her şeklin dosyasında listelenmiştir)

export const MONSTERS = {
  // ---------- Orman ----------
  slime: { name: 'Balçık', shape: 'slime', hp: 20, atk: 3, atkSpeed: 0.8, gold: 3, speed: 40, size: 34,
    colors: { body: '#62d66a', dark: '#2f8f3a', eye: '#10240f' } },
  mushroom: { name: 'Mantar Adam', shape: 'mushroom', hp: 26, atk: 3.5, atkSpeed: 0.9, gold: 4, speed: 35, size: 38,
    colors: { body: '#f2e6c9', dark: '#d63c3c', eye: '#2a1a10' } },
  goblin: { name: 'Goblin', shape: 'humanoid', hp: 30, atk: 4.5, atkSpeed: 1.0, gold: 5, speed: 60, size: 40,
    colors: { body: '#7fb446', dark: '#4e7a25', eye: '#ffde3b', cloth: '#7a4a24' }, features: ['ears', 'club'] },
  wolf: { name: 'Kurt', shape: 'beast', hp: 28, atk: 5, atkSpeed: 1.2, gold: 5, speed: 90, size: 42,
    colors: { body: '#8a8f99', dark: '#5b5f68', eye: '#ffd23b' }, features: ['tail'] },
  boar: { name: 'Yaban Domuzu', shape: 'beast', hp: 34, atk: 5, atkSpeed: 1.0, gold: 5, speed: 85, size: 44,
    colors: { body: '#7a5236', dark: '#4f3322', eye: '#2a1508' }, features: ['tusks', 'tail'] },
  hornet: { name: 'Dev Eşek Arısı', shape: 'flyer', hp: 20, atk: 4.5, atkSpeed: 1.6, gold: 5, speed: 110, size: 28,
    colors: { body: '#f2c14e', dark: '#2a2018', eye: '#1a1010' }, features: ['stripes', 'stinger'] },
  treant: { name: 'Ent', shape: 'humanoid', hp: 60, atk: 5, atkSpeed: 0.6, gold: 8, speed: 25, size: 56,
    colors: { body: '#8a6a44', dark: '#4e3822', eye: '#ffe14d', cloth: '#6b4a2c' }, features: ['bark', 'leaves'] },
  thornling: { name: 'Dikenli Filiz', shape: 'flora', hp: 38, atk: 5, atkSpeed: 0.9, gold: 6, speed: 42, size: 42,
    colors: { body: '#78a943', dark: '#355c2e', eye: '#f5d64a' }, features: ['thorns', 'bud'] },

  // ---------- Çöl ----------
  scorpion: { name: 'Akrep', shape: 'beast', hp: 32, atk: 5, atkSpeed: 1.0, gold: 5, speed: 55, size: 40,
    colors: { body: '#c9853b', dark: '#8a5320', eye: '#1b0d05' }, features: ['stinger'] },
  mummy: { name: 'Mumya', shape: 'humanoid', hp: 40, atk: 4, atkSpeed: 0.8, gold: 6, speed: 30, size: 44,
    colors: { body: '#e3d6b0', dark: '#a8986b', eye: '#5eff7a', cloth: '#c9b98d' }, features: ['wraps'] },
  sandSlime: { name: 'Kum Balçığı', shape: 'slime', hp: 30, atk: 4, atkSpeed: 0.9, gold: 5, speed: 45, size: 36,
    colors: { body: '#e8c26a', dark: '#b08a35', eye: '#3a2208' } },
  sandworm: { name: 'Kum Solucanı', shape: 'serpent', hp: 45, atk: 6, atkSpeed: 0.8, gold: 7, speed: 50, size: 46,
    colors: { body: '#d9a15c', dark: '#9c6a32', eye: '#3a1a08' }, features: ['burrow', 'teeth'] },
  vulture: { name: 'Akbaba', shape: 'flyer', hp: 26, atk: 5, atkSpeed: 1.2, gold: 6, speed: 95, size: 34,
    colors: { body: '#6b4a3a', dark: '#3a2a22', eye: '#ffcf4d' }, features: ['beak'] },
  glassScarab: { name: 'Cam Kınkanat', shape: 'beetle', hp: 42, atk: 6, atkSpeed: 0.85, gold: 7, speed: 48, size: 42,
    colors: { body: '#d9a84e', dark: '#70452e', eye: '#ffe58a' }, features: ['horn', 'crystal'] },

  // ---------- Mağara ----------
  bat: { name: 'Yarasa', shape: 'flyer', hp: 22, atk: 4, atkSpeed: 1.4, gold: 5, speed: 100, size: 32,
    colors: { body: '#5a4a6e', dark: '#33284a', eye: '#ff4d4d' } },
  skeleton: { name: 'İskelet', shape: 'humanoid', hp: 34, atk: 5.5, atkSpeed: 1.0, gold: 6, speed: 50, size: 42,
    colors: { body: '#e8e8e0', dark: '#a8a89c', eye: '#58c8ff', cloth: '#3b3b44' }, features: ['bones', 'sword'] },
  spider: { name: 'Mağara Örümceği', shape: 'beast', hp: 30, atk: 6, atkSpeed: 1.1, gold: 6, speed: 70, size: 40,
    colors: { body: '#3d3048', dark: '#221a2a', eye: '#ff3b3b' }, features: ['legs8'] },
  ghost: { name: 'Hortlak', shape: 'ghost', hp: 32, atk: 6, atkSpeed: 1.0, gold: 7, speed: 55, size: 40,
    colors: { body: '#d8e2ff', dark: '#8f9ccf', eye: '#2a1a4a' } },
  troll: { name: 'Mağara Trolü', shape: 'humanoid', hp: 70, atk: 6.5, atkSpeed: 0.6, gold: 9, speed: 25, size: 58,
    colors: { body: '#7f9a7a', dark: '#4f644c', eye: '#ffcc33', cloth: '#5a4632' }, features: ['bulky', 'tusks', 'club'] },
  caveScarab: { name: 'Obsidyen Kınkanat', shape: 'beetle', hp: 48, atk: 7, atkSpeed: 0.8, gold: 8, speed: 44, size: 44,
    colors: { body: '#655c88', dark: '#29263f', eye: '#6ff5e6' }, features: ['horn', 'crystal'] },

  // ---------- Buzul ----------
  iceSlime: { name: 'Buz Balçığı', shape: 'slime', hp: 34, atk: 4.5, atkSpeed: 0.8, gold: 6, speed: 40, size: 38,
    colors: { body: '#9fe4ff', dark: '#4fa6d1', eye: '#0d2c3d' } },
  snowWolf: { name: 'Kar Kurdu', shape: 'beast', hp: 32, atk: 6, atkSpeed: 1.3, gold: 6, speed: 95, size: 44,
    colors: { body: '#eef3f8', dark: '#a9b8c8', eye: '#4fc3ff' }, features: ['tail'] },
  yeti: { name: 'Yeti', shape: 'humanoid', hp: 55, atk: 6, atkSpeed: 0.7, gold: 8, speed: 35, size: 54,
    colors: { body: '#f4f7fb', dark: '#b9c6d6', eye: '#2a6fdb', cloth: '#dfe7f0' }, features: ['fur'] },
  iceGolem: { name: 'Buz Golemi', shape: 'humanoid', hp: 70, atk: 6, atkSpeed: 0.6, gold: 9, speed: 22, size: 56,
    colors: { body: '#a8d8f0', dark: '#5a9ac0', eye: '#e8ffff', cloth: '#7fbfe0' }, features: ['block', 'crystal'] },
  frostWisp: { name: 'Ayaz Ruhu', shape: 'ghost', hp: 30, atk: 6, atkSpeed: 1.2, gold: 7, speed: 60, size: 36,
    colors: { body: '#9fe4ff', dark: '#3a8fc8', eye: '#0d2c3d' }, features: ['wisp'] },
  frostMoth: { name: 'Ayaz Güvesi', shape: 'flyer', hp: 34, atk: 6, atkSpeed: 1.1, gold: 7, speed: 82, size: 38,
    colors: { body: '#d8f4ff', dark: '#669bb8', eye: '#183b64' }, features: ['moth', 'crown'] },

  // ---------- Volkan ----------
  imp: { name: 'İblisçik', shape: 'flyer', hp: 28, atk: 6, atkSpeed: 1.4, gold: 7, speed: 100, size: 32,
    colors: { body: '#e0482f', dark: '#8f1f12', eye: '#ffe14d' }, features: ['horns'] },
  fireSlime: { name: 'Ateş Balçığı', shape: 'slime', hp: 36, atk: 6, atkSpeed: 0.9, gold: 7, speed: 45, size: 38,
    colors: { body: '#ff7a2e', dark: '#c23d0f', eye: '#3b0a00' } },
  golem: { name: 'Lav Golemi', shape: 'humanoid', hp: 65, atk: 7, atkSpeed: 0.6, gold: 9, speed: 25, size: 56,
    colors: { body: '#4a3d3a', dark: '#2b2220', eye: '#ffb02e', cloth: '#ff6a1f' }, features: ['block', 'cracks'] },
  lavaSerpent: { name: 'Lav Yılanı', shape: 'serpent', hp: 55, atk: 7, atkSpeed: 0.8, gold: 9, speed: 45, size: 46,
    colors: { body: '#e0482f', dark: '#7a1a0e', eye: '#ffe14d' }, features: ['spikes', 'teeth'] },
  hellhound: { name: 'Cehennem Tazısı', shape: 'beast', hp: 45, atk: 7.5, atkSpeed: 1.3, gold: 9, speed: 100, size: 46,
    colors: { body: '#3a2220', dark: '#1e1010', eye: '#ff6a1f' }, features: ['flames', 'tail'] },
  ashKnight: { name: 'Kül Muhafızı', shape: 'humanoid', hp: 58, atk: 8, atkSpeed: 0.85, gold: 10, speed: 38, size: 50,
    colors: { body: '#74605b', dark: '#35282b', eye: '#ffb02e', cloth: '#493338' }, features: ['block', 'cracks', 'sword'] },
};

// Bosslar: normal canavar tanımı + scale. Her biyomda iki boss vardır:
// bölge 5, 15, 25 ... → birinci boss; bölge 10, 20, 30 ... → ikinci boss.
export const BOSSES = {
  kingSlime: { name: 'Balçık Kral', shape: 'slime', hp: 20, atk: 3.5, atkSpeed: 0.7, gold: 3, speed: 25, size: 34, scale: 2.0,
    colors: { body: '#3fbf4a', dark: '#1f6e28', eye: '#10240f' }, features: ['crown'] },
  ancientTreant: { name: 'Kadim Ent', shape: 'humanoid', hp: 28, atk: 4, atkSpeed: 0.6, gold: 4, speed: 20, size: 56, scale: 1.6,
    colors: { body: '#6e5236', dark: '#3e2c1a', eye: '#9cff5a', cloth: '#56391f' }, features: ['bark', 'leaves', 'crown'] },

  pharaoh: { name: 'Lanetli Firavun', shape: 'humanoid', hp: 30, atk: 4.5, atkSpeed: 0.8, gold: 5, speed: 25, size: 44, scale: 1.7,
    colors: { body: '#e3d6b0', dark: '#a8986b', eye: '#5eff7a', cloth: '#2e6bd1' }, features: ['wraps', 'crown', 'staff'] },
  sandWyrm: { name: 'Kum Ejderi', shape: 'serpent', hp: 32, atk: 5, atkSpeed: 0.7, gold: 5, speed: 25, size: 46, scale: 1.7,
    colors: { body: '#c98a45', dark: '#7a4f1f', eye: '#ff3b3b' }, features: ['burrow', 'teeth', 'spikes', 'crown'] },

  lich: { name: 'Lich', shape: 'humanoid', hp: 30, atk: 5.5, atkSpeed: 0.9, gold: 5, speed: 25, size: 44, scale: 1.7,
    colors: { body: '#d9d9e8', dark: '#8e8ea8', eye: '#b04dff', cloth: '#3a1f5c' }, features: ['bones', 'crown', 'staff'] },
  boneDragon: { name: 'Kemik Ejder', shape: 'serpent', hp: 34, atk: 6, atkSpeed: 0.8, gold: 6, speed: 25, size: 46, scale: 1.8,
    colors: { body: '#e8e4d8', dark: '#6e6a60', eye: '#58c8ff' }, features: ['bones', 'teeth', 'crown'] },

  frostGiant: { name: 'Buz Devi', shape: 'humanoid', hp: 40, atk: 5.5, atkSpeed: 0.6, gold: 6, speed: 20, size: 54, scale: 1.6,
    colors: { body: '#bfe6ff', dark: '#6aa9d6', eye: '#0f4fb8', cloth: '#e8f6ff' }, features: ['fur', 'crown', 'club'] },
  iceQueen: { name: 'Buz Kraliçesi', shape: 'humanoid', hp: 36, atk: 6.5, atkSpeed: 0.9, gold: 6, speed: 20, size: 46, scale: 1.7,
    colors: { body: '#e8f6ff', dark: '#7fb4d9', eye: '#3ad0ff', cloth: '#4f8fd1' }, features: ['crystal', 'crown', 'staff'] },

  demonLord: { name: 'İblis Lordu', shape: 'flyer', hp: 35, atk: 6.5, atkSpeed: 1.0, gold: 7, speed: 30, size: 34, scale: 2.0,
    colors: { body: '#c22a1f', dark: '#5e0f0a', eye: '#ffe14d' }, features: ['horns', 'crown'] },
  magmaWyrm: { name: 'Magma Ejderi', shape: 'serpent', hp: 40, atk: 7, atkSpeed: 0.8, gold: 8, speed: 25, size: 46, scale: 1.9,
    colors: { body: '#ff5a1f', dark: '#5e1208', eye: '#fff07a' }, features: ['spikes', 'teeth', 'crown'] },
};

// Her tanıma kimliğini yaz (istatistik ve başarımlarda canavar türünü tanımak için)
for (const [id, def] of Object.entries({ ...MONSTERS, ...BOSSES })) def.id = id;

export const ALL_MONSTER_COUNT = Object.keys(MONSTERS).length + Object.keys(BOSSES).length;
