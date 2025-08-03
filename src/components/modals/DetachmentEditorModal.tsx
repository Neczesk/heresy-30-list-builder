import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Chip,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { DataLoader } from '../../utils/dataLoader';
import DetachmentSlots from '../../pages/listBuilder/DetachmentSlots';
import UnitManagementModal from '../../pages/listBuilder/UnitManagementModal';
import type { CustomDetachment, ArmyDetachment, ArmyUnit } from '../../types/army';

interface DetachmentEditorModalProps {
  isOpen: boolean;
  customDetachment: CustomDetachment;
  onClose: () => void;
  onSave: (updatedDetachment: CustomDetachment) => void;
}

const DetachmentEditorModal: React.FC<DetachmentEditorModalProps> = ({
  isOpen,
  customDetachment,
  onClose,
  onSave,
}) => {
  const [detachment, setDetachment] = useState<ArmyDetachment | null>(null);
  const [showUnitManagementModal, setShowUnitManagementModal] = useState(false);
  const [unitManagementInfo, setUnitManagementInfo] = useState<{
    unit: ArmyUnit;
    slotId: string;
    detachmentId: string;
  } | null>(null);
  const [showDetachmentPrompt, setShowDetachmentPrompt] = useState(false);
  const [detachmentPromptInfo, setDetachmentPromptInfo] = useState<{
    roleId: string;
    slotIndex: number;
  } | null>(null);

  // Initialize detachment data when modal opens
  useEffect(() => {
    if (isOpen && customDetachment) {
      const baseDetachment = DataLoader.getDetachmentById(
        customDetachment.baseDetachmentId
      );
      const faction = DataLoader.getFactionById(customDetachment.faction);

      if (baseDetachment && faction) {
        const armyDetachment: ArmyDetachment = {
          id: `custom-${customDetachment.id}`,
          detachmentId: customDetachment.baseDetachmentId,
          customName: customDetachment.customName,
          baseSlots: baseDetachment.slots,
          modifiedSlots:
            customDetachment.units.length > 0 ? [] : baseDetachment.slots, // Will be recalculated
          units: customDetachment.units,
          primeAdvantages: customDetachment.primeAdvantages || [],
          points: 0, // Will be calculated
        };

        // Recalculate slots based on units
        const updatedDetachment = recalculateDetachmentSlots(armyDetachment);
        setDetachment(updatedDetachment);
      }
    }
  }, [isOpen, customDetachment]);

  const recalculateDetachmentSlots = (
    detachment: ArmyDetachment
  ): ArmyDetachment => {
    const modifiedSlots = [...detachment.baseSlots];
    detachment.units.forEach(unit => {
      unit.primeAdvantages?.forEach(advantage => {
        if (
          advantage.advantageId === 'logistical-benefit' &&
          advantage.slotModification
        ) {
          modifiedSlots.push({
            roleId: advantage.slotModification.roleId,
            count: advantage.slotModification.count,
            isPrime: false,
            description: `Custom slot added by Logistical Benefit for unit ${unit.unitId}`,
          });
        }
      });
    });
    return { ...detachment, modifiedSlots };
  };

  const calculateDetachmentPoints = (detachment: ArmyDetachment): number => {
    return detachment.units.reduce((total, unit) => total + unit.points, 0);
  };

  const handleUnitSelected = (slotId: string, unitId: string) => {
    if (!detachment) return;

    const unit = DataLoader.getUnitById(unitId);
    const faction = DataLoader.getFactionById(customDetachment.faction);

    if (unit && faction) {
      const newArmyUnit: ArmyUnit = {
        id: `${unitId}-${Date.now()}`,
        unitId: unitId,
        customName: undefined,
        size: 1,
        points: unit.points || 0,
        slotId: slotId,
        models: {},
        wargear: [],
        weapons: {},
        upgrades: [],
        primeAdvantages: [],
        specialRules: [],
        specialRuleValues: {},
        modelModifications: {},
        modelInstanceWeaponChanges: {},
        modelInstanceWargearChanges: {},
      };

      // Update detachment with new unit
      const updatedUnits = [...detachment.units, newArmyUnit];
      const updatedDetachment = {
        ...detachment,
        units: updatedUnits,
      };

      // Recalculate slots
      const recalculatedDetachment =
        recalculateDetachmentSlots(updatedDetachment);
      setDetachment(recalculatedDetachment);
    }
  };

  const handleUnitUpdated = (_slotId: string, updatedUnit: ArmyUnit) => {
    if (!detachment) return;

    const updatedUnits = detachment.units.map(unit =>
      unit.id === updatedUnit.id ? updatedUnit : unit
    );

    const updatedDetachment = {
      ...detachment,
      units: updatedUnits,
    };

    // Recalculate slots
    const recalculatedDetachment =
      recalculateDetachmentSlots(updatedDetachment);
    setDetachment(recalculatedDetachment);
  };

  const handleDetachmentPrompt = (roleId: string, slotIndex: number) => {
    setDetachmentPromptInfo({ roleId, slotIndex });
    setShowDetachmentPrompt(true);
  };

  const handleDetachmentPromptSelected = (
    _selectedDetachment: ArmyDetachment
  ) => {
    // Handle detachment selection if needed
    setShowDetachmentPrompt(false);
  };

  const handleUnitManagementClose = () => {
    setShowUnitManagementModal(false);
    setUnitManagementInfo(null);
  };

  const handleSave = () => {
    if (!detachment) return;

    const updatedCustomDetachment: CustomDetachment = {
      ...customDetachment,
      units: detachment.units,
      primeAdvantages: detachment.primeAdvantages,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedCustomDetachment);
  };

  const getFactionName = (factionId: string) => {
    const faction = DataLoader.getFactionById(factionId);
    return faction?.name || factionId;
  };

  const getSubfactionName = (subfactionId: string) => {
    const subfaction = DataLoader.getFactionById(subfactionId);
    return subfaction?.name || subfactionId;
  };

  const getBaseDetachmentName = (baseDetachmentId: string) => {
    const detachment = DataLoader.getDetachmentById(baseDetachmentId);
    return detachment?.name || baseDetachmentId;
  };

  if (!isOpen || !detachment) return null;

  const totalPoints = calculateDetachmentPoints(detachment);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h3">
            Edit Custom Detachment
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Detachment Info Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {customDetachment.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  label={`Based on: ${getBaseDetachmentName(customDetachment.baseDetachmentId)}`}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
                <Chip
                  label={getFactionName(customDetachment.faction)}
                  size="small"
                  variant="outlined"
                  color="secondary"
                />
                {customDetachment.subfaction && (
                  <Chip
                    label={getSubfactionName(customDetachment.subfaction)}
                    size="small"
                    variant="outlined"
                    color="info"
                  />
                )}
              </Box>
            </Box>

            <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Units:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {detachment.units.length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Points:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {totalPoints} pts
                </Typography>
              </Box>
            </Stack>

            {customDetachment.description && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Description:
                </Typography>
                <Typography variant="body2">
                  {customDetachment.description}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Detachment Slots Section */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Detachment Slots
          </Typography>
          <DetachmentSlots
            detachment={
              DataLoader.getDetachmentById(customDetachment.baseDetachmentId)!
            }
            armyDetachment={detachment}
            armyList={{
              id: 'custom-detachment-edit',
              name: customDetachment.name,
              allegiance: 'Loyalist',
              faction: 'legiones-astartes',
              subfaction: undefined,
              pointsLimit: 0,
              totalPoints: totalPoints,
              validationErrors: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isNamed: true,
              detachments: [],
            }}
            onUnitSelected={handleUnitSelected}
            onUnitUpdated={handleUnitUpdated}
            onDetachmentPrompt={handleDetachmentPrompt}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleSave}
        >
          Save Changes
        </Button>
      </DialogActions>

      {/* Unit Management Modal */}
      {showUnitManagementModal && unitManagementInfo && (
        <UnitManagementModal
          isOpen={showUnitManagementModal}
          unit={unitManagementInfo.unit}
          slotId={unitManagementInfo.slotId}
          detachmentId={unitManagementInfo.detachmentId}
          armyList={{
            id: 'custom-detachment-edit',
            name: customDetachment.name,
            allegiance: 'Loyalist',
            faction: 'legiones-astartes',
            subfaction: undefined,
            pointsLimit: 0,
            totalPoints: totalPoints,
            validationErrors: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isNamed: true,
            detachments: [],
          }}
          onClose={handleUnitManagementClose}
          onUnitUpdated={handleUnitUpdated}
          faction={customDetachment.faction}
          subfaction={customDetachment.subfaction}
        />
      )}

      {/* Detachment Prompt Modal */}
      <Dialog
        open={showDetachmentPrompt}
        onClose={() => setShowDetachmentPrompt(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select Detachment Type</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Choose a detachment type for the {detachmentPromptInfo?.roleId} slot:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={() =>
                handleDetachmentPromptSelected({
                  id: 'default',
                  detachmentId: 'default',
                  customName: 'Default',
                  points: 0,
                  baseSlots: [],
                  modifiedSlots: [],
                  primeAdvantages: [],
                  units: [],
                })
              }
            >
              Default Detachment
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default DetachmentEditorModal;
