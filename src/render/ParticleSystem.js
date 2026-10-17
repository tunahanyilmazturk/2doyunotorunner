import { rand } from '../utils/random.js';

const MAX_PARTICLES = 600;

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(p) {
    if (this.particles.length >= MAX_PARTICLES) this.particles.shift();
    this.particles.push({
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0.6, maxLife: 0.6,
      size: 3, color: '#fff',
      gravity: 0, drag: 0,
      shape: 'square', rot: 0, vr: 0,
      groundY: null,
      ...p,
    });
  }

  burst(x, y, opts = {}) {
    const {
      count = 12, color = '#fff', speed = [60, 220], size = [2, 5], life = [0.4, 0.9],
      gravity = 500, shape = 'square', angle = -Math.PI / 2, spread = Math.PI * 2, drag = 0.5, groundY = null,
    } = opts;
    for (let i = 0; i < count; i++) {
      const a = angle + rand(-spread / 2, spread / 2);
      const v = rand(speed[0], speed[1]);
      const l = rand(life[0], life[1]);
      this.emit({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: l, maxLife: l, size: rand(size[0], size[1]),
        color: Array.isArray(color) ? color[i % color.length] : color,
        gravity, shape, drag, groundY, rot: rand(0, Math.PI), vr: rand(-10, 10),
      });
    }
  }

  slash(x, y, color, crit = false) {
    this.emit({
      x, y, shape: 'slash', color, life: 0.18, maxLife: 0.18,
      size: crit ? 46 : 34, rot: rand(-0.4, 0.2),
    });
  }

  ring(x, y, color, size = 60) {
    this.emit({ x, y, shape: 'ring', color, life: 0.5, maxLife: 0.5, size });
  }

  update(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      p.vy += p.gravity * dt;
      const d = Math.max(0, 1 - p.drag * dt);
      p.vx *= d;
      p.vy *= d;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.groundY !== null && p.y > p.groundY) {
        p.y = p.groundY;
        p.vy *= -0.35;
        p.vx *= 0.6;
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  draw(ctx) {
    for (const p of this.particles) {
      const t = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = Math.min(1, t * 1.6);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      ctx.translate(p.x, p.y);
      switch (p.shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, p.size * (0.5 + t * 0.5), 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'coin':
          ctx.scale(Math.abs(Math.cos(p.rot)) * 0.8 + 0.2, 1);
          ctx.fillStyle = '#ffd34d';
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#c98b12';
          ctx.fillRect(-p.size * 0.25, -p.size * 0.5, p.size * 0.5, p.size);
          break;
        case 'slash': {
          const prog = 1 - t;
          ctx.rotate(p.rot);
          ctx.lineCap = 'round';
          ctx.lineWidth = 6 * t + 1;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(-p.size * 0.4, 0, p.size, -1.1 + prog * 0.3, 1.1 * (0.3 + prog));
          ctx.stroke();
          break;
        }
        case 'ring':
          ctx.lineWidth = 4 * t;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * (1 - t) + 4, 0, Math.PI * 2);
          ctx.stroke();
          break;
        default:
          ctx.rotate(p.rot);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }
      ctx.restore();
    }
  }
}
