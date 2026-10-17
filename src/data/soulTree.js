// Ruh Ağacı: yeniden doğuşla kazanılan Ruhlarla alınan kalıcı yükseltmeler.
// Her dal soldan sağa açılır: bir düğümü almak için önceki düğümde en az 1 seviye gerekir.
// Bazı düğümler başka dallardan da şart koşar (requires).
//
// effect türleri:
//   stat   → karaktere stat ekler (seviye başına `per`)
//   perk   → oyun kuralı değiştirir (seviye başına `per`), anahtar listesi aşağıda
//   slot   → ekipman yuvası açar
//   skill  → aktif yetenek açar
//
// Perk anahtarları:
//   inventorySlots  envantere ek yuva        soulGain      yeniden doğuşta % fazla Ruh
//   goldKeep        yeniden doğuşta korunan altın %   startStage  yeniden doğuştan sonra başlangıç bölgesi +
//   discount        yükseltme ve mağaza indirimi %    bossTime    boss süresine ek saniye
//   doubleDrop      çift eşya düşme şansı %           skillCooldown  yetenek bekleme süresi azalması %
//   skillPower      yetenek etkisi %                  autoBoss     kasarken bir bölge sonra bossu kendiliğinden dene

export const BRANCHES = [
  { id: 'combat', name: 'Savaş', icon: '⚔️', color: '#e0625a' },
  { id: 'survival', name: 'Hayatta Kalma', icon: '🛡️', color: '#59c9a5' },
  { id: 'wealth', name: 'Servet', icon: '💰', color: '#f2c14e' },
  { id: 'gear', name: 'Teçhizat', icon: '🎒', color: '#c58b5a' },
  { id: 'arcane', name: 'Büyü', icon: '✨', color: '#b98cf0' },
];

const node = (branch, tier, id, data) => ({ branch, tier, id, maxLevel: 1, growth: 1.4, requires: [], ...data });

