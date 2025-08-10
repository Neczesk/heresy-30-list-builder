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
} from '@mui/material';
import { DataLoader } from '../../../utils/dataLoader';

const WEAPON_TYPES = ['ranged', 'melee', 'ranged-profile', 'melee-profile'];

interface WeaponModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: any, editingIndex?: number | null) => void;
  initialEntry?: any;
  editingIndex?: number | null;
  currentEntries?: any[]; // Add this prop to access current session weapons
}

export const WeaponModal: React.FC<WeaponModalProps> = ({
  open,
  onClose,
  onSave,
  initialEntry = {},
  editingIndex = null,
  currentEntries = [],
}) => {
  const [entry, setEntry] = useState<any>({ id: '' });
  const [specialRules, setSpecialRules] = useState<string[]>([]);
  const [specialRuleValues, setSpecialRuleValues] = useState<{
    [key: string]: any;
  }>({});
  const [traits, setTraits] = useState<string[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  // Input states
  const [newSpecialRule, setNewSpecialRule] = useState('');
  const [selectedSpecialRuleForValue, setSelectedSpecialRuleForValue] =
    useState('');
  const [specialRuleValue, setSpecialRuleValue] = useState('');
  const [newTrait, setNewTrait] = useState('');

  const isRanged = entry.type === 'ranged' || entry.type === 'ranged-profile';
  const isMelee = entry.type === 'melee' || entry.type === 'melee-profile';

  // Get available profile weapons (both from JSON and current session)
  const getAvailableProfileWeapons = () => {
    const existingProfiles = DataLoader.getWeaponsByType('ranged-profile');
    const currentProfiles = currentEntries.filter(
      weapon => weapon.type === 'ranged-profile' && weapon.id !== entry.id
    );

    return [...existingProfiles, ...currentProfiles];
  };

  const availableProfiles = getAvailableProfileWeapons();

  useEffect(() => {
    if (open) {
      setEntry(initialEntry || { id: '' });
      setSpecialRules(initialEntry?.specialRules || []);
      setSpecialRuleValues(initialEntry?.specialRuleValues || {});
      setTraits(initialEntry?.traits || []);
      setSelectedProfiles(initialEntry?.profiles || []);
    }
  }, [open, initialEntry]);

  const handleFieldChange = (field: string, value: any) => {
    // Convert numeric fields to numbers
    let processedValue = value;
    if (['firepower', 'rangedStrength', 'damage', 'ap'].includes(field)) {
      processedValue = value === '' ? null : Number(value);
    }
    setEntry((prev: any) => ({ ...prev, [field]: processedValue }));
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

  // Traits
  const addTrait = () => {
    if (newTrait.trim()) {
      setTraits([...traits, newTrait.trim()]);
      setNewTrait('');
    }
  };
  const removeTrait = (trait: string) => {
    setTraits(traits.filter(t => t !== trait));
  };

  // Profiles
  const handleProfileChange = (event: any) => {
    const value = event.target.value;
    setSelectedProfiles(typeof value === 'string' ? value.split(',') : value);
  };

  const removeProfile = (profileId: string) => {
    setSelectedProfiles(selectedProfiles.filter(id => id !== profileId));
  };

  const handleSave = () => {
    onSave(
      {
        ...entry,
        specialRules,
        specialRuleValues,
        traits,
        profiles: selectedProfiles,
      },
      editingIndex
    );
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        {editingIndex !== null ? 'Edit Weapon' : 'Add New Weapon'}
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
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={entry.type || ''}
              onChange={e => handleFieldChange('type', e.target.value)}
              label="Type"
            >
              {WEAPON_TYPES.map(type => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Conditional fields based on weapon type */}
        {isRanged && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 2,
              mb: 3,
            }}
          >
            <TextField
              label="Range"
              value={entry.range || ''}
              onChange={e => handleFieldChange('range', e.target.value)}
              fullWidth
            />
            <TextField
              label="Firepower"
              value={entry.firepower || ''}
              onChange={e => handleFieldChange('firepower', e.target.value)}
              fullWidth
            />
            <TextField
              label="Ranged Strength"
              value={entry.rangedStrength || ''}
              onChange={e =>
                handleFieldChange('rangedStrength', e.target.value)
              }
              fullWidth
            />
          </Box>
        )}

        {isMelee && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 2,
              mb: 3,
            }}
          >
            <TextField
              label="Attack Modifier"
              value={entry.attackModifier || ''}
              onChange={e =>
                handleFieldChange('attackModifier', e.target.value)
              }
              fullWidth
            />
            <TextField
              label="Strength Modifier"
              value={entry.strengthModifier || ''}
              onChange={e =>
                handleFieldChange('strengthModifier', e.target.value)
              }
              fullWidth
            />
            <TextField
              label="Initiative Modifier"
              value={entry.initiativeModifier || ''}
              onChange={e =>
                handleFieldChange('initiativeModifier', e.target.value)
              }
              fullWidth
            />
          </Box>
        )}

        {/* Common fields */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 2,
            mb: 3,
          }}
        >
          <TextField
            label="AP"
            value={entry.ap || ''}
            onChange={e => handleFieldChange('ap', e.target.value)}
            fullWidth
          />
          <TextField
            label="Damage"
            value={entry.damage || ''}
            onChange={e => handleFieldChange('damage', e.target.value)}
            fullWidth
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

        {/* Profiles - only show for non-profile weapons */}
        {(entry.type === 'ranged' || entry.type === 'melee') && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Weapon Profiles
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select ranged-profile weapons that this weapon can use as firing
              modes
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Select Profiles</InputLabel>
              <Select
                multiple
                value={selectedProfiles}
                onChange={handleProfileChange}
                input={<OutlinedInput label="Select Profiles" />}
                renderValue={selected => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map(value => {
                      const profile = availableProfiles.find(
                        p => p.id === value
                      );
                      return (
                        <Chip
                          key={value}
                          label={profile?.name || value}
                          size="small"
                          onDelete={() => removeProfile(value)}
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {availableProfiles.map(profile => (
                  <MenuItem key={profile.id} value={profile.id}>
                    {profile.name} ({profile.id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedProfiles.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Selected Profiles:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedProfiles.map(profileId => {
                    const profile = availableProfiles.find(
                      p => p.id === profileId
                    );
                    return (
                      <Chip
                        key={profileId}
                        label={profile?.name || profileId}
                        onDelete={() => removeProfile(profileId)}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>
        )}

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

        {/* Traits */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Traits</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              size="small"
              placeholder="Enter trait"
              value={newTrait}
              onChange={e => setNewTrait(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addTrait()}
            />
            <Button size="small" onClick={addTrait} disabled={!newTrait.trim()}>
              Add
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {traits.map((trait, idx) => (
              <Chip
                key={idx}
                label={trait}
                onDelete={() => removeTrait(trait)}
                size="small"
                color="info"
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
