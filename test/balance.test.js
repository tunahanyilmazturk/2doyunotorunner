import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Balance, PLAYER_BASE } from '../src/config/balance.js';
import { BOSS_TIME_LIMIT } from '../src/config/constants.js';
import { getCycle } from '../src/data/biomes.js';

test('canavar eğrileri bölgeyle artar ve taban değerden başlar', () => {
  for (const [name, fn, base] of [
    ['hp', Balance.monsterHp, 20],
    ['atk', Balance.monsterAtk, 5],
    ['gold', Balance.monsterGold, 3],
  ]) {
    assert.equal(fn(base, 1), base, `${name}: 1. bölge taban olmalı`);
    for (let stage = 1; stage < 60; stage++) {
      assert.ok(fn(base, stage + 1) > fn(base, stage), `${name}: ${stage} artmalı`);
    }
  }
});

test('zırh azaltma 0..0.6 arasında ve zırhla artar', () => {
  for (const stage of [1, 10, 50, 200]) {
    assert.equal(Balance.armorReduction(0, stage), 0);
    let prev = -1;
    for (let armor = 0; armor <= 5000; armor += 250) {
      const r = Balance.armorReduction(armor, stage);
      assert.ok(r >= 0 && r <= 0.6, 'azaltma sınır dışı');
      assert.ok(r >= prev, 'zırh arttıkça azaltma düşmemeli');
      prev = r;
    }
  }
  // Sağlamlık sınırı: çok yüksek zırh tavanı geçemez
  assert.equal(Balance.armorReduction(1e12, 1), 0.6);
});

test('zırh aynı miktarda kalırsa bölgeyle etkisi azalır', () => {
  const armor = 500;
  assert.ok(Balance.armorReduction(armor, 60) < Balance.armorReduction(armor, 1));
});

test('kabus döngüsü sınırları ve tek kaynak', () => {
  assert.equal(Balance.cycleOf(1), 0);
  assert.equal(Balance.cycleOf(50), 0);
  assert.equal(Balance.cycleOf(51), 1);
  assert.equal(Balance.cycleOf(100), 1);
  assert.equal(Balance.cycleOf(101), 2);
  // biomes.getCycle ile ayrışmamalı (tek kaynak: balance.js)
  for (let stage = 1; stage <= 300; stage++) {
    assert.equal(getCycle(stage), Balance.cycleOf(stage), `bölge ${stage}`);
  }
  assert.equal(Balance.cycleLength, 50);
});

test('prestigeSouls: 20. bölgeden önce Ruh yok, sonra artan', () => {
  assert.equal(Balance.prestigeSouls(1), 0);
  assert.equal(Balance.prestigeSouls(19), 0);
  assert.equal(Balance.prestigeSouls(20), 16);
  let prev = 0;
  for (let stage = 20; stage <= 200; stage++) {
    const souls = Balance.prestigeSouls(stage);
    assert.ok(Number.isFinite(souls) && souls >= prev, `${stage}. bölgede azalmamalı`);
    prev = souls;
  }
});

test('üst sınırlar tanımlı ve makul', () => {
  assert.ok(Balance.maxAttackSpeed > PLAYER_BASE.attackSpeed);
  assert.ok(Balance.maxLifesteal > 0 && Balance.maxLifesteal <= 100);
  assert.ok(Balance.maxDodge > 0 && Balance.maxDodge <= 100);
  assert.ok(Balance.dropChance > 0 && Balance.dropChance < 1);
  assert.ok(BOSS_TIME_LIMIT > 0);
  // Elit şansı asla %100'e yaklaşmamalı
  for (let stage = 1; stage <= 1000; stage += 37) {
    assert.ok(Balance.eliteChance(stage) <= 0.2, 'elit şansı tavanı aştı');
  }
});

test('eşya değeri ve güçlendirme maliyeti eşya seviyesiyle artar', () => {
  for (let level = 1; level < 60; level++) {
    assert.ok(Balance.itemValue(level + 1, 1) > Balance.itemValue(level, 1));
  }
  const item = { value: 100, enhance: 0 };
  const c0 = Balance.enhanceCost(item);
  const c3 = Balance.enhanceCost({ value: 100, enhance: 3 });
  assert.ok(Number.isFinite(c0) && c0 > 0);
  assert.ok(c3 > c0, 'güçlendirme seviyesi arttıkça maliyet artmalı');
});

test('maxEnhance nadirliğe göre artar', () => {
  const caps = [0, 1, 2, 3, 4, 5].map((tier) => Balance.maxEnhance(tier));
  for (let i = 1; i < caps.length; i++) assert.ok(caps[i] > caps[i - 1]);
});
