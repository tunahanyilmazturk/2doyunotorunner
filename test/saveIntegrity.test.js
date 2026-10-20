import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrate, sanitizeSave } from '../src/core/saveIntegrity.js';
import { createDefaultState } from '../src/core/GameState.js';
import { INVENTORY_SIZE, MAX_POTIONS, SAVE_VERSION, SHOP_SIZE } from '../src/config/constants.js';
import { Balance } from '../src/config/balance.js';
import { SLOT_ORDER } from '../src/data/items.js';
import { TREE_NODES } from '../src/data/soulTree.js';
import { SKILLS } from '../src/data/skills.js';
import { UPGRADES } from '../src/data/upgrades.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';
import { ELIXIRS } from '../src/data/shop.js';
import { MAX_ELIXIR_SECONDS } from '../src/data/shop.js';
import { createItem } from '../src/systems/ItemFactory.js';
import { itemName } from '../src/data/sets.js';

const itemState = { nextItemId: 1 };
const someItem = (slot = 'helmet', level = 20, tier = 2) => createItem(itemState, { slot, level, tier });

/** Kaydın klonunu üretir (JSON üzerinden gerçekçi dolaşım). */
const clone = (v) => JSON.parse(JSON.stringify(v));

test('yeni oyun varsayılanları geçerli kalır', () => {
  const out = sanitizeSave(createDefaultState());
  assert.equal(out.version, SAVE_VERSION);
  assert.equal(out.stage, 1);
  assert.equal(out.inventory.length, INVENTORY_SIZE);
  assert.equal(out.souls, 0);
  assert.equal(out.settings.speed, 1);
});

test('nesne olmayan girdi varsayılana döner', () => {
  for (const bad of [null, undefined, 42, 'metin', [], true]) {
    const out = sanitizeSave(bad);
    assert.equal(out.stage, 1);
    assert.equal(out.inventory.length, INVENTORY_SIZE);
  }
});

test('geçerli kayıt kayıpsız dolaşır', () => {
  const state = createDefaultState();
  const helmet = someItem('helmet', 20, 2);
  const sword = someItem('weapon', 25, 3);
  const ring = someItem('ring', 15, 4);
  state.inventory[0] = helmet;
  state.inventory[1] = sword;
  state.equipment.ring = ring;
  state.nextItemId = 4;
  state.gold = 12345;
  state.souls = 7;
  state.soulsEarned = 30;
  state.stage = 42;
  state.bestStage = 55;
  state.runMaxStage = 44;
  state.upgrades.power = 30;
  state.skills.frenzy = 4;
  state.tree.c1 = 3;
  state.achievements.kills_1 = 1700000000000;
  state.settings.speed = 2;
  state.settings.autoSellTier = 1;
  state.stats.totalKills = 999;
  state.stats.monstersKilled = ['slime', 'wolf'];
  state.elixirs.wrath = 120;

  const out = sanitizeSave(clone(state));
  assert.equal(out.gold, 12345);
  assert.equal(out.souls, 7);
  assert.equal(out.soulsEarned, 30);
  assert.equal(out.stage, 42);
  assert.equal(out.bestStage, 55);
  assert.equal(out.runMaxStage, 44);
  assert.equal(out.upgrades.power, 30);
  assert.equal(out.skills.frenzy, 4);
  assert.equal(out.tree.c1, 3);
  assert.equal(out.settings.speed, 2);
  assert.equal(out.settings.autoSellTier, 1);
  assert.equal(out.stats.totalKills, 999);
  assert.equal(out.elixirs.wrath, 120);
  assert.deepEqual(out.stats.monstersKilled, ['slime', 'wolf']);
  assert.deepEqual(out.achievements, { kills_1: 1700000000000 });
  // Eşyalar korunur (kimlik yeniden atanır ama içerik aynı kalır)
  assert.equal(out.inventory[0].slot, 'helmet');
  assert.equal(out.inventory[0].name, helmet.name);
  assert.deepEqual(out.inventory[0].stats, helmet.stats);
  assert.equal(out.inventory[0].tier, helmet.tier);
  assert.equal(out.equipment.ring.slot, 'ring');
  assert.equal(out.equipment.ring.tier, ring.tier);
  // Kimlikler benzersiz ve nextItemId üstünde
  const ids = [out.inventory[0].id, out.inventory[1].id, out.equipment.ring.id];
  assert.equal(new Set(ids).size, 3, 'kimlikler benzersiz olmalı');
  assert.ok(out.nextItemId > Math.max(...ids));
});

