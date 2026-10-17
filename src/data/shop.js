// Mağaza kataloğu: süreli iksirler ve hazine sandıkları.
// Fiyatlar ulaşılan en yüksek bölgeye göre ölçeklenir (ShopSystem hesaplar).

/**
 * Süreli iksirler: içildiğinde `duration` saniye boyunca stat bonusu verir.
 * Aynı iksir tekrar içilirse süre eklenir (en fazla MAX_ELIXIR_SECONDS).
 * priceMult: Can İksiri fiyatının katı.
 */
export const ELIXIRS = [
  { id: 'wrath', name: 'Öfke İksiri', icon: '🍷', color: '#e0625a', stat: 'atkPct', value: 50, duration: 120, priceMult: 6,
    desc: '+%50 saldırı' },
  { id: 'ironskin', name: 'Demir Deri İksiri', icon: '🧉', color: '#a9b3c1', stat: 'hpPct', value: 50, duration: 120, priceMult: 5,
    desc: '+%50 can' },
  { id: 'fortune', name: 'Altın İksiri', icon: '🍯', color: '#f2c14e', stat: 'goldPct', value: 100, duration: 120, priceMult: 6,
    desc: '+%100 altın' },
  { id: 'luck', name: 'Şans Parşömeni', icon: '📜', color: '#59c9a5', stat: 'luck', value: 100, duration: 180, priceMult: 8,
    desc: '+%100 şans (daha çok ve daha nadir eşya)' },
];

export const ELIXIR_MAP = Object.fromEntries(ELIXIRS.map((e) => [e.id, e]));
export const MAX_ELIXIR_SECONDS = 30 * 60;

/**
 * Hazine sandıkları: açıldığında en az `minTier` nadirlikte, ek şanslı bir eşya verir.
 * priceMult: o bölgedeki Sıradan bir eşyanın değerinin katı.
 */
export const CHESTS = [
  { id: 'wood', name: 'Tahta Sandık', icon: '📦', color: '#c58b5a', minTier: 1, luck: 50, priceMult: 14,
    desc: 'En az Kaliteli eşya' },
  { id: 'iron', name: 'Demir Sandık', icon: '🧰', color: '#a9b3c1', minTier: 2, luck: 120, priceMult: 70,
    desc: 'En az Nadir eşya' },
  { id: 'gold', name: 'Altın Sandık', icon: '👑', color: '#f2c14e', minTier: 3, luck: 260, priceMult: 320,
    desc: 'En az Destansı eşya, Efsanevi şansı yüksek' },
];

export const CHEST_MAP = Object.fromEntries(CHESTS.map((c) => [c.id, c]));
