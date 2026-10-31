import { GAME_CONFIG } from '../config/gameConfig';
import type { AttackDirection } from '../core/types';

export class Player {
  public readonly x = 0;
  public y = 0;
  public health: number = GAME_CONFIG.player.maxHealth;
  public maxHealth = GAME_CONFIG.player.maxHealth;
  public damageMultiplier = 1;
  public attackSpeedMultiplier = 1;
  public attackRangeBonus = 0;
  public critChance = 0;
  public lifesteal = 0;
  public previousAttackDirection: AttackDirection = 1;
  public attackFlash = 0;
  private attackCooldown = 0;

  public reset(y: number): void {
    this.y = y;
    this.health = this.maxHealth;
    this.attackCooldown = 0;
    this.attackFlash = 0;
  }

  public update(delta: number): void {
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    this.attackFlash = Math.max(0, this.attackFlash - delta);
  }

  public canAttack(): boolean {
    return this.attackCooldown === 0;
  }

  public attack(direction: AttackDirection): void {
    this.previousAttackDirection = direction;
    this.attackCooldown = GAME_CONFIG.player.attackCooldown * this.attackSpeedMultiplier;
    this.attackFlash = 0.14;
  }

  public takeDamage(amount: number): boolean {
    this.health = Math.max(0, this.health - amount);
    return this.health === 0;
  }

  public applyUpgrade(
    maxHealth: number,
    damageMultiplier: number,
    attackSpeedMultiplier: number,
    attackRangeBonus: number,
    critChance: number,
    lifesteal: number,
  ): void {
    this.maxHealth = maxHealth;
    this.damageMultiplier = damageMultiplier;
    this.attackSpeedMultiplier = attackSpeedMultiplier;
    this.attackRangeBonus = attackRangeBonus;
    this.critChance = critChance;
    this.lifesteal = lifesteal;
  }
}
