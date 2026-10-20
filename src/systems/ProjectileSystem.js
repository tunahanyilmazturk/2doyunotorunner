// Menzilli saldırıların mermileri: oyuncudan hedefe doğru uçar, varınca onHit çalışır.
// Hasar mermi varana kadar uygulanmaz; hedef bu sırada ölürse mermi boşa gider.
// Mermi nesneleri çizim için tutulur (Renderer.drawProjectiles); durum değişmez.
export const PROJECTILE_HIT_DISTANCE = 14;

export class ProjectileSystem {
  constructor() {
    this.items = [];
  }

  /**
   * @param {object} from      başlangıç noktası {x, y}
   * @param {object} target    takip edilen canavar (centerX/centerY okunur)
   * @param {object} shot      {shot:'arrow'|'orb', speed, color}
   * @param {Function} onHit   mermi varınca çağrılır
   */
  fire(from, target, shot, onHit) {
    this.items.push({ x: from.x, y: from.y, target, shot, onHit, trail: [], age: 0 });
  }

  update(dt) {
    for (const p of this.items) {
      p.age += dt;
      const t = p.target;
      // Hedef öldüyse mermi, son bildiği noktaya kadar gidip söner
      const tx = t && !t.dead ? t.x : p.lastX ?? p.x;
      const ty = t && !t.dead ? t.centerY : p.lastY ?? p.y;
      p.lastX = tx;
      p.lastY = ty;
      const dx = tx - p.x;
      const dy = ty - p.y;
      const dist = Math.hypot(dx, dy) || 1;
      const step = Math.min(dist, p.shot.speed * dt);
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 6) p.trail.shift();
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
      p.angle = Math.atan2(dy, dx);
      if (dist <= PROJECTILE_HIT_DISTANCE || step >= dist) {
        p.done = true;
        if (t && !t.dead) p.onHit();
      }
    }
    this.items = this.items.filter((p) => !p.done && p.age < 3);
  }

  /** Oyuncu ölünce ya da kule/bölge değişince uçan mermileri temizler. */
  clear() {
    this.items = [];
  }
}
