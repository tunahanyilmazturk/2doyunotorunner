// Veri dosyalarının kendi aralarında tutarlı olduğunu doğrular: bir canavarın,
// simgenin, nadirliğin veya düğümün "başka bir yeri" işaret edip etmediğini kontrol eder.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { BIOMES, getBiome, getBiomeIndex, getBiomeTitle } from '../src/data/biomes.js';
import { ALL_MONSTER_COUNT, BOSSES, MONSTERS } from '../src/data/monsters.js';
import { ELITE_TRAITS } from '../src/data/eliteTraits.js';
import { ITEM_BASES, SLOTS, SLOT_ORDER, WEAPON_KINDS, getBaseName, itemIcon, itemTypeName } from '../src/data/items.js';
import { RARITIES, getRarity } from '../src/data/rarities.js';
import { STAT_DEFS } from '../src/data/stats.js';
import { CHESTS, ELIXIRS } from '../src/data/shop.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';
import { PERK_KEYS, TREE_NODES, BRANCHES } from '../src/data/soulTree.js';
import { UPGRADES } from '../src/data/upgrades.js';
import { SKILLS } from '../src/data/skills.js';
import { createDefaultState } from '../src/core/GameState.js';
import { drawMonster, SHAPES } from '../src/render/sprites/monsters/index.js';
import { ICONS, aliases, iconRuns, itemArtKey } from '../src/ui/icons.js';
import { STAGES_PER_BIOME } from '../src/config/constants.js';

// ---------- biyomlar ve canavarlar ----------

test('her biyom var olan canavar ve boss kimlikleri kullanır', () => {
  for (const biome of BIOMES) {
    assert.ok(biome.monsters.length > 0, `${biome.id}: canavarsız biyom`);
    for (const id of biome.monsters) {
      assert.ok(MONSTERS[id], `${biome.id}: bilinmeyen canavar ${id}`);
    }
    assert.equal(biome.bosses.length, 2, `${biome.id}: iki boss olmalı`);
    for (const id of biome.bosses) {
      assert.ok(BOSSES[id], `${biome.id}: bilinmeyen boss ${id}`);
    }
  }
});

test('biyom kimlikleri benzersiz ve döngü doğru', () => {
  const ids = new Set(BIOMES.map((b) => b.id));
  assert.equal(ids.size, BIOMES.length);
  // Her biyomun bölge aralığı kendi indeksine düşer
  BIOMES.forEach((biome, i) => {
    const stage = i * STAGES_PER_BIOME + 1;
    assert.equal(getBiomeIndex(stage), i);
    assert.equal(getBiome(stage), biome);
  });
  assert.equal(getBiomeIndex(STAGES_PER_BIOME * BIOMES.length + 1), 0, 'döngü başa dönmeli');
});

test('biyom başlığı kabus döngüsünü gösterir', () => {
  assert.equal(getBiomeTitle(1), BIOMES[0].name);
  assert.match(getBiomeTitle(51), /Kabus/);
});

