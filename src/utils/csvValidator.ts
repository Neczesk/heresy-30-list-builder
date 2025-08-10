// Field definitions for different data types
export const FIELD_DEFINITIONS: {
  [key: string]: {
    [field: string]: {
      type:
        | 'string'
        | 'number'
        | 'boolean'
        | 'array'
        | 'object'
        | 'string|number';
      required: boolean;
      description: string;
    };
  };
} = {
  factions: {
    id: {
      type: 'string',
      required: true,
      description: 'Unique identifier for the faction',
    },
    name: {
      type: 'string',
      required: true,
      description: 'Display name of the faction',
    },
    type: {
      type: 'string',
      required: true,
      description: 'Faction type (Legion, Auxilia, Mechanicum, Knight, Titan)',
    },
    description: {
      type: 'string',
      required: true,
      description: 'Description of the faction',
    },
    allegiance: {
      type: 'string',
      required: false,
      description: 'Allegiance of the faction',
    },
    specialRules: {
      type: 'array',
      required: false,
      description: 'Array of special rule IDs',
    },
    ritesOfWar: {
      type: 'array',
      required: false,
      description: 'Array of rite of war IDs',
    },
    isMainFaction: {
      type: 'boolean',
      required: false,
      description: 'Whether this is a main faction',
    },
    parentFaction: {
      type: 'string',
      required: false,
      description: 'Parent faction ID if this is a subfaction',
    },
  },
  weapons: {
    id: {
      type: 'string',
      required: true,
      description: 'Unique identifier for the weapon',
    },
    name: {
      type: 'string',
      required: true,
      description: 'Display name of the weapon',
    },
    type: {
      type: 'string',
      required: true,
      description: 'Weapon type (melee, ranged, melee-profile, ranged-profile)',
    },
    description: {
      type: 'string',
      required: true,
      description: 'Description of the weapon',
    },
    range: {
      type: 'string|number',
      required: false,
      description: 'Range of the weapon (number or "Template")',
    },
    firepower: {
      type: 'number',
      required: false,
      description: 'Firepower value',
    },
    rangedStrength: {
      type: 'number',
      required: false,
      description: 'Ranged strength value',
    },
    ap: {
      type: 'number',
      required: false,
      description: 'Armor penetration value',
    },
    damage: { type: 'number', required: false, description: 'Damage value' },
    attackModifier: {
      type: 'string',
      required: false,
      description: 'Attack modifier (A, +1, etc.)',
    },
    strengthModifier: {
      type: 'string',
      required: false,
      description: 'Strength modifier (S, +2, etc.)',
    },
    initiativeModifier: {
      type: 'string',
      required: false,
      description: 'Initiative modifier (I, -1, etc.)',
    },
    specialRules: {
      type: 'array',
      required: false,
      description: 'Array of special rule IDs',
    },
    specialRuleValues: {
      type: 'object',
      required: false,
      description: 'Object mapping special rule IDs to values',
    },
    traits: {
      type: 'array',
      required: false,
      description: 'Array of weapon traits',
    },
    profiles: {
      type: 'array',
      required: false,
      description: 'Array of profile weapon IDs',
    },
  },
  units: {
    id: {
      type: 'string',
      required: true,
      description: 'Unique identifier for the unit',
    },
    name: {
      type: 'string',
      required: true,
      description: 'Display name of the unit',
    },
    description: {
      type: 'string',
      required: true,
      description: 'Description of the unit',
    },
    faction: {
      type: 'string',
      required: true,
      description: 'Faction ID the unit belongs to',
    },
    allegiance: {
      type: 'string',
      required: false,
      description: 'Allegiance of the unit',
    },
    battlefieldRole: {
      type: 'string',
      required: true,
      description: 'Battlefield role of the unit',
    },
    baseSize: {
      type: 'number',
      required: true,
      description: 'Base size of the unit',
    },
    points: { type: 'number', required: true, description: 'Base points cost' },
    models: {
      type: 'object',
      required: true,
      description: 'Object mapping model IDs to counts',
    },
    wargear: {
      type: 'array',
      required: false,
      description: 'Array of wargear IDs',
    },
    specialRules: {
      type: 'array',
      required: false,
      description: 'Array of special rule IDs',
    },
    specialRuleValues: {
      type: 'object',
      required: false,
      description: 'Object mapping special rule IDs to values',
    },
    traits: {
      type: 'array',
      required: false,
      description: 'Array of unit traits',
    },
    upgrades: {
      type: 'array',
      required: false,
      description: 'Array of upgrade IDs',
    },
    modelUpgrades: {
      type: 'object',
      required: false,
      description: 'Object mapping model IDs to upgrade group IDs',
    },
  },
  models: {
    id: {
      type: 'string',
      required: true,
      description: 'Unique identifier for the model',
    },
    name: {
      type: 'string',
      required: true,
      description: 'Display name of the model',
    },
    type: {
      type: 'string',
      required: true,
      description: 'Model type (Infantry, Cavalry, Walker, etc.)',
    },
    subType: {
      type: 'array',
      required: true,
      description: 'Array of model subtypes',
    },
    characteristics: {
      type: 'object',
      required: true,
      description: 'Model characteristics object',
    },
    specialRules: {
      type: 'array',
      required: false,
      description: 'Array of special rule IDs',
    },
    specialRuleValues: {
      type: 'object',
      required: false,
      description: 'Object mapping special rule IDs to values',
    },
    wargear: {
      type: 'array',
      required: false,
      description: 'Array of wargear IDs',
    },
    weapons: {
      type: 'array',
      required: false,
      description: 'Array of weapon IDs or weapon objects',
    },
    upgradeGroups: {
      type: 'array',
      required: false,
      description: 'Array of upgrade group objects',
    },
    description: {
      type: 'string',
      required: false,
      description: 'Description of the model',
    },
  },
  specialRules: {
    id: {
      type: 'string',
      required: true,
      description: 'Unique identifier for the special rule',
    },
    name: {
      type: 'string',
      required: true,
      description: 'Display name of the special rule',
    },
    description: {
      type: 'string',
      required: true,
      description: 'Description of the special rule',
    },
    shortText: {
      type: 'string',
      required: true,
      description: 'Short text description',
    },
    longText: {
      type: 'string',
      required: true,
      description: 'Long text description',
    },
    hasValue: {
      type: 'boolean',
      required: true,
      description: 'Whether the rule can have a value',
    },
    type: {
      type: 'string',
      required: true,
      description: 'Type of rule (special-rule, wargear)',
    },
  },
  detachments: {
    id: {
      type: 'string',
      required: true,
      description: 'Unique identifier for the detachment',
    },
    name: {
      type: 'string',
      required: true,
      description: 'Display name of the detachment',
    },
    type: {
      type: 'string',
      required: true,
      description: 'Detachment type (Primary, Auxiliary, etc.)',
    },
    faction: {
      type: 'string',
      required: true,
      description: 'Faction ID the detachment belongs to',
    },
    description: {
      type: 'string',
      required: true,
      description: 'Description of the detachment',
    },
    requirements: {
      type: 'array',
      required: false,
      description: 'Array of requirement strings',
    },
    slots: {
      type: 'array',
      required: true,
      description: 'Array of slot objects',
    },
  },
  battlefieldRoles: {
    id: {
      type: 'string',
      required: true,
      description: 'Unique identifier for the battlefield role',
    },
    name: {
      type: 'string',
      required: true,
      description: 'Display name of the battlefield role',
    },
    type: {
      type: 'string',
      required: true,
      description: 'Role type (High Command, Command, Troops, etc.)',
    },
    description: {
      type: 'string',
      required: true,
      description: 'Description of the battlefield role',
    },
  },
  upgrades: {
    id: {
      type: 'string',
      required: true,
      description: 'Unique identifier for the upgrade',
    },
    name: {
      type: 'string',
      required: true,
      description: 'Display name of the upgrade',
    },
    description: {
      type: 'string',
      required: true,
      description: 'Description of the upgrade',
    },
    type: {
      type: 'string',
      required: true,
      description: 'Upgrade type (model, squad, weapon, etc.)',
    },
    maxCount: {
      type: 'string',
      required: false,
      description: 'Maximum count or "dependent"',
    },
    targetModelType: {
      type: 'string',
      required: false,
      description: 'Target model type ID',
    },
    options: {
      type: 'array',
      required: false,
      description: 'Array of upgrade option objects',
    },
  },
  ritesOfWar: {
    id: {
      type: 'string',
      required: true,
      description: 'Unique identifier for the rite of war',
    },
    name: {
      type: 'string',
      required: true,
      description: 'Display name of the rite of war',
    },
    faction: {
      type: 'string',
      required: true,
      description: 'Faction ID the rite of war belongs to',
    },
    description: {
      type: 'string',
      required: true,
      description: 'Description of the rite of war',
    },
    restrictions: {
      type: 'array',
      required: false,
      description: 'Array of restriction strings',
    },
    benefits: {
      type: 'array',
      required: false,
      description: 'Array of benefit strings',
    },
  },
  primeAdvantages: {
    id: {
      type: 'string',
      required: true,
      description: 'Unique identifier for the prime advantage',
    },
    name: {
      type: 'string',
      required: true,
      description: 'Display name of the prime advantage',
    },
    description: {
      type: 'string',
      required: true,
      description: 'Description of the prime advantage',
    },
    effect: {
      type: 'string',
      required: true,
      description: 'Effect description',
    },
    restrictions: {
      type: 'array',
      required: false,
      description: 'Array of restriction strings',
    },
  },
};

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    totalErrors: number;
  };
}

