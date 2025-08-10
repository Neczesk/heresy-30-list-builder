import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Help,
  Download,
  Save,
  CheckCircle,
  Error,
  Upload,
} from '@mui/icons-material';
import { HelpModal } from './components/HelpModal';
import {
  validateCSVData,
  generateCSVContent,
  FIELD_DEFINITIONS,
} from '../../utils/csvValidator';
import { UnitModal } from './modals/UnitModal';
import { ModelModal } from './modals/ModelModal';
import { WeaponModal } from './modals/WeaponModal';
import { UpgradeModal } from './modals/UpgradeModal';
import { SimpleModal } from './modals/SimpleModal';

const DATA_TYPES = [
  'factions',
  'units',
  'models',
  'weapons',
  'upgrades',
  'specialRules',
  'detachments',
  'battlefieldRoles',
  'ritesOfWar',
  'primeAdvantages',
];

interface CSVEntry {
  id: string;
  [key: string]: any;
}

const CSVCreator: React.FC = () => {
  const [selectedDataType, setSelectedDataType] = useState<string>('');
  const [entries, setEntries] = useState<CSVEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingEntry, setEditingEntry] = useState<CSVEntry | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fieldDefinitions = useMemo(() => {
    return selectedDataType ? FIELD_DEFINITIONS[selectedDataType] || {} : {};
  }, [selectedDataType]);

  const getHelpContent = () => {
    const helpContent: {
      [key: string]: { title: string; content: React.ReactNode };
    } = {
      weapons: {
        title: 'Weapon CSV Creation Help',
        content: (
          <Box>
            <Typography variant="h6" gutterBottom>
              Creating Weapons
            </Typography>
            <Typography variant="body2" paragraph>
              Weapons can be either standalone weapons or weapon profiles.
              Profiles are used by main weapons to provide different firing
              modes.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Weapon Types
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                • Ranged Weapons:
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                Have range, firepower, and ranged strength stats
              </Typography>

              <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                • Melee Weapons:
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                Have attack, strength, and initiative modifiers
              </Typography>

              <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                • Profile Weapons:
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                Show the same fields as their parent type
              </Typography>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Creating Weapons with Profiles
            </Typography>
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                Step 1: Create Profile Weapons
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }} component="div">
                1. Select "ranged-profile" or "melee-profile" as the weapon type
                <br />
                2. Fill in the profile-specific stats (e.g., sustained
                firepower, maximal damage)
                <br />
                3. Give each profile a unique ID (e.g.,{' '}
                <code>plasma-pistol-sustained</code>,{' '}
                <code>plasma-pistol-maximal</code>)<br />
                4. Add any special rules or traits specific to that profile
              </Typography>
            </Box>

            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                Step 2: Create Main Weapon
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                1. Select "ranged" or "melee" as the weapon type
                <br />
                2. Fill in the base weapon information
                <br />
                3. In the "profiles" field, add the IDs of the profile weapons
                you created (e.g.,{' '}
                <code>
                  {'["plasma-pistol-sustained", "plasma-pistol-maximal"]'}
                </code>
                )<br />
                4. The profiles field should contain an array of strings
              </Typography>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Special Rules and Traits
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Special Rules:</strong> Array of special rule IDs that
              apply to the weapon
              <br />• <strong>Special Rule Values:</strong> Values for special
              rules that require them
              <br />• <strong>Traits:</strong> Weapon-specific traits like
              "Heavy", "Twin-linked"
            </Typography>
          </Box>
        ),
      },
      models: {
        title: 'Model CSV Creation Help',
        content: (
          <Box>
            <Typography variant="h6" gutterBottom>
              Creating Models
            </Typography>
            <Typography variant="body2" paragraph>
              Models represent individual units that can be used in armies. They
              have characteristics, special rules, and equipment.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Model Types
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                • Infantry:
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                Standard foot soldiers with movement, WS, BS, S, T, W, I, A, Ld,
                Cl, Wp, In, Sv stats
              </Typography>

              <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                • Vehicle:
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                Armored vehicles with M, BS, FA, SA, RA, HP, Transport stats
              </Typography>

              <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                • Other Types:
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                Cavalry, Walker, Automata, Paragon have their own characteristic
                sets
              </Typography>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Characteristics
            </Typography>
            <Typography variant="body2" paragraph>
              Characteristics are displayed in a horizontal layout for easy
              editing:
            </Typography>
            <Box sx={{ ml: 2 }}>
              <Typography variant="body2">
                • <strong>Infantry:</strong> Movement, WS, BS, S, T, W, I, A,
                Ld, Cl, Wp, In, Sv, Invuln
              </Typography>
              <Typography variant="body2">
                • <strong>Vehicles:</strong> M, BS, FA, SA, RA, HP, Transport
              </Typography>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Weapons and Equipment
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Infantry Weapons:</strong> Simple array of weapon IDs
              <br />• <strong>Vehicle Weapons:</strong> Complex objects with
              mount, weapon ID, and count
              <br />• <strong>Wargear:</strong> Array of wargear IDs
              <br />• <strong>Special Rules:</strong> Array of special rule IDs
              with optional values
            </Typography>
          </Box>
        ),
      },
      units: {
        title: 'Unit CSV Creation Help',
        content: (
          <Box>
            <Typography variant="h6" gutterBottom>
              Creating Units
            </Typography>
            <Typography variant="body2" paragraph>
              Units represent formations that can be added to armies. They
              contain models and have their own special rules and upgrades.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Unit Structure
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                • Models:
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                Object mapping model IDs to counts (e.g.,{' '}
                <code>{'{"lasrifle-trooper-model": 10}'}</code>)
              </Typography>

              <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                • Allegiance:
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                Loyalist, Traitor, or Universal
              </Typography>

              <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                • Battlefield Role:
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                Command, Troops, Support, etc.
              </Typography>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Special Rules and Traits
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Special Rules:</strong> Array of special rule IDs that
              apply to the unit
              <br />• <strong>Special Rule Values:</strong> Values for special
              rules that require them
              <br />• <strong>Traits:</strong> Unit-level traits like
              "[Allegiance]", "Solar Auxilia"
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Upgrades
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Unit Upgrades:</strong> Array of upgrade IDs available
              to the unit
              <br />• <strong>Model Upgrades:</strong> Object mapping model IDs
              to upgrade group IDs
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Size Management
            </Typography>
            <Typography variant="body2" paragraph>
              Unit size fields (minSize, maxSize, baseSize) are hidden as
              they're handled through the upgrade system.
            </Typography>
          </Box>
        ),
      },
      factions: {
        title: 'Faction CSV Creation Help',
        content: (
          <Box>
            <Typography variant="h6" gutterBottom>
              Creating Factions
            </Typography>
            <Typography variant="body2" paragraph>
              Factions represent the different armies and subfactions in the
              game.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Faction Types
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Legion:</strong> Space Marine legions
              <br />• <strong>Auxilia:</strong> Imperial Army units
              <br />• <strong>Mechanicum:</strong> Adeptus Mechanicus forces
              <br />• <strong>Knight:</strong> Imperial Knight houses
              <br />• <strong>Titan:</strong> Titan legions
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Special Rules and Rites of War
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Special Rules:</strong> Array of special rule IDs that
              apply to the faction
              <br />• <strong>Rites of War:</strong> Array of rite of war IDs
              available to the faction
              <br />• <strong>Is Main Faction:</strong> Boolean indicating if
              this is a main faction
              <br />• <strong>Parent Faction:</strong> ID of the parent faction
              if this is a subfaction
            </Typography>
          </Box>
        ),
      },
      specialRules: {
        title: 'Special Rules CSV Creation Help',
        content: (
          <Box>
            <Typography variant="h6" gutterBottom>
              Creating Special Rules
            </Typography>
            <Typography variant="body2" paragraph>
              Special rules define abilities and effects that can be applied to
              units, models, or weapons.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Rule Types
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>special-rule:</strong> General special rules
              <br />• <strong>wargear:</strong> Equipment and wargear rules
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Text Fields
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Description:</strong> Full description of the rule
              <br />• <strong>Short Text:</strong> Brief summary for quick
              reference
              <br />• <strong>Long Text:</strong> Detailed explanation of the
              rule
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Has Value
            </Typography>
            <Typography variant="body2" paragraph>
              Set to true if the rule can have a numerical value (e.g., "Feel No
              Pain (4+)")
            </Typography>
          </Box>
        ),
      },
      upgrades: {
        title: 'Upgrade CSV Creation Help',
        content: (
          <Box>
            <Typography variant="h6" gutterBottom>
              Creating Upgrades
            </Typography>
            <Typography variant="body2" paragraph>
              Upgrades represent options that can be applied to units, models,
              or weapons. They can include weapon replacements, wargear, and
              special rules.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Upgrade Types
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>model:</strong> Upgrades applied to individual models
              <br />• <strong>squad:</strong> Upgrades applied to entire squads
              <br />• <strong>weapon:</strong> Weapon replacement upgrades
              <br />• <strong>wargear:</strong> Equipment upgrades
              <br />• <strong>vehicle:</strong> Vehicle-specific upgrades
              <br />• <strong>transport:</strong> Transport capacity upgrades
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Upgrade Options
            </Typography>
            <Typography variant="body2" paragraph>
              Each upgrade can have multiple options, each with:
              <br />• <strong>Points Cost:</strong> Additional points for the
              upgrade
              <br />• <strong>Weapon Replacements:</strong> Weapons that replace
              existing ones
              <br />• <strong>Wargear:</strong> Additional equipment
              <br />• <strong>Special Rules:</strong> Rules that apply with this
              upgrade
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Weapon Replacements
            </Typography>
            <Typography variant="body2" paragraph>
              For vehicle weapons, you can specify:
              <br />• <strong>Weapon ID:</strong> The weapon to add
              <br />• <strong>Mount:</strong> Where the weapon is mounted (e.g.,
              "Turret Mounted")
              <br />• <strong>Count:</strong> Number of weapons (for multiple
              weapons)
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Max Count
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Numbers:</strong> Maximum number of times this upgrade
              can be taken
              <br />• <strong>dependent:</strong> The count depends on other
              factors
            </Typography>
          </Box>
        ),
      },
    };

    return (
      helpContent[selectedDataType] || {
        title: 'Help',
        content: 'Help content not available for this data type.',
      }
    );
  };

  // CSV parsing function
  const parseCSV = (csvText: string): CSVEntry[] => {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    // Parse headers
    const headers = parseCSVLine(lines[0]);
    const entries: CSVEntry[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = parseCSVLine(line);
      const entry: CSVEntry = { id: '' };

      headers.forEach((header, index) => {
        if (values[index] !== undefined) {
          let value: any = values[index];

          // Handle null/empty values
          if (value === 'null' || value === '') {
            // For array fields, use empty array instead of null
            const fieldDef = fieldDefinitions[header];
            if (fieldDef && fieldDef.type === 'array') {
              value = [];
            } else {
              value = null;
            }
          } else {
            // Try to parse as JSON (for arrays and objects)
            try {
              const parsed = JSON.parse(value);
              value = parsed;
            } catch {
              // If JSON parsing fails, try to fix common issues and retry
              let fixedValue = value;

              // Fix missing closing brackets/quotes for arrays
              if (
                header === 'traits' ||
                header === 'profiles' ||
                header === 'specialRules'
              ) {
                // Debug logging for traits parsing
                if (header === 'traits') {
                  console.log(`Original traits value: "${value}"`);
                }

                // If it looks like an array but is missing closing bracket
                if (fixedValue.startsWith('[') && !fixedValue.endsWith(']')) {
                  fixedValue = fixedValue + ']';
                }
                // If it looks like an array but is missing closing quote and bracket
                if (fixedValue.startsWith('"[') && !fixedValue.endsWith(']"')) {
                  fixedValue = fixedValue + '"]';
                }

                // Handle quoted JSON arrays with escaped quotes
                // Convert "[“Assault”,“Plasma”]" to ["Assault","Plasma"]
                if (fixedValue.startsWith('"[') && fixedValue.endsWith(']"')) {
                  // Remove outer quotes and fix inner quotes
                  fixedValue = fixedValue.slice(2, -2); // Remove "[" and "]"
                  fixedValue = '[' + fixedValue + ']';
                  // Replace escaped quotes with regular quotes
                  fixedValue = fixedValue.replace(/"/g, '"');

                  if (header === 'traits') {
                    console.log(`Fixed quoted array: "${fixedValue}"`);
                  }
                }
                // Handle unquoted JSON arrays with escaped quotes
                // Convert ["Assault","Plasma"] to ["Assault","Plasma"]
                else if (
                  fixedValue.startsWith('[') &&
                  fixedValue.endsWith(']')
                ) {
                  // Try to parse as-is first
                  try {
                    JSON.parse(fixedValue);
                    // If it parses successfully, use it as-is
                    if (header === 'traits') {
                      console.log(`Valid JSON array: "${fixedValue}"`);
                    }
                  } catch {
                    // If it fails, try to fix escaped quotes
                    fixedValue = fixedValue.replace(/"/g, '"');
                    if (header === 'traits') {
                      console.log(`Fixed unquoted array: "${fixedValue}"`);
                    }
                  }
                }
              }

              // Try parsing the fixed value
              try {
                const parsed = JSON.parse(fixedValue);
                value = parsed;
                if (header === 'traits') {
                  console.log(`Successfully parsed traits:`, parsed);
                }
              } catch (parseError) {
                if (header === 'traits') {
                  console.log(`Failed to parse traits:`, parseError);
                }

                // If still failing, try other type conversions

                // Try to parse as number if it looks like one
                if (!isNaN(Number(value)) && value !== '') {
                  value = Number(value);
                }

                // Handle boolean values
                if (value === 'true') value = true;
                if (value === 'false') value = false;
              }
            }
          }

          entry[header] = value;
        }
      });

      // Only add entries that have an ID
      if (entry.id) {
        entries.push(entry);
      }
    }

    return entries;
  };

  // Helper function to parse CSV line with proper quote handling
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add the last field
    result.push(current.trim());
    return result;
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const csvText = e.target?.result as string;
        console.log('CSV Text:', csvText); // Debug log

        const parsedEntries = parseCSV(csvText);
        console.log('Parsed Entries:', parsedEntries); // Debug log

        // Debug: Check traits specifically
        parsedEntries.forEach((entry, index) => {
          if (entry.traits !== undefined) {
            console.log(
              `Entry ${index} (${entry.id}) traits:`,
              entry.traits,
              'Type:',
              typeof entry.traits,
              'IsArray:',
              Array.isArray(entry.traits)
            );
          }
        });

        // Debug: Show raw CSV parsing for first few rows
        console.log('Raw CSV parsing debug:');
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        const headers = parseCSVLine(lines[0]);
        console.log('Headers:', headers);

        for (let i = 1; i < Math.min(5, lines.length); i++) {
          const line = lines[i];
          const values = parseCSVLine(line);
          console.log(`Row ${i}:`, values);

          // Check traits specifically
          const traitsIndex = headers.indexOf('traits');
          if (traitsIndex >= 0 && values[traitsIndex]) {
            console.log(`Row ${i} traits raw: "${values[traitsIndex]}"`);
          }
        }

        if (parsedEntries.length === 0) {
          setUploadError('No valid entries found in the CSV file.');
          return;
        }

        // Validate the parsed entries
        const validation = validateCSVData(selectedDataType, parsedEntries);
        console.log('Validation Result:', validation); // Debug log

        if (validation.isValid) {
          setEntries(parsedEntries);
          setUploadSuccess(
            `Successfully uploaded ${parsedEntries.length} entries from CSV.`
          );
        } else {
          setUploadError(
            `CSV validation failed: ${validation.errors
              .map(
                (error: any) =>
                  `Row ${error.row}, Field: ${error.field} - ${(error as any).message || 'Unknown error'}`
              )
              .join(', ')}`
          );
        }
      } catch (error) {
        setUploadError(
          `Error parsing CSV file: ${(error as any).message || 'Unknown error'}`
        );
      }
    };

    reader.onerror = () => {
      setUploadError('Error reading the file.');
    };

    reader.readAsText(file);

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDataTypeChange = (event: any) => {
    setSelectedDataType(event.target.value);
    setEntries([]);
    setValidationResult(null);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const handleAddEntry = () => {
    setEditingIndex(null);
    setEditingEntry(null);
    setShowModal(true);
  };

  const handleEditEntry = (index: number) => {
    setEditingIndex(index);
    setEditingEntry(entries[index]);
    setShowModal(true);
  };

  const handleSaveEntry = (entry: any, editingIndex?: number | null) => {
    if (editingIndex !== null && editingIndex !== undefined) {
      setEntries(prev => prev.map((e, i) => (i === editingIndex ? entry : e)));
    } else {
      setEntries(prev => [...prev, entry]);
    }
  };

  const handleDeleteEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const generateCSV = (): string => {
    return generateCSVContent(selectedDataType, entries);
  };

  const handleDownloadCSV = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `initial_${selectedDataType}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleValidateCSV = () => {
    const result = validateCSVData(selectedDataType, entries);
    setValidationResult(result);
  };

  useEffect(() => {
    if (entries.length > 0) {
      handleValidateCSV();
    } else {
      setValidationResult(null);
    }
  }, [entries, selectedDataType]);

  const renderModal = () => {
    if (!showModal) return null;

    const commonProps = {
      open: showModal,
      onClose: () => setShowModal(false),
      onSave: handleSaveEntry,
      initialEntry: editingEntry,
      editingIndex: editingIndex,
    };

    switch (selectedDataType) {
      case 'units':
        return <UnitModal {...commonProps} />;
      case 'models':
        return <ModelModal {...commonProps} />;
      case 'weapons':
        return <WeaponModal {...commonProps} currentEntries={entries} />;
      case 'upgrades':
        return <UpgradeModal {...commonProps} />;
      default:
        return (
          <SimpleModal
            {...commonProps}
            dataType={selectedDataType}
            fields={Object.keys(fieldDefinitions)}
          />
        );
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        CSV Creator
      </Typography>

      {/* Data Type Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Data Type</InputLabel>
              <Select
                value={selectedDataType}
                onChange={handleDataTypeChange}
                label="Data Type"
              >
                {DATA_TYPES.map(type => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<Help />}
              onClick={() => setShowHelpDialog(true)}
              disabled={!selectedDataType}
            >
              Help
            </Button>
          </Box>
        </CardContent>
      </Card>

      {selectedDataType && (
        <>
          {/* Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleAddEntry}
                >
                  Add Entry
                </Button>

                {/* Upload CSV Button */}
                <Button
                  variant="outlined"
                  startIcon={<Upload />}
                  onClick={() => fileInputRef.current?.click()}
                  component="label"
                >
                  Upload CSV
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />

                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleDownloadCSV}
                  disabled={entries.length === 0}
                >
                  Download CSV
                </Button>
              </Box>

              {/* Upload Status Messages */}
              {uploadSuccess && (
                <Alert
                  severity="success"
                  sx={{ mb: 2 }}
                  onClose={() => setUploadSuccess(null)}
                >
                  {uploadSuccess}
                </Alert>
              )}

              {uploadError && (
                <Alert
                  severity="error"
                  sx={{ mb: 2 }}
                  onClose={() => setUploadError(null)}
                >
                  {uploadError}
                </Alert>
              )}

              {/* Validation Status */}
              {validationResult && (
                <Alert
                  severity={validationResult.isValid ? 'success' : 'error'}
                  icon={validationResult.isValid ? <CheckCircle /> : <Error />}
                  sx={{ mb: 2 }}
                >
                  {validationResult.isValid ? (
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        Validation Passed
                      </Typography>
                      <Typography variant="body2">
                        All entries are valid and ready for download.
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        Validation Failed
                      </Typography>
                      <Typography variant="body2">
                        {validationResult.errors
                          .map(
                            (error: any) =>
                              `Row ${error.row}, Field: ${error.field} - ${error.message}`
                          )
                          .join(', ')}
                      </Typography>
                    </Box>
                  )}
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Entries Table */}
          {entries.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Entries ({entries.length})
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {entries.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>{entry.id}</TableCell>
                          <TableCell>{entry.name || 'N/A'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleEditEntry(index)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleDeleteEntry(index)}
                              >
                                Delete
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Modals */}
      {renderModal()}
      <HelpModal
        open={showHelpDialog}
        onClose={() => setShowHelpDialog(false)}
        helpContent={getHelpContent()}
      />
    </Container>
  );
};

export default CSVCreator;
