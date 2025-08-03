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
  Card,
  CardContent,
  CardActionArea,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { DataLoader } from '../../utils/dataLoader';
import UnitDetailModal from '../../components/modals/UnitDetailModal';
import type { Unit, Model } from '../../types/army';

interface UnitWithModels extends Unit {
  modelsWithData: Array<{
    model: Model;
    count: number;
  }>;
}

const UnitBrowser: React.FC = () => {
  const [selectedFaction, setSelectedFaction] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitWithModels | null>(null);

  const factions = useMemo(() => DataLoader.getFactions(), []);
  const units = useMemo(() => {
    const allUnits = DataLoader.getUnits();
    return allUnits.map(unit => {
      const modelsWithData = Object.entries(unit.models).map(
        ([modelId, count]) => {
          const model = DataLoader.getModelById(modelId);
          return { model: model!, count };
        }
      );
      return { ...unit, modelsWithData };
    });
  }, []);

  const filteredUnits = useMemo(() => {
    let filtered = units;

    if (selectedFaction) {
      filtered = filtered.filter(unit => unit.faction === selectedFaction);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        unit =>
          unit.name.toLowerCase().includes(searchLower) ||
          unit.battlefieldRole.toLowerCase().includes(searchLower) ||
          unit.description.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [units, selectedFaction, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleFactionChange = (e: any) => {
    setSelectedFaction(e.target.value);
    setSearchTerm(''); // Clear search when faction changes
  };

  const handleUnitClick = (unit: UnitWithModels) => {
    setSelectedUnit(unit);
    setShowUnitModal(true);
  };

  const handleCloseModal = () => {
    setShowUnitModal(false);
    setSelectedUnit(null);
  };

  const getUnitsByRole = () => {
    const roleGroups: { [role: string]: UnitWithModels[] } = {};

    filteredUnits.forEach(unit => {
      const role = unit.battlefieldRole;
      if (!roleGroups[role]) {
        roleGroups[role] = [];
      }
      roleGroups[role].push(unit);
    });

    return roleGroups;
  };

  const getFactionName = (factionId: string) => {
    const faction = DataLoader.getFactionById(factionId);
    return faction?.name || factionId;
  };

  const renderUnitCard = (unit: UnitWithModels) => (
    <Box key={unit.id} sx={{ width: '100%' }}>
      <Card
        sx={{
          height: '100%',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          },
        }}
      >
        <CardActionArea
          onClick={() => handleUnitClick(unit)}
          sx={{ height: '100%' }}
        >
          <CardContent>
            <Typography variant="h6" component="h4" gutterBottom>
              {unit.name}
            </Typography>

            <Chip
              label={unit.battlefieldRole}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
            />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {unit.description}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {unit.minSize}-{unit.maxSize} models
              </Typography>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {unit.points} pts
              </Typography>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    </Box>
  );

  const roleGroups = getUnitsByRole();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Faction Selection */}
      <Box sx={{ mb: 4 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="faction-select-label">Select Faction</InputLabel>
          <Select
            labelId="faction-select-label"
            id="faction-select"
            value={selectedFaction}
            label="Select Faction"
            onChange={handleFactionChange}
          >
            <MenuItem value="">
              <em>Choose a faction...</em>
            </MenuItem>
            {factions.map(faction => (
              <MenuItem key={faction.id} value={faction.id}>
                {faction.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Search Section */}
        <TextField
          fullWidth
          placeholder="Search units..."
          value={searchTerm}
          onChange={handleSearchChange}
          disabled={!selectedFaction}
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
              label={`${filteredUnits.length} of ${
                units.filter(
                  u => !selectedFaction || u.faction === selectedFaction
                ).length
              } units found`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        )}
      </Box>

      {/* Content Section */}
      {!selectedFaction ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" component="h3" gutterBottom>
            Select a Faction
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Choose a faction to view its units organized by battlefield role.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {Object.keys(roleGroups).length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No units found for {getFactionName(selectedFaction)} matching
                your search criteria.
              </Typography>
            </Paper>
          ) : (
            Object.entries(roleGroups).map(([role, roleUnits], index) => (
              <Box key={role} sx={{ mb: 4 }}>
                <Typography variant="h5" component="h3" gutterBottom>
                  {role} Units ({roleUnits.length})
                </Typography>

                <Grid container spacing={3}>
                  {roleUnits.map(renderUnitCard)}
                </Grid>

                {index < Object.keys(roleGroups).length - 1 && (
                  <Divider sx={{ mt: 4 }} />
                )}
              </Box>
            ))
          )}
        </Box>
      )}

      {showUnitModal && selectedUnit && (
        <UnitDetailModal
          unit={selectedUnit}
          isOpen={showUnitModal}
          onClose={handleCloseModal}
        />
      )}
    </Container>
  );
};

export default UnitBrowser;
