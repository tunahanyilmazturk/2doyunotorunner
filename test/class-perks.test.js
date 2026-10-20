// Sınıf imza yetenekleri: saf çarpan fonksiyonları ve veri bütünlüğü.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLASSES } from '../src/data/classes.js';
import { blessingHeal, burstMultiplier, executeMultiplier, incomingMultiplier } from '../src/systems/classPerks.js';

test('her sınıfın benzersiz bir imza yeteneği var', () => {
  const ids = CLASSES.map((c) => c.signature?.id);
  assert.ok(ids.every(Boolean), 'her sınıfın signature.id alanı olmalı');
  assert.equal(new Set(ids).size, CLASSES.length);
  for (const c of CLASSES) assert.ok(c.signature.name && c.signature.desc, `${c.id} adı/açıklaması eksik`);
});

test('Siper: yalnızca şans tutunca hasarı yarıya indirir', () => {
  const sig = CLASSES.find((c) => c.id === 'warrior').signature;
  assert.equal(incomingMultiplier(sig, true), sig.factor);
  assert.equal(incomingMultiplier(sig, false), 1);
  assert.equal(incomingMultiplier(undefined, true), 1);
});

test('Delici Ok ve Büyü Dalgası her n. vuruşta çarpan uygular', () => {
  const archer = CLASSES.find((c) => c.id === 'archer').signature;
  const mage = CLASSES.find((c) => c.id === 'mage').signature;
  assert.equal(burstMultiplier(archer, 4), 1);
  assert.equal(burstMultiplier(archer, 5), 2);
  assert.equal(burstMultiplier(archer, 10), 2);
  assert.equal(burstMultiplier(mage, 3), 1);
  assert.equal(burstMultiplier(mage, 4), 1.8);
  assert.equal(burstMultiplier(undefined, 1), 1);
});

test('Kurbanı Kovala yalnızca eşik altındaki canavara çarpan verir', () => {
  const sig = CLASSES.find((c) => c.id === 'assassin').signature;
  assert.equal(executeMultiplier(sig, 0.3), sig.mult);
  assert.equal(executeMultiplier(sig, 0.31), 1);
  assert.equal(executeMultiplier(sig, 1), 1);
});

test('Kutsama maks cana oranlı iyileşme verir', () => {
  const sig = CLASSES.find((c) => c.id === 'healer').signature;
  assert.equal(blessingHeal(sig, 1000), 15);
  assert.equal(blessingHeal(undefined, 1000), 0);
});
