// Yeni sistemlerin denge raporu: `node tools/systems-probe.mjs`
// Oyuncu gücü balance-model.mjs'deki teorik otomatik alım eğrisinden gelir:
// sınıf, ekipman, yetenek, iksir, Ruh Ağacı ve elitler modellenmez.
import { BOSS_EVERY, KILLS_PER_STAGE } from '../src/config/constants.js';
import { Balance } from '../src/config/balance.js';
import { BOSSES } from '../src/data/monsters.js';
import { BOSS_EGG_CHANCE, EGG_HATCH_KILLS } from '../src/data/companions.js';
import { TOWER_HP_MULT, TOWER_TIME, TOWER_UNLOCK_STAGE, towerBossId, towerStage } from '../src/data/tower.js';
import { runeGradeForStage } from '../src/data/runes.js';
import { runStages } from './balance-model.mjs';

const PLAYER_STAGES = [10, 20, 30, 40, 60, 90, 120];
const MAX_FLOOR = 60;
const fmt = (n, d = 1) => (Number.isFinite(n) ? n.toFixed(d) : '∞');
const pad = (s, w) => String(s).padStart(w);

const rows = runStages(1, Math.max(...PLAYER_STAGES));
const at = (stage) => rows.find((r) => r.stage === stage);

// 1) KULE: kulede oyuncu canı katlar arasında taşındığından süre ve hayatta kalma birlikte izlenir.
console.log(`\n=== Boss Kulesi: oyuncu bölgesine göre ulaşılabilen en yüksek kat (süre ${TOWER_TIME} sn) ===`);
console.log('Ekipman/yetenek/iksir yok; katlar arası %30 can yenilemesi hesaba katılır.\n');
console.log(pad('oyuncu', 8) + pad('DPS', 10) + pad('son geçilen kat', 20) + pad('kat 1 TTK', 12) + pad('kat 1 dayan', 13));
for (const S of PLAYER_STAGES) {
  const r = at(S);
  const netRateFor = (boss, stage) => {
    const armor = Balance.armorReduction(r.armor, S);
    const regular = 1 - armor;
    const heavy = Balance.heavyMult.boss * (1 - armor * Balance.heavyArmorFactor);
    const attackFactor = ((Balance.heavyEvery.boss - 1) * regular + heavy) / Balance.heavyEvery.boss;
    const incoming = Balance.monsterAtk(boss.atk, stage) * Balance.cycleAtkMultiplier(stage) * Balance.bossAtkMult * boss.atkSpeed * attackFactor * (1 - r.dodgeChance);
    const healing = r.regen + r.lifesteal * r.dps * r.bossDmgMult;
    return incoming - healing;
  };
  let wall = null;
  let hp = r.maxHp;
  for (let f = 1; f <= MAX_FLOOR; f++) {
    const boss = BOSSES[towerBossId(f)];
    const stage = towerStage(f);
    const ttk = (Balance.monsterHp(boss.hp, stage) * Balance.cycleHpMultiplier(stage) * Balance.bossHpMult * TOWER_HP_MULT) / (r.dps * r.bossDmgMult);
    const netRate = netRateFor(boss, stage);
    const survive = netRate <= 0 ? Infinity : hp / netRate;
    if (ttk > TOWER_TIME || ttk > survive) { wall = f; break; }
    hp = Math.min(r.maxHp, hp - netRate * ttk + r.maxHp * 0.3);
  }
  const b1 = BOSSES[towerBossId(1)];
  const floorStage = towerStage(1);
  const ttk1 = (Balance.monsterHp(b1.hp, floorStage) * Balance.cycleHpMultiplier(floorStage) * Balance.bossHpMult * TOWER_HP_MULT) / (r.dps * r.bossDmgMult);
  const rate1 = netRateFor(b1, floorStage);
  const survive1 = rate1 <= 0 ? Infinity : r.maxHp / rate1;
  console.log(
    pad(S, 8) + pad(fmt(r.dps, 0), 10) + pad(wall ? `${wall - 1}. kat` : `>=${MAX_FLOOR}`, 20) +
    pad(fmt(ttk1, 1) + 'sn', 12) + pad(fmt(survive1, 1) + 'sn', 13)
  );
}
console.log(`\nKilit: ${TOWER_UNLOCK_STAGE}. bölge. Kat 1 bossu bölge ${towerStage(1)} gücünde.`);
console.log('Tahmin ekipman, yetenek, iksir ve sınıf imza etkilerini içermez.');

