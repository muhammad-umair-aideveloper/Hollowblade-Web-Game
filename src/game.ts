import { GAME_CONFIG } from './config/gameConfig';
import { GameLoop } from './core/gameLoop';
import { Input } from './core/input';
import type { AttackDirection } from './core/types';
import { EnemyPool } from './systems/EnemyPool';
import { Player } from './entities/Player';

export class Game {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly input: Input;
  private readonly player = new Player();
  private readonly enemies = new EnemyPool();
  private readonly loop: GameLoop;
  private readonly healthFill: HTMLElement;
  private readonly waveValue: HTMLElement;
  private readonly scoreValue: HTMLElement;
  private readonly gameOverPanel: HTMLElement;
  private readonly finalScore: HTMLElement;
  private width = 0;
  private height = 0;
  private spawnTimer = 0;
  private waveTimer = 0;
  private wave = 1;
  private score = 0;
  private gameOver = false;
  private shake = 0;
  private background: CanvasGradient | undefined;

  public constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context is unavailable.');
    }

    this.canvas = canvas;
    this.context = context;
    this.input = new Input(canvas);
    this.healthFill = this.getElement('health-fill');
    this.waveValue = this.getElement('wave-value');
    this.scoreValue = this.getElement('score-value');
    this.gameOverPanel = this.getElement('game-over');
    this.finalScore = this.getElement('final-score');
    this.loop = new GameLoop({
      update: (delta) => this.update(delta),
      render: (alpha) => this.render(alpha),
    });

    window.addEventListener('resize', this.resize);
    this.resize();
    this.reset();
  }

  public start(): void {
    this.loop.start();
  }

  public restart(): void {
    this.reset();
  }

  public destroy(): void {
    this.loop.stop();
    this.input.destroy();
    window.removeEventListener('resize', this.resize);
  }

  private readonly resize = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.background = this.context.createLinearGradient(0, 0, 0, this.height);
    this.background.addColorStop(0, '#111827');
    this.background.addColorStop(0.55, '#080b12');
    this.background.addColorStop(1, '#020306');
    this.player.y = this.height * 0.62;
  };

  private reset(): void {
    this.gameOver = false;
    this.wave = 1;
    this.score = 0;
    this.spawnTimer = 0;
    this.waveTimer = 0;
    this.shake = 0;
    this.enemies.deactivateAll();
    this.player.reset(this.height * 0.62);
    this.gameOverPanel.classList.add('hidden');
    this.updateHud();
  }

  private update(delta: number): void {
    if (this.gameOver) {
      return;
    }

    this.player.update(delta);
    this.waveTimer += delta;
    this.spawnTimer -= delta;
    this.shake = Math.max(0, this.shake - delta);

    if (this.waveTimer >= GAME_CONFIG.wave.waveDuration) {
      this.waveTimer -= GAME_CONFIG.wave.waveDuration;
      this.wave += 1;
      this.waveValue.textContent = String(this.wave);
    }

    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnTimer = Math.max(0.18, GAME_CONFIG.enemy.spawnInterval - (this.wave - 1) * 0.025);
    }

    let attackDirection = this.input.consumeAttack();
    while (attackDirection !== undefined) {
      if (this.player.canAttack()) {
        this.performAttack(attackDirection);
      }
      attackDirection = this.input.consumeAttack();
    }

    for (let index = 0; index < this.enemies.items.length; index += 1) {
      const enemy = this.enemies.items[index];
      if (!enemy.active) {
        continue;
      }

      const distance = Math.abs(enemy.x);
      if (distance > 42) {
        enemy.x -= Math.sign(enemy.x) * enemy.speed * delta;
      } else {
        enemy.attackTimer -= delta;
        if (enemy.attackTimer <= 0) {
          enemy.attackTimer = GAME_CONFIG.enemy.attackCooldown;
          if (this.player.takeDamage(GAME_CONFIG.enemy.damage)) {
            this.endRun();
            return;
          }
          this.shake = 0.12;
        }
      }
    }

    this.updateHud();
  }

  private spawnEnemy(): void {
    const direction: AttackDirection = Math.random() < 0.5 ? -1 : 1;
    const distance = Math.min(this.width * 0.7, GAME_CONFIG.enemy.spawnDistance);
    const health = GAME_CONFIG.enemy.baseHealth + (this.wave - 1) * 3;
    const speed =
      GAME_CONFIG.enemy.baseSpeed * (1 + (this.wave - 1) * GAME_CONFIG.wave.speedGrowth);
    this.enemies.spawn(direction * distance, this.player.y, direction, health, speed);
  }

  private performAttack(direction: AttackDirection): void {
    this.player.attack(direction);
    for (let index = 0; index < this.enemies.items.length; index += 1) {
      const enemy = this.enemies.items[index];
      if (!enemy.active || Math.sign(enemy.x) !== direction) {
        continue;
      }

      if (Math.abs(enemy.x) <= GAME_CONFIG.player.attackRange) {
        enemy.health -= GAME_CONFIG.player.attackDamage;
        this.shake = 0.08;
        if (enemy.health <= 0) {
          enemy.deactivate();
          this.score += 10;
        }
      }
    }
  }

  private endRun(): void {
    this.gameOver = true;
    this.finalScore.textContent = String(this.score);
    this.gameOverPanel.classList.remove('hidden');
  }

  private updateHud(): void {
    this.healthFill.style.width = `${(this.player.health / GAME_CONFIG.player.maxHealth) * 100}%`;
    this.scoreValue.textContent = String(this.score);
  }

  private render(_alpha: number): void {
    void _alpha;
    const context = this.context;
    const offsetX = this.shake > 0 ? (Math.random() - 0.5) * 8 : 0;
    const offsetY = this.shake > 0 ? (Math.random() - 0.5) * 5 : 0;
    context.save();
    context.translate(offsetX, offsetY);
    context.fillStyle = this.background ?? '#080b12';
    context.fillRect(-offsetX, -offsetY, this.width, this.height);
    this.drawFog(context);
    this.drawEnemies(context);
    this.drawPlayer(context);
    context.restore();
  }

  private drawFog(context: CanvasRenderingContext2D): void {
    const glow = context.createRadialGradient(
      this.width / 2,
      this.player.y,
      20,
      this.width / 2,
      this.player.y,
      this.width * 0.55,
    );
    glow.addColorStop(0, 'rgba(77, 95, 140, 0.16)');
    glow.addColorStop(1, 'rgba(2, 3, 6, 0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, this.width, this.height);
    context.fillStyle = 'rgba(185, 202, 232, 0.08)';
    context.fillRect(0, this.player.y + 32, this.width, 2);
  }

  private drawEnemies(context: CanvasRenderingContext2D): void {
    for (let index = 0; index < this.enemies.items.length; index += 1) {
      const enemy = this.enemies.items[index];
      if (!enemy.active) {
        continue;
      }

      context.fillStyle = '#090b11';
      context.beginPath();
      context.arc(this.width / 2 + enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#ff5364';
      context.fillRect(this.width / 2 + enemy.x - 7, enemy.y - 3, 4, 3);
      context.fillRect(this.width / 2 + enemy.x + 3, enemy.y - 3, 4, 3);
    }
  }

  private drawPlayer(context: CanvasRenderingContext2D): void {
    const centerX = this.width / 2;
    const y = this.player.y;
    context.fillStyle = '#020306';
    context.beginPath();
    context.arc(centerX, y - 46, 16, 0, Math.PI * 2);
    context.fill();
    context.fillRect(centerX - 18, y - 30, 36, 54);
    context.beginPath();
    context.moveTo(centerX - 18, y - 28);
    context.lineTo(centerX - 40, y + 20);
    context.lineTo(centerX - 9, y + 12);
    context.lineTo(centerX + 9, y + 12);
    context.lineTo(centerX + 40, y + 20);
    context.lineTo(centerX + 18, y - 28);
    context.fill();

    const weaponDirection = this.player.previousAttackDirection;
    const weaponGlow = this.player.attackFlash > 0 ? '#eaf2ff' : '#9eabc4';
    context.strokeStyle = weaponGlow;
    context.lineWidth = this.player.attackFlash > 0 ? 6 : 3;
    context.beginPath();
    context.moveTo(centerX + weaponDirection * 12, y - 4);
    context.lineTo(centerX + weaponDirection * (this.player.attackFlash > 0 ? 76 : 48), y - 30);
    context.stroke();
  }

  private getElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Missing required element: ${id}`);
    }
    return element;
  }
}
