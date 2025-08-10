import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Container,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Stack,
  Alert,
  AppBar,
  Toolbar,
} from '@mui/material';
import { ArrowBack, Edit, Delete, Save, Close } from '@mui/icons-material';
import { EnhancedCustomUnitStorage } from '../../utils/enhancedCustomUnitStorage';
import { DataLoader } from '../../utils/dataLoader';
import UnitManagementModal from '../listBuilder/UnitManagementModal';
import type {
  CustomUnit,
  CustomUnitMetadata,
  ArmyUnit,
} from '../../types/army';

const CustomUnitsManager: React.FC = () => {
  const navigate = useNavigate();
  const [customUnits, setCustomUnits] = useState<CustomUnitMetadata[]>([]);
  const [editingUnit, setEditingUnit] = useState<CustomUnit | null>(null);
  const [showUnitManagementModal, setShowUnitManagementModal] = useState(false);
  const [renamingUnit, setRenamingUnit] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteConfirmUnit, setDeleteConfirmUnit] =
    useState<CustomUnitMetadata | null>(null);

  // Load custom units on mount
  useEffect(() => {
    loadCustomUnits();
  }, []);

  const loadCustomUnits = () => {
    const units = EnhancedCustomUnitStorage.getAllCustomUnitMetadata();
    setCustomUnits(units);
  };

  const handleEditUnit = (unitId: string) => {
    const customUnit = EnhancedCustomUnitStorage.getCustomUnit(unitId);
    if (customUnit) {
      setEditingUnit(customUnit);
      setShowUnitManagementModal(true);
    }
  };

  const handleDeleteUnit = (unit: CustomUnitMetadata) => {
    setDeleteConfirmUnit(unit);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmUnit) {
      EnhancedCustomUnitStorage.deleteCustomUnit(deleteConfirmUnit.id);
      setDeleteConfirmUnit(null);
      loadCustomUnits();
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmUnit(null);
  };

  const handleStartRename = (unit: CustomUnitMetadata) => {
    setRenamingUnit({ id: unit.id, name: unit.name });
  };

  const handleSaveRename = () => {
    if (renamingUnit) {
      const customUnit = EnhancedCustomUnitStorage.getCustomUnit(
        renamingUnit.id
      );
      if (customUnit) {
        // Check if new name conflicts with existing units
        if (
          EnhancedCustomUnitStorage.isNameTaken(
            renamingUnit.name,
            renamingUnit.id
          )
        ) {
          alert('A custom unit with this name already exists.');
          return;
        }

        // Update the custom unit with new name and ID
        const newId = EnhancedCustomUnitStorage.generateId(renamingUnit.name);
        const updatedUnit: CustomUnit = {
          ...customUnit,
          id: newId,
          name: renamingUnit.name,
          updatedAt: new Date().toISOString(),
        };

        // Delete old unit and save new one
        EnhancedCustomUnitStorage.deleteCustomUnit(renamingUnit.id);
        EnhancedCustomUnitStorage.saveCustomUnit(updatedUnit);

        setRenamingUnit(null);
        loadCustomUnits();
      }
    }
  };

  const handleCancelRename = () => {
    setRenamingUnit(null);
  };

  const handleRenameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (renamingUnit) {
      setRenamingUnit({ ...renamingUnit, name: e.target.value });
    }
  };

  const handleRenameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  const handleUnitManagementClose = () => {
    setShowUnitManagementModal(false);
    setEditingUnit(null);
  };

  const handleUnitUpdated = (_slotId: string, updatedUnit: ArmyUnit) => {
    if (editingUnit) {
      // Create updated custom unit from the army unit
      const updatedCustomUnit: CustomUnit = {
        ...editingUnit,
        upgrades: updatedUnit.upgrades,
        primeAdvantages: updatedUnit.primeAdvantages,
        modelInstanceWeaponChanges: updatedUnit.modelInstanceWeaponChanges,
        modelInstanceWargearChanges: updatedUnit.modelInstanceWargearChanges,
        updatedAt: new Date().toISOString(),
      };

      EnhancedCustomUnitStorage.saveCustomUnit(updatedCustomUnit);
      setShowUnitManagementModal(false);
      setEditingUnit(null);
      loadCustomUnits();
    }
  };

  const getFactionName = (factionId: string) => {
    const faction = DataLoader.getFactionById(factionId);
    return faction?.name || factionId;
  };

  const getSubfactionName = (subfactionId: string) => {
    const faction = DataLoader.getFactionById(subfactionId);
    return faction?.name || subfactionId;
  };

  const getBaseUnitName = (baseUnitId: string) => {
    const unit = DataLoader.getUnitById(baseUnitId);
    return unit?.name || baseUnitId;
  };

  const formatDate = (dateString: string) => {
    return (
      new Date(dateString).toLocaleDateString() +
      ' ' +
      new Date(dateString).toLocaleTimeString()
    );
  };

  return (
    <Box>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
            Custom Units Manager
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {customUnits.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" sx={{ mb: 1 }}>
                No custom units saved yet.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create custom units by configuring units in your army lists and
                saving them.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {customUnits.map(unit => (
              <Card key={unit.id}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      {renamingUnit?.id === unit.id ? (
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <TextField
                            value={renamingUnit.name}
                            onChange={handleRenameInputChange}
                            onKeyDown={handleRenameKeyPress}
                            autoFocus
                            size="small"
                            sx={{ flex: 1 }}
                          />
                          <IconButton
                            color="success"
                            size="small"
                            onClick={handleSaveRename}
                          >
                            <Save />
                          </IconButton>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={handleCancelRename}
                          >
                            <Close />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Typography variant="h6" component="h3">
                            {unit.name}
                          </Typography>
                          <Chip
                            label="Custom"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>

                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Base Unit:
                      </Typography>
                      <Typography variant="body2">
                        {getBaseUnitName(unit.baseUnitId)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Faction:
                      </Typography>
                      <Typography variant="body2">
                        {getFactionName(unit.faction)}
                      </Typography>
                    </Box>
                    {unit.subfaction && (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Subfaction:
                        </Typography>
                        <Typography variant="body2">
                          {getSubfactionName(unit.subfaction)}
                        </Typography>
                      </Box>
                    )}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Created:
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(unit.createdAt)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Updated:
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(unit.updatedAt)}
                      </Typography>
                    </Box>
                    {unit.description && (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Description:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ maxWidth: '60%', textAlign: 'right' }}
                        >
                          {unit.description}
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleEditUnit(unit.id)}
                      title="Edit unit configuration"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleStartRename(unit)}
                      title="Rename unit"
                    >
                      Rename
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<Delete />}
                      onClick={() => handleDeleteUnit(unit)}
                      title="Delete unit"
                    >
                      Delete
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Container>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!deleteConfirmUnit}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Custom Unit</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Are you sure you want to delete "{deleteConfirmUnit?.name}"?
          </Typography>
          <Alert severity="warning">This action cannot be undone.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unit Management Modal */}
      {showUnitManagementModal && editingUnit && (
        <UnitManagementModal
          isOpen={showUnitManagementModal}
          unit={{
            id: `${editingUnit.baseUnitId}-edit`,
            unitId: editingUnit.baseUnitId,
            customName: undefined,
            size: 1,
            points: 0,
            slotId: 'custom-edit',
            models: {},
            wargear: [],
            weapons: {},
            upgrades: editingUnit.upgrades,
            primeAdvantages: editingUnit.primeAdvantages,
            specialRules: [],
            specialRuleValues: {},
            modelModifications: {},
            modelInstanceWeaponChanges: editingUnit.modelInstanceWeaponChanges,
            modelInstanceWargearChanges:
              editingUnit.modelInstanceWargearChanges,
          }}
          slotId="custom-edit"
          detachmentId="custom-edit"
          armyList={{
            id: 'custom-edit',
            name: 'Custom Unit Edit',
            faction: editingUnit.faction,
            allegiance: 'Universal',
            pointsLimit: 0,
            totalPoints: 0,
            detachments: [],
            validationErrors: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isNamed: true,
          }}
          onClose={handleUnitManagementClose}
          onUnitUpdated={handleUnitUpdated}
          faction={editingUnit.faction}
          subfaction={editingUnit.subfaction}
          customUnitData={{
            id: editingUnit.id,
            name: editingUnit.name,
            baseUnitId: editingUnit.baseUnitId,
            faction: editingUnit.faction,
            subfaction: editingUnit.subfaction,
            createdAt: editingUnit.createdAt,
            updatedAt: editingUnit.updatedAt,
          }}
        />
      )}
    </Box>
  );
};

export default CustomUnitsManager;
