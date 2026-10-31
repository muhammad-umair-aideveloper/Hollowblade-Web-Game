export const GAME_CONFIG = {
  fixedStep: 1 / 60,
  maxFrameDelta: 0.1,
  player: {
    maxHealth: 100,
    attackDamage: 34,
    attackCooldown: 0.34,
    attackRange: 150,
  },
  enemy: {
    poolSize: 320,
    baseHealth: 40,
    baseSpeed: 42,
    spawnInterval: 0.9,
    spawnDistance: 480,
    damage: 12,
    attackCooldown: 0.85,
  },
  wave: {
    enemiesPerWave: 12,
    waveDuration: 12,
    speedGrowth: 0.06,
  },
} as const;
