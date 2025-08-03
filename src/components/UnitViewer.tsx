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
} from '@mui/material';
import { DataLoader } from '../utils/dataLoader';
import { UpgradeValidator } from '../utils/upgradeValidator';
import type {
  Unit,
  Model,
  RangedWeapon,
  MeleeWeapon,
  ArmyUnit,
  ArmyUpgrade,
} from '../types/army';

interface UnitViewerProps {
  unit: Unit;
  armyUnit?: ArmyUnit; // Optional army unit instance for modifications
  selectedUpgrades?: ArmyUpgrade[]; // Optional selected upgrades to apply
  onClose?: () => void;
}

export const UnitViewer: React.FC<UnitViewerProps> = ({
  unit,
  armyUnit,
  selectedUpgrades = [],
}) => {
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
        weapons: effectiveWeapons.length > 0
          ? effectiveWeapons.map(w => ({ id: w.weaponId, mount: w.mount, count: w.count }))
          : model.weapons, // Fallback to original weapons if calculation fails
        wargear: effectiveWargear,
      };

      return { model: effectiveModel, count };
    });
  };

      const effectiveModelCompositions = getEffectiveModelCompositions();

    // Helper function to format special rules with names and values
  const formatSpecialRules = (ruleIds: string[], specialRuleValues?: { [key: string]: any }): string => {
    if (!ruleIds || ruleIds.length === 0) return '-';

    return ruleIds.map(ruleId => {
      const rule = DataLoader.getSpecialRuleById(ruleId);
      const ruleName = rule?.name || ruleId;

      // Check if there's a value for this rule
      if (specialRuleValues && specialRuleValues[ruleId] !== undefined) {
        return `${ruleName} (${specialRuleValues[ruleId]})`;
      }

      return ruleName;
    }).join(', ');
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
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Model</TableCell>
                <TableCell align="center">M</TableCell>
                <TableCell align="center">BS</TableCell>
                <TableCell align="center" colSpan={3} sx={{ bgcolor: 'primary.main', color: 'white' }}>
                  Vehicle Armor
                </TableCell>
                <TableCell align="center">HP</TableCell>
                <TableCell align="center">TC</TableCell>
              </TableRow>
              <TableRow>
                <TableCell></TableCell>
                <TableCell align="center"></TableCell>
                <TableCell align="center"></TableCell>
                <TableCell align="center">FA</TableCell>
                <TableCell align="center">SA</TableCell>
                <TableCell align="center">RA</TableCell>
                <TableCell align="center"></TableCell>
                <TableCell align="center"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {modelCompositions.map(({ model, count }) => {
                const characteristics = model.characteristics as any;
                const displayName =
                  count > 1 ? `${model.name} x${count}` : model.name;
                return (
                  <TableRow key={model.id} hover>
                    <TableCell>{displayName}</TableCell>
                    <TableCell align="center">{characteristics.movement}"</TableCell>
                    <TableCell align="center">{characteristics.ballisticSkill}+</TableCell>
                    <TableCell align="center">{characteristics.frontArmour}+</TableCell>
                    <TableCell align="center">{characteristics.sideArmour}+</TableCell>
                    <TableCell align="center">{characteristics.rearArmour}+</TableCell>
                    <TableCell align="center">{characteristics.hullPoints}</TableCell>
                    <TableCell align="center">{characteristics.transportCapacity || '-'}</TableCell>
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
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Model</TableCell>
                <TableCell align="center">M</TableCell>
                <TableCell align="center">WS</TableCell>
                <TableCell align="center">BS</TableCell>
                <TableCell align="center">S</TableCell>
                <TableCell align="center">T</TableCell>
                <TableCell align="center">W</TableCell>
                <TableCell align="center">I</TableCell>
                <TableCell align="center">A</TableCell>
                <TableCell align="center">Ld</TableCell>
                <TableCell align="center">Sv</TableCell>
                <TableCell align="center">Inv</TableCell>
                <TableCell>Special Rules</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {modelCompositions.map(({ model, count }) => {
                const characteristics = model.characteristics as any;
                const displayName =
                  count > 1 ? `${model.name} x${count}` : model.name;
                return (
                  <TableRow key={model.id} hover>
                    <TableCell>{displayName}</TableCell>
                    <TableCell align="center">{characteristics.movement}"</TableCell>
                    <TableCell align="center">{characteristics.weaponSkill}+</TableCell>
                    <TableCell align="center">{characteristics.ballisticSkill}+</TableCell>
                    <TableCell align="center">{characteristics.strength}</TableCell>
                    <TableCell align="center">{characteristics.toughness}</TableCell>
                    <TableCell align="center">{characteristics.wounds}</TableCell>
                    <TableCell align="center">{characteristics.initiative}</TableCell>
                    <TableCell align="center">{characteristics.attacks}</TableCell>
                    <TableCell align="center">{characteristics.leadership}</TableCell>
                    <TableCell align="center">{characteristics.armourSave}+</TableCell>
                    <TableCell align="center">{characteristics.invulnerableSave ? `${characteristics.invulnerableSave}+` : '-'}</TableCell>
                    <TableCell>{model.specialRules && model.specialRules.length > 0 ? model.specialRules.join(', ') : '-'}</TableCell>
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
    const isVehicle = modelCompositions.some(({ model }) => model.type === 'Vehicle');

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
        const weaponId = typeof weaponEntry === 'string' ? weaponEntry : weaponEntry.id;
        const mount = typeof weaponEntry === 'string' ? undefined : weaponEntry.mount;
        const weaponCount = typeof weaponEntry === 'string' ? 1 : (weaponEntry.count || 1);
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
              models: [isVehicle
                ? model.name
                : `${model.name}${count > 1 ? ` x${count}` : ''}`
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
        <Table size="small">
          <TableHead>
            <TableRow>
              {!isVehicle && <TableCell>Models</TableCell>}
              {isVehicle && <TableCell>Mount</TableCell>}
              <TableCell>Weapon</TableCell>
              <TableCell align="center">Range</TableCell>
              <TableCell align="center">Firepower</TableCell>
              <TableCell align="center">S</TableCell>
              <TableCell align="center">AP</TableCell>
              <TableCell align="center">D</TableCell>
              <TableCell>Special Rules</TableCell>
              <TableCell>Traits</TableCell>
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
                      <TableCell colSpan={7} align="center">Weapon not found</TableCell>
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
                      {!isVehicle && <TableCell rowSpan={weapon.profiles.length + 1}>{models.join(', ')}</TableCell>}
                      {isVehicle && <TableCell rowSpan={weapon.profiles.length + 1}>{mount || '-'}</TableCell>}
                      <TableCell rowSpan={weapon.profiles.length + 1}>
                        {weapon.name}
                        {weaponCount && weaponCount > 1 ? ` x${weaponCount}` : ''}
                      </TableCell>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
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
                          <TableCell sx={{ pl: 4 }}>
                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                              {rangedProfile.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{rangedProfile.range}"</TableCell>
                          <TableCell align="center">{rangedProfile.firepower}</TableCell>
                          <TableCell align="center">{rangedProfile.rangedStrength}</TableCell>
                          <TableCell align="center">{rangedProfile.ap}</TableCell>
                          <TableCell align="center">{rangedProfile.damage}</TableCell>
                          <TableCell>{formatSpecialRules(rangedProfile.specialRules || [], rangedProfile.specialRuleValues)}</TableCell>
                          <TableCell>{rangedProfile.traits?.join(', ') || '-'}</TableCell>
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
                        {weaponCount && weaponCount > 1 ? ` x${weaponCount}` : ''}
                      </TableCell>
                      <TableCell align="center">{weapon.range}"</TableCell>
                      <TableCell align="center">{weapon.firepower}</TableCell>
                      <TableCell align="center">{weapon.rangedStrength}</TableCell>
                      <TableCell align="center">{weapon.ap}</TableCell>
                      <TableCell align="center">{weapon.damage}</TableCell>
                      <TableCell>{formatSpecialRules(weapon.specialRules || [], weapon.specialRuleValues)}</TableCell>
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

  const renderMeleeWeaponsTable = (
    modelCompositions: { model: Model; count: number }[]
  ) => {
    // Check if this is a vehicle unit
    const isVehicle = modelCompositions.some(({ model }) => model.type === 'Vehicle');

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
        const weaponId = typeof weaponEntry === 'string' ? weaponEntry : weaponEntry.id;
        const mount = typeof weaponEntry === 'string' ? undefined : weaponEntry.mount;
        const weaponCount = typeof weaponEntry === 'string' ? 1 : (weaponEntry.count || 1);
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
              models: [isVehicle
                ? model.name
                : `${model.name}${count > 1 ? ` x${count}` : ''}`
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
        <Table size="small">
          <TableHead>
            <TableRow>
              {!isVehicle && <TableCell>Models</TableCell>}
              {isVehicle && <TableCell>Mount</TableCell>}
              <TableCell>Weapon</TableCell>
              <TableCell align="center">Attack Modifier</TableCell>
              <TableCell align="center">Strength Modifier</TableCell>
              <TableCell align="center">Initiative Modifier</TableCell>
              <TableCell align="center">AP</TableCell>
              <TableCell align="center">D</TableCell>
              <TableCell>Special Rules</TableCell>
              <TableCell>Traits</TableCell>
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
                      <TableCell colSpan={7} align="center">Weapon not found</TableCell>
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
                      {!isVehicle && <TableCell rowSpan={weapon.profiles.length + 1}>{models.join(', ')}</TableCell>}
                      {isVehicle && <TableCell rowSpan={weapon.profiles.length + 1}>{mount || '-'}</TableCell>}
                      <TableCell rowSpan={weapon.profiles.length + 1}>
                        {weapon.name}
                        {weaponCount && weaponCount > 1 ? ` x${weaponCount}` : ''}
                      </TableCell>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
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
                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
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
                          <TableCell align="center">{meleeProfile.ap}</TableCell>
                          <TableCell align="center">{meleeProfile.damage}</TableCell>
                          <TableCell>{formatSpecialRules(meleeProfile.specialRules || [], meleeProfile.specialRuleValues)}</TableCell>
                          <TableCell>{meleeProfile.traits?.join(', ') || '-'}</TableCell>
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
                        {weaponCount && weaponCount > 1 ? ` x${weaponCount}` : ''}
                      </TableCell>
                      <TableCell align="center">{weapon.attackModifier || '-'}</TableCell>
                      <TableCell align="center">{weapon.strengthModifier || '-'}</TableCell>
                      <TableCell align="center">{weapon.initiativeModifier || '-'}</TableCell>
                      <TableCell align="center">{weapon.ap}</TableCell>
                      <TableCell align="center">{weapon.damage}</TableCell>
                      <TableCell>{formatSpecialRules(weapon.specialRules || [], weapon.specialRuleValues)}</TableCell>
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
      { ruleId: string; sources: string[]; rule: any; specialRuleValues?: { [key: string]: any } }
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
        const weaponId = typeof weaponEntry === 'string' ? weaponEntry : weaponEntry.id;
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
            if (profileWeapon.specialRules && profileWeapon.specialRules.length > 0) {
              profileWeapon.specialRules.forEach(ruleId => {
                const rule = DataLoader.getSpecialRuleById(ruleId);
                const key = ruleId;

                if (!rule || rule.type === 'special-rule') {
                  const profileValue = profileWeapon.specialRuleValues?.[ruleId];
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
            {Array.from(rulesMap.values()).map(
              ({ ruleId, rule }, index) => {
                return (
                  <TableRow key={`${ruleId}-${index}`} hover>
                    <TableCell>{rule?.name || ruleId}</TableCell>
                    <TableCell>{rule?.shortText || '-'}</TableCell>
                  </TableRow>
                );
              }
            )}
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
            existing.models.push(`${model.name}${count > 1 ? ` x${count}` : ''}`);
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
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Characteristics
          </Typography>
          {renderCharacteristicsTable(effectiveModelCompositions)}
        </CardContent>
      </Card>

      {/* Ranged Weapons Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Ranged Weapons
          </Typography>
          {renderRangedWeaponsTable(effectiveModelCompositions)}
        </CardContent>
      </Card>

      {/* Melee Weapons Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Melee Weapons
          </Typography>
          {renderMeleeWeaponsTable(effectiveModelCompositions)}
        </CardContent>
      </Card>

      {/* Special Rules Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Special Rules
          </Typography>
          {renderSpecialRulesTable(effectiveModelCompositions)}
        </CardContent>
      </Card>

      {/* Wargear Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Wargear
          </Typography>
          {renderWargearTable(effectiveModelCompositions)}
        </CardContent>
      </Card>

      {/* Traits Section */}
      {unit.traits && unit.traits.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Traits
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {unit.traits.map((trait, index) => (
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
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Prime Advantages
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {armyUnit.primeAdvantages.map((advantage, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    bgcolor: 'warning.light',
                    border: 1,
                    borderColor: 'warning.main',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle2" color="warning.dark" gutterBottom>
                    {advantage.description}
                  </Typography>
                  <Typography variant="body2">
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
