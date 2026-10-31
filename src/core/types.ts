export type AttackDirection = -1 | 1;

export interface EnemySnapshot {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  health: number;
  maxHealth: number;
  direction: AttackDirection;
  attackTimer: number;
}
