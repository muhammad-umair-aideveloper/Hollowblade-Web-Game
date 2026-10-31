import { GAME_CONFIG } from '../config/gameConfig';
import { Enemy } from '../entities/Enemy';

export class EnemyPool {
  public readonly items: Enemy[];

  public constructor() {
    this.items = [];
    for (let index = 0; index < GAME_CONFIG.enemy.poolSize; index += 1) {
      this.items.push(new Enemy());
    }
  }

  public spawn(
    x: number,
    y: number,
    direction: -1 | 1,
    health: number,
    speed: number,
  ): Enemy | undefined {
    for (let index = 0; index < this.items.length; index += 1) {
      const enemy = this.items[index];
      if (!enemy.active) {
        enemy.spawn(x, y, direction, health, speed);
        return enemy;
      }
    }
    return undefined;
  }

  public deactivateAll(): void {
    for (let index = 0; index < this.items.length; index += 1) {
      this.items[index].deactivate();
    }
  }
}
