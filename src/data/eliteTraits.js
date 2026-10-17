// Elit canavarlara rastgele verilen özellikler. Her elit tam olarak bir özellik taşır;
// özellik canavarın adına eklenir ("Zırhlı Kurt"), parıltı rengini ve davranışını belirler.
// apply(monster): Monster oluşturulurken bir kez çağrılır.

export const ELITE_TRAITS = [
  {
    id: 'swift', name: 'Hızlı', icon: '💨', color: '#7fe3ff',
    desc: 'Daha hızlı saldırır ve koşar',
    apply: (m) => {
      m.atkSpeed *= 1.6;
      m.speed *= 1.5;
    },
  },
  {
    id: 'giant', name: 'Dev', icon: '⛰️', color: '#d9a55b',
    desc: 'Daha büyük ve dayanıklı',
    apply: (m) => {
      m.maxHp *= 1.6;
      m.hp = m.maxHp;
      m.scale *= 1.2;
      m.size *= 1.2;
    },
  },
  {
    id: 'armored', name: 'Zırhlı', icon: '🛡️', color: '#c9d2de',
    desc: 'Aldığı hasar %45 azalır',
    apply: (m) => {
      m.damageTaken = 0.55;
    },
  },
  {
    id: 'vampiric', name: 'Vampir', icon: '🩸', color: '#e0485a',
    desc: 'Verdiği hasarın yarısı kadar iyileşir',
    apply: (m) => {
      m.lifesteal = 0.5;
    },
  },
  {
    id: 'berserk', name: 'Çılgın', icon: '😡', color: '#ff7a3a',
    desc: '%50 daha sert vurur',
    apply: (m) => {
      m.atk *= 1.5;
    },
  },
  {
    id: 'golden', name: 'Altın', icon: '💰', color: '#f2c14e',
    desc: '3 kat altın düşürür',
    apply: (m) => {
      m.gold *= 3;
    },
  },
];
