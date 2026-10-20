// Rün, yoldaş, kule ve günlük görev sistemleri: sahte oyun üzerinde gerçek sistemler.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/core/EventBus.js';
import { Events } from '../src/core/events.js';
import { createDefaultState } from '../src/core/GameState.js';
import { sanitizeSave } from '../src/core/saveIntegrity.js';
import { COMPANIONS, EGG_HATCH_KILLS, xpToNext } from '../src/data/companions.js';
import { DAILY_QUEST_COUNT, LOGIN_REWARDS, MONTHLY_QUEST_COUNT, WEEKLY_QUEST_COUNT } from '../src/data/quests.js';
import { RUNES_TO_COMBINE, combineCost } from '../src/data/runes.js';
import { TOWER_DAILY_ATTEMPTS, TOWER_UNLOCK_STAGE } from '../src/data/tower.js';
import { CompanionSystem } from '../src/systems/CompanionSystem.js';
import { QuestSystem } from '../src/systems/QuestSystem.js';
import { RuneSystem } from '../src/systems/RuneSystem.js';
import { TowerSystem } from '../src/systems/TowerSystem.js';
import { createItem } from '../src/systems/ItemFactory.js';
import { ClassSystem } from '../src/systems/ClassSystem.js';
import { InventorySystem } from '../src/systems/InventorySystem.js';
import { BAG_EXPANSION_SLOTS, MAX_BAG_EXPANSIONS } from '../src/config/constants.js';
import { ELIXIRS } from '../src/data/shop.js';
import { EquipmentSystem } from '../src/systems/EquipmentSystem.js';
import { ARMOR_SLOTS, CLASSES, CLASS_MAP } from '../src/data/classes.js';
import { WEAPON_KINDS } from '../src/data/items.js';

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
    tree: { perk: () => 0, isSlotUnlocked: () => true },
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
  game.classes = new ClassSystem(game);
  game.equipment = new EquipmentSystem(game);
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

test('sınıf: yalnızca kendi silah ve zırh türünü kuşanır', () => {
  const game = makeGame();
  const s = game.state;
  s.gold = 0;
  const bow = createItem(s, { level: 20, slot: 'weapon', kind: 'bow' });
  const sword = createItem(s, { level: 20, slot: 'weapon', kind: 'sword' });
  s.inventory[0] = bow;
  s.inventory[1] = sword;
  assert.equal(game.equipment.equipFromInventory(0), false, 'savaşçı yay kuşanamaz');
  assert.equal(game.equipment.equipFromInventory(1), true, 'savaşçı kılıç kuşanabilir');

  game.state.seals = 100;
  game.classes.unlock('archer');
  assert.equal(game.classes.switchTo('archer'), true);
  assert.equal(game.equipment.equipFromInventory(0), true, 'okçu yay kuşanabilir');
});

test('sınıf: zırh sınıfı yalnızca zırh slotlarında uygulanır', () => {
  const s = makeGame().state;
  for (const slot of ARMOR_SLOTS) assert.ok(createItem(s, { level: 10, slot }).armorClass, `${slot} zırh sınıfı almalı`);
  assert.equal(createItem(s, { level: 10, slot: 'amulet' }).armorClass, undefined, 'kolye herkese açık');
});

test('sınıf: her sınıfın silahları ve zırh sınıfı tanımlı', () => {
  for (const c of CLASSES) {
    for (const k of c.weaponKinds) assert.ok(WEAPON_KINDS[k], `${c.id}: bilinmeyen silah ${k}`);
  }
  assert.equal(new Set(CLASSES.map((c) => c.armorClass)).size, CLASSES.length, 'her sınıfın kendi zırh sınıfı var');
  const kinds = CLASSES.flatMap((c) => c.weaponKinds);
  assert.equal(new Set(kinds).size, kinds.length, 'silah türleri sınıflar arasında paylaşılmıyor');
});

