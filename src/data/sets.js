// Eşya setleri: aynı setten 2/4/6 parça kuşanınca kademeli (birikimli) bonus verir.
// Bir set parçası normal bir eşyadır; tek farkı `set` etiketi ve adıdır (bkz. ItemFactory).
//
// Bonuslar bilinçli olarak YALNIZCA yüzde statlarından oluşur: düz statlar eşya
// seviyesiyle üstel büyüdüğü için yüksek bölgelerde değersiz kalırdı.
//
// Her set 6 yuva kapsar; 10 yuva olduğu için oyuncu en fazla bir seti tamamlayıp
// artan yuvalarda ikinci bir seti 2-4 parçaya çıkarabilir. Set bonusları eşyayla
// toplanır, ayrı çarpan değildir.
import { getBaseName } from './items.js';
import { pick } from '../utils/random.js';

export const SETS = [
  {
    id: 'crimson',
    name: 'Kızıl Nişan',
    prefix: 'Kızıl',
    icon: '🔥',
    color: '#e0553f',
    slots: ['weapon', 'helmet', 'armor', 'gloves', 'ring', 'belt'],
    bonuses: [
      { pieces: 2, stats: { atkPct: 6 } },
      { pieces: 4, stats: { atkPct: 8, crit: 5 } },
      { pieces: 6, stats: { atkPct: 10, critDmg: 35, lifesteal: 2 } },
    ],
  },
  {
    id: 'glacier',
    name: 'Buzul Siperi',
    prefix: 'Buzul',
    icon: '🛡️',
    color: '#58b6e0',
    slots: ['shield', 'helmet', 'armor', 'cape', 'belt', 'boots'],
    bonuses: [
      { pieces: 2, stats: { hpPct: 10 } },
      { pieces: 4, stats: { hpPct: 12, thorns: 15, dodge: 5 } },
      { pieces: 6, stats: { hpPct: 15, dodge: 8, thorns: 20 } },
    ],
  },
  {
    id: 'storm',
    name: 'Fırtına Örtüsü',
    prefix: 'Fırtına',
    icon: '💨',
    color: '#5fd0c0',
    slots: ['cape', 'boots', 'ring', 'gloves', 'amulet', 'weapon'],
    bonuses: [
      { pieces: 2, stats: { aspd: 8 } },
      { pieces: 4, stats: { aspd: 8, crit: 5 } },
      { pieces: 6, stats: { aspd: 10, crit: 7, dodge: 4 } },
    ],
  },
  {
    id: 'life',
    name: 'Yaşam Yemini',
    prefix: 'Yaşam',
    icon: '💚',
    color: '#86d96b',
    slots: ['amulet', 'armor', 'helmet', 'shield', 'belt', 'ring'],
    bonuses: [
      { pieces: 2, stats: { lifesteal: 3 } },
      { pieces: 4, stats: { lifesteal: 3, hpPct: 10 } },
      { pieces: 6, stats: { lifesteal: 4, hpPct: 12, dodge: 5 } },
    ],
  },
  {
    id: 'oracle',
    name: 'Kâhin Gözü',
    prefix: 'Kâhin',
    icon: '🍀',
    color: '#e0c04a',
    slots: ['amulet', 'cape', 'ring', 'helmet', 'boots', 'gloves'],
    bonuses: [
      { pieces: 2, stats: { goldPct: 12 } },
      { pieces: 4, stats: { goldPct: 15, luck: 10 } },
      { pieces: 6, stats: { goldPct: 20, luck: 15, dodge: 5 } },
    ],
  },
  // Sınıf temalı setler: karakter sınıflarının silah ve zırh kimliğini tamamlar.
  {
    id: 'hunter',
    name: 'Avcı Yemini',
    prefix: 'Avcı',
    icon: '🏹',
    color: '#7fb069',
    slots: ['weapon', 'cape', 'gloves', 'boots', 'amulet', 'ring'],
    bonuses: [
      { pieces: 2, stats: { aspd: 6 } },
      { pieces: 4, stats: { aspd: 8, crit: 4 } },
      { pieces: 6, stats: { aspd: 10, crit: 6, critDmg: 25 } },
    ],
  },
  {
    id: 'arcane',
    name: 'Arkana Cüppesi',
    prefix: 'Arkana',
    icon: '🪄',
    color: '#9b6fd6',
    slots: ['weapon', 'armor', 'helmet', 'amulet', 'ring', 'belt'],
    bonuses: [
      { pieces: 2, stats: { atkPct: 6 } },
      { pieces: 4, stats: { atkPct: 8, goldPct: 8 } },
      { pieces: 6, stats: { atkPct: 12, critDmg: 30, hpPct: 6 } },
    ],
  },
  {
    id: 'shadow',
    name: 'Gölge Mirası',
    prefix: 'Gölge',
    icon: '🗡️',
    color: '#4a4a5e',
    slots: ['weapon', 'gloves', 'boots', 'cape', 'amulet', 'belt'],
    bonuses: [
      { pieces: 2, stats: { crit: 5 } },
      { pieces: 4, stats: { crit: 6, critDmg: 25 } },
      { pieces: 6, stats: { crit: 8, critDmg: 40, dodge: 6 } },
    ],
  },
  {
    id: 'sanctum',
    name: 'Kutsal Mühür',
    prefix: 'Kutsal',
    icon: '✨',
    color: '#f2d27a',
    slots: ['helmet', 'armor', 'shield', 'amulet', 'ring', 'gloves'],
    bonuses: [
      { pieces: 2, stats: { hpPct: 6 } },
      { pieces: 4, stats: { hpPct: 8, lifesteal: 3 } },
      { pieces: 6, stats: { hpPct: 12, lifesteal: 4, dodge: 4 } },
    ],
  },
];

