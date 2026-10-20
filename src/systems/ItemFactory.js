import { Balance } from '../config/balance.js';
import { ITEM_BASES, SLOT_ORDER, WEAPON_KINDS } from '../data/items.js';
import { RARITIES, getRarity } from '../data/rarities.js';
import { MAX_SOCKETS_BY_TIER } from '../data/runes.js';
import { SET_MAP, isSetForSlot, itemName, rollSet } from '../data/sets.js';
import { STAT_DEFS } from '../data/stats.js';
import { pick, rand, shuffle, weightedPick } from '../utils/random.js';

/** Şans arttıkça yüksek nadirliklerin ağırlığı üstel olarak artar. */
export function rollRarity(luck = 0, minTier = 0) {
  const luckFactor = 1 + (luck / 100) * 0.6;
  const pool = RARITIES.filter((r) => r.tier >= minTier);
  return weightedPick(pool, (r) => r.weight * Math.pow(luckFactor, r.tier));
}

export function rollStat(key, level, rarity, mult = 1) {
  const def = STAT_DEFS[key];
  let v;
  if (def.scaling === 'flat') {
    v = def.base * Balance.itemFlatScale(level) * rarity.statMult;
  } else {
    v = (def.base + def.perLevel * level) * Math.pow(rarity.statMult, 0.6);
  }
  v *= mult * rand(0.85, 1.15);
  if (def.percent || v < 10) return Math.round(v * 10) / 10;
  return Math.round(v);
}

/**
 * Yeni eşya üretir.
 * @param {object} state  oyun durumu (benzersiz id için)
 * @param {{level:number, slot?:string, slots?:string[], kind?:string, tier?:number, luck?:number, minTier?:number, set?:string}} opts
 *   slots: yuva belirtilmezse aralarından rastgele seçilecek yuvalar (varsayılan: hepsi)
 *   set:   o yuvaya uymayan bir set zorlanırsa sessizce atılır (kayıt/doğrulama güvenliği)
 */
export function createItem(state, { level, slot, slots = SLOT_ORDER, kind, tier, luck = 0, minTier = 0, set }) {
  slot = slot ?? pick(slots);
  const rarity = tier !== undefined ? getRarity(tier) : rollRarity(luck, minTier);
  const base = ITEM_BASES[slot];

  // Silah türü: ana stat çarpanı ve garanti ek stat türe göre değişir
  let primaryMult = 1.4;
  let guaranteed = [];
  if (slot === 'weapon') {
    kind = kind ?? weightedPick(Object.keys(WEAPON_KINDS), (k) => WEAPON_KINDS[k].weight);
    primaryMult = WEAPON_KINDS[kind].primaryMult;
    guaranteed = WEAPON_KINDS[kind].guaranteed;
  } else {
    kind = undefined;
  }

  const setId = set !== undefined ? (isSetForSlot(set, slot) ? set : undefined) : rollSet(slot, rarity.tier);

  const stats = { [base.primary]: rollStat(base.primary, level, rarity, primaryMult) };
  const extraCount = rarity.affixes - 1;
  const pool = shuffle(base.affixPool.filter((k) => k !== base.primary && !guaranteed.includes(k)));
  const extras = [...guaranteed, ...pool].slice(0, Math.max(extraCount, guaranteed.length));
  for (const key of extras) stats[key] = rollStat(key, level, rarity);

  const item = {
    id: state.nextItemId++,
    slot,
    ...(kind ? { kind } : {}),
    name: itemName(slot, level, kind, setId),
    tier: rarity.tier,
    level,
    stats,
    value: Balance.itemValue(level, rarity.valueMult),
  };
  if (setId) item.set = setId;
  // Rün yuvaları: nadirliğin izin verdiği en fazla yuvanın yarısı ile tamamı arası
  const maxSockets = MAX_SOCKETS_BY_TIER[rarity.tier] ?? 0;
  const sockets = maxSockets ? Math.floor(maxSockets / 2) + Math.floor(Math.random() * (Math.ceil(maxSockets / 2) + 1)) : 0;
  if (sockets > 0) item.sockets = new Array(Math.min(maxSockets, sockets)).fill(null);
  return item;
}

/** Statın referans seviyedeki "tipik" değeri (puanlama ölçeği). */
function statTypical(key, refLevel) {
  const def = STAT_DEFS[key];
  if (!def) return 0;
  return def.scaling === 'flat' ? def.base * Balance.itemFlatScale(refLevel) : def.base + def.perLevel * refLevel;
}

/**
 * Bir set parçasının puana katkısı: setin tüm bonuslarının puanı, son kademenin
 * parça sayısına bölünür. Böylece parça başına beklenen değer çıkar ve otomatik
 * kuşanma/sıralama set parçalarını görmezden gelmez.
 *
 * Kaba bir tahmindir: yalnızca tek parça bulan oyuncu için bonus gerçekte sıfırdır.
 * Set bonusları yüzde olduğu için bu katkı düşük seviyede daha büyüktür; bu doğru
 * yöndedir (düşük seviyede +%6 saldırı, eşyanın kendisinden daha değerlidir).
 */
export function setPieceRating(setId, refLevel) {
  const set = SET_MAP[setId];
  if (!set) return 0;
  const required = set.bonuses[set.bonuses.length - 1].pieces;
  let total = 0;
  for (const tier of set.bonuses) {
    for (const [key, value] of Object.entries(tier.stats)) {
      const typical = statTypical(key, refLevel);
      if (typical > 0) total += value / typical;
    }
  }
  return total / required;
}

/**
 * Eşyanın kaba güç puanı. Statlar, verilen referans seviyedeki "tipik" değere
 * bölünerek normalize edilir; böylece farklı stat türleri karşılaştırılabilir.
 * Set parçaları, setin beklenen bonus değeri kadar ek puan alır.
 */
export function itemRating(item, refLevel) {
  let score = item.set ? setPieceRating(item.set, refLevel) : 0;
  for (const [key, value] of Object.entries(getItemStats(item))) {
    const typical = statTypical(key, refLevel);
    if (!typical) continue;
    score += value / typical;
  }
  return score;
}

export function isUpgradeOver(item, equipped, refLevel) {
  if (!equipped) return true;
  return itemRating(item, refLevel) > itemRating(equipped, refLevel) * 1.02;
}

// ---------- Güçlendirme (Demirci) ----------

const roundStat = (key, v) => (STAT_DEFS[key]?.percent || v < 10 ? Math.round(v * 10) / 10 : Math.round(v));

/** Güçlendirme seviyesi uygulanmış nihai statlar. */
export function getItemStats(item) {
  const e = item.enhance || 0;
  if (!e) return item.stats;
  const mult = 1 + Balance.enhanceStatPerLevel * e;
  const out = {};
  for (const [key, value] of Object.entries(item.stats)) out[key] = roundStat(key, value * mult);
  return out;
}

export const itemMaxEnhance = (item) => Balance.maxEnhance(item.tier);

export const itemDisplayName = (item) => (item.enhance ? `+${item.enhance} ${item.name}` : item.name);

export const itemSellValue = (item) => Math.round(item.value * (1 + Balance.enhanceSellBonus * (item.enhance || 0)));
