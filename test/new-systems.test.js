// Rün, yoldaş, kule ve günlük görev sistemleri: sahte oyun üzerinde gerçek sistemler.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/core/EventBus.js';
import { Events } from '../src/core/events.js';
import { createDefaultState } from '../src/core/GameState.js';
import { sanitizeSave } from '../src/core/saveIntegrity.js';
import { COMPANIONS, EGG_HATCH_KILLS, xpToNext } from '../src/data/companions.js';
import { DAILY_QUEST_COUNT, LOGIN_REWARDS } from '../src/data/quests.js';
import { RUNES_TO_COMBINE, combineCost } from '../src/data/runes.js';
import { TOWER_DAILY_ATTEMPTS, TOWER_UNLOCK_STAGE } from '../src/data/tower.js';
import { CompanionSystem } from '../src/systems/CompanionSystem.js';
import { QuestSystem } from '../src/systems/QuestSystem.js';
import { RuneSystem } from '../src/systems/RuneSystem.js';
import { TowerSystem } from '../src/systems/TowerSystem.js';
import { createItem } from '../src/systems/ItemFactory.js';

function makeGame(time = new Date(2026, 9, 20, 12).getTime()) {
  const state = createDefaultState();
  state.stage = 20; // kule açık (bölge kilidi şu anki koşuya bakar)
  const bus = new EventBus();
  const seen = [];
  const clock = { time };
  const game = {
    state,
    bus,
    seen,
    clock,
    tree: { perk: () => 0 },
    spawn: { reset: () => {}, spawnTimer: 0 },
    player: {
      dead: false,
      hp: 50,
      maxHp: 100,
      reset() { this.hp = this.maxHp; },
      heal(n) { this.hp = Math.min(this.maxHp, this.hp + n); },
    },
    stats: { get: () => ({ luck: 0, atk: 10 }) },
    economy: {
      spend: (n) => (state.gold >= n ? ((state.gold -= n), true) : false),
      addGold: (n) => { state.gold += n; },
    },
    shop: { openChest: () => true },
    elixirs: { drink: () => true },
  };
  game.runes = new RuneSystem(game);
  game.companions = new CompanionSystem(game);
  game.tower = new TowerSystem(game);
  game.quests = new QuestSystem(game, () => clock.time);
  for (const name of Object.values(Events)) bus.on(name, (payload) => seen.push({ name, payload }));
  return game;
}

const mob = (extra = {}) => ({ x: 0, centerY: 0, level: 5, isBoss: false, isElite: false, ...extra });

test('rün: birleştirme altın harcar ve bir üst kademe verir', () => {
  const game = makeGame();
  game.runes.add('ruby', 1, RUNES_TO_COMBINE);
  game.state.gold = combineCost(1) - 1;
  assert.equal(game.runes.combine('ruby', 1), false, 'altın yetmezse birleşmez');
  game.state.gold = combineCost(1);
  assert.equal(game.runes.combine('ruby', 1), true);
  assert.equal(game.runes.count('ruby', 1), 0);
  assert.equal(game.runes.count('ruby', 2), 1);
  assert.equal(game.state.gold, 0);
  assert.equal(game.state.stats.maxRuneGrade, 2);
});

test('rün: tak, stat ver, çıkar, satışta iade', () => {
  const game = makeGame();
  const s = game.state;
  const item = createItem(s, { level: 30, slot: 'weapon' });
  item.tier = 4;
  item.sockets = [null];
  s.equipment.weapon = item;
  game.runes.add('ruby', 3, 2);

  assert.equal(game.runes.insert('weapon', 0, 'ruby', 3), true);
  assert.equal(game.runes.insert('weapon', 0, 'ruby', 3), false, 'dolu yuvaya takılmaz');
  assert.ok(game.runes.statBonuses().atkPct > 0);
  assert.equal(game.runes.count('ruby', 3), 1);

  assert.equal(game.runes.remove('weapon', 0), true);
  assert.equal(game.runes.count('ruby', 3), 2);
  assert.deepEqual(game.runes.statBonuses(), {});

  game.runes.insert('weapon', 0, 'ruby', 3);
  assert.equal(game.runes.reclaimAll(), 1);
  assert.equal(item.sockets[0], null);
  assert.equal(game.runes.count('ruby', 3), 2);
});

test('rün: boş yuvalar en yüksek kademeli rünlerle otomatik doldurulur', () => {
  const game = makeGame();
  const s = game.state;
  const item = createItem(s, { level: 30, slot: 'weapon' });
  item.tier = 4;
  item.sockets = [null, { type: 'onyx', grade: 1 }, null];
  s.equipment.weapon = item;
  game.runes.add('ruby', 2, 1);
  game.runes.add('emerald', 5, 1);
  game.runes.add('topaz', 3, 4);

  assert.equal(game.runes.autoSocket(), 2, 'iki boş yuva var, ikisi de dolar');
  assert.equal(item.sockets[0].grade, 5, 'önce en yüksek kademe');
  assert.equal(item.sockets[2].grade, 3, 'sonra bir sonraki');
  assert.equal(item.sockets[1].type, 'onyx', 'dolu yuva değişmez');
  assert.equal(game.runes.autoSocket(), 0, 'boş yuva kalmayınca hiçbir şey yapmaz');
});