export const SET_MAP = Object.fromEntries(SETS.map((s) => [s.id, s]));

/**
 * Nadirlik kademesine göre set parçası olma şansı.
 * Sıradan/Kaliteli (0-1) hiç set olamaz: set toplamak orta oyunun işi.
 * (Dizinin son elemanından büyük kademelerde (savunma) şans 0'a düşer.)
 */
const SET_CHANCE = [0, 0, 0.05, 0.1, 0.18, 0.28];

/** Verilen yuvaya düşebilecek setler. */
export const setsForSlot = (slot) => SETS.filter((s) => s.slots.includes(slot));

/** Set bu yuvada parça verebilir mi? */
export const isSetForSlot = (setId, slot) => !!SET_MAP[setId]?.slots.includes(slot);

/**
 * Eşyaya rastgele set atar. Şans nadirliğe bağlıdır; uygun set yoksa veya
 * şans tutmazsa `undefined` döner.
 */
export function rollSet(slot, tier) {
  const p = SET_CHANCE[tier] ?? 0;
  if (p <= 0 || Math.random() >= p) return undefined;
  const candidates = setsForSlot(slot);
  return candidates.length ? pick(candidates).id : undefined;
}

/** Set etiketli ad: "Kızıl Çelik Miğfer". Set yoksa taban ad döner. */
export function itemName(slot, level, kind, setId) {
  const base = getBaseName(slot, level, kind);
  const set = setId ? SET_MAP[setId] : null;
  return set ? `${set.prefix} ${base}` : base;
}

/**
 * Kuşanılan set parçalarını sayar.
 * Yuva uymayan veya tanınmayan set etiketleri yok sayılır.
 * @returns {Record<string, number>} setId → parça sayısı
 */
export function countSetPieces(equipment = {}) {
  const counts = {};
  for (const item of Object.values(equipment ?? {})) {
    if (!item || !isSetForSlot(item.set, item.slot)) continue;
    counts[item.set] = (counts[item.set] || 0) + 1;
  }
  return counts;
}

/**
 * Aktif set bonuslarını hesaplar.
 * @returns {{stats: Record<string, number>, sets: Array<{set: object, pieces: number, active: object[]}>}}
 *   stats: tüm aktif bonusların toplamı (eşya statlarına eklenir)
 *   sets:  her set için parça sayısı ve hangi kademelerin açık olduğu (arayüz için)
 */
export function activeSetBonuses(equipment = {}) {
  const stats = {};
  const sets = [];
  for (const [setId, pieces] of Object.entries(countSetPieces(equipment))) {
    const set = SET_MAP[setId];
    const active = set.bonuses.filter((b) => pieces >= b.pieces);
    for (const tier of active) {
      for (const [key, value] of Object.entries(tier.stats)) stats[key] = (stats[key] || 0) + value;
    }
    sets.push({ set, pieces, active });
  }
  // En çok parçası olan set önce gelsin (arayüzde sabit sıra)
  sets.sort((a, b) => b.pieces - a.pieces || a.set.name.localeCompare(b.set.name, 'tr'));
  return { stats, sets };
}
