import { GAME_CONFIG } from './config/gameConfig';
import { PROGRESSION_CONFIG, type AbilityId, type UpgradeId } from './data/progressionConfig';
import { GameLoop } from './core/gameLoop';
import { Input } from './core/input';
import type { AttackDirection, EnemyKind } from './core/types';
import { SaveSystem } from './core/save';
import { Enemy } from './entities/Enemy';
import { EnemyPool } from './systems/EnemyPool';
import { ParticlePool } from './systems/ParticlePool';
import { Player } from './entities/Player';

export class Game {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly input: Input;
  private readonly player = new Player();
  private readonly enemies = new EnemyPool();
  private readonly particles = new ParticlePool(640);
  private readonly save = new SaveSystem();
  private readonly loop: GameLoop;
  private readonly healthFill: HTMLElement;
  private readonly waveValue: HTMLElement;
  private readonly scoreValue: HTMLElement;
  private readonly comboValue: HTMLElement;
  private readonly currencyValue: HTMLElement;
  private readonly upgradeList: HTMLElement;
  private readonly abilityList: HTMLElement;
  private readonly gameOverPanel: HTMLElement;
  private readonly finalScore: HTMLElement;
  private width = 0;
  private height = 0;
  private spawnTimer = 0;
  private waveTimer = 0;
  private wave = 1;
  private score = 0;
  private runCurrency = 0;
  private combo = 0;
  private comboTimer = 0;
  private gameOver = false;
  private shake = 0;
  private hitStop = 0;
  private slowMotion = 0;
  private damageFlash = 0;
  private slashTimer = 0;
  private slashDirection: AttackDirection = 1;
  private readonly abilityCooldowns: Record<AbilityId, number> = {
    nova: 0,
    execution: 0,
    storm: 0,
  };
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
    this.comboValue = this.getElement('combo-value');
    this.currencyValue = this.getElement('currency-value');
    this.upgradeList = this.getElement('upgrade-list');
    this.abilityList = this.getElement('ability-list');
    this.gameOverPanel = this.getElement('game-over');
    this.finalScore = this.getElement('final-score');
    this.loop = new GameLoop({
      update: (delta) => this.update(delta),
      render: (alpha) => this.render(alpha),
    });

