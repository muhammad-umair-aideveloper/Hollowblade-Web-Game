import type { AbilityId, UpgradeId } from '../data/progressionConfig';

interface SaveData {
  version: 1;
  currency: number;
  upgrades: Record<UpgradeId, number>;
  abilities: Record<AbilityId, boolean>;
}

const SAVE_KEY = 'hollowblade-save';

const EMPTY_SAVE: SaveData = {
  version: 1,
  currency: 0,
  upgrades: {
    damage: 0,
    attackSpeed: 0,
    range: 0,
    health: 0,
    crit: 0,
    lifesteal: 0,
  },
  abilities: {
    nova: false,
    execution: false,
    storm: false,
  },
};

export class SaveSystem {
  private data: SaveData;

  public constructor() {
    this.data = this.load();
  }

  public get currency(): number {
    return this.data.currency;
  }

  public get upgrades(): Readonly<Record<UpgradeId, number>> {
    return this.data.upgrades;
  }

  public get abilities(): Readonly<Record<AbilityId, boolean>> {
    return this.data.abilities;
  }

  public addCurrency(amount: number): void {
    this.data.currency += Math.max(0, Math.floor(amount));
    this.persist();
  }

  public spend(amount: number): boolean {
    if (amount > this.data.currency) {
      return false;
    }
    this.data.currency -= amount;
    this.persist();
    return true;
  }

  public setUpgrade(id: UpgradeId, level: number): void {
    this.data.upgrades[id] = level;
    this.persist();
  }

  public unlockAbility(id: AbilityId): void {
    this.data.abilities[id] = true;
    this.persist();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        return structuredClone(EMPTY_SAVE);
      }

      const parsed: unknown = JSON.parse(raw);
      if (!this.isSaveData(parsed)) {
        return structuredClone(EMPTY_SAVE);
      }
      return parsed;
    } catch {
      return structuredClone(EMPTY_SAVE);
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      // Persistence is best effort when storage is disabled or full.
    }
  }

  private isSaveData(value: unknown): value is SaveData {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const candidate = value as Partial<SaveData>;
    return candidate.version === 1 && typeof candidate.currency === 'number';
  }
}