test('sınıf: geçişte ekipman setleri takas edilir ve geri dönünce korunur', () => {
  const game = makeGame();
  const s = game.state;
  const warriorSword = createItem(s, { level: 20, slot: 'weapon', kind: 'sword' });
  s.equipment.weapon = warriorSword;
  game.state.seals = 100;
  game.classes.unlock('mage');
  game.classes.switchTo('mage');
  assert.equal(s.equipment.weapon, null, 'büyücünün ekipmanı boş başlar');

  const staff = createItem(s, { level: 20, slot: 'weapon', kind: 'staff' });
  s.equipment.weapon = staff;
  game.classes.switchTo('warrior');
  assert.equal(s.equipment.weapon, warriorSword, 'savaşçının kılıcı geri gelir');
  game.classes.switchTo('mage');
  assert.equal(s.equipment.weapon, staff, 'büyücünün asası korunur');
});

test('sınıf: açmak Kule Mührü harcar, yetmezse açılmaz; geçiş ücretsizdir', () => {
  const game = makeGame();
  game.state.seals = CLASS_MAP.archer.cost - 1;
  assert.equal(game.classes.unlock('archer'), false);
  game.state.seals = CLASS_MAP.archer.cost;
  assert.equal(game.classes.unlock('archer'), true);
  assert.equal(game.state.seals, 0, 'mühür harcandı');
  assert.equal(game.classes.switchTo('archer'), true);
  assert.equal(game.classes.switchTo('warrior'), true, 'geçiş mühür istemez');
  assert.equal(game.classes.unlock('archer'), false, 'açık sınıf tekrar açılmaz');
});

test('kule: her kat geçişi bir Kule Mührü verir', () => {
  const game = makeGame();
  game.tower.enter();
  game.tower.onFloorCleared(mob({ isBoss: true, towerFloor: 1 }));
  game.tower.onFloorCleared(mob({ isBoss: true, towerFloor: 2 }));
  assert.equal(game.state.seals, 2, 'tekrar geçişler de mühür verir');
});

test('kayıt: sınıflar, mühürler ve saklı ekipman korunur; bozuk sınıf varsayılana döner', () => {
  const game = makeGame();
  game.state.seals = 42;
  game.classes.data.unlocked.archer = true;
  game.state.classes.sets.archer = { weapon: createItem(game.state, { level: 9, slot: 'weapon', kind: 'bow' }) };
  const out = sanitizeSave(JSON.parse(JSON.stringify(game.state)));
  assert.equal(out.seals, 42);
  assert.equal(out.classes.unlocked.archer, true);
  assert.equal(out.classes.sets.archer.weapon.kind, 'bow');

  const bad = JSON.parse(JSON.stringify(game.state));
  bad.classes = { active: 'dragon', unlocked: { archer: 'yes' }, sets: { warrior: {} } };
  bad.seals = -5;
  const fixed = sanitizeSave(bad);
  assert.equal(fixed.classes.active, 'warrior');
  assert.equal(fixed.classes.unlocked.archer, false, 'geçersiz açılış değeri açık sayılmaz');
  assert.equal(fixed.seals, 0);
});

test('sınıf: her sınıfın geçerli bir karakter görünümü var', () => {
  const kinds = new Set(['none', 'hood', 'hat', 'mask', 'halo']);
  const hex = /^#[0-9a-f]{6}$/i;
  for (const c of CLASSES) {
    assert.ok(c.look, `${c.id}: görünüm tanımlı`);
    assert.ok(kinds.has(c.look.headgear), `${c.id}: bilinmeyen kafa aksesuarı ${c.look.headgear}`);
    for (const key of ['tunic', 'hair', 'trim']) assert.match(c.look[key], hex, `${c.id}.${key} geçerli renk olmalı`);
  }
  const tunics = CLASSES.map((c) => c.look.tunic);
  assert.equal(new Set(tunics).size, tunics.length, 'sınıf tunikleri birbirinden ayırt edilebilir');
});

