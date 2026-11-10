import { Point } from '../types.ts';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  active: boolean;
}

export interface BitePulse {
  segmentIndex: number;
  startTime: number;
  active: boolean;
}

export class ParticleSystem {
  private pool: Particle[] = [];
  private maxParticles = 80;
  public bitePulses: BitePulse[] = [];
  public headSquashStartTime = 0;
  public screenShakeStartTime = 0;

  constructor() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.pool.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 3,
        color: '#FFFFFF',
        alpha: 1,
        life: 0,
        maxLife: 30,
        active: false,
      });
    }
  }

  public triggerHeadSquash() {
    this.headSquashStartTime = performance.now();
  }

  public triggerBitePulse() {
    this.bitePulses.push({
      segmentIndex: 0,
      startTime: performance.now(),
      active: true,
    });
  }

  public triggerCrashExplosion(
    snake: Point[],
    cellSize: number,
    color: string
  ) {
    this.screenShakeStartTime = performance.now();
    let count = 0;
    // Disperse up to 50 particles around snake body segments
    for (const [sx, sy] of snake) {
      if (count >= 50) break;
      const centerX = (sx + 0.5) * cellSize;
      const centerY = (sy + 0.5) * cellSize;

      for (let k = 0; k < 3; k++) {
        const p = this.getAvailableParticle();
        if (!p) break;
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3.5;
        p.x = centerX + (Math.random() - 0.5) * cellSize * 0.8;
        p.y = centerY + (Math.random() - 0.5) * cellSize * 0.8;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.size = 2 + Math.random() * 3;
        p.color = color;
        p.alpha = 1;
        p.life = 0;
        p.maxLife = 20 + Math.random() * 15; // <= 600ms at 60fps
        p.active = true;
        count++;
      }
    }
  }

  public triggerNarrowPassSparks(
    cell: Point,
    cellSize: number,
    color: string
  ) {
    const cx = (cell[0] + 0.5) * cellSize;
    const cy = (cell[1] + 0.5) * cellSize;
    for (let i = 0; i < 6; i++) {
      const p = this.getAvailableParticle();
      if (!p) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2;
      p.x = cx;
      p.y = cy;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = 2;
      p.color = color;
      p.alpha = 0.8;
      p.life = 0;
      p.maxLife = 15;
      p.active = true;
    }
  }

  private getAvailableParticle(): Particle | null {
    for (const p of this.pool) {
      if (!p.active) return p;
    }
    return null;
  }

  public updateAndDraw(
    ctx: CanvasRenderingContext2D,
    prefersReducedMotion: boolean = false
  ) {
    const now = performance.now();

    // Update bite pulses (moves through snake body segments)
    const stepDuration = 50; // 50ms per segment
    this.bitePulses = this.bitePulses.filter((pulse) => {
      const elapsed = now - pulse.startTime;
      pulse.segmentIndex = Math.floor(elapsed / stepDuration);
      return pulse.segmentIndex < 60; // disappears after 60 segments max
    });

    if (prefersReducedMotion) return;

    // Draw active particles
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life += 1;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.alpha = 1 - p.life / p.maxLife;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }

  public getHeadSquashScale(now: number): { scaleX: number; scaleY: number } {
    const elapsed = now - this.headSquashStartTime;
    if (elapsed > 150 || this.headSquashStartTime === 0) {
      return { scaleX: 1, scaleY: 1 };
    }
    // 0 to 75ms: expand to 1.25, 75 to 150ms: back to 1.0
    const progress = elapsed / 150;
    const factor = Math.sin(progress * Math.PI) * 0.25;
    return { scaleX: 1 + factor, scaleY: 1 + factor };
  }

  public getScreenShakeOffset(now: number): { x: number; y: number } {
    const elapsed = now - this.screenShakeStartTime;
    if (elapsed > 300 || this.screenShakeStartTime === 0) {
      return { x: 0, y: 0 };
    }
    const decay = 1 - elapsed / 300;
    const magnitude = 4 * decay;
    return {
      x: (Math.random() - 0.5) * magnitude * 2,
      y: (Math.random() - 0.5) * magnitude * 2,
    };
  }
}

export const particleSystem = new ParticleSystem();
