// Kayıt bütünlüğü: sürüm geçişleri ve doğrulama.
//
// Neden gerekli?
//  - `SaveManager.importString` base64 ile DIŞARIDAN gelen JSON'u kabul eder.
//    Doğrulanmazsa: eşya adına HTML enjekte edilebilir (araç ipucu innerHTML
//    kullanıyor → stored XSS), `slot` uydurulabilir (çizim sırasında çökme),
//    `gold: Infinity` gibi değerler oyunu bozabilir.
//  - localStorage elle düzenlenebilir ve şema sürümleri zamanla değişir.
//
// `sanitizeSave` bilinmeyen alanları atar, bilinen alanları tip/aralık
// doğrulamasından geçirir ve eşya adlarını kanonik veriden YENİDEN üretir.
import { GAME_SPEEDS, INVENTORY_SIZE, KILLS_PER_STAGE, MAX_POTIONS, SAVE_VERSION, SHOP_SIZE } from '../config/constants.js';
import { createDefaultState } from './GameState.js';
import { Balance } from '../config/balance.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { ELITE_TRAITS } from '../data/eliteTraits.js';
import { ITEM_BASES, SLOT_ORDER, WEAPON_KINDS } from '../data/items.js';
import { BOSSES, MONSTERS } from '../data/monsters.js';
import { COMPANION_IDS, COMPANION_MAP, EGG_HATCH_KILLS, MAX_COMPANION_LEVEL, MAX_EGGS, xpToNext } from '../data/companions.js';
import { DAILY_QUEST_COUNT, QUEST_MAP } from '../data/quests.js';
import { MAX_SOCKETS_BY_TIER, RUNE_GRADES, RUNE_IDS } from '../data/runes.js';
import { TOWER_DAILY_ATTEMPTS } from '../data/tower.js';
import { RARITIES } from '../data/rarities.js';
import { isSetForSlot, itemName } from '../data/sets.js';
import { MAX_ELIXIR_SECONDS, ELIXIR_MAP } from '../data/shop.js';
import { SKILLS } from '../data/skills.js';
import { TREE_MAP } from '../data/soulTree.js';
import { STAT_DEFS } from '../data/stats.js';
import { UPGRADES } from '../data/upgrades.js';
import { PROFILES } from '../systems/UpgradeAdvisor.js';

const MAX_TIER = RARITIES.length - 1;
const MAX_STAGE = 100000; // bölge/eşya seviyesi üst sınırı
const MAX_UPGRADE_LEVEL = 10000; // 2^(seviye/25) taşmasın

const STAT_KEYS = new Set(Object.keys(STAT_DEFS));
const UPGRADE_IDS = new Set(UPGRADES.map((u) => u.id));
const SKILL_IDS = new Set(SKILLS.map((s) => s.id));
const ACHIEVEMENT_IDS = new Set(ACHIEVEMENTS.map((a) => a.id));
const MONSTER_IDS = new Set([...Object.keys(MONSTERS), ...Object.keys(BOSSES)]);
const TRAIT_IDS = new Set(ELITE_TRAITS.map((t) => t.id));
const WEAPON_KIND_IDS = new Set(Object.keys(WEAPON_KINDS));

/** Ruh Ağacı'nın envantere ekleyebileceği en fazla yuva. */
const MAX_INVENTORY = INVENTORY_SIZE + Object.values(TREE_MAP)
  .filter((n) => n.effect?.type === 'perk' && n.effect.key === 'inventorySlots')
  .reduce((sum, n) => sum + n.maxLevel * n.effect.per, 0);

// ---------- ilkel doğrulayıcılar ----------

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

const num = (v, fallback = 0) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const int = (v, min, max, fallback = min) => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
};

const bool = (v, fallback) => (typeof v === 'boolean' ? v : fallback);

const oneOf = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback);

/** Yükseltme oto-alım profili kimlikleri (tek ev: UpgradeAdvisor.PROFILES). */
const PROFILE_IDS = PROFILES.map((p) => p.id);

/** 0..1 aralığına sıkıştırılmış ondalık (ses düzeyi gibi). */
const unit = (v, fallback) => Math.min(1, Math.max(0, num(v, fallback)));

/** Bilinmeyen kimlikleri atar, seviyeleri aralığa sıkıştırır. */
function sanitizeLevelMap(raw, allowed, maxLevelOf, { omitZero = false } = {}) {
  const out = {};
  for (const id of allowed) {
    const level = int(raw?.[id], 0, maxLevelOf(id), 0);
    if (level > 0 || !omitZero) out[id] = level;
  }
  return out;
}

function sanitizeBoolMap(raw, allowed, fallback = true) {
  const out = {};
  for (const id of allowed) out[id] = bool(raw?.[id], fallback);
  return out;
}