test('rün: yuva açma nadirlik sınırına uyar', () => {
  const game = makeGame();
  const s = game.state;
  s.gold = 1e12;
  const item = createItem(s, { level: 30, slot: 'ring' });
  item.tier = 1; // en fazla 1 yuva
  item.sockets = [];
  s.equipment.ring = item;
  assert.equal(game.runes.openSocket('ring'), true);
  assert.equal(game.runes.openSocket('ring'), false);
  assert.equal(item.sockets.length, 1);
});

test('yoldaş: kuluçka öldürmelerle çatlar, ilk yoldaş yanına gelir ve deneyim kazanır', () => {
  const game = makeGame();
  const c = game.companions;
  assert.equal(game.state.companions.eggs, 1, 'yeni oyunda hediye yumurta');
  assert.equal(c.startIncubation(), true);
  for (let i = 0; i < EGG_HATCH_KILLS; i++) c.onKill(mob());
  assert.equal(c.ownedCount, 1);
  assert.ok(c.active, 'ilk yoldaş otomatik yanına alınır');
  assert.equal(game.state.companions.incubating, null);

  const id = c.active.def.id;
  const level = c.owned(id).level;
  c.gainXp(id, xpToNext(level) - c.owned(id).xp);
  assert.equal(c.owned(id).level, level + 1);
  assert.ok(game.seen.some((e) => e.name === Events.COMPANION_LEVELED));
  assert.ok(Object.values(c.statBonuses())[0] > 0);
});

test('yoldaş: aynı yoldaş tekrar çıkarsa deneyime dönüşür', () => {
  const game = makeGame();
  const c = game.companions;
  const def = COMPANIONS[0];
  game.state.companions.owned[def.id] = { level: 1, xp: 0 };
  game.state.companions.incubating = 0;
  const r = c.hatch(() => 0); // en yaygın nadirlik, ilk yoldaş
  assert.equal(r.def.id, def.id);
  assert.equal(r.isNew, false);
  assert.ok(c.owned(def.id).level > 1);
});

test('kule: hak harcar, kat ödülünü yalnızca ilk geçişte verir, ölümde biter', () => {
  const game = makeGame();
  const t = game.tower;
  assert.equal(t.enter(), true);
  assert.equal(game.state.tower.attempts, TOWER_DAILY_ATTEMPTS - 1);
  assert.equal(t.floor, 1);
  const soulsBefore = game.state.souls;
  t.onFloorCleared(mob({ isBoss: true, towerFloor: 1 }));
  assert.equal(game.state.tower.best, 1);
  assert.equal(t.floor, 2);
  assert.ok(game.state.souls > soulsBefore, 'ilk geçiş ruh verir');
  assert.ok(game.runes.totalCount >= 1, 'ilk geçiş rün verir');

  const soulsAfter = game.state.souls;
  t.onFloorCleared(mob({ isBoss: true, towerFloor: 1 }));
  assert.equal(game.state.souls, soulsAfter, 'tekrar geçişte ödül yok');

  t.end('death');
  assert.equal(t.active, false);
  assert.ok(game.seen.some((e) => e.name === Events.TOWER_ENDED && e.payload.reason === 'death'));
});

test('kule: ana koşuda yeterince ilerlemeden açılmaz', () => {
  const game = makeGame();
  game.state.stage = TOWER_UNLOCK_STAGE - 1;
  assert.equal(game.tower.enter(), false);
  assert.equal(game.state.tower.attempts, TOWER_DAILY_ATTEMPTS, 'hak harcanmamalı');
  game.state.stage = TOWER_UNLOCK_STAGE;
  assert.equal(game.tower.enter(), true);
});

test('kule: hak bitince anahtar harcanır, ikisi de yoksa girilemez', () => {
  const game = makeGame();
  game.state.tower.attempts = 0;
  assert.equal(game.tower.canEnter, false);
  game.state.tower.keys = 1;
  assert.equal(game.tower.enter(), true);
  assert.equal(game.state.tower.keys, 0);
});

test('görevler: gün değişince yenilenir, seri devam eder ya da sıfırlanır', () => {
  const game = makeGame();
  const q = game.quests;
  const d = game.state.daily;
  assert.equal(q.ensureDay(), true);
  assert.equal(d.quests.length, DAILY_QUEST_COUNT);
  assert.equal(d.streak, 1);
  assert.equal(q.ensureDay(), false, 'aynı gün tekrar yenilenmez');

  game.state.tower.attempts = 0;
  game.clock.time += 24 * 3600e3;
  q.ensureDay();
  assert.equal(d.streak, 2, 'ertesi gün seri artar');
  assert.equal(game.state.tower.attempts, TOWER_DAILY_ATTEMPTS, 'kule hakları da yenilenir');

  game.clock.time += 3 * 24 * 3600e3;
  q.ensureDay();
  assert.equal(d.streak, 1, 'gün atlanırsa seri baştan');
});

