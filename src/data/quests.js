// Günlük görevler ve giriş ödülü serisi.
//
// Görevler her gün (yerel gece yarısı) yenilenir: şablonlardan DAILY_QUEST_COUNT tanesi seçilir.
// event: QuestSystem'in ilerlemeyi saydığı olay anahtarı.
// target(best): en iyi bölgeye göre hedef (ilerledikçe hedef büyür).
// reward(best): ödül (rewards.js biçiminde).

const round5 = (n) => Math.max(5, Math.round(n / 5) * 5);
// Ruh ödülü: görevler oynanarak kazanılır ama bölge ilerlemesinden bağımsız
// birikmesin diye küçük tutulur. Prestij bir koşuda ~best/... yerine bölgeye göre
// artan bir miktar verir; görevler bunun küçük bir parçası olmalı.
const soulsFor = (best, k = 1) => Math.max(3, Math.floor((best / 10) * k));

export const QUEST_TEMPLATES = [
  {
    id: 'kills', event: 'kill', name: 'Canavar Avı',
    desc: (t) => `${t} canavar yen`,
    target: (best) => round5(120 + best * 3),
    reward: (best) => ({ type: 'souls', amount: soulsFor(best) }),
  },
  {
    id: 'elites', event: 'elite', name: 'Elit Avcısı',
    desc: (t) => `${t} elit canavar yen`,
    target: (best) => 5 + Math.floor(best / 10),
    reward: () => ({ type: 'rune', grade: 0, amount: 2 }), // grade 0 → bölgeye göre
  },
  {
    id: 'bosses', event: 'boss', name: 'Boss Avı',
    desc: (t) => `${t} boss yen`,
    target: (best) => 3 + Math.floor(best / 25),
    reward: (best) => ({ type: 'souls', amount: soulsFor(best, 1.5) }),
  },
  {
    id: 'skills', event: 'skill', name: 'Büyü Pratiği',
    desc: (t) => `${t} kez yetenek kullan`,
    target: () => 40,
    reward: () => ({ type: 'elixir', amount: 1 }),
  },
  {
    id: 'loot', event: 'rareLoot', name: 'Hazine Peşinde',
    desc: (t) => `${t} Nadir veya daha iyi eşya bul`,
    target: () => 5,
    reward: () => ({ type: 'chest', id: 'iron', amount: 1 }),
  },
  {
    id: 'runes', event: 'rune', name: 'Taş Toplayıcı',
    desc: (t) => `${t} rün topla`,
    target: () => 4,
    reward: () => ({ type: 'rune', grade: 0, amount: 2 }),
  },
  {
    id: 'enhance', event: 'enhance', name: 'Örs Başında',
    desc: (t) => `${t} kez eşya güçlendir`,
    target: () => 5,
    reward: () => ({ type: 'towerKey', amount: 1 }),
  },
  {
    id: 'tower', event: 'towerFloor', name: 'Kule Tırmanışı',
    desc: (t) => `Kulede ${t} kat geç`,
    target: () => 3,
    reward: () => ({ type: 'egg', amount: 1 }),
  },
  {
    id: 'upgrades', event: 'upgrade', name: 'Yükseltme Ustası',
    desc: (t) => `${t} yükseltme seviyesi al`,
    target: (best) => round5(10 + best / 3),
    reward: (best) => ({ type: 'souls', amount: soulsFor(best, 0.8) }),
  },
  {
    id: 'companions', event: 'companionLevel', name: 'Yoldaş Eğitimi',
    desc: (t) => `Yoldaşını ${t} kez seviye atlat`,
    target: () => 3,
    reward: () => ({ type: 'chest', id: 'wood', amount: 1 }),
  },
  {
    id: 'elixirs', event: 'elixir', name: 'İksir Tadımı',
    desc: (t) => `${t} iksir iç`,
    target: () => 3,
    reward: () => ({ type: 'chest', id: 'wood', amount: 1 }),
  },
  {
    id: 'sockets', event: 'socket', name: 'Yuva Açıcı',
    desc: (t) => `${t} rün yuvası aç`,
    target: () => 1,
    reward: () => ({ type: 'rune', grade: 0, amount: 3 }),
  },
  {
    id: 'alchemy', event: 'combine', name: 'Rün Simyacısı',
    desc: (t) => `${t} kez rün birleştir`,
    target: () => 2,
    reward: () => ({ type: 'towerKey', amount: 1 }),
  },
];

/**
 * Haftalık hedefler: 7 günde bir yenilenir, daha zordur ve daha büyük ödül verir.
 * Günlük görevlerle aynı olay sistemini kullanır.
 */