export function validateCSVData(
  dataType: string,
  entries: any[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const fieldDefinitions = FIELD_DEFINITIONS[dataType];

  if (!fieldDefinitions) {
    return {
      isValid: false,
      errors: [
        {
          row: 0,
          field: 'dataType',
          message: `Unknown data type: ${dataType}`,
        },
      ],
      warnings: [],
      summary: { totalRows: 0, validRows: 0, errorRows: 0, totalErrors: 1 },
    };
  }

  if (entries.length === 0) {
    return {
      isValid: true,
      errors: [],
      warnings: ['No entries to validate'],
      summary: { totalRows: 0, validRows: 0, errorRows: 0, totalErrors: 0 },
    };
  }

  const requiredFields = Object.entries(fieldDefinitions)
    .filter(([_, def]) => def.required)
    .map(([field, _]) => field);

  const allFields = Object.keys(fieldDefinitions);
  const errorRows = new Set<number>();

  entries.forEach((entry, index) => {
    const rowNumber = index + 1; // 1-based row numbers for user-friendly reporting

    // Check for missing required fields
    requiredFields.forEach(field => {
      const fieldDef = fieldDefinitions[field];
      const value = entry[field];

      // For arrays, allow empty arrays as valid
      if (fieldDef.type === 'array') {
        if (!(field in entry) || value === null || value === undefined) {
          errors.push({
            row: rowNumber,
            field,
            message: `Required field "${field}" is missing`,
            value: entry[field],
          });
          errorRows.add(rowNumber);
        }
      } else {
        // For non-array fields, check for missing or empty
        if (
          !(field in entry) ||
          value === null ||
          value === undefined ||
          value === ''
        ) {
          errors.push({
            row: rowNumber,
            field,
            message: `Required field "${field}" is missing or empty`,
            value: entry[field],
          });
          errorRows.add(rowNumber);
        }
      }
    });

    // Validate field types
    allFields.forEach(field => {
      if (
        field in entry &&
        entry[field] !== null &&
        entry[field] !== undefined &&
        entry[field] !== ''
      ) {
        const fieldDef = fieldDefinitions[field];
        const value = entry[field];

        // Check if the value matches the expected type
        let isValid = true;
        let error = '';

        switch (fieldDef.type) {
          case 'string':
            isValid = typeof value === 'string';
            if (!isValid) error = `Expected string, got ${typeof value}`;
            break;
          case 'number':
            isValid = typeof value === 'number' && !isNaN(value);
            if (!isValid) error = `Expected number, got ${typeof value}`;
            break;
          case 'string|number':
            isValid =
              typeof value === 'string' ||
              (typeof value === 'number' && !isNaN(value));
            if (!isValid)
              error = `Expected string or number, got ${typeof value}`;
            break;
          case 'boolean':
            isValid = typeof value === 'boolean';
            if (!isValid) error = `Expected boolean, got ${typeof value}`;
            break;
          case 'array':
            isValid = Array.isArray(value);
            if (!isValid) error = `Expected array, got ${typeof value}`;
            break;
          case 'object':
            isValid =
              typeof value === 'object' &&
              value !== null &&
              !Array.isArray(value);
            if (!isValid) error = `Expected object, got ${typeof value}`;
            break;
          default:
            isValid = true;
        }

        if (!isValid) {
          errors.push({
            row: rowNumber,
            field,
            message: error || `Invalid value for field "${field}"`,
            value: entry[field],
          });
          errorRows.add(rowNumber);
        }
      }
    });

    // Check for unknown fields
    Object.keys(entry).forEach(field => {
      if (!allFields.includes(field)) {
        warnings.push(
          `Row ${rowNumber}: Unknown field "${field}" will be ignored`
        );
      }
    });
  });

  // Check for duplicate IDs
  const ids = entries
    .map(entry => entry.id)
    .filter(id => id !== null && id !== undefined && id !== '');
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

  if (duplicateIds.length > 0) {
    const uniqueDuplicates = [...new Set(duplicateIds)];
    uniqueDuplicates.forEach(id => {
      const rows = entries
        .map((entry, index) => ({ entry, index: index + 1 }))
        .filter(({ entry }) => entry.id === id)
        .map(({ index }) => index);

      errors.push({
        row: rows[0],
        field: 'id',
        message: `Duplicate ID "${id}" found in rows: ${rows.join(', ')}`,
        value: id,
      });
      rows.forEach(row => errorRows.add(row));
    });
  }

  const totalRows = entries.length;
  const validRows = totalRows - errorRows.size;
  const totalErrors = errors.length;

  return {
    isValid: totalErrors === 0,
    errors,
    warnings,
    summary: {
      totalRows,
      validRows,
      errorRows: errorRows.size,
      totalErrors,
    },
  };
}

export function generateCSVContent(dataType: string, entries: any[]): string {
  const fieldDefinitions = FIELD_DEFINITIONS[dataType];
  if (!fieldDefinitions || entries.length === 0) return '';

  const fields = Object.keys(fieldDefinitions);
  const header = fields.join(',');
  const rows = entries.map(entry => {
    return fields
      .map(field => {
        const value = entry[field];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') {
          const jsonStr = JSON.stringify(value);
          return `"${jsonStr.replace(/"/g, '""')}"`;
        }
        if (typeof value === 'string' && value.includes(','))
          return `"${value.replace(/"/g, '""')}"`;
        return String(value);
      })
      .join(',');
  });

  return [header, ...rows].join('\n');
}
