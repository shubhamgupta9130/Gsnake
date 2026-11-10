/**
 * Zero-GC pooled particle system for Snake game juices.
 */

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

export class ParticlePool {
  private particles: Particle[];
  private capacity: number;

  constructor(capacity: number = 250) {
    this.capacity = capacity;
    this.particles = new Array(capacity);
    for (let i = 0; i < capacity; i++) {
      this.particles[i] = {
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 2,
        color: '#10b981',
        alpha: 1,
        decay: 0.05,
      };
    }
  }

  public emit(
    x: number,
    y: number,
    count: number,
    color: string,
    speedMultiplier: number = 1.0,
    sizeRange: [number, number] = [2, 5]
  ): void {
    let emitted = 0;
    for (let i = 0; i < this.capacity && emitted < count; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 3 + 1) * speedMultiplier;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
        p.color = color;
        p.alpha = 1.0;
        p.decay = 0.03 + Math.random() * 0.04;
        emitted++;
      }
    }
  }

  public update(dt: number = 1.0): void {
    for (let i = 0; i < this.capacity; i++) {
      const p = this.particles[i];
      if (p.active) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94; // slight drag
        p.vy *= 0.94;
        p.alpha -= p.decay * dt;
        if (p.alpha <= 0) {
          p.active = false;
        }
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.capacity; i++) {
      const p = this.particles[i];
      if (p.active && p.alpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  public clear(): void {
    for (let i = 0; i < this.capacity; i++) {
      this.particles[i].active = false;
    }
  }
}
