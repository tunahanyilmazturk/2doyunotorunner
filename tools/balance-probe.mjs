// Denge raporu: `node tools/balance-probe.mjs [başlangıç] [bitiş]`
// Ölçüm mantığı tools/balance-model.mjs içindedir; burası yalnızca yazdırır.
import { BOSS_TIME_LIMIT } from '../src/config/constants.js';
import { runStages, walls } from './balance-model.mjs';

const from = Number(process.argv[2]) || 1;
const to = Number(process.argv[3]) || 120;
// Duvarlar TÜM eğriden hesaplanır; tablo istenen aralığı gösterir.
const all = runStages(1, to);
const rows = all.filter((r) => r.stage >= from);

const fmt = (n, d = 1) => (Number.isFinite(n) ? n.toFixed(d) : '∞');
const pad = (s, w) => String(s).padStart(w);

console.log(`\n=== Otomatik alım senaryosu (sınıf/ekipman/yetenek yok) — bölge ${from}-${to} ===`);
console.log('Teorik senaryo: sınıf bonusu, ekipman, yetenek, iksir ve Ruh Ağacı yok; 10 normal kesim ve altınla otomatik en ucuz yükseltme varsayılır.\n');
console.log(
  pad('blg', 4) + pad('altın', 13) + pad('saldırı', 11) + pad('can', 11) + pad('zırh', 10) + pad('azlt', 7) +
  pad('TTK', 9) + pad('dayan', 9) + pad('bossTTK', 10) + pad('bossDayan', 11) + pad('bossSüre', 9)
);
for (const r of rows) {
  if (r.stage % 5 !== 0 && r.stage !== from) continue;
  console.log(
    pad(r.stage, 4) + pad(r.gold, 13) + pad(fmt(r.atk, 0), 11) + pad(fmt(r.maxHp, 0), 11) +
    pad(fmt(r.armor, 0), 10) + pad((r.damageReduction * 100).toFixed(1) + '%', 7) + pad(fmt(r.ttk, 1) + 'sn', 9) +
    pad(fmt(r.survive, 1) + 'sn', 9) +
    pad(r.bossTtk === null ? '—' : fmt(r.bossTtk, 1) + 'sn', 10) +
    pad(r.bossSurvive === null ? '—' : fmt(r.bossSurvive, 1) + 'sn', 11) +
    pad(r.bossTimeLimit === null ? '—' : fmt(r.bossTimeLimit, 0) + 'sn', 9)
  );
}

const w = walls(all);
console.log('\nDuvarlar (ilk görüldükleri bölge):');
console.log(`  boss sayacı yetersiz (bossTTK > bossSüre) → ${w.bossTimeout ?? '—'}`);
console.log(`  boss oyuncuyu öldürür (bossTTK > bossDayan) → ${w.bossDeath ?? '—'}`);
console.log(`  ilk boss engeli                            → ${w.bossBlock ?? '—'}`);
console.log(`  can dayanmaz (dayan < TTK)               → ${w.cannotSurvive ?? '—'}`);
console.log(`  normal kesim yavaş (TTK > 15 sn)          → ${w.slowKill ?? '—'}`);
console.log(`\nTemel süre limiti: ${BOSS_TIME_LIMIT} sn`);
if (w.bossBlock !== null && w.cannotSurvive !== null && w.bossBlock < w.cannotSurvive) {
  console.log('UYARI: boss karşılaşması normal can duvarından önce ilerlemeyi durduruyor.');
}