/** Zırh slotu eşyasını Savaşçının (ağır) zırh sınıfına sabitler */
const heavy = (item) => ({ ...item, armorClass: 'heavy' });

test('envanter: daha iyi, set, kilitli ve başka sınıfa ait eşyalar korunur; sıradan olanlar satılır', () => {
  const game = makeGame();
  game.inventory = new InventorySystem(game);
  const s = game.state;
  s.stage = 10;
  s.equipment.helmet = heavy(createItem(s, { level: 30, slot: 'helmet', tier: 2  }));

  const plain = heavy(createItem(s, { level: 5, slot: 'helmet', tier: 0  }));
  const better = heavy(createItem(s, { level: 60, slot: 'helmet', tier: 5  }));
  const locked = heavy(createItem(s, { level: 5, slot: 'helmet', tier: 0  }));
  locked.locked = true;
  const setPiece = heavy(createItem(s, { level: 5, slot: 'helmet', tier: 0  }));
  setPiece.set = 'kizil-nisan';

  assert.equal(game.inventory.isProtected(plain), false, 'sıradan eşya satılabilir');
  assert.equal(game.inventory.isProtected(better), true, '▲ daha iyi eşya korunur');
  assert.equal(game.inventory.isProtected(locked), true, 'kilitli eşya korunur');
  assert.equal(game.inventory.isProtected(setPiece), true, 'set parçası korunur');

  // Başka (açık) bir sınıfa ait silah: aktif savaşçı için korunur, sınıf açık değilse satılır
  const bow = createItem(s, { level: 5, slot: 'weapon', kind: 'bow', tier: 0 });
  assert.equal(game.inventory.isProtected(bow), false, 'kilitli başka sınıf yoksa satılır');
  game.state.seals = 100;
  game.classes.unlock('archer');
  assert.equal(game.inventory.isProtected(bow), true, 'açık okçu eşyası korunur');
});

test('envanter: toplu satış korunanları atlar ve kaç eşyanın korunduğunu bildirir', () => {
  const game = makeGame();
  game.inventory = new InventorySystem(game);
  const s = game.state;
  s.stage = 10;
  s.equipment.helmet = heavy(createItem(s, { level: 30, slot: 'helmet', tier: 2  }));
  s.inventory[0] = heavy(createItem(s, { level: 5, slot: 'helmet', tier: 0  }));
  s.inventory[1] = heavy(createItem(s, { level: 60, slot: 'helmet', tier: 5  }));
  s.inventory[2] = heavy(createItem(s, { level: 5, slot: 'boots', tier: 0  }));
  const gold0 = s.gold;

  // Çizme yuvası boş: boş yuvanın ihtiyacı olan eşya (▲ sayılır) korunur
  const plan = game.inventory.planSellUpTo(0);
  assert.deepEqual(plan.indices, [0], 'yalnızca sıradan kask planlanır');
  assert.equal(plan.kept, 1, 'boş yuvadaki çizme korunur');
  const res = game.inventory.sellAllUpTo(5);
  assert.equal(res.count, 1, 'tek sıradan eşya satılır');
  assert.equal(s.inventory[1].tier, 5, '▲ eşya çantada kalır');
  assert.ok(s.inventory[2], 'boş yuvanın çizmesi çantada kalır');
  assert.ok(s.gold > gold0);
});

test('envanter: çanta genişletme altın harcar, kapasiteyi artırır ve sınırda durur', () => {
  const game = makeGame();
  game.inventory = new InventorySystem(game);
  const s = game.state;
  const base = game.inventory.capacity;
  s.gold = 0;
  assert.equal(game.inventory.expand(), false, 'altın yetmezse genişlemez');
  s.gold = 1e15;
  const cost = game.inventory.expansionCost;
  assert.equal(game.inventory.expand(), true);
  assert.equal(game.inventory.capacity, base + BAG_EXPANSION_SLOTS);
  assert.equal(s.inventory.length, base + BAG_EXPANSION_SLOTS, 'yeni yuvalar envantere eklenir');
  assert.equal(s.gold, 1e15 - cost, 'bedel altından düşer');
  for (let i = 1; i < MAX_BAG_EXPANSIONS; i++) game.inventory.expand();
  assert.equal(game.inventory.expand(), false, 'en fazla MAX_BAG_EXPANSIONS genişletme');
});

