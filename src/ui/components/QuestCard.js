import { QUEST_MAP } from '../../data/quests.js';
import { describeReward } from '../../systems/rewards.js';
import { el } from '../../utils/dom.js';

const NEAR_RATIO = 0.8; // bu oranın üstündeki görevler "tamamlanmak üzere" işaretlenir

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
      el('b', { text: t.name }),
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