test('eşya adı kanonik veriden yeniden üretilir (HTML enjeksiyonu etkisiz)', () => {
  const state = createDefaultState();
  const item = someItem('helmet', 20, 2);
  item.name = '<img src=x onerror=alert(1)>';
  state.inventory[0] = item;
  const out = sanitizeSave(clone(state));
  // Set rastgele seçilebilir: kanonik ad set önekini de içerir
  assert.equal(out.inventory[0].name, itemName('helmet', 20, undefined, item.set));
  assert.ok(!out.inventory[0].name.includes('<'));
});

test('geçersiz eşyalar atılır, geçerli alanlar korunur', () => {
  const item = someItem('boots', 10, 1);
  const state = createDefaultState();
  state.inventory[0] = { ...item, slot: 'hacked' }; // bilinmeyen yuva
  state.inventory[1] = { ...item, stats: { hackliStat: 999 } }; // ana stat yok
  state.inventory[2] = { ...item, stats: { armor: 10, hackliStat: 999 } }; // bilinmeyen stat
  state.inventory[3] = 'metin';
  const out = sanitizeSave(clone(state));
  assert.equal(out.inventory[0], null);
  assert.equal(out.inventory[1], null);
  assert.equal(out.inventory[2].slot, 'boots');
  assert.deepEqual(Object.keys(out.inventory[2].stats), ['armor']);
  assert.equal(out.inventory[3], null);
});

test('bilinmeyen üst düzey alanlar kayda girmez', () => {
  const out = sanitizeSave({ ...createDefaultState(), yeniAlan: 'zararlı', __proto__: { kirli: 1 } });
  assert.ok(!('yeniAlan' in out));
  assert.ok(!('kirli' in out));
});

test('sayısal alanlar sınırlarına sıkıştırılır', () => {
  const out = sanitizeSave({
    ...createDefaultState(),
    gold: -100,
    souls: -1,
    stage: 0,
    kills: 9999,
    potions: 1e9,
    soulsEarned: 0,
    settings: { speed: 99, autoSellTier: 99 },
  });
  assert.equal(out.gold, 0);
  assert.equal(out.souls, 0);
  assert.equal(out.stage, 1);
  assert.ok(out.kills <= 10);
  assert.equal(out.potions, MAX_POTIONS);
  assert.equal(out.settings.speed, 1, 'geçersiz hız varsayılana dönmeli');
  assert.equal(out.settings.autoSellTier, 5, 'nadirlik tavanına sıkışmalı');
});

test('yeni bir ayar alanı doğrulamaya eklenmezse test kırılır', () => {
  // saveIntegrity ayarları tek tek sayar. GameState'e alan eklenip buraya
  // eklenmezse içe aktarılan kayıtta alan sessizce düşerdi; bu test onu yakalar.
  const defaults = Object.keys(createDefaultState().settings).sort();
  const out = Object.keys(sanitizeSave({ settings: {} }).settings).sort();
  assert.deepEqual(out, defaults, 'saveIntegrity.js içindeki ayar listesi GameState ile aynı olmalı');
});

test('tüm ayarlar geçerli değerlerle kayıpsız dolaşır', () => {
  const settings = {
    speed: 2,
    autoPotion: false,
    pixelArt: false,
    autoBuy: true,
    autoBuyProfile: 'gold',
    dockCollapsed: true,
    autoSellTier: 3,
    audio: false,
    volume: 0.35,
  };
  const out = sanitizeSave({ settings }).settings;
  for (const [key, value] of Object.entries(settings)) assert.equal(out[key], value, `ayar kayboldu: ${key}`);
});