test('envanter: sıralama modları seçilen ölçüte göre sıralar', () => {
  const game = makeGame();
  game.inventory = new InventorySystem(game);
  const s = game.state;
  s.inventory[0] = createItem(s, { level: 5, slot: 'amulet', tier: 0 });
  s.inventory[1] = heavy(createItem(s, { level: 50, slot: 'helmet', tier: 4  }));
  s.inventory[2] = heavy(createItem(s, { level: 20, slot: 'boots', tier: 2  }));
  game.inventory.sort('value');
  const values = s.inventory.filter(Boolean).map((i) => i.value);
  assert.deepEqual(values, [...values].sort((a, b) => b - a), 'değere göre azalan');
  game.inventory.sort('tier');
  const tiers = s.inventory.filter(Boolean).map((i) => i.tier);
  assert.deepEqual(tiers, [...tiers].sort((a, b) => b - a), 'nadirliğe göre azalan');
});

test('mağaza: günün indirimi sabittir ve fiyatı %25 düşürür', async () => {
  const { ShopSystem } = await import('../src/systems/ShopSystem.js');
  const game = makeGame();
  game.shop = new ShopSystem(game);
  const a = game.shop.dailyDeal;
  assert.equal(game.shop.dailyDeal.id, a.id, 'aynı gün aynı ürün');
  assert.equal(a.percent, 25);
  const elixir = ELIXIRS.find((e) => e.id === a.id);
  if (a.kind === 'elixir') {
    const base = Math.ceil(game.shop.potionPrice * elixir.priceMult);
    assert.equal(game.shop.elixirPrice(elixir), Math.ceil(base * 0.75));
  }
  assert.ok(game.shop.isDeal(a.kind, a.id));
});

test('mağaza: toplu iksir alımı harcanan altını ve eklenen süreyi doğru hesaplar', async () => {
  const { ShopSystem } = await import('../src/systems/ShopSystem.js');
  const { ElixirSystem } = await import('../src/systems/ElixirSystem.js');
  const game = makeGame();
  game.shop = new ShopSystem(game);
  game.elixirs = new ElixirSystem(game);
  game.state.gold = 1e15;
  const wrath = ELIXIRS.find((e) => e.id === 'wrath');
  const price = game.shop.elixirPrice(wrath);
  const gold0 = game.state.gold;
  assert.equal(game.shop.buyElixirs('wrath', 3), true);
  assert.equal(gold0 - game.state.gold, price * 3);
  assert.equal(game.elixirs.remaining('wrath'), wrath.duration * 3);
});

test('mağaza: özel ürün alımı ödülü verir (yumurta ve rün)', async () => {
  const { ShopSystem } = await import('../src/systems/ShopSystem.js');
  const game = makeGame();
  game.shop = new ShopSystem(game);
  game.state.gold = 1e15;
  const eggs = () => game.state.companions.eggs + (game.state.companions.incubating !== null ? 1 : 0);
  const before = eggs();
  assert.equal(game.shop.buySpecial('egg', 2), true);
  assert.equal(eggs(), before + 2);
  const runes0 = game.runes.totalCount;
  game.shop.buySpecial('runePack', 1);
  assert.equal(game.runes.totalCount, runes0 + 3);
});

