import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEM_BASES, SLOT_ORDER, WEAPON_KINDS } from '../src/data/items.js';
import { RARITIES } from '../src/data/rarities.js';
import { STAT_DEFS } from '../src/data/stats.js';
import {
  createItem,
  getItemStats,
  isUpgradeOver,
  itemMaxEnhance,
  itemRating,
  itemSellValue,
  rollRarity,
} from '../src/systems/ItemFactory.js';

const makeState = () => ({ nextItemId: 1 });

test('createItem geçerli ve tutarlı eşya üretir', () => {
  const state = makeState();
  for (let i = 0; i < 200; i++) {
    const item = createItem(state, { level: 1 + (i % 60), luck: i % 200 });
    assert.ok(SLOT_ORDER.includes(item.slot), 'geçersiz yuva');
    assert.ok(item.tier >= 0 && item.tier <= RARITIES.length - 1, 'geçersiz nadirlik');
    assert.ok(Number.isFinite(item.level) && item.level >= 1);
    assert.ok(typeof item.name === 'string' && item.name.length > 0);
    assert.ok(Number.isFinite(item.value) && item.value > 0, 'değer pozitif olmalı');
    // Ana stat her zaman bulunur, tüm statlar tanımlı olmalı
    assert.ok(ITEM_BASES[item.slot].primary in item.stats, `${item.slot}: ana stat eksik`);
    for (const key of Object.keys(item.stats)) {
      assert.ok(STAT_DEFS[key], `tanımsız stat: ${key}`);
      assert.ok(Number.isFinite(item.stats[key]));
    }
    if (item.slot === 'weapon') assert.ok(WEAPON_KINDS[item.kind], 'silah türü geçersiz');
    else assert.equal(item.kind, undefined, 'silah olmayanda tür olmamalı');
  }
});

test('eşya kimlikleri benzersizdir', () => {
  const state = makeState();
  const ids = new Set();
  for (let i = 0; i < 300; i++) {
    const item = createItem(state, { level: 20 });
    assert.ok(!ids.has(item.id), 'yinelenen eşya kimliği');
    ids.add(item.id);
  }
});

test('slot, tier ve minTier isteğe uyar', () => {
  const state = makeState();
  for (const slot of SLOT_ORDER) {
    const item = createItem(state, { level: 10, slot });
    assert.equal(item.slot, slot);
  }
  for (const slot of SLOT_ORDER) {
    for (let tier = 0; tier < RARITIES.length; tier++) {
      const item = createItem(state, { level: 10, slot, tier });
      assert.equal(item.tier, tier);
      // Toplam stat = ana stat + max(nadirlik-1, garanti stat sayısı)
      const guaranteed = slot === 'weapon' ? WEAPON_KINDS[item.kind].guaranteed.length : 0;
      const expected = 1 + Math.max(RARITIES[tier].affixes - 1, guaranteed);
      assert.equal(Object.keys(item.stats).length, expected, `${slot} tier ${tier}`);
    }
  }
  for (let i = 0; i < 300; i++) {
    assert.ok(createItem(state, { level: 30, minTier: 3 }).tier >= 3);
  }
});

test('silah türü garanti statını taşır', () => {
  const state = makeState();
  for (const [kind, def] of Object.entries(WEAPON_KINDS)) {
    if (!def.guaranteed.length) continue;
    const item = createItem(state, { level: 40, slot: 'weapon', kind, tier: 1 });
    for (const stat of def.guaranteed) {
      assert.ok(stat in item.stats, `${kind}: ${stat} garanti statı eksik`);
    }
  }
});

test('rollRarity minTier altına inmez', () => {
  for (let i = 0; i < 500; i++) {
    assert.ok(rollRarity(0, 4).tier >= 4);
    assert.ok(rollRarity(500, 0).tier >= 0);
  }
});

test('güçlendirme statları ölçekler ve satış değerini artırır', () => {
  const state = makeState();
  const item = createItem(state, { level: 30, tier: 2 });
  assert.equal(getItemStats(item), item.stats, 'güçlendirme yokken aynı nesne dönmeli');

  const enhanced = { ...item, enhance: 5 };
  const mult = 1 + 0.12 * 5;
  const before = getItemStats(item);
  const after = getItemStats(enhanced);
  for (const key of Object.keys(item.stats)) {
    const expected = Math.round(item.stats[key] * mult * 10) / 10;
    if (STAT_DEFS[key].percent || item.stats[key] < 10) assert.equal(after[key], expected);
    else assert.equal(after[key], Math.round(item.stats[key] * mult));
  }
  assert.ok(after[ITEM_BASES[item.slot].primary] > before[ITEM_BASES[item.slot].primary]);
  assert.ok(itemSellValue(enhanced) > itemSellValue(item));
});

test('itemRating pozitif ve güçlü eşyada daha yüksek', () => {
  const state = makeState();
  const weak = createItem(state, { level: 10, tier: 0 });
  const strong = createItem(state, { level: 60, tier: 5 });
  assert.ok(itemRating(weak, 30) > 0);
  assert.ok(itemRating(strong, 30) > itemRating(weak, 30));
});

test('isUpgradeOver: boş yuva ve aynı eşya davranışı', () => {
  const state = makeState();
  const item = createItem(state, { level: 25, tier: 2 });
  assert.equal(isUpgradeOver(item, null, 25), true);
  assert.equal(isUpgradeOver(item, item, 25), false, 'aynı eşya yükseltme sayılmamalı');
  const better = createItem(state, { level: 25, tier: 5 });
  assert.equal(isUpgradeOver(better, item, 25), true);
});

test('itemMaxEnhance nadirlikle artar', () => {
  const a = { tier: 0 };
  const b = { tier: 5 };
  assert.ok(itemMaxEnhance(b) > itemMaxEnhance(a));
});
