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
  { id: 'swift', name: 'Çeviklik İksiri', icon: '💨', color: '#7fe0ff', stat: 'aspd', value: 40, duration: 90, priceMult: 6,
    desc: '+%40 saldırı hızı' },
  { id: 'precision', name: 'Keskin Göz Özü', icon: '🔍', color: '#ffb36b', stat: 'crit', value: 15, duration: 120, priceMult: 7,
    desc: '+15 kritik şansı' },
  { id: 'vampire', name: 'Kan Damlası', icon: '🩸', color: '#c2185b', stat: 'lifesteal', value: 5, duration: 90, priceMult: 9,
    desc: '+%5 can çalma' },
  { id: 'haven', name: 'Diriliş Özü', icon: '🌿', color: '#7bd389', stat: 'regen', value: 3, duration: 120, priceMult: 5,
    desc: '+3 can/sn yenilenme' },
  { id: 'shade', name: 'Gölge Tozu', icon: '🌑', color: '#6b5b8a', stat: 'dodge', value: 8, duration: 60, priceMult: 7,
    desc: '+%8 kaçınma' },
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

/**
 * Özel ürünler: altınla alınır, ödülü rewards.js biçiminde verilir (grantReward).
 * priceMult: o bölgedeki Sıradan bir eşyanın değerinin katı (ShopSystem hesaplar).
 */
export const SPECIAL_ITEMS = [
  { id: 'runePack', name: 'Rün Paketi', icon: '💎', color: '#8fd3ff', priceMult: 25,
    desc: '3 rastgele rün (bölgeye göre kademe)', reward: { type: 'rune', amount: 3 } },
  { id: 'egg', name: 'Yoldaş Yumurtası', icon: '🥚', color: '#f5e6c8', priceMult: 150,
    desc: 'Kuluçkaya bir yumurta ekler', reward: { type: 'egg', amount: 1 } },
  { id: 'towerKey', name: 'Kule Anahtarı', icon: '🗝️', color: '#c58bff', priceMult: 60,
    desc: 'Boss Kulesi\'ne bir ekstra giriş hakkı', reward: { type: 'towerKey', amount: 1 } },
];

export const SPECIAL_MAP = Object.fromEntries(SPECIAL_ITEMS.map((s) => [s.id, s]));

/**
 * Elmasla alınan ürünler (fiyat sabit elmas; altın ve bölge ölçeklemesi yok).
 * kind: 'rare' (en yüksek nadirlik eşya) | 'elixirs' (her süreli iksirden bir tane) | 'runes' (rün paketi)
 */
export const GEM_ITEMS = [
  { id: 'gemRare', name: 'Nadir Hazine', icon: '💠', color: '#7fd9ff', gems: 12, kind: 'rare',
    desc: 'Mitik nadirlikte (en yüksek) bir eşya' },
  { id: 'gemElixirs', name: 'İksir Sandığı', icon: '🧴', color: '#c58bff', gems: 4, kind: 'elixirs',
    desc: 'Her süreli iksirden birer tane' },
  { id: 'gemRunes', name: 'Rün Hazinesi', icon: '💎', color: '#8fd3ff', gems: 6, kind: 'runes',
    desc: '8 rastgele rün (bölgeye göre kademe)' },
];

export const GEM_ITEM_MAP = Object.fromEntries(GEM_ITEMS.map((g) => [g.id, g]));
