// Sınıf imza yetenekleri: saf çarpan fonksiyonları ve veri bütünlüğü.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ABILITY_MAP, CLASSES } from '../src/data/classes.js';
import { SKILLS } from '../src/data/skills.js';
import { EventBus } from '../src/core/EventBus.js';
import { createDefaultState } from '../src/core/GameState.js';
import { ClassSystem } from '../src/systems/ClassSystem.js';
import { SkillSystem } from '../src/systems/SkillSystem.js';
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

// --- Sınıf yetenekleri (G): sınıfa göre değişir, yalnızca aktif sınıfın yeteneği kullanılır ---
function makeGame() {
  const bus = new EventBus();
  const state = createDefaultState();
  const game = {
    bus,
    state,
    tree: { perk: () => 0, isSkillUnlocked: () => false },
    player: { dead: false, hp: 10, maxHp: 10, attackAnim: 0, heal() {} },
    combat: { engaged: null, dealDamage() {} },
    economy: { spend: () => true },
    stats: { get: () => ({ atk: 10, critChance: 0, critMult: 2 }) },
  };
  game.classes = new ClassSystem(game);
  game.skills = new SkillSystem(game);
  return game;
}

test('her sınıf yeteneği benzersiz ve öğrenilebilir yetenek kimliklerinden ayrı', () => {
  const ids = Object.keys(ABILITY_MAP);
  assert.equal(ids.length, CLASSES.length);
  for (const id of ids) assert.ok(!SKILLS.some((s) => s.id === id), `${id} çakışıyor`);
  for (const c of CLASSES) assert.ok(c.ability.name && c.ability.desc && c.ability.icon, `${c.id} yetenek alanları eksik`);
});

test('G yeteneği aktif sınıfa göre değişir; diğer sınıfların yeteneği kullanılamaz', () => {
  const game = makeGame();
  // Savaşçı (varsayılan): Savaş Narası buff'ı
  assert.equal(game.skills.castClassAbility(), true);
  assert.equal(game.skills.buffRemaining('warCry'), 10);
  assert.equal(game.skills.activeModifiers().atkPct, 40);
  // Bekleme dolana kadar tekrar kullanılamaz
  assert.equal(game.skills.castClassAbility(), false);

  // Okçuya geç: Kartal Gözü kullanılır, Savaş Narası artık kimliğe göre çözümlenmez
  game.state.classes.unlocked.archer = true;
  assert.equal(game.classes.switchTo('archer'), true);
  assert.equal(game.skills.resolve('warCry'), null);
  assert.equal(game.skills.cast('warCry'), false);
  assert.equal(game.skills.castClassAbility(), true);
  assert.equal(game.skills.activeModifiers().crit, 25);
});

test('sınıf yeteneği seviye gerektirmez ve süresi dolunca tekrar hazır olur', () => {
  const game = makeGame();
  assert.equal(game.state.skills.warCry, undefined);
  assert.equal(game.skills.castClassAbility(), true);
  game.skills.update(31); // bekleme 30 sn
  assert.equal(game.skills.cooldowns.warCry, 0);
  assert.equal(game.skills.castClassAbility(), true);
});
