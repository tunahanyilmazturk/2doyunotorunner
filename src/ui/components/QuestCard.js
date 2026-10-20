import { QUEST_MAP } from '../../data/quests.js';
import { describeReward } from '../../systems/rewards.js';
import { el } from '../../utils/dom.js';
import { iconToken } from '../icons.js';

const NEAR_RATIO = 0.8; // bu oranın üstündeki görevler "tamamlanmak üzere" işaretlenir
const QUEST_ART = {
  kills: 'achievement-kills', elites: 'achievement-elite', bosses: 'achievement-boss', skills: 'menu-skills',
  loot: 'achievement-items', runes: 'rune-ruby', enhance: 'achievement-enhance', tower: 'achievement-tower',
  upgrades: 'menu-upgrades', companions: 'menu-companions', elixirs: 'elixir-swift', sockets: 'rune-sapphire', alchemy: 'rune-amethyst',
  wkKills: 'achievement-kills', wkTower: 'achievement-tower', wkBosses: 'achievement-boss', wkSkills: 'menu-skills', wkUpgrades: 'menu-upgrades',
  moKills: 'achievement-kills', moTower: 'achievement-tower', moBosses: 'achievement-boss', moUpgrades: 'menu-upgrades', moCombine: 'rune-amethyst',
};

/**
 * Bir görev kartı: ilerleme çubuğu, ödül ve alma düğmesi.
 * kind: 'daily' | 'weekly' | 'monthly' (QuestSystem.list ile eşleşir).
 */
export function createQuestCard(game, kind, i, quest) {
  const t = QUEST_MAP[quest.id];
  const fill = el('div', { class: 'fill' });
  const bar = el('div', { class: 'bar quest-bar' }, [fill, el('span')]);
  const btn = el('button', { class: 'btn btn-buy btn-sm', onclick: () => game.quests.claim(i, kind) });
  const node = el('div', { class: 'quest-card' }, [
    el('div', { class: 'quest-info' }, [
      el('b', {}, [iconToken(QUEST_ART[quest.id] ?? `quest-${kind}`), ` ${t.name}`]),
      el('div', { class: 'muted', text: t.desc(quest.target) }),
      bar,
      el('div', { class: 'quest-reward', text: `Ödül: ${describeReward(game, quest.reward)}` }),
    ]),
    btn,
  ]);
  const card = { node, btn, fill, label: bar.lastChild, i, kind };
  updateQuestCard(game, card, quest);
  return card;
}

/** Kartı güncel ilerlemeyle yeniler: çubuk, düğme durumu ve "tamamlanmak üzere" vurgusu. */
export function updateQuestCard(game, card, quest) {
  if (!quest) return;
  const ratio = quest.progress / quest.target;
  card.fill.style.width = `${ratio * 100}%`;
  card.label.textContent = `${quest.progress} / ${quest.target}`;
  const canClaim = game.quests.canClaim(card.i, card.kind);
  card.btn.textContent = quest.claimed ? 'Alındı' : canClaim ? 'Ödülü al' : 'Devam ediyor';
  card.btn.disabled = !canClaim;
  card.node.classList.toggle('claimed', !!quest.claimed);
  card.node.classList.toggle('near', !quest.claimed && ratio >= NEAR_RATIO && ratio < 1);
}
