export type UpgradeId = 'damage' | 'attackSpeed' | 'range' | 'health' | 'crit' | 'lifesteal';
export type AbilityId = 'nova' | 'execution' | 'storm';

export interface UpgradeConfig {
  label: string;
  description: string;
  baseCost: number;
  costGrowth: number;
  maxLevel: number;
  valuePerLevel: number;
}

export interface AbilityConfig {
  label: string;
  description: string;
  cost: number;
  cooldown: number;
}

export const PROGRESSION_CONFIG: {
  currencyPerKill: number;
  deathBonus: number;
  upgrades: Record<UpgradeId, UpgradeConfig>;
  abilities: Record<AbilityId, AbilityConfig>;
} = {
  currencyPerKill: 2,
  deathBonus: 10,
  upgrades: {
    damage: {
      label: 'EDGE',
      description: '+10% attack damage',
      baseCost: 40,
      costGrowth: 1.65,
      maxLevel: 10,
      valuePerLevel: 0.1,
    },
    attackSpeed: {
      label: 'TEMPO',
      description: '-6% attack cooldown',
      baseCost: 55,
      costGrowth: 1.7,
      maxLevel: 10,
      valuePerLevel: 0.06,
    },
    range: {
      label: 'REACH',
      description: '+12 attack range',
      baseCost: 45,
      costGrowth: 1.6,
      maxLevel: 8,
      valuePerLevel: 12,
    },
    health: {
      label: 'VIGOR',
      description: '+15 maximum health',
      baseCost: 50,
      costGrowth: 1.65,
      maxLevel: 10,
      valuePerLevel: 15,
    },
    crit: {
      label: 'FATE',
      description: '+5% critical chance',
      baseCost: 70,
      costGrowth: 1.75,
      maxLevel: 10,
      valuePerLevel: 0.05,
    },
    lifesteal: {
      label: 'HUNGER',
      description: '+3% life steal',
      baseCost: 85,
      costGrowth: 1.8,
      maxLevel: 8,
      valuePerLevel: 0.03,
    },
  },
  abilities: {
    nova: {
      label: 'VOID NOVA',
      description: 'Damage every nearby shadow',
      cost: 180,
      cooldown: 18,
    },
    execution: {
      label: 'EXECUTION',
      description: 'Instantly destroy wounded enemies',
      cost: 260,
      cooldown: 24,
    },
    storm: {
      label: 'BLADE STORM',
      description: 'Strike enemies on both sides',
      cost: 340,
      cooldown: 30,
    },
  },
};
