import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import path from 'path';
import { parse } from 'fast-csv';

// List of data types to process
const DATA_TYPES = [
  'battlefieldRoles',
  'models',
  'primeAdvantages',
  'ritesOfWar',
  'upgrades',
  'specialRules',
  'weapons',
  'detachments',
  'units',
  'factions',
];

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const DATA_DIR = path.join(__dirname, 'src', 'data');

async function readCSVsForType(type: string): Promise<any[]> {
  const csvDir = path.join(DATA_DIR, 'csv', type);
  let files: string[] = [];
  try {
    files = (await fs.readdir(csvDir)).filter(f => f.endsWith('.csv'));
  } catch (e) {
    console.warn(`No CSV directory for ${type}`);
    return [];
  }
  const allRows: any[] = [];
  for (const file of files) {
    const filePath = path.join(csvDir, file);
    const rows: any[] = await new Promise((resolve, reject) => {
      const results: any[] = [];
      fsSync
        .createReadStream(filePath)
        .pipe(parse({ headers: true }))
        .on('error', reject)
        .on('data', row => results.push(row))
        .on('end', () => resolve(results));
    });
    allRows.push(...rows);
  }
  return allRows;
}

function dedupeById(rows: any[]): { deduped: any[]; duplicates: string[] } {
  const seen = new Map<string, any>();
  const duplicates: string[] = [];
  for (const row of rows) {
    if (!row.id) continue;
    if (seen.has(row.id)) {
      duplicates.push(row.id);
    } else {
      seen.set(row.id, row);
    }
  }
  return { deduped: Array.from(seen.values()), duplicates };
}

function parseJsonStrings(obj: any): any {
  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      return obj.map(parseJsonStrings);
    } else {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          // Try to parse as JSON if it looks like JSON
          if (value.startsWith('[') || value.startsWith('{')) {
            try {
              result[key] = parseJsonStrings(JSON.parse(value));
            } catch {
              result[key] = value;
            }
          } else {
            result[key] = value;
          }
        } else if (typeof value === 'object' && value !== null) {
          result[key] = parseJsonStrings(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    }
  }
  return obj;
}

function convertStringBooleans(obj: any): any {
  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      return obj.map(convertStringBooleans);
    } else {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (
          typeof value === 'string' &&
          (value === 'true' || value === 'false')
        ) {
          result[key] = value === 'true';
        } else if (typeof value === 'object' && value !== null) {
          result[key] = convertStringBooleans(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    }
  }
  return obj;
}

function convertHasValueFields(obj: any): any {
  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      return obj.map(convertHasValueFields);
    } else {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'hasValue') {
          // Convert hasValue to boolean - if it's a string, convert it; if it's already a boolean, keep it
          if (typeof value === 'string') {
            result[key] = value === 'true' || value === '1' || value === 'yes';
          } else if (typeof value === 'boolean') {
            result[key] = value;
          } else {
            result[key] = Boolean(value);
          }
        } else if (typeof value === 'object' && value !== null) {
          result[key] = convertHasValueFields(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    }
  }
  return obj;
}

function convertStringNumbers(obj: any): any {
  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      return obj.map(convertStringNumbers);
    } else {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          // Convert numeric strings to numbers for specific fields
          if (
            [
              'points',
              'maxCount',
              'count',
              'ap',
              'damage',
              'firepower',
              'range',
              'rangedStrength',
              'strengthModifier',
              'initiativeModifier',
              'attackModifier',
              'minSize',
              'maxSize',
              'baseSize',
            ].includes(key)
          ) {
            // Special handling for range field - can be string (template) or number
            if (key === 'range') {
              if (value.toLowerCase().includes('template')) {
                result[key] = value; // Keep as string for template values
              } else {
                const num = parseFloat(value);
                result[key] = isNaN(num) ? null : num;
              }
            } else {
              // Handle "null" string values
              if (value === 'null') {
                result[key] = null;
              } else {
                const num = parseFloat(value);
                result[key] = isNaN(num) ? (value === '' ? null : value) : num;
              }
            }
          } else {
            result[key] = value;
          }
        } else if (typeof value === 'object' && value !== null) {
          result[key] = convertStringNumbers(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    }
  }
  return obj;
}

