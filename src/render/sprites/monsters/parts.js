// Canavar çizimlerinde ortak kullanılan küçük parçalar.

/** Göz çifti. pupil=true ise beyaz göz + renkli bebek, değilse düz parlak nokta. */
export function eyes(ctx, x, y, r, color, gap = 0, pupil = false) {
  r = Math.max(1.2, r);
  const draw = (ex) => {
    if (pupil) {
      ctx.fillStyle = '#f4f0e6';
      ctx.fillRect(ex - r, y - r, r * 2, r * 2);
      ctx.fillStyle = color;
      ctx.fillRect(ex - r, y - r * 0.4, r, r * 1.2);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(ex - r, y - r, r * 2, r * 2);
    }
  };
  draw(x);
  if (gap) draw(x + gap);
}

export function crown(ctx, x, y, w) {
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x - w / 2, y - w * 0.35);
  ctx.lineTo(x - w / 4, y - w * 0.15);
  ctx.lineTo(x, y - w * 0.45);
  ctx.lineTo(x + w / 4, y - w * 0.15);
  ctx.lineTo(x + w / 2, y - w * 0.35);
  ctx.lineTo(x + w / 2, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d64045';
  ctx.fillRect(x - w * 0.06, y - w * 0.2, w * 0.12, w * 0.12);
}

/** Sivri dişler (ağız çizgisi boyunca) */
export function teeth(ctx, x, y, w, count, size, color = '#f4f0e6') {
  ctx.fillStyle = color;
  const step = w / count;
  for (let i = 0; i < count; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * step, y);
    ctx.lineTo(x + i * step + step / 2, y + size);
    ctx.lineTo(x + (i + 1) * step, y);
    ctx.fill();
  }
}

export function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  ctx.fill();
}
