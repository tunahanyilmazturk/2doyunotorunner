// Sınıfa özel imza yetenekleri (data/classes.js → signature). Saf fonksiyonlar: CombatSystem çağırır.
// Her imza yalnızca kendi sınıfında etkilidir; sınıf yoksa tüm çarpanlar 1 / 0 döner.

/** Gelen hasar çarpanı: Siper gibi olasılıklı savunma (procced: şans tuttu mu). */
export function incomingMultiplier(sig, procced) {
  return sig?.id === 'block' && procced ? sig.factor : 1;
}

/** Ardışık vuruşlarda (n: 1'den başlayan saldırı sayacı) her `every`. vuruşa çarpan. */
export function burstMultiplier(sig, n) {
  return sig?.every && n % sig.every === 0 ? sig.mult : 1;
}

/** Can oranı eşiğin altındaki canavara karşı çarpan (Kurbanı Kovala). */
export function executeMultiplier(sig, hpRatio) {
  return sig?.id === 'execute' && hpRatio <= sig.threshold ? sig.mult : 1;
}

/** Her isabette iyileşme miktarı (Kutsama). */
export function blessingHeal(sig, maxHp) {
  return sig?.heal ? maxHp * sig.heal : 0;
}
