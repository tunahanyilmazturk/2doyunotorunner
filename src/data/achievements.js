import { formatNumber } from '../utils/format.js';
import { ELITE_TRAITS } from './eliteTraits.js';
import { WEAPON_KINDS } from './items.js';
import { ALL_MONSTER_COUNT } from './monsters.js';
import { countSetPieces } from './sets.js';
import { UPGRADES } from './upgrades.js';

// Başarımlar: ilerleme state'ten okunur, hedefe ulaşınca kalıcı olarak açılır.
// Her açılan başarım Balance.achievementBonus kadar saldırı ve altın bonusu verir.

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

/** Aynı ölçüte bağlı kademeli başarımlar üretir. */
function tiered(id, icon, name, describe, progress, targets) {
  return targets.map((target, i) => ({
    id: `${id}_${i + 1}`,
    group: id,
    icon,
    name: `${name} ${ROMAN[i]}`,
    desc: describe(target),
    target,
    progress,
  }));
}

export const ACHIEVEMENTS = [
  ...tiered('kills', '⚔️', 'Avcı', (t) => `${formatNumber(t)} canavar öldür`, (s) => s.stats.totalKills, [100, 1000, 10000, 100000]),
  ...tiered('stage', '🗺️', 'Kâşif', (t) => `${t}. bölgeye ulaş`, (s) => s.bestStage, [10, 25, 50, 75, 100]),
  ...tiered('boss', '👑', 'Boss Avcısı', (t) => `${t} boss yen`, (s) => s.stats.bossKills, [5, 25, 100]),
  ...tiered('elite', '⭐', 'Elit Avcı', (t) => `${t} elit canavar yen`, (s) => s.stats.elitesKilled, [10, 100, 500]),
  ...tiered('gold', '💰', 'Zengin', (t) => `Toplam ${formatNumber(t)} altın kazan`, (s) => s.stats.totalGold, [1e3, 1e6, 1e9, 1e12]),
  ...tiered('items', '🎒', 'Toplayıcı', (t) => `${t} eşya bul`, (s) => s.stats.itemsFound, [25, 250, 2500]),
  ...tiered('legend', '🌟', 'Efsane Peşinde', (t) => `${t} Efsanevi veya Mitik eşya bul`, (s) => s.stats.legendariesFound, [1, 10, 50]),
  ...tiered('enhance', '🔨', 'Demirci', (t) => `Bir eşyayı +${t} seviyesine güçlendir`, (s) => s.stats.maxEnhance, [3, 7, 12]),
  ...tiered('skills', '✨', 'Büyücü', (t) => `${formatNumber(t)} kez yetenek kullan`, (s) => s.stats.skillsCast, [50, 500, 5000]),
  ...tiered('prestige', '👻', 'Yeniden Doğan', (t) => `${t} kez yeniden doğ`, (s) => s.stats.prestiges, [1, 5, 20]),

  // ---------- Koleksiyon ve ustalık ----------
  ...tiered('mythic', '🔴', 'Mitik Avcısı', (t) => `${t} Mitik eşya bul`, (s) => s.stats.mythicsFound, [1, 5, 25]),
  ...gearTiers(),
  ...tiered('weapons', '🪓', 'Silah Ustası', (t) => `${t} farklı silah türü kuşan`, (s) => s.stats.weaponKinds.length, [3, Object.keys(WEAPON_KINDS).length]),
  ...tiered('traits', '🌀', 'Elit Uzmanı', (t) => `${t} farklı elit özelliğini yen`, (s) => s.stats.traitsKilled.length, [3, ELITE_TRAITS.length]),
  ...tiered('bestiary', '📖', 'Canavar Bilgini', (t) => `${t} farklı canavar türü yen`, (s) => s.stats.monstersKilled.length, [10, 25, ALL_MONSTER_COUNT]),
  ...tiered('maxHit', '💥', 'Tek Vuruş', (t) => `Tek vuruşta ${formatNumber(t)} hasar ver`, (s) => s.stats.maxHit, [1e3, 1e6, 1e9]),
  ...tiered('fastBoss', '⏱️', 'Hızlı Cellat', (t) => `${t} bossu 10 saniyeden kısa sürede yen`, (s) => s.stats.fastBossKills, [1, 10, 50]),
  ...tiered('dodge', '🍃', 'Gölge', (t) => `${formatNumber(t)} saldırıdan kaç`, (s) => s.stats.dodges, [50, 500, 5000]),
  ...tiered('playtime', '⏳', 'Sadık Maceracı', (t) => `${t / 3600} saat oyna`, (s) => s.stats.playTime, [3600, 5 * 3600, 24 * 3600]),
  ...tiered('tree', '🌳', 'Ruh Bahçıvanı', (t) => `Ruh Ağacı'nda ${t} düğüm aç`, (s) => Object.values(s.tree).filter((l) => l > 0).length, [5, 15, 25]),
  ...tiered('tower', '🗼', 'Kule Fatihi', (t) => `Boss Kulesi'nde ${t}. kata ulaş`, (s) => s.tower.best, [5, 15, 30]),
  ...tiered('companions', '🐾', 'Hayvan Dostu', (t) => `${t} farklı yoldaş edin`, (s) => Object.keys(s.companions.owned).length, [2, 4, 6]),
  ...tiered('runes', '◆', 'Rün Ustası', (t) => `${t}. kademe bir rün elde et`, (s) => s.stats.maxRuneGrade, [3, 6, 10]),
  ...tiered('daily', '📜', 'Görev Adamı', (t) => `${t} günlük görev tamamla`, (s) => s.stats.questsDone, [10, 50, 200]),
  ...tiered('upgrades', '⬆️', 'Gelişim', (t) => `Toplam ${t} yükseltme seviyesi al`, (s) => UPGRADES.reduce((n, u) => n + (s.upgrades[u.id] || 0), 0), [50, 250, 1000]),
  ...tiered('sets', '💠', 'Set Kuşanan', (t) => `Aynı setten ${t} parça kuşan`, maxSetPieces, [2, 4, 6]),
  ...tiered('setTypes', '🔷', 'Koleksiyoncu', (t) => `${t} farklı setten en az 2 parça kuşan`, setTypesWorn, [2, 4, 5]),
];

/** En kalabalık tek setin parça sayısı. */
function maxSetPieces(s) {
  return Math.max(0, ...Object.values(countSetPieces(s.equipment)));
}

/** En az 2 parçası kuşanılmış farklı set sayısı. */
function setTypesWorn(s) {
  return Object.values(countSetPieces(s.equipment)).filter((n) => n >= 2).length;
}

/** Tam teçhizat: her kademe tüm yuvaların daha yüksek nadirlikte dolmasını ister. */
function gearTiers() {
  const filled = (minTier) => (s) => Object.values(s.equipment).filter((it) => it && it.tier >= minTier).length;
  const total = (s) => Object.keys(s.equipment).length;
  return [
    [0, 'Tüm ekipman yuvalarını doldur'],
    [2, 'Tüm yuvalarda Nadir veya üstü kuşan'],
    [4, 'Tüm yuvalarda Efsanevi veya üstü kuşan'],
  ].map(([minTier, desc], i) => ({
    id: `gear_${i + 1}`,
    group: 'gear',
    icon: '🛡️',
    name: `Tam Teçhizat ${ROMAN[i]}`,
    desc,
    target: 10,
    progress: (s) => (filled(minTier)(s) / total(s)) * 10,
  }));
}
