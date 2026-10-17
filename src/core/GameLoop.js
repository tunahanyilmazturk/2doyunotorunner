// requestAnimationFrame tabanlı döngü. dt saniye cinsindendir ve
// sekme değişimlerinde büyük sıçramaları engellemek için sınırlandırılır.
export class GameLoop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.running = false;
    this.last = 0;
    this._tick = this._tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._tick);
  }

  stop() {
    this.running = false;
  }

  _tick(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.last) / 1000, 0.1);
    this.last = now;
    this.update(dt);
    this.render(dt);
    requestAnimationFrame(this._tick);
  }
}
