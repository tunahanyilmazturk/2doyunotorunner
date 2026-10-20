// Yeniden Doğuş sözleşmesi: koşuya ait her şey sıfırlanır, kalıcı ilerleme korunur.
// Bu dosya `PrestigeSystem.resetRun` + envanter/ekipman/yetenek/mağaza temizliğini
// gerçek sistemlerle (asgari bir sahte oyun üzerinde) doğrular.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/core/EventBus.js';
import { Events } from '../src/core/events.js';
import { createDefaultState } from '../src/core/GameState.js';
import { START_POTIONS, SHOP_SIZE } from '../src/config/constants.js';
import { SLOT_ORDER } from '../src/data/items.js';
import { SKILLS } from '../src/data/skills.js';
import { UPGRADES } from '../src/data/upgrades.js';
import { EquipmentSystem } from '../src/systems/EquipmentSystem.js';
import { InventorySystem } from '../src/systems/InventorySystem.js';
import { PrestigeSystem } from '../src/systems/PrestigeSystem.js';
import { RuneSystem } from '../src/systems/RuneSystem.js';
import { TowerSystem } from '../src/systems/TowerSystem.js';
import { ShopSystem } from '../src/systems/ShopSystem.js';
import { SkillSystem } from '../src/systems/SkillSystem.js';
import { UpgradeSystem } from '../src/systems/UpgradeSystem.js';
import { createItem } from '../src/systems/ItemFactory.js';

const UP_ID = UPGRADES[0].id;

/** Prestij ve dokunduğu sistemleri taşıyan en küçük oyun: gerçek EventBus, gerçek sistemler. */
function makeGame(overrides = {}) {
  const state = { ...createDefaultState(), ...overrides };
  const seen = [];
  const bus = new EventBus();
  const game = {
    state,
    seen,
    bus,
    // Ruh Ağacı/kalıcı katman: test başına gerektiği kadar özelleştirilir
    tree: { perk: () => 0, isSkillUnlocked: () => false, isSlotUnlocked: () => true, unlockedSlots: () => [...SLOT_ORDER] },
    spawn: { reset: () => {} },
    player: { reset: () => {} },
    stats: { recalculate: () => ({}) , get: () => ({ luck: 0 }) },
    economy: { spend: () => true },
  };
  game.inventory = new InventorySystem(game);
  game.equipment = new EquipmentSystem(game);
  game.skills = new SkillSystem(game);
  game.upgrades = new UpgradeSystem(game);
  game.shop = new ShopSystem(game);
  game.runes = new RuneSystem(game);
  game.tower = new TowerSystem(game);
  game.prestige = new PrestigeSystem(game);
  for (const name of Object.values(Events)) bus.on(name, (payload) => seen.push({ name, payload }));
  return game;
}

/** Bir koşu boyunca birikmiş her şeyi doldurur. */
function fillRun(game) {
  const s = game.state;
  s.gold = 1_000_000;
  s.upgrades[UP_ID] = 30;
  s.inventory[0] = createItem(s, { level: 40, slot: 'weapon' });
  s.inventory[4] = createItem(s, { level: 40, slot: 'armor' });
  s.equipment.weapon = createItem(s, { level: 40, slot: 'weapon' });
  s.equipment.shield = createItem(s, { level: 40, slot: 'shield' });
  s.potions = 42;
  s.elixirs.wrath = 300;
  s.skills.powerStrike = 7;
  s.shop.items = [{ item: createItem(s, { level: 40, slot: 'ring' }), price: 10, sold: true }];
  s.shop.refreshAt = Date.now() + 60_000;
}

test('yeniden doğuş koşuyu tamamen sıfırlar, kalıcı ilerlemeyi korur', () => {
  const game = makeGame({ runMaxStage: 60, bestStage: 88, souls: 15, soulsEarned: 500 });
  const s = game.state;
  fillRun(game);
  s.tree.atk1 = 2; // Ruh Ağacı düğümü
  s.achievements.bolum20 = 123; // başarım açılma zamanı
  const pending = game.prestige.pendingSouls;

  assert.ok(pending > 0, 'bu bölgede Ruh kazanılmalı');
  assert.equal(game.prestige.canPrestige, true);
  assert.equal(game.prestige.prestige(), true);

  // --- koşu alanları ---
  assert.equal(s.gold, 0, 'altın sıfırlanmalı (Altın Miras yokken)');
  assert.equal(s.upgrades[UP_ID], 0, 'yükseltmeler sıfırlanmalı');
  assert.equal(s.stage, 1);
  assert.equal(s.kills, 0);
  assert.equal(s.runMaxStage, 1);
  assert.ok(
    s.inventory.every((it) => it === null),
    'envanter boşaltılmalı'
  );
  assert.ok(
    SLOT_ORDER.every((slot) => s.equipment[slot] === null),
    'kuşanılan ekipman sıfırlanmalı'
  );
  assert.equal(s.potions, START_POTIONS, 'iksirler başlangıç sayısına dönmeli');
  assert.deepEqual(s.elixirs, {}, 'süreli iksirler silinmeli');
  for (const skill of SKILLS) assert.equal(s.skills[skill.id], 0, `${skill.id} sıfırlanmalı`);
  assert.equal(s.shop.items.length, SHOP_SIZE, 'mağaza vitrini yeniden çekilmeli');
  assert.ok(
    s.shop.items.every((o) => !o.sold && o.item.level === 1),
    'teklifler yeni koşunun bölgesine göre olmalı'
  );

  // --- kalıcı alanlar ---
  assert.equal(s.souls, 15 + pending, 'kazanılan Ruh eklenmeli');
  assert.equal(s.soulsEarned, 500 + pending);
  assert.equal(s.tree.atk1, 2, 'Ruh Ağacı korunmalı');
  assert.equal(s.achievements.bolum20, 123, 'başarımlar korunmalı');
  assert.equal(s.bestStage, 88, 'en iyi bölge korunmalı');
  assert.equal(s.stats.prestiges, 1, 'prestij sayacı artmalı');
});

