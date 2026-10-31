import { GAME_CONFIG } from '../config/gameConfig';
import type { AttackDirection } from '../core/types';

export class Player {
  public readonly x = 0;
  public y = 0;
  public health: number = GAME_CONFIG.player.maxHealth;
  public previousAttackDirection: AttackDirection = 1;
  public attackFlash = 0;
  private attackCooldown = 0;

  public reset(y: number): void {
    this.y = y;
    this.health = GAME_CONFIG.player.maxHealth;
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
    this.attackCooldown = GAME_CONFIG.player.attackCooldown;
    this.attackFlash = 0.14;
  }

  public takeDamage(amount: number): boolean {
    this.health = Math.max(0, this.health - amount);
    return this.health === 0;
  }
}
