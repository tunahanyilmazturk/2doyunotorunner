// Altınla alınan kalıcı (yeniden doğuşa kadar) yükseltmeler.
// value(level): o seviyede toplam verdiği stat miktarı (kilometre taşı hariç).
// milestone: true → her MILESTONE_EVERY seviyede etkisi ikiye katlanır (bkz. upgradeValue).
export const UPGRADES = [
  {
    id: 'power', name: 'Güç', icon: '🗡️', stat: 'atk',
    desc: 'Temel saldırı gücü',
    baseCost: 10, costGrowth: 1.15,
    value: (l) => 2 * l * Math.pow(1.065, l), milestone: true,
  },
  {
    id: 'vitality', name: 'Dayanıklılık', icon: '❤️', stat: 'hp',
    desc: 'Maksimum can',
    baseCost: 12, costGrowth: 1.15,
    value: (l) => 15 * l * Math.pow(1.065, l), milestone: true,
  },
  {
    id: 'defense', name: 'Savunma', icon: '🛡️', stat: 'armor',
    desc: 'Alınan hasarı azaltır',
    baseCost: 25, costGrowth: 1.16,
    value: (l) => 2 * l * Math.pow(1.065, l), milestone: true,
  },
  {
    id: 'regen', name: 'Yenilenme', icon: '💚', stat: 'regen',
    desc: 'Saniyede can yenileme',
    baseCost: 30, costGrowth: 1.16,
    value: (l) => 0.5 * l * Math.pow(1.065, l), milestone: true,
  },
  {
    id: 'haste', name: 'Çeviklik', icon: '💨', stat: 'aspd',
    desc: 'Saldırı hızı %',
    baseCost: 50, costGrowth: 1.25, maxLevel: 50,
    value: (l) => l * 4,
  },
  {
    id: 'precision', name: 'Keskin Göz', icon: '🎯', stat: 'crit',
    desc: 'Kritik vuruş şansı %',
    baseCost: 75, costGrowth: 1.28, maxLevel: 40,
    value: (l) => l * 1,
  },
  {
    id: 'brutality', name: 'Vahşet', icon: '💥', stat: 'critDmg',
    desc: 'Kritik hasar çarpanı %',
    baseCost: 100, costGrowth: 1.22,
    value: (l) => l * 10, milestone: true,
  },
  {
    id: 'greed', name: 'Açgözlülük', icon: '💰', stat: 'goldPct',
    desc: 'Kazanılan altın %',
    baseCost: 60, costGrowth: 1.2,
    value: (l) => l * 10,
  },
  {
    id: 'fortune', name: 'Talih', icon: '🍀', stat: 'luck',
    desc: 'Eşya düşme şansı ve nadirlik %',
    baseCost: 150, costGrowth: 1.3, maxLevel: 40,
    value: (l) => l * 5,
  },
  {
    id: 'vampirism', name: 'Vampirizm', icon: '🩸', stat: 'lifesteal',
    desc: 'Verilen hasarın bir kısmı can olarak döner %',
    baseCost: 500, costGrowth: 1.35, maxLevel: 20,
    value: (l) => l * 0.5,
  },
  {
    id: 'slayer', name: 'Dev Avcısı', icon: '👑', stat: 'bossDmg',
    desc: 'Bosslara ek hasar %',
    baseCost: 400, costGrowth: 1.22, maxLevel: 60,
    value: (l) => l * 5,
  },
  {
    id: 'evasion', name: 'Gölge Adım', icon: '🍃', stat: 'dodge',
    desc: 'Saldırılardan kaçınma şansı %',
    baseCost: 300, costGrowth: 1.3, maxLevel: 40,
    value: (l) => l * 0.5,
  },
];

export const MILESTONE_EVERY = 25;

/** Kilometre taşları dahil toplam etki: her 25 seviyede ×2 */
export const upgradeValue = (up, level) =>
  up.value(level) * (up.milestone ? Math.pow(2, Math.floor(level / MILESTONE_EVERY)) : 1);

/** Bir sonraki kilometre taşı seviyesi (yoksa null) */
export const nextMilestone = (up, level) => (up.milestone ? (Math.floor(level / MILESTONE_EVERY) + 1) * MILESTONE_EVERY : null);

export const UPGRADE_MAP = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

export const upgradeCost = (up, level) => Math.floor(up.baseCost * Math.pow(up.costGrowth, level));
