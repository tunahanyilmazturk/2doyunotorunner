import { INVENTORY_SIZE, SAVE_VERSION, START_POTIONS } from '../config/constants.js';
import { SLOT_ORDER } from '../data/items.js';
import { emptyRuneBag } from '../data/runes.js';
import { SKILLS } from '../data/skills.js';
import { TOWER_DAILY_ATTEMPTS } from '../data/tower.js';
import { DEFAULT_CLASS } from '../data/classes.js';
import { UPGRADES } from '../data/upgrades.js';

// Kaydedilen her şey bu düz (JSON'a çevrilebilir) nesnede yaşar.
// Çalışma anı nesneleri (oyuncu canı, canavarlar, partiküller) burada tutulmaz.
//
// Okuma/doğrulama ve sürüm geçişleri `core/saveIntegrity.js` içindedir;
// burası yalnızca "olması gereken şekli" tanımlar.
//
// KOŞU ALANLARI: `gold`dan `shop`a kadar olanlar tek bir yeniden doğuş koşusuna
// aittir ve Yeniden Doğuş'ta sıfırlanır (bkz. `PrestigeSystem.resetRun`).
// Alttakiler (Ruhlar, en iyi bölge, Ruh Ağacı, başarımlar, istatistikler, ayarlar)
// kalıcıdır ve yeniden doğuştan etkilenmez.
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
    bagExpansions: 0, // satın alınan çanta genişletmeleri (kalıcı)
    equipment: Object.fromEntries(SLOT_ORDER.map((s) => [s, null])),
    potions: START_POTIONS,
    elixirs: {}, // süreli iksirler: id → kalan saniye

    skills: Object.fromEntries(SKILLS.map((s) => [s.id, 0])),
    skillAuto: Object.fromEntries(SKILLS.map((s) => [s.id, true])),
    achievements: {}, // id → açılma zamanı
    tree: {}, // Ruh Ağacı düğüm seviyeleri (yeniden doğuşta korunur)
    runes: emptyRuneBag(), // rün çantası: tür → kademe başına adet (kalıcı)
    companions: { owned: {}, active: null, eggs: 1, incubating: null }, // yoldaşlar (kalıcı); ilk yumurta hediye
    daily: { day: '', quests: [], bonusClaimed: false, streak: 0, lastLoginDay: '', loginClaimed: false },
    tower: { best: 0, attempts: TOWER_DAILY_ATTEMPTS, keys: 0 }, // Boss Kulesi (kalıcı)
    seals: 0, // Kule mührü: sınıf açma para birimi (kalıcı)
    classes: { active: DEFAULT_CLASS, unlocked: { [DEFAULT_CLASS]: true }, sets: {} }, // sınıflar; sets = aktif olmayanların ekipmanı

    shop: { items: [], refreshAt: 0 },

    settings: {
      speed: 1,
      autoPotion: true,
      pixelArt: true, // dünya düşük çözünürlükte çizilip keskin büyütülür
      autoBuy: false, // yükseltmeleri otomatik al (ilk yeniden doğuştan sonra açılır)
      autoBuyProfile: 'cheapest', // oto-alım önceliği (bkz. UpgradeAdvisor.PROFILES)
      dockCollapsed: false, // alt menü gizli mi
      autoSellTier: -1, // -1: kapalı, 0: Sıradan, 1: ≤ Kaliteli ...
      audio: true, // ses efektleri
      volume: 0.7, // 0..1
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
      questsDone: 0,
      maxRuneGrade: 0,
      goldPerSec: 0,
    },

    nextItemId: 1,
    lastSave: Date.now(),
  };
}
