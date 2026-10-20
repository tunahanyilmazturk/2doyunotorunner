// Denge modeli: oyunun gerçek formüllerini (balance.js, upgrades.js, monsters.js)
// kullanarak bir "otomatik alım" oyuncusunun bölge bölge gücünü hesaplar.
//
// Neden ayrı bir modül? `tools/balance-probe.mjs` insan için rapor üretir,
// `test/balance-curve.test.js` ise eğrinin bozulmadığını doğrular. İkisi de
// buradaki tek tanımı kullanır; formül iki yerde tekrarlanmaz.
//
// Sınırlar: sınıf bonusu/imzası, ekipman, yetenek, iksir, elit canavar ve çevrimdışı kazanç modellenmez.
// Her bölgenin 10 normal öldürmesi ve varsa boss ganimeti bölge sonu geliri olarak
// varsayılır; bu nedenle model bir denge senaryosudur, gerçek koşunun garantisi değildir.
import { BOSS_EVERY, KILLS_PER_STAGE } from '../src/config/constants.js';
import { Balance, PLAYER_BASE } from '../src/config/balance.js';
import { getBiome } from '../src/data/biomes.js';
import { MONSTERS, BOSSES } from '../src/data/monsters.js';
import { UPGRADES, upgradeCost, upgradeValue } from '../src/data/upgrades.js';

/** Bölgedeki canavarların ortalama taban değerleri (1. bölge ölçeğinde). */
export function avgMonster(stage) {
  const defs = getBiome(stage).monsters.map((id) => MONSTERS[id]);
  const mean = (f) => defs.reduce((sum, d) => sum + f(d), 0) / defs.length;
  return { hp: mean((d) => d.hp), atk: mean((d) => d.atk), atkSpeed: mean((d) => d.atkSpeed), gold: mean((d) => d.gold) };
}

/** O bölgede karşılaşılacak boss tanımı. */
export function bossDef(stage) {
  const biome = getBiome(stage);
  return BOSSES[biome.bosses[stage % 10 === 0 ? 1 : 0]];
}

/** StatsSystem.recalculate ile aynı toplama; ekipman/yetenek/iksir yok. */
export function playerStats(levels, stage, opts = {}) {
  const { soulsEarned = 0, achievements = 0, tree = {} } = opts;
  const raw = { ...PLAYER_BASE };
  for (const up of UPGRADES) raw[up.stat] = (raw[up.stat] || 0) + upgradeValue(up, levels[up.id] || 0);
  for (const [key, value] of Object.entries(tree)) {
    // Ruh Ağacı'nın atkPct/hpPct/goldPct değerleri ayrı çarpan olarak uygulanır.
    if (!['atkPct', 'hpPct', 'goldPct'].includes(key)) raw[key] = (raw[key] || 0) + value;
  }
  const soulPower = 1 + soulsEarned * Balance.soulPowerBonus;
  const achMult = 1 + achievements * Balance.achievementBonus;
  const s = {
    atk: raw.atk * (1 + raw.atkPct / 100) * soulPower * (1 + (tree.atkPct || 0) / 100) * achMult,
    maxHp: raw.hp * (1 + raw.hpPct / 100) * soulPower * (1 + (tree.hpPct || 0) / 100),
    armor: raw.armor,
    regen: raw.regen,
    attackSpeed: Math.min(Balance.maxAttackSpeed, raw.attackSpeed * (1 + raw.aspd / 100)),
    critChance: Math.min(100, raw.crit) / 100,
    critMult: raw.critDmg / 100,
    goldMult: (1 + raw.goldPct / 100) * soulPower * (1 + (tree.goldPct || 0) / 100) * achMult,
    lifesteal: Math.min(Balance.maxLifesteal, raw.lifesteal) / 100,
    dodgeChance: Math.min(Balance.maxDodge, raw.dodge) / 100,
    bossDmgMult: 1 + raw.bossDmg / 100,
  };
  s.dps = s.atk * s.attackSpeed * (1 + s.critChance * (s.critMult - 1));
  s.damageReduction = Balance.armorReduction(s.armor, stage);
  return s;
}

/** UpgradeSystem.update ile aynı politika: alınabilen en ucuz yükseltmeyi sürekli al. */
export function autoBuy(gold, levels) {
  for (let guard = 0; guard < 500; guard++) {
    let best = null;
    let bestCost = Infinity;
    for (const up of UPGRADES) {
      if (up.maxLevel !== undefined && (levels[up.id] || 0) >= up.maxLevel) continue;
      const cost = Math.ceil(upgradeCost(up, levels[up.id] || 0));
      if (cost < bestCost) {
        best = up;
        bestCost = cost;
      }
    }
    if (!best || bestCost > gold) return gold;
    gold -= bestCost;
    levels[best.id] = (levels[best.id] || 0) + 1;
  }
  return gold;
}

