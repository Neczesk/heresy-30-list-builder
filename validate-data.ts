import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'fast-csv';

// Import the interfaces from army.ts
import type {
  Faction,
  Unit,
  Model,
  Weapon,
  SpecialRule,
  Detachment,
  BattlefieldRole,
  RiteOfWar,
  UnitUpgrade,
  PrimeAdvantageDefinition
} from './src/types/army';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const DATA_DIR = path.join(__dirname, 'src', 'data');

// Type checking function using runtime validation
function validateType<T>(data: any, typeName: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push(`${typeName}: Data is not an object`);
    return { isValid: false, errors };
  }

  // Basic type validation based on expected structure
  if (typeName === 'Faction') {
    const faction = data as Faction;
    if (!faction.id || typeof faction.id !== 'string') errors.push(`${typeName}: Missing or invalid id`);
    if (!faction.name || typeof faction.name !== 'string') errors.push(`${typeName}: Missing or invalid name`);
    if (!faction.type || typeof faction.type !== 'string') {
      errors.push(`${typeName}: Missing or invalid type`);
    }
    if (typeof faction.isMainFaction !== 'boolean') errors.push(`${typeName}: Missing or invalid isMainFaction`);
    if (!Array.isArray(faction.specialRules)) errors.push(`${typeName}: specialRules must be an array`);
  }

  else if (typeName === 'Unit') {
    const unit = data as Unit;
    if (!unit.id || typeof unit.id !== 'string') errors.push(`${typeName}: Missing or invalid id`);
    if (!unit.name || typeof unit.name !== 'string') errors.push(`${typeName}: Missing or invalid name`);
    if (!unit.faction || typeof unit.faction !== 'string') errors.push(`${typeName}: Missing or invalid faction`);
    if (typeof unit.points !== 'number') errors.push(`${typeName}: points must be a number`);
    if (typeof unit.minSize !== 'number') errors.push(`${typeName}: minSize must be a number`);
    if (typeof unit.maxSize !== 'number') errors.push(`${typeName}: maxSize must be a number`);
    if (typeof unit.baseSize !== 'number') errors.push(`${typeName}: baseSize must be a number`);
    if (!unit.models || typeof unit.models !== 'object' || Array.isArray(unit.models)) errors.push(`${typeName}: models must be an object mapping model IDs to counts`);
    if (!Array.isArray(unit.specialRules)) errors.push(`${typeName}: specialRules must be an array`);
    if (!Array.isArray(unit.traits)) errors.push(`${typeName}: traits must be an array`);
    if (!Array.isArray(unit.upgrades)) errors.push(`${typeName}: upgrades must be an array`);
  }

  else if (typeName === 'Model') {
    const model = data as Model;
    if (!model.id || typeof model.id !== 'string') errors.push(`${typeName}: Missing or invalid id`);
    if (!model.name || typeof model.name !== 'string') errors.push(`${typeName}: Missing or invalid name`);
    if (!model.type || !['Infantry', 'Cavalry', 'Walker', 'Automata', 'Paragon', 'Vehicle'].includes(model.type)) {
      errors.push(`${typeName}: Missing or invalid type`);
    }
    if (!Array.isArray(model.subType)) {
      errors.push(`${typeName}: subType must be an array`);
    } else {
      const validSubTypes = ['Unique', 'Command', 'Champion', 'Specialist', 'Heavy', 'Sergeant', 'Light', 'Skirmish', 'Transport', 'Anti-grav', 'Stable', 'Flyer', 'Super-Heavy'];
      for (const subType of model.subType) {
        if (!validSubTypes.includes(subType)) {
          errors.push(`${typeName}: Invalid subType "${subType}"`);
        }
      }
    }
    if (!model.characteristics || typeof model.characteristics !== 'object') {
      errors.push(`${typeName}: Missing or invalid characteristics`);
    }
    if (!Array.isArray(model.specialRules)) errors.push(`${typeName}: specialRules must be an array`);
    if (!Array.isArray(model.wargear)) errors.push(`${typeName}: wargear must be an array`);
    if (!Array.isArray(model.weapons)) errors.push(`${typeName}: weapons must be an array`);
  }

  else if (typeName === 'Weapon') {
    const weapon = data as Weapon;
    if (!weapon.id || typeof weapon.id !== 'string') errors.push(`${typeName}: Missing or invalid id`);
    if (!weapon.name || typeof weapon.name !== 'string') errors.push(`${typeName}: Missing or invalid name`);
    if (!weapon.type || !['melee', 'ranged', 'melee-profile', 'ranged-profile'].includes(weapon.type)) {
      errors.push(`${typeName}: Missing or invalid type`);
    }
    if (!Array.isArray(weapon.specialRules)) errors.push(`${typeName}: specialRules must be an array`);
    if (!Array.isArray(weapon.traits)) errors.push(`${typeName}: traits must be an array`);

    if (weapon.type === 'melee' || weapon.type === 'melee-profile') {
      const meleeWeapon = weapon as any;
      if (typeof meleeWeapon.damage !== 'number') errors.push(`${typeName}: melee weapon damage must be a number`);
      if (typeof meleeWeapon.ap !== 'number' && meleeWeapon.ap !== null) errors.push(`${typeName}: melee weapon ap must be a number or null`);
    } else if (weapon.type === 'ranged' || weapon.type === 'ranged-profile') {
      const rangedWeapon = weapon as any;
      // For ranged weapons with profiles, individual stats can be null
      if (rangedWeapon.profiles && Array.isArray(rangedWeapon.profiles) && rangedWeapon.profiles.length > 0) {
        // Weapon has profiles, so individual stats can be null
        if (rangedWeapon.range !== null && typeof rangedWeapon.range !== 'number' && typeof rangedWeapon.range !== 'string') {
          errors.push(`${typeName}: ranged weapon range must be a number, string, or null when profiles exist`);
        }
        if (rangedWeapon.firepower !== null && typeof rangedWeapon.firepower !== 'number') {
          errors.push(`${typeName}: ranged weapon firepower must be a number or null when profiles exist`);
        }
        if (rangedWeapon.rangedStrength !== null && typeof rangedWeapon.rangedStrength !== 'number') {
          errors.push(`${typeName}: ranged weapon rangedStrength must be a number or null when profiles exist`);
        }
        if (rangedWeapon.ap !== null && typeof rangedWeapon.ap !== 'number') {
          errors.push(`${typeName}: ranged weapon ap must be a number or null when profiles exist`);
        }
        if (rangedWeapon.damage !== null && typeof rangedWeapon.damage !== 'number') {
          errors.push(`${typeName}: ranged weapon damage must be a number or null when profiles exist`);
        }
      } else {
        // Weapon has no profiles, so individual stats are required
        if (typeof rangedWeapon.range !== 'number' && typeof rangedWeapon.range !== 'string') {
          errors.push(`${typeName}: ranged weapon range must be a number or string`);
        }
        if (typeof rangedWeapon.firepower !== 'number') errors.push(`${typeName}: ranged weapon firepower must be a number`);
        if (typeof rangedWeapon.rangedStrength !== 'number') errors.push(`${typeName}: ranged weapon rangedStrength must be a number`);
        if (typeof rangedWeapon.ap !== 'number' && rangedWeapon.ap !== null) errors.push(`${typeName}: ranged weapon ap must be a number or null`);
        if (typeof rangedWeapon.damage !== 'number') errors.push(`${typeName}: ranged weapon damage must be a number`);
      }
    }
  }

  else if (typeName === 'SpecialRule') {
    const rule = data as SpecialRule;
    if (!rule.id || typeof rule.id !== 'string') errors.push(`${typeName}: Missing or invalid id`);
    if (!rule.name || typeof rule.name !== 'string') errors.push(`${typeName}: Missing or invalid name`);
    if (!rule.description || typeof rule.description !== 'string') errors.push(`${typeName}: Missing or invalid description`);
    if (!rule.shortText || typeof rule.shortText !== 'string') errors.push(`${typeName}: Missing or invalid shortText`);
    if (!rule.longText || typeof rule.longText !== 'string') errors.push(`${typeName}: Missing or invalid longText`);
    if (typeof rule.hasValue !== 'boolean') errors.push(`${typeName}: hasValue must be a boolean`);
    if (!rule.type || !['special-rule', 'wargear'].includes(rule.type)) {
      errors.push(`${typeName}: Missing or invalid type`);
    }
  }

  else if (typeName === 'Detachment') {
    const detachment = data as Detachment;
    if (!detachment.id || typeof detachment.id !== 'string') errors.push(`${typeName}: Missing or invalid id`);
    if (!detachment.name || typeof detachment.name !== 'string') errors.push(`${typeName}: Missing or invalid name`);
    if (!detachment.type || !['Primary', 'Auxiliary', 'Apex', 'Warlord', 'Allied', 'Universal'].includes(detachment.type)) {
      errors.push(`${typeName}: Missing or invalid type`);
    }
    if (!detachment.faction || typeof detachment.faction !== 'string') errors.push(`${typeName}: Missing or invalid faction`);
    if (!detachment.description || typeof detachment.description !== 'string') errors.push(`${typeName}: Missing or invalid description`);
    if (!Array.isArray(detachment.requirements)) errors.push(`${typeName}: requirements must be an array`);
    if (!Array.isArray(detachment.slots)) errors.push(`${typeName}: slots must be an array`);
  }

  else if (typeName === 'BattlefieldRole') {
    const role = data as BattlefieldRole;
    if (!role.id || typeof role.id !== 'string') errors.push(`${typeName}: Missing or invalid id`);
    if (!role.name || typeof role.name !== 'string') errors.push(`${typeName}: Missing or invalid name`);
    if (!role.type || !['High Command', 'Command', 'Troops', 'Transport', 'Heavy Transport', 'Support', 'Armour', 'War Engine', 'Reconnaissance', 'Heavy Assault', 'Fast Attack', 'Retinue', 'Warlord', 'Elite', 'Lord of War'].includes(role.type)) {
      errors.push(`${typeName}: Missing or invalid type`);
    }
    if (!role.description || typeof role.description !== 'string') errors.push(`${typeName}: Missing or invalid description`);
  }

  else if (typeName === 'RiteOfWar') {
    const rite = data as RiteOfWar;
    if (!rite.id || typeof rite.id !== 'string') errors.push(`${typeName}: Missing or invalid id`);
    if (!rite.name || typeof rite.name !== 'string') errors.push(`${typeName}: Missing or invalid name`);
    if (!rite.faction || typeof rite.faction !== 'string') errors.push(`${typeName}: Missing or invalid faction`);
    if (!rite.description || typeof rite.description !== 'string') errors.push(`${typeName}: Missing or invalid description`);
    if (!Array.isArray(rite.restrictions)) errors.push(`${typeName}: restrictions must be an array`);
    if (!Array.isArray(rite.benefits)) errors.push(`${typeName}: benefits must be an array`);
  }

  else if (typeName === 'UnitUpgrade') {
    const upgrade = data as UnitUpgrade;
    if (!upgrade.id || typeof upgrade.id !== 'string') errors.push(`${typeName}: Missing or invalid id`);
    if (!upgrade.name || typeof upgrade.name !== 'string') errors.push(`${typeName}: Missing or invalid name`);
    if (!upgrade.description || typeof upgrade.description !== 'string') errors.push(`${typeName}: Missing or invalid description`);
    if (!upgrade.type || !['model', 'squad', 'weapon', 'wargear', 'model-count', 'model-group-count'].includes(upgrade.type)) {
      errors.push(`${typeName}: Missing or invalid type`);
    }
    if (upgrade.maxCount !== undefined && typeof upgrade.maxCount !== 'number' && upgrade.maxCount !== 'dependent') {
      errors.push(`${typeName}: maxCount must be a number or "dependent"`);
    }
    if (upgrade.options && !Array.isArray(upgrade.options)) errors.push(`${typeName}: options must be an array`);
  }

  else if (typeName === 'PrimeAdvantageDefinition') {
    const advantage = data as PrimeAdvantageDefinition;
    if (!advantage.id || typeof advantage.id !== 'string') errors.push(`${typeName}: Missing or invalid id`);
    if (!advantage.name || typeof advantage.name !== 'string') errors.push(`${typeName}: Missing or invalid name`);
    if (!advantage.description || typeof advantage.description !== 'string') errors.push(`${typeName}: Missing or invalid description`);
    if (!advantage.effect || typeof advantage.effect !== 'string') errors.push(`${typeName}: Missing or invalid effect`);
    if (advantage.restrictions && !Array.isArray(advantage.restrictions)) errors.push(`${typeName}: restrictions must be an array`);
  }

  return { isValid: errors.length === 0, errors };
}

