interface Particle {
  active: boolean;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export class ParticlePool {
  private readonly items: Particle[] = [];

  public constructor(size: number) {
    for (let index = 0; index < size; index += 1) {
      this.items.push({
        active: false,
        x: 0,
        y: 0,
        velocityX: 0,
        velocityY: 0,
        life: 0,
        maxLife: 0,
        size: 0,
        color: '#ffffff',
      });
    }
  }

  public burst(x: number, y: number, color: string, count: number): void {
    let created = 0;
    for (let index = 0; index < this.items.length && created < count; index += 1) {
      const particle = this.items[index];
      if (particle.active) {
        continue;
      }

      const angle = (created / count) * Math.PI * 2;
      const speed = 55 + (created % 4) * 22;
      particle.active = true;
      particle.x = x;
      particle.y = y;
      particle.velocityX = Math.cos(angle) * speed;
      particle.velocityY = Math.sin(angle) * speed;
      particle.life = 0.28 + (created % 3) * 0.04;
      particle.maxLife = particle.life;
      particle.size = 2 + (created % 3);
      particle.color = color;
      created += 1;
    }
  }

  public update(delta: number): void {
    for (let index = 0; index < this.items.length; index += 1) {
      const particle = this.items[index];
      if (!particle.active) {
        continue;
      }

      particle.life -= delta;
      if (particle.life <= 0) {
        particle.active = false;
        continue;
      }
      particle.x += particle.velocityX * delta;
      particle.y += particle.velocityY * delta;
      particle.velocityY += 90 * delta;
    }
  }

  public draw(context: CanvasRenderingContext2D): void {
    for (let index = 0; index < this.items.length; index += 1) {
      const particle = this.items[index];
      if (!particle.active) {
        continue;
      }

      context.globalAlpha = particle.life / particle.maxLife;
      context.fillStyle = particle.color;
      context.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    context.globalAlpha = 1;
  }

  public clear(): void {
    for (let index = 0; index < this.items.length; index += 1) {
      this.items[index].active = false;
    }
  }
}
