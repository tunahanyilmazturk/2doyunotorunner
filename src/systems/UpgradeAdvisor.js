// Yükseltme danışmanı: "ne alsam?" sorusunu besleyen saf hesaplar (DOM yok).
// Panel satırlarındaki verim göstergesini, "En iyisini al" seçimini ve
// oto-alım profillerini bu modül besler.
//
// KAZANÇ ORANI (gain): bir alımın ilgili statı KENDİ ölçeğinde ne kadar
// büyüttüğü. Farklı statları tek bir karşılaştırılabilir sayıya indirir.
// Bu bir TAHMİNDİR — hasar/can formüllerinin tamamını değil, statın büyümesini
// ölçer (arayüzde "tahmini verim" olarak sunulur). Aynı ölçüt tüm satırlarda
// kullanıldığı için "altın başına hangisi daha çok büyütür" karşılaştırması
// tutarlıdır.
//
// Formlar `StatsSystem.recalculate` içindeki gerçek ifadelerle eşleşir:
//   flat  → delta / mevcut          (atk, hp, regen)
//   add   → delta / (100 + mevcut)  (1 + v/100 formu: aspd, crit, goldPct, luck, bossDmg)
//   ratio → delta / mevcut          (v/100 formu: critDmg, lifesteal, dodge, thorns)
//   ehp   → (1-r₁)/(1-r₂) - 1       (armor: azaltma 0.6'da doyduğu için doğrusal değil)
import { PLAYER_BASE, Balance } from '../config/balance.js';
import { upgradeValue } from '../data/upgrades.js';

/** Statın okunacağı form. Listede olmayanlar `flat` sayılır. */
const FORM = {
  atk: 'flat',
  hp: 'flat',
  regen: 'flat',
  aspd: 'add',
  crit: 'add',
  goldPct: 'add',
  luck: 'add',
  bossDmg: 'add',
  critDmg: 'ratio',
  lifesteal: 'ratio',
  dodge: 'ratio',
  thorns: 'ratio',
  armor: 'ehp',
};

/** Statın ulaşabileceği üst sınır (yüzde puan). Sınırdayken ek puan boşa gider. */
const CAPS = {
  crit: 100, // StatsSystem: min(100, crit)
  dodge: Balance.maxDodge, // min(maxDodge, dodge)
  lifesteal: Balance.maxLifesteal, // min(maxLifesteal, lifesteal)
  aspd: (Balance.maxAttackSpeed / PLAYER_BASE.attackSpeed - 1) * 100, // maxAttackSpeed tavanı
};

/**
 * Bir stat artışının göreli kazancı (0.05 = %5).
 * @param {string} stat  yükseltmenin stat anahtarı
 * @param {number} delta eklenecek miktar (ham stat birimi)
 * @param {object} rawStats StatsSystem'in ham stat havuzu (`stats.get().raw`)
 * @param {number} stage zırh doyumu bölgeye bağlı olduğu için
 * @returns {number} kazanç oranı (üst sınırdaysa 0)
 */
export function statGain(stat, delta, rawStats, stage = 1) {
  const current = rawStats?.[stat] ?? PLAYER_BASE[stat] ?? 0;
  const cap = CAPS[stat];
  const room = cap === undefined ? delta : Math.min(delta, cap - current);
  if (!(room > 0)) return 0;

  if (stat === 'armor') {
    const before = Balance.armorReduction(current, stage);
    const after = Balance.armorReduction(current + room, stage);
    return (1 - before) / (1 - after) - 1;
  }
  const form = FORM[stat] ?? 'flat';
  if (form === 'add') return room / (100 + current);
  // Taban 0 ise (hiç alınmamış stat) sıfıra bölmek yerine 100 kabul edilir.
  return current > 0 ? room / current : room / 100;
}

/**
 * Bir satırın alım ölçümü.
 * @param {object} up     yükseltme tanımı
 * @param {number} level  mevcut seviye
 * @param {number} count  alınacak seviye sayısı
 * @returns {{from:number,to:number,delta:number,gain:number}}
 */
export function rowMetrics(up, level, count, rawStats, stage = 1) {
  const from = upgradeValue(up, level); // kilometre taşı dahil: panelin gösterdiği değerlerin aynısı
  const to = upgradeValue(up, level + count);
  const delta = Math.max(0, to - from);
  return { from, to, delta, gain: statGain(up.stat, delta, rawStats, stage) };
}

/** Altın başına kazanç. Maliyet 0/geçersizse 0. */
export function efficiency({ gain, cost }) {
  return cost > 0 && gain > 0 ? gain / cost : 0;
}

/** Satırın verimi (hazır `eff` varsa onu kullanır). */
export const rowEfficiency = (row) => (typeof row.eff === 'number' ? row.eff : efficiency(row));

/** Verimleri 0..100'e ölçekler (en iyi satır = 100). Hiç kazanç yoksa hepsi 0. */
export function rankRows(rows) {
  const effs = rows.map(rowEfficiency);
  const best = Math.max(0, ...effs);
  if (!(best > 0)) return effs.map(() => 0);
  return effs.map((e) => Math.max(1, Math.round((e / best) * 100)));
}

// ---------- oto-alım profilleri ----------
// `order`: öncelik sırası (baştaki önce alınır). Listede olmayanlar sona düşer.
// `cheapest` ve `value` özel: sırasız, sırasıyla en ucuz ve en verimliyi seçer.
export const PROFILES = [
  { id: 'cheapest', name: 'En ucuz', icon: '💰', order: [] },
  { id: 'value', name: 'Verim', icon: '📈', order: [] },
  { id: 'damage', name: 'Hasar', icon: '⚔️', order: ['power', 'brutality', 'precision', 'haste', 'slayer'] },
  { id: 'survive', name: 'Hayatta kalma', icon: '🛡️', order: ['vitality', 'defense', 'regen', 'evasion', 'vampirism'] },
  { id: 'gold', name: 'Altın', icon: '🪙', order: ['greed', 'fortune', 'power', 'vitality'] },
];

export const PROFILES_MAP = Object.fromEntries(PROFILES.map((p) => [p.id, p]));
export const DEFAULT_PROFILE = 'cheapest';

/** Bilinmeyen/boş profil kimliğini geçerli bir profile çevirir. */
export const resolveProfile = (id) => PROFILES_MAP[id] ?? PROFILES_MAP[DEFAULT_PROFILE];

/**
 * Adaylar arasından profile göre bir sonraki alımı seçer.
 * @param {Array<{up:object,cost:number,gain:number,eff?:number}>} rows
 * @param {string} profileId
 * @returns {object|null}
 */
export function pickNext(rows, profileId = DEFAULT_PROFILE) {
  if (!rows.length) return null;
  const profile = resolveProfile(profileId);
  if (profile.id === 'value') return rows.reduce((a, b) => (rowEfficiency(b) > rowEfficiency(a) ? b : a));

  const cheapest = (a, b) => (b.cost < a.cost ? b : a);
  if (profile.order.length === 0) return rows.reduce(cheapest);

  const rank = (row) => {
    const i = profile.order.indexOf(row.up.id);
    return i < 0 ? profile.order.length + 1 : i;
  };
  return rows.reduce((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    return ra === rb ? cheapest(a, b) : rb < ra ? b : a;
  });
}