/** Kimlik listelerini bilinen değerlerle sınırlar ve tekilleştirir. */
function sanitizeIdList(raw, valid) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const id of raw) if (valid.has(id) && !out.includes(id)) out.push(id);
  return out;
}

// ---------- eşya doğrulama ----------

/**
 * Eşyayı doğrular. Geçersizse null döner.
 * Ad ve değer kullanıcı verisinden DEĞİL, kanonik tablolardan yeniden üretilir;
 * böylece kayıt içine gömülü metin arayüze sızamaz.
 * @param {Function} allocateId  tüm eşyalar arasında benzersiz kimlik üreticisi
 */
function sanitizeItem(raw, allocateId) {
  if (!isObject(raw)) return null;
  const slot = raw.slot;
  if (!SLOT_ORDER.includes(slot)) return null;

  const level = int(raw.level, 1, MAX_STAGE, 1);
  const tier = int(raw.tier, 0, MAX_TIER, 0);
  const kind = slot === 'weapon' && WEAPON_KIND_IDS.has(raw.kind) ? raw.kind : undefined;
  // Set etiketi yalnızca kanonik tabloda VARSA ve o yuvaya aitse korunur.
  const setId = isSetForSlot(raw.set, slot) ? raw.set : undefined;

  const stats = {};
  const rawStats = isObject(raw.stats) ? raw.stats : {};
  for (const [key, value] of Object.entries(rawStats)) {
    if (!STAT_KEYS.has(key)) continue;
    const v = num(value, 0);
    if (v !== 0) stats[key] = v;
  }
  // Ana stat zorunlu: onsuz eşya hiçbir işe yaramaz ve güç karşılaştırması bozulur.
  if (!(ITEM_BASES[slot].primary in stats)) return null;

  const item = {
    id: allocateId(),
    slot,
    tier,
    level,
    stats,
    name: itemName(slot, level, kind, setId),
    value: Balance.itemValue(level, RARITIES[tier].valueMult),
  };
  if (kind) item.kind = kind;
  if (setId) item.set = setId;
  // Güçlendirme, nadirliğin izin verdiği üst sınırı aşamaz (dosyada elle şişirilemesin).
  const enhance = int(raw.enhance, 0, Balance.maxEnhance(tier), 0);
  if (enhance > 0) item.enhance = enhance;
  if (raw.locked === true) item.locked = true;
  // Rün yuvaları: sayı nadirlik sınırını aşamaz, içerik bilinen tür + geçerli kademe olmalı
  if (Array.isArray(raw.sockets)) {
    const sockets = raw.sockets.slice(0, MAX_SOCKETS_BY_TIER[tier] ?? 0).map(sanitizeRune);
    if (sockets.length) item.sockets = sockets;
  }
  return item;
}

function sanitizeRune(raw) {
  if (!isObject(raw) || !RUNE_IDS.includes(raw.type)) return null;
  return { type: raw.type, grade: int(raw.grade, 1, RUNE_GRADES, 1) };
}

const MAX_RUNE_STACK = 1e6;
const MAX_KEYS = 999;
const DAY_KEY = /^d{4}-d{2}-d{2}$/;

function sanitizeRuneBag(raw) {
  const out = {};
  for (const id of RUNE_IDS) {
    const list = Array.isArray(raw?.[id]) ? raw[id] : [];
    out[id] = Array.from({ length: RUNE_GRADES }, (_, i) => int(list[i], 0, MAX_RUNE_STACK, 0));
  }
  return out;
}

function sanitizeCompanions(raw) {
  const out = { owned: {}, active: null, eggs: 0, incubating: null };
  if (!isObject(raw)) return { ...out, eggs: 1 };
  if (isObject(raw.owned)) {
    for (const id of COMPANION_IDS) {
      const c = raw.owned[id];
      if (!isObject(c)) continue;
      const level = int(c.level, 1, MAX_COMPANION_LEVEL, 1);
      out.owned[id] = { level, xp: int(c.xp, 0, xpToNext(level), 0) };
    }
  }
  out.active = COMPANION_MAP[raw.active] && out.owned[raw.active] ? raw.active : null;
  out.eggs = int(raw.eggs, 0, MAX_EGGS, 0);
  out.incubating = raw.incubating === null || raw.incubating === undefined ? null : int(raw.incubating, 0, EGG_HATCH_KILLS, 0);
  return out;
}

