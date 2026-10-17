// Canavar çizim kaydı. Her canavarın `shape` alanı buradaki bir fonksiyona karşılık gelir.
// Yeni şekil eklemek için: ayrı bir dosyada (ctx, s, colors, t, features, monster) imzalı
// fonksiyon yaz ve SHAPES'e ekle. Hepsi sola (oyuncuya) bakar; (0,0) ayak tabanıdır.
import { ghost, mushroom, slime } from './blobs.js';
import { beast, flyer, serpent } from './creatures.js';
import { humanoid } from './humanoid.js';

export const FLY_HEIGHT = 50;

/** Canavarların `shape` alanının geçerli değerleri (data/monsters.js ile eşleşmeli). */
export const SHAPES = { slime, mushroom, ghost, humanoid, beast, flyer, serpent };

export function drawMonster(ctx, m) {
  const def = m.def;
  const t = m.animTime + m.seed;
  const lunge = m.attackAnim > 0 ? Math.sin(m.attackAnim * Math.PI) * 14 : 0;
  const deathT = m.dead ? Math.min(1, m.deathTimer / 0.45) : 0;

  // Gölge ve parıltı Renderer tarafından sprite dış hattının dışında çizilir.
  ctx.save();
  ctx.translate(m.x - lunge, m.y - (m.flying ? FLY_HEIGHT + Math.sin(t * 3) * 6 : 0));
  ctx.globalAlpha = 1 - deathT;
  const scale = m.scale * (1 - deathT * 0.4);
  ctx.scale(scale, scale * (1 - deathT * 0.3));
  if (m.hitFlash > 0) ctx.filter = 'brightness(2.5)';

  (SHAPES[def.shape] ?? slime)(ctx, def.size, def.colors, t, def.features ?? [], m);

  ctx.restore();
}
