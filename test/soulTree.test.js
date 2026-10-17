import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_SLOTS,
  BRANCHES,
  TREE_MAP,
  TREE_NODES,
  nodeCost,
  previousInBranch,
} from '../src/data/soulTree.js';
import { SLOT_ORDER } from '../src/data/items.js';
import { SoulTreeSystem } from '../src/systems/SoulTreeSystem.js';

const makeGame = (state = {}) => {
  const full = { souls: 0, tree: {}, ...state };
  return { state: full, bus: { emit: () => {} } };
};

test('düğüm kimlikleri benzersiz ve her dal 1..n kesintisiz', () => {
  const ids = new Set(TREE_NODES.map((n) => n.id));
  assert.equal(ids.size, TREE_NODES.length, 'yinelenen düğüm kimliği');
  const branchIds = new Set(BRANCHES.map((b) => b.id));
  for (const n of TREE_NODES) {
    assert.ok(branchIds.has(n.branch), `${n.id}: bilinmeyen dal ${n.branch}`);
  }
  for (const branch of BRANCHES) {
    const tiers = TREE_NODES.filter((n) => n.branch === branch.id).map((n) => n.tier).sort((a, b) => a - b);
    assert.ok(tiers.length > 0, `${branch.id}: boş dal`);
    tiers.forEach((tier, i) => {
      assert.equal(tier, i + 1, `${branch.id}: kademe ${tier} kesintili (erişilemez düğüm)`);
    });
  }
});

test('requires var olan düğümlere işaret eder', () => {
  for (const n of TREE_NODES) {
    for (const req of n.requires) {
      assert.ok(TREE_MAP[req], `${n.id}: bilinmeyen ön koşul ${req}`);
      assert.notEqual(req, n.id, `${n.id}: kendine ön koşul`);
    }
  }
});

test('yuva ve yetenek etkileri gerçek hedeflere işaret eder', () => {
  for (const n of TREE_NODES) {
    if (n.effect.type === 'slot') assert.ok(SLOT_ORDER.includes(n.effect.slot), `${n.id}: bilinmeyen yuva`);
    if (n.effect.type === 'stat') assert.ok(typeof n.effect.stat === 'string' && n.effect.per > 0);
    if (n.effect.type === 'perk') assert.ok(typeof n.effect.key === 'string' && n.effect.per > 0);
    assert.ok(n.maxLevel >= 1, `${n.id}: maxLevel >= 1 olmalı`);
    assert.ok(n.cost > 0, `${n.id}: maliyet pozitif olmalı`);
  }
});

test('BASE_SLOTS gerçek yuvalardan oluşur', () => {
  const unique = new Set(BASE_SLOTS);
  assert.equal(unique.size, BASE_SLOTS.length, 'yinelenen yuva');
  for (const slot of BASE_SLOTS) assert.ok(SLOT_ORDER.includes(slot));
});

test('previousInBranch ilk kademede null döner', () => {
  const first = TREE_NODES.find((n) => n.tier === 1);
  assert.equal(previousInBranch(first), null);
  const second = TREE_NODES.find((n) => n.tier === 2);
  assert.equal(previousInBranch(second)?.tier, 1);
  assert.equal(previousInBranch(second)?.branch, second.branch);
});

test('nodeCost seviyeyle azalmaz ve uzun vadede artar', () => {
  for (const n of TREE_NODES) {
    let prev = -1;
    for (let level = 0; level <= 30; level++) {
      const c = nodeCost(n, level);
      // Math.ceil nedeniyle ucuz düğümlerde küçük düz aralıklar olabilir,
      // bu yüzden artış değil azalmama aranır.
      assert.ok(c >= prev, `${n.id}: seviye ${level} maliyeti düştü`);
      prev = c;
    }
    assert.ok(nodeCost(n, 30) > nodeCost(n, 0), `${n.id}: uzun vadede artmalı`);
  }
});

test('ön koşullar sağlanmadan düğüm alınamaz', () => {
  const system = new SoulTreeSystem(makeGame({ souls: 1000 }));
  const last = TREE_NODES.find((n) => n.tier === 5);
  assert.ok(system.missingRequirements(last).length > 0, 'son kademe açık olmamalı');
  assert.equal(system.canBuy(last), false);
  assert.equal(system.buy(last.id), false);
  assert.equal(system.level(last.id), 0);
});

test('ilk kademe satın alınınca Ruh düşer ve sonraki açılır', () => {
  const game = makeGame({ souls: 1000, tree: {} });
  const system = new SoulTreeSystem(game);
  const first = TREE_NODES.find((n) => n.tier === 1);
  const next = TREE_NODES.find((n) => n.branch === first.branch && n.tier === 2);
  const cost = nodeCost(first, 0);

  assert.equal(system.canBuy(first), true);
  assert.equal(system.buy(first.id), true);
  assert.equal(game.state.souls, 1000 - cost);
  assert.equal(system.level(first.id), 1);
  assert.deepEqual(system.missingRequirements(next), [], 'sonraki kademe açılmalı');
});

test('Ruh yetmezse satın alma başarısız olur', () => {
  const game = makeGame({ souls: 0 });
  const system = new SoulTreeSystem(game);
  const first = TREE_NODES.find((n) => n.tier === 1);
  assert.equal(system.canBuy(first), false);
  assert.equal(system.buy(first.id), false);
  assert.equal(game.state.souls, 0);
});

test('maxLevel üzerine çıkılamaz', () => {
  const n = TREE_NODES.find((node) => node.tier === 1);
  const game = makeGame({ souls: 1e9 });
  const system = new SoulTreeSystem(game);
  for (let i = 0; i < n.maxLevel; i++) {
    assert.equal(system.buy(n.id), true, `${i + 1}. seviye alınamadı`);
  }
  assert.equal(system.isMaxed(n), true);
  assert.equal(system.buy(n.id), false, 'maxLevel aşılmamalı');
  assert.equal(system.level(n.id), n.maxLevel);
});

test('isSlotUnlocked taban yuvaları ve ağaçtan açılanı ayırt eder', () => {
  const sys = new SoulTreeSystem(makeGame());
  for (const slot of BASE_SLOTS) assert.equal(sys.isSlotUnlocked(slot), true);
  const locked = SLOT_ORDER.find((s) => !BASE_SLOTS.includes(s));
  assert.equal(sys.isSlotUnlocked(locked), false, `${locked} başlangıçta kapalı olmalı`);
  assert.ok(!sys.unlockedSlots().includes(locked));
});