export const WEEKLY_TEMPLATES = [
  {
    id: 'wkKills', event: 'kill', name: 'Haftalık Avcı',
    desc: (t) => `Bu hafta ${t} canavar yen`,
    target: (best) => round5(1500 + best * 15),
    reward: (best) => ({ type: 'souls', amount: soulsFor(best, 6) }),
  },
  {
    id: 'wkTower', event: 'towerFloor', name: 'Haftalık Tırmanış',
    desc: (t) => `Bu hafta kulede ${t} kat geç`,
    target: () => 15,
    reward: () => ({ type: 'towerKey', amount: 3 }),
  },
  {
    id: 'wkBosses', event: 'boss', name: 'Haftalık Boss Avı',
    desc: (t) => `Bu hafta ${t} boss yen`,
    target: () => 20,
    reward: () => ({ type: 'chest', id: 'iron', amount: 2 }),
  },
  {
    id: 'wkSkills', event: 'skill', name: 'Haftalık Büyücü',
    desc: (t) => `Bu hafta ${t} kez yetenek kullan`,
    target: () => 300,
    reward: () => ({ type: 'chest', id: 'gold', amount: 1 }),
  },
  {
    id: 'wkUpgrades', event: 'upgrade', name: 'Haftalık Gelişim',
    desc: (t) => `Bu hafta ${t} yükseltme seviyesi al`,
    target: (best) => round5(120 + best),
    reward: () => ({ type: 'egg', amount: 1 }),
  },
];

/** Haftalık görev sayısı ve hafta bittiğinde verilen ek ödül */
export const WEEKLY_QUEST_COUNT = 3;
export const WEEKLY_BONUS_REWARDS = [
  { type: 'chest', id: 'gold', amount: 1 },
  { type: 'egg', amount: 2 },
];

/**
 * Aylık hedefler: ayda bir yenilenir, en büyük ödüller. Haftalık ile aynı olay sistemini kullanır.
 */
export const MONTHLY_TEMPLATES = [
  {
    id: 'moKills', event: 'kill', name: 'Aylık Avcı',
    desc: (t) => `Bu ay ${t} canavar yen`,
    target: (best) => round5(8000 + best * 60),
    reward: (best) => ({ type: 'souls', amount: soulsFor(best, 20) }),
  },
  {
    id: 'moTower', event: 'towerFloor', name: 'Aylık Tırmanış',
    desc: (t) => `Bu ay kulede ${t} kat geç`,
    target: () => 60,
    reward: () => ({ type: 'towerKey', amount: 8 }),
  },
  {
    id: 'moBosses', event: 'boss', name: 'Aylık Boss Avı',
    desc: (t) => `Bu ay ${t} boss yen`,
    target: () => 80,
    reward: () => ({ type: 'chest', id: 'gold', amount: 3 }),
  },
  {
    id: 'moUpgrades', event: 'upgrade', name: 'Aylık Gelişim',
    desc: (t) => `Bu ay ${t} yükseltme seviyesi al`,
    target: (best) => round5(600 + best * 2),
    reward: () => ({ type: 'egg', amount: 3 }),
  },
  {
    id: 'moCombine', event: 'combine', name: 'Aylık Simyacı',
    desc: (t) => `Bu ay ${t} kez rün birleştir`,
    target: () => 40,
    reward: () => ({ type: 'rune', grade: 0, amount: 10 }),
  },
];

/** Aylık görev sayısı ve ay bittiğinde verilen ek ödül */
export const MONTHLY_QUEST_COUNT = 3;
export const MONTHLY_BONUS_REWARDS = [
  { type: 'chest', id: 'gold', amount: 2 },
  { type: 'egg', amount: 3 },
  { type: 'towerKey', amount: 3 },
];

export const QUEST_MAP = Object.fromEntries([...QUEST_TEMPLATES, ...WEEKLY_TEMPLATES, ...MONTHLY_TEMPLATES].map((q) => [q.id, q]));

/** Ayı belirler: "YYYY-MM" (yerel takvim). */
export function monthKey(time = Date.now()) {
  return dayKey(time).slice(0, 7);
}
export const DAILY_QUEST_COUNT = 3;

/** Haftayı belirler: 7 günlük dönemler (1970-01-01 referanslı); aynı hafta içinde aynı anahtar. */
export function weekKey(time = Date.now()) {
  return String(Math.floor(daysBetween('1970-01-01', dayKey(time)) / 7));
}

/** Üç görevin de ödülü alınınca verilen ek ödül */
export const ALL_DONE_REWARDS = [
  { type: 'egg', amount: 1 },
  { type: 'towerKey', amount: 1 },
];

/** 7 günlük giriş serisi; 8. gün başa döner. */
export const LOGIN_REWARDS = [
  { type: 'gold', amount: 1 },
  { type: 'rune', grade: 0, amount: 2 },
  { type: 'elixir', amount: 2 },
  { type: 'souls', amount: 0 }, // 0 → en iyi bölgeye göre
  { type: 'rune', grade: 0, amount: 4 },
  { type: 'chest', id: 'gold', amount: 1 },
  { type: 'egg', amount: 1 },
];

/** Yerel takvime göre gün anahtarı: "2026-10-20" */
export function dayKey(time = Date.now()) {
  const d = new Date(time);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** İki gün anahtarı arasında kaç gün var (DST'den etkilenmesin diye öğlene göre) */
export function daysBetween(a, b) {
  const t = (k) => new Date(`${k}T12:00:00`).getTime();
  return Math.round((t(b) - t(a)) / 86400000);
}
