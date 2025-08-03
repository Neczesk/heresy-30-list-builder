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
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { DataLoader } from '../../utils/dataLoader';
import type {
  Unit,
  Model,
  Weapon,
  SpecialRule,
  RangedWeapon,
} from '../../types/army';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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

    const weaponMap = new Map<
      string,
      {
        weapon: Weapon;
        sources: string[];
        isOptional: boolean;
        mount?: string;
      }
    >();

    // Helper function to add weapon to map
    const addWeaponToMap = (
      weapon: Weapon,
      source: string,
      isOptional: boolean,
      mount?: string
    ) => {
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
        const weaponId =
          typeof weaponEntry === 'string' ? weaponEntry : weaponEntry.id;
        const mount =
          typeof weaponEntry === 'string' ? undefined : weaponEntry.mount;
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
        if (
          upgrade.targetModelType === model.id ||
          upgrade.targetModel === model.id
        ) {
          upgrade.options?.forEach(option => {
            if (option.addWeapon) {
              const weaponId =
                typeof option.addWeapon === 'string'
                  ? option.addWeapon
                  : option.addWeapon.id;
              const mount =
                typeof option.addWeapon === 'string'
                  ? undefined
                  : option.addWeapon.mount;
              const weapon = DataLoader.getWeaponById(weaponId);
              if (weapon) {
                addWeaponToMap(
                  weapon,
                  `Upgrade: ${upgrade.name} - ${option.name}`,
                  true,
                  mount
                );
              }
            }
            // Also check weaponReplacements
            if (option.weaponReplacements) {
              option.weaponReplacements.forEach(replacement => {
                const weaponId =
                  typeof replacement.addWeapon === 'string'
                    ? replacement.addWeapon
                    : replacement.addWeapon.id;
                const mount =
                  typeof replacement.addWeapon === 'string'
                    ? undefined
                    : replacement.addWeapon.mount;
                const weapon = DataLoader.getWeaponById(weaponId);
                if (weapon) {
                  addWeaponToMap(
                    weapon,
                    `Upgrade: ${upgrade.name} - ${option.name}`,
                    true,
                    mount
                  );
                }
              });
            }
          });
        }
      });
    });

    // Convert map to array
    return Array.from(weaponMap.values()).map(
      ({ weapon, sources, isOptional, mount }) => ({
        weapon,
        source: sources.join(', '),
        isOptional,
        mount,
      })
    );
  }, [unit]);

  // Get all special rules
  const allSpecialRules = useMemo(() => {
    if (!unit) return [];

    const rules: Array<{ rule: SpecialRule }> = [];

    // Unit-level special rules
    unit.specialRules.forEach(ruleId => {
      const rule = DataLoader.getSpecialRuleById(ruleId);
      if (rule && rule.type === 'special-rule') {
        rules.push({ rule });
      }
    });

    // Model-level special rules
    unit.modelsWithData.forEach(({ model }) => {
      model.specialRules.forEach(ruleId => {
        const rule = DataLoader.getSpecialRuleById(ruleId);
        if (rule && rule.type === 'special-rule') {
          rules.push({ rule });
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

    const rules: Array<{ rule: SpecialRule }> = [];

    // Collect weapon special rules
    allWeapons.forEach(weaponData => {
      const { weapon } = weaponData;

      // Weapon-level special rules
      if (weapon.specialRules && weapon.specialRules.length > 0) {
        weapon.specialRules.forEach(ruleId => {
          const rule = DataLoader.getSpecialRuleById(ruleId);
          if (rule && rule.type === 'special-rule') {
            rules.push({ rule });
          }
        });
      }

      // Profile-level special rules (for ranged weapons with profiles)
      if (DataLoader.isRangedWeapon(weapon) && weapon.profiles) {
        const profileWeapons = DataLoader.getProfileWeapons(weapon);
        profileWeapons.forEach(profileWeapon => {
          if (
            profileWeapon.specialRules &&
            profileWeapon.specialRules.length > 0
          ) {
            profileWeapon.specialRules.forEach(ruleId => {
              const rule = DataLoader.getSpecialRuleById(ruleId);
              if (rule && rule.type === 'special-rule') {
                rules.push({ rule });
              }
            });
          }
        });
      }
    });

    return rules;
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

  // Helper function to format special rules with names and values
  const formatSpecialRules = (
    ruleIds: string[],
    specialRuleValues?: { [key: string]: any }
  ): string => {
    if (!ruleIds || ruleIds.length === 0) return '-';

    return ruleIds
      .map(ruleId => {
        const rule = DataLoader.getSpecialRuleById(ruleId);
        const ruleName = rule?.name || ruleId;

        // Check if there's a value for this rule
        if (specialRuleValues && specialRuleValues[ruleId] !== undefined) {
          return `${ruleName} (${specialRuleValues[ruleId]})`;
        }

        return ruleName;
      })
      .join(', ');
  };

  const renderModelCharacteristics = (model: Model) => {
    const cellStyle = {
      p: { xs: 0.5, sm: 1 },
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
    };

    if (DataLoader.isVehicleModel(model)) {
      const chars = model.characteristics as any;
      return (
        <TableRow key={model.id}>
          <TableCell sx={cellStyle}>{model.name}</TableCell>
          <TableCell sx={cellStyle}>{chars.movement}"</TableCell>
          <TableCell sx={cellStyle}>{chars.ballisticSkill}+</TableCell>
          <TableCell sx={cellStyle}>{chars.frontArmour}+</TableCell>
          <TableCell sx={cellStyle}>{chars.sideArmour}+</TableCell>
          <TableCell sx={cellStyle}>{chars.rearArmour}+</TableCell>
          <TableCell sx={cellStyle}>{chars.hullPoints}</TableCell>
          <TableCell sx={cellStyle}>{chars.transportCapacity || '-'}</TableCell>
          <TableCell sx={cellStyle}>-</TableCell>
          <TableCell sx={cellStyle}>
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
          <TableCell sx={cellStyle}>{model.name}</TableCell>
          <TableCell sx={cellStyle}>{chars.movement}"</TableCell>
          <TableCell sx={cellStyle}>{chars.weaponSkill}+</TableCell>
          <TableCell sx={cellStyle}>{chars.ballisticSkill}+</TableCell>
          <TableCell sx={cellStyle}>{chars.strength}</TableCell>
          <TableCell sx={cellStyle}>{chars.toughness}</TableCell>
          <TableCell sx={cellStyle}>{chars.wounds}</TableCell>
          <TableCell sx={cellStyle}>{chars.initiative}</TableCell>
          <TableCell sx={cellStyle}>{chars.attacks}</TableCell>
          <TableCell sx={cellStyle}>{chars.leadership}</TableCell>
          <TableCell sx={cellStyle}>{chars.armourSave}+</TableCell>
          <TableCell sx={cellStyle}>
            {chars.invulnerableSave ? `${chars.invulnerableSave}+` : '-'}
          </TableCell>
          <TableCell sx={cellStyle}>
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
    const cellStyle = {
      p: { xs: 0.5, sm: 1 },
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
    };

    if (DataLoader.isRangedWeapon(weapon)) {
      if (weapon.profiles && weapon.profiles.length > 0) {
        const rows = [];

        // Add header row for the weapon name
        rows.push(
          <TableRow
            key={`${weapon.id}-header`}
            sx={{ backgroundColor: 'action.hover' }}
          >
            <TableCell colSpan={8} sx={cellStyle}>
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  {weapon.name}
                  {mount && ` (${mount})`}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.75rem' },
                  }}
                >
                  {source} {isOptional && '(Optional)'}
                </Typography>
              </Box>
            </TableCell>
          </TableRow>
        );

        // Add rows for each profile
        const profileWeapons = DataLoader.getProfileWeapons(weapon);
        profileWeapons.forEach((profileWeapon, index) => {
          if (DataLoader.isRangedWeapon(profileWeapon)) {
            const rangedProfile = profileWeapon as RangedWeapon;
            rows.push(
              <TableRow key={`${weapon.id}-${index}`}>
                <TableCell sx={{ ...cellStyle, pl: { xs: 2, sm: 4 } }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontStyle: 'italic',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    }}
                  >
                    {rangedProfile.name}
                  </Typography>
                </TableCell>
                <TableCell sx={cellStyle}>{rangedProfile.range}"</TableCell>
                <TableCell sx={cellStyle}>{rangedProfile.firepower}</TableCell>
                <TableCell sx={cellStyle}>
                  {rangedProfile.rangedStrength}
                </TableCell>
                <TableCell sx={cellStyle}>{rangedProfile.ap}</TableCell>
                <TableCell sx={cellStyle}>{rangedProfile.damage}</TableCell>
                <TableCell sx={cellStyle}>
                  {formatSpecialRules(
                    rangedProfile.specialRules || [],
                    rangedProfile.specialRuleValues
                  )}
                </TableCell>
                <TableCell sx={cellStyle}>
                  {rangedProfile.traits?.join(', ') || '-'}
                </TableCell>
              </TableRow>
            );
          }
        });

        return rows;
      } else {
        // Single profile weapon (backward compatibility)
        return (
          <TableRow key={weapon.id}>
            <TableCell sx={cellStyle}>
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  {weapon.name}
                  {mount && ` (${mount})`}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.75rem' },
                  }}
                >
                  {source} {isOptional && '(Optional)'}
                </Typography>
              </Box>
            </TableCell>
            <TableCell sx={cellStyle}>{weapon.range}"</TableCell>
            <TableCell sx={cellStyle}>{weapon.firepower}</TableCell>
            <TableCell sx={cellStyle}>{weapon.rangedStrength}</TableCell>
            <TableCell sx={cellStyle}>{weapon.ap}</TableCell>
            <TableCell sx={cellStyle}>{weapon.damage}</TableCell>
            <TableCell sx={cellStyle}>
              {formatSpecialRules(
                weapon.specialRules || [],
                weapon.specialRuleValues
              )}
            </TableCell>
            <TableCell sx={cellStyle}>
              {weapon.traits?.join(', ') || '-'}
            </TableCell>
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
    const cellStyle = {
      p: { xs: 0.5, sm: 1 },
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
    };

    if (DataLoader.isMeleeWeapon(weapon)) {
      return (
        <TableRow key={weapon.id}>
          <TableCell sx={cellStyle}>
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 'bold',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                {weapon.name}
                {mount && ` (${mount})`}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.75rem', sm: '0.75rem' },
                }}
              >
                {source} {isOptional && '(Optional)'}
              </Typography>
            </Box>
          </TableCell>
          <TableCell sx={cellStyle}>
            {weapon.initiativeModifier === 'I'
              ? 'I'
              : `${typeof weapon.initiativeModifier === 'number' && weapon.initiativeModifier > 0 ? '+' : ''}${weapon.initiativeModifier}`}
          </TableCell>
          <TableCell sx={cellStyle}>
            {weapon.attackModifier === 'A'
              ? 'A'
              : `${typeof weapon.attackModifier === 'number' && weapon.attackModifier > 0 ? '+' : ''}${weapon.attackModifier}`}
          </TableCell>
          <TableCell sx={cellStyle}>
            {weapon.strengthModifier === 'S'
              ? 'S'
              : `${typeof weapon.strengthModifier === 'number' && weapon.strengthModifier > 0 ? '+' : ''}${weapon.strengthModifier}`}
          </TableCell>
          <TableCell sx={cellStyle}>{weapon.ap}</TableCell>
          <TableCell sx={cellStyle}>{weapon.damage}</TableCell>
          <TableCell sx={cellStyle}>
            {formatSpecialRules(
              weapon.specialRules || [],
              weapon.specialRuleValues
            )}
          </TableCell>
          <TableCell sx={cellStyle}>
            {weapon.traits?.join(', ') || '-'}
          </TableCell>
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
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          maxHeight: isMobile ? '100vh' : '90vh',
          height: isMobile ? '100vh' : 'auto',
        },
      }}
    >
      <DialogTitle
        sx={{
          p: { xs: 2, sm: 3 },
          pb: { xs: 1, sm: 2 },
        }}
      >
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
          }}
        >
          {unit.name}
        </Typography>
        <Chip
          label={unit.battlefieldRole}
          color="primary"
          variant="outlined"
          size={isMobile ? 'small' : 'small'}
          sx={{
            mt: { xs: 0.5, sm: 1 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
          }}
        />
      </DialogTitle>

      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
        }}
      >
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography
            variant="body1"
            color="text.secondary"
            paragraph
            sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' },
            }}
          >
            {unit.description}
          </Typography>
        </Box>

        <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />

        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontSize: { xs: '1.125rem', sm: '1.25rem' },
            }}
          >
            Unit Details
          </Typography>
          <Box
            sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}
          >
            <Chip
              label={`Size: ${unit.minSize}-${unit.maxSize} models`}
              size={isMobile ? 'small' : 'small'}
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
            />
            <Chip
              label={`Points: ${unit.points} pts`}
              color="primary"
              size={isMobile ? 'small' : 'small'}
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />

        {/* Model Characteristics Table */}
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontSize: { xs: '1.125rem', sm: '1.25rem' },
            }}
          >
            Model Characteristics
          </Typography>
          <TableContainer component={Paper}>
            <Table size={isMobile ? 'small' : 'small'}>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      p: { xs: 0.5, sm: 1 },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    }}
                  >
                    Model
                  </TableCell>
                  {hasVehicleModels ? (
                    <>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        M
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        BS
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        FA
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        SA
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        RA
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        HP
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        TC
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        Inv
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        Special Rules
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        M
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        WS
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        BS
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        S
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        T
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        W
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        I
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        A
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        Ld
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        Sv
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        Inv
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        Special Rules
                      </TableCell>
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
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontSize: { xs: '1.125rem', sm: '1.25rem' },
              }}
            >
              Ranged Weapons
            </Typography>
            <TableContainer component={Paper}>
              <Table size={isMobile ? 'small' : 'small'}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      Weapon
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      Range
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      Firepower
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      Strength
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      AP
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      Damage
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      Special Rules
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      Traits
                    </TableCell>
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
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontSize: { xs: '1.125rem', sm: '1.25rem' },
              }}
            >
              Melee Weapons
            </Typography>
            <TableContainer component={Paper}>
              <Table size={isMobile ? 'small' : 'small'}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      Weapon
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      Initiative Mod
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      Attack Mod
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      Strength Mod
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      AP
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      Damage
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      Special Rules
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      Traits
                    </TableCell>
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

        <Divider sx={{ my: { xs: 2, sm: 3 } }} />

        {/* Weapon Special Rules */}
        {allWeaponSpecialRules.length > 0 && (
          <Accordion defaultExpanded={false}>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                p: { xs: 1, sm: 2 },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: '1.125rem', sm: '1.25rem' },
                }}
              >
                Weapon Special Rules ({allWeaponSpecialRules.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                p: { xs: 1, sm: 2 },
              }}
            >
              <Box>
                {allWeaponSpecialRules.map(({ rule }) => (
                  <Accordion
                    key={rule.id}
                    expanded={expandedWeaponRules.has(rule.id)}
                  >
                    <AccordionSummary
                      expandIcon={
                        <IconButton
                          size={isMobile ? 'medium' : 'small'}
                          onClick={e => {
                            e.stopPropagation();
                            toggleWeaponRuleExpansion(rule.id);
                          }}
                          sx={{
                            p: { xs: 0.5, sm: 0.25 },
                          }}
                        >
                          {expandedWeaponRules.has(rule.id) ? (
                            <ExpandLess />
                          ) : (
                            <ExpandMore />
                          )}
                        </IconButton>
                      }
                      sx={{
                        p: { xs: 1, sm: 2 },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontStyle: 'italic',
                          fontSize: { xs: '0.875rem', sm: '0.875rem' },
                        }}
                      >
                        {rule.description}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails
                      sx={{
                        p: { xs: 1, sm: 2 },
                      }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 'bold',
                            mb: { xs: 0.5, sm: 1 },
                            fontSize: { xs: '0.875rem', sm: '0.875rem' },
                          }}
                        >
                          {rule.shortText}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: '0.875rem', sm: '0.875rem' },
                          }}
                        >
                          {rule.longText}
                        </Typography>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        <Divider sx={{ my: { xs: 2, sm: 3 } }} />

        {/* Special Rules */}
        {allSpecialRules.length > 0 && (
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontSize: { xs: '1.125rem', sm: '1.25rem' },
              }}
            >
              Special Rules
            </Typography>
            {allSpecialRules.map(({ rule }) => (
              <Accordion key={rule.id} expanded={expandedRules.has(rule.id)}>
                <AccordionSummary
                  expandIcon={
                    <IconButton
                      size={isMobile ? 'medium' : 'small'}
                      onClick={e => {
                        e.stopPropagation();
                        toggleRuleExpansion(rule.id);
                      }}
                      sx={{
                        p: { xs: 0.5, sm: 0.25 },
                      }}
                    >
                      {expandedRules.has(rule.id) ? (
                        <ExpandLess />
                      ) : (
                        <ExpandMore />
                      )}
                    </IconButton>
                  }
                  sx={{
                    p: { xs: 1, sm: 2 },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontStyle: 'italic',
                      fontSize: { xs: '0.875rem', sm: '0.875rem' },
                    }}
                  >
                    {rule.description}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    p: { xs: 1, sm: 2 },
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 'bold',
                        mb: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.875rem', sm: '0.875rem' },
                      }}
                    >
                      {rule.shortText}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: '0.875rem', sm: '0.875rem' },
                      }}
                    >
                      {rule.longText}
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        <Divider sx={{ my: { xs: 2, sm: 3 } }} />

        {/* Wargear */}
        {allWargear.length > 0 && (
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontSize: { xs: '1.125rem', sm: '1.25rem' },
              }}
            >
              Wargear
            </Typography>
            {allWargear.map(({ rule, source }) => (
              <Accordion key={rule.id} expanded={expandedWargear.has(rule.id)}>
                <AccordionSummary
                  expandIcon={
                    <IconButton
                      size={isMobile ? 'medium' : 'small'}
                      onClick={e => {
                        e.stopPropagation();
                        toggleWargearExpansion(rule.id);
                      }}
                      sx={{
                        p: { xs: 0.5, sm: 0.25 },
                      }}
                    >
                      {expandedWargear.has(rule.id) ? (
                        <ExpandLess />
                      ) : (
                        <ExpandMore />
                      )}
                    </IconButton>
                  }
                  sx={{
                    p: { xs: 1, sm: 2 },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontStyle: 'italic',
                        fontSize: { xs: '0.875rem', sm: '0.875rem' },
                      }}
                    >
                      {rule.description}
                    </Typography>
                    <Chip
                      label={source}
                      size={isMobile ? 'small' : 'small'}
                      variant="outlined"
                      sx={{
                        fontSize: { xs: '0.75rem', sm: '0.75rem' },
                      }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    p: { xs: 1, sm: 2 },
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 'bold',
                        mb: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.875rem', sm: '0.875rem' },
                      }}
                    >
                      {rule.shortText}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: '0.875rem', sm: '0.875rem' },
                      }}
                    >
                      {rule.longText}
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: { xs: 2, sm: 3 },
          pt: { xs: 1, sm: 2 },
        }}
      >
        <Button
          onClick={onClose}
          color="primary"
          fullWidth={isMobile}
          sx={{
            fontSize: { xs: '0.875rem', sm: '0.875rem' },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnitDetailModal;
