import type { AttackDirection, EnemyKind } from '../core/types';

export class Enemy {
  public active = false;
  public x = 0;
  public y = 0;
  public radius = 18;
  public kind: EnemyKind = 'runner';
  public health = 0;
  public maxHealth = 0;
  public speed = 0;
  public damage = 0;
  public score = 0;
  public direction: AttackDirection = 1;
  public attackTimer = 0;

  public spawn(
    x: number,
    y: number,
    direction: AttackDirection,
    kind: EnemyKind,
    health: number,
    speed: number,
    damage: number,
    radius: number,
    score: number,
  ): void {
    this.active = true;
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.kind = kind;
    this.health = health;
    this.maxHealth = health;
    this.speed = speed;
    this.damage = damage;
    this.radius = radius;
    this.score = score;
    this.attackTimer = 0;
  }

  public deactivate(): void {
    this.active = false;
  }
}
