import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { DataLoader } from '../../utils/dataLoader';
import type { Unit, Model, Weapon, SpecialRule } from '../../types/army';

interface UnitWithModels extends Unit {
  modelsWithData: Array<{
    model: Model;
    count: number;
  }>;
}

interface UnitDetailModalProps {
  unit: UnitWithModels | null;
  isOpen: boolean;
  onClose: () => void;
}

const UnitDetailModal: React.FC<UnitDetailModalProps> = ({
  unit,
  isOpen,
  onClose,
}) => {
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [expandedWargear, setExpandedWargear] = useState<Set<string>>(
    new Set()
  );
  const [expandedWeaponRules, setExpandedWeaponRules] = useState<Set<string>>(
    new Set()
  );

  // Get all weapons for the unit (including optional ones from upgrades)
  const allWeapons = useMemo(() => {
    if (!unit) return [];

    const weaponMap = new Map<string, {
      weapon: Weapon;
      sources: string[];
      isOptional: boolean;
      mount?: string;
    }>();

    // Helper function to add weapon to map
    const addWeaponToMap = (weapon: Weapon, source: string, isOptional: boolean, mount?: string) => {
      const key = mount ? `${weapon.name} (${mount})` : weapon.name;
      const existing = weaponMap.get(key);

      if (existing) {
        // Add source to existing weapon
        if (!existing.sources.includes(source)) {
          existing.sources.push(source);
        }
        // If any source is optional, mark as optional
        if (isOptional) {
          existing.isOptional = true;
        }
      } else {
        // Create new weapon entry
        weaponMap.set(key, {
          weapon,
          sources: [source],
          isOptional,
          mount,
        });
      }
    };

    // Base weapons from models
    unit.modelsWithData.forEach(({ model, count }) => {
      model.weapons.forEach(weaponEntry => {
        const weaponId = typeof weaponEntry === 'string' ? weaponEntry : weaponEntry.id;
        const mount = typeof weaponEntry === 'string' ? undefined : weaponEntry.mount;
        const weapon = DataLoader.getWeaponById(weaponId);
        if (weapon) {
          addWeaponToMap(weapon, `${count}x ${model.name}`, false, mount);
        }
      });
    });

    // Optional weapons from upgrades
    const allUpgrades = DataLoader.getUpgrades();
    unit.modelsWithData.forEach(({ model }) => {
      // Find upgrades that target this model type
      allUpgrades.forEach(upgrade => {
        if (upgrade.targetModelType === model.id || upgrade.targetModel === model.id) {
          upgrade.options?.forEach(option => {
            if (option.addWeapon) {
              const weaponId = typeof option.addWeapon === 'string' ? option.addWeapon : option.addWeapon.id;
              const mount = typeof option.addWeapon === 'string' ? undefined : option.addWeapon.mount;
              const weapon = DataLoader.getWeaponById(weaponId);
              if (weapon) {
                addWeaponToMap(weapon, `Upgrade: ${upgrade.name} - ${option.name}`, true, mount);
              }
            }
            // Also check weaponReplacements
            if (option.weaponReplacements) {
              option.weaponReplacements.forEach(replacement => {
                const weaponId = typeof replacement.addWeapon === 'string' ? replacement.addWeapon : replacement.addWeapon.id;
                const mount = typeof replacement.addWeapon === 'string' ? undefined : replacement.addWeapon.mount;
                const weapon = DataLoader.getWeaponById(weaponId);
                if (weapon) {
                  addWeaponToMap(weapon, `Upgrade: ${upgrade.name} - ${option.name}`, true, mount);
                }
              });
            }
          });
        }
      });
    });

    // Convert map to array
    return Array.from(weaponMap.values()).map(({ weapon, sources, isOptional, mount }) => ({
      weapon,
      source: sources.join(', '),
      isOptional,
      mount,
    }));
  }, [unit]);

  // Get all special rules
  const allSpecialRules = useMemo(() => {
    if (!unit) return [];

    const rules: Array<{ rule: SpecialRule; source: string }> = [];

    // Unit-level special rules
    unit.specialRules.forEach(ruleId => {
      const rule = DataLoader.getSpecialRuleById(ruleId);
      if (rule && rule.type === 'special-rule') {
        rules.push({ rule, source: 'Unit' });
      }
    });

    // Model-level special rules
    unit.modelsWithData.forEach(({ model, count }) => {
      model.specialRules.forEach(ruleId => {
        const rule = DataLoader.getSpecialRuleById(ruleId);
        if (rule && rule.type === 'special-rule') {
          rules.push({ rule, source: `${count}x ${model.name}` });
        }
      });
    });

    return rules;
  }, [unit]);

  // Get all wargear
  const allWargear = useMemo(() => {
    if (!unit) return [];

    const wargear: Array<{ rule: SpecialRule; source: string }> = [];

    // Unit-level wargear
    unit.specialRules.forEach(ruleId => {
      const rule = DataLoader.getSpecialRuleById(ruleId);
      if (rule && rule.type === 'wargear') {
        wargear.push({ rule, source: 'Unit' });
      }
    });

    // Model-level wargear
    unit.modelsWithData.forEach(({ model, count }) => {
      model.specialRules.forEach(ruleId => {
        const rule = DataLoader.getSpecialRuleById(ruleId);
        if (rule && rule.type === 'wargear') {
          wargear.push({ rule, source: `${count}x ${model.name}` });
        }
      });
    });

    return wargear;
  }, [unit]);

    // Get all weapon special rules
  const allWeaponSpecialRules = useMemo(() => {
    if (!unit) return [];

    const ruleSet = new Set<string>();

    // Collect unique rule IDs from all weapons
    allWeapons.forEach(weaponData => {
      const { weapon } = weaponData;

      // Weapon-level special rules
      if (weapon.specialRules && weapon.specialRules.length > 0) {
        weapon.specialRules.forEach(ruleId => {
          ruleSet.add(ruleId);
        });
      }

      // Profile-level special rules (for ranged weapons with profiles)
      if (DataLoader.isRangedWeapon(weapon) && weapon.profiles) {
        weapon.profiles.forEach(profile => {
          if (profile.specialRules && profile.specialRules.length > 0) {
            profile.specialRules.forEach(ruleId => {
              ruleSet.add(ruleId);
            });
          }
        });
      }
    });

    // Convert set to array of rules
    return Array.from(ruleSet).map(ruleId => {
      const rule = DataLoader.getSpecialRuleById(ruleId);
      return rule;
    }).filter(Boolean) as SpecialRule[];
  }, [allWeapons]);

  if (!unit) return null;

  const toggleRuleExpansion = (ruleId: string) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRules(newExpanded);
  };

  const toggleWargearExpansion = (ruleId: string) => {
    const newExpanded = new Set(expandedWargear);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedWargear(newExpanded);
  };

  const toggleWeaponRuleExpansion = (ruleId: string) => {
    const newExpanded = new Set(expandedWeaponRules);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedWeaponRules(newExpanded);
  };

  const renderModelCharacteristics = (model: Model) => {
    if (DataLoader.isVehicleModel(model)) {
      const chars = model.characteristics as any;
      return (
        <TableRow key={model.id}>
          <TableCell>{model.name}</TableCell>
          <TableCell>{chars.movement}"</TableCell>
          <TableCell>{chars.ballisticSkill}+</TableCell>
          <TableCell>{chars.frontArmour}+</TableCell>
          <TableCell>{chars.sideArmour}+</TableCell>
          <TableCell>{chars.rearArmour}+</TableCell>
          <TableCell>{chars.hullPoints}</TableCell>
          <TableCell>{chars.transportCapacity || '-'}</TableCell>
          <TableCell>-</TableCell>
          <TableCell>
            {model.specialRules && model.specialRules.length > 0
              ? model.specialRules
                  .map(ruleId => {
                    const rule = DataLoader.getSpecialRuleById(ruleId);
                    return rule?.name || ruleId;
                  })
                  .join(', ')
              : '-'}
          </TableCell>
        </TableRow>
      );
    } else {
      const chars = model.characteristics as any;
      return (
        <TableRow key={model.id}>
          <TableCell>{model.name}</TableCell>
          <TableCell>{chars.movement}"</TableCell>
          <TableCell>{chars.weaponSkill}+</TableCell>
          <TableCell>{chars.ballisticSkill}+</TableCell>
          <TableCell>{chars.strength}</TableCell>
          <TableCell>{chars.toughness}</TableCell>
          <TableCell>{chars.wounds}</TableCell>
          <TableCell>{chars.initiative}</TableCell>
          <TableCell>{chars.attacks}</TableCell>
          <TableCell>{chars.leadership}</TableCell>
          <TableCell>{chars.armourSave}+</TableCell>
          <TableCell>{chars.invulnerableSave ? `${chars.invulnerableSave}+` : '-'}</TableCell>
          <TableCell>
            {model.specialRules && model.specialRules.length > 0
              ? model.specialRules
                  .map(ruleId => {
                    const rule = DataLoader.getSpecialRuleById(ruleId);
                    return rule?.name || ruleId;
                  })
                  .join(', ')
              : '-'}
          </TableCell>
        </TableRow>
      );
    }
  };

  const renderRangedWeaponRow = (weaponData: {
    weapon: Weapon;
    source: string;
    isOptional: boolean;
    mount?: string;
  }) => {
    const { weapon, source, isOptional, mount } = weaponData;

    if (DataLoader.isRangedWeapon(weapon)) {
      if (weapon.profiles && weapon.profiles.length > 0) {
        const rows = [];

        // Add header row for the weapon name
        rows.push(
          <TableRow
            key={`${weapon.id}-header`}
            sx={{ backgroundColor: 'action.hover' }}
          >
            <TableCell colSpan={8}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {weapon.name}{mount && ` (${mount})`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {source} {isOptional && '(Optional)'}
                </Typography>
              </Box>
            </TableCell>
          </TableRow>
        );

        // Add rows for each profile
        weapon.profiles.forEach((profile, index) => {
          rows.push(
            <TableRow key={`${weapon.id}-${index}`}>
              <TableCell sx={{ pl: 4 }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {profile.name}
                </Typography>
              </TableCell>
              <TableCell>{profile.range}"</TableCell>
              <TableCell>{profile.firepower}</TableCell>
              <TableCell>{profile.rangedStrength}</TableCell>
              <TableCell>{profile.ap}</TableCell>
              <TableCell>{profile.damage}</TableCell>
              <TableCell>
                {profile.specialRules && profile.specialRules.length > 0
                  ? profile.specialRules
                      .map(ruleId => {
                        const rule = DataLoader.getSpecialRuleById(ruleId);
                        return rule?.name || ruleId;
                      })
                      .join(', ')
                  : '-'}
              </TableCell>
              <TableCell>{profile.traits?.join(', ') || '-'}</TableCell>
            </TableRow>
          );
        });

        return rows;
      } else {
        // Single profile weapon (backward compatibility)
        return (
          <TableRow key={weapon.id}>
            <TableCell>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {weapon.name}{mount && ` (${mount})`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {source} {isOptional && '(Optional)'}
                </Typography>
              </Box>
            </TableCell>
            <TableCell>{weapon.range}"</TableCell>
            <TableCell>{weapon.firepower}</TableCell>
            <TableCell>{weapon.rangedStrength}</TableCell>
            <TableCell>{weapon.ap}</TableCell>
            <TableCell>{weapon.damage}</TableCell>
            <TableCell>
              {weapon.specialRules && weapon.specialRules.length > 0
                ? weapon.specialRules
                    .map(ruleId => {
                      const rule = DataLoader.getSpecialRuleById(ruleId);
                      return rule?.name || ruleId;
                    })
                    .join(', ')
                : '-'}
            </TableCell>
            <TableCell>{weapon.traits?.join(', ') || '-'}</TableCell>
          </TableRow>
        );
      }
    }
    return null;
  };

  const renderMeleeWeaponRow = (weaponData: {
    weapon: Weapon;
    source: string;
    isOptional: boolean;
    mount?: string;
  }) => {
    const { weapon, source, isOptional, mount } = weaponData;

    if (DataLoader.isMeleeWeapon(weapon)) {
              return (
          <TableRow key={weapon.id}>
            <TableCell>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {weapon.name}{mount && ` (${mount})`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {source} {isOptional && '(Optional)'}
                </Typography>
              </Box>
            </TableCell>
            <TableCell>
              {weapon.initiativeModifier === 'I'
                ? 'I'
                : `${typeof weapon.initiativeModifier === 'number' && weapon.initiativeModifier > 0 ? '+' : ''}${weapon.initiativeModifier}`}
            </TableCell>
            <TableCell>
              {weapon.attackModifier === 'A'
                ? 'A'
                : `${typeof weapon.attackModifier === 'number' && weapon.attackModifier > 0 ? '+' : ''}${weapon.attackModifier}`}
            </TableCell>
            <TableCell>
              {weapon.strengthModifier === 'S'
                ? 'S'
                : `${typeof weapon.strengthModifier === 'number' && weapon.strengthModifier > 0 ? '+' : ''}${weapon.strengthModifier}`}
            </TableCell>
            <TableCell>{weapon.ap}</TableCell>
            <TableCell>{weapon.damage}</TableCell>
            <TableCell>
              {weapon.specialRules && weapon.specialRules.length > 0
                ? weapon.specialRules
                    .map(ruleId => {
                      const rule = DataLoader.getSpecialRuleById(ruleId);
                      return rule?.name || ruleId;
                    })
                    .join(', ')
                : '-'}
            </TableCell>
            <TableCell>{weapon.traits?.join(', ') || '-'}</TableCell>
          </TableRow>
        );
    }
    return null;
  };

  const hasVehicleModels = unit.modelsWithData.some(({ model }) =>
    DataLoader.isVehicleModel(model)
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="h2">
          {unit.name}
        </Typography>
        <Chip
          label={unit.battlefieldRole}
          color="primary"
          variant="outlined"
          sx={{ mt: 1 }}
        />
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" color="text.secondary" paragraph>
            {unit.description}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Unit Details
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip label={`Size: ${unit.minSize}-${unit.maxSize} models`} />
            <Chip label={`Points: ${unit.points} pts`} color="primary" />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Model Characteristics Table */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Model Characteristics
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Model</TableCell>
                  {hasVehicleModels ? (
                    <>
                      <TableCell sx={{ fontWeight: 'bold' }}>M</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>BS</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>FA</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>SA</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>RA</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>HP</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>TC</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Inv</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Special Rules</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell sx={{ fontWeight: 'bold' }}>M</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>WS</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>BS</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>S</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>T</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>W</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>I</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>A</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Ld</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Sv</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Inv</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Special Rules</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {unit.modelsWithData.map(({ model, count }) =>
                  Array.from({ length: count }, () =>
                    renderModelCharacteristics(model)
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Ranged Weapons Table */}
        {allWeapons.some(w => DataLoader.isRangedWeapon(w.weapon)) && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Ranged Weapons
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Weapon</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Range</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Firepower</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Strength</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>AP</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Damage</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      Special Rules
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Traits</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allWeapons
                    .filter(w => DataLoader.isRangedWeapon(w.weapon))
                    .flatMap(renderRangedWeaponRow)}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Melee Weapons Table */}
        {allWeapons.some(w => DataLoader.isMeleeWeapon(w.weapon)) && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Melee Weapons
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Weapon</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      Initiative Mod
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      Attack Mod
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      Strength Mod
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>AP</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Damage</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      Special Rules
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Traits</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allWeapons
                    .filter(w => DataLoader.isMeleeWeapon(w.weapon))
                    .map(renderMeleeWeaponRow)}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Weapon Special Rules */}
        {allWeaponSpecialRules.length > 0 && (
          <Accordion defaultExpanded={false}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                Weapon Special Rules ({allWeaponSpecialRules.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                {allWeaponSpecialRules.map(rule => (
                  <Accordion key={rule.id} expanded={expandedWeaponRules.has(rule.id)}>
                    <AccordionSummary
                      expandIcon={
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            toggleWeaponRuleExpansion(rule.id);
                          }}
                        >
                          {expandedWeaponRules.has(rule.id) ? (
                            <ExpandLess />
                          ) : (
                            <ExpandMore />
                          )}
                        </IconButton>
                      }
                    >
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        {rule.description}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', mb: 1 }}
                        >
                          {rule.shortText}
                        </Typography>
                        <Typography variant="body2">{rule.longText}</Typography>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Special Rules */}
        {allSpecialRules.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Special Rules
            </Typography>
            {allSpecialRules.map(({ rule, source }) => (
              <Accordion key={rule.id} expanded={expandedRules.has(rule.id)}>
                <AccordionSummary
                  expandIcon={
                    <IconButton
                      size="small"
                      onClick={e => {
                        e.stopPropagation();
                        toggleRuleExpansion(rule.id);
                      }}
                    >
                      {expandedRules.has(rule.id) ? (
                        <ExpandLess />
                      ) : (
                        <ExpandMore />
                      )}
                    </IconButton>
                  }
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      {rule.description}
                    </Typography>
                    <Chip label={source} size="small" variant="outlined" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 'bold', mb: 1 }}
                    >
                      {rule.shortText}
                    </Typography>
                    <Typography variant="body2">{rule.longText}</Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Wargear */}
        {allWargear.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Wargear
            </Typography>
            {allWargear.map(({ rule, source }) => (
              <Accordion key={rule.id} expanded={expandedWargear.has(rule.id)}>
                <AccordionSummary
                  expandIcon={
                    <IconButton
                      size="small"
                      onClick={e => {
                        e.stopPropagation();
                        toggleWargearExpansion(rule.id);
                      }}
                    >
                      {expandedWargear.has(rule.id) ? (
                        <ExpandLess />
                      ) : (
                        <ExpandMore />
                      )}
                    </IconButton>
                  }
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      {rule.description}
                    </Typography>
                    <Chip label={source} size="small" variant="outlined" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 'bold', mb: 1 }}
                    >
                      {rule.shortText}
                    </Typography>
                    <Typography variant="body2">{rule.longText}</Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnitDetailModal;
