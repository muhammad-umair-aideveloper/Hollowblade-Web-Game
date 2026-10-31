export const GAME_CONFIG = {
  fixedStep: 1 / 60,
  maxFrameDelta: 0.1,
  player: {
    maxHealth: 100,
    attackDamage: 34,
    attackCooldown: 0.34,
    attackRange: 150,
  },
  feel: {
    hitStop: 0.045,
    killSlowMotion: 0.18,
    slowMotionDuration: 0.22,
    screenShakeOnHit: 0.08,
    screenShakeOnKill: 0.14,
    damageFlashDuration: 0.12,
    comboTimeout: 1.8,
  },
  enemy: {
    poolSize: 320,
    spawnInterval: 0.9,
    spawnDistance: 480,
    attackCooldown: 0.85,
    bossEvery: 3,
    types: {
      runner: { health: 40, speed: 42, damage: 12, radius: 16, score: 10 },
      fast: { health: 26, speed: 78, damage: 9, radius: 12, score: 15 },
      tank: { health: 125, speed: 24, damage: 22, radius: 25, score: 35 },
      ranged: { health: 48, speed: 32, damage: 14, radius: 17, score: 25 },
      boss: { health: 520, speed: 18, damage: 30, radius: 42, score: 250 },
    },
  },
  wave: {
    waveDuration: 12,
    speedGrowth: 0.06,
    healthGrowth: 0.1,
  },
} as const;