test('oto-alım profili yalnızca tanımlı kimliklerden biri olabilir', () => {
  assert.equal(sanitizeSave({ settings: { autoBuyProfile: 'damage' } }).settings.autoBuyProfile, 'damage');
  assert.equal(sanitizeSave({ settings: { autoBuyProfile: 'kirli' } }).settings.autoBuyProfile, 'cheapest', 'bilinmeyen profil varsayılana döner');
  assert.equal(sanitizeSave({ settings: {} }).settings.autoBuyProfile, 'cheapest');
});

test('ses düzeyi 0..1 aralığına sıkışır', () => {
  assert.equal(sanitizeSave({ settings: { volume: 12 } }).settings.volume, 1);
  assert.equal(sanitizeSave({ settings: { volume: -3 } }).settings.volume, 0);
  assert.equal(sanitizeSave({ settings: { volume: NaN } }).settings.volume, 0.7, 'bozuk değer varsayılana döner');
  assert.equal(sanitizeSave({ settings: { audio: 'evet' } }).settings.audio, true, 'metin yerine varsayılan');
});

test('Infinity/NaN değerler varsayılana döner', () => {
  const out = sanitizeSave({
    ...createDefaultState(),
    gold: Infinity,
    stats: { totalKills: NaN, maxHit: Infinity, goldPerSec: -5 },
  });
  assert.equal(out.gold, 0);
  assert.equal(out.stats.totalKills, 0);
  assert.equal(out.stats.maxHit, 0);
  assert.equal(out.stats.goldPerSec, 0);
  for (const key of Object.keys(out.stats)) {
    if (typeof out.stats[key] === 'number') assert.ok(Number.isFinite(out.stats[key]), `${key} sonlu değil`);
  }
});

test('kazanılan Ruh asla harcanabilir Ruhun altına düşmez', () => {
  const out = sanitizeSave({ ...createDefaultState(), souls: 50, soulsEarned: 10 });
  assert.equal(out.soulsEarned, 50);
});

test('bölge sıralaması korunur: best >= runMax >= stage', () => {
  const out = sanitizeSave({ ...createDefaultState(), stage: 80, runMaxStage: 10, bestStage: 5 });
  assert.ok(out.runMaxStage >= out.stage);
  assert.ok(out.bestStage >= out.runMaxStage);
});

test('bilinmeyen yükseltme/yetenek/ağaç/başarım kimlikleri atılır', () => {
  const out = sanitizeSave({
    ...createDefaultState(),
    upgrades: { power: 5, hackli: 9999 },
    skills: { frenzy: 2, hackli: 99 },
    tree: { c1: 2, hackli: 99 },
    achievements: { kills_1: 1, hackli: 1 },
  });
  assert.equal(out.upgrades.power, 5);
  assert.ok(!('hackli' in out.upgrades));
  assert.equal(out.skills.frenzy, 2);
  assert.ok(!('hackli' in out.skills));
  assert.equal(out.tree.c1, 2);
  assert.ok(!('hackli' in out.tree));
  assert.deepEqual(Object.keys(out.achievements), ['kills_1']);
  // Tüm yükseltme/yetenek anahtarları tanımlı kalmalı
  for (const up of UPGRADES) assert.ok(up.id in out.upgrades);
  for (const s of SKILLS) assert.ok(s.id in out.skills);
  for (const a of ACHIEVEMENTS.slice(0, 20)) assert.ok(!(a.id in out.achievements) || typeof out.achievements[a.id] === 'number');
});

test('seviyeler maxLevel ve üst sınırı aşamaz', () => {
  const capped = UPGRADES.find((u) => u.maxLevel);
  const out = sanitizeSave({
    ...createDefaultState(),
    upgrades: { [capped.id]: 99999 },
    skills: { [SKILLS[0].id]: 99999 },
    tree: { c1: 99999 },
    potions: 10,
  });
  assert.equal(out.upgrades[capped.id], capped.maxLevel);
  assert.equal(out.skills[SKILLS[0].id], SKILLS[0].maxLevel);
  assert.equal(out.tree.c1, TREE_NODES.find((n) => n.id === 'c1').maxLevel);
});

