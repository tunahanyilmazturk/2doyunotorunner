// Aktif yetenekler. Seviye 0 = öğrenilmemiş. Yeniden doğuşta SIFIRLANMAZ.
// Açılma: unlockStage → o bölgeye ulaşınca altınla öğrenilir;
//         tree: true  → Ruh Ağacı'ndaki düğümle açılır (1. seviye bedava verilir).
//
// kind:  strike → anlık hasar, buff → süreli stat bonusu, heal → can yenileme,
//        meteor → büyük hasar + sersemletme (sadece Ruh Ağacı'ndan)
// value(level): yeteneğin etkisi (çarpan / yüzde)
// auto:  otomatik kullanımda ne zaman tetiklenir (bkz. SkillSystem.shouldAutoCast)

export const SKILLS = [
  {
    id: 'powerStrike', name: 'Güçlü Vuruş', icon: '💥', key: 'Q',
    kind: 'strike', unlockStage: 3, cooldown: 8,
    baseCost: 150, costGrowth: 1.6, maxLevel: 20,
    value: (l) => 3 + l * 0.5,
    describe: (v) => `Saldırı gücünün <b>${v.toFixed(1)} katı</b> hasar verir`,
    color: '#ffd23b',
  },
  {
    id: 'frenzy', name: 'Öfke', icon: '🔥', key: 'W',
    kind: 'buff', buffStat: 'aspd', unlockStage: 8, cooldown: 30, duration: 10,
    baseCost: 1500, costGrowth: 1.65, maxLevel: 20,
    value: (l) => 40 + l * 10,
    describe: (v, s) => `${s.duration} sn boyunca <b>+%${v}</b> saldırı hızı`,
    color: '#ff5a3a',
  },
  {
    id: 'goldRush', name: 'Altın Yağmuru', icon: '💰', key: 'E',
    kind: 'buff', buffStat: 'goldPct', tree: true, cooldown: 60, duration: 15,
    baseCost: 8000, costGrowth: 1.7, maxLevel: 20,
    value: (l) => 80 + l * 20,
    describe: (v, s) => `${s.duration} sn boyunca <b>+%${v}</b> altın kazancı`,
    color: '#ffd34d',
  },
  {
    id: 'divineHeal', name: 'İlahi Şifa', icon: '✨', key: 'R',
    kind: 'heal', tree: true, cooldown: 45,
    baseCost: 50000, costGrowth: 1.75, maxLevel: 20,
    value: (l) => 40 + l * 3,
    describe: (v) => `Maks. canın <b>%${v}</b> kadarını yeniler (oto: can %50 altındayken)`,
    color: '#6bff8f',
  },
  {
    id: 'meteor', name: 'Kıyamet Meteoru', icon: '☄️', key: 'T',
    kind: 'meteor', tree: true, cooldown: 90, stun: 3,
    baseCost: 200000, costGrowth: 1.8, maxLevel: 15,
    value: (l) => 20 + l * 4,
    describe: (v, s) => `Gökten meteor düşürür: saldırının <b>${Math.round(v)} katı</b> hasar ve ${s.stun} sn sersemletme`,
    color: '#ff7a2e',
  },
];

export const SKILL_MAP = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

export const skillCost = (skill, level) => Math.floor(skill.baseCost * Math.pow(skill.costGrowth, level));
