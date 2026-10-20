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
    id: 'warrior', name: 'Savaşçı', icon: 'class-warrior', cost: 0, gems: 0,
    desc: 'Dengeli dövüşçü. Kılıç, balta, çekiç, mızrak ve ağır zırh.',
    weaponKinds: ['sword', 'axe', 'hammer', 'spear'], armorClass: 'heavy',
    bonus: { hpPct: 5 }, bonusText: '+%5 can',
    look: { style: 'warrior', tunic: '#3f6ea8', hair: '#6b3e26', headgear: 'circlet', trim: '#c8b27a', accent: '#e0b84a' },
    attack: { style: 'melee', anim: 'swing', color: null },
    signature: { id: 'block', name: 'Siper', desc: '%15 şansla gelen hasarın yarısını engeller', chance: 0.15, factor: 0.5 },
    ability: { id: 'warCry', name: 'Savaş Narası', icon: 'ability-warCry', kind: 'buff', buffStat: 'atkPct', value: 40, duration: 10, cooldown: 30, color: '#ff8a3d', desc: '10 sn boyunca +%40 saldırı' },
  },
  {
    id: 'archer', name: 'Okçu', icon: 'class-archer', cost: 15, gems: 5,
    desc: 'Hızlı atışlar. Yay ve hafif zırh.',
    weaponKinds: ['bow'], armorClass: 'light',
    bonus: { aspd: 10 }, bonusText: '+%10 saldırı hızı',
    look: { style: 'archer', tunic: '#3f7a4a', hair: '#8a5a2b', headgear: 'hood', trim: '#2f5d3a', accent: '#a8cf73' },
    attack: { style: 'ranged', range: 300, shot: 'arrow', speed: 1000, anim: 'draw', color: '#e8d9a8' },
    signature: { id: 'volley', name: 'Delici Ok', desc: 'Her 5. ok 2 kat hasar verir', every: 5, mult: 2 },
    ability: { id: 'eagleEye', name: 'Kartal Gözü', icon: 'ability-eagleEye', kind: 'buff', buffStat: 'crit', value: 25, duration: 10, cooldown: 25, color: '#9fd46b', desc: '10 sn boyunca +25 kritik şansı' },
  },
  {
    id: 'mage', name: 'Büyücü', icon: 'class-mage', cost: 30, gems: 10,
    desc: 'Güçlü vuruşlar. Asa ve büyücü cübbesi.',
    weaponKinds: ['staff'], armorClass: 'robe',
    bonus: { atkPct: 10 }, bonusText: '+%10 saldırı',
    look: { style: 'mage', tunic: '#5a3a8a', hair: '#d8d2e6', headgear: 'hat', trim: '#3b2a6b', accent: '#c9a7ff' },
    attack: { style: 'ranged', range: 280, shot: 'orb', speed: 560, anim: 'cast', color: '#b98cf0' },
    signature: { id: 'surge', name: 'Büyü Dalgası', desc: 'Her 4. büyü 1,8 kat hasar verir', every: 4, mult: 1.8 },
    ability: { id: 'arcaneBlast', name: 'Arkana Patlaması', icon: 'ability-arcaneBlast', kind: 'strike', value: 4, cooldown: 12, color: '#b98cf0', desc: 'Hedefe saldırının 4 katı büyü hasarı' },
  },
  {
    id: 'assassin', name: 'Suikastçı', icon: 'class-assassin', cost: 45, gems: 15,
    desc: 'Kritik vuruşlar. Hançer ve deri zırh.',
    weaponKinds: ['dagger'], armorClass: 'leather',
    bonus: { crit: 8 }, bonusText: '+8 kritik şansı',
    look: { style: 'assassin', tunic: '#2a2a33', hair: '#1d1420', headgear: 'mask', trim: '#1a1a22', accent: '#a84b69' },
    attack: { style: 'melee', anim: 'dash', color: '#9aa3b8' },
    signature: { id: 'execute', name: 'Kurbanı Kovala', desc: 'Canı %30 altındaki canavara 1,5 kat hasar', threshold: 0.3, mult: 1.5 },
    ability: { id: 'shadowStep', name: 'Gölge Adımı', icon: 'ability-shadowStep', kind: 'buff', buffStat: 'dodge', value: 25, duration: 6, cooldown: 25, color: '#7d8aa8', desc: '6 sn boyunca +25 kaçınma' },
  },
  {
    id: 'healer', name: 'Şifacı', icon: 'class-healer', cost: 60, gems: 20,
    desc: 'Kendini ve yoldaşlarını ayakta tutar. Kutsal asa ve kutsal cüppe.',
    weaponKinds: ['scepter'], armorClass: 'vestment',
    bonus: { regen: 3 }, bonusText: '+3 can/sn yenilenme',
    look: { style: 'healer', tunic: '#e8e2c8', hair: '#f0d26a', headgear: 'halo', trim: '#ffd34d', accent: '#fff0a8' },
    attack: { style: 'melee', anim: 'holy', color: '#ffd34d' },
    signature: { id: 'blessing', name: 'Kutsama', desc: 'Her isabette maks canın %1,5\'ini iyileştirir', heal: 0.015 },
    ability: { id: 'sanctuary', name: 'Kutsal Sığınak', icon: 'ability-sanctuary', kind: 'buff', buffStat: 'regen', value: 8, duration: 12, cooldown: 40, color: '#ffe27a', desc: '12 sn boyunca +8 can/sn yenilenme' },
  },
];

export const CLASS_MAP = Object.fromEntries(CLASSES.map((c) => [c.id, c]));
export const CLASS_IDS = CLASSES.map((c) => c.id);
/** Sınıf yetenekleri (G tuşu); yalnızca o sınıf aktifken kullanılır. */
export const ABILITY_MAP = Object.fromEntries(CLASSES.map((c) => [c.ability.id, c.ability]));