function sanitizeReward(raw) {
  if (!isObject(raw)) return null;
  const types = ['souls', 'gold', 'rune', 'egg', 'elixir', 'chest', 'towerKey'];
  if (!types.includes(raw.type)) return null;
  const out = { type: raw.type, amount: int(raw.amount, 0, 1e6, 1) };
  if (raw.type === 'rune') out.grade = int(raw.grade, 0, RUNE_GRADES, 0);
  if (raw.type === 'chest') out.id = ['wood', 'iron', 'gold'].includes(raw.id) ? raw.id : 'wood';
  return out;
}

function sanitizeDaily(raw) {
  const out = { day: '', quests: [], bonusClaimed: false, streak: 0, lastLoginDay: '', loginClaimed: false };
  if (!isObject(raw)) return out;
  out.day = typeof raw.day === 'string' && DAY_KEY.test(raw.day) ? raw.day : '';
  out.lastLoginDay = typeof raw.lastLoginDay === 'string' && DAY_KEY.test(raw.lastLoginDay) ? raw.lastLoginDay : '';
  out.streak = int(raw.streak, 0, 100000, 0);
  out.loginClaimed = bool(raw.loginClaimed, false);
  out.bonusClaimed = bool(raw.bonusClaimed, false);
  if (Array.isArray(raw.quests)) {
    for (const q of raw.quests.slice(0, DAILY_QUEST_COUNT)) {
      if (!isObject(q) || !QUEST_MAP[q.id]) continue;
      const reward = sanitizeReward(q.reward);
      if (!reward) continue;
      const target = int(q.target, 1, 1e7, 1);
      out.quests.push({ id: q.id, target, progress: int(q.progress, 0, target, 0), claimed: bool(q.claimed, false), reward });
    }
  }
  // Görev listesi bozulduysa gün anahtarını sıfırla: QuestSystem bugünün görevlerini yeniden üretir
  if (out.quests.length !== DAILY_QUEST_COUNT) out.day = '';
  return out;
}

function sanitizeItemList(rawList, allocateId) {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((raw) => sanitizeItem(raw, allocateId));
}

// ---------- ana doğrulayıcı ----------

/**
 * Ham (güvenilmeyen) kaydı temizler.
 * Varsayılan durumdan başlar: bilinmeyen alanlar düşer, gelecekte eklenen
 * alanlar varsayılanıyla otomatik gelir.
 */
