// Kuşanılabilir eşya yuvaları ve taban eşyalar.
// primary: her eşyada garanti bulunan ana stat. affixPool: ekstra stat havuzu.
// tiers: seviyeye göre açılan taban isimler (minLevel <= eşya seviyesi olan en yükseği seçilir).
// Silahların ayrıca türleri (kinds) vardır: her tür kendi isimlerini, ana stat çarpanını,
// garanti ek statını ve karakter üzerindeki görünümünü belirler.

export const SLOTS = {
  helmet: { name: 'Kask', icon: '🪖' },
  amulet: { name: 'Kolye', icon: '📿' },
  cape: { name: 'Pelerin', icon: '🧣' },
  weapon: { name: 'Silah', icon: '⚔️' },
  shield: { name: 'Kalkan', icon: '🛡️' },
  armor: { name: 'Zırh', icon: '🦺' },
  gloves: { name: 'Eldiven', icon: '🧤' },
  belt: { name: 'Kemer', icon: '🪢' },
  ring: { name: 'Yüzük', icon: '💍' },
  boots: { name: 'Çizme', icon: '👢' },
};

/** Ekipman ızgarasındaki sıra (5 sütun × 2 satır) */
export const SLOT_ORDER = ['helmet', 'amulet', 'cape', 'weapon', 'shield', 'armor', 'gloves', 'belt', 'ring', 'boots'];

const LEVELS = [1, 6, 14, 25, 40, 60, 85];
const tiersFrom = (names) => names.map((name, i) => ({ minLevel: LEVELS[i], name }));

export const WEAPON_KINDS = {
  sword: {
    name: 'Kılıç', icon: '🗡️', weight: 3, primaryMult: 1.4, guaranteed: [],
    tiers: tiersFrom(['Paslı Kılıç', 'Demir Kılıç', 'Çelik Kılıç', 'Rün Kılıcı', 'Mithril Kılıç', 'Ejder Dişi', 'Yıldız Kılıcı']),
  },
  axe: {
    name: 'Balta', icon: '🪓', weight: 2, primaryMult: 1.55, guaranteed: ['critDmg'],
    tiers: tiersFrom(['Odun Baltası', 'Demir Balta', 'Savaş Baltası', 'Rün Baltası', 'Mithril Balta', 'Ejder Baltası', 'Yıldız Baltası']),
  },
  hammer: {
    name: 'Çekiç', icon: '🔨', weight: 1.5, primaryMult: 1.8, guaranteed: ['bossDmg'],
    tiers: tiersFrom(['Tokmak', 'Demir Gürz', 'Savaş Çekici', 'Rün Çekici', 'Mithril Çekiç', 'Ejder Çekici', 'Yıldız Çekici']),
  },
  spear: {
    name: 'Mızrak', icon: '🔱', weight: 1.5, primaryMult: 1.35, guaranteed: ['crit'],
    tiers: tiersFrom(['Sivri Sopa', 'Demir Mızrak', 'Süvari Mızrağı', 'Rün Mızrağı', 'Mithril Mızrak', 'Ejder Mızrağı', 'Yıldız Mızrağı']),
  },
  dagger: {
    name: 'Hançer', icon: '🔪', weight: 1.5, primaryMult: 1.1, guaranteed: ['aspd'],
    tiers: tiersFrom(['Paslı Hançer', 'Demir Hançer', 'Suikastçı Hançeri', 'Rün Hançeri', 'Mithril Hançer', 'Ejder Pençesi', 'Yıldız Hançeri']),
  },
  bow: {
    name: 'Yay', icon: '🏹', weight: 1.5, primaryMult: 1.3, guaranteed: ['dodge'],
    tiers: tiersFrom(['Odun Yay', 'Av Yayı', 'Uzun Yay', 'Rün Yayı', 'Mithril Yay', 'Ejder Kemiği Yay', 'Yıldız Yayı']),
  },
  staff: {
    name: 'Asa', icon: '🪄', weight: 1, primaryMult: 1.7, guaranteed: ['regen'],
    tiers: tiersFrom(['Dal Asa', 'Meşe Asa', 'Büyücü Asası', 'Rün Asası', 'Mithril Asa', 'Ejder Gözü Asa', 'Yıldız Asası']),
  },
  scepter: {
    name: 'Kutsal Asa', icon: '⚜️', weight: 1, primaryMult: 1.5, guaranteed: ['hpPct'],
    tiers: tiersFrom(['Kutsal Dal', 'Kutsal Değnek', 'Rahip Asası', 'Rün Değneği', 'Mithril Değnek', 'Ejder Kutsal Asası', 'Yıldız Değneği']),
  },
};

