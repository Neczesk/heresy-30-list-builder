import factionsData from '../data/factions.json';
import ritesOfWarData from '../data/ritesOfWar.json';
import battlefieldRolesData from '../data/battlefieldRoles.json';
import detachmentsData from '../data/detachments.json';
import unitsData from '../data/units.json';
import upgradesData from '../data/upgrades.json';
import primeAdvantagesData from '../data/primeAdvantages.json';
import specialRulesData from '../data/specialRules.json';
import modelsData from '../data/models.json';
import weaponsData from '../data/weapons.json';
import type {
  Faction,
  Detachment,
  Unit,
  UnitUpgrade,
  UpgradeOption,
  ArmyUnit,
  BattlefieldRole,
  RiteOfWar,
  PrimeAdvantageDefinition,
  Army,
  Allegiance,
  SpecialRule,
  Model,
  Weapon,
  RangedWeapon,
  MeleeWeapon,
} from '../types/army';

export class DataLoader {
  // Special Rules methods
  static getSpecialRules(): SpecialRule[] {
    return (specialRulesData as any).specialRules as SpecialRule[];
  }

  static getSpecialRuleById(id: string): SpecialRule | undefined {
    return ((specialRulesData as any).specialRules as SpecialRule[]).find(
      rule => rule.id === id
    );
  }

  static getSpecialRulesByIds(ids: string[]): SpecialRule[] {
    return ((specialRulesData as any).specialRules as SpecialRule[]).filter(
      rule => ids.includes(rule.id)
    );
  }

  // Model methods
  static getModels(): Model[] {
    return (modelsData as any).models as Model[];
  }

  static getModelById(id: string): Model | undefined {
    return ((modelsData as any).models as Model[]).find(
      model => model.id === id
    );
  }

  static getModelsByType(type: string): Model[] {
    return ((modelsData as any).models as Model[]).filter(
      model => model.type === type
    );
  }

  static getModelsBySubType(subType: string): Model[] {
    return ((modelsData as any).models as Model[]).filter(
      model => model.subType === subType
    );
  }

  static getModelsByTypeAndSubType(type: string, subType: string): Model[] {
    return ((modelsData as any).models as Model[]).filter(
      model => model.type === type && model.subType === subType
    );
  }

  static getModelsForUnit(unitId: string): { model: Model; count: number }[] {
    const unit = this.getUnitById(unitId);
    if (!unit || !unit.models) return [];

    const models: { model: Model; count: number }[] = [];
    Object.entries(unit.models).forEach(([modelId, count]) => {
      const model = this.getModelById(modelId);
      if (model) {
        models.push({ model, count });
      }
    });

    return models;
  }

  static isVehicleModel(model: Model): boolean {
    return model.type === 'Vehicle';
  }

  static isInfantryModel(model: Model): boolean {
    return model.type === 'Infantry';
  }

  // Weapon methods
  static getWeapons(): Weapon[] {
    return (weaponsData as any).weapons as Weapon[];
  }

  static getWeaponById(id: string): Weapon | undefined {
    return ((weaponsData as any).weapons as Weapon[]).find(
      weapon => weapon.id === id
    );
  }

  static getRangedWeapons(): RangedWeapon[] {
    return ((weaponsData as any).weapons as Weapon[]).filter(
      weapon => weapon.type === 'ranged'
    ) as RangedWeapon[];
  }

  static getMeleeWeapons(): MeleeWeapon[] {
    return ((weaponsData as any).weapons as Weapon[]).filter(
      weapon => weapon.type === 'melee'
    ) as MeleeWeapon[];
  }

  static getWeaponsByType(type: 'ranged' | 'melee'): Weapon[] {
    return ((weaponsData as any).weapons as Weapon[]).filter(
      weapon => weapon.type === type
    );
  }

  static getWeaponsByIds(ids: string[]): Weapon[] {
    return ((weaponsData as any).weapons as Weapon[]).filter(weapon =>
      ids.includes(weapon.id)
    );
  }

  static isRangedWeapon(weapon: Weapon): weapon is RangedWeapon {
    return weapon.type === 'ranged';
  }

  static isMeleeWeapon(weapon: Weapon): weapon is MeleeWeapon {
    return weapon.type === 'melee';
  }

