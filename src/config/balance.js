// Tüm denge (balance) formülleri tek yerde — oyunu ayarlamak için burayı düzenle.

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

export const Balance = {
  monsterHp: (base, stage) => base * Math.pow(1.29, stage - 1),
  monsterAtk: (base, stage) => base * Math.pow(1.215, stage - 1),
  monsterGold: (base, stage) => base * Math.pow(1.155, stage - 1),

  bossHpMult: 9,
  bossAtkMult: 2.5,
  bossGoldMult: 12,

  // Elit canavarlar: nadir, parlayan, daha güçlü ve daha ödüllü
  eliteChance: (stage) => Math.min(0.2, 0.06 + stage * 0.002), // bölgeyle artar
  eliteMinStage: 3,
  eliteHpMult: 3,
  eliteAtkMult: 1.7,
  eliteGoldMult: 4,
  eliteDropMult: 5,
  eliteMinRarityTier: 1,

  // Kabus döngüleri: her 50 bölgede biyomlar baştan döner ama canavarlar katlanarak güçlenir.
  // Bu duvarlar Ruh Ağacı ile güçlenip yeniden doğmayı teşvik eder; içerik hiç bitmez.
  cycleLength: 50,
  cycleOf: (stage) => Math.floor((stage - 1) / 50),
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

  achievementBonus: 0.03, // açılan başarım başına +%3 saldırı ve altın

  // Erken yeniden doğuş da ödüllendirilir: 20 → 16, 25 → 40, 30 → 67, 40 → 131, 50 → 203 Ruh
  prestigeSouls: (maxStage) => (maxStage < 20 ? 0 : Math.floor(2 * Math.pow(maxStage - 15, 1.3))),
  // Danışman: ilerleme durunca yeniden doğuşu önerir
  prestigeStallSeconds: 90,
  prestigeStallFails: 2,
  soulPowerBonus: 0.005, // tüm zamanlarda kazanılan Ruh başına +%0.5 saldırı, can ve altın
};
