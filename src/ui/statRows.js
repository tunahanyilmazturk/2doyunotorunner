import { Balance } from '../config/balance.js';
import { formatNumber, formatPercent } from '../utils/format.js';

/**
 * Oyuncunun nihai statlarını [etiket, değer] satırları olarak döndürür.
 * Karakter statları modalında gösterilir; sıfır olan özel statlar gizlenir.
 */
export function buildStatRows(game) {
  const s = game.stats.get();
  const reduction = Balance.armorReduction(s.armor, game.state.stage) * 100;
  const pct = (v) => formatPercent(+(v * 100).toFixed(1));
  return [
    ['🔥 Toplam DPS', formatNumber(s.dps)],
    ['⚔️ Saldırı', formatNumber(s.atk)],
    ['❤️ Can', formatNumber(s.maxHp)],
    ['🛡️ Zırh', `${formatNumber(s.armor)} (−${reduction.toFixed(0)}%)`],
    ['💨 Saldırı Hızı', `${s.attackSpeed.toFixed(2)}/sn`],
    ['🎯 Kritik', `${pct(s.critChance)} · x${s.critMult.toFixed(2)}`],
    ['💚 Yenilenme', `${formatNumber(s.regen)}/sn`],
    s.lifesteal > 0 && ['🩸 Can Çalma', pct(s.lifesteal)],
    s.dodgeChance > 0 && ['🌀 Kaçınma', pct(s.dodgeChance)],
    s.thorns > 0 && ['🌵 Diken', pct(s.thorns)],
    s.bossDmgMult > 1 && ['👑 Boss Hasarı', `x${s.bossDmgMult.toFixed(2)}`],
    ['💰 Altın', `x${s.goldMult.toFixed(2)}`],
    ['🍀 Şans', formatPercent(+s.luck.toFixed(1))],
  ].filter(Boolean);
}
