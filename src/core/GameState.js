import { INVENTORY_SIZE, SAVE_VERSION } from '../config/constants.js';
import { SLOT_ORDER } from '../data/items.js';
import { SKILLS } from '../data/skills.js';
import { UPGRADES } from '../data/upgrades.js';

// Kaydedilen her şey bu düz (JSON'a çevrilebilir) nesnede yaşar.
// Çalışma anı nesneleri (oyuncu canı, canavarlar, partiküller) burada tutulmaz.
export function createDefaultState() {
  return {
    version: SAVE_VERSION,
    gold: 0,
    souls: 0, // harcanabilir Ruh (Ruh Ağacı para birimi)
    soulsEarned: 0, // tüm zamanlarda kazanılan Ruh

    stage: 1,
    kills: 0,
    runMaxStage: 1,
    bestStage: 1,
    autoAdvance: true,

    upgrades: Object.fromEntries(UPGRADES.map((u) => [u.id, 0])),
    upgradeAuto: Object.fromEntries(UPGRADES.map((u) => [u.id, true])), // otomatik alıma dahil mi
    inventory: new Array(INVENTORY_SIZE).fill(null),
    equipment: Object.fromEntries(SLOT_ORDER.map((s) => [s, null])),
    potions: 3,
    elixirs: {}, // süreli iksirler: id → kalan saniye

    skills: Object.fromEntries(SKILLS.map((s) => [s.id, 0])),
    skillAuto: Object.fromEntries(SKILLS.map((s) => [s.id, true])),
    achievements: {}, // id → açılma zamanı
    tree: {}, // Ruh Ağacı düğüm seviyeleri (yeniden doğuşta korunur)

    shop: { items: [], refreshAt: 0 },

    settings: {
      speed: 1,
      autoPotion: true,
      pixelArt: true, // dünya düşük çözünürlükte çizilip keskin büyütülür
      autoBuy: false, // yükseltmeleri otomatik al (ilk yeniden doğuştan sonra açılır)
      dockCollapsed: false, // alt menü gizli mi
      autoSellTier: -1, // -1: kapalı, 0: Sıradan, 1: ≤ Kaliteli ...
    },

    stats: {
      playTime: 0,
      totalKills: 0,
      bossKills: 0,
      totalGold: 0,
      itemsFound: 0,
      deaths: 0,
      prestiges: 0,
      elitesKilled: 0,
      legendariesFound: 0,
      skillsCast: 0,
      maxEnhance: 0,
      mythicsFound: 0,
      maxHit: 0,
      fastBossKills: 0,
      dodges: 0,
      weaponKinds: [], // kuşanılmış farklı silah türleri
      traitsKilled: [], // yenilen farklı elit özellikleri
      monstersKilled: [], // yenilen farklı canavar türleri
      goldPerSec: 0,
    },

    nextItemId: 1,
    lastSave: Date.now(),
  };
}

/** Eski kayıtları yeni varsayılanlarla birleştirir (ileri uyumluluk). */
export function mergeWithDefaults(saved) {
  const defaults = createDefaultState();
  const merged = deepMerge(defaults, saved);
  // Envanter en az taban boyutta olmalı; Ruh Ağacı ile büyümüş envanter korunur
  const length = Math.max(INVENTORY_SIZE, saved?.inventory?.length ?? 0);
  merged.inventory = Array.from({ length }, (_, i) => saved?.inventory?.[i] ?? null);
  // Eski kayıtlarda Ruh pasif bonustu; kazanılmış Ruh miktarını kayıp sayma
  if (saved && saved.soulsEarned === undefined) merged.soulsEarned = merged.souls;
  return merged;
}

function deepMerge(base, override) {
  if (override === undefined || override === null) return base;
  if (Array.isArray(base)) return Array.isArray(override) ? override : base;
  if (typeof base !== 'object' || base === null) return typeof override === typeof base ? override : base;
  const out = { ...base };
  for (const key of Object.keys(override)) {
    out[key] = key in base ? deepMerge(base[key], override[key]) : override[key];
  }
  return out;
}
