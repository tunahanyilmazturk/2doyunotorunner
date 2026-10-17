// Eşya setleri sözleşmesi: veri tutarlılığı, eşik matematiği ve kayıt güvenliği.
// Set bonusları yüzde statlarından oluşur; bu yüzden yüksek bölgelerde de değerlidir.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ITEM_BASES, SLOT_ORDER } from '../src/data/items.js';
import {
  SETS,
  SET_MAP,
  activeSetBonuses,
  countSetPieces,
  isSetForSlot,
  itemName,
  rollSet,
  setsForSlot,
} from '../src/data/sets.js';
import { STAT_DEFS } from '../src/data/stats.js';
import { PLAYER_BASE } from '../src/config/balance.js';
import { createItem, itemRating, setPieceRating } from '../src/systems/ItemFactory.js';
import { migrate } from '../src/core/saveIntegrity.js';

/** Verilen setten, verilen yuvalarda sahte parçalar kuşanmış bir ekipman nesnesi. */
const equipWith = (setId, slots) =>
  Object.fromEntries(slots.map((slot) => [slot, { slot, set: setId, tier: 3, level: 20, stats: {} }]));

// ---------- veri tutarlılığı ----------

test('setler eksiksiz ve tutarlı tanımlı', () => {
  const ids = new Set();
  for (const set of SETS) {
    assert.ok(!ids.has(set.id), `yinelenen set kimliği: ${set.id}`);
    ids.add(set.id);
    assert.ok(set.name.length > 0 && set.prefix.length > 0, `${set.id}: ad/önek eksik`);
    assert.match(set.color, /^#[0-9a-fA-F]{6}$/, `${set.id}: renk geçersiz`);
    assert.ok(set.icon.length > 0, `${set.id}: simge eksik`);
    assert.ok(SET_MAP[set.id] === set);
  }
  assert.ok(SETS.length >= 3, 'en az üç set olmalı');
});

test('her set 6 geçerli ve benzersiz yuva kapsar', () => {
  for (const set of SETS) {
    assert.equal(set.slots.length, 6, `${set.id}: altı yuvası olmalı`);
    assert.equal(new Set(set.slots).size, 6, `${set.id}: yinelenen yuva`);
    for (const slot of set.slots) assert.ok(SLOT_ORDER.includes(slot), `${set.id}: bilinmeyen yuva ${slot}`);
  }
});

test('her yuvaya en az iki set düşebilir', () => {
  for (const slot of SLOT_ORDER) {
    assert.ok(setsForSlot(slot).length >= 2, `${slot}: yeterli set yok`);
  }
});

test('set kademeleri 2 ile başlar, son parçada biter ve artan sırada', () => {
  for (const set of SETS) {
    const pieces = set.bonuses.map((b) => b.pieces);
    assert.equal(pieces[0], 2, `${set.id}: ilk eşik 2 parça olmalı`);
    assert.equal(pieces[pieces.length - 1], set.slots.length, `${set.id}: son eşik tüm parçalar olmalı`);
    for (let i = 1; i < pieces.length; i++) assert.ok(pieces[i] > pieces[i - 1], `${set.id}: eşikler artmalı`);
    for (const b of set.bonuses) {
      assert.ok(b.pieces >= 2 && b.pieces <= set.slots.length, `${set.id}: eşik aralık dışı`);
      assert.ok(Object.keys(b.stats).length > 0, `${set.id}/${b.pieces}: boş bonus`);
    }
  }
});

test('set bonusları yalnızca yüzde statları ve bilinen anahtarlar kullanır', () => {
  for (const set of SETS) {
    for (const b of set.bonuses) {
      for (const [key, value] of Object.entries(b.stats)) {
        const def = STAT_DEFS[key];
        assert.ok(def, `${set.id}: bilinmeyen stat ${key}`);
        // Düz statlar eşya seviyesiyle üstel büyür; set bonusu olarak değersiz kalır.
        assert.ok(def.percent === true, `${set.id}: ${key} yüzde statı olmalı`);
        assert.ok(PLAYER_BASE[key] !== undefined, `${set.id}: ${key} PLAYER_BASE'te yok (toplama çalışmaz)`);
        assert.ok(Number.isFinite(value) && value > 0, `${set.id}: ${key} değeri geçersiz`);
      }
    }
  }
});

// ---------- parça sayma ve bonus toplama ----------

test('countSetPieces yalnızca yuvaya uyan parçaları sayar', () => {
  const equipment = {
    ...equipWith('crimson', ['helmet', 'armor']),
    // Şu yuvalar Kızıl Nişan'a ait değil: sayılmamalı
    shield: { slot: 'shield', set: 'crimson', tier: 3, level: 20, stats: {} },
    boots: { slot: 'boots', set: 'yokBoyleSet', tier: 3, level: 20, stats: {} },
  };
  assert.deepEqual(countSetPieces(equipment), { crimson: 2 });
  assert.deepEqual(countSetPieces({}), {});
  assert.deepEqual(countSetPieces(undefined), {});
});

test('activeSetBonuses kademeleri birikimli toplar', () => {
  assert.deepEqual(activeSetBonuses({}).stats, {});
  assert.deepEqual(activeSetBonuses({}).sets, []);

  const two = activeSetBonuses(equipWith('crimson', ['helmet', 'armor']));
  assert.deepEqual(two.stats, { atkPct: 6 });
  assert.deepEqual(two.sets[0].active.map((b) => b.pieces), [2]);

  const four = activeSetBonuses(equipWith('crimson', ['helmet', 'armor', 'gloves', 'belt']));
  assert.deepEqual(four.stats, { atkPct: 14, crit: 5 });
  assert.deepEqual(four.sets[0].active.map((b) => b.pieces), [2, 4]);

  const six = activeSetBonuses(equipWith('crimson', ['weapon', 'helmet', 'armor', 'gloves', 'ring', 'belt']));
  assert.deepEqual(six.stats, { atkPct: 24, crit: 5, critDmg: 35, lifesteal: 2 });
  assert.equal(six.sets[0].pieces, 6);
});

test('iki set birlikte kuşanılınca bonuslar toplanır', () => {
  const equipment = {
    ...equipWith('crimson', ['helmet', 'armor', 'gloves']),
    ...equipWith('storm', ['cape', 'boots', 'ring']),
  };
  const { stats, sets } = activeSetBonuses(equipment);
  assert.equal(sets.length, 2);
  assert.equal(stats.atkPct, 6); // crimson 2 parça
  assert.equal(stats.aspd, 8); // storm 2 parça
  // En çok parçası olan set başta
  assert.deepEqual(sets.map((s) => s.pieces), [3, 3]);
});

// ---------- üretim ve adlandırma ----------

test('itemName set önekini başa ekler', () => {
  const plain = itemName('helmet', 20);
  assert.equal(itemName('helmet', 20, undefined, 'crimson'), `Kızıl ${plain}`);
  assert.equal(itemName('helmet', 20, undefined, 'yokBoyle'), plain, 'bilinmeyen set önek eklememeli');
});

test('isSetForSlot yalnızca kapsanan yuvada doğru döner', () => {
  assert.equal(isSetForSlot('crimson', 'weapon'), true);
  assert.equal(isSetForSlot('crimson', 'shield'), false);
  assert.equal(isSetForSlot('yokBoyle', 'weapon'), false);
  assert.equal(isSetForSlot(undefined, 'weapon'), false);
});

test('rollSet alt nadirlikte ve geçersiz kademede set vermez', () => {
  for (const slot of SLOT_ORDER) {
    assert.equal(rollSet(slot, 0), undefined, `${slot}: sıradan eşya set olamamalı`);
    assert.equal(rollSet(slot, 1), undefined, `${slot}: kaliteli eşya set olamamalı`);
    assert.equal(rollSet(slot, 99), undefined, 'bilinmeyen kademe set vermemeli');
  }
});

test('rollSet yalnızca yuvaya uyan setler seçer', () => {
  for (const slot of SLOT_ORDER) {
    for (let i = 0; i < 60; i++) {
      const id = rollSet(slot, 5);
      if (id !== undefined) assert.ok(isSetForSlot(id, slot), `${slot}: uymayan set ${id}`);
    }
  }
});

test('createItem zorlanan seti yalnızca uygun yuvada uygular', () => {
  const state = { nextItemId: 1 };
  const valid = createItem(state, { level: 20, slot: 'helmet', tier: 3, set: 'glacier' });
  assert.equal(valid.set, 'glacier');
  assert.ok(valid.name.startsWith('Buzul '), `ad öneki eksik: ${valid.name}`);

  const invalid = createItem(state, { level: 20, slot: 'weapon', tier: 3, set: 'glacier' });
  assert.equal(invalid.set, undefined, 'kapsanmayan yuvaya set uygulanmamalı');
  assert.ok(!invalid.name.startsWith('Buzul '));

  // Düşük nadirlikte kendiliğinden set oluşmamalı
  for (let i = 0; i < 100; i++) {
    assert.equal(createItem(state, { level: 20, slot: 'helmet', tier: 0 }).set, undefined);
    assert.equal(createItem(state, { level: 20, slot: 'helmet', tier: 1 }).set, undefined);
  }
});

test('set etiketi stat sayısını ve değerini değiştirmez', () => {
  const state = { nextItemId: 1 };
  const plain = createItem(state, { level: 30, slot: 'helmet', tier: 3 });
  const set = createItem(state, { level: 30, slot: 'helmet', tier: 3, set: 'glacier' });
  assert.equal(Object.keys(plain.stats).length, Object.keys(set.stats).length);
  assert.equal(plain.value, set.value);
  assert.ok(ITEM_BASES.helmet.primary in set.stats);
});

// ---------- puanlama ----------

test('itemRating set parçasını ödüllendirir', () => {
  const base = { slot: 'helmet', tier: 3, level: 40, stats: { hp: 500 }, value: 10 };
  const plain = { ...base, name: 'Düz' };
  const set = { ...base, name: 'Buzul', set: 'glacier' };
  assert.ok(setPieceRating('glacier', 40) > 0);
  assert.equal(setPieceRating('yokBoyle', 40), 0);
  assert.ok(itemRating(set, 40) > itemRating(plain, 40), 'set parçası daha yüksek puan almalı');
});

// ---------- kayıt güvenliği ----------

test('kayıt doğrulaması geçerli set etiketini korur', () => {
  const rawItem = (slot, set) => ({ slot, tier: 3, level: 20, set, stats: { [ITEM_BASES[slot].primary]: 10 } });
  const out = migrate({
    version: 1,
    inventory: [rawItem('helmet', 'crimson'), rawItem('shield', 'crimson'), rawItem('helmet', 'yokBoyle')],
  });
  assert.equal(out.inventory[0].set, 'crimson');
  assert.equal(out.inventory[0].name, itemName('helmet', 20, undefined, 'crimson'), 'ad kanonik üretilmeli');
  assert.equal(out.inventory[1].set, undefined, 'yuvaya uymayan set etiketi düşmeli');
  assert.equal(out.inventory[2].set, undefined, 'bilinmeyen set etiketi düşmeli');
});

test('kayıt doğrulaması kuşanılan set etiketini de korur', () => {
  const out = migrate({
    version: 1,
    equipment: { helmet: { slot: 'helmet', tier: 4, level: 40, set: 'oracle', stats: { hp: 100 } } },
  });
  assert.equal(out.equipment.helmet.set, 'oracle');
  assert.deepEqual(activeSetBonuses(out.equipment).stats, {}, 'tek parça bonus vermemeli');
});