    window.addEventListener('resize', this.resize);
    this.resize();
    this.reset();
    window.addEventListener('keydown', this.handleAbilityKey);
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
    window.removeEventListener('keydown', this.handleAbilityKey);
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
    this.runCurrency = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.spawnTimer = 0;
    this.waveTimer = 0;
    this.shake = 0;
    this.hitStop = 0;
    this.slowMotion = 0;
    this.damageFlash = 0;
    this.slashTimer = 0;
    this.abilityCooldowns.nova = 0;
    this.abilityCooldowns.execution = 0;
    this.abilityCooldowns.storm = 0;
    this.enemies.deactivateAll();
    this.particles.clear();
    this.applyUpgrades();
    this.player.reset(this.height * 0.62);
    this.gameOverPanel.classList.add('hidden');
    this.updateHud();
  }

  private update(delta: number): void {
    if (this.gameOver) {
      return;
    }

    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - delta);
      return;
    }

    const timeScale = this.slowMotion > 0 ? GAME_CONFIG.feel.killSlowMotion : 1;
    const scaledDelta = delta * timeScale;
    this.slowMotion = Math.max(0, this.slowMotion - delta);
    this.player.update(scaledDelta);
    this.particles.update(scaledDelta);
    this.waveTimer += scaledDelta;
    this.spawnTimer -= scaledDelta;
    this.comboTimer -= delta;
    this.abilityCooldowns.nova = Math.max(0, this.abilityCooldowns.nova - delta);
    this.abilityCooldowns.execution = Math.max(0, this.abilityCooldowns.execution - delta);
    this.abilityCooldowns.storm = Math.max(0, this.abilityCooldowns.storm - delta);
    this.shake = Math.max(0, this.shake - delta);
    this.damageFlash = Math.max(0, this.damageFlash - delta);
    this.slashTimer = Math.max(0, this.slashTimer - delta);

    if (this.comboTimer <= 0) {
      this.combo = 0;
    }

    if (this.waveTimer >= GAME_CONFIG.wave.waveDuration) {
      this.waveTimer -= GAME_CONFIG.wave.waveDuration;
      this.wave += 1;
      this.waveValue.textContent = String(this.wave);
      if (this.wave % GAME_CONFIG.enemy.bossEvery === 0) {
        this.spawnEnemy('boss');
      }
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

      const attackDistance = enemy.kind === 'ranged' ? 230 : enemy.kind === 'boss' ? 54 : 42;
      const distance = Math.abs(enemy.x);
      if (distance > attackDistance) {
        enemy.x -= Math.sign(enemy.x) * enemy.speed * scaledDelta;
        if (enemy.kind === 'ranged') {
          enemy.y = this.player.y - 72;
        }
      } else {
        enemy.attackTimer -= scaledDelta;
        if (enemy.attackTimer <= 0) {
          enemy.attackTimer = GAME_CONFIG.enemy.attackCooldown;
          if (this.player.takeDamage(enemy.damage)) {
            this.endRun();
            return;
          }
          this.damageFlash = GAME_CONFIG.feel.damageFlashDuration;
          this.shake = GAME_CONFIG.feel.screenShakeOnHit;
        }
      }
    }

    this.updateHud();
  }

  private spawnEnemy(requestedKind?: EnemyKind): void {
    const direction: AttackDirection = Math.random() < 0.5 ? -1 : 1;
    const distance = Math.min(this.width * 0.7, GAME_CONFIG.enemy.spawnDistance);
    const kind = requestedKind ?? this.chooseEnemyKind();
    const spec = GAME_CONFIG.enemy.types[kind];
    const scale = 1 + (this.wave - 1) * GAME_CONFIG.wave.healthGrowth;
    const y = kind === 'ranged' ? this.player.y - 72 : this.player.y;
    this.enemies.spawn(
      direction * distance,
      y,
      direction,
      kind,
      spec.health * scale,
      spec.speed * (1 + (this.wave - 1) * GAME_CONFIG.wave.speedGrowth),
      spec.damage * scale,
      spec.radius,
      spec.score,
    );
  }

  private chooseEnemyKind(): Exclude<EnemyKind, 'boss'> {
    const roll = Math.random();
    if (this.wave >= 4 && roll < 0.12) {
      return 'tank';
    }
    if (this.wave >= 2 && roll < 0.32) {
      return 'ranged';
    }
    if (roll < 0.57) {
      return 'fast';
    }
    return 'runner';
  }

  private performAttack(direction: AttackDirection): void {
    this.player.attack(direction);
    for (let index = 0; index < this.enemies.items.length; index += 1) {
      const enemy = this.enemies.items[index];
      if (!enemy.active || Math.sign(enemy.x) !== direction) {
        continue;
      }

      if (Math.abs(enemy.x) <= GAME_CONFIG.player.attackRange) {
        const critical = Math.random() < this.player.critChance;
        enemy.health -=
          GAME_CONFIG.player.attackDamage * this.player.damageMultiplier * (critical ? 2 : 1);
        this.hitStop = GAME_CONFIG.feel.hitStop;
        this.slashTimer = 0.12;
        this.slashDirection = direction;
        this.particles.burst(
          this.width / 2 + enemy.x,
          enemy.y,
          enemy.kind === 'boss' ? '#d9b4ff' : '#f2f5ff',
          enemy.kind === 'boss' ? 12 : 7,
        );
        this.shake = GAME_CONFIG.feel.screenShakeOnHit;
        if (enemy.health <= 0) {
          enemy.deactivate();
          this.combo += 1;
          this.comboTimer = GAME_CONFIG.feel.comboTimeout;
          this.score += enemy.score * Math.max(1, this.combo);
          this.runCurrency += PROGRESSION_CONFIG.currencyPerKill;
          if (this.player.lifesteal > 0) {
            this.player.health = Math.min(
              this.player.maxHealth,
              this.player.health + enemy.score * this.player.lifesteal,
            );
          }
          this.shake = GAME_CONFIG.feel.screenShakeOnKill;
          if (enemy.kind === 'boss' || this.combo >= 5) {
            this.slowMotion = GAME_CONFIG.feel.slowMotionDuration;
          }
        }
      }
    }
  }

  private endRun(): void {
    this.gameOver = true;
    this.runCurrency += PROGRESSION_CONFIG.deathBonus;
    this.save.addCurrency(this.runCurrency);
    this.finalScore.textContent = String(this.score);
    this.currencyValue.textContent = String(this.save.currency);
    this.renderShop();
    this.gameOverPanel.classList.remove('hidden');
  }

  private updateHud(): void {
    this.healthFill.style.width = `${(this.player.health / GAME_CONFIG.player.maxHealth) * 100}%`;
    this.scoreValue.textContent = String(this.score);
    this.comboValue.textContent = `COMBO x${this.combo}`;
    this.comboValue.classList.toggle('active', this.combo > 1);
  }

  private applyUpgrades(): void {
    const levels = this.save.upgrades;
    const upgrades = PROGRESSION_CONFIG.upgrades;
    this.player.applyUpgrade(
      GAME_CONFIG.player.maxHealth + levels.health * upgrades.health.valuePerLevel,
      1 + levels.damage * upgrades.damage.valuePerLevel,
      1 - levels.attackSpeed * upgrades.attackSpeed.valuePerLevel,
      levels.range * upgrades.range.valuePerLevel,
      levels.crit * upgrades.crit.valuePerLevel,
      levels.lifesteal * upgrades.lifesteal.valuePerLevel,
    );
  }

  private renderShop(): void {
    this.upgradeList.replaceChildren();
    const upgradeIds: UpgradeId[] = [
      'damage',
      'attackSpeed',
      'range',
      'health',
      'crit',
      'lifesteal',
    ];
    for (let index = 0; index < upgradeIds.length; index += 1) {
      const id = upgradeIds[index];
      const config = PROGRESSION_CONFIG.upgrades[id];
      const level = this.save.upgrades[id];
      const cost = Math.floor(config.baseCost * config.costGrowth ** level);
      const button = document.createElement('button');
      button.type = 'button';
      button.disabled = level >= config.maxLevel || this.save.currency < cost;
      button.innerHTML = `<strong>${config.label} ${level}/${config.maxLevel}</strong><small>${config.description} · ${level >= config.maxLevel ? 'MAX' : `${cost} SHARDS`}</small>`;
      button.addEventListener('click', () => {
        if (level < config.maxLevel && this.save.spend(cost)) {
          this.save.setUpgrade(id, level + 1);
          this.currencyValue.textContent = String(this.save.currency);
          this.renderShop();
        }
      });
      this.upgradeList.append(button);
    }

    this.abilityList.replaceChildren();
    const abilityIds: AbilityId[] = ['nova', 'execution', 'storm'];
    for (let index = 0; index < abilityIds.length; index += 1) {
      const id = abilityIds[index];
      const config = PROGRESSION_CONFIG.abilities[id];
      const unlocked = this.save.abilities[id];
      const button = document.createElement('button');
      button.type = 'button';
      button.disabled = unlocked || this.save.currency < config.cost;
      button.innerHTML = `<strong>${config.label}</strong><small>${unlocked ? 'UNLOCKED · ' + this.abilityKey(id) : config.description + ' · ' + config.cost + ' SHARDS'}</small>`;
      button.addEventListener('click', () => {
        if (!unlocked && this.save.spend(config.cost)) {
          this.save.unlockAbility(id);
          this.currencyValue.textContent = String(this.save.currency);
          this.renderShop();
        }
      });
      this.abilityList.append(button);
    }
  }

  private readonly handleAbilityKey = (event: KeyboardEvent): void => {
    const abilityByKey: Record<string, AbilityId> = { q: 'nova', e: 'execution', r: 'storm' };
    const ability = abilityByKey[event.key.toLowerCase()];
    if (ability) {
      this.activateAbility(ability);
    }
  };

  private activateAbility(id: AbilityId): void {
    if (!this.save.abilities[id] || this.abilityCooldowns[id] > 0 || this.gameOver) {
      return;
    }
    this.abilityCooldowns[id] = PROGRESSION_CONFIG.abilities[id].cooldown;
    for (let index = 0; index < this.enemies.items.length; index += 1) {
      const enemy = this.enemies.items[index];
      if (!enemy.active || (id === 'execution' && enemy.health > enemy.maxHealth * 0.5)) {
        continue;
      }
      if (id === 'nova' && Math.abs(enemy.x) > GAME_CONFIG.player.attackRange * 1.8) {
        continue;
      }
      if (id === 'storm' && Math.sign(enemy.x) !== this.player.previousAttackDirection) {
        continue;
      }
      enemy.health = id === 'execution' ? 0 : enemy.health - GAME_CONFIG.player.attackDamage * 3;
      this.particles.burst(this.width / 2 + enemy.x, enemy.y, '#e4c8ff', 10);
      if (enemy.health <= 0) {
        enemy.deactivate();
        this.score += enemy.score;
        this.runCurrency += PROGRESSION_CONFIG.currencyPerKill;
      }
    }
    this.shake = GAME_CONFIG.feel.screenShakeOnKill;
    this.slowMotion = GAME_CONFIG.feel.slowMotionDuration;
  }

  private abilityKey(id: AbilityId): string {
    return { nova: 'Q', execution: 'E', storm: 'R' }[id];
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
    this.particles.draw(context);
    this.drawPlayer(context);
    if (this.damageFlash > 0) {
      context.fillStyle = `rgba(255, 67, 87, ${
        this.damageFlash / GAME_CONFIG.feel.damageFlashDuration
      })`;
      context.fillRect(0, 0, this.width, this.height);
    }
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
      this.drawEnemyDetails(context, enemy);
    }
  }

  private drawEnemyDetails(context: CanvasRenderingContext2D, enemy: Enemy): void {
    const centerX = this.width / 2 + enemy.x;
    const eyeColor = enemy.kind === 'boss' ? '#d9b4ff' : '#ff5364';
    context.fillStyle = eyeColor;
    context.fillRect(centerX - enemy.radius * 0.42, enemy.y - 3, 4, 3);
    context.fillRect(centerX + enemy.radius * 0.2, enemy.y - 3, 4, 3);

    if (enemy.kind === 'tank' || enemy.kind === 'boss') {
      context.strokeStyle = enemy.kind === 'boss' ? '#9a6cff' : '#6e7890';
      context.lineWidth = enemy.kind === 'boss' ? 4 : 2;
      context.strokeRect(
        centerX - enemy.radius,
        enemy.y - enemy.radius,
        enemy.radius * 2,
        enemy.radius * 2,
      );
    } else if (enemy.kind === 'ranged') {
      context.strokeStyle = '#7ce4ff';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(centerX - enemy.radius, enemy.y);
      context.lineTo(centerX, enemy.y - enemy.radius - 8);
      context.lineTo(centerX + enemy.radius, enemy.y);
      context.stroke();
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
    if (this.slashTimer > 0) {
      context.strokeStyle = '#dce8ff';
      context.lineWidth = 3;
      context.beginPath();
      context.arc(
        centerX,
        y - 8,
        58,
        weaponDirection === 1 ? -1.25 : 1.65,
        weaponDirection === 1 ? 0.35 : 3.25,
        this.slashDirection === -1,
      );
      context.stroke();
    }
  }

  private getElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Missing required element: ${id}`);
    }
    return element;
  }
}
