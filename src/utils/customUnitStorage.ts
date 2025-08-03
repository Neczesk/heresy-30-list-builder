import type { CustomUnit, CustomUnitMetadata } from '../types/army';

const CUSTOM_UNITS_STORAGE_KEY = 'heresy-custom-units';

export class CustomUnitStorage {
  /**
   * Save a custom unit to local storage
   */
  static saveCustomUnit(customUnit: CustomUnit): void {
    try {
      const existingUnits = this.getAllCustomUnits();
      existingUnits[customUnit.id] = customUnit;

      localStorage.setItem(
        CUSTOM_UNITS_STORAGE_KEY,
        JSON.stringify(existingUnits)
      );
    } catch (error) {
      console.error('Failed to save custom unit:', error);
      throw new Error('Failed to save custom unit');
    }
  }

  /**
   * Get a custom unit by ID
   */
  static getCustomUnit(id: string): CustomUnit | null {
    try {
      const units = this.getAllCustomUnits();
      return units[id] || null;
    } catch (error) {
      console.error('Failed to get custom unit:', error);
      return null;
    }
  }

  /**
   * Get all custom units
   */
  static getAllCustomUnits(): { [id: string]: CustomUnit } {
    try {
      const stored = localStorage.getItem(CUSTOM_UNITS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to get custom units:', error);
      return {};
    }
  }

  /**
   * Get metadata for all custom units (for listing)
   */
  static getAllCustomUnitMetadata(): CustomUnitMetadata[] {
    try {
      const units = this.getAllCustomUnits();
      return Object.values(units).map(unit => ({
        id: unit.id,
        name: unit.name,
        baseUnitId: unit.baseUnitId,
        faction: unit.faction,
        subfaction: unit.subfaction,
        createdAt: unit.createdAt,
        updatedAt: unit.updatedAt,
        description: unit.description,
      }));
    } catch (error) {
      console.error('Failed to get custom unit metadata:', error);
      return [];
    }
  }

  /**
   * Delete a custom unit
   */
  static deleteCustomUnit(id: string): boolean {
    try {
      const units = this.getAllCustomUnits();
      if (units[id]) {
        delete units[id];
        localStorage.setItem(CUSTOM_UNITS_STORAGE_KEY, JSON.stringify(units));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete custom unit:', error);
      return false;
    }
  }

  /**
   * Check if a custom unit name already exists
   */
  static isNameTaken(name: string, excludeId?: string): boolean {
    try {
      const units = this.getAllCustomUnits();
      return Object.values(units).some(
        unit =>
          unit.name.toLowerCase() === name.toLowerCase() &&
          unit.id !== excludeId
      );
    } catch (error) {
      console.error('Failed to check if name is taken:', error);
      return false;
    }
  }

  /**
   * Generate a unique ID from a name
   */
  static generateId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Create a custom unit from an army unit
   */
  static createCustomUnitFromArmyUnit(
    name: string,
    armyUnit: any,
    faction: string,
    subfaction?: string,
    description?: string
  ): CustomUnit {
    const id = this.generateId(name);
    const now = new Date().toISOString();

    return {
      id,
      name,
      baseUnitId: armyUnit.unitId,
      faction,
      subfaction,
      upgrades: armyUnit.upgrades || [],
      primeAdvantages: armyUnit.primeAdvantages,
      modelInstanceWeaponChanges: armyUnit.modelInstanceWeaponChanges,
      modelInstanceWargearChanges: armyUnit.modelInstanceWargearChanges,
      createdAt: now,
      updatedAt: now,
      description,
    };
  }
}
