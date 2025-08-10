import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { DataLoader } from '../utils/dataLoader';
import { UpgradeValidator } from '../utils/upgradeValidator';
import { TraitReplacer } from '../utils/traitReplacer';
import type {
  Unit,
  Model,
  RangedWeapon,
  MeleeWeapon,
  ArmyUnit,
  ArmyUpgrade,
  Allegiance,
} from '../types/army';

interface UnitViewerProps {
  unit: Unit;
  armyUnit?: ArmyUnit; // Optional army unit instance for modifications
  selectedUpgrades?: ArmyUpgrade[]; // Optional selected upgrades to apply
  onClose?: () => void;
  allegiance?: Allegiance; // Army allegiance for trait replacement
  legion?: string; // Legion ID for trait replacement
}

export const UnitViewer: React.FC<UnitViewerProps> = ({
  unit,
  armyUnit,
  selectedUpgrades = [],
  allegiance,
  legion,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const modelCompositions = armyUnit
    ? DataLoader.getModelsForUnitInstance(unit.id, armyUnit)
    : DataLoader.getModelsForUnit(unit.id);

  // Calculate actual size from models
  // Calculate effective model compositions with upgrades applied
  const getEffectiveModelCompositions = () => {
    return modelCompositions.map(({ model, count }) => {
      // Calculate effective weapons for this model
      const effectiveWeapons = UpgradeValidator.calculateEffectiveWeapons(
        model.id,
        model.weapons || [],
        selectedUpgrades,
        count
      );

      // Calculate effective wargear for this model
      const effectiveWargear = UpgradeValidator.calculateEffectiveWargear(
        model.id,
        model.wargear || [],
        selectedUpgrades
      );

      // Create effective model with updated weapons and wargear
      const effectiveModel: Model = {
        ...model,
        weapons:
          effectiveWeapons.length > 0
            ? effectiveWeapons.map(w => ({
                id: w.weaponId,
                mount: w.mount,
                count: w.count,
              }))
            : model.weapons, // Fallback to original weapons if calculation fails
        wargear: effectiveWargear,
      };

      return { model: effectiveModel, count };
    });
  };

  const effectiveModelCompositions = getEffectiveModelCompositions();

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

  const renderCharacteristicsTable = (
    modelCompositions: { model: Model; count: number }[]
  ) => {
    const isVehicle = modelCompositions.some(
      ({ model }) => model.type === 'Vehicle'
    );

    if (isVehicle) {
      return (
        <TableContainer component={Paper} variant="outlined">
          <Table size={isMobile ? 'small' : 'small'}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    p: { xs: 1, sm: 2 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  Model
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  M
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  BS
                </TableCell>
                <TableCell
                  align="center"
                  colSpan={3}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  Vehicle Armor
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  HP
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  TC
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ p: { xs: 1, sm: 2 } }}></TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                ></TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                ></TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  FA
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  SA
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  RA
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                ></TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                ></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {modelCompositions.map(({ model, count }) => {
                const characteristics = model.characteristics as any;
                const displayName =
                  count > 1 ? `${model.name} x${count}` : model.name;
                return (
                  <TableRow key={model.id} hover>
                    <TableCell
                      sx={{
                        p: { xs: 1, sm: 2 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {displayName}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {characteristics.movement}"
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {characteristics.ballisticSkill}+
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {characteristics.frontArmour}+
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {characteristics.sideArmour}+
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {characteristics.rearArmour}+
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {characteristics.hullPoints}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {characteristics.transportCapacity || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      );
    } else {
      return (
        <TableContainer component={Paper} variant="outlined">
          <Table size={isMobile ? 'small' : 'small'}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    p: { xs: 1, sm: 2 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  Model
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  M
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  WS
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  BS
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  S
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  T
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  W
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  I
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  A
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  Ld
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  Sv
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  Inv
                </TableCell>
                <TableCell
                  sx={{
                    p: { xs: 1, sm: 2 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  Special Rules
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {modelCompositions.map(({ model, count }) => {
                const characteristics = model.characteristics as any;
                const displayName =
                  count > 1 ? `${model.name} x${count}` : model.name;
                return (
                  <TableRow key={model.id} hover>
                    <TableCell
                      sx={{
                        p: { xs: 1, sm: 2 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {displayName}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {characteristics.movement}"
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {characteristics.weaponSkill}+
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {characteristics.ballisticSkill}+
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {characteristics.strength}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {characteristics.toughness}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {characteristics.wounds}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {characteristics.initiative}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {characteristics.attacks}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {characteristics.leadership}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {characteristics.armourSave}+
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        p: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {characteristics.invulnerableSave
                        ? `${characteristics.invulnerableSave}+`
                        : '-'}
                    </TableCell>
                    <TableCell
                      sx={{
                        p: { xs: 1, sm: 2 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {formatSpecialRules(model.specialRules || [])}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }
  };

  const renderRangedWeaponsTable = (
    modelCompositions: { model: Model; count: number }[]
  ) => {
    // Check if this is a vehicle unit
    const isVehicle = modelCompositions.some(
      ({ model }) => model.type === 'Vehicle'
    );

    const weaponMap = new Map<
      string,
      {
        weaponId: string;
        models: string[];
        weapon: RangedWeapon | undefined;
        mount?: string;
        weaponCount?: number;
      }
    >();

    modelCompositions.forEach(({ model, count }) => {
      model.weapons?.forEach(weaponEntry => {
        // Handle both string format and object format
        const weaponId =
          typeof weaponEntry === 'string' ? weaponEntry : weaponEntry.id;
        const mount =
          typeof weaponEntry === 'string' ? undefined : weaponEntry.mount;
        const weaponCount =
          typeof weaponEntry === 'string' ? 1 : weaponEntry.count || 1;
        const weapon = DataLoader.getWeaponById(weaponId);

        // For vehicles, include mount in the key to separate different mounts of the same weapon
        const key = mount ? `${weaponId}-${mount}` : weaponId;

        // Only include ranged weapons
        if (weapon && DataLoader.isRangedWeapon(weapon)) {
          if (weaponMap.has(key)) {
            const existing = weaponMap.get(key)!;
            // For vehicles, just show model name without mount (mount will be in separate column)
            const modelDisplay = isVehicle
              ? model.name
              : `${model.name}${count > 1 ? ` x${count}` : ''}`;
            existing.models.push(modelDisplay);
          } else {
            weaponMap.set(key, {
              weaponId: weaponId,
              models: [
                isVehicle
                  ? model.name
                  : `${model.name}${count > 1 ? ` x${count}` : ''}`,
              ],
              weapon: weapon as RangedWeapon,
              mount,
              weaponCount,
            });
          }
        }
      });
    });

    if (weaponMap.size === 0) {
      return <Alert severity="info">No ranged weapons available.</Alert>;
    }

    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size={isMobile ? 'small' : 'small'}>
          <TableHead>
            <TableRow>
              {!isVehicle && (
                <TableCell
                  sx={{
                    p: { xs: 1, sm: 2 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  Models
                </TableCell>
              )}
              {isVehicle && (
                <TableCell
                  sx={{
                    p: { xs: 1, sm: 2 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  Mount
                </TableCell>
              )}
              <TableCell
                sx={{
                  p: { xs: 1, sm: 2 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Weapon
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Range
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Firepower
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                S
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                AP
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                D
              </TableCell>
              <TableCell
                sx={{
                  p: { xs: 1, sm: 2 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Special Rules
              </TableCell>
              <TableCell
                sx={{
                  p: { xs: 1, sm: 2 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Traits
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from(weaponMap.values()).map(
              ({ weaponId, models, weapon, weaponCount, mount }, index) => {
                if (!weapon) {
                  return (
                    <TableRow key={`${weaponId}-${index}`} hover>
                      {!isVehicle && (
                        <TableCell
                          sx={{
                            p: { xs: 1, sm: 2 },
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          }}
                        >
                          {models.join(', ')}
                        </TableCell>
                      )}
                      {isVehicle && (
                        <TableCell
                          sx={{
                            p: { xs: 1, sm: 2 },
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          }}
                        >
                          {mount || '-'}
                        </TableCell>
                      )}
                      <TableCell
                        sx={{
                          p: { xs: 1, sm: 2 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        {weaponId}
                      </TableCell>
                      <TableCell
                        colSpan={7}
                        align="center"
                        sx={{
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        Weapon not found
                      </TableCell>
                    </TableRow>
                  );
                }

                // Handle weapons with profiles
                if (weapon.profiles && weapon.profiles.length > 0) {
                  const rows = [];

                  // Add header row for the weapon name
                  rows.push(
                    <TableRow
                      key={`${weaponId}-header`}
                      sx={{ backgroundColor: 'action.hover' }}
                    >
                      {!isVehicle && (
                        <TableCell rowSpan={weapon.profiles.length + 1}>
                          {models.join(', ')}
                        </TableCell>
                      )}
                      {isVehicle && (
                        <TableCell rowSpan={weapon.profiles.length + 1}>
                          {mount || '-'}
                        </TableCell>
                      )}
                      <TableCell rowSpan={weapon.profiles.length + 1}>
                        {weapon.name}
                        {weaponCount && weaponCount > 1
                          ? ` x${weaponCount}`
                          : ''}
                      </TableCell>
                      <TableCell colSpan={7} align="center">
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 'bold' }}
                        >
                          Multiple Profiles
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );

                  // Add rows for each profile
                  const profileWeapons = DataLoader.getProfileWeapons(weapon);
                  profileWeapons.forEach((profileWeapon, profileIndex) => {
                    if (DataLoader.isRangedWeapon(profileWeapon)) {
                      const rangedProfile = profileWeapon as RangedWeapon;
                      rows.push(
                        <TableRow key={`${weaponId}-${profileIndex}`}>
                          <TableCell
                            sx={{
                              pl: { xs: 2, sm: 4 },
                              p: { xs: 0.5, sm: 1 },
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            }}
                          >
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
                          <TableCell
                            align="center"
                            sx={{
                              p: { xs: 0.5, sm: 1 },
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            }}
                          >
                            {rangedProfile.range}"
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              p: { xs: 0.5, sm: 1 },
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            }}
                          >
                            {rangedProfile.firepower}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              p: { xs: 0.5, sm: 1 },
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            }}
                          >
                            {rangedProfile.rangedStrength}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              p: { xs: 0.5, sm: 1 },
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            }}
                          >
                            {rangedProfile.ap}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              p: { xs: 0.5, sm: 1 },
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            }}
                          >
                            {rangedProfile.damage}
                          </TableCell>
                          <TableCell
                            sx={{
                              p: { xs: 1, sm: 2 },
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            }}
                          >
                            {formatSpecialRules(
                              rangedProfile.specialRules || [],
                              rangedProfile.specialRuleValues
                            )}
                          </TableCell>
                          <TableCell
                            sx={{
                              p: { xs: 1, sm: 2 },
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            }}
                          >
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
                    <TableRow key={`${weaponId}-${index}`} hover>
                      {!isVehicle && (
                        <TableCell
                          sx={{
                            p: { xs: 1, sm: 2 },
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          }}
                        >
                          {models.join(', ')}
                        </TableCell>
                      )}
                      {isVehicle && (
                        <TableCell
                          sx={{
                            p: { xs: 1, sm: 2 },
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          }}
                        >
                          {mount || '-'}
                        </TableCell>
                      )}
                      <TableCell
                        sx={{
                          p: { xs: 1, sm: 2 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        {weapon.name}
                        {weaponCount && weaponCount > 1
                          ? ` x${weaponCount}`
                          : ''}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        {weapon.range}"
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        {weapon.firepower}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        {weapon.rangedStrength}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        {weapon.ap}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        {weapon.damage}
                      </TableCell>
                      <TableCell
                        sx={{
                          p: { xs: 1, sm: 2 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        {formatSpecialRules(
                          weapon.specialRules || [],
                          weapon.specialRuleValues
                        )}
                      </TableCell>
                      <TableCell
                        sx={{
                          p: { xs: 1, sm: 2 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        {weapon.traits?.join(', ') || '-'}
                      </TableCell>
                    </TableRow>
                  );
                }
              }
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderMeleeWeaponsTable = (
    modelCompositions: { model: Model; count: number }[]
  ) => {
    // Check if this is a vehicle unit
    const isVehicle = modelCompositions.some(
      ({ model }) => model.type === 'Vehicle'
    );

    const weaponMap = new Map<
      string,
      {
        weaponId: string;
        models: string[];
        weapon: MeleeWeapon | undefined;
        mount?: string;
        weaponCount?: number;
      }
    >();

    modelCompositions.forEach(({ model, count }) => {
      model.weapons?.forEach(weaponEntry => {
        // Handle both string format and object format
        const weaponId =
          typeof weaponEntry === 'string' ? weaponEntry : weaponEntry.id;
        const mount =
          typeof weaponEntry === 'string' ? undefined : weaponEntry.mount;
        const weaponCount =
          typeof weaponEntry === 'string' ? 1 : weaponEntry.count || 1;
        const weapon = DataLoader.getWeaponById(weaponId);

        // For vehicles, include mount in the key to separate different mounts of the same weapon
        const key = mount ? `${weaponId}-${mount}` : weaponId;

        // Only include melee weapons
        if (weapon && !DataLoader.isRangedWeapon(weapon)) {
          if (weaponMap.has(key)) {
            const existing = weaponMap.get(key)!;
            // For vehicles, just show model name without mount (mount will be in separate column)
            const modelDisplay = isVehicle
              ? model.name
              : `${model.name}${count > 1 ? ` x${count}` : ''}`;
            existing.models.push(modelDisplay);
          } else {
            weaponMap.set(key, {
              weaponId: weaponId,
              models: [
                isVehicle
                  ? model.name
                  : `${model.name}${count > 1 ? ` x${count}` : ''}`,
              ],
              weapon: weapon as MeleeWeapon,
              mount,
              weaponCount,
            });
          }
        }
      });
    });

    if (weaponMap.size === 0) {
      return <Alert severity="info">No melee weapons available.</Alert>;
    }

    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size={isMobile ? 'small' : 'small'}>
          <TableHead>
            <TableRow>
              {!isVehicle && (
                <TableCell
                  sx={{
                    p: { xs: 1, sm: 2 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  Models
                </TableCell>
              )}
              {isVehicle && (
                <TableCell
                  sx={{
                    p: { xs: 1, sm: 2 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  Mount
                </TableCell>
              )}
              <TableCell
                sx={{
                  p: { xs: 1, sm: 2 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Weapon
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Attack Modifier
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Strength Modifier
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Initiative Modifier
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                AP
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                D
              </TableCell>
              <TableCell
                sx={{
                  p: { xs: 1, sm: 2 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Special Rules
              </TableCell>
              <TableCell
                sx={{
                  p: { xs: 1, sm: 2 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Traits
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from(weaponMap.values()).map(
              ({ weaponId, models, weapon, weaponCount, mount }, index) => {
                if (!weapon) {
                  return (
                    <TableRow key={`${weaponId}-${index}`} hover>
                      {!isVehicle && <TableCell>{models.join(', ')}</TableCell>}
                      {isVehicle && <TableCell>{mount || '-'}</TableCell>}
                      <TableCell>{weaponId}</TableCell>
                      <TableCell colSpan={7} align="center">
                        Weapon not found
                      </TableCell>
                    </TableRow>
                  );
                }

                // Handle weapons with profiles
                if (weapon.profiles && weapon.profiles.length > 0) {
                  const rows = [];

                  // Add header row for the weapon name
                  rows.push(
                    <TableRow
                      key={`${weaponId}-header`}
                      sx={{ backgroundColor: 'action.hover' }}
                    >
                      {!isVehicle && (
                        <TableCell
                          rowSpan={weapon.profiles.length + 1}
                          sx={{
                            p: { xs: 1, sm: 2 },
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          }}
                        >
                          {models.join(', ')}
                        </TableCell>
                      )}
                      {isVehicle && (
                        <TableCell
                          rowSpan={weapon.profiles.length + 1}
                          sx={{
                            p: { xs: 1, sm: 2 },
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          }}
                        >
                          {mount || '-'}
                        </TableCell>
                      )}
                      <TableCell
                        rowSpan={weapon.profiles.length + 1}
                        sx={{
                          p: { xs: 1, sm: 2 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        {weapon.name}
                        {weaponCount && weaponCount > 1
                          ? ` x${weaponCount}`
                          : ''}
                      </TableCell>
                      <TableCell
                        colSpan={7}
                        align="center"
                        sx={{
                          p: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 'bold',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          }}
                        >
                          Multiple Profiles
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );

                  // Add rows for each profile
                  const profileWeapons = DataLoader.getProfileWeapons(weapon);
                  profileWeapons.forEach((profileWeapon, profileIndex) => {
                    if (DataLoader.isMeleeWeapon(profileWeapon)) {
                      const meleeProfile = profileWeapon as MeleeWeapon;
                      rows.push(
                        <TableRow key={`${weaponId}-${profileIndex}`}>
                          <TableCell sx={{ pl: 4 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontStyle: 'italic' }}
                            >
                              {meleeProfile.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {meleeProfile.attackModifier === 'A'
                              ? 'A'
                              : `${typeof meleeProfile.attackModifier === 'number' && meleeProfile.attackModifier > 0 ? '+' : ''}${meleeProfile.attackModifier}`}
                          </TableCell>
                          <TableCell align="center">
                            {meleeProfile.strengthModifier === 'S'
                              ? 'S'
                              : `${typeof meleeProfile.strengthModifier === 'number' && meleeProfile.strengthModifier > 0 ? '+' : ''}${meleeProfile.strengthModifier}`}
                          </TableCell>
                          <TableCell align="center">
                            {meleeProfile.initiativeModifier === 'I'
                              ? 'I'
                              : `${typeof meleeProfile.initiativeModifier === 'number' && meleeProfile.initiativeModifier > 0 ? '+' : ''}${meleeProfile.initiativeModifier}`}
                          </TableCell>
                          <TableCell align="center">
                            {meleeProfile.ap}
                          </TableCell>
                          <TableCell align="center">
                            {meleeProfile.damage}
                          </TableCell>
                          <TableCell>
                            {formatSpecialRules(
                              meleeProfile.specialRules || [],
                              meleeProfile.specialRuleValues
                            )}
                          </TableCell>
                          <TableCell>
                            {meleeProfile.traits?.join(', ') || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    }
                  });

                  return rows;
                } else {
                  // Single profile weapon (backward compatibility)
                  return (
                    <TableRow key={`${weaponId}-${index}`} hover>
                      {!isVehicle && <TableCell>{models.join(', ')}</TableCell>}
                      {isVehicle && <TableCell>{mount || '-'}</TableCell>}
                      <TableCell>
                        {weapon.name}
                        {weaponCount && weaponCount > 1
                          ? ` x${weaponCount}`
                          : ''}
                      </TableCell>
                      <TableCell align="center">
                        {weapon.attackModifier || '-'}
                      </TableCell>
                      <TableCell align="center">
                        {weapon.strengthModifier || '-'}
                      </TableCell>
                      <TableCell align="center">
                        {weapon.initiativeModifier || '-'}
                      </TableCell>
                      <TableCell align="center">{weapon.ap}</TableCell>
                      <TableCell align="center">{weapon.damage}</TableCell>
                      <TableCell>
                        {formatSpecialRules(
                          weapon.specialRules || [],
                          weapon.specialRuleValues
                        )}
                      </TableCell>
                      <TableCell>{weapon.traits?.join(', ') || '-'}</TableCell>
                    </TableRow>
                  );
                }
              }
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderSpecialRulesTable = (
    modelCompositions: { model: Model; count: number }[]
  ) => {
    const rulesMap = new Map<
      string,
      {
        ruleId: string;
        sources: string[];
        rule: any;
        specialRuleValues?: { [key: string]: any };
      }
    >();

    // Add unit-level special rules
    if (unit.specialRules && unit.specialRules.length > 0) {
      unit.specialRules.forEach(ruleId => {
        const rule = DataLoader.getSpecialRuleById(ruleId);
        const key = ruleId;

        if (!rule || rule.type === 'special-rule') {
          const unitValue = unit.specialRuleValues?.[ruleId];
          const sourceDisplay = unitValue ? `Unit (${unitValue})` : 'Unit';

          rulesMap.set(key, {
            ruleId: ruleId,
            sources: [sourceDisplay],
            rule,
            specialRuleValues: unit.specialRuleValues,
          });
        }
      });
    }

    // Add model-level special rules
    modelCompositions.forEach(({ model, count }) => {
      model.specialRules?.forEach(ruleId => {
        const rule = DataLoader.getSpecialRuleById(ruleId);
        const key = ruleId;

        if (!rule || rule.type === 'special-rule') {
          const modelValue = model.specialRuleValues?.[ruleId];
          const sourceDisplay = `${model.name}${count > 1 ? ` x${count}` : ''}${modelValue ? ` (${modelValue})` : ''}`;

          if (rulesMap.has(key)) {
            const existing = rulesMap.get(key)!;
            existing.sources.push(sourceDisplay);
          } else {
            rulesMap.set(key, {
              ruleId: ruleId,
              sources: [sourceDisplay],
              rule,
              specialRuleValues: model.specialRuleValues,
            });
          }
        }
      });
    });

    // Add weapon-level special rules
    modelCompositions.forEach(({ model }) => {
      model.weapons?.forEach(weaponEntry => {
        const weaponId =
          typeof weaponEntry === 'string' ? weaponEntry : weaponEntry.id;
        const weapon = DataLoader.getWeaponById(weaponId);

        if (weapon && weapon.specialRules && weapon.specialRules.length > 0) {
          weapon.specialRules.forEach(ruleId => {
            const rule = DataLoader.getSpecialRuleById(ruleId);
            const key = ruleId;

            if (!rule || rule.type === 'special-rule') {
              const weaponValue = weapon.specialRuleValues?.[ruleId];
              const weaponDisplay = `${weapon.name} (${model.name})${weaponValue ? ` (${weaponValue})` : ''}`;
              if (rulesMap.has(key)) {
                const existing = rulesMap.get(key)!;
                existing.sources.push(weaponDisplay);
              } else {
                rulesMap.set(key, {
                  ruleId: ruleId,
                  sources: [weaponDisplay],
                  rule,
                  specialRuleValues: weapon.specialRuleValues,
                });
              }
            }
          });
        }

        // Add profile-level special rules (for weapons with profiles)
        if (weapon && weapon.profiles && weapon.profiles.length > 0) {
          const profileWeapons = DataLoader.getProfileWeapons(weapon);
          profileWeapons.forEach(profileWeapon => {
            if (
              profileWeapon.specialRules &&
              profileWeapon.specialRules.length > 0
            ) {
              profileWeapon.specialRules.forEach(ruleId => {
                const rule = DataLoader.getSpecialRuleById(ruleId);
                const key = ruleId;

                if (!rule || rule.type === 'special-rule') {
                  const profileValue =
                    profileWeapon.specialRuleValues?.[ruleId];
                  const profileDisplay = `${weapon.name} - ${profileWeapon.name} (${model.name})${profileValue ? ` (${profileValue})` : ''}`;
                  if (rulesMap.has(key)) {
                    const existing = rulesMap.get(key)!;
                    existing.sources.push(profileDisplay);
                  } else {
                    rulesMap.set(key, {
                      ruleId: ruleId,
                      sources: [profileDisplay],
                      rule,
                      specialRuleValues: profileWeapon.specialRuleValues,
                    });
                  }
                }
              });
            }
          });
        }
      });
    });

    if (rulesMap.size === 0) {
      return <Alert severity="info">No special rules available.</Alert>;
    }

    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rule</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from(rulesMap.values()).map(({ ruleId, rule }, index) => {
              return (
                <TableRow key={`${ruleId}-${index}`} hover>
                  <TableCell>{rule?.name || ruleId}</TableCell>
                  <TableCell>{rule?.shortText || '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderWargearTable = (
    modelCompositions: { model: Model; count: number }[]
  ) => {
    const wargearMap = new Map<
      string,
      { wargearId: string; models: string[]; wargear: any }
    >();

    modelCompositions.forEach(({ model, count }) => {
      model.wargear?.forEach(wargearId => {
        const wargear = DataLoader.getSpecialRuleById(wargearId);
        const key = wargearId;

        // Include all wargear, even if they don't exist in the data
        // If the wargear exists and has a type, only include if it's wargear
        // If the wargear doesn't exist in the data, include it anyway (it might be missing from the data file)
        if (!wargear || wargear.type === 'wargear') {
          if (wargearMap.has(key)) {
            const existing = wargearMap.get(key)!;
            existing.models.push(
              `${model.name}${count > 1 ? ` x${count}` : ''}`
            );
          } else {
            wargearMap.set(key, {
              wargearId: wargearId,
              models: [`${model.name}${count > 1 ? ` x${count}` : ''}`],
              wargear,
            });
          }
        }
      });
    });

    if (wargearMap.size === 0) {
      return <Alert severity="info">No wargear available.</Alert>;
    }

    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Models</TableCell>
              <TableCell>Wargear</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from(wargearMap.values()).map(
              ({ wargearId, models, wargear }, index) => {
                return (
                  <TableRow key={`${wargearId}-${index}`} hover>
                    <TableCell>{models.join(', ')}</TableCell>
                    <TableCell>{wargear?.name || wargearId}</TableCell>
                    <TableCell>{wargear?.shortText || '-'}</TableCell>
                  </TableRow>
                );
              }
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Characteristics Section */}
      <Card sx={{ mb: { xs: 2, sm: 3 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontSize: { xs: '1.125rem', sm: '1.25rem' },
            }}
          >
            Characteristics
          </Typography>
          {renderCharacteristicsTable(effectiveModelCompositions)}
        </CardContent>
      </Card>

      {/* Ranged Weapons Section */}
      <Card sx={{ mb: { xs: 2, sm: 3 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontSize: { xs: '1.125rem', sm: '1.25rem' },
            }}
          >
            Ranged Weapons
          </Typography>
          {renderRangedWeaponsTable(effectiveModelCompositions)}
        </CardContent>
      </Card>

      {/* Melee Weapons Section */}
      <Card sx={{ mb: { xs: 2, sm: 3 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontSize: { xs: '1.125rem', sm: '1.25rem' },
            }}
          >
            Melee Weapons
          </Typography>
          {renderMeleeWeaponsTable(effectiveModelCompositions)}
        </CardContent>
      </Card>

      {/* Special Rules Section */}
      <Card sx={{ mb: { xs: 2, sm: 3 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontSize: { xs: '1.125rem', sm: '1.25rem' },
            }}
          >
            Special Rules
          </Typography>
          {renderSpecialRulesTable(effectiveModelCompositions)}
        </CardContent>
      </Card>

      {/* Wargear Section */}
      <Card sx={{ mb: { xs: 2, sm: 3 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontSize: { xs: '1.125rem', sm: '1.25rem' },
            }}
          >
            Wargear
          </Typography>
          {renderWargearTable(effectiveModelCompositions)}
        </CardContent>
      </Card>

      {/* Traits Section */}
      {unit.traits && unit.traits.length > 0 && (
        <Card sx={{ mb: { xs: 2, sm: 3 } }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontSize: { xs: '1.125rem', sm: '1.25rem' },
              }}
            >
              Traits
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {TraitReplacer.replaceTraits(
                unit.traits,
                allegiance || 'Universal',
                legion
              ).map((trait, index) => (
                <Chip
                  key={index}
                  label={trait}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Prime Advantages Section */}
      {armyUnit?.primeAdvantages && armyUnit.primeAdvantages.length > 0 && (
        <Card sx={{ mb: { xs: 2, sm: 3 } }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontSize: { xs: '1.125rem', sm: '1.25rem' },
              }}
            >
              Prime Advantages
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 1, sm: 2 },
              }}
            >
              {armyUnit.primeAdvantages.map((advantage, index) => (
                <Box
                  key={index}
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    bgcolor: 'warning.light',
                    border: 1,
                    borderColor: 'warning.main',
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    color="warning.dark"
                    gutterBottom
                    sx={{
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                  >
                    {advantage.description}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                  >
                    {advantage.effect}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