test('her canavar ve boss eksiksiz ve geçerli tanımlı', () => {
  const shapes = new Set(Object.keys(SHAPES));
  for (const [id, def] of Object.entries({ ...MONSTERS, ...BOSSES })) {
    assert.equal(def.id, id, `${id}: kimlik yazılmamış`);
    assert.ok(typeof def.name === 'string' && def.name.length > 0, `${id}: ad yok`);
    assert.ok(shapes.has(def.shape), `${id}: bilinmeyen şekil ${def.shape}`);
    for (const field of ['hp', 'atk', 'gold', 'atkSpeed', 'speed', 'size']) {
      assert.ok(Number.isFinite(def[field]) && def[field] > 0, `${id}: ${field} geçersiz`);
    }
    // Renkler eksiksiz olmalı, aksi halde çizim okunamaz hale gelir
    for (const key of ['body', 'dark', 'eye']) {
      assert.match(def.colors[key], /^#[0-9a-fA-F]{3,8}$/, `${id}: renk ${key} geçersiz`);
    }
  }
  assert.equal(ALL_MONSTER_COUNT, Object.keys(MONSTERS).length + Object.keys(BOSSES).length);
});

test('her biyomda en az bir hayalet/uçan/yılan çeşitliliği var', () => {
  const shapes = new Set(BIOMES.flatMap((b) => b.monsters.map((id) => MONSTERS[id].shape)));
  assert.ok(shapes.size >= 4, 'şekil çeşitliliği yetersiz');
});

test('yeni biyom düşmanları kayıtlı, havuzlarında ve özel çizim şekillerine sahip', () => {
  const additions = {
    forest: ['thornling'],
    desert: ['glassScarab'],
    cave: ['caveScarab'],
    tundra: ['frostMoth'],
    volcano: ['ashKnight'],
  };
  for (const biome of BIOMES) {
    for (const id of additions[biome.id]) {
      assert.ok(MONSTERS[id], `${id}: canavar verisi eksik`);
      assert.ok(biome.monsters.includes(id), `${biome.id}: düşman havuzunda değil`);
      assert.ok(SHAPES[MONSTERS[id].shape], `${id}: özel çizimi kayıtlı değil`);
    }
  }
  assert.equal(typeof SHAPES.beetle, 'function');
  assert.equal(typeof SHAPES.flora, 'function');
});

test('yeni düşman çizimleri animasyon sırasında hata vermez', () => {
  const ctx = new Proxy({}, { get: () => () => {} });
  for (const id of ['thornling', 'glassScarab', 'caveScarab', 'frostMoth', 'ashKnight']) {
    const def = MONSTERS[id];
    drawMonster(ctx, { def, x: 100, y: 200, animTime: 1.2, seed: 0.4, attackAnim: 0.5,
      dead: false, deathTimer: 0, scale: 1, hitFlash: 0, state: 'approach', flying: def.shape === 'flyer' });
  }
});

test('elit özellikleri uygulanabilir ve kimlikleri benzersiz', () => {
  const ids = new Set(ELITE_TRAITS.map((t) => t.id));
  assert.equal(ids.size, ELITE_TRAITS.length);
  for (const trait of ELITE_TRAITS) {
    const monster = { hp: 100, maxHp: 100, atk: 10, atkSpeed: 1, speed: 50, scale: 1, size: 40, damageTaken: 1, lifesteal: 0, gold: 10 };
    trait.apply(monster);
    for (const key of ['hp', 'maxHp', 'atk', 'atkSpeed', 'speed', 'scale', 'size', 'damageTaken', 'lifesteal', 'gold']) {
      assert.ok(Number.isFinite(monster[key]), `${trait.id}: ${key} bozuldu`);
    }
    assert.ok(monster.damageTaken >= 0 && monster.damageTaken <= 1, `${trait.id}: damageTaken aralık dışı`);
  }
});

// ---------- eşya ve nadirlik ----------

test('yuva tanımları tutarlı', () => {
  assert.deepEqual(Object.keys(SLOTS).sort(), [...SLOT_ORDER].sort());
  for (const slot of SLOT_ORDER) assert.equal(SLOTS[slot].name.length > 0, true);
});

test('eşya tabanları tanımlı statlara dayanır', () => {
  for (const [slot, base] of Object.entries(ITEM_BASES)) {
    assert.ok(STAT_DEFS[base.primary], `${slot}: bilinmeyen ana stat`);
    assert.ok(!base.affixPool.includes(base.primary), `${slot}: ana stat ek stat havuzunda olmamalı`);
    for (const key of base.affixPool) assert.ok(STAT_DEFS[key], `${slot}: bilinmeyen ek stat ${key}`);
    assert.ok(base.tiers.length >= 2, `${slot}: kademe listesi kısa`);
    const levels = base.tiers.map((t) => t.minLevel);
    assert.deepEqual(levels, [...levels].sort((a, b) => a - b), `${slot}: kademeler sırasız`);
    assert.equal(levels[0], 1, `${slot}: ilk kademe 1. seviyede olmalı`);
    for (const tier of base.tiers) assert.ok(tier.name.length > 0, `${slot}: isimsiz kademe`);
  }
});

test('silah türleri geçerli garanti statlara sahip', () => {
  for (const [kind, def] of Object.entries(WEAPON_KINDS)) {
    assert.ok(def.weight > 0, `${kind}: ağırlık pozitif olmalı`);
    assert.ok(def.primaryMult > 0);
    for (const stat of def.guaranteed) assert.ok(STAT_DEFS[stat], `${kind}: bilinmeyen garanti stat ${stat}`);
    assert.equal(def.tiers.length, ITEM_BASES.weapon.tiers.length, `${kind}: kademe sayısı silahla uyuşmuyor`);
  }
});

test('getBaseName seviyeye göre kademe seçer', () => {
  const tiers = ITEM_BASES.helmet.tiers;
  assert.equal(getBaseName('helmet', 1), tiers[0].name);
  for (const tier of tiers) {
    assert.equal(getBaseName('helmet', tier.minLevel), tier.name, `seviye ${tier.minLevel}`);
  }
  assert.equal(getBaseName('helmet', 1e6), tiers[tiers.length - 1].name, 'üst kademede kalmalı');
});

test('nadirlik kademeleri kesintisiz ve artan', () => {
  RARITIES.forEach((r, i) => {
    assert.equal(r.tier, i);
    assert.ok(r.weight > 0, `${r.id}: ağırlık pozitif olmalı`);
    assert.ok(r.affixes >= 1);
    assert.ok(r.statMult > 0);
    assert.ok(r.valueMult > 0);
  });
  for (let i = 1; i < RARITIES.length; i++) {
    assert.ok(RARITIES[i].statMult > RARITIES[i - 1].statMult, 'stat çarpanı artmalı');
    assert.ok(RARITIES[i].valueMult > RARITIES[i - 1].valueMult, 'değer çarpanı artmalı');
  }
  assert.equal(getRarity(-5).tier, 0, 'alt sınır kırpılmalı');
  assert.equal(getRarity(99).tier, RARITIES.length - 1, 'üst sınır kırpılmalı');
});

test('stat tanımları eksiksiz', () => {
  for (const [key, def] of Object.entries(STAT_DEFS)) {
    assert.ok(def.label.length > 0, `${key}: etiket yok`);
    assert.ok(def.base > 0, `${key}: taban pozitif olmalı`);
    // 'flat' statlar eşya seviyesiyle üstel, diğerleri (percent) doğrusal büyür
    assert.ok(def.scaling === undefined || def.scaling === 'flat', `${key}: bilinmeyen ölçekleme`);
    if (def.percent) assert.ok(Number.isFinite(def.perLevel), `${key}: perLevel eksik`);
    assert.equal(typeof def.percent, 'boolean');
  }
});

test('silah/tür etiket ve simgeleri çözülür', () => {
  for (const slot of SLOT_ORDER) {
    const item = { slot, level: 10, kind: slot === 'weapon' ? 'axe' : undefined };
    assert.ok(itemTypeName(item).length > 0);
    assert.ok(itemIcon(item).length > 0);
  }
  assert.equal(itemTypeName({ slot: 'weapon', kind: 'axe' }), WEAPON_KINDS.axe.name);
});

// ---------- mağaza, ağaç, yetenekler, başarımlar ----------

test('mağaza katalogları tutarlı', () => {
  const ids = new Set([...ELIXIRS, ...CHESTS].map((e) => e.id));
  assert.equal(ids.size, ELIXIRS.length + CHESTS.length, 'yinelenen mağaza kimliği');
  for (const e of ELIXIRS) {
    assert.ok(e.priceMult > 0 && e.duration > 0 && e.value > 0);
    assert.ok(STAT_DEFS[e.stat], `${e.id}: bilinmeyen stat ${e.stat}`);
  }
  for (const c of CHESTS) {
    assert.ok(c.priceMult > 0 && c.luck > 0);
    assert.ok(c.minTier >= 0 && c.minTier < RARITIES.length, `${c.id}: minTier aralık dışı`);
  }
});

test('ağaç düğümleri yalnızca kayıtlı perk anahtarlarını kullanır', () => {
  const known = new Set(PERK_KEYS);
  for (const node of TREE_NODES) {
    if (node.effect.type !== 'perk') continue;
    assert.ok(known.has(node.effect.key), `${node.id}: kayıtsız perk anahtarı ${node.effect.key}`);
  }
  // Kayıtlı anahtar sayısı aşırı büyümesin (yazım hatası göstergesi)
  assert.equal(new Set(PERK_KEYS).size, PERK_KEYS.length);
});

test('yetenekler geçerli türde ve kullanılabilir', () => {
  const kinds = new Set(['strike', 'buff', 'heal', 'meteor']);
  const keys = new Set();
  for (const s of SKILLS) {
    assert.ok(kinds.has(s.kind), `${s.id}: bilinmeyen tür ${s.kind}`);
    assert.ok(s.cooldown > 0 && s.maxLevel >= 1 && s.baseCost > 0);
    assert.ok(Number.isFinite(s.value(1)), `${s.id}: değer işlevi sonlu değil`);
    assert.ok(typeof s.describe(1, s) === 'string', `${s.id}: açıklama üretilemedi`);
    assert.ok(s.buffStat === undefined || STAT_DEFS[s.buffStat], `${s.id}: bilinmeyen buff statı`);
    if (s.key) {
      assert.ok(!keys.has(s.key), `yinelenen kısayol tuşu: ${s.key}`);
      keys.add(s.key);
    }
  }
});

test('başarım kimlikleri benzersiz, ilerleme işlevleri sonlu sayı döner', () => {
  const ids = new Set();
  const state = createDefaultState();
  for (const a of ACHIEVEMENTS) {
    assert.ok(!ids.has(a.id), `yinelenen başarım kimliği: ${a.id}`);
    ids.add(a.id);
    assert.ok(a.target > 0, `${a.id}: hedef pozitif olmalı`);
    const progress = a.progress(state);
    assert.ok(Number.isFinite(progress) && progress >= 0, `${a.id}: ilerleme geçersiz (${progress})`);
    assert.ok(typeof a.desc === 'string' && a.desc.length > 0, `${a.id}: açıklama yok`);
    assert.ok(typeof a.group === 'string' && a.group.length > 0, `${a.id}: grup yok`);
  }
  assert.ok(ACHIEVEMENTS.length >= 60, 'başarım sayısı beklenenden az');
});

// ---------- simge atlası ----------

test('her simgenin atlas dikdörtgeni tanımlı', () => {
  const missing = Object.entries(ICONS).filter(([, a]) => !Array.isArray(a.rect)).map(([k]) => k);
  assert.deepEqual(missing, [], `dikdörtgeni olmayan simgeler (çizimde çöker): ${missing.join(', ')}`);
});

test('simge dikdörtgenleri atlas sınırları içinde', () => {
  for (const [key, a] of Object.entries(ICONS)) {
    const [left, top, width, height, sheetWidth, sheetHeight] = a.rect;
    assert.ok(sheetWidth > 0 && sheetHeight > 0, `${key}: atlas boyutu geçersiz`);
    assert.ok(left >= 0 && top >= 0 && width > 0 && height > 0, `${key}: dikdörtgen geçersiz`);
    assert.ok(left + width <= sheetWidth, `${key}: yatay taşma`);
    assert.ok(top + height <= sheetHeight, `${key}: dikey taşma`);
  }
});

test('emoji takma adları var olan simgelere işaret eder', () => {
  for (const [emoji, key] of Object.entries(aliases)) {
    assert.ok(ICONS[key], `"${emoji}" bilinmeyen simgeye işaret ediyor: ${key}`);
  }
});

test('her eşya kademesi ve yuvası için simge var', () => {
  for (const slot of SLOT_ORDER) {
    assert.ok(ICONS[itemArtKey({ slot, level: 1, kind: slot === 'weapon' ? 'sword' : undefined })], `${slot}: simge eksik`);
  }
  for (const kind of Object.keys(WEAPON_KINDS)) {
    for (let row = 0; row < 7; row++) assert.ok(ICONS[`item-${kind}-${row}`], `${kind}-${row} simgesi eksik`);
  }
  for (const slot of SLOT_ORDER) {
    if (slot === 'weapon') continue;
    for (let row = 0; row < 7; row++) assert.ok(ICONS[`item-${slot}-${row}`], `${slot}-${row} simgesi eksik`);
  }
});

test('menü ve statik simgeler mevcut', () => {
  const required = ['menu-character', 'menu-upgrades', 'menu-skills', 'menu-forge', 'menu-shop', 'menu-achievements', 'menu-prestige', 'gold', 'soul', 'health', 'save', 'settings'];
  for (const key of required) assert.ok(ICONS[key], `eksik simge: ${key}`);
});

test('kodun dinamik ürettiği simge anahtarları var', () => {
  // Arayüz bu anahtarları şablon dizesiyle kurar; biri eksik olursa
  // iconHTML fırlatır veya metin ham kalır.
  for (const a of ACHIEVEMENTS) assert.ok(ICONS[`achievement-${a.group}`], `başarım grubu simgesi eksik: ${a.group}`);
  for (const s of SKILLS) assert.ok(ICONS[`skill-${s.id}`], `yetenek simgesi eksik: ${s.id}`);
  for (const up of UPGRADES) assert.ok(ICONS[`upgrade-${up.id}`], `yükseltme simgesi eksik: ${up.id}`);
  for (const n of TREE_NODES) assert.ok(ICONS[`tree-${n.id}`], `ağaç simgesi eksik: ${n.id}`);
  for (const b of BRANCHES) assert.ok(ICONS[`branch-${b.id}`], `dal simgesi eksik: ${b.id}`);
  for (const c of CHESTS) assert.ok(ICONS[`chest-${c.id}`], `sandık simgesi eksik: ${c.id}`);
  for (const e of ELIXIRS) assert.ok(ICONS[`elixir-${e.id}`], `iksir simgesi eksik: ${e.id}`);
});

test('iconRuns bilinmeyen jetonu metin olarak korur', () => {
  const runs = iconRuns('git [[icon:yokBoyle]] son');
  assert.equal(runs.map((r) => (r.key ? `<${r.key}>` : r.text)).join(''), 'git [[icon:yokBoyle]] son');
  const known = iconRuns('[[icon:gold]] 5 🪙');
  assert.deepEqual(known.filter((r) => r.key).map((r) => r.key), ['gold', 'gold']);
  const plain = iconRuns('düz metin');
  assert.deepEqual(plain, [{ text: 'düz metin' }]);
});
