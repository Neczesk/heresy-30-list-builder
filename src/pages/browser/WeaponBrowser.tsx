import React, { useState, useMemo } from 'react';
import {
  Typography,
  Box,
  Container,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { Search, Clear, ExpandMore } from '@mui/icons-material';
import { DataLoader } from '../../utils/dataLoader';
import type { RangedWeapon, MeleeWeapon } from '../../types/army';

const WeaponBrowser: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [groupByTraits, setGroupByTraits] = useState<boolean>(true);

  const weapons = useMemo(() => DataLoader.getWeapons(), []);

  const rangedWeapons = useMemo(
    () =>
      weapons.filter(
        weapon =>
          DataLoader.isRangedWeapon(weapon) && weapon.type !== 'ranged-profile'
      ) as RangedWeapon[],
    [weapons]
  );

  const meleeWeapons = useMemo(
    () =>
      weapons.filter(
        weapon =>
          !DataLoader.isRangedWeapon(weapon) && weapon.type !== 'melee-profile'
      ) as MeleeWeapon[],
    [weapons]
  );

  // Extract all unique traits from weapons
  const allTraits = useMemo(() => {
    const traitSet = new Set<string>();

    // Collect traits from ranged weapons
    rangedWeapons.forEach(weapon => {
      if (weapon.traits) {
        weapon.traits.forEach(trait => traitSet.add(trait));
      }
      // Also collect traits from profile weapons
      if (weapon.profiles) {
        const profileWeapons = DataLoader.getProfileWeapons(weapon);
        profileWeapons.forEach(profileWeapon => {
          if (profileWeapon.traits) {
            profileWeapon.traits.forEach(trait => traitSet.add(trait));
          }
        });
      }
    });

    // Collect traits from melee weapons
    meleeWeapons.forEach(weapon => {
      if (weapon.traits) {
        weapon.traits.forEach(trait => traitSet.add(trait));
      }
      // Also collect traits from profile weapons
      if (weapon.profiles) {
        const profileWeapons = DataLoader.getProfileWeapons(weapon);
        profileWeapons.forEach(profileWeapon => {
          if (profileWeapon.traits) {
            profileWeapon.traits.forEach(trait => traitSet.add(trait));
          }
        });
      }
    });

    return Array.from(traitSet).sort();
  }, [rangedWeapons, meleeWeapons]);

  // Group weapons by traits
  const weaponsByTrait = useMemo(() => {
    const grouped: {
      [trait: string]: { ranged: RangedWeapon[]; melee: MeleeWeapon[] };
    } = {};

    // Initialize groups for all traits
    allTraits.forEach(trait => {
      grouped[trait] = { ranged: [], melee: [] };
    });

    // Group ranged weapons by traits
    rangedWeapons.forEach(weapon => {
      const weaponTraits = weapon.traits || [];
      weaponTraits.forEach(trait => {
        if (grouped[trait]) {
          grouped[trait].ranged.push(weapon);
        }
      });
    });

    // Group melee weapons by traits
    meleeWeapons.forEach(weapon => {
      const weaponTraits = weapon.traits || [];
      weaponTraits.forEach(trait => {
        if (grouped[trait]) {
          grouped[trait].melee.push(weapon);
        }
      });
    });

    return grouped;
  }, [rangedWeapons, meleeWeapons, allTraits]);

  const filteredRangedWeapons = useMemo(() => {
    if (!searchTerm) return rangedWeapons;

    const searchLower = searchTerm.toLowerCase();
    return rangedWeapons.filter(
      weapon =>
        weapon.name.toLowerCase().includes(searchLower) ||
        weapon.description?.toLowerCase().includes(searchLower) ||
        weapon.specialRules?.some(rule =>
          rule.toLowerCase().includes(searchLower)
        ) ||
        weapon.traits?.some(trait => trait.toLowerCase().includes(searchLower))
    );
  }, [rangedWeapons, searchTerm]);

  const filteredMeleeWeapons = useMemo(() => {
    if (!searchTerm) return meleeWeapons;

    const searchLower = searchTerm.toLowerCase();
    return meleeWeapons.filter(
      weapon =>
        weapon.name.toLowerCase().includes(searchLower) ||
        weapon.description?.toLowerCase().includes(searchLower) ||
        weapon.specialRules?.some(rule =>
          rule.toLowerCase().includes(searchLower)
        ) ||
        weapon.traits?.some(trait => trait.toLowerCase().includes(searchLower))
    );
  }, [meleeWeapons, searchTerm]);

  // Filter grouped weapons by search term
  const filteredWeaponsByTrait = useMemo(() => {
    if (!searchTerm) return weaponsByTrait;

    const searchLower = searchTerm.toLowerCase();
    const filtered: {
      [trait: string]: { ranged: RangedWeapon[]; melee: MeleeWeapon[] };
    } = {};

    Object.entries(weaponsByTrait).forEach(([trait, weapons]) => {
      const filteredRanged = weapons.ranged.filter(
        weapon =>
          weapon.name.toLowerCase().includes(searchLower) ||
          weapon.description?.toLowerCase().includes(searchLower) ||
          weapon.specialRules?.some(rule =>
            rule.toLowerCase().includes(searchLower)
          ) ||
          weapon.traits?.some(trait =>
            trait.toLowerCase().includes(searchLower)
          )
      );

      const filteredMelee = weapons.melee.filter(
        weapon =>
          weapon.name.toLowerCase().includes(searchLower) ||
          weapon.description?.toLowerCase().includes(searchLower) ||
          weapon.specialRules?.some(rule =>
            rule.toLowerCase().includes(searchLower)
          ) ||
          weapon.traits?.some(trait =>
            trait.toLowerCase().includes(searchLower)
          )
      );

      if (filteredRanged.length > 0 || filteredMelee.length > 0) {
        filtered[trait] = { ranged: filteredRanged, melee: filteredMelee };
      }
    });

    return filtered;
  }, [weaponsByTrait, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleGroupingChange = (
    event: React.MouseEvent<HTMLElement>,
    newGrouping: boolean | null
  ) => {
    if (newGrouping !== null) {
      setGroupByTraits(newGrouping);
    }
  };

  const renderRangedWeaponRow = (weapon: RangedWeapon) => {
    // Handle weapons with multiple profiles
    if (weapon.profiles && weapon.profiles.length > 0) {
      const rows = [];

      // Add header row for the weapon name
      rows.push(
        <TableRow
          key={`${weapon.id}-header`}
          sx={{ backgroundColor: 'action.hover' }}
        >
          <TableCell colSpan={8}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {weapon.name}
            </Typography>
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
              <TableCell sx={{ pl: 4 }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {rangedProfile.name}
                </Typography>
              </TableCell>
              <TableCell>{rangedProfile.range}"</TableCell>
              <TableCell>{rangedProfile.firepower}</TableCell>
              <TableCell>{rangedProfile.rangedStrength}</TableCell>
              <TableCell>{rangedProfile.ap}</TableCell>
              <TableCell>{rangedProfile.damage}</TableCell>
              <TableCell>
                {rangedProfile.specialRules &&
                rangedProfile.specialRules.length > 0
                  ? rangedProfile.specialRules
                      .map(ruleId => {
                        const rule = DataLoader.getSpecialRuleById(ruleId);
                        const value = rangedProfile.specialRuleValues?.[ruleId];
                        const ruleDisplayName = value
                          ? `${rule?.name || ruleId} (${value})`
                          : rule?.name || ruleId;
                        return ruleDisplayName;
                      })
                      .join(', ')
                  : '-'}
              </TableCell>
              <TableCell>{rangedProfile.traits?.join(', ') || '-'}</TableCell>
            </TableRow>
          );
        }
      });

      return rows;
    } else {
      // Single profile weapon (backward compatibility)
      return (
        <TableRow key={weapon.id}>
          <TableCell>{weapon.name}</TableCell>
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
                    const value = weapon.specialRuleValues?.[ruleId];
                    const ruleDisplayName = value
                      ? `${rule?.name || ruleId} (${value})`
                      : rule?.name || ruleId;
                    return ruleDisplayName;
                  })
                  .join(', ')
              : '-'}
          </TableCell>
          <TableCell>{weapon.traits?.join(', ') || '-'}</TableCell>
        </TableRow>
      );
    }
  };

  const renderMeleeWeaponRow = (weapon: MeleeWeapon) => {
    // Handle weapons with multiple profiles
    if (weapon.profiles && weapon.profiles.length > 0) {
      const rows = [];

      // Add header row for the weapon name
      rows.push(
        <TableRow
          key={`${weapon.id}-header`}
          sx={{ backgroundColor: 'action.hover' }}
        >
          <TableCell colSpan={7}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {weapon.name}
            </Typography>
          </TableCell>
        </TableRow>
      );

      // Add rows for each profile
      const profileWeapons = DataLoader.getProfileWeapons(weapon);
      profileWeapons.forEach((profileWeapon, index) => {
        if (!DataLoader.isRangedWeapon(profileWeapon)) {
          const meleeProfile = profileWeapon as MeleeWeapon;
          rows.push(
            <TableRow key={`${weapon.id}-${index}`}>
              <TableCell sx={{ pl: 4 }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {meleeProfile.name}
                </Typography>
              </TableCell>
              <TableCell>
                {meleeProfile.attackModifier === 'A'
                  ? 'A'
                  : `${typeof meleeProfile.attackModifier === 'number' && meleeProfile.attackModifier > 0 ? '+' : ''}${meleeProfile.attackModifier}`}
              </TableCell>
              <TableCell>
                {meleeProfile.strengthModifier === 'S'
                  ? 'S'
                  : `${typeof meleeProfile.strengthModifier === 'number' && meleeProfile.strengthModifier > 0 ? '+' : ''}${meleeProfile.strengthModifier}`}
              </TableCell>
              <TableCell>{meleeProfile.ap}</TableCell>
              <TableCell>{meleeProfile.damage}</TableCell>
              <TableCell>
                {meleeProfile.specialRules &&
                meleeProfile.specialRules.length > 0
                  ? meleeProfile.specialRules
                      .map(ruleId => {
                        const rule = DataLoader.getSpecialRuleById(ruleId);
                        const value = meleeProfile.specialRuleValues?.[ruleId];
                        const ruleDisplayName = value
                          ? `${rule?.name || ruleId} (${value})`
                          : rule?.name || ruleId;
                        return ruleDisplayName;
                      })
                      .join(', ')
                  : '-'}
              </TableCell>
              <TableCell>{meleeProfile.traits?.join(', ') || '-'}</TableCell>
            </TableRow>
          );
        }
      });

      return rows;
    } else {
      // Single profile weapon (backward compatibility)
      return (
        <TableRow key={weapon.id}>
          <TableCell>{weapon.name}</TableCell>
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
                    const value = weapon.specialRuleValues?.[ruleId];
                    const ruleDisplayName = value
                      ? `${rule?.name || ruleId} (${value})`
                      : rule?.name || ruleId;
                    return ruleDisplayName;
                  })
                  .join(', ')
              : '-'}
          </TableCell>
          <TableCell>{weapon.traits?.join(', ') || '-'}</TableCell>
        </TableRow>
      );
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Search Section */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search weapons..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={clearSearch} edge="end">
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {searchTerm && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={
                groupByTraits
                  ? `${Object.values(filteredWeaponsByTrait).reduce(
                      (total, weapons) =>
                        total + weapons.ranged.length + weapons.melee.length,
                      0
                    )} weapons found in ${Object.keys(filteredWeaponsByTrait).length} trait categories`
                  : `${filteredRangedWeapons.length + filteredMeleeWeapons.length} of ${
                      rangedWeapons.length + meleeWeapons.length
                    } weapons found`
              }
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        )}
      </Box>

      {/* Grouping Toggle */}
      <Box sx={{ mb: 4 }}>
        <ToggleButtonGroup
          value={groupByTraits}
          exclusive
          onChange={handleGroupingChange}
          aria-label="group by traits"
        >
          <ToggleButton value={false} aria-label="ungrouped">
            Ungrouped
          </ToggleButton>
          <ToggleButton value={true} aria-label="grouped">
            Grouped by Traits
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {groupByTraits ? (
        // Grouped by traits view
        Object.keys(filteredWeaponsByTrait).length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {searchTerm
                ? `No weapons found matching "${searchTerm}" in any trait category.`
                : 'No weapons with traits found.'}
            </Typography>
          </Paper>
        ) : (
          Object.entries(filteredWeaponsByTrait).map(([trait, weapons]) => (
            <Accordion key={trait} defaultExpanded={false}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" component="h3">
                  {trait} ({weapons.ranged.length + weapons.melee.length}{' '}
                  weapons)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {/* Ranged Weapons for this trait */}
                {weapons.ranged.length === 0 && weapons.melee.length === 0 ? (
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      No weapons found matching "{searchTerm}" in this trait
                      category.
                    </Typography>
                  </Paper>
                ) : (
                  <>
                    {weapons.ranged.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" component="h4" gutterBottom>
                          Ranged Weapons ({weapons.ranged.length})
                        </Typography>
                        <TableContainer component={Paper} sx={{ mb: 2 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  Name
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  Range
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  Firepower
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  Strength
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  AP
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  Damage
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  Special Rules
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  Traits
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {weapons.ranged.flatMap(renderRangedWeaponRow)}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}

                    {/* Melee Weapons for this trait */}
                    {weapons.melee.length > 0 && (
                      <Box>
                        <Typography variant="h6" component="h4" gutterBottom>
                          Melee Weapons ({weapons.melee.length})
                        </Typography>
                        <TableContainer component={Paper}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  Name
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  Attack Mod
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  Strength Mod
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  AP
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  Damage
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  Special Rules
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  Traits
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {weapons.melee.flatMap(renderMeleeWeaponRow)}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}
                  </>
                )}
              </AccordionDetails>
            </Accordion>
          ))
        )
      ) : (
        // Ungrouped view (original layout)
        <>
          {/* Ranged Weapons Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h3" gutterBottom>
              Ranged Weapons ({filteredRangedWeapons.length})
            </Typography>

            {filteredRangedWeapons.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No ranged weapons found matching "{searchTerm}"
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Range</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        Firepower
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        Strength
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
                    {filteredRangedWeapons.flatMap(renderRangedWeaponRow)}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Melee Weapons Section */}
          <Box>
            <Typography variant="h5" component="h3" gutterBottom>
              Melee Weapons ({filteredMeleeWeapons.length})
            </Typography>

            {filteredMeleeWeapons.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No melee weapons found matching "{searchTerm}"
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
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
                    {filteredMeleeWeapons.flatMap(renderMeleeWeaponRow)}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </>
      )}
    </Container>
  );
};

export default WeaponBrowser;