// Referential integrity checking
async function checkReferentialIntegrity(): Promise<{ errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Load all data
  const dataFiles = ['factions', 'units', 'models', 'weapons', 'specialRules', 'detachments', 'battlefieldRoles', 'ritesOfWar', 'upgrades', 'primeAdvantages'];
  const data: { [key: string]: any[] } = {};

  for (const file of dataFiles) {
    try {
      const filePath = path.join(DATA_DIR, `${file}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      data[file] = parsed[file] || [];
    } catch (error) {
      errors.push(`Failed to load ${file}.json: ${error}`);
    }
  }

  // Create lookup maps
  const factionIds = new Set(data.factions?.map(f => f.id) || []);
  const unitIds = new Set(data.units?.map(u => u.id) || []);
  const modelIds = new Set(data.models?.map(m => m.id) || []);
  const weaponIds = new Set(data.weapons?.map(w => w.id) || []);
  const specialRuleIds = new Set(data.specialRules?.map(r => r.id) || []);
  const detachmentIds = new Set(data.detachments?.map(d => d.id) || []);
  const battlefieldRoleIds = new Set(data.battlefieldRoles?.map(r => r.id) || []);
  const riteOfWarIds = new Set(data.ritesOfWar?.map(r => r.id) || []);
  const upgradeIds = new Set(data.upgrades?.map(u => u.id) || []);
  const primeAdvantageIds = new Set(data.primeAdvantages?.map(p => p.id) || []);

  // Check faction references
  if (data.units) {
    for (const unit of data.units) {
      if (unit.faction !== 'universal' && !factionIds.has(unit.faction)) {
        errors.push(`Unit "${unit.name}" (${unit.id}) references non-existent faction "${unit.faction}"`);
      }
      if (unit.legionSpecific) {
        for (const legionId of unit.legionSpecific) {
          if (!factionIds.has(legionId)) {
            errors.push(`Unit "${unit.name}" (${unit.id}) references non-existent legion "${legionId}"`);
          }
        }
      }
    }
  }

  if (data.detachments) {
    for (const detachment of data.detachments) {
      if (detachment.faction !== 'universal' && !factionIds.has(detachment.faction)) {
        errors.push(`Detachment "${detachment.name}" (${detachment.id}) references non-existent faction "${detachment.faction}"`);
      }
      if (detachment.slots) {
        for (const slot of detachment.slots) {
          if (!battlefieldRoleIds.has(slot.roleId)) {
            errors.push(`Detachment "${detachment.name}" (${detachment.id}) slot references non-existent battlefield role "${slot.roleId}"`);
          }
        }
      }
    }
  }

  if (data.ritesOfWar) {
    for (const rite of data.ritesOfWar) {
      if (rite.faction !== 'universal' && !factionIds.has(rite.faction)) {
        errors.push(`Rite of War "${rite.name}" (${rite.id}) references non-existent faction "${rite.faction}"`);
      }
    }
  }

  if (data.factions) {
    for (const faction of data.factions) {
      if (faction.parentFaction && !factionIds.has(faction.parentFaction)) {
        errors.push(`Faction "${faction.name}" (${faction.id}) references non-existent parent faction "${faction.parentFaction}"`);
      }
      if (faction.specialRules) {
        for (const ruleId of faction.specialRules) {
          if (!specialRuleIds.has(ruleId)) {
            errors.push(`Faction "${faction.name}" (${faction.id}) references non-existent special rule "${ruleId}"`);
          }
        }
      }
      if (faction.ritesOfWar) {
        for (const riteId of faction.ritesOfWar) {
          if (!riteOfWarIds.has(riteId)) {
            errors.push(`Faction "${faction.name}" (${faction.id}) references non-existent rite of war "${riteId}"`);
          }
        }
      }
    }
  }

  if (data.units) {
    for (const unit of data.units) {
      if (unit.models) {
        for (const modelId of Object.keys(unit.models)) {
          if (!modelIds.has(modelId)) {
            errors.push(`Unit "${unit.name}" (${unit.id}) references non-existent model "${modelId}"`);
          }
        }
      }
      if (unit.specialRules) {
        for (const ruleId of unit.specialRules) {
          if (!specialRuleIds.has(ruleId)) {
            errors.push(`Unit "${unit.name}" (${unit.id}) references non-existent special rule "${ruleId}"`);
          }
        }
      }
      if (unit.upgrades) {
        for (const upgradeId of unit.upgrades) {
          if (!upgradeIds.has(upgradeId)) {
            errors.push(`Unit "${unit.name}" (${unit.id}) references non-existent upgrade "${upgradeId}"`);
          }
        }
      }
    }
  }

  if (data.models) {
    for (const model of data.models) {
      if (model.specialRules) {
        for (const ruleId of model.specialRules) {
          if (!specialRuleIds.has(ruleId)) {
            errors.push(`Model "${model.name}" (${model.id}) references non-existent special rule "${ruleId}"`);
          }
        }
      }
      if (model.weapons) {
        for (const weapon of model.weapons) {
          // Handle both string weapon IDs and weapon objects
          const weaponId = typeof weapon === 'string' ? weapon : weapon.id;
          if (!weaponIds.has(weaponId)) {
            errors.push(`Model "${model.name}" (${model.id}) references non-existent weapon "${weaponId}"`);
          }
        }
      }
    }
  }

  if (data.weapons) {
    for (const weapon of data.weapons) {
      if (weapon.specialRules) {
        for (const ruleId of weapon.specialRules) {
          if (!specialRuleIds.has(ruleId)) {
            errors.push(`Weapon "${weapon.name}" (${weapon.id}) references non-existent special rule "${ruleId}"`);
          }
        }
      }
    }
  }

  if (data.upgrades) {
    for (const upgrade of data.upgrades) {
      if (upgrade.requiresUpgrade && !upgradeIds.has(upgrade.requiresUpgrade)) {
        errors.push(`Upgrade "${upgrade.name}" (${upgrade.id}) references non-existent required upgrade "${upgrade.requiresUpgrade}"`);
      }
      if (upgrade.targetModel && !modelIds.has(upgrade.targetModel)) {
        errors.push(`Upgrade "${upgrade.name}" (${upgrade.id}) references non-existent target model "${upgrade.targetModel}"`);
      }
      if (upgrade.targetModelType && !modelIds.has(upgrade.targetModelType)) {
        errors.push(`Upgrade "${upgrade.name}" (${upgrade.id}) references non-existent target model type "${upgrade.targetModelType}"`);
      }
      if (upgrade.options) {
        for (const option of upgrade.options) {
          if (option.requiresUpgrade && !upgradeIds.has(option.requiresUpgrade)) {
            errors.push(`Upgrade option "${option.name}" (${upgrade.id}) references non-existent required upgrade "${option.requiresUpgrade}"`);
          }
          if (option.replaceWeapon && !weaponIds.has(option.replaceWeapon)) {
            errors.push(`Upgrade option "${option.name}" (${upgrade.id}) references non-existent weapon to replace "${option.replaceWeapon}"`);
          }
          if (option.addWeapon) {
            const weaponId = typeof option.addWeapon === 'string' ? option.addWeapon : option.addWeapon.id;
            if (!weaponIds.has(weaponId)) {
              errors.push(`Upgrade option "${option.name}" (${upgrade.id}) references non-existent weapon to add "${weaponId}"`);
            }
          }
          if (option.weaponReplacements) {
            for (const replacement of option.weaponReplacements) {
              if (!weaponIds.has(replacement.replaceWeapon)) {
                errors.push(`Upgrade option "${option.name}" (${upgrade.id}) weapon replacement references non-existent weapon "${replacement.replaceWeapon}"`);
              }
              if (replacement.addWeapon) {
                const weaponId = typeof replacement.addWeapon === 'string' ? replacement.addWeapon : replacement.addWeapon.id;
                if (!weaponIds.has(weaponId)) {
                  errors.push(`Upgrade option "${option.name}" (${upgrade.id}) weapon replacement references non-existent weapon "${weaponId}"`);
                }
              }
            }
          }
        }
      }
    }
  }

  return { errors, warnings };
}

// Main validation function
async function validateData(): Promise<void> {
  console.log('🔍 Starting data validation...\n');

  const typeErrors: string[] = [];
  const referentialErrors: string[] = [];
  const referentialWarnings: string[] = [];

  // Type validation
  console.log('📋 Validating data types...');
  const dataTypes = [
    { file: 'factions', type: 'Faction' },
    { file: 'units', type: 'Unit' },
    { file: 'models', type: 'Model' },
    { file: 'weapons', type: 'Weapon' },
    { file: 'specialRules', type: 'SpecialRule' },
    { file: 'detachments', type: 'Detachment' },
    { file: 'battlefieldRoles', type: 'BattlefieldRole' },
    { file: 'ritesOfWar', type: 'RiteOfWar' },
    { file: 'upgrades', type: 'UnitUpgrade' },
    { file: 'primeAdvantages', type: 'PrimeAdvantageDefinition' }
  ];

  for (const { file, type } of dataTypes) {
    try {
      const filePath = path.join(DATA_DIR, `${file}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      const data = parsed[file] || [];

      console.log(`  Checking ${file} (${data.length} records)...`);

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const { isValid, errors } = validateType(item, type);
        if (!isValid) {
          for (const error of errors) {
            typeErrors.push(`${file}[${i}] (${item.id || 'unknown'}): ${error}`);
          }
        }
      }
    } catch (error) {
      typeErrors.push(`Failed to validate ${file}: ${error}`);
    }
  }

  // Referential integrity validation
  console.log('\n🔗 Checking referential integrity...');
  const { errors: refErrors, warnings: refWarnings } = await checkReferentialIntegrity();
  referentialErrors.push(...refErrors);
  referentialWarnings.push(...refWarnings);

  // Report results
  console.log('\n📊 Validation Results:');
  console.log('=====================');

  if (typeErrors.length === 0) {
    console.log('✅ Type validation: PASSED');
  } else {
    console.log(`❌ Type validation: FAILED (${typeErrors.length} errors)`);
    console.log('\nType validation errors:');
    typeErrors.forEach(error => console.log(`  - ${error}`));
  }

  if (referentialErrors.length === 0) {
    console.log('✅ Referential integrity: PASSED');
  } else {
    console.log(`❌ Referential integrity: FAILED (${referentialErrors.length} errors)`);
    console.log('\nReferential integrity errors:');
    referentialErrors.forEach(error => console.log(`  - ${error}`));
  }

  if (referentialWarnings.length > 0) {
    console.log(`⚠️  Referential integrity warnings (${referentialWarnings.length}):`);
    referentialWarnings.forEach(warning => console.log(`  - ${warning}`));
  }

  const totalErrors = typeErrors.length + referentialErrors.length;
  if (totalErrors === 0) {
    console.log('\n🎉 All validations passed!');
  } else {
    console.log(`\n💥 Total errors: ${totalErrors}`);
    process.exit(1);
  }
}

// Run validation
validateData().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
