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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from '@mui/material';
import { ExpandMore, Delete } from '@mui/icons-material';

const UPGRADE_TYPES = [
  'model',
  'squad',
  'weapon',
  'wargear',
  'vehicle',
  'transport',
];

const MAX_COUNT_OPTIONS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'dependent',
];

interface WeaponReplacement {
  replaceWeapon: string;
  addWeapon: string | { id: string; mount?: string; count?: number };
}

interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  points: number;
  weaponReplacements?: WeaponReplacement[];
  replaceWeapon?: string;
  addWeapon?: string;
  wargear?: string[];
  specialRules?: string[];
  specialRuleValues?: { [key: string]: any };
}

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: any, editingIndex?: number | null) => void;
  initialEntry?: any;
  editingIndex?: number | null;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  open,
  onClose,
  onSave,
  initialEntry = {},
  editingIndex = null,
}) => {
  const [entry, setEntry] = useState<any>({ id: '' });
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);

  // Input states for new upgrade option
  const [newOptionId, setNewOptionId] = useState('');
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionDescription, setNewOptionDescription] = useState('');
  const [newOptionPoints, setNewOptionPoints] = useState(0);
  const [newOptionWargear, setNewOptionWargear] = useState<string[]>([]);
  const [newOptionSpecialRules, setNewOptionSpecialRules] = useState<string[]>(
    []
  );
  const [newOptionSpecialRuleValues, setNewOptionSpecialRuleValues] = useState<{
    [key: string]: any;
  }>({});

  // Weapon replacement states
  const [newReplaceWeapon, setNewReplaceWeapon] = useState('');
  const [newAddWeaponId, setNewAddWeaponId] = useState('');
  const [newAddWeaponMount, setNewAddWeaponMount] = useState('');
  const [newAddWeaponCount, setNewAddWeaponCount] = useState(1);
  const [newOptionWeaponReplacements, setNewOptionWeaponReplacements] =
    useState<WeaponReplacement[]>([]);
  const [weaponType, setWeaponType] = useState<'infantry' | 'vehicle'>(
    'infantry'
  );

  // Target model types states
  const [targetModelTypes, setTargetModelTypes] = useState<string[]>([]);
  const [newTargetModelType, setNewTargetModelType] = useState('');

  useEffect(() => {
    if (open) {
      setEntry({
        id: '',
        type: 'model',
        maxCount: '1',
        targetModelType: '',
        targetModelTypes: [],
        options: [],
        ...initialEntry,
      });
      setUpgradeOptions(initialEntry?.options || []);
      setTargetModelTypes(initialEntry?.targetModelTypes || []);
    }
  }, [open, initialEntry]);

  const handleFieldChange = (field: string, value: any) => {
    let processedValue = value;
    if (['points'].includes(field)) {
      processedValue = value === '' ? 0 : Number(value);
    }
    setEntry((prev: any) => ({ ...prev, [field]: processedValue }));
  };

  // Upgrade Options
  const addUpgradeOption = () => {
    if (newOptionId.trim() && newOptionName.trim()) {
      // Handle weapon replacements - they're always objects with replaceWeapon/addWeapon
      let weaponReplacements: any = undefined;
      if (newOptionWeaponReplacements.length > 0) {
        weaponReplacements = newOptionWeaponReplacements;
      }

      const newOption: UpgradeOption = {
        id: newOptionId.trim(),
        name: newOptionName.trim(),
        description: newOptionDescription.trim(),
        points: newOptionPoints,
        weaponReplacements,
        wargear: newOptionWargear.length > 0 ? newOptionWargear : undefined,
        specialRules:
          newOptionSpecialRules.length > 0 ? newOptionSpecialRules : undefined,
        specialRuleValues:
          Object.keys(newOptionSpecialRuleValues).length > 0
            ? newOptionSpecialRuleValues
            : undefined,
      };

      setUpgradeOptions([...upgradeOptions, newOption]);

      // Reset form
      setNewOptionId('');
      setNewOptionName('');
      setNewOptionDescription('');
      setNewOptionPoints(0);
      setNewOptionWargear([]);
      setNewOptionSpecialRules([]);
      setNewOptionSpecialRuleValues({});
      setNewOptionWeaponReplacements([]);
    }
  };

  const removeUpgradeOption = (index: number) => {
    setUpgradeOptions(upgradeOptions.filter((_, i) => i !== index));
  };

  // Wargear for upgrade option
  const addWargearToOption = () => {
    if (newOptionWargear.length > 0) {
      setNewOptionWargear([...newOptionWargear, '']);
    } else {
      setNewOptionWargear(['']);
    }
  };

  const updateWargearInOption = (index: number, value: string) => {
    const updated = [...newOptionWargear];
    updated[index] = value;
    setNewOptionWargear(updated);
  };

  const removeWargearFromOption = (index: number) => {
    setNewOptionWargear(newOptionWargear.filter((_, i) => i !== index));
  };

  // Special Rules for upgrade option
  const addSpecialRuleToOption = () => {
    if (newOptionSpecialRules.length > 0) {
      setNewOptionSpecialRules([...newOptionSpecialRules, '']);
    } else {
      setNewOptionSpecialRules(['']);
    }
  };

  const updateSpecialRuleInOption = (index: number, value: string) => {
    const updated = [...newOptionSpecialRules];
    updated[index] = value;
    setNewOptionSpecialRules(updated);
  };

  const removeSpecialRuleFromOption = (index: number) => {
    setNewOptionSpecialRules(
      newOptionSpecialRules.filter((_, i) => i !== index)
    );
  };

  // Weapon Replacements for upgrade option
  const addWeaponReplacement = () => {
    if (newReplaceWeapon.trim() && newAddWeaponId.trim()) {
      let addWeapon: string | { id: string; mount?: string; count?: number };

      if (weaponType === 'infantry') {
        // For infantry, just use the weapon ID as a string
        addWeapon = newAddWeaponId.trim();
      } else {
        // For vehicles, create an object with mount and count
        addWeapon = {
          id: newAddWeaponId.trim(),
          mount: newAddWeaponMount.trim() || undefined,
          count: newAddWeaponCount > 1 ? newAddWeaponCount : undefined,
        };
      }

      const replacement: WeaponReplacement = {
        replaceWeapon: newReplaceWeapon.trim(),
        addWeapon,
      };

      setNewOptionWeaponReplacements([
        ...newOptionWeaponReplacements,
        replacement,
      ]);

      setNewReplaceWeapon('');
      setNewAddWeaponId('');
      setNewAddWeaponMount('');
      setNewAddWeaponCount(1);
    }
  };

  const removeWeaponReplacement = (index: number) => {
    setNewOptionWeaponReplacements(
      newOptionWeaponReplacements.filter((_, i) => i !== index)
    );
  };

  // Target Model Types management
  const addTargetModelType = () => {
    if (
      newTargetModelType.trim() &&
      !targetModelTypes.includes(newTargetModelType.trim())
    ) {
      setTargetModelTypes([...targetModelTypes, newTargetModelType.trim()]);
      setNewTargetModelType('');
    }
  };

  const removeTargetModelType = (index: number) => {
    setTargetModelTypes(targetModelTypes.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(
      {
        ...entry,
        targetModelTypes,
        options: upgradeOptions,
      },
      editingIndex
    );
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        {editingIndex !== null ? 'Edit Upgrade' : 'Add New Upgrade'}
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
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={entry.type || 'model'}
              onChange={e => handleFieldChange('type', e.target.value)}
              label="Type"
            >
              {UPGRADE_TYPES.map(type => (
                <MenuItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Max Count</InputLabel>
            <Select
              value={entry.maxCount || '1'}
              onChange={e => handleFieldChange('maxCount', e.target.value)}
              label="Max Count"
            >
              {MAX_COUNT_OPTIONS.map(count => (
                <MenuItem key={count} value={count}>
                  {count}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Target Model Type"
            value={entry.targetModelType || ''}
            onChange={e => handleFieldChange('targetModelType', e.target.value)}
            fullWidth
            placeholder="e.g., Infantry, Vehicle"
          />
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Target Model Types (for multiple targeting)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                placeholder="Model Type ID"
                value={newTargetModelType}
                onChange={e => setNewTargetModelType(e.target.value)}
                sx={{ flex: 1 }}
              />
              <Button
                size="small"
                onClick={addTargetModelType}
                disabled={!newTargetModelType.trim()}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {targetModelTypes.map((type, idx) => (
                <Chip
                  key={idx}
                  label={type}
                  onDelete={() => removeTargetModelType(idx)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Upgrade Options */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Upgrade Options
          </Typography>

          {/* Add new option form */}
          <Box
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              mb: 2,
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Add New Option
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 2,
                mb: 2,
              }}
            >
              <TextField
                size="small"
                label="Option ID"
                value={newOptionId}
                onChange={e => setNewOptionId(e.target.value)}
                placeholder="e.g., lasrifle-upgrade"
              />
              <TextField
                size="small"
                label="Option Name"
                value={newOptionName}
                onChange={e => setNewOptionName(e.target.value)}
                placeholder="e.g., Lasrifle"
              />
              <TextField
                size="small"
                label="Points"
                type="number"
                value={newOptionPoints}
                onChange={e => setNewOptionPoints(Number(e.target.value) || 0)}
                inputProps={{ min: 0 }}
              />
            </Box>

            <TextField
              size="small"
              label="Description"
              value={newOptionDescription}
              onChange={e => setNewOptionDescription(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              sx={{ mb: 2 }}
            />

            {/* Weapon Replacements */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Weapon Replacements
              </Typography>

              {/* Weapon Type Selector */}
              <Box sx={{ mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Weapon Type</InputLabel>
                  <Select
                    value={weaponType}
                    onChange={e =>
                      setWeaponType(e.target.value as 'infantry' | 'vehicle')
                    }
                    label="Weapon Type"
                  >
                    <MenuItem value="infantry">
                      Infantry (Simple Strings)
                    </MenuItem>
                    <MenuItem value="vehicle">
                      Vehicle (Mounts & Counts)
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  placeholder="Replace Weapon ID"
                  value={newReplaceWeapon}
                  onChange={e => setNewReplaceWeapon(e.target.value)}
                  sx={{ minWidth: 150 }}
                />
                <TextField
                  size="small"
                  placeholder="Add Weapon ID"
                  value={newAddWeaponId}
                  onChange={e => setNewAddWeaponId(e.target.value)}
                  sx={{ minWidth: 150 }}
                />
                {weaponType === 'vehicle' && (
                  <>
                    <TextField
                      size="small"
                      placeholder="Mount (optional)"
                      value={newAddWeaponMount}
                      onChange={e => setNewAddWeaponMount(e.target.value)}
                      sx={{ minWidth: 120 }}
                    />
                    <TextField
                      size="small"
                      type="number"
                      placeholder="Count"
                      value={newAddWeaponCount}
                      onChange={e =>
                        setNewAddWeaponCount(Number(e.target.value) || 1)
                      }
                      inputProps={{ min: 1 }}
                      sx={{ width: 80 }}
                    />
                  </>
                )}
                <Button
                  size="small"
                  onClick={addWeaponReplacement}
                  disabled={!newReplaceWeapon.trim() || !newAddWeaponId.trim()}
                >
                  Add Weapon
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {newOptionWeaponReplacements.map((weapon, idx) => {
                  const addWeaponLabel =
                    typeof weapon.addWeapon === 'string'
                      ? weapon.addWeapon
                      : `${weapon.addWeapon.id}${weapon.addWeapon.mount ? ` (${weapon.addWeapon.mount})` : ''}${weapon.addWeapon.count && weapon.addWeapon.count > 1 ? ` x${weapon.addWeapon.count}` : ''}`;

                  return (
                    <Chip
                      key={idx}
                      label={`${weapon.replaceWeapon} → ${addWeaponLabel}`}
                      onDelete={() => removeWeaponReplacement(idx)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  );
                })}
              </Box>
            </Box>

            {/* Wargear */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Wargear
              </Typography>
              <Button size="small" onClick={addWargearToOption} sx={{ mb: 1 }}>
                Add Wargear
              </Button>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {newOptionWargear.map((wargear, idx) => (
                  <Box
                    key={idx}
                    sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                  >
                    <TextField
                      size="small"
                      placeholder="Wargear ID"
                      value={wargear}
                      onChange={e => updateWargearInOption(idx, e.target.value)}
                      sx={{ flex: 1 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeWargearFromOption(idx)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Special Rules */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Special Rules
              </Typography>
              <Button
                size="small"
                onClick={addSpecialRuleToOption}
                sx={{ mb: 1 }}
              >
                Add Special Rule
              </Button>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {newOptionSpecialRules.map((rule, idx) => (
                  <Box
                    key={idx}
                    sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                  >
                    <TextField
                      size="small"
                      placeholder="Special Rule ID"
                      value={rule}
                      onChange={e =>
                        updateSpecialRuleInOption(idx, e.target.value)
                      }
                      sx={{ flex: 1 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeSpecialRuleFromOption(idx)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>

            <Button
              variant="contained"
              onClick={addUpgradeOption}
              disabled={!newOptionId.trim() || !newOptionName.trim()}
              sx={{ mt: 1 }}
            >
              Add Option
            </Button>
          </Box>

          {/* Existing options */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {upgradeOptions.map((option, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      width: '100%',
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {option.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ({option.points} pts)
                    </Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={e => {
                        e.stopPropagation();
                        removeUpgradeOption(index);
                      }}
                      sx={{ ml: 'auto' }}
                    >
                      Remove
                    </Button>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    <Typography variant="body2">
                      <strong>ID:</strong> {option.id}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Description:</strong> {option.description}
                    </Typography>
                    {option.weaponReplacements &&
                      option.weaponReplacements.length > 0 && (
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            Weapon Replacements:
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 1,
                              ml: 2,
                            }}
                          >
                            {option.weaponReplacements.map((weapon, idx) => {
                              // Handle both simple replaceWeapon/addWeapon and complex weaponReplacements
                              if (weapon.replaceWeapon && weapon.addWeapon) {
                                const addWeaponLabel =
                                  typeof weapon.addWeapon === 'string'
                                    ? weapon.addWeapon
                                    : `${weapon.addWeapon.id}${weapon.addWeapon.mount ? ` (${weapon.addWeapon.mount})` : ''}${weapon.addWeapon.count && weapon.addWeapon.count > 1 ? ` x${weapon.addWeapon.count}` : ''}`;

                                return (
                                  <Chip
                                    key={idx}
                                    label={`${weapon.replaceWeapon} → ${addWeaponLabel}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                );
                              } else {
                                // Handle legacy format (shouldn't happen with new data)
                                return (
                                  <Chip
                                    key={idx}
                                    label={
                                      typeof weapon === 'string'
                                        ? weapon
                                        : JSON.stringify(weapon)
                                    }
                                    size="small"
                                    variant="outlined"
                                  />
                                );
                              }
                            })}
                          </Box>
                        </Box>
                      )}
                    {option.wargear && option.wargear.length > 0 && (
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          Wargear:
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1,
                            ml: 2,
                          }}
                        >
                          {option.wargear.map((wargear, idx) => (
                            <Chip
                              key={idx}
                              label={wargear}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                    {option.specialRules && option.specialRules.length > 0 && (
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          Special Rules:
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1,
                            ml: 2,
                          }}
                        >
                          {option.specialRules.map((rule, idx) => (
                            <Chip
                              key={idx}
                              label={rule}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
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
