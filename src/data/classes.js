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
    id: 'warrior', name: 'Savaşçı', icon: '⚔️', cost: 0, gems: 0,
    desc: 'Dengeli dövüşçü. Kılıç, balta, çekiç, mızrak ve ağır zırh.',
    weaponKinds: ['sword', 'axe', 'hammer', 'spear'], armorClass: 'heavy',
    bonus: { hpPct: 5 }, bonusText: '+%5 can',
    look: { tunic: '#3f6ea8', hair: '#6b3e26', headgear: 'none', trim: '#c8b27a' },
    attack: { style: 'melee', anim: 'swing', color: null },
  },
  {
    id: 'archer', name: 'Okçu', icon: '🏹', cost: 15, gems: 5,
    desc: 'Hızlı atışlar. Yay ve hafif zırh.',
    weaponKinds: ['bow'], armorClass: 'light',
    bonus: { aspd: 10 }, bonusText: '+%10 saldırı hızı',
    look: { tunic: '#3f7a4a', hair: '#8a5a2b', headgear: 'hood', trim: '#2f5d3a' },
    attack: { style: 'ranged', range: 300, shot: 'arrow', speed: 1000, anim: 'draw', color: '#e8d9a8' },
  },
  {
    id: 'mage', name: 'Büyücü', icon: '🪄', cost: 30, gems: 10,
    desc: 'Güçlü vuruşlar. Asa ve büyücü cübbesi.',
    weaponKinds: ['staff'], armorClass: 'robe',
    bonus: { atkPct: 10 }, bonusText: '+%10 saldırı',
    look: { tunic: '#5a3a8a', hair: '#d8d2e6', headgear: 'hat', trim: '#3b2a6b' },
    attack: { style: 'ranged', range: 280, shot: 'orb', speed: 560, anim: 'cast', color: '#b98cf0' },
  },
  {
    id: 'assassin', name: 'Suikastçı', icon: '🗡️', cost: 45, gems: 15,
    desc: 'Kritik vuruşlar. Hançer ve deri zırh.',
    weaponKinds: ['dagger'], armorClass: 'leather',
    bonus: { crit: 8 }, bonusText: '+8 kritik şansı',
    look: { tunic: '#2a2a33', hair: '#1d1420', headgear: 'mask', trim: '#1a1a22' },
    attack: { style: 'melee', anim: 'dash', color: '#9aa3b8' },
  },
  {
    id: 'healer', name: 'Şifacı', icon: '✨', cost: 60, gems: 20,
    desc: 'Kendini ve yoldaşlarını ayakta tutar. Kutsal asa ve kutsal cüppe.',
    weaponKinds: ['scepter'], armorClass: 'vestment',
    bonus: { regen: 3 }, bonusText: '+3 can/sn yenilenme',
    look: { tunic: '#e8e2c8', hair: '#f0d26a', headgear: 'halo', trim: '#ffd34d' },
    attack: { style: 'melee', anim: 'holy', color: '#ffd34d' },
  },
];

export const CLASS_MAP = Object.fromEntries(CLASSES.map((c) => [c.id, c]));
export const CLASS_IDS = CLASSES.map((c) => c.id);
