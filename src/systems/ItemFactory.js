import { Balance } from '../config/balance.js';
import { ITEM_BASES, SLOT_ORDER, WEAPON_KINDS, getBaseName } from '../data/items.js';
import { RARITIES, getRarity } from '../data/rarities.js';
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
 * @param {{level:number, slot?:string, slots?:string[], kind?:string, tier?:number, luck?:number, minTier?:number}} opts
 *   slots: yuva belirtilmezse aralarından rastgele seçilecek yuvalar (varsayılan: hepsi)
 */
export function createItem(state, { level, slot, slots = SLOT_ORDER, kind, tier, luck = 0, minTier = 0 }) {
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

  const stats = { [base.primary]: rollStat(base.primary, level, rarity, primaryMult) };
  const extraCount = rarity.affixes - 1;
  const pool = shuffle(base.affixPool.filter((k) => k !== base.primary && !guaranteed.includes(k)));
  const extras = [...guaranteed, ...pool].slice(0, Math.max(extraCount, guaranteed.length));
  for (const key of extras) stats[key] = rollStat(key, level, rarity);

  return {
    id: state.nextItemId++,
    slot,
    ...(kind ? { kind } : {}),
    name: getBaseName(slot, level, kind),
    tier: rarity.tier,
    level,
    stats,
    value: Balance.itemValue(level, rarity.valueMult),
  };
}

/**
 * Eşyanın kaba güç puanı. Statlar, verilen referans seviyedeki "tipik" değere
 * bölünerek normalize edilir; böylece farklı stat türleri karşılaştırılabilir.
 */
export function itemRating(item, refLevel) {
  let score = 0;
  for (const [key, value] of Object.entries(getItemStats(item))) {
    const def = STAT_DEFS[key];
    if (!def) continue;
    const typical = def.scaling === 'flat' ? def.base * Balance.itemFlatScale(refLevel) : def.base + def.perLevel * refLevel;
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