  static getWeaponsForModel(modelId: string): Weapon[] {
    const model = this.getModelById(modelId);
    if (!model || !model.weapons) return [];

    // Handle new weapon structure with mount locations
    if (
      Array.isArray(model.weapons) &&
      model.weapons.length > 0 &&
      typeof model.weapons[0] === 'object' &&
      'id' in model.weapons[0]
    ) {
      // New structure: Array of { id: string, mount?: string, count?: number }
      const weapons: Weapon[] = [];
      (
        model.weapons as Array<{ id: string; mount?: string; count?: number }>
      ).forEach(weaponEntry => {
        const weapon = this.getWeaponById(weaponEntry.id);
        if (weapon) {
          const count = weaponEntry.count || 1;
          for (let i = 0; i < count; i++) {
            weapons.push(weapon);
          }
        }
      });
      return weapons;
    } else {
      // Old structure: Array of strings
      return (model.weapons as unknown as string[])
        .map(weaponId => this.getWeaponById(weaponId))
        .filter(weapon => weapon !== undefined) as Weapon[];
    }
  }

  static getRangedWeaponsForModel(modelId: string): RangedWeapon[] {
    return this.getWeaponsForModel(modelId).filter(weapon =>
      this.isRangedWeapon(weapon)
    ) as RangedWeapon[];
  }

  static getMeleeWeaponsForModel(modelId: string): MeleeWeapon[] {
    return this.getWeaponsForModel(modelId).filter(weapon =>
      this.isMeleeWeapon(weapon)
    ) as MeleeWeapon[];
  }

  static getWeaponsForUnit(unitId: string): Weapon[] {
    const unit = this.getUnitById(unitId);
    if (!unit || !unit.models) return [];

    const allWeapons: Weapon[] = [];
    Object.entries(unit.models).forEach(([modelId]) => {
      const modelWeapons = this.getWeaponsForModel(modelId);
      allWeapons.push(...modelWeapons);
    });

    return allWeapons;
  }

  // Faction methods
  static getFactions(): Faction[] {
    return (factionsData as any).factions as Faction[];
  }

  static getFactionById(id: string): Faction | undefined {
    return ((factionsData as any).factions as Faction[]).find(
      faction => faction.id === id
    );
  }

  static getFactionsByType(type: string): Faction[] {
    return ((factionsData as any).factions as Faction[]).filter(
      faction => faction.type === type
    );
  }

  static getFactionsByAllegiance(allegiance: Allegiance): Faction[] {
    return ((factionsData as any).factions as Faction[]).filter(
      faction =>
        faction.allegiance === allegiance || faction.allegiance === 'Universal'
    );
  }

  static getFactionsByAllegianceAndType(
    allegiance: Allegiance,
    type: string
  ): Faction[] {
    return ((factionsData as any).factions as Faction[]).filter(
      faction =>
        (faction.allegiance === allegiance ||
          faction.allegiance === 'Universal') &&
        faction.type === type
    );
  }

  static getMainFactions(): Faction[] {
    return ((factionsData as any).factions as Faction[]).filter(
      faction => faction.isMainFaction
    );
  }

  static getMainFactionsByAllegiance(allegiance: Allegiance): Faction[] {
    return ((factionsData as any).factions as Faction[]).filter(
      faction =>
        faction.isMainFaction &&
        (faction.allegiance === allegiance ||
          faction.allegiance === 'Universal')
    );
  }

  static getSubFactions(parentFactionId: string): Faction[] {
    return ((factionsData as any).factions as Faction[]).filter(
      faction => faction.parentFaction === parentFactionId
    );
  }

  static getSubFactionsByAllegiance(
    parentFactionId: string,
    allegiance: Allegiance
  ): Faction[] {
    return ((factionsData as any).factions as Faction[]).filter(
      faction =>
        faction.parentFaction === parentFactionId &&
        (faction.allegiance === allegiance ||
          faction.allegiance === 'Universal')
    );
  }

  static getLegionSubFactions(): Faction[] {
    return this.getSubFactions('legiones-astartes');
  }

  static getLegionSubFactionsByAllegiance(allegiance: Allegiance): Faction[] {
    return this.getSubFactionsByAllegiance('legiones-astartes', allegiance);
  }

  // Rites of War methods
  static getRitesOfWar(): RiteOfWar[] {
    return (ritesOfWarData as any).ritesOfWar as RiteOfWar[];
  }

