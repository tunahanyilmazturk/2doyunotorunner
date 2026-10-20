// Rünler: eşyaların yuvalarına takılan, birleştirilerek güçlenen taşlar.
//
// - Her rünün bir TÜRÜ (hangi stat) ve KADEMESİ (1..RUNE_GRADES) vardır.
// - Aynı tür ve kademeden RUNES_TO_COMBINE tane → bir üst kademeden bir tane.
// - Rün çantası (state.runes) KALICIDIR: yeniden doğuşta eşyalar silinse bile
//   takılı rünler çantaya geri döner. Uzun vadeli ilerlemenin bir ayağı budur.
// - Eşyanın yuva sayısı nadirliğe bağlıdır; Demirci'de altınla yeni yuva açılır.

export const RUNE_TYPES = [
  { id: 'ruby', name: 'Yakut', color: '#e0484f', stat: 'atkPct', base: 3 },
  { id: 'emerald', name: 'Zümrüt', color: '#3fc46a', stat: 'hpPct', base: 3 },
  { id: 'sapphire', name: 'Safir', color: '#4a8dff', stat: 'critDmg', base: 8 },
  { id: 'topaz', name: 'Topaz', color: '#f2c14e', stat: 'goldPct', base: 4 },
  { id: 'amethyst', name: 'Ametist', color: '#b066ff', stat: 'aspd', base: 1.5 },
  { id: 'onyx', name: 'Oniks', color: '#a9b3c1', stat: 'luck', base: 3 },
];

export const RUNE_MAP = Object.fromEntries(RUNE_TYPES.map((r) => [r.id, r]));
export const RUNE_IDS = RUNE_TYPES.map((r) => r.id);

export const RUNE_GRADES = 10;
export const GRADE_NAMES = ['Kırık', 'Yontulmuş', 'Parlak', 'Kusursuz', 'Asil', 'Kraliyet', 'Kadim', 'Efsanevi', 'İlahi', 'Yıldız'];

export const RUNES_TO_COMBINE = 3;

/** Nadirlik kademesine göre eşyanın alabileceği en fazla yuva (Sıradan → Mitik). */
export const MAX_SOCKETS_BY_TIER = [0, 1, 1, 2, 2, 3];

/** Rünün verdiği stat miktarı (yüzde). Kademe arttıkça hızlanarak büyür. */
export function runeValue(typeId, grade) {
  const t = RUNE_MAP[typeId];
  if (!t) return 0;
  return Math.round(t.base * grade * (1 + 0.15 * grade) * 10) / 10;
}

export const runeName = (typeId, grade) => `${GRADE_NAMES[grade - 1] ?? ''} ${RUNE_MAP[typeId]?.name ?? ''}`.trim();

/** Birleştirme maliyeti: kademe yükseldikçe pahalanır. */
export const combineCost = (grade) => Math.floor(400 * Math.pow(3.2, grade - 1));

/** Yeni yuva açma maliyeti: eşyanın değerine ve mevcut yuva sayısına bağlı. */
export const socketCost = (item) => Math.ceil(item.value * 4 * Math.pow(3, item.sockets?.length ?? 0));

/** Bölgeye göre düşen rünün kademesi (rastgelelik çağırana ait). */
export function runeGradeForStage(stage, roll = 0.5) {
  const base = Math.min(RUNE_GRADES - 2, 1 + Math.floor(stage / 12));
  return Math.min(RUNE_GRADES, base + (roll < 0.15 ? 1 : 0));
}

/** Boş rün çantası: tür → kademe başına adet dizisi (indeks 0 = 1. kademe). */
export const emptyRuneBag = () => Object.fromEntries(RUNE_IDS.map((id) => [id, new Array(RUNE_GRADES).fill(0)]));