test('mağaza: güç kazancı yalnızca kuşanılanla aynı yuvada ve kuşanılan varken hesaplanır', async () => {
  const { ShopSystem } = await import('../src/systems/ShopSystem.js');
  const game = makeGame();
  game.shop = new ShopSystem(game);
  const s = game.state;
  const weak = heavy(createItem(s, { level: 10, slot: 'helmet', tier: 0 }));
  const strong = heavy(createItem(s, { level: 60, slot: 'helmet', tier: 5 }));
  assert.equal(game.shop.ratingGain(strong), null, 'kuşanılan yoksa kazanç yok');
  s.equipment.helmet = weak;
  assert.ok(game.shop.ratingGain(strong) > 0, 'daha güçlü eşya kazanç verir');
  assert.ok(game.shop.ratingGain(weak) <= 0.001, 'aynı eşyada kazanç yok');
});

test('hedefler: hafta değişince haftalık hedefler yenilenir ve üç görev içerir', () => {
  const game = makeGame();
  const q = game.quests;
  q.ensureDay();
  const first = game.state.weekly.week;
  assert.equal(game.state.weekly.quests.length, WEEKLY_QUEST_COUNT);
  game.clock.time += 8 * 24 * 3600e3;
  q.ensureDay();
  assert.notEqual(game.state.weekly.week, first, 'hafta anahtarı değişmeli');
  assert.equal(game.state.weekly.quests.length, WEEKLY_QUEST_COUNT);
});

test('hedefler: yeni olaylar günlük ve haftalık görevleri ilerletir', () => {
  const game = makeGame();
  const q = game.quests;
  q.ensureDay();
  game.state.daily.quests = [
    { id: 'upgrades', target: 5, progress: 0, claimed: false, reward: { type: 'egg', amount: 1 } },
    { id: 'elixirs', target: 2, progress: 0, claimed: false, reward: { type: 'egg', amount: 1 } },
  ];
  game.bus.emit(Events.UPGRADE_BOUGHT, { id: 'power', count: 3 });
  game.bus.emit(Events.ELIXIR_DRUNK, { id: 'wrath' });
  assert.equal(game.state.daily.quests[0].progress, 3, 'yükseltme sayısı kadar ilerler');
  assert.equal(game.state.daily.quests[1].progress, 1, 'iksir içmek ilerletir');
  game.bus.emit(Events.SOCKET_OPENED, { slot: 'weapon' });
  game.bus.emit(Events.RUNE_COMBINED, { typeId: 'ruby', grade: 2 });
  game.bus.emit(Events.COMPANION_LEVELED, { def: COMPANIONS[0], level: 2 });
});

test('hedefler: haftalık bonus yalnızca üç haftalık görev de alınınca verilir ve bir kez alınır', () => {
  const game = makeGame();
  const q = game.quests;
  q.ensureDay();
  game.state.weekly.quests = game.state.weekly.quests.map((x) => ({ ...x, progress: x.target, claimed: false }));
  assert.equal(q.canClaimWeeklyBonus(), false, 'görevler alınmadan bonus yok');
  for (let i = 0; i < WEEKLY_QUEST_COUNT; i++) assert.equal(q.claim(i, 'weekly'), true);
  assert.equal(q.claimWeeklyBonus(), true);
  assert.equal(q.claimWeeklyBonus(), false, 'bonus tekrar alınamaz');
});

test('hedefler: günlük gün anahtarı kayıttan korunur (giriş serisi sıfırlanmaz)', () => {
  const game = makeGame();
  game.quests.ensureDay();
  const day = game.state.daily.day;
  const out = sanitizeSave(JSON.parse(JSON.stringify(game.state)));
  assert.equal(out.daily.day, day, 'geçerli gün anahtarı kayıttan geri gelmeli');
  assert.equal(out.daily.quests.length, DAILY_QUEST_COUNT);
});