// 2) RÜN: bölge başına beklenen rün sayısı ve kademe
console.log('\n=== Rün üretimi (bölge başına beklenen) ===');
const normalKills = KILLS_PER_STAGE;
for (const S of [10, 30, 60, 120]) {
  const elite = Balance.eliteChance(S) ?? 0;
  const normal = normalKills * (1 - elite) * 0.03;
  const eliteRunes = normalKills * elite * 0.25;
  const bossRunes = 1 + 0.35; // boss her zaman düşürür, %35 ihtimalle iki tane
  const perStage = normal + eliteRunes + (S % BOSS_EVERY === 0 ? bossRunes : 0);
  console.log(`bölge ${pad(S, 3)}: ~${fmt(perStage, 2)} rün, tipik kademe ${runeGradeForStage(S, 0.5)}`);
}
console.log('Not: boss rünü her 5. bölgede gelir; ortalama bölge başına katkısı ~1/5 oranındadır.');

// 3) YOLDAŞ: yumurta ve çatlama hızı
const bossEggChance = BOSS_EGG_CHANCE;
const perBossIncubation = 5; // boss öldürmesi kuluçkaya 5 sayılır
const perStageIncubation = KILLS_PER_STAGE + perBossIncubation / BOSS_EVERY; // 10 normal öldürme + her 5 bölgede boss (5)
const stagesPerHatch = EGG_HATCH_KILLS / perStageIncubation;
const stagesPerEgg = BOSS_EVERY / bossEggChance;
console.log('\n=== Yoldaş (yumurta) ===');
console.log(`Kuluçka: bölge başına ~${fmt(perStageIncubation, 0)} ilerleme → ${fmt(stagesPerHatch, 1)} bölgede bir çatlama (yumurta varsa).`);
console.log(`Yumurta: boss başına %${bossEggChance * 100} → ortalama ${fmt(stagesPerEgg, 0)} bölgede bir yumurta.`);
console.log(`Yani yumurta, kuluçkanın çatlamasından ${fmt(stagesPerEgg / stagesPerHatch, 1)} kat yavaş; yoldaş arzı yumurta ile sınırlı.`);

// 4) RUH EKONOMİSİ: kule ilk geçişleri ve günlük görevler, prestij ruhlarıyla karşılaştırılır
import { floorRewards } from '../src/data/tower.js';
import { QUEST_TEMPLATES } from '../src/data/quests.js';
import { Balance as Bal } from '../src/config/balance.js';

let towerSouls = 0;
for (let f = 1; f <= 30; f++) towerSouls += floorRewards(f).filter((r) => r.type === 'souls').reduce((a, r) => a + r.amount, 0);
console.log('\n=== Ruh ekonomisi ===');
console.log(`Kule ilk geçişleri (1-30. kat, toplam, tek seferlik): ${towerSouls} ruh`);
for (const best of [30, 60, 100]) {
  const soulQuests = QUEST_TEMPLATES.filter((q) => q.reward(best).type === 'souls');
  const avg = soulQuests.reduce((a, q) => a + q.reward(best).amount, 0) / soulQuests.length;
  console.log(`bölge ${pad(best, 3)}: günlük görevler ~${fmt(avg * 3, 0)} ruh/gün · prestij (o bölgede tek koşu) ${Bal.prestigeSouls(best)} ruh`);
}
