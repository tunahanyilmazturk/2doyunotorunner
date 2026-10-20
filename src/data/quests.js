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
];

export const QUEST_MAP = Object.fromEntries(QUEST_TEMPLATES.map((q) => [q.id, q]));
export const DAILY_QUEST_COUNT = 3;

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
