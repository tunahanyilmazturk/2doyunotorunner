// Eşyalarda ve karakterde bulunabilecek tüm statlar.
// flat statlar eşya seviyesiyle üstel büyür, yüzde statlar doğrusal büyür.
export const STAT_DEFS = {
  atk: { label: 'Saldırı', percent: false, base: 4, scaling: 'flat' },
  hp: { label: 'Can', percent: false, base: 25, scaling: 'flat' },
  armor: { label: 'Zırh', percent: false, base: 3, scaling: 'flat' },
  regen: { label: 'Can Yenileme/sn', percent: false, base: 0.6, scaling: 'flat' },
  atkPct: { label: 'Saldırı', percent: true, base: 4, perLevel: 0.15 },
  hpPct: { label: 'Can', percent: true, base: 4, perLevel: 0.15 },
  aspd: { label: 'Saldırı Hızı', percent: true, base: 3, perLevel: 0.05 },
  crit: { label: 'Kritik Şansı', percent: true, base: 2, perLevel: 0.03 },
  critDmg: { label: 'Kritik Hasarı', percent: true, base: 10, perLevel: 0.4 },
  goldPct: { label: 'Altın Kazancı', percent: true, base: 5, perLevel: 0.25 },
  luck: { label: 'Şans', percent: true, base: 3, perLevel: 0.1 },
  lifesteal: { label: 'Can Çalma', percent: true, base: 0.5, perLevel: 0.01 },
  dodge: { label: 'Kaçınma', percent: true, base: 1.5, perLevel: 0.02 },
  thorns: { label: 'Diken (saldırının %)', percent: true, base: 8, perLevel: 0.3 },
  bossDmg: { label: 'Boss Hasarı', percent: true, base: 5, perLevel: 0.2 },
};

export function formatStatLine(key, value) {
  const def = STAT_DEFS[key];
  if (!def) return `${key}: ${value}`;
  const v = def.percent || value < 10 ? +value.toFixed(1) : Math.round(value);
  return `+${def.percent ? v + '%' : formatCompact(v)} ${def.label}`;
}

function formatCompact(v) {
  if (v < 1000) return String(v);
  if (v < 1e6) return (v / 1e3).toFixed(1) + 'K';
  if (v < 1e9) return (v / 1e6).toFixed(2) + 'M';
  return (v / 1e9).toFixed(2) + 'B';
}