  static getRiteOfWarById(id: string): RiteOfWar | undefined {
    return ((ritesOfWarData as any).ritesOfWar as RiteOfWar[]).find(
      rite => rite.id === id
    );
  }

  static getRitesOfWarByFaction(factionId: string): RiteOfWar[] {
    return ((ritesOfWarData as any).ritesOfWar as RiteOfWar[]).filter(
      rite => rite.faction === factionId
    );
  }

  // Battlefield Role methods
  static getBattlefieldRoles(): BattlefieldRole[] {
    return (battlefieldRolesData as any).battlefieldRoles as BattlefieldRole[];
  }

  static getBattlefieldRoleById(id: string): BattlefieldRole | undefined {
    return (
      (battlefieldRolesData as any).battlefieldRoles as BattlefieldRole[]
    ).find(role => role.id === id);
  }

  // Detachment methods
  static getDetachments(): Detachment[] {
    return (detachmentsData as any).detachments as Detachment[];
  }

  static getDetachmentById(id: string): Detachment | undefined {
    return ((detachmentsData as any).detachments as Detachment[]).find(
      detachment => detachment.id === id
    );
  }

  static getDetachmentsByType(type: string): Detachment[] {
    return ((detachmentsData as any).detachments as Detachment[]).filter(
      detachment => detachment.type === type
    );
  }

  static getPrimaryDetachments(): Detachment[] {
    return this.getDetachmentsByType('Primary');
  }

  static getAuxiliaryDetachments(): Detachment[] {
    return this.getDetachmentsByType('Auxiliary');
  }

  static getApexDetachments(): Detachment[] {
    return this.getDetachmentsByType('Apex');
  }

  static getUniversalDetachments(): Detachment[] {
    return this.getDetachmentsByType('Universal');
  }

  static getAlliedDetachments(): Detachment[] {
    return this.getDetachmentsByType('Allied');
  }

  // New methods for detachment availability
  static getAvailableDetachments(armyList: Army): Detachment[] {
    const availableDetachments: Detachment[] = [];
    const allDetachments = this.getDetachments();

    for (const detachment of allDetachments) {
      if (this.isDetachmentAvailable(detachment, armyList)) {
        availableDetachments.push(detachment);
      }
    }

    return availableDetachments;
  }

  static isDetachmentAvailable(
    detachment: Detachment,
    armyList: Army
  ): boolean {
    // Check if detachment is already added
    const existingDetachment = armyList.detachments.find(
      d => d.detachmentId === detachment.id
    );
    if (existingDetachment) {
      return false;
    }

    // Check requirements
    if (!this.checkDetachmentRequirements(detachment, armyList)) {
      return false;
    }

    // Check restrictions
    if (!this.checkDetachmentRestrictions(detachment, armyList)) {
      return false;
    }

    // Check triggers
    if (!this.checkDetachmentTriggers(detachment, armyList)) {
      return false;
    }

    return true;
  }

  private static checkDetachmentRequirements(
    detachment: Detachment,
    armyList: Army
  ): boolean {
    for (const requirement of detachment.requirements) {
      switch (requirement.type) {
        case 'faction':
          if (requirement.value === 'any') {
            // For Allied detachments, any faction is acceptable
            continue;
          }
          if (requirement.value !== armyList.faction) {
            return false;
          }
          break;
        case 'points':
          if (armyList.pointsLimit < (requirement.value as number)) {
            return false;
          }
          break;
        case 'detachment':
          if (requirement.value === 'primary') {
            const hasPrimary = armyList.detachments.some(d => {
              const det = this.getDetachmentById(d.detachmentId);
              return det?.type === 'Primary';
            });
            if (!hasPrimary) {
              return false;
            }
          }
          break;
        case 'unit':
          // TODO: Implement unit requirement checking
          break;
      }
    }
    return true;
  }

