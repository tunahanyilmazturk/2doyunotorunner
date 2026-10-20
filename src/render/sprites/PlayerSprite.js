import { SPRITE_SCALE } from '../../config/constants.js';
import { getRarity } from '../../data/rarities.js';
import { darken, lighten, mix } from '../../utils/color.js';
import { easeOutCubic, lerp } from '../../utils/math.js';

// Prosedürel şövalye. Koordinatlar ayak tabanına göredir (x, zemin), sağa bakar.
// Kuşanılan her eşya görünüşü değiştirir:
//   zırh → göğüslük + omuzluk   kask → miğfer + sorguç     pelerin → arkada dalgalanan pelerin
//   kalkan → arka kolda kalkan  eldiven → el rengi          kemer → kemer rengi
//   kolye → göğüste taş         yüzük → kabza taşı          çizme → çizme rengi
//   silah → türüne göre kılıç / balta / çekiç / mızrak / hançer
// Dış hat SpriteOutliner tarafından eklenir; burada sadece dolgu ve gölgelendirme var.

const SKIN = '#f2c9a0';
const SKIN_SHADE = '#d9a07a';
const HAIR = '#6b3e26';
const PANTS = '#3d3552';
const STEEL = '#a9b3c1';
const LEATHER = '#7a5233';
const WOOD = '#6b4423';
const TUNIC = '#3f6ea8';
const SCARF = '#c8463d';

const rarityColor = (item) => (item ? getRarity(item.tier).color : null);