export const TREE_NODES = [
  // ---------- Savaş ----------
  node('combat', 1, 'c1', { name: 'Keskin Kılıç', icon: '🗡️', cost: 1, maxLevel: 10, growth: 1.35,
    effect: { type: 'stat', stat: 'atkPct', per: 10 }, desc: (v) => `+%${v} saldırı` }),
  node('combat', 2, 'c2', { name: 'Ölümcül Odak', icon: '🎯', cost: 3, maxLevel: 10,
    effect: { type: 'stat', stat: 'crit', per: 2 }, desc: (v) => `+%${v} kritik şansı` }),
  node('combat', 3, 'c3', { name: 'Boss Avcısı', icon: '👑', cost: 6, maxLevel: 10,
    effect: { type: 'stat', stat: 'bossDmg', per: 15 }, desc: (v) => `+%${v} boss hasarı` }),
  node('combat', 4, 'c4', { name: 'Zaman Kazanımı', icon: '⏳', cost: 12, maxLevel: 4, growth: 1.6,
    effect: { type: 'perk', key: 'bossTime', per: 5 }, desc: (v) => `Boss süresi +${v} sn` }),
  node('combat', 5, 'c5', { name: 'Vahşi Güç', icon: '💥', cost: 25, maxLevel: 10,
    effect: { type: 'stat', stat: 'critDmg', per: 40 }, desc: (v) => `+%${v} kritik hasarı` }),

  // ---------- Hayatta Kalma ----------
  node('survival', 1, 's1', { name: 'Demir Beden', icon: '❤️', cost: 1, maxLevel: 10, growth: 1.35,
    effect: { type: 'stat', stat: 'hpPct', per: 10 }, desc: (v) => `+%${v} can` }),
  node('survival', 2, 's2', { name: 'Kalkan Taşıyıcı', icon: '🛡️', cost: 4,
    effect: { type: 'slot', slot: 'shield' }, desc: () => 'Kalkan yuvasını açar' }),
  node('survival', 3, 's3', { name: 'Kaçış Ustası', icon: '🍃', cost: 6, maxLevel: 8,
    effect: { type: 'stat', stat: 'dodge', per: 2 }, desc: (v) => `+%${v} kaçınma` }),
  node('survival', 4, 's4', { name: 'İlahi Şifa', icon: '✨', cost: 15,
    effect: { type: 'skill', skill: 'divineHeal' }, desc: () => 'İlahi Şifa yeteneğini açar (R)' }),
  node('survival', 5, 's5', { name: 'Diken Zırh', icon: '🌵', cost: 25, maxLevel: 10,
    effect: { type: 'stat', stat: 'thorns', per: 15 }, desc: (v) => `+%${v} diken hasarı` }),

  // ---------- Servet ----------
  node('wealth', 1, 'w1', { name: 'Altın Kokusu', icon: '🪙', cost: 1, maxLevel: 10, growth: 1.35,
    effect: { type: 'stat', stat: 'goldPct', per: 15 }, desc: (v) => `+%${v} altın` }),
  node('wealth', 2, 'w2', { name: 'Ruh Hasadı', icon: '👻', cost: 3, maxLevel: 10,
    effect: { type: 'perk', key: 'soulGain', per: 10 }, desc: (v) => `Yeniden doğuşta +%${v} Ruh` }),
  node('wealth', 3, 'w3', { name: 'Altın Miras', icon: '🏦', cost: 8, maxLevel: 5, growth: 1.5,
    effect: { type: 'perk', key: 'goldKeep', per: 5 }, desc: (v) => `Yeniden doğuşta altının %${v} kadarı korunur` }),
  node('wealth', 4, 'w4', { name: 'Hızlı Başlangıç', icon: '🚀', cost: 15, maxLevel: 6, growth: 1.5,
    effect: { type: 'perk', key: 'startStage', per: 5 }, desc: (v) => `Yeniden doğuştan sonra ${1 + v}. bölgeden başla` }),
  node('wealth', 5, 'w5', { name: 'Pazarlıkçı', icon: '🤝', cost: 25, maxLevel: 6, growth: 1.5,
    effect: { type: 'perk', key: 'discount', per: 5 }, desc: (v) => `Yükseltme ve mağaza fiyatları %${v} ucuz` }),

  // ---------- Teçhizat ----------
  node('gear', 1, 'g1', { name: 'Geniş Çanta', icon: '🎒', cost: 2, maxLevel: 4, growth: 1.8,
    effect: { type: 'perk', key: 'inventorySlots', per: 5 }, desc: (v) => `Envantere +${v} yuva` }),
  node('gear', 2, 'g2', { name: 'Eldiven Ustalığı', icon: '🧤', cost: 3,
    effect: { type: 'slot', slot: 'gloves' }, desc: () => 'Eldiven yuvasını açar' }),
  node('gear', 3, 'g3', { name: 'Kemer Tokası', icon: '🪢', cost: 6,
    effect: { type: 'slot', slot: 'belt' }, desc: () => 'Kemer yuvasını açar' }),
  node('gear', 4, 'g4', { name: 'Gezgin Pelerini', icon: '🧣', cost: 10,
    effect: { type: 'slot', slot: 'cape' }, desc: () => 'Pelerin yuvasını açar' }),
  node('gear', 5, 'g5', { name: 'Çifte Ganimet', icon: '🎁', cost: 25, maxLevel: 5, growth: 1.5,
    effect: { type: 'perk', key: 'doubleDrop', per: 6 }, desc: (v) => `Eşya düştüğünde %${v} ihtimalle bir tane daha düşer` }),

  // ---------- Büyü ----------
  node('arcane', 1, 'a1', { name: 'Büyü Akışı', icon: '🌀', cost: 2, maxLevel: 6, growth: 1.5,
    effect: { type: 'perk', key: 'skillCooldown', per: 5 }, desc: (v) => `Yetenek bekleme süreleri %${v} kısa` }),
  node('arcane', 2, 'a2', { name: 'Altın Yağmuru', icon: '💰', cost: 5,
    effect: { type: 'skill', skill: 'goldRush' }, desc: () => 'Altın Yağmuru yeteneğini açar (E)' }),
  node('arcane', 3, 'a3', { name: 'Büyü Gücü', icon: '🔮', cost: 8, maxLevel: 10,
    effect: { type: 'perk', key: 'skillPower', per: 15 }, desc: (v) => `Yetenek etkileri +%${v} güçlü` }),
  node('arcane', 4, 'a4', { name: 'Savaş Çağrısı', icon: '📯', cost: 12,
    effect: { type: 'perk', key: 'autoBoss', per: 1 }, desc: () => 'Boss kaçarsa bir bölge kastıktan sonra kendiliğinden tekrar dener' }),
  node('arcane', 5, 'a5', { name: 'Kıyamet Meteoru', icon: '☄️', cost: 40, requires: ['c3'],
    effect: { type: 'skill', skill: 'meteor' }, desc: () => 'Özel yetenek: Kıyamet Meteoru (T). Sadece buradan açılır.' }),
];

export const TREE_MAP = Object.fromEntries(TREE_NODES.map((n) => [n.id, n]));

/** Dal içinde bir önceki düğüm (yoksa null) */
export const previousInBranch = (n) => TREE_NODES.find((o) => o.branch === n.branch && o.tier === n.tier - 1) ?? null;

export const nodeCost = (n, level) => Math.ceil(n.cost * Math.pow(n.growth, level));

/** Başlangıçta açık olan ekipman yuvaları; diğerleri Ruh Ağacı'ndan açılır */
export const BASE_SLOTS = ['helmet', 'amulet', 'weapon', 'armor', 'ring', 'boots'];
