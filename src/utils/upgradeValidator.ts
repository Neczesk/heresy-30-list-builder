import { DataLoader } from './dataLoader';
import type { UnitUpgrade, ArmyUpgrade } from '../types/army';

export interface UpgradeValidationContext {
  selectedUpgrades: ArmyUpgrade[];
  previewModels: { [modelId: string]: number };
  baseUnitData: any;
}

export class UpgradeValidator {
  /**
   * Calculate the maximum count for an upgrade based on data-driven rules
   */
  static getMaxCount(upgrade: UnitUpgrade, context: UpgradeValidationContext): number {
    // If it's a fixed number, return it
    if (upgrade.maxCount && upgrade.maxCount !== 'dependent') {
      return upgrade.maxCount;
    }

    // If it's dependent, calculate based on the upgrade's requirements
    if (upgrade.maxCount === 'dependent') {
      return this.calculateDependentMaxCount(upgrade, context);
    }

    return 1; // Default to 1 if no maxCount specified
  }

  /**
   * Calculate dependent max count based on upgrade requirements and context
   */
  private static calculateDependentMaxCount(upgrade: UnitUpgrade, context: UpgradeValidationContext): number {
    const { selectedUpgrades, previewModels } = context;

    // If the upgrade requires another upgrade, count how many times that upgrade is applied
    if (upgrade.requiresUpgrade) {
      const requiredUpgrade = selectedUpgrades.find(u => u.upgradeId === upgrade.requiresUpgrade);
      return requiredUpgrade?.count || 0;
    }

    // If it has a target model type, calculate based on available models
    if (upgrade.targetModelType) {
      return this.calculateModelBasedMaxCount(upgrade, context);
    }

    // If it has a target model (for model-count upgrades), use the model count
    if (upgrade.targetModel) {
      return previewModels[upgrade.targetModel] || 0;
    }

    return 0;
  }

  /**
   * Calculate max count based on model availability and weapon requirements
   */
  private static calculateModelBasedMaxCount(upgrade: UnitUpgrade, context: UpgradeValidationContext): number {
    const { previewModels } = context;
    const targetModelId = upgrade.targetModelType!;
    const totalModels = previewModels[targetModelId] || 0;

    // Get the base model to understand what weapons it starts with
    const baseModel = DataLoader.getModelById(targetModelId);
    if (!baseModel) return 0;

    // Check if this upgrade requires specific weapons to be available
    const weaponRequirements = this.getWeaponRequirements(upgrade);
    if (weaponRequirements.length === 0) {
      // No specific weapon requirements, can be applied to any model of this type
      return totalModels;
    }

    // Calculate how many models still have the required weapons
    // Exclude the current upgrade from the count to avoid double-counting
    return this.calculateAvailableWeaponCount(targetModelId, weaponRequirements, context, upgrade.id);
  }

  /**
   * Extract weapon requirements from an upgrade
   */
  private static getWeaponRequirements(upgrade: UnitUpgrade): string[] {
    const requirements: string[] = [];

    // Check upgrade options for weapon requirements
    if (upgrade.options) {
      upgrade.options.forEach(option => {
        // If the option replaces a weapon, that weapon must be available
        if (option.replaceWeapon) {
          requirements.push(option.replaceWeapon);
        }
        
        // If the option adds a weapon that requires another weapon (like bayonets requiring lasrifles)
        if (option.addWeapon && this.isWeaponRequirement(option.addWeapon as string)) {
          const requiredWeapon = this.getRequiredWeaponForAddon(option.addWeapon as string);
          if (requiredWeapon) {
            requirements.push(requiredWeapon);
          }
        }
      });
    }

    return [...new Set(requirements)]; // Remove duplicates
  }

  /**
   * Check if a weapon is an addon that requires another weapon
   */
  private static isWeaponRequirement(weaponId: string): boolean {
    const addonWeapons = ['bayonet', 'blast-charger'];
    return addonWeapons.includes(weaponId);
  }

  /**
   * Get the weapon required for an addon weapon
   */
  private static getRequiredWeaponForAddon(addonWeaponId: string): string | null {
    const requirements: { [addon: string]: string } = {
      'bayonet': 'lasrifle',
      'blast-charger': 'lasrifle'
    };
    return requirements[addonWeaponId] || null;
  }

