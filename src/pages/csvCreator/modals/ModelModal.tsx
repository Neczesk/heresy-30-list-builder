import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

// Model types and subtypes from TypeScript types
const MODEL_TYPES = [
  'Infantry',
  'Cavalry',
  'Walker',
  'Automata',
  'Paragon',
  'Vehicle',
];

const MODEL_SUBTYPES = [
  'Unique',
  'Command',
  'Champion',
  'Specialist',
  'Heavy',
  'Sergeant',
  'Light',
  'Skirmish',
  'Transport',
  'Anti-grav',
  'Stable',
  'Flyer',
  'Super-Heavy',
];

// Characteristic fields for different model types
const INFANTRY_CHARACTERISTICS = [
  'movement',
  'weaponSkill',
  'ballisticSkill',
  'strength',
  'toughness',
  'wounds',
  'initiative',
  'attacks',
  'leadership',
  'cool',
  'willpower',
  'intelligence',
  'armourSave',
  'invulnerableSave',
];

const VEHICLE_CHARACTERISTICS = [
  'movement',
  'ballisticSkill',
  'frontArmour',
  'sideArmour',
  'rearArmour',
  'hullPoints',
  'transportCapacity',
];

interface ModelModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: any, editingIndex?: number | null) => void;
  initialEntry?: any;
  editingIndex?: number | null;
}