test('Altın Miras kabiliyeti altının bir kısmını korur', () => {
  const game = makeGame({ runMaxStage: 40 });
  game.tree.perk = (key) => (key === 'goldKeep' ? 25 : 0);
  game.state.gold = 80_000;
  game.prestige.prestige();
  assert.equal(game.state.gold, 20_000, 'altının %25i kalmalı');
});

test('yeniden doğuş arayüz olaylarını yüklü biçimde yayar', () => {
  const game = makeGame({ runMaxStage: 40 });
  const s = game.state;
  s.equipment.weapon = createItem(s, { level: 30, slot: 'weapon' });
  s.equipment.helmet = createItem(s, { level: 30, slot: 'helmet' });
  const eqBefore = [s.equipment.weapon, s.equipment.helmet];
  game.seen.length = 0;

  game.prestige.prestige();

  // EffectsController `{ item }` alanını okur: yüksüz yayın çökertir.
  const eq = game.seen.filter((e) => e.name === Events.EQUIPMENT_CHANGED);
  assert.equal(eq.length, 2, 'her çıkarılan yuva için bir olay');
  for (const e of eq) {
    assert.equal(e.payload.item, null);
    assert.ok(eqBefore.includes(e.payload.previous), 'çıkarılan eşya previous olarak bildirilmeli');
    assert.ok(SLOT_ORDER.includes(e.payload.slot));
  }
  assert.ok(game.seen.some((e) => e.name === Events.INVENTORY_CHANGED), 'envanter olayı yayılmalı');
  assert.ok(game.seen.some((e) => e.name === Events.POTIONS_CHANGED && e.payload === START_POTIONS));
  assert.ok(game.seen.some((e) => e.name === Events.SHOP_REFRESHED), 'mağaza yeni bölgeye göre yenilenmeli');
  assert.ok(game.seen.some((e) => e.name === Events.PRESTIGE && e.payload.gained > 0));
});

test('ağaçtan açılan yetenek ücretsiz 1. seviyesini korur', () => {
  const game = makeGame({ runMaxStage: 40 });
  game.tree.isSkillUnlocked = (id) => id === 'meteor';
  game.state.skills.meteor = 9;
  game.state.skills.powerStrike = 5;

  game.prestige.prestige();

  assert.equal(game.state.skills.meteor, 1, 'ağaç yeteneği kullanılabilir kalmalı');
  assert.equal(game.state.skills.powerStrike, 0, 'normal yetenek sıfırlanmalı');
});

test('oto-alım yeniden doğuştan sonra kısa süre bekler, sonra devam eder', () => {
  const game = makeGame({ runMaxStage: 30 });
  game.state.stats.prestiges = 1; // oto-alım kilidi bu sayaçla açılır
  game.state.settings.autoBuy = true;
  game.state.gold = 1e9;
  const bought = () => Object.values(game.state.upgrades).some((lv) => lv > 0);

  game.bus.emit(Events.PRESTIGE, { gained: 1, total: 1 });
  for (let i = 0; i < 10; i++) game.upgrades.update(0.5); // 5 sn
  assert.equal(bought(), false, 'bekleme süresince yükseltme alınmamalı');

  for (let i = 0; i < 20; i++) game.upgrades.update(0.5); // +10 sn
  assert.equal(bought(), true, 'bekleme bitince oto-alım devam etmeli');
});

test('yeniden doğuşta takılı rünler kaybolmaz, çantaya döner', () => {
  const game = makeGame({ runMaxStage: 40 });
  const s = game.state;
  const item = createItem(s, { level: 40, slot: 'weapon' });
  item.sockets = [{ type: 'ruby', grade: 3 }];
  s.equipment.weapon = item;
  const bagItem = createItem(s, { level: 40, slot: 'ring' });
  bagItem.sockets = [{ type: 'onyx', grade: 1 }];
  s.inventory[0] = bagItem;

  game.prestige.prestige();

  assert.equal(game.runes.count('ruby', 3), 1);
  assert.equal(game.runes.count('onyx', 1), 1);
  assert.equal(s.equipment.weapon, null);
});

test('yeniden doğuş yoldaşları, Boss Kulesi ilerlemesini ve rün çantasını korur', async () => {
  const { CompanionSystem } = await import('../src/systems/CompanionSystem.js');
  const game = makeGame({ runMaxStage: 40, bestStage: 40 });
  game.companions = new CompanionSystem(game);
  const s = game.state;
  s.companions.owned.owl = { level: 9, xp: 4 };
  s.companions.active = 'owl';
  s.companions.eggs = 3;
  s.tower = { best: 14, attempts: 0, keys: 2 };
  game.runes.add('emerald', 7, 2);
  fillRun(game);

  assert.equal(game.prestige.prestige(), true);

  assert.deepEqual(s.companions.owned, { owl: { level: 9, xp: 4 } }, 'yoldaş ve seviyesi kalır');
  assert.equal(s.companions.active, 'owl');
  assert.equal(s.companions.eggs, 3, 'yumurtalar kalır');
  assert.equal(s.tower.best, 14, 'kule rekoru kalır');
  assert.equal(s.tower.keys, 2, 'kule anahtarları kalır');
  assert.equal(game.runes.count('emerald', 7), 2, 'rün çantası kalır');
});
