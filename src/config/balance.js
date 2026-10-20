// Tüm denge (balance) formülleri tek yerde — oyunu ayarlamak için burayı düzenle.
import { BOSS_EVERY, BOSS_TIME_LIMIT } from './constants.js';

export const PLAYER_BASE = {
  atk: 10,
  hp: 100,
  armor: 0,
  regen: 1,
  attackSpeed: 1.2, // saniyedeki saldırı
  aspd: 0, // % saldırı hızı bonusu
  crit: 5, // %
  critDmg: 150, // %
  atkPct: 0,
  hpPct: 0,
  goldPct: 0,
  luck: 0,
  lifesteal: 0,
  dodge: 0, // % saldırıdan tamamen kaçınma
  thorns: 0, // vurulunca saldırı gücünün %'si kadar geri hasar
  bossDmg: 0, // bosslara ek hasar %
};

// ---------- Kabus döngüleri ----------
// Her CYCLE_LENGTH bölgede biyomlar baştan döner ama canavarlar katlanarak güçlenir.
const CYCLE_LENGTH = 50;

export const Balance = {
  monsterHp: (base, stage) => base * Math.pow(1.29, stage - 1),
  // Canavar saldırısı, oyuncunun can artışından (~%13,6/bölge) hızlı büyür; bu
  // yüzden er ya da geç ölürsün ve yeniden doğuş gerekir. Üs 1.215 iken ilk
  // yeniden doğuş (20. bölge) neredeyse imkânsızdı; 1.20 duvarı 29-31'e taşır.
  monsterAtk: (base, stage) => base * Math.pow(1.2, stage - 1),
  monsterGold: (base, stage) => base * Math.pow(1.155, stage - 1),

  bossHpMult: 5,
  bossAtkMult: 2.5,
  bossGoldMult: 12,
  /**
   * Boss süresi bölgeyle birlikte uzar ve bossun sağlığı da (bossHpMult) sabit
   * kaldığı için sıralama doğru kalır: önce can dayanmaz, sonra boss yetişmez.
   * Sabit 30 sn + ×9 can, oyuncuyu 15. bölgede görünmez bir sayaçla kesiyordu.
   */
  bossTimeLimit: (stage) => BOSS_TIME_LIMIT + Math.floor(stage / BOSS_EVERY) * 2,

  // Elit canavarlar: nadir, parlayan, daha güçlü ve daha ödüllü
  eliteChance: (stage) => Math.min(0.2, 0.06 + stage * 0.002), // bölgeyle artar
  eliteMinStage: 3,
  eliteHpMult: 3,
  eliteAtkMult: 1.7,
  eliteGoldMult: 4,
  eliteDropMult: 5,
  eliteMinRarityTier: 1,

  // Kabus döngüleri: bu duvarlar Ruh Ağacı ile güçlenip yeniden doğmayı teşvik eder;
  // içerik hiç bitmez.
  cycleLength: CYCLE_LENGTH,
  cycleOf: (stage) => Math.floor((stage - 1) / CYCLE_LENGTH),
  cycleHpMult: 6,
  cycleAtkMult: 3.5,
  cycleGoldMult: 3,

  // Ağır vuruş: bosslar ve elitler belirli aralıklarla (önceden uyararak) sert vurur.
  // Zırhın sadece bir kısmı bu vuruşa karşı işe yarar.
  heavyEvery: { boss: 4, elite: 5 },
  heavyMult: { boss: 3, elite: 2 },
  heavyArmorFactor: 0.5,

  /** Zırhın hasar azaltma oranı (0..0.6) */
  armorReduction: (armor, stage) => Math.min(0.6, armor / (armor + 40 * Math.pow(1.12, stage - 1))),

  maxAttackSpeed: 5,
  maxLifesteal: 30,
  maxDodge: 50,

  dropChance: 0.09,
  bossMinRarityTier: 2,

  itemFlatScale: (level) => Math.pow(1.12, level - 1),
  itemValue: (level, valueMult) => Math.round(5 * Math.pow(1.15, level - 1) * valueMult),
  shopPriceMult: 5,
  shopLuckBonus: 60,
  shopRefreshCost: (stage) => Math.floor(50 * Math.pow(1.15, stage - 1)),

  potionHealPct: 0.4,
  potionCost: (stage) => Math.floor(25 * Math.pow(1.14, stage - 1)),

  // Demirci: her güçlendirme seviyesi eşyanın tüm statlarını artırır
  enhanceStatPerLevel: 0.12,
  maxEnhance: (tier) => 5 + tier * 2,
  enhanceCost: (item) => Math.ceil(item.value * 3 * Math.pow(1.45, item.enhance || 0)),
  enhanceSellBonus: 0.5,

  achievementBonus: 0.02, // açılan başarım başına +%2 saldırı ve altın

  // Erken yeniden doğuş da ödüllendirilir: 20 → 16, 25 → 40, 30 → 67, 40 → 131, 50 → 203 Ruh
  prestigeSouls: (maxStage) => (maxStage < 20 ? 0 : Math.floor(2 * Math.pow(maxStage - 15, 1.3))),
  // Danışman: ilerleme durunca yeniden doğuşu önerir
  prestigeStallSeconds: 90,
  prestigeStallFails: 2,
  soulPowerBonus: 0.005, // tüm zamanlarda kazanılan Ruh başına +%0.5 saldırı, can ve altın
};