  private static checkDetachmentRestrictions(
    detachment: Detachment,
    armyList: Army
  ): boolean {
    if (!detachment.restrictions) return true;

    for (const restriction of detachment.restrictions) {
      switch (restriction.type) {
        case 'faction-must-match':
          if (restriction.value === 'primary-faction') {
            const primaryDetachment = armyList.detachments.find(d => {
              const det = this.getDetachmentById(d.detachmentId);
              return det?.type === 'Primary';
            });
            if (primaryDetachment) {
              const primaryDet = this.getDetachmentById(
                primaryDetachment.detachmentId
              );
              if (primaryDet && primaryDet.faction !== detachment.faction) {
                return false;
              }
            }
          }
          break;
        case 'faction-must-differ':
          if (restriction.value === 'primary-faction') {
            // For Allied detachments with "universal" faction, they can always be added
            // The actual faction will be selected during the faction selection process
            if (detachment.faction === 'universal') {
              continue;
            }

            const primaryDetachment = armyList.detachments.find(d => {
              const det = this.getDetachmentById(d.detachmentId);
              return det?.type === 'Primary';
            });
            if (primaryDetachment) {
              const primaryDet = this.getDetachmentById(
                primaryDetachment.detachmentId
              );
              if (primaryDet && primaryDet.faction === detachment.faction) {
                return false;
              }
            }
          }
          break;
        case 'max-count': {
          const count = armyList.detachments.filter(d => {
            const det = this.getDetachmentById(d.detachmentId);
            return det?.type === detachment.type;
          }).length;
          if (count >= (restriction.value as number)) {
            return false;
          }
          break;
        }
      }
    }
    return true;
  }

  private static checkDetachmentTriggers(
    detachment: Detachment,
    armyList: Army
  ): boolean {
    if (!detachment.triggers) return true;

    for (const trigger of detachment.triggers) {
      switch (trigger.type) {
        case 'always-available':
          return true;
        case 'command-filled':
          return this.hasFilledSlot(armyList, 'command');
        case 'high-command-filled':
          return this.hasFilledSlot(armyList, 'high-command');
        case 'specific-unit':
          return this.hasSpecificUnitInSlot(
            armyList,
            trigger.requiredUnitId!,
            trigger.requiredSlotType!
          );
        default:
          return false;
      }
    }
    return false;
  }

  private static hasSpecificUnitInSlot(
    armyList: Army,
    requiredUnitId: string,
    requiredSlotType: 'Command' | 'High Command'
  ): boolean {
    const roleId = requiredSlotType === 'Command' ? 'command' : 'high-command';

    for (const armyDetachment of armyList.detachments) {
      for (const unit of armyDetachment.units) {
        const unitData = this.getUnitById(unit.unitId);
        if (!unitData) continue;

        const roleData = this.getBattlefieldRoleById(roleId);
        if (!roleData) continue;

        // Check if this unit is in the correct slot type and matches the required unit ID
        if (
          unitData.battlefieldRole === roleData.type &&
          unit.unitId === requiredUnitId
        ) {
          return true;
        }
      }
    }
    return false;
  }