test('görevler: ilerleme, ödül alma ve hepsini bitirme bonusu', () => {
  const game = makeGame();
  const q = game.quests;
  q.ensureDay();
  const d = game.state.daily;
  d.quests = [
    { id: 'kills', target: 2, progress: 0, claimed: false, reward: { type: 'egg', amount: 1 } },
    { id: 'bosses', target: 1, progress: 0, claimed: false, reward: { type: 'towerKey', amount: 1 } },
    { id: 'kills', target: 1, progress: 1, claimed: true, reward: { type: 'egg', amount: 1 } },
  ];
  game.bus.emit(Events.MONSTER_KILLED, { monster: mob() });
  assert.equal(d.quests[0].progress, 1);
  game.bus.emit(Events.MONSTER_KILLED, { monster: mob({ isBoss: true, towerFloor: 3 }) });
  assert.equal(d.quests[1].progress, 0, 'kule bossu bölge bossu sayılmaz');
  game.bus.emit(Events.MONSTER_KILLED, { monster: mob({ isBoss: true }) });
  assert.equal(d.quests[0].progress, 2);
  assert.equal(d.quests[1].progress, 1);

  assert.equal(q.canClaimBonus(), false);
  const keys = game.state.tower.keys;
  assert.equal(q.claim(0), true);
  assert.equal(q.claim(0), false);
  assert.equal(q.claim(1), true);
  assert.equal(game.state.tower.keys, keys + 1);
  assert.equal(game.state.stats.questsDone, 2);
  assert.equal(q.claimBonus(), true);
  assert.equal(q.claimBonus(), false);
});

test('giriş ödülü günde bir kez alınır', () => {
  const game = makeGame();
  game.quests.ensureDay();
  assert.equal(game.quests.loginReward, LOGIN_REWARDS[0]);
  assert.equal(game.quests.claimLogin(), true);
  assert.equal(game.quests.claimLogin(), false);
});

test('her yoldaşın çizim şekli, pasif stat ve nadirliği geçerlidir', async () => {
  const { SHAPES } = await import('../src/render/sprites/monsters/index.js');
  const { STAT_DEFS } = await import('../src/data/stats.js');
  const { COMPANION_RARITIES } = await import('../src/data/companions.js');
  const ids = COMPANIONS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, 'kimlikler benzersiz');
  for (const c of COMPANIONS) {
    assert.ok(SHAPES[c.look.shape], `${c.id}: çizim şekli var`);
    assert.ok(STAT_DEFS[c.passive.stat], `${c.id}: pasif stat tanımlı`);
    assert.ok(COMPANION_RARITIES[c.rarity], `${c.id}: nadirlik var`);
  }
});

test('kayıt doğrulama yeni alanları korur ve bozuk değerleri onarır', () => {
  const game = makeGame();
  const s = game.state;
  game.quests.ensureDay();
  s.runes.ruby[2] = 4;
  s.companions.owned.wolfPup = { level: 7, xp: 3 };
  s.companions.active = 'wolfPup';
  s.tower = { best: 12, attempts: 1, keys: 2 };
  const item = createItem(s, { level: 30, slot: 'weapon' });
  item.tier = 5;
  item.sockets = [{ type: 'ruby', grade: 4 }, null, { type: 'yok', grade: 2 }];
  s.equipment.weapon = item;

  const out = sanitizeSave(JSON.parse(JSON.stringify(s)));
  assert.equal(out.runes.ruby[2], 4);
  assert.deepEqual(out.companions.owned.wolfPup, { level: 7, xp: 3 });
  assert.equal(out.companions.active, 'wolfPup');
  assert.deepEqual(out.tower, { best: 12, attempts: 1, keys: 2 });
  assert.equal(out.daily.quests.length, DAILY_QUEST_COUNT);
  assert.deepEqual(out.equipment.weapon.sockets[0], { type: 'ruby', grade: 4 });
  assert.equal(out.equipment.weapon.sockets[2], null, 'bilinmeyen rün türü atılır');

  const bad = JSON.parse(JSON.stringify(s));
  bad.runes = { ruby: 'x' };
  bad.companions = { owned: { nope: { level: 3 } }, active: 'nope', eggs: -5 };
  bad.tower = { best: -1, attempts: 99, keys: 'a' };
  const fixed = sanitizeSave(bad);
  assert.equal(fixed.runes.ruby.length, 10);
  assert.deepEqual(fixed.companions.owned, {});
  assert.equal(fixed.companions.active, null);
  assert.ok(fixed.companions.eggs >= 0);
  assert.ok(fixed.tower.best >= 0 && fixed.tower.attempts <= TOWER_DAILY_ATTEMPTS && fixed.tower.keys >= 0);
});
