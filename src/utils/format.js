const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

export function formatNumber(n) {
  if (!Number.isFinite(n)) return '∞';
  const sign = n < 0 ? '-' : '';
  n = Math.abs(n);
  if (n < 1000) {
    return sign + (n < 10 && n % 1 !== 0 ? n.toFixed(1) : Math.floor(n).toString());
  }
  const tier = Math.floor(Math.log10(n) / 3);
  if (tier >= SUFFIXES.length) return sign + n.toExponential(2);
  const scaled = n / Math.pow(1000, tier);
  const digits = scaled < 10 ? 2 : scaled < 100 ? 1 : 0;
  return sign + scaled.toFixed(digits) + SUFFIXES[tier];
}

export function formatTime(seconds) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}sa ${m}dk`;
  if (m) return `${m}dk ${sec}sn`;
  return `${sec}sn`;
}

export function formatPercent(v) {
  return `${Number.isInteger(v) ? v : v.toFixed(1)}%`;
}