export const ITEM_BASES = {
  weapon: {
    primary: 'atk',
    affixPool: ['atkPct', 'aspd', 'crit', 'critDmg', 'lifesteal', 'bossDmg'],
    tiers: WEAPON_KINDS.sword.tiers,
  },
  helmet: {
    primary: 'hp',
    affixPool: ['armor', 'hpPct', 'regen', 'luck'],
    tiers: tiersFrom(['Deri Başlık', 'Demir Miğfer', 'Çelik Miğfer', 'Şövalye Miğferi', 'Mithril Taç', 'Ejder Miğferi', 'Yıldız Tacı']),
  },
  armor: {
    primary: 'armor',
    affixPool: ['hp', 'hpPct', 'regen', 'lifesteal', 'thorns'],
    tiers: tiersFrom(['Kumaş Gömlek', 'Deri Zırh', 'Zincir Zırh', 'Plaka Zırh', 'Mithril Zırh', 'Ejder Pulu Zırh', 'Yıldız Zırhı']),
  },
  boots: {
    primary: 'armor',
    affixPool: ['hp', 'aspd', 'goldPct', 'regen', 'dodge'],
    tiers: tiersFrom(['Sandalet', 'Deri Çizme', 'Demir Çizme', 'Gezgin Çizmesi', 'Rüzgâr Çizmesi', 'Ejder Çizmesi', 'Yıldız Adımları']),
  },
  ring: {
    primary: 'crit',
    affixPool: ['critDmg', 'atkPct', 'atk', 'luck', 'goldPct', 'bossDmg'],
    tiers: tiersFrom(['Bakır Yüzük', 'Gümüş Yüzük', 'Altın Yüzük', 'Yakut Yüzük', 'Elmas Yüzük', 'Kadim Yüzük', 'Yıldız Mührü']),
  },
  amulet: {
    primary: 'goldPct',
    affixPool: ['luck', 'hpPct', 'atkPct', 'critDmg', 'regen', 'dodge'],
    tiers: tiersFrom(['Ahşap Tılsım', 'Kemik Kolye', 'Gümüş Kolye', 'Zümrüt Kolye', 'Ruh Kolyesi', 'Kadim Kolye', 'Yıldız Kalbi']),
  },
  cape: {
    primary: 'luck',
    affixPool: ['dodge', 'goldPct', 'critDmg', 'regen', 'hpPct'],
    tiers: tiersFrom(['Yırtık Pelerin', 'Gezgin Pelerini', 'Avcı Pelerini', 'Gölge Pelerini', 'Kraliyet Pelerini', 'Anka Pelerini', 'Yıldız Örtüsü']),
  },
  shield: {
    primary: 'dodge',
    affixPool: ['armor', 'hp', 'thorns', 'hpPct', 'regen'],
    tiers: tiersFrom(['Tahta Kalkan', 'Demir Kalkan', 'Kule Kalkanı', 'Rün Kalkanı', 'Mithril Kalkan', 'Ejder Kalkanı', 'Yıldız Siperi']),
  },
  gloves: {
    primary: 'aspd',
    affixPool: ['atk', 'crit', 'critDmg', 'lifesteal', 'atkPct'],
    tiers: tiersFrom(['Bez Eldiven', 'Deri Eldiven', 'Zincir Eldiven', 'Demir Eldiven', 'Rün Eldiveni', 'Ejder Pençeleri', 'Yıldız Eldiveni']),
  },
  belt: {
    primary: 'hp',
    affixPool: ['regen', 'hpPct', 'goldPct', 'bossDmg', 'thorns'],
    tiers: tiersFrom(['İp Kuşak', 'Deri Kemer', 'Perçinli Kemer', 'Savaşçı Kemeri', 'Şampiyon Kemeri', 'Kadim Kemer', 'Yıldız Kuşağı']),
  },
};

export function getBaseName(slot, level, kind) {
  const tiers = slot === 'weapon' && kind ? WEAPON_KINDS[kind].tiers : ITEM_BASES[slot].tiers;
  let name = tiers[0].name;
  for (const t of tiers) if (t.minLevel <= level) name = t.name;
  return name;
}

/** "Balta", "Kalkan" gibi tür adı (tooltip için) */
export const itemTypeName = (item) => (item.slot === 'weapon' && item.kind ? WEAPON_KINDS[item.kind].name : SLOTS[item.slot].name);

/** Envanterde gösterilecek simge (silahlarda türe göre) */
export const itemIcon = (item) => (item.slot === 'weapon' && item.kind ? WEAPON_KINDS[item.kind].icon : SLOTS[item.slot].icon);
