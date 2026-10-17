import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UPGRADES, MILESTONE_EVERY, upgradeCost, upgradeValue, nextMilestone } from '../src/data/upgrades.js';

test('yükseltme kimlikleri benzersiz, değerler pozitif', () => {
  const ids = new Set(UPGRADES.map((u) => u.id));
  assert.equal(ids.size, UPGRADES.length, 'yinelenen yükseltme kimliği');
  for (const up of UPGRADES) {
    assert.ok(up.baseCost > 0, `${up.id}: maliyet pozitif olmalı`);
    assert.ok(up.value(1) > 0, `${up.id}: 1. seviye etkisi pozitif olmalı`);
  }
});

test('etki seviyeyle monotonik artar (taşma olmadan)', () => {
  for (const up of UPGRADES) {
    const top = up.maxLevel ?? 120;
    let prev = upgradeValue(up, 0);
    for (let level = 1; level <= top; level++) {
      const v = upgradeValue(up, level);
      assert.ok(Number.isFinite(v), `${up.id} seviye ${level}: sonlu değil`);
      if (!up.maxLevel) assert.ok(v > prev, `${up.id} seviye ${level}: artmalı`);
      prev = v;
    }
  }
});

test('maliyet seviyeyle artar', () => {
  for (const up of UPGRADES) {
    for (let level = 0; level < 30; level++) {
      assert.ok(upgradeCost(up, level + 1) > upgradeCost(up, level), up.id);
    }
  }
});

test('kilometre taşı her 25 seviyede etkiyi ikiye katlar', () => {
  const up = UPGRADES.find((u) => u.milestone);
  assert.ok(up, 'kilometre taşlı yükseltme bulunmalı');
  for (const level of [0, 10, 24, 30, 49, 55]) {
    const stepped = up.value(level) * Math.pow(2, Math.floor(level / MILESTONE_EVERY));
    assert.equal(upgradeValue(up, level), stepped);
  }
  // Tam sınırda taban değer ikiye katlanır
  const before = upgradeValue(up, MILESTONE_EVERY - 1);
  const atBoundary = upgradeValue(up, MILESTONE_EVERY);
  assert.ok(atBoundary / up.value(MILESTONE_EVERY) === 2);
  assert.ok(atBoundary > before);
});

test('nextMilestone sınırı ve maxLevel yokluğu', () => {
  const up = UPGRADES.find((u) => u.milestone);
  assert.equal(nextMilestone(up, 0), MILESTONE_EVERY);
  assert.equal(nextMilestone(up, MILESTONE_EVERY), 2 * MILESTONE_EVERY);
  const plain = UPGRADES.find((u) => !u.milestone);
  assert.equal(nextMilestone(plain, 10), null);
});
