import { DataLoader } from './dataLoader';
import { TraitReplacer } from './traitReplacer';
import type { UnitUpgrade, ArmyUpgrade, Allegiance } from '../types/army';

export interface UpgradeValidationContext {
  selectedUpgrades: ArmyUpgrade[];
  previewModels: { [modelId: string]: number };
  baseUnitData: any;
  allegiance: Allegiance;
  legion?: string; // Legion ID for the detachment
}

export class UpgradeValidator {
  /**
   * Calculate the maximum count for an upgrade based on data-driven rules
   */
  static getMaxCount(
    upgrade: UnitUpgrade,
    context: UpgradeValidationContext
  ): number {
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
  private static calculateDependentMaxCount(
    upgrade: UnitUpgrade,
    context: UpgradeValidationContext
  ): number {
    const { selectedUpgrades, previewModels } = context;

    // If the upgrade requires another upgrade, count how many times that upgrade is applied
    if (upgrade.requiresUpgrade) {
      const requiredUpgrade = selectedUpgrades.find(
        u => u.upgradeId === upgrade.requiresUpgrade
      );
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

    // If no specific target is specified, check all models in the unit for weapon requirements
    if (upgrade.requiredWeapons && upgrade.requiredWeapons.length > 0) {
      let totalMaxCount = 0;

      // Check all models in the unit for required weapons
      for (const [modelId, count] of Object.entries(previewModels)) {
        if (count > 0) {
          // Calculate how many models of this type have the required weapons
          const availableWeaponCount = this.calculateAvailableWeaponCount(
            modelId,
            upgrade.requiredWeapons,
            context,
            upgrade.id
          );
          totalMaxCount += availableWeaponCount;
        }
      }

      return totalMaxCount;
    }

    return 0;
  }

  /**
   * Calculate max count based on model availability and weapon requirements
   */
  private static calculateModelBasedMaxCount(
    upgrade: UnitUpgrade,
    context: UpgradeValidationContext
  ): number {
    const { previewModels } = context;

    // Get target model types - support both single and multiple types
    const targetModelTypes =
      upgrade.targetModelTypes ||
      (upgrade.targetModelType ? [upgrade.targetModelType] : []);

    if (targetModelTypes.length === 0) return 0;

    let totalMaxCount = 0;

    // Calculate max count for each target model type
    for (const targetModelId of targetModelTypes) {
      const totalModels = previewModels[targetModelId] || 0;

      // Get the base model to understand what weapons it starts with
      const baseModel = DataLoader.getModelById(targetModelId);
      if (!baseModel) continue;

      // Check if this upgrade requires specific weapons to be available
      const weaponRequirements = this.getWeaponRequirements(upgrade);
      if (weaponRequirements.length === 0) {
        // No specific weapon requirements, can be applied to any model of this type
        totalMaxCount += totalModels;
      } else {
        // Calculate how many models still have the required weapons
        // Exclude the current upgrade from the count to avoid double-counting
        totalMaxCount += this.calculateAvailableWeaponCount(
          targetModelId,
          weaponRequirements,
          context,
          upgrade.id
        );
      }
    }

    return totalMaxCount;
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
        if (
          option.addWeapon &&
          this.isWeaponRequirement(option.addWeapon as string)
        ) {
          const requiredWeapon = this.getRequiredWeaponForAddon(
            option.addWeapon as string
          );
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
  private static getRequiredWeaponForAddon(
    addonWeaponId: string
  ): string | null {
    const requirements: { [addon: string]: string } = {
      bayonet: 'lasrifle',
      'blast-charger': 'lasrifle',
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
      if (!upgradeData) return;

      const targetModelTypes =
        upgradeData.targetModelTypes ||
        (upgradeData.targetModelType ? [upgradeData.targetModelType] : []);

      if (targetModelTypes.includes(targetModelId) && upgrade.optionId) {
        const option = upgradeData.options?.find(
          opt => opt.id === upgrade.optionId
        );
        if (option) {
          // Count replacements that affect required weapons
          if (
            option.replaceWeapon &&
            requiredWeapons.includes(option.replaceWeapon)
          ) {
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
  static isUpgradeAvailable(
    upgrade: UnitUpgrade,
    context: UpgradeValidationContext
  ): boolean {
    const { selectedUpgrades } = context;

    // Check legion restrictions
    if (
      upgrade.legionRestriction &&
      !this.checkLegionRestriction(upgrade, context)
    ) {
      return false;
    }

    // Check subtype restrictions
    if (
      upgrade.subTypeRestriction &&
      !this.checkSubTypeRestriction(upgrade, context)
    ) {
      return false;
    }

    // Check weapon requirements
    if (
      upgrade.requiredWeapons &&
      !this.checkRequiredWeapons(upgrade, context)
    ) {
      return false;
    }

    // Check if required upgrade is selected
    if (upgrade.requiresUpgrade) {
      const requiredUpgrade = selectedUpgrades.find(
        u => u.upgradeId === upgrade.requiresUpgrade
      );
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
    const mutualExclusiveUpgrades = [
      'lifeward-vexilla-upgrade',
      'companion-vexilla-upgrade',
    ];
    return mutualExclusiveUpgrades.includes(upgrade.id);
  }

  /**
   * Check if there's a conflicting upgrade already selected
   */
  private static hasConflictingUpgrade(
    upgrade: UnitUpgrade,
    selectedUpgrades: ArmyUpgrade[]
  ): boolean {
    // For vexilla upgrades, check if any other vexilla option is already selected
    if (
      upgrade.id === 'lifeward-vexilla-upgrade' ||
      upgrade.id === 'companion-vexilla-upgrade'
    ) {
      return selectedUpgrades.some(
        u => u.upgradeId === upgrade.id && u.count > 0
      );
    }

    return false;
  }

  /**
   * Get all upgrades that should be removed when selecting a mutually exclusive upgrade
   */
  static getConflictingUpgrades(upgradeId: string): string[] {
    const mutualExclusiveUpgrades = [
      'lifeward-vexilla-upgrade',
      'companion-vexilla-upgrade',
    ];

    if (mutualExclusiveUpgrades.includes(upgradeId)) {
      return [upgradeId]; // Remove all options of this upgrade type
    }

    return [];
  }

  /**
   * Check if an upgrade meets legion restrictions
   */
  private static checkLegionRestriction(
    upgrade: UnitUpgrade,
    context: UpgradeValidationContext
  ): boolean {
    if (!upgrade.legionRestriction) return true;

    // Get the legion from the context
    const legion = context.legion;

    // If no legion is specified, check if the upgrade requires a specific legion
    if (!legion) {
      return false;
    }

    return legion === upgrade.legionRestriction;
  }

  /**
   * Check if an upgrade meets subtype restrictions
   */
  private static checkSubTypeRestriction(
    upgrade: UnitUpgrade,
    context: UpgradeValidationContext
  ): boolean {
    if (!upgrade.subTypeRestriction) return true;

    // Get target model types for this upgrade
    const targetModelTypes =
      upgrade.targetModelTypes ||
      (upgrade.targetModelType ? [upgrade.targetModelType] : []);

    // If no specific model types are targeted, check all models in the unit
    if (targetModelTypes.length === 0) {
      // Check all models in the unit for required subtypes
      for (const [modelId, count] of Object.entries(context.previewModels)) {
        if (count > 0) {
          const model = DataLoader.getModelById(modelId);
          if (model && model.subType) {
            const modelSubTypes = Array.isArray(model.subType)
              ? model.subType
              : [model.subType];
            const requiredSubTypes = Array.isArray(upgrade.subTypeRestriction)
              ? upgrade.subTypeRestriction
              : [upgrade.subTypeRestriction];

            // Check if any of the model's subtypes match the required subtypes
            if (
              modelSubTypes.some(subType => requiredSubTypes.includes(subType))
            ) {
              return true;
            }
          }
        }
      }

      return false;
    }

    // Check if any of the target models have the required subtypes
    for (const modelType of targetModelTypes) {
      const model = DataLoader.getModelById(modelType);
      if (model && model.subType) {
        const modelSubTypes = Array.isArray(model.subType)
          ? model.subType
          : [model.subType];
        const requiredSubTypes = Array.isArray(upgrade.subTypeRestriction)
          ? upgrade.subTypeRestriction
          : [upgrade.subTypeRestriction];

        // Check if any of the model's subtypes match the required subtypes
        if (modelSubTypes.some(subType => requiredSubTypes.includes(subType))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if an upgrade meets weapon requirements
   */
  private static checkRequiredWeapons(
    upgrade: UnitUpgrade,
    context: UpgradeValidationContext
  ): boolean {
    if (!upgrade.requiredWeapons || upgrade.requiredWeapons.length === 0) {
      return true;
    }

    // Get target model types for this upgrade
    const targetModelTypes =
      upgrade.targetModelTypes ||
      (upgrade.targetModelType ? [upgrade.targetModelType] : []);

    // If no specific model types are targeted, check all models in the unit
    if (targetModelTypes.length === 0) {
      // Check all models in the unit for required weapons
      for (const [modelId, count] of Object.entries(context.previewModels)) {
        if (count > 0) {
          const hasWeapons = this.modelHasRequiredWeaponsWithUpgrades(
            modelId,
            upgrade.requiredWeapons!,
            context
          );

          if (hasWeapons) {
            return true;
          }
        }
      }
      return false;
    }

    // Check if any of the target models have the required weapons
    for (const modelType of targetModelTypes) {
      if (
        this.modelHasRequiredWeaponsWithUpgrades(
          modelType,
          upgrade.requiredWeapons!,
          context
        )
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a model has the required weapons (base weapons only)
   */
  private static modelHasRequiredWeapons(
    model: any,
    requiredWeapons: string[]
  ): boolean {
    if (!model.weapons) return false;

    // Convert model weapons to a flat array of weapon IDs
    const modelWeaponIds: string[] = [];

    if (Array.isArray(model.weapons)) {
      model.weapons.forEach((weapon: any) => {
        if (typeof weapon === 'string') {
          modelWeaponIds.push(weapon);
        } else if (weapon.id) {
          modelWeaponIds.push(weapon.id);
        }
      });
    }

    // Check if the model has any of the required weapons
    return requiredWeapons.some(requiredWeapon =>
      modelWeaponIds.includes(requiredWeapon)
    );
  }

  /**
   * Check if a model has the required weapons (including weapons from upgrades)
   */
  private static modelHasRequiredWeaponsWithUpgrades(
    modelId: string,
    requiredWeapons: string[],
    context: UpgradeValidationContext
  ): boolean {
    const model = DataLoader.getModelById(modelId);
    if (!model) return false;

    // Get the model's effective weapons after applying upgrades
    const effectiveWeapons = this.calculateEffectiveWeapons(
      modelId,
      model.weapons || [],
      context.selectedUpgrades,
      1 // We only need to check if the weapon exists, not count
    );

    // Convert effective weapons to a flat array of weapon IDs
    const effectiveWeaponIds = effectiveWeapons.map(weapon => weapon.weaponId);

    // Check if the model has any of the required weapons
    return requiredWeapons.some(requiredWeapon =>
      effectiveWeaponIds.includes(requiredWeapon)
    );
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
      errors.push(
        `Cannot select more than ${maxCount} instances of ${upgrade.name}`
      );
    }

    if (!this.isUpgradeAvailable(upgrade, context)) {
      errors.push(`${upgrade.name} is not available for selection`);
    }

    return errors;
  }

  /**
   * Calculate the effective weapons for a model after upgrades are applied
   */
  static calculateEffectiveWeapons(
    modelId: string,
    baseWeapons: (string | { id: string; mount?: string; count?: number })[],
    selectedUpgrades: ArmyUpgrade[],
    _modelCount: number
  ): { weaponId: string; count: number; mount?: string }[] {
    // If no upgrades, just return base weapons in the expected format
    if (selectedUpgrades.length === 0) {
      return baseWeapons.map(weaponEntry => {
        const weaponId =
          typeof weaponEntry === 'string' ? weaponEntry : weaponEntry.id;
        const mount =
          typeof weaponEntry === 'string' ? undefined : weaponEntry.mount;
        const count =
          typeof weaponEntry === 'string' ? 1 : weaponEntry.count || 1;
        return { weaponId, count, mount };
      });
    }

    // Start with base weapons
    const weaponCounts = new Map<string, { count: number; mount?: string }>();

    // Initialize with base weapons
    baseWeapons.forEach(weaponEntry => {
      const weaponId =
        typeof weaponEntry === 'string' ? weaponEntry : weaponEntry.id;
      const mount =
        typeof weaponEntry === 'string' ? undefined : weaponEntry.mount;
      const count =
        typeof weaponEntry === 'string' ? 1 : weaponEntry.count || 1;

      // For base weapons, treat the entire string as the weapon ID
      const key = weaponId;
      weaponCounts.set(key, {
        count: (weaponCounts.get(key)?.count || 0) + count,
        mount,
      });
    });

    // Apply upgrades that affect this model
    selectedUpgrades.forEach(upgrade => {
      const upgradeData = DataLoader.getUpgradeById(upgrade.upgradeId);
      if (!upgradeData) return;

      // Check if this upgrade affects the target model
      const targetModelTypes =
        upgradeData.targetModelTypes ||
        (upgradeData.targetModelType ? [upgradeData.targetModelType] : []);

      // Get the model to check its modelTypes
      const model = DataLoader.getModelById(modelId);
      const modelModelTypes = model?.modelTypes || [];

      const affectsThisModel =
        targetModelTypes.includes(modelId) ||
        upgradeData.targetModel === modelId ||
        targetModelTypes.some(targetType =>
          modelModelTypes.includes(targetType)
        );

      if (affectsThisModel) {
        if (upgrade.optionId) {
          // Handle upgrade options
          const option = upgradeData.options?.find(
            opt => opt.id === upgrade.optionId
          );
          if (option) {
            this.applyWeaponOption(option, weaponCounts, upgrade.count);
          }
        } else {
          // Handle simple upgrades
          this.applyWeaponUpgrade(upgradeData, weaponCounts, upgrade.count);
        }
      }
    });

    // Convert back to array format and filter out weapons with 0 count
    const effectiveWeapons: {
      weaponId: string;
      count: number;
      mount?: string;
    }[] = [];
    weaponCounts.forEach((value, key) => {
      if (value.count > 0) {
        effectiveWeapons.push({
          weaponId: key,
          count: value.count,
          mount: value.mount,
        });
      }
    });

    return effectiveWeapons;
  }

  /**
   * Apply a weapon option to the weapon counts
   */
  private static applyWeaponOption(
    option: any,
    weaponCounts: Map<string, { count: number; mount?: string }>,
    upgradeCount: number
  ) {
    // Handle weapon replacements
    if (option.replaceWeapon) {
      const key = option.replaceWeapon;
      const current = weaponCounts.get(key) || { count: 0 };
      weaponCounts.set(key, {
        ...current,
        count: Math.max(0, current.count - upgradeCount),
      });
    }

    // Handle weapon additions
    if (option.addWeapon) {
      const weaponId =
        typeof option.addWeapon === 'string'
          ? option.addWeapon
          : option.addWeapon.id;
      const mount =
        typeof option.addWeapon === 'string'
          ? undefined
          : option.addWeapon.mount;
      const key = weaponId;
      const current = weaponCounts.get(key) || { count: 0, mount };
      weaponCounts.set(key, {
        ...current,
        count: current.count + upgradeCount,
      });
    }

    // Handle weapon replacements array
    if (option.weaponReplacements) {
      option.weaponReplacements.forEach((replacement: any) => {
        const replaceKey = replacement.replaceWeapon;
        const current = weaponCounts.get(replaceKey) || { count: 0 };
        weaponCounts.set(replaceKey, {
          ...current,
          count: Math.max(0, current.count - upgradeCount),
        });

        // Check for addWeapon (correct field name)
        if (replacement.addWeapon) {
          const weaponId =
            typeof replacement.addWeapon === 'string'
              ? replacement.addWeapon
              : replacement.addWeapon.id;
          const mount =
            typeof replacement.addWeapon === 'string'
              ? undefined
              : replacement.addWeapon.mount;
          const key = weaponId;
          const currentAdd = weaponCounts.get(key) || { count: 0, mount };
          weaponCounts.set(key, {
            ...currentAdd,
            count: currentAdd.count + upgradeCount,
          });
        }

        // Also check for withWeapon (old field name) for backward compatibility
        if (replacement.withWeapon) {
          const weaponId =
            typeof replacement.withWeapon === 'string'
              ? replacement.withWeapon
              : replacement.withWeapon.id;
          const mount =
            typeof replacement.withWeapon === 'string'
              ? undefined
              : replacement.withWeapon.mount;
          const key = weaponId;
          const currentAdd = weaponCounts.get(key) || { count: 0, mount };
          weaponCounts.set(key, {
            ...currentAdd,
            count: currentAdd.count + upgradeCount,
          });
        }
      });
    }
  }

  /**
   * Apply a simple weapon upgrade to the weapon counts
   */
  private static applyWeaponUpgrade(
    upgrade: any,
    weaponCounts: Map<string, { count: number; mount?: string }>,
    upgradeCount: number
  ) {
    // Handle simple weapon replacements
    if (upgrade.replaceWeapon) {
      const key = upgrade.replaceWeapon;
      const current = weaponCounts.get(key) || { count: 0 };
      weaponCounts.set(key, {
        ...current,
        count: Math.max(0, current.count - upgradeCount),
      });
    }

    // Handle simple weapon additions
    if (upgrade.addWeapon) {
      const weaponId =
        typeof upgrade.addWeapon === 'string'
          ? upgrade.addWeapon
          : upgrade.addWeapon.id;
      const mount =
        typeof upgrade.addWeapon === 'string'
          ? undefined
          : upgrade.addWeapon.mount;
      const key = weaponId;
      const current = weaponCounts.get(key) || { count: 0, mount };
      weaponCounts.set(key, {
        ...current,
        count: current.count + upgradeCount,
      });
    }
  }

  /**
   * Calculate the effective wargear for a model after upgrades are applied
   */
  static calculateEffectiveWargear(
    modelId: string,
    baseWargear: string[],
    selectedUpgrades: ArmyUpgrade[]
  ): string[] {
    // Start with base wargear
    const wargearCounts = new Map<string, number>();

    // Initialize with base wargear
    baseWargear.forEach(wargearId => {
      wargearCounts.set(wargearId, (wargearCounts.get(wargearId) || 0) + 1);
    });

    // Apply upgrades that affect this model
    selectedUpgrades.forEach(upgrade => {
      const upgradeData = DataLoader.getUpgradeById(upgrade.upgradeId);
      if (!upgradeData) return;

      // Check if this upgrade affects the target model
      const targetModelTypes =
        upgradeData.targetModelTypes ||
        (upgradeData.targetModelType ? [upgradeData.targetModelType] : []);

      // Get the model to check its modelTypes
      const model = DataLoader.getModelById(modelId);
      const modelModelTypes = model?.modelTypes || [];

      const affectsThisModel =
        targetModelTypes.includes(modelId) ||
        upgradeData.targetModel === modelId ||
        targetModelTypes.some(targetType =>
          modelModelTypes.includes(targetType)
        );

      if (affectsThisModel) {
        if (upgrade.optionId) {
          // Handle upgrade options
          const option = upgradeData.options?.find(
            opt => opt.id === upgrade.optionId
          );
          if (option) {
            this.applyWargearOption(option, wargearCounts, upgrade.count);
          }
        } else {
          // Handle simple upgrades
          this.applyWargearUpgrade(upgradeData, wargearCounts, upgrade.count);
        }
      }
    });

    // Convert back to array format and filter out wargear with 0 count
    const effectiveWargear: string[] = [];
    wargearCounts.forEach((count, wargearId) => {
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          effectiveWargear.push(wargearId);
        }
      }
    });

    return effectiveWargear;
  }

  /**
   * Apply a wargear option to the wargear counts
   */
  private static applyWargearOption(
    option: any,
    wargearCounts: Map<string, number>,
    upgradeCount: number
  ) {
    // Handle wargear replacements
    if (option.replaceWargear) {
      const current = wargearCounts.get(option.replaceWargear) || 0;
      wargearCounts.set(
        option.replaceWargear,
        Math.max(0, current - upgradeCount)
      );
    }

    // Handle wargear additions
    if (option.addWargear) {
      const wargearId =
        typeof option.addWargear === 'string'
          ? option.addWargear
          : option.addWargear.id;
      const current = wargearCounts.get(wargearId) || 0;
      wargearCounts.set(wargearId, current + upgradeCount);
    }
  }

  /**
   * Apply a simple wargear upgrade to the wargear counts
   */
  private static applyWargearUpgrade(
    upgrade: any,
    wargearCounts: Map<string, number>,
    upgradeCount: number
  ) {
    // Handle simple wargear replacements
    if (upgrade.replaceWargear) {
      const current = wargearCounts.get(upgrade.replaceWargear) || 0;
      wargearCounts.set(
        upgrade.replaceWargear,
        Math.max(0, current - upgradeCount)
      );
    }

    // Handle simple wargear additions
    if (upgrade.addWargear) {
      const wargearId =
        typeof upgrade.addWargear === 'string'
          ? upgrade.addWargear
          : upgrade.addWargear.id;
      const current = wargearCounts.get(wargearId) || 0;
      wargearCounts.set(wargearId, current + upgradeCount);
    }
  }
}
