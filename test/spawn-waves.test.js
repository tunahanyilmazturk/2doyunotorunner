import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/core/EventBus.js';
import { Events } from '../src/core/events.js';
import { SpawnSystem, waveSizeForRoll } from '../src/systems/SpawnSystem.js';

function gameForSpawn({ stage = 1, kills = 0, autoAdvance = false } = {}) {
  const events = [];
  const bus = new EventBus();
  bus.on(Events.MONSTER_SPAWNED, (payload) => events.push(payload));
  bus.on(Events.BOSS_SPAWNED, (payload) => events.push({ ...payload, bossEvent: true }));
  return {
    bus,
    events,
    state: { stage, kills, autoAdvance, stats: { totalKills: 0, monstersKilled: [], elitesKilled: 0, traitsKilled: [], bossKills: 0, fastBossKills: 0 } },
    world: { viewWidth: 960, speedScale: 1, scrollSpeed: 0 },
    player: { dead: false },
    tower: { active: false },
    tree: { perk: () => 0 },
    combat: { gapTo: () => 0 },
  };
}

test('dalga boyutu çoğunlukla tek, bazen iki, nadiren üç düşman olur', () => {
  assert.equal(waveSizeForRoll(0), 3);
  assert.equal(waveSizeForRoll(0.059), 3);
  assert.equal(waveSizeForRoll(0.06), 2);
  assert.equal(waveSizeForRoll(0.339), 2);
  assert.equal(waveSizeForRoll(0.34), 1);
  assert.equal(waveSizeForRoll(0.99), 1);
});

test('normal düşman dalgası birden fazla canavarı oluşturur ve sırayı korur', () => {
  const game = gameForSpawn();
  const spawn = new SpawnSystem(game, { random: () => 0.2 });
  spawn.spawnNext();

  assert.equal(spawn.monsters.length, 2);
  assert.equal(spawn.current, spawn.monsters[0]);
  assert.equal(spawn.monsters[1].x - spawn.monsters[0].x, 110);
  assert.deepEqual(game.events.map(({ waveIndex, waveSize }) => [waveIndex, waveSize]), [[0, 2], [1, 2]]);
});

test('boss dalgaları tek boss ile sınırlı kalır', () => {
  const game = gameForSpawn({ stage: 5, kills: 10, autoAdvance: true });
  const spawn = new SpawnSystem(game, { random: () => 0 });
  spawn.spawnNext();

  assert.equal(spawn.monsters.length, 1);
  assert.equal(spawn.current.isBoss, true);
});

test('ölü düşman temizlenir ve sonraki dalga doğar', () => {
  const game = gameForSpawn();
  const spawn = new SpawnSystem(game, { random: () => 0.99 });
  spawn.spawnNext();
  const corpse = spawn.current;

  corpse.takeDamage(corpse.hp);
  game.bus.emit(Events.MONSTER_KILLED, { monster: corpse });
  for (let i = 0; i < 4; i++) spawn.update(0.2);

  assert.equal(corpse.removable, true, 'ölüm animasyonu süresi tamamlanmalı');
  assert.equal(spawn.monsters.includes(corpse), false, 'ölü düşman listeden çıkarılmalı');
  assert.equal(spawn.monsters.length, 1, 'yeni düşman dalgası başlamalı');
});