  private static hasFilledSlot(armyList: Army, roleId: string): boolean {
    for (const armyDetachment of armyList.detachments) {
      const detachment = this.getDetachmentById(armyDetachment.detachmentId);
      if (!detachment) continue;

      for (const slot of detachment.slots) {
        if (slot.roleId === roleId) {
          // Check if any units are in this slot
          const slotUnits = armyDetachment.units.filter(unit => {
            const unitData = this.getUnitById(unit.unitId);
            return unitData?.battlefieldRole === slot.roleId;
          });
          if (slotUnits.length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Unit methods
  static getUnits(): Unit[] {
    return (unitsData as any).units as Unit[];
  }

  static getUnitById(id: string): Unit | undefined {
    return ((unitsData as any).units as Unit[]).find(unit => unit.id === id);
  }

  static getUnitsByFaction(factionId: string): Unit[] {
    return ((unitsData as any).units as Unit[]).filter(
      unit => unit.faction === factionId
    );
  }

  static getUnitsByAllegiance(allegiance: Allegiance): Unit[] {
    return ((unitsData as any).units as Unit[]).filter(
      unit => unit.allegiance === allegiance || unit.allegiance === 'Universal'
    );
  }

  static getUnitsByFactionAndAllegiance(
    factionId: string,
    allegiance: Allegiance
  ): Unit[] {
    return ((unitsData as any).units as Unit[]).filter(
      unit =>
        unit.faction === factionId &&
        (unit.allegiance === allegiance || unit.allegiance === 'Universal')
    );
  }

  static getUnitsByRole(roleId: string): Unit[] {
    return ((unitsData as any).units as Unit[]).filter(
      unit => unit.battlefieldRole === roleId
    );
  }

  static getUnitsByRoleAndAllegiance(
    roleId: string,
    allegiance: Allegiance
  ): Unit[] {
    return ((unitsData as any).units as Unit[]).filter(
      unit =>
        unit.battlefieldRole === roleId &&
        (unit.allegiance === allegiance || unit.allegiance === 'Universal')
    );
  }

  // Upgrade methods
  static getUpgrades(): UnitUpgrade[] {
    return (upgradesData as any).upgrades as UnitUpgrade[];
  }

  static getUpgradeById(id: string): UnitUpgrade | undefined {
    return ((upgradesData as any).upgrades as UnitUpgrade[]).find(
      upgrade => upgrade.id === id
    );
  }

  static getUpgradeOptionById(
    upgradeId: string,
    optionId: string
  ): UpgradeOption | undefined {
    const upgrade = this.getUpgradeById(upgradeId);
    if (!upgrade || !upgrade.options) return undefined;
    return upgrade.options.find(option => option.id === optionId);
  }

  // Upgrade group methods
  static getUpgradeGroupsForModel(modelId: string): UpgradeGroup[] {
    const model = this.getModelById(modelId);
    return model?.upgradeGroups || [];
  }

  static getUpgradeGroupById(groupId: string): UpgradeGroup | undefined {
    const allModels = this.getModels();
    for (const model of allModels) {
      const group = model.upgradeGroups?.find(g => g.id === groupId);
      if (group) return group;
    }
    return undefined;
  }

  static getUnitInstanceData(unitId: string, armyUnit: ArmyUnit): Unit {
    const baseUnit = this.getUnitById(unitId);
    if (!baseUnit) throw new Error(`Unit not found: ${unitId}`);

    // Create a deep copy of the base unit
    const instanceUnit: Unit = JSON.parse(JSON.stringify(baseUnit));

    // Apply weapon changes from the army unit instance (new structure uses modelInstanceWeaponChanges)
    if (armyUnit.modelInstanceWeaponChanges) {
      Object.entries(armyUnit.modelInstanceWeaponChanges).forEach(
        ([modelId, instanceChanges]) => {
          const model = this.getModelById(modelId);
          if (model) {
            // Create a copy of the model for this instance
            const instanceModel = JSON.parse(JSON.stringify(model));

            // Apply weapon changes from all instances
            Object.values(instanceChanges).forEach(changes => {
              changes.removed.forEach(weaponToRemove => {
                const weaponId =
                  typeof weaponToRemove === 'string'
                    ? weaponToRemove
                    : weaponToRemove.id;
                const weaponIndex = instanceModel.weapons.findIndex((w: any) =>
                  typeof w === 'string' ? w === weaponId : w.id === weaponId
                );
                if (weaponIndex !== -1) {
                  instanceModel.weapons.splice(weaponIndex, 1);
                  console.log(
                    `getUnitInstanceData: Removed weapon ${weaponId} from ${modelId}`
                  );
                }
              });

              changes.added.forEach(weaponToAdd => {
                const weaponId =
                  typeof weaponToAdd === 'string'
                    ? weaponToAdd
                    : weaponToAdd.id;
                instanceModel.weapons.push(weaponId);
                console.log(
                  `getUnitInstanceData: Added weapon ${weaponId} to ${modelId}`
                );
              });
            });

            // Update the model in the instance unit
            // Note: We need to update the model data that will be used by the UnitViewer
            // Since the UnitViewer gets models through getModelsForUnit, we need to ensure
            // the weapon changes are applied when that function is called
          }
        }
      );
    }

    return instanceUnit;
  }

  static getModelsForUnitInstance(
    unitId: string,
    armyUnit: ArmyUnit
  ): { model: Model; count: number }[] {
    const baseUnit = this.getUnitById(unitId);
    if (!baseUnit) return [];

    const models: { model: Model; count: number }[] = [];

    // Use armyUnit.models (new structure: { modelId: count })
    const modelComposition = Object.entries(armyUnit.models || {}).map(
      ([modelId, count]) => ({ modelId, count })
    );

    modelComposition.forEach(armyModel => {
      const baseModel = this.getModelById(armyModel.modelId);
      if (baseModel) {
        // Create a copy of the model for this instance
        const instanceModel = JSON.parse(JSON.stringify(baseModel));

        // Apply weapon changes for this model (new structure uses modelInstanceWeaponChanges)
        if (
          armyUnit.modelInstanceWeaponChanges &&
          armyUnit.modelInstanceWeaponChanges[armyModel.modelId]
        ) {
          // For now, we'll apply changes to all instances of this model
          // In a more sophisticated implementation, you might want to handle per-instance changes
          const instanceChanges =
            armyUnit.modelInstanceWeaponChanges[armyModel.modelId];
          Object.values(instanceChanges).forEach(changes => {
            // Apply weapon changes to the model
            changes.removed.forEach(weaponToRemove => {
              const weaponId =
                typeof weaponToRemove === 'string'
                  ? weaponToRemove
                  : weaponToRemove.id;
              const weaponIndex = instanceModel.weapons.findIndex((w: any) =>
                typeof w === 'string' ? w === weaponId : w.id === weaponId
              );
              if (weaponIndex !== -1) {
                instanceModel.weapons.splice(weaponIndex, 1);
              }
            });

            changes.added.forEach(weaponToAdd => {
              const weaponId =
                typeof weaponToAdd === 'string' ? weaponToAdd : weaponToAdd.id;
              instanceModel.weapons.push(weaponId);
            });
          });
        }

        models.push({ model: instanceModel, count: armyModel.count });
      }
    });

    return models;
  }

  // New function to calculate weapon counts considering model instance weapon changes
  static calculateWeaponCounts(
    unitId: string,
    armyUnit: ArmyUnit
  ): { [key: string]: { weaponId: string; count: number; mount?: string } } {
    const baseUnit = this.getUnitById(unitId);
    if (!baseUnit) return {};

    const weaponCounts: {
      [key: string]: { weaponId: string; count: number; mount?: string };
    } = {};

    // Get model composition (new structure: { modelId: count })
    const modelComposition = Object.entries(armyUnit.models || {}).map(
      ([modelId, count]) => ({ modelId, count })
    );

    console.log('=== calculateWeaponCounts START ===');
    console.log('Unit ID:', unitId);
    console.log('Model composition:', modelComposition);
    console.log(
      'Model instance weapon changes:',
      armyUnit.modelInstanceWeaponChanges
    );

    modelComposition.forEach(armyModel => {
      const baseModel = this.getModelById(armyModel.modelId);
      if (baseModel) {
        console.log(
          `\n--- Processing model ${armyModel.modelId} with count ${armyModel.count} ---`
        );
        console.log(`Base model weapons:`, baseModel.weapons);

        // Process each model instance separately to track weapon changes correctly
        for (
          let instanceIndex = 0;
          instanceIndex < armyModel.count;
          instanceIndex++
        ) {
          console.log(`\n  Processing instance ${instanceIndex}:`);

          // Start with base weapons for this instance
          let instanceWeapons: Array<{
            id: string;
            mount?: string;
            count?: number;
          }> = [];

          // Handle new weapon structure with mount locations
          if (
            Array.isArray(baseModel.weapons) &&
            baseModel.weapons.length > 0 &&
            typeof baseModel.weapons[0] === 'object' &&
            'id' in baseModel.weapons[0]
          ) {
            // New structure: Array of { id: string, mount?: string, count?: number }
            instanceWeapons = [
              ...(baseModel.weapons as Array<{
                id: string;
                mount?: string;
                count?: number;
              }>),
            ];
          } else {
            // Old structure: Array of strings
            instanceWeapons = (baseModel.weapons as unknown as string[]).map(
              id => ({ id })
            );
          }

          console.log(
            `  Initial weapons for instance ${instanceIndex}:`,
            instanceWeapons
          );

          // Apply weapon changes for this specific instance
          if (
            armyUnit.modelInstanceWeaponChanges &&
            armyUnit.modelInstanceWeaponChanges[armyModel.modelId] &&
            armyUnit.modelInstanceWeaponChanges[armyModel.modelId][
              instanceIndex
            ]
          ) {
            const changes =
              armyUnit.modelInstanceWeaponChanges[armyModel.modelId][
                instanceIndex
              ];
            console.log(
              `  Weapon changes for instance ${instanceIndex}:`,
              changes
            );

            // Process weapon changes in pairs: remove then add for each replacement
            const removedWeapons = changes.removed;
            const addedWeapons = changes.added;

            // Process each removal and addition as a pair
            for (
              let i = 0;
              i < Math.max(removedWeapons.length, addedWeapons.length);
              i++
            ) {
              if (i < removedWeapons.length) {
                const weaponToRemove = removedWeapons[i];
                const weaponIdToRemove =
                  typeof weaponToRemove === 'string'
                    ? weaponToRemove
                    : weaponToRemove.id;
                const weaponMountToRemove =
                  typeof weaponToRemove === 'string'
                    ? undefined
                    : weaponToRemove.mount;

                // Remove weapons that match both ID and mount (if mount is specified)
                if (weaponMountToRemove) {
                  // Remove only weapons with matching ID and mount
                  instanceWeapons = instanceWeapons.filter(
                    weapon =>
                      !(
                        weapon.id === weaponIdToRemove &&
                        weapon.mount === weaponMountToRemove
                      )
                  );
                  console.log(
                    `    Removing ${weaponIdToRemove} with mount ${weaponMountToRemove}`
                  );
                } else {
                  // Remove all instances of this weapon (fallback for old system)
                  instanceWeapons = instanceWeapons.filter(
                    weapon => weapon.id !== weaponIdToRemove
                  );
                  console.log(`    Removing all ${weaponIdToRemove}`);
                }
              }

              if (i < addedWeapons.length) {
                const weaponToAdd = addedWeapons[i];
                if (typeof weaponToAdd === 'string') {
                  instanceWeapons.push({ id: weaponToAdd });
                } else {
                  instanceWeapons.push(weaponToAdd);
                }
                console.log(
                  `    Adding ${typeof weaponToAdd === 'string' ? weaponToAdd : weaponToAdd.id}`
                );
              }
            }
          } else {
            console.log(`  No weapon changes for instance ${instanceIndex}`);
          }

          // Count weapons from this instance
          instanceWeapons.forEach(weapon => {
            const weaponId = weapon.id;
            const count = weapon.count || 1;
            const mount = weapon.mount;

            // Create a unique key that includes both weapon ID and mount
            // For non-vehicle units (no mount), just use the weapon ID
            // For vehicle units, include the mount to separate different mount locations
            const key = mount ? `${weaponId}-${mount}` : weaponId;

            if (!weaponCounts[key]) {
              weaponCounts[key] = { weaponId, count: 0, mount };
            }
            weaponCounts[key].count += count;
          });

          console.log(
            `  Final weapons for instance ${instanceIndex}:`,
            instanceWeapons
          );
        }
      }
    });

    console.log('\n=== Final weapon counts ===');
    console.log(weaponCounts);
    console.log('=== calculateWeaponCounts END ===\n');
    return weaponCounts;
  }

  // Prime Advantage methods
  static getPrimeAdvantages(): PrimeAdvantageDefinition[] {
    return (primeAdvantagesData as any)
      .primeAdvantages as PrimeAdvantageDefinition[];
  }

  static getPrimeAdvantageById(
    id: string
  ): PrimeAdvantageDefinition | undefined {
    return (
      (primeAdvantagesData as any).primeAdvantages as PrimeAdvantageDefinition[]
    ).find(advantage => advantage.id === id);
  }

  // Utility methods
  static calculateUnitPoints(
    unit: Unit,
    size: number,
    upgrades: any[] = []
  ): number {
    let totalPoints = unit.points * size;

    for (const upgrade of upgrades) {
      totalPoints += upgrade.points * (upgrade.count || 1);
    }

    return totalPoints;
  }

  static getPrimeSlotsForDetachment(detachmentId: string): string[] {
    const detachment = this.getDetachmentById(detachmentId);
    if (!detachment) return [];

    return detachment.slots
      .filter(slot => slot.isPrime)
      .map(slot => slot.roleId);
  }

  static getTotalSlotsForRole(detachmentId: string, roleId: string): number {
    const detachment = this.getDetachmentById(detachmentId);
    if (!detachment) return 0;

    return detachment.slots
      .filter(slot => slot.roleId === roleId)
      .reduce((total, slot) => total + slot.count, 0);
  }
}
