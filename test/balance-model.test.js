import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Balance } from '../src/config/balance.js';
import { Monster } from '../src/entities/Monster.js';
import { MONSTERS } from '../src/data/monsters.js';
import { runStages } from '../tools/balance-model.mjs';

test('kabus çevrimi tüm yaratık katsayılarında aynı sınırda uygulanır', () => {
  assert.equal(Balance.cycleOf(1), 0);
  assert.equal(Balance.cycleOf(50), 0);
  assert.equal(Balance.cycleOf(51), 1);
  assert.equal(Balance.cycleOf(101), 2);
  assert.equal(Balance.cycleHpMultiplier(51), 6);
  assert.equal(Balance.cycleAtkMultiplier(51), 3.5);
  assert.equal(Balance.cycleGoldMultiplier(51), 3);
});

test('gerçek canavar ve denge modeli çevrim HP çarpanını aynı uygular', () => {
  const def = MONSTERS.slime;
  const monster = new Monster(def, 51);
  const stage50 = runStages(50, 51);
  const row50 = stage50.find((row) => row.stage === 50);
  const row51 = stage50.find((row) => row.stage === 51);

  assert.equal(monster.maxHp, Balance.monsterHp(def.hp, 51) * Balance.cycleHpMultiplier(51));
  assert.ok(row51.monsterHp > row50.monsterHp * 5, '51. bölge yeni çevrimin can artışını içermeli');
});
