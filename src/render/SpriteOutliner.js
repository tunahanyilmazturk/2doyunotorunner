// Bir sprite'ı ara tuvale çizer ve etrafına düz renkli dış hat ekleyerek hedefe basar.
// Piksel modunda 1 sanat pikseli kalınlığında klasik piksel-art dış hattı verir.

export const OUTLINE_COLOR = '#160d12';
const PAD = 3;
const DIRS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [-1, 1], [1, -1], [-1, -1],
];

export class SpriteOutliner {
  constructor() {
    this.sprite = document.createElement('canvas');
    this.sil = document.createElement('canvas');
    this.spriteCtx = this.sprite.getContext('2d');
    this.silCtx = this.sil.getContext('2d');
  }

  ensure(w, h) {
    for (const c of [this.sprite, this.sil]) {
      if (c.width < w) c.width = w;
      if (c.height < h) c.height = h;
    }
  }

  /**
   * @param {CanvasRenderingContext2D} target  piksel uzayında çizilecek hedef
   * @param {number} pr     mantıksal birim başına piksel
   * @param {{x:number, y:number, w:number, h:number}} box  mantıksal kutu (x: merkez, y: alt kenar)
   * @param {(ctx:CanvasRenderingContext2D)=>void} draw  dünya koordinatlarında çizim
   */
  draw(target, pr, box, draw, color = OUTLINE_COLOR) {
    const W = Math.ceil(box.w * pr) + PAD * 2;
    const H = Math.ceil(box.h * pr) + PAD * 2;
    this.ensure(W, H);
    const px = Math.round((box.x - box.w / 2) * pr) - PAD;
    const py = Math.round((box.y - box.h) * pr) - PAD;

    const sc = this.spriteCtx;
    sc.setTransform(1, 0, 0, 1, 0, 0);
    sc.clearRect(0, 0, W, H);
    sc.setTransform(pr, 0, 0, pr, -px, -py);
    sc.save();
    draw(sc);
    sc.restore();

    const sl = this.silCtx;
    sl.setTransform(1, 0, 0, 1, 0, 0);
    sl.clearRect(0, 0, W, H);
    sl.globalCompositeOperation = 'source-over';
    sl.drawImage(this.sprite, 0, 0, W, H, 0, 0, W, H);
    sl.globalCompositeOperation = 'source-in';
    sl.fillStyle = color;
    sl.fillRect(0, 0, W, H);
    sl.globalCompositeOperation = 'source-over';

    const t = Math.max(1, Math.round(pr * 1.1));
    target.save();
    target.setTransform(1, 0, 0, 1, 0, 0);
    for (const [dx, dy] of DIRS) target.drawImage(this.sil, 0, 0, W, H, px + dx * t, py + dy * t, W, H);
    target.drawImage(this.sprite, 0, 0, W, H, px, py, W, H);
    target.restore();
  }
}
