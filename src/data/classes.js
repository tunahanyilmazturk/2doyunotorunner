// Karakter sınıfları. Her sınıf kendi silah türlerini ve zırh sınıfını kuşanır;
// diğer sınıfların eşyaları o sınıfta kuşanılamaz (envanterde durur).
//
// - Sınıf açmak için Kule Mührü (state.seals) harcanır; Boss Kulesi'nde her kat geçişi 1 mühür verir.
// - Açılmış sınıflar arasında geçiş ücretsizdir; her sınıfın ekipman seti ayrı saklanır.
// - Ekipman setleri yeniden doğuşta silinir (koşuya ait eşyalar); açılan sınıflar kalır.
// - bonus: sınıfta aktifken uygulanan sabit stat bonusu (StatsSystem okur).

export const DEFAULT_CLASS = 'warrior';

/** Zırh sınıfları: zırh slotlarındaki (kask, zırh, eldiven, çizme) eşyaların kullanım kısıtı */
export const ARMOR_CLASSES = {
  heavy: { name: 'Ağır Zırh' },
  light: { name: 'Hafif Zırh' },
  robe: { name: 'Cübbe' },
  leather: { name: 'Deri' },
  vestment: { name: 'Kutsal Cüppe' },
};
export const ARMOR_CLASS_IDS = Object.keys(ARMOR_CLASSES);
/** Zırh sınıfı taşıyabilen yuvalar; diğer yuvalar (kolye, kalkan, pelerin, kemer, yüzük) herkese açık */
export const ARMOR_SLOTS = ['helmet', 'armor', 'gloves', 'boots'];

export const CLASSES = [
  {
    id: 'warrior', name: 'Savaşçı', icon: '⚔️', cost: 0,
    desc: 'Dengeli dövüşçü. Kılıç, balta, çekiç, mızrak ve ağır zırh.',
    weaponKinds: ['sword', 'axe', 'hammer', 'spear'], armorClass: 'heavy',
    bonus: { hpPct: 5 }, bonusText: '+%5 can',
  },
  {
    id: 'archer', name: 'Okçu', icon: '🏹', cost: 15,
    desc: 'Hızlı atışlar. Yay ve hafif zırh.',
    weaponKinds: ['bow'], armorClass: 'light',
    bonus: { aspd: 10 }, bonusText: '+%10 saldırı hızı',
  },
  {
    id: 'mage', name: 'Büyücü', icon: '🪄', cost: 30,
    desc: 'Güçlü vuruşlar. Asa ve büyücü cübbesi.',
    weaponKinds: ['staff'], armorClass: 'robe',
    bonus: { atkPct: 10 }, bonusText: '+%10 saldırı',
  },
  {
    id: 'assassin', name: 'Suikastçı', icon: '🗡️', cost: 45,
    desc: 'Kritik vuruşlar. Hançer ve deri zırh.',
    weaponKinds: ['dagger'], armorClass: 'leather',
    bonus: { crit: 8 }, bonusText: '+8 kritik şansı',
  },
  {
    id: 'healer', name: 'Şifacı', icon: '✨', cost: 60,
    desc: 'Kendini ve yoldaşlarını ayakta tutar. Kutsal asa ve kutsal cüppe.',
    weaponKinds: ['scepter'], armorClass: 'vestment',
    bonus: { regen: 3 }, bonusText: '+3 can/sn yenilenme',
  },
];

export const CLASS_MAP = Object.fromEntries(CLASSES.map((c) => [c.id, c]));
export const CLASS_IDS = CLASSES.map((c) => c.id);