function fillMissingNumericFields(obj: any): any {
  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      return obj.map(fillMissingNumericFields);
    } else {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value === undefined || value === null || value === '') {
          // Fill missing numeric fields with 0
          if (['minSize', 'maxSize', 'baseSize'].includes(key)) {
            result[key] = 0;
          } else {
            result[key] = value;
          }
        } else if (typeof value === 'object' && value !== null) {
          result[key] = fillMissingNumericFields(value);
        } else {
          result[key] = value;
        }
      }

      // Ensure required fields exist for units
      if (obj.id && (obj.faction || obj.battlefieldRole)) {
        // This looks like a unit
        if (!('minSize' in result)) result.minSize = 0;
        if (!('maxSize' in result)) result.maxSize = 0;
        if (!('baseSize' in result)) result.baseSize = 0;
        if (!('upgrades' in result)) result.upgrades = [];
      }

      return result;
    }
  }
  return obj;
}

function convertArrayFields(obj: any): any {
  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      return obj.map(convertArrayFields);
    } else {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (
          (key === 'subType' ||
            key === 'modelTypes' ||
            key === 'targetModelTypes' ||
            key === 'requiredWeapons' ||
            key === 'subfaction' ||
            key === 'faction' ||
            key === 'legionSpecific') &&
          typeof value === 'string'
        ) {
          if (value === '') {
            result[key] = [];
          } else if (value.includes(',')) {
            // Convert comma-separated values to array
            result[key] = value
              .split(',')
              .map((s: string) => s.trim())
              .filter(s => s !== '');
          } else {
            // Single value becomes array with one element
            result[key] = [value];
          }
        } else if (typeof value === 'object' && value !== null) {
          result[key] = convertArrayFields(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    }
  }
  return obj;
}

function convertEmptyArrays(obj: any): any {
  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      return obj.map(convertEmptyArrays);
    } else {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Convert empty strings to empty arrays for array fields
        if (
          typeof value === 'string' &&
          value === '' &&
          (key === 'traits' ||
            key === 'specialRules' ||
            key === 'profiles' ||
            key === 'upgrades' ||
            key === 'subType' ||
            key === 'modelTypes' ||
            key === 'targetModelTypes' ||
            key === 'requiredWeapons' ||
            key === 'legionSpecific')
        ) {
          result[key] = [];
        } else if (typeof value === 'object' && value !== null) {
          result[key] = convertEmptyArrays(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    }
  }
  return obj;
}

function cleanWeaponObjects(data: any[]): any[] {
  return data.map(item => {
    const cleaned: any = { ...item };

    // Handle empty AP fields - set to null
    if (cleaned.ap === '' || cleaned.ap === undefined) {
      cleaned.ap = null;
    }

    // All weapons now have the same structure - no special profile handling needed
    if (item.type === 'melee' || item.type === 'melee-profile') {
      // For melee weapons, remove ranged weapon fields but keep melee-specific fields
      const { range, firepower, rangedStrength, ...meleeWeapon } = cleaned;
      return meleeWeapon;
    } else if (item.type === 'ranged' || item.type === 'ranged-profile') {
      // For ranged weapons, remove melee weapon fields but keep ranged-specific fields
      const {
        initiativeModifier,
        attackModifier,
        strengthModifier,
        ...rangedWeapon
      } = cleaned;
      return rangedWeapon;
    }
    return cleaned;
  });
}

async function writeJSON(type: string, data: any[]) {
  const outPath = path.join(DATA_DIR, `${type}.json`);
  const parsedData = parseJsonStrings(data);
  const numberConvertedData = convertStringNumbers(parsedData);
  const booleanConvertedData = convertStringBooleans(numberConvertedData);
  const hasValueConvertedData = convertHasValueFields(booleanConvertedData);
  const filledData = fillMissingNumericFields(hasValueConvertedData);
  const arrayFieldsConvertedData = convertArrayFields(filledData);
  const arrayConvertedData = convertEmptyArrays(arrayFieldsConvertedData);

  // Clean weapon objects to have appropriate field structure
  let finalData = arrayConvertedData;
  if (type === 'weapons') {
    finalData = cleanWeaponObjects(arrayConvertedData);
  }

  const wrappedData = { [type]: finalData };

  await fs.writeFile(outPath, JSON.stringify(wrappedData, null, 2));
}

async function main() {
  let hadErrors = false;
  for (const type of DATA_TYPES) {
    console.log(`Processing ${type}...`);
    const rows = await readCSVsForType(type);
    if (!rows.length) {
      console.warn(`No CSV data for ${type}`);
      continue;
    }
    const { deduped, duplicates } = dedupeById(rows);
    if (duplicates.length) {
      console.error(`Duplicate IDs in ${type}:`, duplicates);
      hadErrors = true;
    }
    // TODO: Add required field validation per type if needed
    await writeJSON(type, deduped);
    console.log(`Wrote ${deduped.length} records to ${type}.json`);
  }
  if (hadErrors) {
    console.error(
      'Validation errors found. Please review and fix before proceeding.'
    );
    process.exit(1);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
