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
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { DataLoader } from '../../utils/dataLoader';
import type { RangedWeapon, MeleeWeapon } from '../../types/army';

const WeaponBrowser: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const weapons = useMemo(() => DataLoader.getWeapons(), []);

  const rangedWeapons = useMemo(
    () =>
      weapons.filter(weapon =>
        DataLoader.isRangedWeapon(weapon)
      ) as RangedWeapon[],
    [weapons]
  );

  const meleeWeapons = useMemo(
    () =>
      weapons.filter(
        weapon => !DataLoader.isRangedWeapon(weapon)
      ) as MeleeWeapon[],
    [weapons]
  );

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
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
                {rangedProfile.specialRules && rangedProfile.specialRules.length > 0
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

  const renderMeleeWeaponRow = (weapon: MeleeWeapon) => (
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
              label={`${filteredRangedWeapons.length + filteredMeleeWeapons.length} of ${
                rangedWeapons.length + meleeWeapons.length
              } weapons found`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        )}
      </Box>

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
                  <TableCell sx={{ fontWeight: 'bold' }}>Attack Mod</TableCell>
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
                {filteredMeleeWeapons.map(renderMeleeWeaponRow)}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
};

export default WeaponBrowser;
