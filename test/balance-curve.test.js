// Denge eğrisi sözleşmesi: oyunun nerede duracağı bilinçli bir karardır ve
// sessizce kaymamalıdır. Bu testler `tools/balance-model.mjs` ile oyunun gerçek
// formüllerini kullanır (ekipmansız oyuncu = alt sınır).
//
// Modelin ekipman ve yetenekleri içermediği bilindiğinden ilerleme garantisi
// vermez; formül eğrilerini ve görünen engelleri izlemek için kullanılır.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_TIME_LIMIT } from '../src/config/constants.js';
import { Balance } from '../src/config/balance.js';
import { runStages, walls } from '../tools/balance-model.mjs';

const rows = runStages(1, 120);
const w = walls(rows);
const at = (stage) => rows.find((r) => r.stage === stage);

test('denge raporu boss süresi ve ağır vuruş kaynaklı hasarı ayrı ölçer', () => {
  assert.ok(w.cannotSurvive !== null, 'can duvarı bulunmalı');
  assert.ok(w.bossTimeout !== null, 'boss sayacı duvarı bulunmalı');
  assert.ok(w.bossDeath !== null, 'boss hasarı duvarı bulunmalı');
  assert.equal(w.bossBlock, Math.min(w.bossTimeout, w.bossDeath));
  const boss = at(w.bossDeath);
  assert.ok(Number.isFinite(boss.bossSurvive), 'boss sırasında tahmini hayatta kalma süresi olmalı');
});

test('duvarlar birbirine yakın: tek bir "burada duruyorum" hissi', () => {
  assert.ok(Math.abs(w.slowKill - w.cannotSurvive) <= 6, `yavaş kesim ${w.slowKill}, can duvarı ${w.cannotSurvive}`);
  assert.ok(w.slowKill <= 35, `ilk yavaşlama çok geç: ${w.slowKill}`);
});

test('canavar gücü oyuncuyu geçer: yeniden doğuş gerekli kalır', () => {
  assert.ok(at(100).ttk > at(50).ttk, 'geç bölgelerde kesim yavaşlamalı');
  assert.ok(at(60).survive < at(20).survive, 'geç bölgelerde daha çabuk ölünmeli');
  assert.ok(at(120).ttk > 60, 'ileri bölgeler gerçek bir duvar olmalı');
});

test('boss, normal canavardan belirgin şekilde daha zorlu', () => {
  assert.ok(Balance.bossHpMult >= 4, 'boss can çarpanı anlamlı olmalı');
  const r = at(20);
  assert.ok(r.bossTtk > r.ttk * 2, 'boss normal canavardan belirgin uzun sürmeli');
});

test('boss süresi bölgeyle uzar ve temel sürenin altına inmez', () => {
  assert.ok(Balance.bossTimeLimit(1) >= BOSS_TIME_LIMIT);
  for (let stage = 1; stage < 100; stage += 5) {
    assert.ok(Balance.bossTimeLimit(stage + 5) >= Balance.bossTimeLimit(stage), `bölge ${stage}: süre azaldı`);
  }
  assert.ok(Balance.bossTimeLimit(60) > Balance.bossTimeLimit(10), 'ileri bölgelerde daha çok süre olmalı');
});