  /**
   * Calculate how many models still have the required weapons available
   */
  private static calculateAvailableWeaponCount(
    targetModelId: string, 
    requiredWeapons: string[], 
    context: UpgradeValidationContext,
    excludeUpgradeId?: string
  ): number {
    const { selectedUpgrades, previewModels } = context;
    const totalModels = previewModels[targetModelId] || 0;

    // Count how many models have had their required weapons replaced
    let replacedWeapons = 0;

    // Check all upgrades that target this model type
    selectedUpgrades.forEach(upgrade => {
      // Skip the upgrade we're currently validating (if specified)
      if (excludeUpgradeId && upgrade.upgradeId === excludeUpgradeId) {
        return;
      }

      const upgradeData = DataLoader.getUpgradeById(upgrade.upgradeId);
      if (upgradeData?.targetModelType === targetModelId && upgrade.optionId) {
        const option = upgradeData.options?.find(opt => opt.id === upgrade.optionId);
        if (option) {
          // Count replacements that affect required weapons
          if (option.replaceWeapon && requiredWeapons.includes(option.replaceWeapon)) {
            replacedWeapons += upgrade.count;
          }
          
          // Count weapon replacements that affect required weapons
          if (option.weaponReplacements) {
            option.weaponReplacements.forEach(replacement => {
              if (requiredWeapons.includes(replacement.replaceWeapon)) {
                replacedWeapons += upgrade.count;
              }
            });
          }
        }
      }
    });

    return Math.max(0, totalModels - replacedWeapons);
  }

  /**
   * Check if an upgrade is available for selection
   */
  static isUpgradeAvailable(upgrade: UnitUpgrade, context: UpgradeValidationContext): boolean {
    const { selectedUpgrades } = context;

    // Check if required upgrade is selected
    if (upgrade.requiresUpgrade) {
      const requiredUpgrade = selectedUpgrades.find(u => u.upgradeId === upgrade.requiresUpgrade);
      return requiredUpgrade ? requiredUpgrade.count > 0 : false;
    }

    // Check for mutual exclusivity
    if (this.hasMutualExclusivity(upgrade)) {
      return !this.hasConflictingUpgrade(upgrade, selectedUpgrades);
    }

    return true;
  }

  /**
   * Check if an upgrade has mutual exclusivity rules
   */
  private static hasMutualExclusivity(upgrade: UnitUpgrade): boolean {
    const mutualExclusiveUpgrades = ['lifeward-vexilla-upgrade', 'companion-vexilla-upgrade'];
    return mutualExclusiveUpgrades.includes(upgrade.id);
  }

  /**
   * Check if there's a conflicting upgrade already selected
   */
  private static hasConflictingUpgrade(upgrade: UnitUpgrade, selectedUpgrades: ArmyUpgrade[]): boolean {
    // For vexilla upgrades, check if any other vexilla option is already selected
    if (upgrade.id === 'lifeward-vexilla-upgrade' || upgrade.id === 'companion-vexilla-upgrade') {
      return selectedUpgrades.some(u => u.upgradeId === upgrade.id && u.count > 0);
    }

    return false;
  }

  /**
   * Get all upgrades that should be removed when selecting a mutually exclusive upgrade
   */
  static getConflictingUpgrades(upgradeId: string): string[] {
    const mutualExclusiveUpgrades = ['lifeward-vexilla-upgrade', 'companion-vexilla-upgrade'];
    
    if (mutualExclusiveUpgrades.includes(upgradeId)) {
      return [upgradeId]; // Remove all options of this upgrade type
    }

    return [];
  }

  /**
   * Validate upgrade selection and return any validation errors
   */
  static validateUpgradeSelection(
    upgradeId: string, 
    count: number, 
    context: UpgradeValidationContext
  ): string[] {
    const errors: string[] = [];
    const upgrade = DataLoader.getUpgradeById(upgradeId);
    
    if (!upgrade) {
      errors.push(`Upgrade ${upgradeId} not found`);
      return errors;
    }

    const maxCount = this.getMaxCount(upgrade, context);
    if (count > maxCount) {
      errors.push(`Cannot select more than ${maxCount} instances of ${upgrade.name}`);
    }

    if (!this.isUpgradeAvailable(upgrade, context)) {
      errors.push(`${upgrade.name} is not available for selection`);
    }

    return errors;
  }
} 