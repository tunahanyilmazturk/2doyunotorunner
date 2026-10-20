import { Balance } from '../config/balance.js';
import { Events } from '../core/events.js';
import { CHEST_MAP, ELIXIRS } from '../data/shop.js';
import { RUNE_MAP, runeGradeForStage } from '../data/runes.js';
import { formatNumber } from '../utils/format.js';
import { pick } from '../utils/random.js';

// Görev, giriş serisi ve kule ödüllerinin ortak dili.
// Ödül biçimi: { type, amount, grade?, id? }
//   souls (amount 0 → en iyi bölgeye göre), gold (amount = "altın paketi" sayısı),
//   rune (grade 0 → bölgeye göre), egg, elixir (rastgele iksir içilir), chest (id), towerKey

/** 0/otomatik alanları oyuncunun durumuna göre somut değerlere çevirir. */
export function resolveReward(game, r) {
  const { state } = game;
  const out = { ...r };
  if (r.type === 'souls' && !r.amount) out.amount = Math.max(5, Math.floor(state.bestStage / 2));
  if (r.type === 'rune' && !r.grade) out.grade = runeGradeForStage(state.bestStage, 1);
  if (r.type === 'gold') out.gold = Balance.itemValue(state.runMaxStage, 1) * 40 * (r.amount || 1);
  return out;
}

const rewardText = {
  souls: (r) => `${formatNumber(r.amount)} 👻`,
  gold: (r) => `${formatNumber(r.gold)} 🪙`,
  rune: (r) => `${r.amount} rün (${r.grade}. kademe)`,
  egg: (r) => `${r.amount} 🥚 yumurta`,
  elixir: (r) => `${r.amount} rastgele iksir`,
  chest: (r) => `${r.amount} ${CHEST_MAP[r.id]?.name ?? 'sandık'}`,
  towerKey: (r) => `${r.amount} 🗝️ kule anahtarı`,
};

export function describeReward(game, r) {
  const res = resolveReward(game, r);
  return rewardText[res.type]?.(res) ?? '';
}

/** Ödülü verir. @returns {object} çözümlenmiş ödül */
export function grantReward(game, r, at = null) {
  const res = resolveReward(game, r);
  const { state, bus } = game;
  const n = res.amount || 1;
  switch (res.type) {
    case 'souls':
      state.souls += res.amount;
      state.soulsEarned += res.amount;
      bus.emit(Events.TREE_CHANGED, {}); // Ruh gücü statları değişir
      break;
    case 'gold':
      game.economy.addGold(res.gold, false);
      break;
    case 'rune':
      for (let i = 0; i < n; i++) game.runes.grant(res.grade, at, pick(Object.keys(RUNE_MAP)));
      break;
    case 'egg':
      game.companions.addEggs(n);
      break;
    case 'elixir':
      for (let i = 0; i < n; i++) game.elixirs.drink(pick(ELIXIRS).id);
      break;
    case 'chest':
      for (let i = 0; i < n; i++) game.shop.openChest(res.id, { free: true });
      break;
    case 'towerKey':
      state.tower.keys += n;
      bus.emit(Events.TOWER_CHANGED, state.tower);
      break;
  }
  bus.emit(Events.REWARD_GRANTED, { reward: res, text: describeReward(game, r) });
  return res;
}