export const ModelModal: React.FC<ModelModalProps> = ({
  open,
  onClose,
  onSave,
  initialEntry = {},
  editingIndex = null,
}) => {
  const [entry, setEntry] = useState<any>({ id: '' });
  const [characteristics, setCharacteristics] = useState<{
    [key: string]: number;
  }>({});
  const [specialRules, setSpecialRules] = useState<string[]>([]);
  const [specialRuleValues, setSpecialRuleValues] = useState<{
    [key: string]: any;
  }>({});
  const [wargear, setWargear] = useState<string[]>([]);
  const [weapons, setWeapons] = useState<any[]>([]);
  const [upgradeGroups, setUpgradeGroups] = useState<any[]>([]);
  // Input states
  const [newSpecialRule, setNewSpecialRule] = useState('');
  const [selectedSpecialRuleForValue, setSelectedSpecialRuleForValue] =
    useState('');
  const [specialRuleValue, setSpecialRuleValue] = useState('');
  const [newWargear, setNewWargear] = useState('');
  const [newWeapon, setNewWeapon] = useState('');
  const [newVehicleWeaponMount, setNewVehicleWeaponMount] = useState('');
  const [newVehicleWeaponWeapon, setNewVehicleWeaponWeapon] = useState('');
  const [newVehicleWeaponCount, setNewVehicleWeaponCount] = useState(1);

  const isVehicle = entry.type === 'Vehicle';

  useEffect(() => {
    if (open) {
      setEntry({
        id: '',
        subType: initialEntry?.subType || [],
        ...initialEntry,
      });
      setCharacteristics(initialEntry?.characteristics || {});
      setSpecialRules(initialEntry?.specialRules || []);
      setSpecialRuleValues(initialEntry?.specialRuleValues || {});
      setWargear(initialEntry?.wargear || []);
      setWeapons(initialEntry?.weapons || []);
      setUpgradeGroups(initialEntry?.upgradeGroups || []);
    }
  }, [open, initialEntry]);

  const handleFieldChange = (field: string, value: any) => {
    setEntry((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleCharacteristicChange = (field: string, value: string) => {
    const numValue = value === '' ? 0 : Number(value);
    setCharacteristics(prev => ({ ...prev, [field]: numValue }));
  };

  // Special rules
  const addSpecialRule = () => {
    if (newSpecialRule.trim()) {
      setSpecialRules([...specialRules, newSpecialRule.trim()]);
      setNewSpecialRule('');
    }
  };
  const removeSpecialRule = (rule: string) => {
    setSpecialRules(specialRules.filter(r => r !== rule));
    const newValues = { ...specialRuleValues };
    delete newValues[rule];
    setSpecialRuleValues(newValues);
  };
  const addSpecialRuleValue = () => {
    if (selectedSpecialRuleForValue && specialRuleValue.trim()) {
      setSpecialRuleValues({
        ...specialRuleValues,
        [selectedSpecialRuleForValue]: isNaN(Number(specialRuleValue))
          ? specialRuleValue
          : Number(specialRuleValue),
      });
      setSelectedSpecialRuleForValue('');
      setSpecialRuleValue('');
    }
  };
  const removeSpecialRuleValue = (rule: string) => {
    const newValues = { ...specialRuleValues };
    delete newValues[rule];
    setSpecialRuleValues(newValues);
  };

  // Wargear
  const addWargear = () => {
    if (newWargear.trim()) {
      setWargear([...wargear, newWargear.trim()]);
      setNewWargear('');
    }
  };
  const removeWargear = (item: string) => {
    setWargear(wargear.filter(w => w !== item));
  };

  // Weapons
  const addWeapon = () => {
    if (newWeapon.trim()) {
      if (isVehicle) {
        if (newVehicleWeaponMount.trim() && newVehicleWeaponWeapon.trim()) {
          setWeapons([
            ...weapons,
            {
              mount: newVehicleWeaponMount.trim(),
              weapon: newVehicleWeaponWeapon.trim(),
              count: newVehicleWeaponCount,
            },
          ]);
          setNewVehicleWeaponMount('');
          setNewVehicleWeaponWeapon('');
          setNewVehicleWeaponCount(1);
        }
      } else {
        setWeapons([...weapons, newWeapon.trim()]);
        setNewWeapon('');
      }
    }
  };
  const removeWeapon = (index: number) => {
    setWeapons(weapons.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(
      {
        ...entry,
        characteristics,
        specialRules,
        specialRuleValues,
        wargear,
        weapons,
        upgradeGroups,
      },
      editingIndex
    );
    onClose();
  };

  const getCharacteristicFields = () => {
    return isVehicle ? VEHICLE_CHARACTERISTICS : INFANTRY_CHARACTERISTICS;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        {editingIndex !== null ? 'Edit Model' : 'Add New Model'}
      </DialogTitle>
      <DialogContent sx={{ overflow: 'auto' }}>
        {/* Basic fields */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 2,
            mb: 3,
          }}
        >
          <TextField
            label="ID"
            value={entry.id || ''}
            onChange={e => handleFieldChange('id', e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Name"
            value={entry.name || ''}
            onChange={e => handleFieldChange('name', e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Description"
            value={entry.description || ''}
            onChange={e => handleFieldChange('description', e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Box>

        {/* Type and SubType */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 2,
            mb: 3,
          }}
        >
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={entry.type || ''}
              onChange={e => handleFieldChange('type', e.target.value)}
              label="Type"
            >
              {MODEL_TYPES.map(type => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>SubType</InputLabel>
            <Select
              multiple
              value={entry.subType || []}
              onChange={e =>
                handleFieldChange(
                  'subType',
                  typeof e.target.value === 'string'
                    ? e.target.value.split(',')
                    : e.target.value
                )
              }
              input={<OutlinedInput label="SubType" />}
              renderValue={selected => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value: string) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {MODEL_SUBTYPES.map(subtype => (
                <MenuItem key={subtype} value={subtype}>
                  <Checkbox
                    checked={(entry.subType || []).indexOf(subtype) > -1}
                  />
                  <ListItemText primary={subtype} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Characteristics */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Characteristics
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  {getCharacteristicFields().map(field => (
                    <TableCell
                      key={field}
                      sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}
                    >
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  {getCharacteristicFields().map(field => (
                    <TableCell key={field}>
                      <TextField
                        size="small"
                        type="number"
                        value={characteristics[field] || ''}
                        onChange={e =>
                          handleCharacteristicChange(field, e.target.value)
                        }
                        inputProps={{ min: 0 }}
                        fullWidth
                      />
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Special Rules */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Special Rules</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              size="small"
              placeholder="Enter special rule ID"
              value={newSpecialRule}
              onChange={e => setNewSpecialRule(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addSpecialRule()}
            />
            <Button
              size="small"
              onClick={addSpecialRule}
              disabled={!newSpecialRule.trim()}
            >
              Add
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {specialRules.map((rule, idx) => (
              <Chip
                key={idx}
                label={rule}
                onDelete={() => removeSpecialRule(rule)}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        {/* Special Rule Values */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Special Rule Values</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Select Special Rule</InputLabel>
              <Select
                value={selectedSpecialRuleForValue}
                onChange={e => setSelectedSpecialRuleForValue(e.target.value)}
                label="Select Special Rule"
              >
                <MenuItem value="">Choose a special rule</MenuItem>
                {specialRules.map(rule => (
                  <MenuItem key={rule} value={rule}>
                    {rule}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Value"
              value={specialRuleValue}
              onChange={e => setSpecialRuleValue(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addSpecialRuleValue()}
            />
            <Button
              size="small"
              onClick={addSpecialRuleValue}
              disabled={
                !selectedSpecialRuleForValue || !specialRuleValue.trim()
              }
            >
              Add
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(specialRuleValues).map(([rule, value]) => (
              <Chip
                key={rule}
                label={`${rule}: ${value}`}
                onDelete={() => removeSpecialRuleValue(rule)}
                size="small"
                color="warning"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        {/* Wargear */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Wargear</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              size="small"
              placeholder="Enter wargear ID"
              value={newWargear}
              onChange={e => setNewWargear(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addWargear()}
            />
            <Button
              size="small"
              onClick={addWargear}
              disabled={!newWargear.trim()}
            >
              Add
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {wargear.map((item, idx) => (
              <Chip
                key={idx}
                label={item}
                onDelete={() => removeWargear(item)}
                size="small"
                color="info"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        {/* Weapons */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Weapons</Typography>
          {isVehicle ? (
            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Mount"
                value={newVehicleWeaponMount}
                onChange={e => setNewVehicleWeaponMount(e.target.value)}
              />
              <TextField
                size="small"
                placeholder="Weapon ID"
                value={newVehicleWeaponWeapon}
                onChange={e => setNewVehicleWeaponWeapon(e.target.value)}
              />
              <TextField
                size="small"
                type="number"
                placeholder="Count"
                value={newVehicleWeaponCount}
                onChange={e => setNewVehicleWeaponCount(Number(e.target.value))}
                inputProps={{ min: 1 }}
                sx={{ width: 100 }}
              />
              <Button
                size="small"
                onClick={addWeapon}
                disabled={
                  !newVehicleWeaponMount.trim() ||
                  !newVehicleWeaponWeapon.trim()
                }
              >
                Add
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                placeholder="Enter weapon ID"
                value={newWeapon}
                onChange={e => setNewWeapon(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && addWeapon()}
              />
              <Button
                size="small"
                onClick={addWeapon}
                disabled={!newWeapon.trim()}
              >
                Add
              </Button>
            </Box>
          )}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {weapons.map((weapon, idx) => (
              <Chip
                key={idx}
                label={
                  isVehicle
                    ? `${weapon.mount}: ${weapon.weapon} (${weapon.count})`
                    : weapon
                }
                onDelete={() => removeWeapon(idx)}
                size="small"
                color="success"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {editingIndex !== null ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
