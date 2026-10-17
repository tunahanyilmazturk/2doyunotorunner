// Denge eğrisi sözleşmesi: oyunun nerede duracağı bilinçli bir karardır ve
// sessizce kaymamalıdır. Bu testler `tools/balance-model.mjs` ile oyunun gerçek
// formüllerini kullanır (ekipmansız oyuncu = alt sınır).
//
// Kilitlenen kararlar:
//  1. Boss sayacı, "can dayanmıyor" duvarından ÖNCE gelmez. Aksi halde oyuncu
//     öldürülemeyen bir düşman yerine görünmez bir sayaçla durur (eski hata:
//     15. bölgede takılıyordu).
//  2. İlk yeniden doğuş (20. bölge) ekipmansız da erişilebilir olmalı.
//  3. Canavar gücü oyuncudan hızlı büyümeli; yoksa yeniden doğuş anlamsızlaşır.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_TIME_LIMIT } from '../src/config/constants.js';
import { Balance } from '../src/config/balance.js';
import { runStages, walls } from '../tools/balance-model.mjs';

const rows = runStages(1, 120);
const w = walls(rows);
const at = (stage) => rows.find((r) => r.stage === stage);

test('boss sayacı duvarı, can duvarından önce gelmez', () => {
  assert.ok(w.cannotSurvive !== null, 'can duvarı bulunmalı');
  assert.ok(w.bossTimeout !== null, 'boss sayacı duvarı bulunmalı');
  assert.ok(
    w.bossTimeout > w.cannotSurvive,
    `boss sayacı (${w.bossTimeout}) can duvarından (${w.cannotSurvive}) sonra olmalı`
  );
});

test('ilk yeniden doğuş (20. bölge) ekipmansız erişilebilir', () => {
  assert.ok(w.cannotSurvive >= 28, `can duvarı çok erken: ${w.cannotSurvive} (>= 28 bekleniyor)`);
  const r20 = at(20);
  assert.ok(r20.survive > r20.ttk * 1.2, '20. bölgede rahat dayanılmalı');
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
