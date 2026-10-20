// Yoldaşlar: yumurtadan çıkan, yanında koşan ve seviye atlayan küçük dostlar.
//
// - Aynı anda bir yoldaş YANINDA olur: saldırır / iyileştirir ve pasif bonusunu verir.
// - Yoldaşlar ve yumurtalar KALICIDIR (yeniden doğuşta silinmez).
// - Yumurta kuluçkada belirli sayıda canavar öldürünce çatlar.
// - Zaten sahip olunan yoldaş çıkarsa ona deneyim olarak eklenir.
//
// look: çizim için canavar şekli (render/sprites/monsters) + renkler; yoldaşlar sağa bakar.
// attack: { pct: oyuncu saldırısının oranı, interval: saniye } — seviyeyle güçlenir
// heal:   { pct: maks. canın oranı, interval: saniye }
// passive: { stat, base, per } — seviye başına artan stat bonusu

export const COMPANION_RARITIES = [
  { tier: 0, name: 'Yaygın', color: '#b8bcc4', weight: 60 },
  { tier: 1, name: 'Nadir', color: '#4aa3ff', weight: 28 },
  { tier: 2, name: 'Destansı', color: '#b866ff', weight: 10 },
  { tier: 3, name: 'Efsanevi', color: '#ff9a2e', weight: 2 },
];

export const COMPANIONS = [
  {
    id: 'wolfPup', name: 'Kurt Yavrusu', emoji: '🐺', rarity: 0,
    desc: 'Seri ısırıklarla saldırır',
    look: { shape: 'beast', size: 24, colors: { body: '#a3a8b2', dark: '#5b5f68', eye: '#ffd23b' }, features: ['tail'] },
    attack: { pct: 0.25, interval: 1.2 },
    passive: { stat: 'aspd', base: 5, per: 0.5 },
  },
  {
    id: 'goldBeetle', name: 'Altın Böceği', emoji: '🪲', rarity: 0,
    desc: 'Savaşmaz ama altın kokusunu alır',
    look: { shape: 'slime', size: 20, colors: { body: '#f2c14e', dark: '#b8862a', eye: '#2a1a08' } },
    passive: { stat: 'goldPct', base: 15, per: 1.5 },
  },
  {
    id: 'owl', name: 'Bilge Baykuş', emoji: '🦉', rarity: 1,
    desc: 'Pençeleriyle dalar, ganimeti uzaktan görür',
    look: { shape: 'flyer', size: 22, colors: { body: '#8a6a4a', dark: '#5a3f2a', eye: '#ffd23b' }, features: ['beak'] },
    attack: { pct: 0.35, interval: 1.6 },
    passive: { stat: 'luck', base: 8, per: 0.8 },
  },
  {
    id: 'fairy', name: 'Orman Perisi', emoji: '🧚', rarity: 1,
    desc: 'Belirli aralıklarla canını yeniler',
    look: { shape: 'ghost', size: 20, colors: { body: '#c8f7dd', dark: '#59c9a5', eye: '#1a3a2a' }, features: ['wisp'] },
    heal: { pct: 0.05, interval: 3 },
    passive: { stat: 'hpPct', base: 6, per: 0.6 },
  },
  {
    id: 'golemling', name: 'Taş Golemcik', emoji: '🗿', rarity: 2,
    desc: 'Ağır yumruklar atar, dikenli taş deriye sahiptir',
    look: { shape: 'humanoid', size: 26, colors: { body: '#7d7468', dark: '#4a443c', eye: '#7fe3ff', cloth: '#6a6258' }, features: ['block', 'crystal'] },
    attack: { pct: 0.7, interval: 2.2 },
    passive: { stat: 'thorns', base: 10, per: 1 },
  },
  {
    id: 'sparrow', name: 'Serçe', emoji: '🐦', rarity: 0,
    desc: 'Hızlı ve çevik; saldırılardan sıyrılmayı öğretir',
    look: { shape: 'flyer', size: 16, colors: { body: '#c79a6b', dark: '#7a5a3a', eye: '#1a1208' }, features: ['beak'] },
    attack: { pct: 0.18, interval: 0.9 },
    passive: { stat: 'dodge', base: 2, per: 0.2 },
  },
  {
    id: 'shadowWolf', name: 'Gölge Kurdu', emoji: '🐺', rarity: 2,
    desc: 'Gölgeden çıkıp kritik ısırık atar',
    look: { shape: 'beast', size: 28, colors: { body: '#2b2538', dark: '#120e18', eye: '#ff4d6d' }, features: ['tail'] },
    attack: { pct: 0.9, interval: 1.4 },
    passive: { stat: 'crit', base: 3, per: 0.3 },
  },
  {
    id: 'dragonling', name: 'Ejder Yavrusu', emoji: '🐉', rarity: 3,
    desc: 'Ateş püskürür; kritik vuruşları alevlendirir',
    look: { shape: 'flyer', size: 26, colors: { body: '#e0482f', dark: '#8f1f12', eye: '#ffe14d' }, features: ['horns'] },
    attack: { pct: 1.3, interval: 2.5, fire: true },
    passive: { stat: 'critDmg', base: 20, per: 2 },
  },
];

export const COMPANION_MAP = Object.fromEntries(COMPANIONS.map((c) => [c.id, c]));
export const COMPANION_IDS = COMPANIONS.map((c) => c.id);

/** Normal bir bossun yumurta düşürme ihtimali (kule bossları hariç) */
export const BOSS_EGG_CHANCE = 0.4;
export const MAX_COMPANION_LEVEL = 50;
export const EGG_HATCH_KILLS = 120;
export const MAX_EGGS = 99;

/** Bir sonraki seviyeye gereken deneyim */
export const xpToNext = (level) => Math.floor(20 * Math.pow(1.12, level - 1));

/** Seviye arttıkça saldırı/iyileştirme gücü çarpanı */
export const powerMult = (level) => 1 + 0.06 * (level - 1);

export const passiveValue = (c, level) => Math.round((c.passive.base + c.passive.per * (level - 1)) * 10) / 10;

/** Aynı yoldaş tekrar çıkarsa verilen deneyim (nadir olan daha çok) */
export const duplicateXp = (c) => 150 * (c.rarity + 1);
