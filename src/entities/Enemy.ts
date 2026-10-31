import type { AttackDirection } from '../core/types';

export class Enemy {
  public active = false;
  public x = 0;
  public y = 0;
  public radius = 18;
  public health = 0;
  public maxHealth = 0;
  public speed = 0;
  public direction: AttackDirection = 1;
  public attackTimer = 0;

  public spawn(
    x: number,
    y: number,
    direction: AttackDirection,
    health: number,
    speed: number,
  ): void {
    this.active = true;
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.health = health;
    this.maxHealth = health;
    this.speed = speed;
    this.radius = 14 + Math.min(7, health / 35);
    this.attackTimer = 0;
  }

  public deactivate(): void {
    this.active = false;
  }
}
