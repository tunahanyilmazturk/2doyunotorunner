// Yükseltme danışmanı sözleşmesi: kazanç oranı, verim ve oto-alım profilleri.
// Bu modül panelin "ne alsam?" sorusunu ve `UpgradeSystem` seçimlerini besler;
// bu yüzden saf (DOM'suz) ve tek evde (UpgradeAdvisor) tutulur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLAYER_BASE, Balance } from '../src/config/balance.js';
import { UPGRADES, UPGRADE_MAP, upgradeValue } from '../src/data/upgrades.js';
import {
  PROFILES,
  PROFILES_MAP,
  efficiency,
  pickNext,
  rankRows,
  rowMetrics,
  statGain,
} from '../src/systems/UpgradeAdvisor.js';

const raw = (over = {}) => ({ ...PLAYER_BASE, ...over });

test('düz statlarda kazanç mevcut değere oranlanır', () => {
  assert.equal(statGain('atk', 10, raw({ atk: 100 }), 1), 0.1);
  assert.equal(statGain('regen', 0.5, raw({ regen: 2 }), 1), 0.25);
  // Taban 0 ise (ör. hiç zırh yükseltmesi alınmamış) sıfıra bölme yok
  assert.ok(Number.isFinite(statGain('regen', 0.5, raw({ regen: 0 }), 1)));
});

test('yüzde statların iki formu ayrı hesaplanır', () => {
  // 1 + v/100 formu: goldPct 100 → 110 çarpanı 2.0 → 2.1
  assert.equal(statGain('goldPct', 10, raw({ goldPct: 100 }), 1), 10 / 200);
  // v/100 formu: critDmg 150 → 160 çarpanı 1.5 → 1.6
  assert.equal(statGain('critDmg', 10, raw({ critDmg: 150 }), 1), 10 / 150);
  assert.equal(statGain('aspd', 4, raw({ aspd: 100 }), 1), 4 / 200);
});

test('zırh kazancı efektif can üzerinden ölçülür ve doyar', () => {
  const stage = 40;
  const g = statGain('armor', 20, raw({ armor: 0 }), stage);
  const r2 = Balance.armorReduction(20, stage);
  assert.ok(Math.abs(g - (1 / (1 - r2) - 1)) < 1e-12, 'EHP modeli');
  const early = statGain('armor', 20, raw({ armor: 100 }), stage);
  const late = statGain('armor', 20, raw({ armor: 4000 }), stage);
  assert.ok(late < early, 'doyma: aynı +20 zırh ileride daha az kazandırır');
});

test('üst sınıra ulaşmış statlarda kazanç sıfırdır', () => {
  assert.equal(statGain('crit', 1, raw({ crit: 100 }), 1), 0);
  assert.equal(statGain('dodge', 0.5, raw({ dodge: Balance.maxDodge }), 1), 0);
  assert.equal(statGain('lifesteal', 0.5, raw({ lifesteal: Balance.maxLifesteal }), 1), 0);
  assert.equal(statGain('atk', 0, raw(), 1), 0);
});

test('satır ölçümü kilometre taşı sıçramasını görür', () => {
  const up = UPGRADE_MAP.power;
  const plain = rowMetrics(up, 0, 1, raw(), 1);
  const crossing = rowMetrics(up, 24, 1, raw(), 1);
  assert.equal(plain.delta, upgradeValue(up, 1) - upgradeValue(up, 0));
  assert.ok(crossing.delta > plain.delta * 2, '25. seviyede etki ×2 sıçramalı');
  assert.ok(crossing.gain > plain.gain);
});

test('verim kazanç/maliyettir, sıralama 0..100 ölçeklenir', () => {
  assert.equal(efficiency({ gain: 0.1, cost: 1000 }), 0.0001);
  assert.equal(efficiency({ gain: 0.1, cost: 0 }), 0);
  const rows = [
    { gain: 0.1, cost: 100 },
    { gain: 0.1, cost: 200 },
    { gain: 0.05, cost: 100 },
  ];
  const ranks = rankRows(rows);
  assert.equal(Math.max(...ranks), 100, 'en iyi satır 100');
  assert.equal(ranks[1], ranks[2], 'aynı verim aynı puan');
  assert.ok(ranks[0] > ranks[1], 'ucuz olan daha verimli');
  for (const r of ranks) assert.ok(r > 0 && r <= 100, `${r} aralık dışı`);
});

test('pickNext profil sırasına uyar, bilinmeyen profilde en ucuza döner', () => {
  const mk = (id, cost, gain) => ({ up: UPGRADE_MAP[id], level: 0, cost, gain, eff: gain / cost });
  const rows = [mk('power', 500, 0.01), mk('vitality', 100, 0.001), mk('greed', 200, 0.05)];

  assert.equal(pickNext(rows, 'cheapest').up.id, 'vitality');
  assert.equal(pickNext(rows, 'value').up.id, 'greed');
  assert.equal(pickNext(rows, 'damage').up.id, 'power');
  assert.equal(pickNext(rows, 'survive').up.id, 'vitality');
  assert.equal(pickNext(rows, 'gold').up.id, 'greed');
  assert.equal(pickNext(rows, 'bilinmeyen').up.id, 'vitality');
  assert.equal(pickNext(rows, undefined).up.id, 'vitality');
  assert.equal(pickNext([], 'value'), null);
});

test('profil kimlikleri benzersiz, sıralar gerçek yükseltmelere işaret eder', () => {
  const ids = new Set(PROFILES.map((p) => p.id));
  assert.equal(ids.size, PROFILES.length, 'yinelenen profil kimliği');
  assert.ok(ids.has('cheapest') && ids.has('value'), 'varsayılan ve verim profili olmalı');
  for (const p of PROFILES) {
    assert.ok(p.name && p.icon, `${p.id}: ad/simge eksik`);
    assert.equal(PROFILES_MAP[p.id], p, `${p.id}: haritada eşleşmiyor`);
    for (const id of p.order) assert.ok(UPGRADE_MAP[id], `${p.id}: bilinmeyen yükseltme ${id}`);
  }
  // Her yükseltme en az bir profilin sırasında ya da geri kalanlarda yer bulur
  const listed = new Set(PROFILES.flatMap((p) => p.order));
  assert.ok(listed.size >= UPGRADES.length - 4, 'çoğu yükseltme profillerde anılmalı');
});