test('güçlendirme nadirliğin üst sınırını aşamaz', () => {
  const low = someItem('helmet', 20, 0);
  low.enhance = 99;
  const high = someItem('helmet', 20, 5);
  high.enhance = 99;
  const state = createDefaultState();
  state.inventory[0] = low;
  state.inventory[1] = high;
  const out = sanitizeSave(clone(state));
  assert.equal(out.inventory[0].enhance, Balance.maxEnhance(0));
  assert.equal(out.inventory[1].enhance, Balance.maxEnhance(5));
});

test('envanter boşluklarla doldurulur ve üst sınırda kesilir', () => {
  const state = createDefaultState();
  state.inventory = Array.from({ length: 200 }, () => someItem('helmet', 10, 1));
  const out = sanitizeSave(clone(state));
  assert.ok(out.inventory.length <= INVENTORY_SIZE + 20, 'envanter üst sınırı aştı');
  assert.ok(out.inventory.length >= INVENTORY_SIZE);

  const sparse = sanitizeSave({ ...createDefaultState(), inventory: [] });
  assert.equal(sparse.inventory.length, INVENTORY_SIZE);
  assert.ok(sparse.inventory.every((s) => s === null));
});

test('ikinci süreli iksir sınırı ve bilinmeyenler atılır', () => {
  const out = sanitizeSave({
    ...createDefaultState(),
    elixirs: { [ELIXIRS[0].id]: 999999, hackli: 100, wrath: 999999 },
  });
  assert.equal(out.elixirs[ELIXIRS[0].id], MAX_ELIXIR_SECONDS);
  assert.ok(!('hackli' in out.elixirs));
});

test('istatistik listeleri yalnızca bilinen kimlikleri tutar', () => {
  const out = sanitizeSave({
    ...createDefaultState(),
    stats: { monstersKilled: ['slime', 'slime', 'hackli'], traitsKilled: ['swift', 'hackli'], weaponKinds: ['sword', 'hackli'] },
  });
  assert.deepEqual(out.stats.monstersKilled, ['slime']);
  assert.deepEqual(out.stats.traitsKilled, ['swift']);
  assert.deepEqual(out.stats.weaponKinds, ['sword']);
});

test('mağaza vitrini doğrulanır', () => {
  const good = someItem('weapon', 30, 3);
  const out = sanitizeSave({
    ...createDefaultState(),
    shop: {
      refreshAt: 123,
      items: [
        { item: good, price: 500, sold: true },
        { item: { slot: 'hacked' }, price: 1 },
        'metin',
      ],
    },
  });
  assert.equal(out.shop.refreshAt, 123);
  assert.equal(out.shop.items.length, 1);
  assert.equal(out.shop.items[0].sold, true);
  assert.equal(out.shop.items[0].item.slot, 'weapon');
  assert.ok(out.shop.items[0].price > 0);
});

test('vitrin en fazla SHOP_SIZE teklif tutar', () => {
  const items = Array.from({ length: 50 }, () => ({ item: someItem('belt', 20, 1), price: 10, sold: false }));
  const out = sanitizeSave({ ...createDefaultState(), shop: { refreshAt: 0, items } });
  assert.ok(out.shop.items.length <= SHOP_SIZE);
});

test('migrate sürümü günceller ve doğrulamayı uygular', () => {
  const out = migrate({ version: 0, gold: -5, stage: 'abc' });
  assert.equal(out.version, SAVE_VERSION);
  assert.equal(out.gold, 0);
  assert.equal(out.stage, 1);
});

test('geçerli bir kayıtta tüm yuvalar tanımlı kalır', () => {
  const out = sanitizeSave({ equipment: { helmet: someItem('helmet') } });
  for (const slot of SLOT_ORDER) assert.ok(slot in out.equipment, `${slot} kayıp`);
  assert.equal(out.equipment.helmet.slot, 'helmet');
});