/**
 * Bölge bölge ilerleyerek ölçüm satırları üretir.
 * Hesaplama her zaman 1. bölgeden başlar (altın ve yükseltmeler birikir);
 * `from` yalnızca hangi satırların döndürüleceğini belirler. Aksi halde
 * 60. bölgeden başlayan bir ölçüm, yükseltmesiz bir oyuncuyu ölçerdi.
 */
export function runStages(from, to, opts = {}) {
  const levels = Object.fromEntries(UPGRADES.map((u) => [u.id, 0]));
  let gold = 0;
  const rows = [];
  for (let stage = 1; stage <= to; stage++) {
    const m = avgMonster(stage);
    const stats = playerStats(levels, stage, opts);
    const cycleHp = Balance.cycleHpMultiplier(stage);
    const cycleAtk = Balance.cycleAtkMultiplier(stage);
    const cycleGold = Balance.cycleGoldMultiplier(stage);
    const incoming = Balance.monsterAtk(m.atk, stage) * cycleAtk * m.atkSpeed * (1 - stats.damageReduction) * (1 - stats.dodgeChance);
    const healing = stats.regen + stats.lifesteal * stats.dps;
    // İyileşme gelen hasarı geçiyorsa oyuncu bu bölgede ölemez.
    const survive = healing >= incoming ? Infinity : stats.maxHp / (incoming - healing);
    const ttk = Balance.monsterHp(m.hp, stage) * cycleHp / stats.dps;
    const boss = stage % BOSS_EVERY === 0 ? bossDef(stage) : null;

    const bossTtk = boss
      ? (Balance.monsterHp(boss.hp, stage) * cycleHp * Balance.bossHpMult) / (stats.dps * stats.bossDmgMult)
      : null;
    // Bossların her 4. vuruşu ağırdır; ortalama hasara bu döngüyü de kat.
    const bossReduction = stats.damageReduction;
    const bossNormalDamage = 1 - bossReduction;
    const bossHeavyDamage = Balance.heavyMult.boss * (1 - bossReduction * Balance.heavyArmorFactor);
    const bossAttackFactor = boss
      ? ((Balance.heavyEvery.boss - 1) * bossNormalDamage + bossHeavyDamage) / Balance.heavyEvery.boss
      : null;
    const bossIncoming = boss
      ? Balance.monsterAtk(boss.atk, stage) * cycleAtk * Balance.bossAtkMult * boss.atkSpeed * bossAttackFactor * (1 - stats.dodgeChance)
      : null;
    const bossHealing = boss ? stats.regen + stats.lifesteal * stats.dps * stats.bossDmgMult : null;
    const bossSurvive = boss
      ? bossHealing >= bossIncoming ? Infinity : stats.maxHp / (bossIncoming - bossHealing)
      : null;
    if (stage >= from) rows.push({
      stage, gold: Math.floor(gold), levels: { ...levels }, atk: stats.atk, maxHp: stats.maxHp,
      armor: stats.armor, damageReduction: stats.damageReduction, dps: stats.dps,
      regen: stats.regen, lifesteal: stats.lifesteal, dodgeChance: stats.dodgeChance, bossDmgMult: stats.bossDmgMult,
      monsterHp: Balance.monsterHp(m.hp, stage) * cycleHp, monsterDps: incoming, ttk, survive,
      bossTtk, bossSurvive, bossDps: bossIncoming, bossTimeLimit: boss ? Balance.bossTimeLimit(stage) : null,
    });

    // Ödüller ancak bölge sonu hesaplandıktan sonra kullanılabilir. Bu senaryo
    // 10 normal öldürmeyi varsayar; boss ganimeti de ancak süre içinde yenilirse gelir.
    gold += Math.max(1, Math.round(Balance.monsterGold(m.gold, stage) * cycleGold * stats.goldMult)) * KILLS_PER_STAGE;
    if (boss && bossTtk <= Balance.bossTimeLimit(stage) && bossTtk <= bossSurvive) {
      gold += Math.max(1, Math.round(Balance.monsterGold(boss.gold, stage) * cycleGold * Balance.bossGoldMult * stats.goldMult));
    }
    gold = autoBuy(gold, levels);
  }
  return rows;
}

/**
 * Duvarlar: oyunun gerçekten durduğu ilk bölgeler.
 * Boss süresi, boss hasarı ve normal düşman duvarlarını ayrı ayrı gösterir.
 */
export function walls(rows) {
  const bossDeath = rows.find((r) => r.bossTtk !== null && r.bossTtk > r.bossSurvive)?.stage ?? null;
  const bossTimeout = rows.find((r) => r.bossTtk !== null && r.bossTtk > r.bossTimeLimit)?.stage ?? null;
  return {
    bossTimeout,
    bossDeath,
    bossBlock: [bossTimeout, bossDeath].filter((stage) => stage !== null).sort((a, b) => a - b)[0] ?? null,
    cannotSurvive: rows.find((r) => r.survive < r.ttk)?.stage ?? null,
    slowKill: rows.find((r) => r.ttk > 15)?.stage ?? null,
  };
}