/** Aktif buffların arkadaki ışık halkaları (dış hattın dışında çizilir) */
export function drawPlayerAuras(ctx, player, colors) {
  colors.forEach((color, i) => {
    const pulse = 0.3 + Math.sin(player.animTime * 6 + i) * 0.1;
    const cy = player.y - 28 * SPRITE_SCALE;
    const g = ctx.createRadialGradient(player.x, cy, 4, player.x, cy, (46 + i * 6) * SPRITE_SCALE);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(player.x, cy, (36 + i * 6) * SPRITE_SCALE, (48 + i * 6) * SPRITE_SCALE, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

export function drawPlayer(ctx, player, equipment) {
  const armorTint = rarityColor(equipment.armor);
  const bodyColor = armorTint ? mix(STEEL, armorTint, 0.45) : TUNIC;
  const helmetTint = rarityColor(equipment.helmet);
  const bootColor = equipment.boots ? mix(LEATHER, rarityColor(equipment.boots), 0.5) : LEATHER;
  const capeColor = rarityColor(equipment.cape);
  const gloveColor = equipment.gloves ? mix(LEATHER, rarityColor(equipment.gloves), 0.55) : SKIN;
  const beltColor = equipment.belt ? mix('#3a2418', rarityColor(equipment.belt), 0.5) : '#3a2418';
  const amuletColor = rarityColor(equipment.amulet);
  const shield = equipment.shield;
  const weapon = equipment.weapon;
  const gemColor = rarityColor(equipment.ring) ?? '#c33';

  const running = player.state === 'run' && !player.dead;
  const c = player.runCycle;
  const t = player.animTime;
  const bob = running ? Math.abs(Math.sin(c)) * 2.5 : Math.sin(t * 3) * 0.8;
  const lunge = player.attackAnim > 0 ? Math.sin(player.attackAnim * Math.PI) * 5 : 0;

  ctx.translate(player.x + lunge, player.y);
  ctx.scale(SPRITE_SCALE, SPRITE_SCALE);
  if (player.dead) {
    const k = Math.min(1, player.deathTime * 3);
    ctx.globalAlpha = 1 - Math.min(0.6, player.deathTime * 0.4);
    ctx.rotate((-Math.PI / 2) * k);
    ctx.translate(0, 10 * k);
  }
  if (player.hitFlash > 0) ctx.filter = 'brightness(2.4)';

  const hipY = -18 - bob;
  const shoulderY = -36 - bob;
  const lean = running ? 0.07 : 0;

  // ---- Arka katman: pelerin veya atkı ----
  const wave = Math.sin(t * 9) * 3;
  if (capeColor) {
    ctx.fillStyle = darken(capeColor, 0.15);
    ctx.beginPath();
    ctx.moveTo(-5, shoulderY + 1);
    ctx.quadraticCurveTo(-18, shoulderY + 14 + wave, -24 + wave, hipY + 10);
    ctx.lineTo(-14 + wave * 0.5, hipY + 12);
    ctx.lineTo(-3, hipY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = darken(capeColor, 0.4);
    ctx.fillRect(-21 + wave, hipY + 8, 7, 3);
  } else {
    ctx.fillStyle = SCARF;
    ctx.beginPath();
    ctx.moveTo(-3, shoulderY - 3);
    ctx.lineTo(-17, shoulderY + 1 + wave);
    ctx.lineTo(-19, shoulderY + 5 + wave * 1.2);
    ctx.lineTo(-4, shoulderY + 2);
    ctx.closePath();
    ctx.fill();
  }

  // ---- Arka bacak + arka kol (koyu tonlu) ----
  const swing = running ? Math.sin(c) * 0.75 : 0.12;
  drawLeg(ctx, -2, hipY, -swing, running ? Math.max(0, Math.cos(c)) : 0, darken(PANTS, 0.25), darken(bootColor, 0.25));
  const backArm = shield ? (player.state === 'fight' ? -0.9 : -0.3) : running ? Math.sin(c) * 0.8 : player.state === 'fight' ? -0.6 : 0.2;
  drawArm(ctx, -2, shoulderY + 2, backArm, darken(bodyColor, 0.3), darken(gloveColor, 0.2));

  // ---- Gövde ----
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(lean);
  ctx.translate(0, -hipY);
  ctx.fillStyle = bodyColor;
  ctx.fillRect(-7, shoulderY, 14, hipY - shoulderY + 2);
  ctx.fillStyle = darken(bodyColor, 0.22);
  ctx.fillRect(-7, shoulderY, 4, hipY - shoulderY + 2);
  ctx.fillStyle = lighten(bodyColor, 0.3);
  ctx.fillRect(2, shoulderY + 2, 3, 7);
  if (armorTint) {
    ctx.fillStyle = darken(armorTint, 0.1);
    ctx.fillRect(-7, shoulderY + 8, 14, 2);
    ctx.fillStyle = mix(STEEL, armorTint, 0.6);
    ctx.fillRect(-1, shoulderY - 2, 9, 5);
  }
  // Kolye: zincir + göğüs taşı
  if (amuletColor) {
    ctx.fillStyle = '#e0b84a';
    ctx.fillRect(-2, shoulderY + 1, 1, 4);
    ctx.fillRect(4, shoulderY + 1, 1, 4);
    ctx.fillStyle = amuletColor;
    ctx.fillRect(0, shoulderY + 4, 3, 3);
  }
  // Kemer + toka
  ctx.fillStyle = beltColor;
  ctx.fillRect(-7, hipY - 4, 14, 3);
  ctx.fillStyle = '#e0b84a';
  ctx.fillRect(1, hipY - 4, 3, 3);

  // ---- Kafa ----
  const headY = shoulderY - 7;
  ctx.fillStyle = SKIN;
  ctx.fillRect(-4, headY - 6, 10, 11);
  ctx.fillStyle = SKIN_SHADE;
  ctx.fillRect(-4, headY + 2, 10, 3);
  ctx.fillStyle = '#1d1420';
  ctx.fillRect(3, headY - 2, 2, 3);

  if (helmetTint) {
    const steel = mix(STEEL, helmetTint, 0.35);
    ctx.fillStyle = steel;
    ctx.fillRect(-6, headY - 9, 13, 8);
    ctx.fillRect(-6, headY - 2, 4, 7);
    ctx.fillStyle = darken(steel, 0.25);
    ctx.fillRect(-6, headY - 3, 13, 2);
    ctx.fillStyle = '#1d1420';
    ctx.fillRect(2, headY - 2, 5, 1);
    const plume = Math.sin(t * 7) * 1.5;
    ctx.fillStyle = helmetTint;
    ctx.beginPath();
    ctx.moveTo(-1, headY - 9);
    ctx.quadraticCurveTo(-8, headY - 17 + plume, -14, headY - 11 + plume);
    ctx.lineTo(-6, headY - 8);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = HAIR;
    ctx.fillRect(-5, headY - 8, 11, 4);
    ctx.fillRect(-5, headY - 6, 4, 6);
    ctx.fillStyle = lighten(HAIR, 0.2);
    ctx.fillRect(0, headY - 8, 4, 2);
  }
  ctx.restore();

  // ---- Kalkan (arka kolun ucunda, gövdenin önünde) ----
  if (shield) drawShield(ctx, -2 + Math.sin(backArm) * -12, shoulderY + 2 + Math.cos(backArm) * 12, rarityColor(shield));

  // ---- Ön bacak ----
  drawLeg(ctx, 2, hipY, swing, running ? Math.max(0, -Math.cos(c)) : 0, PANTS, bootColor);

  // ---- Silah kolu ----
  let angle;
  if (player.attackAnim > 0) angle = lerp(-2.4, 0.9, easeOutCubic(1 - player.attackAnim));
  else if (player.state === 'fight') angle = -1.15 + Math.sin(t * 4) * 0.05;
  else angle = -0.75 + Math.sin(c * 0.5) * 0.08;

  ctx.save();
  ctx.translate(3, shoulderY + 3);
  const tint = rarityColor(weapon);
  const kind = weapon?.kind ?? 'sword';
  const reach = WEAPON_REACH[kind] + (weapon ? Math.min(weapon.level, 40) * 0.2 : 0);

  if (player.attackAnim > 0.2) {
    ctx.save();
    ctx.globalAlpha *= player.attackAnim * 0.45;
    ctx.strokeStyle = tint ?? '#ffffff';
    ctx.lineWidth = kind === 'hammer' || kind === 'axe' ? 12 : 9;
    ctx.beginPath();
    ctx.arc(0, 0, 14 + reach * 0.8, -2.4, angle);
    ctx.stroke();
    ctx.restore();
  }

  ctx.rotate(angle);
  ctx.fillStyle = bodyColor;
  ctx.fillRect(0, -3, 8, 6);
  ctx.fillStyle = gloveColor;
  ctx.fillRect(8, -2.5, 5, 5);
  WEAPON_DRAWERS[kind](ctx, reach, tint, gemColor, weapon);
  ctx.restore();
}

// ---------- Silah çizimleri: (0,0) el, +x yönü silahın ucu ----------

const WEAPON_REACH = { sword: 28, axe: 26, hammer: 26, spear: 40, dagger: 14, bow: 30, staff: 34, scepter: 32 };

function bladeColorOf(tint) {
  return tint ? mix('#dfe6ee', tint, 0.35) : '#cfd6de';
}

function rarityStripe(ctx, tint, weapon, x, len) {
  if (tint && weapon.tier >= 3) {
    ctx.fillStyle = tint;
    ctx.fillRect(x, -0.5, len, 1);
  }
}

const WEAPON_DRAWERS = {
  sword(ctx, len, tint, gem, weapon) {
    const blade = bladeColorOf(tint);
    ctx.fillStyle = '#4a2c1a';
    ctx.fillRect(10, -1.5, 7, 3);
    ctx.fillStyle = '#e0b84a';
    ctx.fillRect(16, -6, 3, 12);
    ctx.fillStyle = gem;
    ctx.fillRect(16.5, -1.5, 2, 3);
    ctx.fillStyle = blade;
    ctx.fillRect(19, -2.5, len, 5);
    ctx.beginPath();
    ctx.moveTo(19 + len, -2.5);
    ctx.lineTo(19 + len + 6, 0);
    ctx.lineTo(19 + len, 2.5);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(20, -2.5, len - 2, 1);
    ctx.fillStyle = darken(blade, 0.25);
    ctx.fillRect(20, 1.5, len - 2, 1);
    rarityStripe(ctx, tint, weapon, 22, len - 6);
  },

  axe(ctx, len, tint, gem, weapon) {
    const head = bladeColorOf(tint);
    ctx.fillStyle = WOOD;
    ctx.fillRect(6, -1.5, len + 4, 3);
    ctx.fillStyle = gem;
    ctx.fillRect(6, -2, 2, 4);
    // Tek ağızlı balta başı (kavisli kenar)
    const hx = 6 + len - 4;
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.moveTo(hx, -2);
    ctx.lineTo(hx + 3, -2);
    ctx.quadraticCurveTo(hx + 14, -3, hx + 12, -12);
    ctx.lineTo(hx + 4, -8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx, 2);
    ctx.lineTo(hx + 3, 2);
    ctx.quadraticCurveTo(hx + 14, 3, hx + 12, 12);
    ctx.lineTo(hx + 4, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(hx + 10, -10, 1.5, 20);
    if (tint && weapon.tier >= 3) {
      ctx.fillStyle = tint;
      ctx.fillRect(hx + 2, -1, 4, 2);
    }
  },

  hammer(ctx, len, tint, gem, weapon) {
    const head = tint ? mix('#8a929e', tint, 0.35) : '#8a929e';
    ctx.fillStyle = WOOD;
    ctx.fillRect(6, -1.5, len + 2, 3);
    ctx.fillStyle = '#e0b84a';
    ctx.fillRect(6 + len - 2, -2.5, 3, 5);
    const hx = 6 + len;
    ctx.fillStyle = head;
    ctx.fillRect(hx, -8, 11, 16);
    ctx.fillStyle = lighten(head, 0.3);
    ctx.fillRect(hx, -8, 11, 3);
    ctx.fillStyle = darken(head, 0.3);
    ctx.fillRect(hx, 5, 11, 3);
    ctx.fillStyle = gem;
    ctx.fillRect(hx + 4, -1.5, 3, 3);
    if (tint && weapon.tier >= 3) {
      ctx.fillStyle = tint;
      ctx.fillRect(hx + 1, -1, 2, 2);
      ctx.fillRect(hx + 8, -1, 2, 2);
    }
  },

  bow(ctx, len, tint, gem) {
    // Kavis gövde, gerili tel ve tutma yeri; uç tintle parlar
    const arc = len * 0.5;
    ctx.strokeStyle = WOOD;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(4, -arc);
    ctx.quadraticCurveTo(len * 0.45, 0, 4, arc);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(240,235,220,0.8)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(4, -arc);
    ctx.lineTo(4, arc);
    ctx.stroke();
    ctx.fillStyle = gem;
    ctx.fillRect(2, -1.5, 4, 3);
    ctx.fillStyle = bladeColorOf(tint);
    ctx.fillRect(4 + len * 0.45 - 1, -1, 2, 2);
  },
  staff(ctx, len, tint, gem) {
    // Uzun ağaç gövde; ucunda tintle parlayan küre
    ctx.fillStyle = WOOD;
    ctx.fillRect(-2, -1.5, len + 2, 3);
    ctx.fillStyle = gem;
    ctx.beginPath();
    ctx.arc(len + 4, 0, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = bladeColorOf(tint);
    ctx.beginPath();
    ctx.arc(len + 4, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();
  },
  scepter(ctx, len, tint, gem, weapon) {
    // Kutsal asa: asanın üstünde haç benzeri bir başlık
    WEAPON_DRAWERS.staff(ctx, len, tint, gem, weapon);
    ctx.fillStyle = gem;
    ctx.fillRect(len + 2, -4, 2, 8);
    ctx.fillRect(len - 1, -1, 6, 2);
  },
  spear(ctx, len, tint, gem, weapon) {
    const tip = bladeColorOf(tint);
    ctx.fillStyle = WOOD;
    ctx.fillRect(-6, -1.2, len + 8, 2.4);
    ctx.fillStyle = gem;
    ctx.fillRect(len - 2, -2, 3, 4);
    ctx.fillStyle = tip;
    ctx.beginPath();
    ctx.moveTo(len + 1, -3.5);
    ctx.lineTo(len + 14, 0);
    ctx.lineTo(len + 1, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(len + 2, -1, 9, 1);
    if (tint && weapon.tier >= 3) {
      // Süslü bayrak
      ctx.fillStyle = tint;
      ctx.fillRect(len - 6, 1, 5, 6);
    }
  },

  dagger(ctx, len, tint, gem, weapon) {
    const blade = bladeColorOf(tint);
    ctx.fillStyle = '#4a2c1a';
    ctx.fillRect(10, -1.5, 5, 3);
    ctx.fillStyle = '#e0b84a';
    ctx.fillRect(14, -4, 2, 8);
    ctx.fillStyle = gem;
    ctx.fillRect(10, -1, 2, 2);
    ctx.fillStyle = blade;
    ctx.beginPath();
    ctx.moveTo(16, -2.5);
    ctx.lineTo(16 + len, -1);
    ctx.lineTo(16 + len + 5, 0);
    ctx.lineTo(16 + len, 1.5);
    ctx.lineTo(16, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(17, -2, len - 1, 1);
    rarityStripe(ctx, tint, weapon, 18, len - 4);
  },
};

function drawShield(ctx, x, y, tint) {
  const face = mix('#8a929e', tint, 0.45);
  ctx.save();
  ctx.translate(x, y);
  // Üçgen (heater) kalkan
  ctx.fillStyle = darken(face, 0.3);
  ctx.beginPath();
  ctx.moveTo(-6, -8);
  ctx.lineTo(8, -8);
  ctx.lineTo(8, 2);
  ctx.quadraticCurveTo(8, 9, 1, 13);
  ctx.quadraticCurveTo(-6, 9, -6, 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.moveTo(-4, -6);
  ctx.lineTo(6, -6);
  ctx.lineTo(6, 2);
  ctx.quadraticCurveTo(6, 7, 1, 10);
  ctx.quadraticCurveTo(-4, 7, -4, 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = tint;
  ctx.fillRect(0, -6, 2, 15);
  ctx.fillRect(-4, -1, 10, 2);
  ctx.restore();
}

/** İki parçalı bacak: uyluk + diz bükülmesiyle baldır + çizme */
function drawLeg(ctx, x, y, thighAngle, kneeBend, pants, boot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(thighAngle);
  ctx.fillStyle = pants;
  ctx.fillRect(-3, 0, 6, 9);
  ctx.translate(0, 8);
  ctx.rotate(kneeBend * 0.9);
  ctx.fillRect(-2.5, 0, 5, 7);
  ctx.fillStyle = boot;
  ctx.fillRect(-3, 6, 8, 5);
  ctx.fillStyle = darken(boot, 0.3);
  ctx.fillRect(-3, 10, 8, 1);
  ctx.restore();
}

function drawArm(ctx, x, y, angle, sleeve, hand) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = sleeve;
  ctx.fillRect(-2.5, 0, 5, 10);
  ctx.fillStyle = hand;
  ctx.fillRect(-2.5, 10, 5, 4);
  ctx.restore();
}

// ============================================================================
// Karakter paneli: önden duran "kağıt bebek"
// ============================================================================
// Dünyadaki şövalye yandan çizilir; panelde ise kuşanılan on parçanın hepsinin
// okunabildiği önden bir figür kullanılır:
//   kask → miğfer + sorguç   kolye → göğüs taşı    pelerin → omuzların ardı
//   zırh → göğüs plakası     kemer → kemer         eldiven → eller
//   çizme → ayaklar          kalkan → sol el       silah → sağ elde dik
//   yüzük → silah elinde taş
// Birimler dünya sprite'ıyla aynı: ayak tabanı y=0, gövde merkezi x=0, yukarı -y.

const DOLL = {
  angle: -1.5, // silah açısı: elden yukarı, neredeyse dik
  levelCap: 20, // bebekte silah uzunluğu bu seviyede sabitlenir
  elbow: { x: 12, y: -30 }, // silah kolunun dirseği (dönen çerçevenin merkezi)
  shield: { x: -17, y: -32 }, // kalkanın sol üst köşesi
  pad: 4, // çerçevede kenar boşluğu (px)
  // Çerçeve her durumda bu kutuyu kapsar; uzun silah kutuyu büyütür.
  minBox: { minX: -23, maxX: 23, minY: -80, maxY: 2 },
};

/** Silahın elden uzağa uzandığı boy (yerel x) ve gövde yarı kalınlığı (yerel y). */
const WEAPON_TIP = {
  sword: { forward: 25, side: 2.5 },
  axe: { forward: 16, side: 12 },
  hammer: { forward: 17, side: 8 },
  spear: { forward: 14, side: 3.5 },
  dagger: { forward: 21, side: 2.5 },
  bow: { forward: 14, side: 9 },
  staff: { forward: 30, side: 4 },
  scepter: { forward: 28, side: 4 },
};

/** Bebekte silahı kısaltır: silah uzunluğu seviyeyle büyür ama panelde sabit kalır. */
function dollWeapon(weapon) {
  if (!weapon) return null;
  const kind = WEAPON_REACH[weapon.kind] ? weapon.kind : 'sword';
  return { ...weapon, kind, level: Math.min(weapon.level, DOLL.levelCap) };
}

/**
 * Bebeğin çizildiği yerel kutu (birim). Saf fonksiyon: ölçekleme de testler de
 * bunu kullanır. Kutu en az DOLL.minBox kadardır, uzun silah kutuyu büyütür.
 * @param {object} equipment state.equipment
 */
export function playerDollBox(equipment) {
  const box = { ...DOLL.minBox };
  const weapon = dollWeapon(equipment.weapon);
  if (weapon) {
    const tip = WEAPON_TIP[weapon.kind];
    const reach = WEAPON_REACH[weapon.kind] + weapon.level * 0.2;
    const cos = Math.cos(DOLL.angle);
    const sin = Math.sin(DOLL.angle);
    for (const lx of [-8, 0, reach + tip.forward]) {
      for (const ly of [-tip.side, tip.side]) {
        const x = DOLL.elbow.x + lx * cos - ly * sin;
        const y = DOLL.elbow.y + lx * sin + ly * cos;
        box.minX = Math.min(box.minX, x);
        box.maxX = Math.max(box.maxX, x);
        box.minY = Math.min(box.minY, y);
        box.maxY = Math.max(box.maxY, y);
      }
    }
  }
  return box;
}

/**
 * Karakter panelindeki kağıt bebek: kuşanılan eşyalarla birlikte önden duran
 * figürü, verilen kutuya sığacak ölçekte çizer. Kutu (0,0) sol üsttür.
 */
export function drawPlayerDoll(ctx, equipment, w, h) {
  const box = playerDollBox(equipment);
  const scale = Math.min((w - DOLL.pad * 2) / (box.maxX - box.minX), (h - DOLL.pad * 2) / (box.maxY - box.minY));
  ctx.save();
  ctx.translate(w / 2 - ((box.minX + box.maxX) / 2) * scale, h / 2 - ((box.minY + box.maxY) / 2) * scale);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 1, 15, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  drawDollFigure(ctx, equipment);
  ctx.restore();
}

/** Bebek katmanlarının çözülmüş renkleri (nadirlik tonları dahil). */
function dollColors(equipment) {
  const armorTint = rarityColor(equipment.armor);
  const body = armorTint ? mix(STEEL, armorTint, 0.45) : TUNIC;
  return {
    armored: !!armorTint,
    armorTint,
    body,
    sleeve: armorTint ? darken(body, 0.2) : darken(TUNIC, 0.15),
    helmet: rarityColor(equipment.helmet),
    cape: rarityColor(equipment.cape),
    belt: equipment.belt ? mix('#3a2418', rarityColor(equipment.belt), 0.5) : '#3a2418',
    boot: equipment.boots ? mix(LEATHER, rarityColor(equipment.boots), 0.5) : LEATHER,
    glove: equipment.gloves ? mix(LEATHER, rarityColor(equipment.gloves), 0.55) : SKIN,
    amulet: rarityColor(equipment.amulet),
    shield: rarityColor(equipment.shield),
    gem: rarityColor(equipment.ring) ?? '#c33',
  };
}

/** Pelerin (yoksa omuz atkısı) — gövdenin arkasında. */
function dollCape(ctx, c) {
  if (!c.cape) {
    ctx.fillStyle = SCARF;
    ctx.fillRect(-9, -54, 18, 5);
    ctx.fillStyle = darken(SCARF, 0.25);
    ctx.fillRect(-9, -50, 18, 1);
    return;
  }
  ctx.fillStyle = darken(c.cape, 0.28);
  ctx.beginPath();
  ctx.moveTo(-10, -53);
  ctx.lineTo(10, -53);
  ctx.quadraticCurveTo(17, -30, 14, -10);
  ctx.lineTo(-14, -10);
  ctx.quadraticCurveTo(-17, -30, -10, -53);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = darken(c.cape, 0.06);
  ctx.beginPath();
  ctx.moveTo(-6, -53);
  ctx.lineTo(6, -53);
  ctx.quadraticCurveTo(11, -30, 9, -14);
  ctx.lineTo(-9, -14);
  ctx.quadraticCurveTo(-11, -30, -6, -53);
  ctx.closePath();
  ctx.fill();
}

/** Bacaklar + çizmeler. */
function dollLegs(ctx, c) {
  ctx.fillStyle = PANTS;
  ctx.fillRect(-7, -30, 6, 22);
  ctx.fillRect(1, -30, 6, 22);
  ctx.fillStyle = darken(PANTS, 0.28);
  ctx.fillRect(-7, -30, 2, 22);
  ctx.fillRect(1, -30, 2, 22);
  ctx.fillStyle = c.boot;
  ctx.fillRect(-9, -9, 8, 9);
  ctx.fillRect(1, -9, 8, 9);
  ctx.fillStyle = lighten(c.boot, 0.18);
  ctx.fillRect(-9, -9, 8, 1);
  ctx.fillRect(1, -9, 8, 1);
  ctx.fillStyle = darken(c.boot, 0.32);
  ctx.fillRect(-9, -2, 8, 2);
  ctx.fillRect(1, -2, 8, 2);
}

/** Gövde (zırh plakası ve omuzluklarla). */
function dollTorso(ctx, c) {
  ctx.fillStyle = c.body;
  ctx.fillRect(-11, -52, 22, 26);
  ctx.fillStyle = darken(c.body, 0.25);
  ctx.fillRect(-11, -52, 3, 26);
  ctx.fillStyle = lighten(c.body, 0.22);
  ctx.fillRect(6, -50, 5, 22);
  if (!c.armored) return;
  const plate = mix(STEEL, c.armorTint, 0.55);
  ctx.fillStyle = plate;
  ctx.fillRect(-9, -51, 18, 21);
  ctx.fillStyle = lighten(plate, 0.25);
  ctx.fillRect(5, -51, 4, 21);
  ctx.fillStyle = darken(plate, 0.3);
  ctx.fillRect(-9, -51, 2, 21);
  ctx.fillRect(-9, -40, 18, 2);
  ctx.fillRect(-9, -31, 18, 1);
}

/** Kollar: sol kol her zaman sarkar; silah varsa sağ kol dirsekten yukarı kıvrılır. */
function dollArms(ctx, c, armed) {
  const hanging = (cx) => {
    ctx.fillStyle = c.sleeve;
    ctx.fillRect(cx - 2.5, -52, 5, 21);
    ctx.fillStyle = c.glove;
    ctx.fillRect(cx - 2.5, -31, 5, 5);
  };
  hanging(-12.5);
  if (armed) {
    ctx.fillStyle = c.sleeve;
    ctx.fillRect(10, -52, 5, 23);
  } else {
    hanging(12.5);
  }
  if (!c.armored) return;
  const pauldron = mix(STEEL, c.armorTint, 0.45);
  ctx.fillStyle = pauldron;
  ctx.fillRect(-15, -54, 8, 6);
  ctx.fillRect(7, -54, 8, 6);
  ctx.fillStyle = darken(pauldron, 0.28);
  ctx.fillRect(-15, -49, 8, 1);
  ctx.fillRect(7, -49, 8, 1);
}

/** Kemer + toka. */
function dollBelt(ctx, c) {
  ctx.fillStyle = c.belt;
  ctx.fillRect(-11, -31, 22, 4);
  ctx.fillStyle = darken(c.belt, 0.35);
  ctx.fillRect(-11, -28, 22, 1);
  ctx.fillStyle = '#e0b84a';
  ctx.fillRect(-3, -31, 6, 4);
  ctx.fillStyle = darken('#e0b84a', 0.4);
  ctx.fillRect(-1, -30, 2, 2);
}

/** Boyun + kafa; kask varsa miğfer ve sorguç. */
function dollHead(ctx, c) {
  ctx.fillStyle = SKIN_SHADE;
  ctx.fillRect(-3, -57, 6, 6);
  ctx.fillStyle = SKIN;
  ctx.fillRect(-6, -68, 12, 12);
  ctx.fillStyle = SKIN_SHADE;
  ctx.fillRect(-6, -58, 12, 2);
  ctx.fillStyle = '#1d1420';
  ctx.fillRect(-4, -64, 2, 2);
  ctx.fillRect(2, -64, 2, 2);
  ctx.fillStyle = SKIN_SHADE;
  ctx.fillRect(-1, -60, 3, 1);
  if (!c.helmet) {
    ctx.fillStyle = HAIR;
    ctx.fillRect(-7, -70, 14, 4);
    ctx.fillRect(-7, -68, 3, 9);
    ctx.fillRect(4, -68, 3, 9);
    ctx.fillStyle = lighten(HAIR, 0.22);
    ctx.fillRect(-3, -70, 6, 2);
    return;
  }
  const steel = mix(STEEL, c.helmet, 0.45);
  ctx.fillStyle = steel;
  ctx.fillRect(-8, -72, 16, 10);
  ctx.fillRect(-8, -62, 3, 7);
  ctx.fillRect(5, -62, 3, 7);
  ctx.fillStyle = lighten(steel, 0.28);
  ctx.fillRect(-6, -71, 12, 2);
  ctx.fillStyle = darken(steel, 0.3);
  ctx.fillRect(-8, -66, 16, 2);
  ctx.fillRect(-8, -56, 3, 1);
  ctx.fillRect(5, -56, 3, 1);
  ctx.fillStyle = '#1d1420';
  ctx.fillRect(-5, -64, 4, 2);
  ctx.fillRect(1, -64, 4, 2);
  // Sorguç
  ctx.fillStyle = c.helmet;
  ctx.beginPath();
  ctx.moveTo(-1, -72);
  ctx.quadraticCurveTo(-7, -79, -13, -75);
  ctx.lineTo(-6, -69);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = lighten(c.helmet, 0.3);
  ctx.fillRect(-5, -73, 3, 2);
}

/** Kolye: zincir + göğüs taşı. */
function dollAmulet(ctx, c) {
  if (!c.amulet) return;
  ctx.fillStyle = '#e0b84a';
  ctx.fillRect(-6, -51, 1, 4);
  ctx.fillRect(5, -51, 1, 4);
  ctx.fillRect(-5, -48, 10, 1);
  ctx.fillStyle = c.amulet;
  ctx.fillRect(-3, -47, 6, 6);
  ctx.fillStyle = lighten(c.amulet, 0.4);
  ctx.fillRect(-2, -46, 2, 2);
}

/** Yüzük: altın bant + taş. */
function dollRing(ctx, x, y, gem) {
  ctx.fillStyle = '#e0b84a';
  ctx.fillRect(x, y, 4, 2);
  ctx.fillStyle = gem;
  ctx.fillRect(x + 1, y - 2, 2, 2);
}

/** Kalkan sol elde. */
function dollShieldHand(ctx, c) {
  if (!c.shield) return;
  drawShield(ctx, DOLL.shield.x, DOLL.shield.y, c.shield);
}

/** Sağ kol: silahı dik tutar; silah yoksa kol sarkar ve yüzük görünür. */
function dollWeaponArm(ctx, c, weapon) {
  if (!weapon) {
    dollRing(ctx, 10, -29, c.gem);
    return;
  }
  ctx.save();
  ctx.translate(DOLL.elbow.x, DOLL.elbow.y);
  ctx.rotate(DOLL.angle);
  ctx.fillStyle = c.sleeve;
  ctx.fillRect(0, -3, 8, 6);
  ctx.fillStyle = c.glove;
  ctx.fillRect(8, -2.5, 5, 5);
  dollRing(ctx, 9, -4, c.gem);
  WEAPON_DRAWERS[weapon.kind](ctx, WEAPON_REACH[weapon.kind] + weapon.level * 0.2, getRarity(weapon.tier).color, c.gem, weapon);
  ctx.restore();
}

/** Bebeği katman katman çizer (yerel birimler, ayak tabanı 0,0). */
function drawDollFigure(ctx, equipment) {
  const c = dollColors(equipment);
  const weapon = dollWeapon(equipment.weapon);
  dollCape(ctx, c);
  dollLegs(ctx, c);
  dollTorso(ctx, c);
  dollArms(ctx, c, !!weapon);
  // Silah başın arkasında kalır: geniş başlı balta/çekiçte kafa örtülmesin.
  dollWeaponArm(ctx, c, weapon);
  dollBelt(ctx, c);
  dollHead(ctx, c);
  dollAmulet(ctx, c);
  dollShieldHand(ctx, c);
}
