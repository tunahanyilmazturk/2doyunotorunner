import { BOSSES } from './monsters.js';
import { runeGradeForStage } from './runes.js';

// Boss Kulesi: ana koşudan bağımsız, kat kat zorlaşan boss mücadelesi.
//
// - Her giriş bir HAK harcar (günde TOWER_DAILY_ATTEMPTS hak + görevlerden anahtar).
// - Giriş, en yüksek geçilen katın bir üstünden başlar; kaybedene kadar tırmanılır.
// - Ödül yalnızca İLK KEZ geçilen katlar için verilir (rekor = state.tower.best).
// - Kuledeyken ana bölge ilerlemesi donar; ölmek bölge kaybettirmez.

export const TOWER_DAILY_ATTEMPTS = 3;
/** Kule, ana koşuda bu bölgeye ulaşınca açılır (1. kat bossu bölge 6 gücündedir) */
export const TOWER_UNLOCK_STAGE = 10;
export const TOWER_TIME = 30; // kat başına saniye (Ruh Ağacı "Zaman Kazanımı" eklenir)

const BOSS_IDS = Object.keys(BOSSES);

/** Katın denk geldiği bölge seviyesi (canavar ölçeklemesi için) */
export const towerStage = (floor) => 4 + floor * 2;

/** Katın bossu: tüm bosslar sırayla döner */
export const towerBossId = (floor) => BOSS_IDS[(floor - 1) % BOSS_IDS.length];

/** Kule bossları normal bossa göre biraz daha dayanıklıdır */
export const TOWER_HP_MULT = 1.3;

/**
 * İlk kez geçilen katın ödülleri (rewards.js biçiminde).
 * Her kat Ruh + rün; her 5. kat yumurta; her 10. kat büyük Ruh paketi.
 */
export function floorRewards(floor) {
  const rewards = [
    { type: 'souls', amount: 2 + floor },
    { type: 'rune', grade: runeGradeForStage(towerStage(floor)), amount: 1 },
  ];
  if (floor % 5 === 0) rewards.push({ type: 'egg', amount: 1 });
  if (floor % 10 === 0) rewards.push({ type: 'souls', amount: 10 * floor });
  return rewards;
}
