// tier: nadirlik sırası (0 = en düşük). affixes: eşyadaki toplam stat sayısı.
export const RARITIES = [
  { tier: 0, id: 'common', name: 'Sıradan', color: '#b8bcc4', weight: 600, statMult: 1.0, affixes: 1, valueMult: 1 },
  { tier: 1, id: 'uncommon', name: 'Kaliteli', color: '#5fd068', weight: 250, statMult: 1.3, affixes: 2, valueMult: 2 },
  { tier: 2, id: 'rare', name: 'Nadir', color: '#4aa3ff', weight: 100, statMult: 1.7, affixes: 3, valueMult: 4 },
  { tier: 3, id: 'epic', name: 'Destansı', color: '#b866ff', weight: 38, statMult: 2.2, affixes: 3, valueMult: 9 },
  { tier: 4, id: 'legendary', name: 'Efsanevi', color: '#ff9a2e', weight: 10, statMult: 3.0, affixes: 4, valueMult: 20 },
  { tier: 5, id: 'mythic', name: 'Mitik', color: '#ff4060', weight: 2, statMult: 4.0, affixes: 5, valueMult: 50 },
];

export const getRarity = (tier) => RARITIES[Math.max(0, Math.min(RARITIES.length - 1, tier))];