export function sanitizeSave(raw) {
  const out = createDefaultState();
  if (!isObject(raw)) return out;

  let nextId = 1;
  const allocateId = () => nextId++;

  out.gold = Math.max(0, num(raw.gold, 0));
  out.souls = Math.max(0, num(raw.souls, 0));
  out.soulsEarned = Math.max(out.souls, num(raw.soulsEarned, out.souls));

  out.stage = int(raw.stage, 1, MAX_STAGE, 1);
  out.kills = int(raw.kills, 0, KILLS_PER_STAGE, 0);
  out.runMaxStage = Math.max(out.stage, int(raw.runMaxStage, 1, MAX_STAGE, out.stage));
  out.bestStage = Math.max(out.runMaxStage, int(raw.bestStage, 1, MAX_STAGE, out.runMaxStage));
  out.autoAdvance = bool(raw.autoAdvance, true);

  out.upgrades = sanitizeLevelMap(raw.upgrades, UPGRADE_IDS, (id) => {
    const up = UPGRADES.find((u) => u.id === id);
    return up?.maxLevel ?? MAX_UPGRADE_LEVEL;
  });
  out.upgradeAuto = sanitizeBoolMap(raw.upgradeAuto, UPGRADE_IDS, true);

  out.inventory = sanitizeItemList(raw.inventory, allocateId).slice(0, MAX_INVENTORY);
  while (out.inventory.length < INVENTORY_SIZE) out.inventory.push(null);

  out.equipment = {};
  for (const slot of SLOT_ORDER) out.equipment[slot] = sanitizeItem(raw.equipment?.[slot], allocateId);

  out.potions = int(raw.potions, 0, MAX_POTIONS, 0);

  out.elixirs = {};
  if (isObject(raw.elixirs)) {
    for (const [id, seconds] of Object.entries(raw.elixirs)) {
      if (!ELIXIR_MAP[id]) continue;
      const v = num(seconds, 0);
      if (v > 0) out.elixirs[id] = Math.min(MAX_ELIXIR_SECONDS, v);
    }
  }

  out.skills = sanitizeLevelMap(raw.skills, SKILL_IDS, (id) => SKILLS.find((s) => s.id === id)?.maxLevel ?? 0);
  out.skillAuto = sanitizeBoolMap(raw.skillAuto, SKILL_IDS, true);

  out.achievements = {};
  if (isObject(raw.achievements)) {
    for (const [id, at] of Object.entries(raw.achievements)) {
      if (ACHIEVEMENT_IDS.has(id)) out.achievements[id] = Math.max(0, num(at, 0));
    }
  }

  out.tree = sanitizeLevelMap(raw.tree, new Set(Object.keys(TREE_MAP)), (id) => TREE_MAP[id]?.maxLevel ?? 1, { omitZero: true });

  out.runes = sanitizeRuneBag(raw.runes);
  out.companions = sanitizeCompanions(raw.companions);
  out.daily = sanitizeDaily(raw.daily);
  out.tower = {
    best: int(raw.tower?.best, 0, MAX_STAGE, 0),
    attempts: int(raw.tower?.attempts, 0, TOWER_DAILY_ATTEMPTS, TOWER_DAILY_ATTEMPTS),
    keys: int(raw.tower?.keys, 0, MAX_KEYS, 0),
  };

  out.shop = { items: [], refreshAt: Math.max(0, num(raw.shop?.refreshAt, 0)) };
  if (Array.isArray(raw.shop?.items)) {
    for (const offer of raw.shop.items.slice(0, SHOP_SIZE)) {
      if (!isObject(offer)) continue;
      const item = sanitizeItem(offer.item, allocateId);
      if (!item) continue;
      out.shop.items.push({
        item,
        price: Math.max(1, num(offer.price, item.value * Balance.shopPriceMult)),
        sold: offer.sold === true,
      });
    }
  }

  const s = isObject(raw.settings) ? raw.settings : {};
  // DİKKAT: ayarlar bilinçli olarak burada tek tek sayılır. `GameState.settings`'e
  // alan eklerken buraya da ekle; aksi halde içe aktarılan kayıtta alan sessizce düşer.
  out.settings = {
    speed: oneOf(s.speed, GAME_SPEEDS, 1),
    autoPotion: bool(s.autoPotion, true),
    pixelArt: bool(s.pixelArt, true),
    autoBuy: bool(s.autoBuy, false),
    autoBuyProfile: oneOf(s.autoBuyProfile, PROFILE_IDS, 'cheapest'),
    dockCollapsed: bool(s.dockCollapsed, false),
    autoSellTier: int(s.autoSellTier, -1, MAX_TIER, -1),
    audio: bool(s.audio, true),
    volume: unit(s.volume, 0.7),
  };

  const st = isObject(raw.stats) ? raw.stats : {};
  const count = (key) => Math.max(0, num(st[key], 0));
  out.stats = {
    playTime: count('playTime'),
    totalKills: count('totalKills'),
    bossKills: count('bossKills'),
    totalGold: count('totalGold'),
    itemsFound: count('itemsFound'),
    deaths: count('deaths'),
    prestiges: count('prestiges'),
    elitesKilled: count('elitesKilled'),
    legendariesFound: count('legendariesFound'),
    skillsCast: count('skillsCast'),
    maxEnhance: count('maxEnhance'),
    mythicsFound: count('mythicsFound'),
    maxHit: count('maxHit'),
    fastBossKills: count('fastBossKills'),
    dodges: count('dodges'),
    weaponKinds: sanitizeIdList(st.weaponKinds, WEAPON_KIND_IDS),
    traitsKilled: sanitizeIdList(st.traitsKilled, TRAIT_IDS),
    monstersKilled: sanitizeIdList(st.monstersKilled, MONSTER_IDS),
    questsDone: count('questsDone'),
    maxRuneGrade: int(st.maxRuneGrade, 0, RUNE_GRADES, 0),
    goldPerSec: count('goldPerSec'),
  };

  // Eşyalara dağıtılan kimliklerin üstünde kal; yeni eşyalar çakışmasın.
  out.nextItemId = Math.max(nextId, int(raw.nextItemId, 1, Number.MAX_SAFE_INTEGER, nextId));
  out.lastSave = Math.max(0, num(raw.lastSave, 0)) || Date.now();
  out.version = SAVE_VERSION;
  return out;
}

// ---------- sürüm geçişleri ----------

/**
 * Yapısal şema değişiklikleri burada sırayla uygulanır.
 * Kaydın `version` değeri `to`'dan küçükse adım çalışır.
 * Kalıcı alan eklemek/taşımak gerekirse buraya bir adım ekle ve
 * `config/constants.js` içindeki SAVE_VERSION'ı artır.
 *
 * Örnek:
 *   { to: 2, up: (s) => ({ ...s, yeniAlan: s.eskiAlan }) },
 */
const MIGRATION_STEPS = [];

/** Ham kaydı okunabilir hale getirir: sürüm adımları + doğrulama. */
export function migrate(raw) {
  let state = isObject(raw) ? raw : {};
  const from = Number.isFinite(Number(state.version)) ? Number(state.version) : 0;
  for (const step of MIGRATION_STEPS) {
    if (from < step.to) state = step.up(state) ?? state;
  }
  return sanitizeSave(state);
}
