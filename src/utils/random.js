export const rand = (min, max) => min + Math.random() * (max - min);
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
export const chance = (p) => Math.random() < p;
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** @param {() => number} rng testlerde sabit sonuç için değiştirilebilir */
export function weightedPick(entries, weightFn = (e) => e.weight, rng = Math.random) {
  const total = entries.reduce((sum, e) => sum + weightFn(e), 0);
  let r = rng() * total;
  for (const e of entries) {
    r -= weightFn(e);
    if (r <= 0) return e;
  }
  return entries[entries.length - 1];
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deterministik sözde-rastgele (arka plan süslemeleri için). */
export function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
