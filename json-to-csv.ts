import { promises as fs } from 'fs';
import path from 'path';

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
const BACKUP_DIR = path.join(__dirname, 'backup', 'original-jsons');

function convertValueToCSV(value: any, fieldName?: string): string {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return '';
  }
  if (Array.isArray(value)) {
    // Convert arrays to comma-separated strings for certain fields
    if (
      fieldName &&
      [
        'subType',
        'modelTypes',
        'targetModelTypes',
        'traits',
        'specialRules',
        'profiles',
        'upgrades',
      ].includes(fieldName)
    ) {
      const csvValue = value.join(',');
      // Wrap in quotes if it contains commas (which it will for multi-item arrays)
      return csvValue.includes(',') ? `"${csvValue}"` : csvValue;
    }
    // For other arrays, use JSON stringification
    const jsonStr = JSON.stringify(value);
    return `"${jsonStr.replace(/"/g, '""')}"`;
  }
  if (typeof value === 'object') {
    // For complex objects, use a more robust JSON stringification
    const jsonStr = JSON.stringify(value);
    // Escape quotes and wrap in quotes to handle CSV properly
    return `"${jsonStr.replace(/"/g, '""')}"`;
  }
  if (typeof value === 'string') {
    // Handle strings that contain commas, quotes, or newlines
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
  return String(value);
}

function getCSVFilename(type: string, data: any[]): string {
  return `initial_${type}.csv`;
}

async function convertJSONToCSV(type: string) {
  console.log(`Converting ${type}...`);

  // Read the original working JSON
  const jsonPath = path.join(BACKUP_DIR, `${type}.json`);
  const jsonData = JSON.parse(await fs.readFile(jsonPath, 'utf-8'));

  // Extract the data array - handle both wrapped and unwrapped formats
  let dataArray;
  if (jsonData[type]) {
    // Data is wrapped in an object with type name as key
    dataArray = jsonData[type];
  } else if (Array.isArray(jsonData)) {
    // Data is already an array
    dataArray = jsonData;
  } else {
    // Try to find any array in the object
    const arrays = Object.values(jsonData).filter(val => Array.isArray(val));
    if (arrays.length > 0) {
      dataArray = arrays[0];
    } else {
      dataArray = jsonData;
    }
  }

  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    console.warn(`No data found for ${type}`);
    return;
  }

  // Get all unique fields from all items
  const allFields = new Set<string>();
  dataArray.forEach(item => {
    Object.keys(item).forEach(key => allFields.add(key));
  });

  // Order fields with 'id' first, 'name' second, then alphabetically
  const fields = Array.from(allFields).sort((a, b) => {
    if (a === 'id') return -1;
    if (b === 'id') return 1;
    if (a === 'name') return -1;
    if (b === 'name') return 1;
    return a.localeCompare(b);
  });

  // Create CSV content
  const csvHeader = fields.join(',');
  const csvRows = dataArray.map(item => {
    return fields.map(field => convertValueToCSV(item[field], field)).join(',');
  });

  const csvContent = [csvHeader, ...csvRows].join('\n');

  // Ensure CSV directory exists and wipe any existing files
  const csvDir = path.join(DATA_DIR, 'csv', type);
  await fs.rm(csvDir, { recursive: true, force: true });
  await fs.mkdir(csvDir, { recursive: true });

  // Write CSV file
  const csvFilename = getCSVFilename(type, dataArray);
  const csvPath = path.join(csvDir, csvFilename);
  await fs.writeFile(csvPath, csvContent);

  console.log(`Wrote ${dataArray.length} records to ${csvPath}`);
}

async function main() {
  console.log('Converting original JSON files to CSV...');

  for (const type of DATA_TYPES) {
    try {
      await convertJSONToCSV(type);
    } catch (error) {
      console.error(`Error converting ${type}:`, error);
    }
  }

  console.log('Conversion complete!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