test('aylık hedefler: ay değişince yenilenir, üç görev içerir ve bonus bir kez alınır', () => {
  const game = makeGame(new Date(2026, 9, 20, 12).getTime());
  const q = game.quests;
  q.ensureDay();
  const first = game.state.monthly.month;
  assert.equal(first, '2026-10');
  assert.equal(game.state.monthly.quests.length, MONTHLY_QUEST_COUNT);
  game.clock.time = new Date(2026, 10, 3, 12).getTime();
  q.ensureDay();
  assert.equal(game.state.monthly.month, '2026-11', 'ay anahtarı değişmeli');
  game.state.monthly.quests = game.state.monthly.quests.map((x) => ({ ...x, progress: x.target, claimed: false }));
  for (let i = 0; i < MONTHLY_QUEST_COUNT; i++) assert.equal(q.claim(i, 'monthly'), true);
  assert.equal(q.claimMonthlyBonus(), true);
  assert.equal(q.claimMonthlyBonus(), false);
});

test('giriş takvimi: her yeni gün giriş geçmişine eklenir ve kayıtta korunur', () => {
  const game = makeGame(new Date(2026, 9, 20, 12).getTime());
  game.quests.ensureDay();
  game.clock.time = new Date(2026, 9, 21, 12).getTime();
  game.quests.ensureDay();
  assert.deepEqual(game.state.daily.loginDays, ['2026-10-20', '2026-10-21']);
  const out = sanitizeSave(JSON.parse(JSON.stringify(game.state)));
  assert.deepEqual(out.daily.loginDays, ['2026-10-20', '2026-10-21']);
  assert.equal(out.monthly.month, '2026-10');
});

test('elmas: kule ilk geçişi ve ödül verilmesi elmas kazandırır', async () => {
  const { GemSystem } = await import('../src/systems/GemSystem.js');
  const { grantReward } = await import('../src/systems/rewards.js');
  const game = makeGame();
  game.gems = new GemSystem(game);
  game.state.gems = 0;
  game.bus.emit(Events.TOWER_FLOOR_CLEARED, { floor: 1, firstClear: true });
  assert.equal(game.state.gems, 1 + 3, 'ilk geçiş: 1 + 3 elmas');
  game.bus.emit(Events.TOWER_FLOOR_CLEARED, { floor: 1, firstClear: false });
  assert.equal(game.state.gems, 5, 'tekrar geçiş: 1 elmas');
  grantReward(game, { type: 'gem', amount: 2 });
  assert.equal(game.state.gems, 7, 'ödül türü elmas verir');
});

test('elmas: elmasla iksir ve rün paketi alınır; yetmezse alınmaz', async () => {
  const { GemSystem } = await import('../src/systems/GemSystem.js');
  const { ShopSystem } = await import('../src/systems/ShopSystem.js');
  const { ElixirSystem } = await import('../src/systems/ElixirSystem.js');
  const game = makeGame();
  game.gems = new GemSystem(game);
  game.shop = new ShopSystem(game);
  game.elixirs = new ElixirSystem(game);
  game.state.gems = 3;
  assert.equal(game.shop.buyGemItem('gemElixirs'), false, 'iksir sandığı 4 elmas ister');
  game.state.gems = 10;
  assert.equal(game.shop.buyGemItem('gemElixirs'), true);
  assert.equal(game.state.gems, 6, 'bedel elmastan düşer');
  const runes0 = game.runes.totalCount;
  assert.equal(game.shop.buyGemItem('gemRunes'), true);
  assert.equal(game.runes.totalCount, runes0 + 8);
  assert.equal(game.state.gems, 0);
});

test('elmas: sınıf elmasla açılır ve elmas yetmezse açılmaz', () => {
  const game = makeGame();
  game.state.gems = CLASS_MAP.healer.gems - 1;
  assert.equal(game.classes.unlock('healer', 'gems'), false);
  game.state.gems = CLASS_MAP.healer.gems;
  assert.equal(game.classes.unlock('healer', 'gems'), true);
  assert.equal(game.state.gems, 0, 'sınıf bedeli elmastan düşer');
  assert.equal(game.classes.isUnlocked('healer'), true);
});
