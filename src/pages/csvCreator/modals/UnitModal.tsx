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
} from '@mui/material';

const ALLEGIANCE_TYPES = ['Loyalist', 'Traitor', 'Universal'];
const BATTLEFIELD_ROLES = [
  'High Command',
  'Command',
  'Troops',
  'Transport',
  'Heavy Transport',
  'Support',
  'Armour',
  'War Engine',
  'Reconnaissance',
  'Heavy Assault',
  'Fast Attack',
  'Retinue',
  'Warlord',
  'Elite',
  'Lord of War',
];

interface UnitModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: any, editingIndex?: number | null) => void;
  initialEntry?: any;
  editingIndex?: number | null;
}

export const UnitModal: React.FC<UnitModalProps> = ({
  open,
  onClose,
  onSave,
  initialEntry = {},
  editingIndex = null,
}) => {
  const [entry, setEntry] = useState<any>({ id: '' });
  const [specialRules, setSpecialRules] = useState<string[]>([]);
  const [specialRuleValues, setSpecialRuleValues] = useState<{
    [key: string]: any;
  }>({});
  const [traits, setTraits] = useState<string[]>([]);
  const [upgrades, setUpgrades] = useState<string[]>([]);
  const [models, setModels] = useState<{
    [modelId: string]: number;
  }>({});
  const [modelUpgrades, setModelUpgrades] = useState<{
    [modelId: string]: string[];
  }>({});
  // Input states
  const [newSpecialRule, setNewSpecialRule] = useState('');
  const [selectedSpecialRuleForValue, setSelectedSpecialRuleForValue] =
    useState('');
  const [specialRuleValue, setSpecialRuleValue] = useState('');
  const [newTrait, setNewTrait] = useState('');
  const [newUpgrade, setNewUpgrade] = useState('');
  const [newModelId, setNewModelId] = useState('');
  const [newModelCount, setNewModelCount] = useState(1);
  const [newModelUpgradeModelId, setNewModelUpgradeModelId] = useState('');
  const [newModelUpgradeGroupId, setNewModelUpgradeGroupId] = useState('');

  useEffect(() => {
    if (open) {
      setEntry(initialEntry || { id: '' });
      setSpecialRules(initialEntry?.specialRules || []);
      setSpecialRuleValues(initialEntry?.specialRuleValues || {});
      setTraits(initialEntry?.traits || []);
      setUpgrades(initialEntry?.upgrades || []);
      setModels(initialEntry?.models || {});
      setModelUpgrades(initialEntry?.modelUpgrades || {});
    }
  }, [open, initialEntry]);

  const handleFieldChange = (field: string, value: any) => {
    // Convert numeric fields to numbers
    let processedValue = value;
    if (['points'].includes(field)) {
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

  // Upgrades
  const addUpgrade = () => {
    if (newUpgrade.trim()) {
      setUpgrades([...upgrades, newUpgrade.trim()]);
      setNewUpgrade('');
    }
  };
  const removeUpgrade = (upgrade: string) => {
    setUpgrades(upgrades.filter(u => u !== upgrade));
  };

  // Models
  const addModel = () => {
    if (newModelId.trim() && newModelCount > 0) {
      setModels({
        ...models,
        [newModelId.trim()]: newModelCount,
      });
      setNewModelId('');
      setNewModelCount(1);
    }
  };
  const removeModel = (modelId: string) => {
    const newModels = { ...models };
    delete newModels[modelId];
    setModels(newModels);

    // Also remove any model upgrades for this model
    const newModelUpgrades = { ...modelUpgrades };
    delete newModelUpgrades[modelId];
    setModelUpgrades(newModelUpgrades);
  };
  const updateModelCount = (modelId: string, count: number) => {
    if (count > 0) {
      setModels({
        ...models,
        [modelId]: count,
      });
    }
  };

  // Model Upgrades
  const addModelUpgrade = () => {
    if (newModelUpgradeModelId.trim() && newModelUpgradeGroupId.trim()) {
      const current = modelUpgrades[newModelUpgradeModelId] || [];
      setModelUpgrades({
        ...modelUpgrades,
        [newModelUpgradeModelId]: [...current, newModelUpgradeGroupId.trim()],
      });
      setNewModelUpgradeModelId('');
      setNewModelUpgradeGroupId('');
    }
  };
  const removeModelUpgrade = (modelId: string, groupId: string) => {
    const current = modelUpgrades[modelId] || [];
    setModelUpgrades({
      ...modelUpgrades,
      [modelId]: current.filter(g => g !== groupId),
    });
  };

  const handleSave = () => {
    onSave(
      {
        ...entry,
        baseSize: 0, // Always set to 0 as it's handled through upgrades
        specialRules,
        specialRuleValues,
        traits,
        upgrades,
        models,
        modelUpgrades,
      },
      editingIndex
    );
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        {editingIndex !== null ? 'Edit Unit' : 'Add New Unit'}
      </DialogTitle>
      <DialogContent sx={{ overflow: 'auto' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: 3,
            mb: 2,
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
          <TextField
            label="Faction"
            value={entry.faction || ''}
            onChange={e => handleFieldChange('faction', e.target.value)}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Allegiance</InputLabel>
            <Select
              value={entry.allegiance || ''}
              onChange={e => handleFieldChange('allegiance', e.target.value)}
              label="Allegiance"
            >
              {ALLEGIANCE_TYPES.map(type => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Battlefield Role</InputLabel>
            <Select
              value={entry.battlefieldRole || ''}
              onChange={e =>
                handleFieldChange('battlefieldRole', e.target.value)
              }
              label="Battlefield Role"
            >
              {BATTLEFIELD_ROLES.map(role => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Points"
            type="number"
            value={entry.points || ''}
            onChange={e => handleFieldChange('points', e.target.value)}
            fullWidth
            required
            inputProps={{ min: 0 }}
          />
        </Box>
        {/* Models */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Models</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              size="small"
              placeholder="Model ID"
              value={newModelId}
              onChange={e => setNewModelId(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <TextField
              size="small"
              type="number"
              placeholder="Count"
              value={newModelCount}
              onChange={e => setNewModelCount(Number(e.target.value) || 1)}
              inputProps={{ min: 1 }}
              sx={{ width: 100 }}
            />
            <Button
              size="small"
              onClick={addModel}
              disabled={!newModelId.trim() || newModelCount <= 0}
            >
              Add Model
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Object.entries(models).map(([modelId, count]) => (
              <Box
                key={modelId}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    sx={{ flex: 1 }}
                  >
                    {modelId}
                  </Typography>
                  <TextField
                    size="small"
                    type="number"
                    value={count}
                    onChange={e =>
                      updateModelCount(modelId, Number(e.target.value) || 1)
                    }
                    inputProps={{ min: 1 }}
                    sx={{ width: 80 }}
                  />
                  <Button
                    size="small"
                    color="error"
                    onClick={() => removeModel(modelId)}
                  >
                    Remove
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
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
        {/* Upgrades */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Upgrades</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              size="small"
              placeholder="Enter upgrade ID"
              value={newUpgrade}
              onChange={e => setNewUpgrade(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addUpgrade()}
            />
            <Button
              size="small"
              onClick={addUpgrade}
              disabled={!newUpgrade.trim()}
            >
              Add
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {upgrades.map((upgrade, idx) => (
              <Chip
                key={idx}
                label={upgrade}
                onDelete={() => removeUpgrade(upgrade)}
                size="small"
                color="success"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
        {/* Model Upgrades */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Model Upgrades</Typography>
          {Object.keys(models).length > 0 ? (
            <>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Select Model</InputLabel>
                  <Select
                    value={newModelUpgradeModelId}
                    onChange={e => setNewModelUpgradeModelId(e.target.value)}
                    label="Select Model"
                  >
                    <MenuItem value="">Choose a model</MenuItem>
                    {Object.keys(models).map(modelId => (
                      <MenuItem key={modelId} value={modelId}>
                        {modelId}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  placeholder="Upgrade Group ID"
                  value={newModelUpgradeGroupId}
                  onChange={e => setNewModelUpgradeGroupId(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addModelUpgrade()}
                />
                <Button
                  size="small"
                  onClick={addModelUpgrade}
                  disabled={
                    !newModelUpgradeModelId.trim() ||
                    !newModelUpgradeGroupId.trim()
                  }
                >
                  Add Upgrade
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Object.entries(modelUpgrades).map(
                  ([modelId, upgradeGroups]) => (
                    <Box
                      key={modelId}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{ mb: 1 }}
                      >
                        {modelId}:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {upgradeGroups.map((groupId, idx) => (
                          <Chip
                            key={idx}
                            label={groupId}
                            onDelete={() =>
                              removeModelUpgrade(modelId, groupId)
                            }
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )
                )}
              </Box>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Add models to the unit first to configure their upgrades.
            </Typography>
          )}
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
