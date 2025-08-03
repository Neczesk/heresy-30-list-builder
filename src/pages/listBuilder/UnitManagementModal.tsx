import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Alert,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close,
  Settings,
  Save,
  Add,
  Remove,
  ExpandMore,
} from '@mui/icons-material';
import { DataLoader } from '../../utils/dataLoader';
import { CustomUnitStorage } from '../../utils/customUnitStorage';
import { UpgradeValidator } from '../../utils/upgradeValidator';
import type { UpgradeValidationContext } from '../../utils/upgradeValidator';
import {
  getDetachmentsTriggeredByUnit,
  canTriggerMoreDetachments,
} from '../../utils/detachmentUtils';
import { UnitViewer } from '../../components/UnitViewer';
import SaveCustomUnitModal from '../../components/modals/SaveCustomUnitModal';
import type { Army, ArmyUnit, PrimeAdvantage } from '../../types/army';

interface UnitManagementModalProps {
  isOpen: boolean;
  unit: ArmyUnit;
  slotId: string;
  detachmentId: string;
  armyList: Army;
  onClose: () => void;
  onUnitUpdated: (slotId: string, updatedUnit: ArmyUnit) => void;
  onDetachmentPrompt?: (
    roleId: string,
    slotIndex: number,
    detachmentId?: string
  ) => void;
  onDetachmentRemoved?: (detachmentId: string) => void;
  faction: string;
  subfaction?: string;
  // Custom unit data for editing custom units
  customUnitData?: {
    id: string;
    name: string;
    baseUnitId: string;
    faction: string;
    subfaction?: string;
    createdAt: string;
    updatedAt: string;
  };
}

const UnitManagementModal: React.FC<UnitManagementModalProps> = ({
  isOpen,
  unit,
  slotId,
  detachmentId,
  armyList,
  onClose,
  onUnitUpdated,
  onDetachmentPrompt,
  onDetachmentRemoved,
  faction,
  subfaction,
  customUnitData,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [activeTab, setActiveTab] = useState<
    'unit' | 'upgrades' | 'detachments' | 'prime' | 'custom'
  >('unit');
  const [showSaveCustomUnitModal, setShowSaveCustomUnitModal] = useState(false);
  const [showOverwriteSuccess, setShowOverwriteSuccess] = useState(false);

  // Initialize selected upgrades from existing unit upgrades
  const initializeSelectedUpgrades = () => {
    const upgrades: {
      upgradeId: string;
      optionId?: string;
      count: number;
      points: number;
    }[] = [];

    // Add existing upgrades
    unit.upgrades.forEach(u => {
      upgrades.push({
        upgradeId: u.upgradeId,
        optionId: u.optionId,
        count: u.count,
        points: u.points,
      });
    });

    return upgrades;
  };

  const [selectedUpgrades, setSelectedUpgrades] = useState<
    { upgradeId: string; optionId?: string; count: number; points: number }[]
  >(initializeSelectedUpgrades());

  // Function to automatically save upgrades when they change
  const saveUpgrades = (
    newUpgrades: {
      upgradeId: string;
      optionId?: string;
      count: number;
      points: number;
    }[]
  ) => {
    const updatedUnit = {
      ...unit,
      upgrades: newUpgrades,
      models: calculateEffectiveModelCounts(),
    };
    onUnitUpdated(slotId, updatedUnit);
  };

  const [selectedPrimeAdvantages, setSelectedPrimeAdvantages] = useState<
    string[]
  >(() => {
    // Get prime advantages from the unit itself
    return unit.primeAdvantages?.map(pa => pa.advantageId) || [];
  });

  // Update selectedPrimeAdvantages when unit changes
  useEffect(() => {
    setSelectedPrimeAdvantages(
      unit.primeAdvantages?.map(pa => pa.advantageId) || []
    );
  }, [unit.primeAdvantages]);

  // Switch away from prime tab if unit is no longer in a prime slot
  useEffect(() => {
    if (activeTab === 'prime' && !isInPrimeSlot()) {
      setActiveTab('unit');
    }
  }, [activeTab, unit.slotId]);

  // Track accordion expansion states
  const [expandedModelSections, setExpandedModelSections] = useState<{
    [modelId: string]: boolean;
  }>({});
  const [expandedUpgradeGroups, setExpandedUpgradeGroups] = useState<{
    [upgradeGroupId: string]: boolean;
  }>({});

  // Get base unit data for reference
  const baseUnitData = DataLoader.getUnitById(unit.unitId);

  if (!isOpen || !baseUnitData) return null;

  // Parse slotId to get roleId and slotIndex
  const slotParts = slotId.split('-');
  const roleId = slotParts[slotParts.length - 2];
  const slotIndex = parseInt(slotParts[slotParts.length - 1]);

  // Check if this unit can trigger detachments
  const canTriggerDetachments =
    roleId === 'command' || roleId === 'high-command';

  // Check for "Officer of the Line" special rule and get its value
  const officerOfTheLineRule = baseUnitData.specialRules?.find(
    ruleId => ruleId === 'officer-of-the-line'
  );
  const maxDetachments = officerOfTheLineRule
    ? baseUnitData.specialRuleValues?.['officer-of-the-line'] || 1
    : 1;

  // Get detachments triggered by this unit
  const triggeredDetachments = getDetachmentsTriggeredByUnit(armyList, unit.id);
  const currentDetachmentCount = triggeredDetachments.length;

  // Calculate upgrade points
  const calculateUpgradePoints = () => {
    return selectedUpgrades.reduce((total, upgrade) => {
      return total + upgrade.points * upgrade.count;
    }, 0);
  };

  const totalUnitPoints = baseUnitData.points + calculateUpgradePoints();

  // Calculate effective model counts based on upgrades
  const calculateEffectiveModelCounts = () => {
    const effectiveCounts = { ...unit.models };

    selectedUpgrades.forEach(upgrade => {
      const upgradeData = DataLoader.getUpgradeById(upgrade.upgradeId);
      if (!upgradeData) return;

      // Handle model-count upgrades
      if (upgradeData.type === 'model-count' && upgradeData.targetModel) {
        const currentCount = effectiveCounts[upgradeData.targetModel] || 0;
        effectiveCounts[upgradeData.targetModel] = currentCount + upgrade.count;
      }

      // Handle model-group-count upgrades
      if (
        upgradeData.type === 'model-group-count' &&
        upgradeData.targetModels
      ) {
        Object.entries(upgradeData.targetModels).forEach(([modelId, count]) => {
          const currentCount = effectiveCounts[modelId] || 0;
          effectiveCounts[modelId] = currentCount + count * upgrade.count;
        });
      }
    });

    return effectiveCounts;
  };

  const effectiveModelCounts = calculateEffectiveModelCounts();

  // Function to get upgrade groups for a model type
  const getUpgradeGroupsForModel = (modelType: string) => {
    const upgradeGroups = DataLoader.getUpgradeGroupsForModel(modelType);
    return upgradeGroups;
  };

  // Check if this unit is in a prime slot
  const isInPrimeSlot = () => {
    // Find detachment by instance ID
    const detachment = armyList.detachments.find(d => d.id === detachmentId);
    if (!detachment) return false;

    // Use modifiedSlots if available, otherwise fall back to base slots
    const slotsToCheck =
      detachment.modifiedSlots.length > 0
        ? detachment.modifiedSlots
        : detachment.baseSlots;

    // Try different slot ID formats
    let roleId: string;
    let slotIndex: number;

    // Check if slotId is actually the detachment ID (for triggered detachments)
    if (slotId === detachmentId) {
      // This is a triggered detachment, check the first slot
      const firstSlot = slotsToCheck[0];
      if (firstSlot) {
        return firstSlot.isPrime;
      }
      return false;
    }

    // Format 1: detachmentId-roleId-slotIndex (e.g., "crusade-primary-troops-0")
    const format1Parts = slotId.split('-');
    if (format1Parts.length >= 3) {
      // Check if the first part matches the detachment ID
      if (
        format1Parts[0] === detachmentId ||
        format1Parts.slice(0, -2).join('-') === detachmentId
      ) {
        roleId = format1Parts[format1Parts.length - 2];
        slotIndex = parseInt(format1Parts[format1Parts.length - 1], 10);
      } else {
        // Format 2: roleId-slotIndex (e.g., "troops-0")
        roleId = format1Parts[0];
        slotIndex = parseInt(format1Parts[1], 10);
      }
    } else {
      // Format 3: just roleId (e.g., "tercio")
      roleId = slotId;
      slotIndex = 0; // Assume first slot of this role
    }

    if (isNaN(slotIndex)) {
      slotIndex = 0;
    }

    // Find the slot in the modified slots
    let currentSlotIndex = 0;
    for (const slot of slotsToCheck) {
      if (slot.roleId === roleId) {
        for (let i = 0; i < slot.count; i++) {
          if (currentSlotIndex === slotIndex) {
            return slot.isPrime;
          }
          currentSlotIndex++;
        }
      } else {
        // Skip slots that don't match the role
        currentSlotIndex += slot.count;
      }
    }

    return false;
  };

  const handleAddDetachment = () => {
    if (
      onDetachmentPrompt &&
      canTriggerMoreDetachments(armyList, unit, slotId, maxDetachments)
    ) {
      onDetachmentPrompt(roleId, slotIndex, detachmentId);
      onClose();
    }
  };

  const handleRemoveDetachment = (detachmentId: string) => {
    if (onDetachmentRemoved) {
      onDetachmentRemoved(detachmentId);
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            maxHeight: isMobile ? '100vh' : '90vh',
            height: isMobile ? '100vh' : 'auto',
            minHeight: isMobile ? '100vh' : '60vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            p: { xs: 2, sm: 3 },
            pb: { xs: 1, sm: 2 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              component="h3"
              sx={{
                fontSize: { xs: '1.125rem', sm: '1.5rem' },
              }}
            >
              {customUnitData
                ? `${customUnitData.name} (${baseUnitData.name})`
                : `${baseUnitData.name} Management`}
            </Typography>
            <IconButton
              onClick={onClose}
              size={isMobile ? 'medium' : 'small'}
              sx={{
                p: { xs: 1, sm: 0.5 },
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            p: { xs: 2, sm: 3 },
            pt: { xs: 0, sm: 1 },
          }}
        >
          {/* Unit Info */}
          <Card sx={{ mb: { xs: 2, sm: 3 } }}>
            <CardContent
              sx={{
                p: { xs: 2, sm: 3 },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 1, sm: 2 },
                  flexWrap: 'wrap',
                  flexDirection: { xs: 'column', sm: 'row' },
                }}
              >
                <Box sx={{ flex: 1, minWidth: { xs: 'auto', sm: 120 } }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                  >
                    Base Points
                  </Typography>
                  <Typography
                    variant={isMobile ? 'h6' : 'h6'}
                    sx={{
                      fontSize: { xs: '1.125rem', sm: '1.25rem' },
                    }}
                  >
                    {baseUnitData.points}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: { xs: 'auto', sm: 120 } }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                  >
                    Upgrade Points
                  </Typography>
                  <Typography
                    variant={isMobile ? 'h6' : 'h6'}
                    sx={{
                      fontSize: { xs: '1.125rem', sm: '1.25rem' },
                    }}
                  >
                    {calculateUpgradePoints()}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: { xs: 'auto', sm: 120 } }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                  >
                    Total Points
                  </Typography>
                  <Typography
                    variant={isMobile ? 'h6' : 'h6'}
                    color="primary"
                    sx={{
                      fontSize: { xs: '1.125rem', sm: '1.25rem' },
                    }}
                  >
                    {totalUnitPoints}
                  </Typography>
                </Box>
              </Box>

              {officerOfTheLineRule && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  ⚡ Officer of the Line - Can trigger up to {maxDetachments}{' '}
                  detachment{maxDetachments > 1 ? 's' : ''}.
                </Alert>
              )}

              {/* Custom Unit Info */}
              {customUnitData && (
                <Box
                  sx={{
                    mt: 2,
                    p: { xs: 1.5, sm: 2 },
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 1,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                  >
                    <Settings sx={{ mr: 1 }} />
                    Custom Unit Details
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: { xs: 1, sm: 2 },
                      flexDirection: { xs: 'column', sm: 'row' },
                    }}
                  >
                    <Box sx={{ flex: '1 1 200px' }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                        }}
                      >
                        Name: {customUnitData.name}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 200px' }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                        }}
                      >
                        Faction:{' '}
                        {DataLoader.getFactionById(customUnitData.faction)
                          ?.name || customUnitData.faction}
                      </Typography>
                    </Box>
                    {customUnitData.subfaction && (
                      <Box sx={{ flex: '1 1 200px' }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                          }}
                        >
                          Subfaction:{' '}
                          {DataLoader.getFactionById(customUnitData.subfaction)
                            ?.name || customUnitData.subfaction}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ flex: '1 1 200px' }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                        }}
                      >
                        Created:{' '}
                        {new Date(
                          customUnitData.createdAt
                        ).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 200px' }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                        }}
                      >
                        Modified:{' '}
                        {new Date(
                          customUnitData.updatedAt
                        ).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              mb: { xs: 1.5, sm: 2 },
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant={isMobile ? 'scrollable' : 'standard'}
              scrollButtons={isMobile ? 'auto' : false}
              sx={{
                '& .MuiTab-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  minHeight: { xs: '48px', sm: '56px' },
                  minWidth: { xs: 'auto', sm: 'auto' },
                },
              }}
            >
              <Tab label="Unit Details" value="unit" />
              <Tab label="Upgrades" value="upgrades" />
              {isInPrimeSlot() && (
                <Tab label="Prime Advantages" value="prime" />
              )}
              {canTriggerDetachments && (
                <Tab
                  label={`Detachments (${currentDetachmentCount}/${maxDetachments})`}
                  value="detachments"
                />
              )}
              <Tab label="Custom Units" value="custom" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ mt: { xs: 1.5, sm: 2 } }}>
            {activeTab === 'unit' && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Unit Details
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  View detailed information about this unit including
                  characteristics, weapons, and special rules.
                </Typography>

                {/* Unit Summary Card */}
                <Card sx={{ mb: 2 }}>
                  <CardContent sx={{ py: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6" sx={{ flex: 1 }}>
                        {baseUnitData.name}
                      </Typography>
                      <Chip
                        label={baseUnitData.battlefieldRole}
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Box
                      sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 1 }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          component="span"
                        >
                          Size:{' '}
                          {Object.values(baseUnitData.models).reduce(
                            (a, b) => a + b,
                            0
                          )}{' '}
                          models
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          component="span"
                        >
                          Base: {baseUnitData.points} pts
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          color="primary"
                          component="span"
                          sx={{ fontWeight: 'medium' }}
                        >
                          Total: {totalUnitPoints} pts
                        </Typography>
                      </Box>
                    </Box>
                    {baseUnitData.description && (
                      <Typography variant="body2" color="text.secondary">
                        {baseUnitData.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>

                {/* Unit Viewer Component */}
                <UnitViewer
                  unit={baseUnitData}
                  armyUnit={{
                    ...unit,
                    models: effectiveModelCounts,
                  }}
                  selectedUpgrades={selectedUpgrades}
                />
              </Box>
            )}

            {activeTab === 'upgrades' && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Unit Upgrades
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Configure upgrades for this unit. Available upgrades depend on
                  the unit's models and current configuration.
                </Typography>

                {/* Unit-Level Upgrades */}
                {baseUnitData.upgrades && baseUnitData.upgrades.length > 0 && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Unit-Level Upgrades
                      </Typography>
                      <Stack spacing={2}>
                        {baseUnitData.upgrades.map(upgradeId => {
                          const upgrade = DataLoader.getUpgradeById(upgradeId);
                          if (!upgrade) return null;

                          // Create validation context
                          const validationContext: UpgradeValidationContext = {
                            selectedUpgrades,
                            previewModels: effectiveModelCounts,
                            baseUnitData,
                          };

                          const maxCount = UpgradeValidator.getMaxCount(
                            upgrade,
                            validationContext
                          );
                          const isAvailable =
                            UpgradeValidator.isUpgradeAvailable(
                              upgrade,
                              validationContext
                            );
                          const currentCount = selectedUpgrades
                            .filter(u => u.upgradeId === upgrade.id)
                            .reduce((sum, u) => sum + u.count, 0);

                          return (
                            <Box
                              key={upgrade.id}
                              sx={{
                                p: 2,
                                border: 1,
                                borderColor: 'grey.300',
                                borderRadius: 1,
                                bgcolor: 'grey.50',
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                }}
                              >
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle1" gutterBottom>
                                    {upgrade.name}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 1 }}
                                  >
                                    {upgrade.description}
                                  </Typography>

                                  {/* Upgrade Options */}
                                  {upgrade.options &&
                                  upgrade.options.length > 0 ? (
                                    <Stack spacing={1}>
                                      {upgrade.options.map(option => {
                                        const optionCount = selectedUpgrades
                                          .filter(
                                            u =>
                                              u.upgradeId === upgrade.id &&
                                              u.optionId === option.id
                                          )
                                          .reduce((sum, u) => sum + u.count, 0);

                                        return (
                                          <Box
                                            key={option.id}
                                            sx={{
                                              p: 1,
                                              border: 1,
                                              borderColor: 'primary.main',
                                              borderRadius: 1,
                                              bgcolor: 'primary.50',
                                            }}
                                          >
                                            <Box
                                              sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                              }}
                                            >
                                              <Box>
                                                <Typography
                                                  variant="body2"
                                                  fontWeight="medium"
                                                >
                                                  {option.name}
                                                </Typography>
                                                <Typography
                                                  variant="body2"
                                                  color="text.secondary"
                                                >
                                                  {option.description}
                                                </Typography>
                                                <Typography
                                                  variant="body2"
                                                  color="primary"
                                                >
                                                  {option.points} points each
                                                </Typography>
                                              </Box>
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 1,
                                                }}
                                              >
                                                <IconButton
                                                  size="small"
                                                  disabled={
                                                    !isAvailable ||
                                                    optionCount <= 0
                                                  }
                                                  onClick={() => {
                                                    const newUpgrades = [
                                                      ...selectedUpgrades,
                                                    ];
                                                    const existingIndex =
                                                      newUpgrades.findIndex(
                                                        u =>
                                                          u.upgradeId ===
                                                            upgrade.id &&
                                                          u.optionId ===
                                                            option.id
                                                      );
                                                    if (existingIndex >= 0) {
                                                      if (
                                                        newUpgrades[
                                                          existingIndex
                                                        ].count > 1
                                                      ) {
                                                        newUpgrades[
                                                          existingIndex
                                                        ].count--;
                                                      } else {
                                                        newUpgrades.splice(
                                                          existingIndex,
                                                          1
                                                        );
                                                      }
                                                    }
                                                    setSelectedUpgrades(
                                                      newUpgrades
                                                    );
                                                    saveUpgrades(newUpgrades);
                                                  }}
                                                >
                                                  <Remove />
                                                </IconButton>
                                                <Typography
                                                  variant="body2"
                                                  sx={{
                                                    minWidth: 30,
                                                    textAlign: 'center',
                                                  }}
                                                >
                                                  {optionCount}
                                                </Typography>
                                                <IconButton
                                                  size="small"
                                                  disabled={
                                                    !isAvailable ||
                                                    optionCount >= maxCount
                                                  }
                                                  onClick={() => {
                                                    const newUpgrades = [
                                                      ...selectedUpgrades,
                                                    ];
                                                    const existingIndex =
                                                      newUpgrades.findIndex(
                                                        u =>
                                                          u.upgradeId ===
                                                            upgrade.id &&
                                                          u.optionId ===
                                                            option.id
                                                      );
                                                    if (existingIndex >= 0) {
                                                      newUpgrades[existingIndex]
                                                        .count++;
                                                    } else {
                                                      newUpgrades.push({
                                                        upgradeId: upgrade.id,
                                                        optionId: option.id,
                                                        count: 1,
                                                        points: option.points,
                                                      });
                                                    }
                                                    setSelectedUpgrades(
                                                      newUpgrades
                                                    );
                                                    saveUpgrades(newUpgrades);
                                                  }}
                                                >
                                                  <Add />
                                                </IconButton>
                                              </Box>
                                            </Box>
                                          </Box>
                                        );
                                      })}
                                    </Stack>
                                  ) : (
                                    /* Simple upgrade without options */
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        color="primary"
                                      >
                                        {upgrade.maxCount === 'dependent'
                                          ? 'Variable'
                                          : upgrade.maxCount || 1}{' '}
                                        available
                                      </Typography>
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1,
                                        }}
                                      >
                                        <IconButton
                                          size="small"
                                          disabled={
                                            !isAvailable || currentCount <= 0
                                          }
                                          onClick={() => {
                                            const newUpgrades = [
                                              ...selectedUpgrades,
                                            ];
                                            const existingIndex =
                                              newUpgrades.findIndex(
                                                u => u.upgradeId === upgrade.id
                                              );
                                            if (existingIndex >= 0) {
                                              if (
                                                newUpgrades[existingIndex]
                                                  .count > 1
                                              ) {
                                                newUpgrades[existingIndex]
                                                  .count--;
                                              } else {
                                                newUpgrades.splice(
                                                  existingIndex,
                                                  1
                                                );
                                              }
                                            }
                                            setSelectedUpgrades(newUpgrades);
                                            saveUpgrades(newUpgrades);
                                          }}
                                        >
                                          <Remove />
                                        </IconButton>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            minWidth: 30,
                                            textAlign: 'center',
                                          }}
                                        >
                                          {currentCount}
                                        </Typography>
                                        <IconButton
                                          size="small"
                                          disabled={
                                            !isAvailable ||
                                            currentCount >= maxCount
                                          }
                                          onClick={() => {
                                            const newUpgrades = [
                                              ...selectedUpgrades,
                                            ];
                                            const existingIndex =
                                              newUpgrades.findIndex(
                                                u => u.upgradeId === upgrade.id
                                              );
                                            if (existingIndex >= 0) {
                                              newUpgrades[existingIndex]
                                                .count++;
                                            } else {
                                              newUpgrades.push({
                                                upgradeId: upgrade.id,
                                                count: 1,
                                                points: 0,
                                              });
                                            }
                                            setSelectedUpgrades(newUpgrades);
                                            saveUpgrades(newUpgrades);
                                          }}
                                        >
                                          <Add />
                                        </IconButton>
                                      </Box>
                                    </Box>
                                  )}
                                </Box>
                              </Box>

                              {/* Availability Status */}
                              {!isAvailable && (
                                <Alert severity="warning" sx={{ mt: 1 }}>
                                  This upgrade is not currently available.
                                </Alert>
                              )}
                            </Box>
                          );
                        })}
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                {/* Model-Level Upgrades */}
                {baseUnitData.modelUpgrades &&
                  Object.keys(baseUnitData.modelUpgrades).length > 0 && (
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Model-Level Upgrades
                        </Typography>
                        <Stack spacing={1}>
                          {Object.entries(baseUnitData.modelUpgrades).map(
                            ([modelId, _upgradeGroupIds]) => {
                              const model = DataLoader.getModelById(modelId);
                              const modelCount =
                                effectiveModelCounts[modelId] || 0;

                              if (!model || modelCount === 0) return null;

                              const isModelExpanded =
                                expandedModelSections[modelId] || false;

                              return (
                                <Accordion
                                  key={modelId}
                                  expanded={isModelExpanded}
                                  onChange={() =>
                                    setExpandedModelSections(prev => ({
                                      ...prev,
                                      [modelId]: !isModelExpanded,
                                    }))
                                  }
                                  sx={{
                                    '&:before': { display: 'none' },
                                    border: 1,
                                    borderColor: 'secondary.main',
                                    bgcolor: 'secondary.50',
                                  }}
                                >
                                  <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="subtitle1">
                                      {model.name} ({modelCount} models)
                                    </Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <Stack spacing={1}>
                                      {getUpgradeGroupsForModel(modelId).map(
                                        upgradeGroup => {
                                          if (!upgradeGroup) return null;

                                          const isUpgradeGroupExpanded =
                                            expandedUpgradeGroups[
                                              upgradeGroup.id
                                            ] || false;

                                          return (
                                            <Accordion
                                              key={upgradeGroup.id}
                                              expanded={isUpgradeGroupExpanded}
                                              onChange={() =>
                                                setExpandedUpgradeGroups(
                                                  prev => ({
                                                    ...prev,
                                                    [upgradeGroup.id]:
                                                      !isUpgradeGroupExpanded,
                                                  })
                                                )
                                              }
                                              sx={{
                                                '&:before': { display: 'none' },
                                                border: 1,
                                                borderColor: 'grey.300',
                                                bgcolor: 'white',
                                              }}
                                            >
                                              <AccordionSummary
                                                expandIcon={<ExpandMore />}
                                              >
                                                <Box
                                                  sx={{
                                                    display: 'flex',
                                                    justifyContent:
                                                      'space-between',
                                                    alignItems: 'center',
                                                    width: '100%',
                                                  }}
                                                >
                                                  <Typography
                                                    variant="body2"
                                                    fontWeight="medium"
                                                  >
                                                    {upgradeGroup.name}
                                                  </Typography>
                                                </Box>
                                              </AccordionSummary>
                                              <AccordionDetails>
                                                <Typography
                                                  variant="body2"
                                                  color="text.secondary"
                                                  sx={{ mb: 2 }}
                                                >
                                                  {upgradeGroup.description}
                                                </Typography>

                                                {/* Upgrades in this group */}
                                                <Stack spacing={1}>
                                                  {upgradeGroup.upgrades.map(
                                                    (upgradeId: string) => {
                                                      const upgrade =
                                                        DataLoader.getUpgradeById(
                                                          upgradeId
                                                        );
                                                      if (!upgrade) return null;

                                                      // Create validation context for this model
                                                      const validationContext: UpgradeValidationContext =
                                                        {
                                                          selectedUpgrades,
                                                          previewModels: {
                                                            [modelId]:
                                                              modelCount,
                                                          },
                                                          baseUnitData,
                                                        };

                                                      const maxCount =
                                                        UpgradeValidator.getMaxCount(
                                                          upgrade,
                                                          validationContext
                                                        );
                                                      const isAvailable =
                                                        UpgradeValidator.isUpgradeAvailable(
                                                          upgrade,
                                                          validationContext
                                                        );
                                                      const currentCount =
                                                        selectedUpgrades
                                                          .filter(
                                                            u =>
                                                              u.upgradeId ===
                                                              upgrade.id
                                                          )
                                                          .reduce(
                                                            (sum, u) =>
                                                              sum + u.count,
                                                            0
                                                          );

                                                      return (
                                                        <Box
                                                          key={upgrade.id}
                                                          sx={{
                                                            p: 2,
                                                            border: 1,
                                                            borderColor:
                                                              'primary.main',
                                                            borderRadius: 1,
                                                            bgcolor:
                                                              'primary.50',
                                                          }}
                                                        >
                                                          <Typography
                                                            variant="body2"
                                                            fontWeight="medium"
                                                            gutterBottom
                                                          >
                                                            {upgrade.name}
                                                          </Typography>
                                                          <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ mb: 1 }}
                                                          >
                                                            {
                                                              upgrade.description
                                                            }
                                                          </Typography>

                                                          {/* Upgrade Options */}
                                                          {upgrade.options &&
                                                          upgrade.options
                                                            .length > 0 ? (
                                                            <Stack spacing={1}>
                                                              {upgrade.options.map(
                                                                option => {
                                                                  const optionCount =
                                                                    selectedUpgrades
                                                                      .filter(
                                                                        u =>
                                                                          u.upgradeId ===
                                                                            upgrade.id &&
                                                                          u.optionId ===
                                                                            option.id
                                                                      )
                                                                      .reduce(
                                                                        (
                                                                          sum,
                                                                          u
                                                                        ) =>
                                                                          sum +
                                                                          u.count,
                                                                        0
                                                                      );

                                                                  return (
                                                                    <Box
                                                                      key={
                                                                        option.id
                                                                      }
                                                                      sx={{
                                                                        p: 1,
                                                                        border: 1,
                                                                        borderColor:
                                                                          'secondary.main',
                                                                        borderRadius: 1,
                                                                        bgcolor:
                                                                          'secondary.50',
                                                                      }}
                                                                    >
                                                                      <Box
                                                                        sx={{
                                                                          display:
                                                                            'flex',
                                                                          justifyContent:
                                                                            'space-between',
                                                                          alignItems:
                                                                            'center',
                                                                        }}
                                                                      >
                                                                        <Box>
                                                                          <Typography
                                                                            variant="body2"
                                                                            fontWeight="medium"
                                                                          >
                                                                            {
                                                                              option.name
                                                                            }
                                                                          </Typography>
                                                                          <Typography
                                                                            variant="body2"
                                                                            color="text.secondary"
                                                                          >
                                                                            {
                                                                              option.description
                                                                            }
                                                                          </Typography>
                                                                          <Typography
                                                                            variant="body2"
                                                                            color="primary"
                                                                          >
                                                                            {
                                                                              option.points
                                                                            }{' '}
                                                                            points
                                                                            each
                                                                          </Typography>
                                                                        </Box>
                                                                        <Box
                                                                          sx={{
                                                                            display:
                                                                              'flex',
                                                                            alignItems:
                                                                              'center',
                                                                            gap: 1,
                                                                          }}
                                                                        >
                                                                          <IconButton
                                                                            size="small"
                                                                            disabled={
                                                                              !isAvailable ||
                                                                              optionCount <=
                                                                                0
                                                                            }
                                                                            onClick={() => {
                                                                              const newUpgrades =
                                                                                [
                                                                                  ...selectedUpgrades,
                                                                                ];
                                                                              const existingIndex =
                                                                                newUpgrades.findIndex(
                                                                                  u =>
                                                                                    u.upgradeId ===
                                                                                      upgrade.id &&
                                                                                    u.optionId ===
                                                                                      option.id
                                                                                );
                                                                              if (
                                                                                existingIndex >=
                                                                                0
                                                                              ) {
                                                                                if (
                                                                                  newUpgrades[
                                                                                    existingIndex
                                                                                  ]
                                                                                    .count >
                                                                                  1
                                                                                ) {
                                                                                  newUpgrades[
                                                                                    existingIndex
                                                                                  ]
                                                                                    .count--;
                                                                                } else {
                                                                                  newUpgrades.splice(
                                                                                    existingIndex,
                                                                                    1
                                                                                  );
                                                                                }
                                                                              }
                                                                              setSelectedUpgrades(
                                                                                newUpgrades
                                                                              );
                                                                              saveUpgrades(
                                                                                newUpgrades
                                                                              );
                                                                            }}
                                                                          >
                                                                            <Remove />
                                                                          </IconButton>
                                                                          <Typography
                                                                            variant="body2"
                                                                            sx={{
                                                                              minWidth: 30,
                                                                              textAlign:
                                                                                'center',
                                                                            }}
                                                                          >
                                                                            {
                                                                              optionCount
                                                                            }
                                                                          </Typography>
                                                                          <IconButton
                                                                            size="small"
                                                                            disabled={
                                                                              !isAvailable ||
                                                                              optionCount >=
                                                                                maxCount
                                                                            }
                                                                            onClick={() => {
                                                                              const newUpgrades =
                                                                                [
                                                                                  ...selectedUpgrades,
                                                                                ];
                                                                              const existingIndex =
                                                                                newUpgrades.findIndex(
                                                                                  u =>
                                                                                    u.upgradeId ===
                                                                                      upgrade.id &&
                                                                                    u.optionId ===
                                                                                      option.id
                                                                                );
                                                                              if (
                                                                                existingIndex >=
                                                                                0
                                                                              ) {
                                                                                newUpgrades[
                                                                                  existingIndex
                                                                                ]
                                                                                  .count++;
                                                                              } else {
                                                                                newUpgrades.push(
                                                                                  {
                                                                                    upgradeId:
                                                                                      upgrade.id,
                                                                                    optionId:
                                                                                      option.id,
                                                                                    count: 1,
                                                                                    points:
                                                                                      option.points,
                                                                                  }
                                                                                );
                                                                              }
                                                                              setSelectedUpgrades(
                                                                                newUpgrades
                                                                              );
                                                                              saveUpgrades(
                                                                                newUpgrades
                                                                              );
                                                                            }}
                                                                          >
                                                                            <Add />
                                                                          </IconButton>
                                                                        </Box>
                                                                      </Box>
                                                                    </Box>
                                                                  );
                                                                }
                                                              )}
                                                            </Stack>
                                                          ) : (
                                                            /* Simple upgrade without options */
                                                            <Box
                                                              sx={{
                                                                display: 'flex',
                                                                justifyContent:
                                                                  'space-between',
                                                                alignItems:
                                                                  'center',
                                                              }}
                                                            >
                                                              <Typography
                                                                variant="body2"
                                                                color="primary"
                                                              >
                                                                {upgrade.maxCount ===
                                                                'dependent'
                                                                  ? 'Variable'
                                                                  : upgrade.maxCount ||
                                                                    1}{' '}
                                                                available
                                                              </Typography>
                                                              <Box
                                                                sx={{
                                                                  display:
                                                                    'flex',
                                                                  alignItems:
                                                                    'center',
                                                                  gap: 1,
                                                                }}
                                                              >
                                                                <IconButton
                                                                  size="small"
                                                                  disabled={
                                                                    !isAvailable ||
                                                                    currentCount <=
                                                                      0
                                                                  }
                                                                  onClick={() => {
                                                                    const newUpgrades =
                                                                      [
                                                                        ...selectedUpgrades,
                                                                      ];
                                                                    const existingIndex =
                                                                      newUpgrades.findIndex(
                                                                        u =>
                                                                          u.upgradeId ===
                                                                          upgrade.id
                                                                      );
                                                                    if (
                                                                      existingIndex >=
                                                                      0
                                                                    ) {
                                                                      if (
                                                                        newUpgrades[
                                                                          existingIndex
                                                                        ]
                                                                          .count >
                                                                        1
                                                                      ) {
                                                                        newUpgrades[
                                                                          existingIndex
                                                                        ]
                                                                          .count--;
                                                                      } else {
                                                                        newUpgrades.splice(
                                                                          existingIndex,
                                                                          1
                                                                        );
                                                                      }
                                                                    }
                                                                    setSelectedUpgrades(
                                                                      newUpgrades
                                                                    );
                                                                    saveUpgrades(
                                                                      newUpgrades
                                                                    );
                                                                  }}
                                                                >
                                                                  <Remove />
                                                                </IconButton>
                                                                <Typography
                                                                  variant="body2"
                                                                  sx={{
                                                                    minWidth: 30,
                                                                    textAlign:
                                                                      'center',
                                                                  }}
                                                                >
                                                                  {currentCount}
                                                                </Typography>
                                                                <IconButton
                                                                  size="small"
                                                                  disabled={
                                                                    !isAvailable ||
                                                                    currentCount >=
                                                                      maxCount
                                                                  }
                                                                  onClick={() => {
                                                                    const newUpgrades =
                                                                      [
                                                                        ...selectedUpgrades,
                                                                      ];
                                                                    const existingIndex =
                                                                      newUpgrades.findIndex(
                                                                        u =>
                                                                          u.upgradeId ===
                                                                          upgrade.id
                                                                      );
                                                                    if (
                                                                      existingIndex >=
                                                                      0
                                                                    ) {
                                                                      newUpgrades[
                                                                        existingIndex
                                                                      ].count++;
                                                                    } else {
                                                                      newUpgrades.push(
                                                                        {
                                                                          upgradeId:
                                                                            upgrade.id,
                                                                          count: 1,
                                                                          points: 0,
                                                                        }
                                                                      );
                                                                    }
                                                                    setSelectedUpgrades(
                                                                      newUpgrades
                                                                    );
                                                                    saveUpgrades(
                                                                      newUpgrades
                                                                    );
                                                                  }}
                                                                >
                                                                  <Add />
                                                                </IconButton>
                                                              </Box>
                                                            </Box>
                                                          )}

                                                          {/* Availability Status */}
                                                          {!isAvailable && (
                                                            <Alert
                                                              severity="warning"
                                                              sx={{ mt: 1 }}
                                                            >
                                                              This upgrade is
                                                              not currently
                                                              available.
                                                            </Alert>
                                                          )}
                                                        </Box>
                                                      );
                                                    }
                                                  )}
                                                </Stack>
                                              </AccordionDetails>
                                            </Accordion>
                                          );
                                        }
                                      )}
                                    </Stack>
                                  </AccordionDetails>
                                </Accordion>
                              );
                            }
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  )}

                {/* No Upgrades Available */}
                {(!baseUnitData.upgrades ||
                  baseUnitData.upgrades.length === 0) &&
                  (!baseUnitData.modelUpgrades ||
                    Object.keys(baseUnitData.modelUpgrades).length === 0) && (
                    <Alert severity="info">
                      No upgrades available for this unit.
                    </Alert>
                  )}
              </Box>
            )}

            {activeTab === 'prime' && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Prime Advantages
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {isInPrimeSlot()
                    ? 'This unit is in a prime slot and can be assigned prime advantages.'
                    : 'This unit is not in a prime slot, but you can still view available prime advantages.'}
                </Typography>

                {(() => {
                  const primeAdvantages = DataLoader.getPrimeAdvantages();
                  const availableAdvantages = primeAdvantages.filter(
                    advantage => {
                      // Check restrictions based on unit's battlefield role
                      const baseUnit = DataLoader.getUnitById(unit.unitId);
                      if (!baseUnit) return false;

                      // Check role-based restrictions
                      if (advantage.restrictions) {
                        for (const restriction of advantage.restrictions) {
                          if (
                            restriction.includes('Troops') &&
                            baseUnit.battlefieldRole !== 'Troops'
                          ) {
                            return false;
                          }
                          if (
                            restriction.includes('Command') &&
                            baseUnit.battlefieldRole !== 'Command'
                          ) {
                            return false;
                          }
                          if (
                            restriction.includes('High Command') &&
                            baseUnit.battlefieldRole !== 'High Command'
                          ) {
                            return false;
                          }
                        }
                      }

                      return true;
                    }
                  );

                  return (
                    <Stack spacing={2}>
                      {availableAdvantages.map(advantage => {
                        const isSelected =
                          unit.primeAdvantages?.some(
                            pa => pa.advantageId === advantage.id
                          ) || false;
                        const isLogisticalBenefit =
                          advantage.id === 'logistical-benefit';

                        return (
                          <Card
                            key={advantage.id}
                            variant={isSelected ? 'elevation' : 'outlined'}
                            elevation={isSelected ? 4 : 1}
                            sx={{
                              cursor: 'pointer',
                              borderColor: isSelected
                                ? 'primary.main'
                                : undefined,
                              '&:hover': {
                                borderColor: 'primary.main',
                                boxShadow: 2,
                              },
                            }}
                            onClick={() => {
                              if (isSelected) {
                                // Remove the advantage
                                const newAdvantages =
                                  selectedPrimeAdvantages.filter(
                                    id => id !== advantage.id
                                  );
                                setSelectedPrimeAdvantages(newAdvantages);

                                // Update the unit
                                const updatedUnit = {
                                  ...unit,
                                  primeAdvantages: unit.primeAdvantages.filter(
                                    pa => pa.advantageId !== advantage.id
                                  ),
                                };
                                onUnitUpdated(slotId, updatedUnit);
                              } else {
                                // Add the advantage
                                const newAdvantages = [
                                  ...selectedPrimeAdvantages,
                                  advantage.id,
                                ];
                                setSelectedPrimeAdvantages(newAdvantages);

                                // Create the prime advantage object
                                const primeAdvantage: PrimeAdvantage = {
                                  advantageId: advantage.id,
                                  slotId: slotId,
                                  description: advantage.description,
                                  effect: advantage.effect,
                                  ...(isLogisticalBenefit && {
                                    slotModification: {
                                      roleId: 'troops', // Default to troops, user can change this
                                      count: 1,
                                    },
                                  }),
                                };

                                // Update the unit
                                const updatedUnit = {
                                  ...unit,
                                  primeAdvantages: [
                                    ...(unit.primeAdvantages || []),
                                    primeAdvantage,
                                  ],
                                };
                                onUnitUpdated(slotId, updatedUnit);
                              }
                            }}
                          >
                            <CardContent>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  mb: 1,
                                }}
                              >
                                <Typography variant="h6" component="h4">
                                  {advantage.name}
                                </Typography>
                                {isSelected && (
                                  <Chip
                                    label="Selected"
                                    color="primary"
                                    size="small"
                                    variant="filled"
                                  />
                                )}
                              </Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 1 }}
                              >
                                {advantage.description}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Effect:</strong> {advantage.effect}
                              </Typography>
                              {advantage.restrictions &&
                                advantage.restrictions.length > 0 && (
                                  <Typography
                                    variant="body2"
                                    color="warning.main"
                                    sx={{ fontSize: '0.875rem' }}
                                  >
                                    <strong>Restrictions:</strong>{' '}
                                    {advantage.restrictions.join(', ')}
                                  </Typography>
                                )}

                              {/* Special UI for logistical benefit */}
                              {isLogisticalBenefit && isSelected && (
                                <Box
                                  sx={{
                                    mt: 2,
                                    p: 2,
                                    bgcolor: 'background.paper',
                                    borderRadius: 1,
                                  }}
                                >
                                  <Typography variant="subtitle2" gutterBottom>
                                    Slot Configuration
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                    }}
                                  >
                                    <Typography variant="body2">
                                      Add slot for:
                                    </Typography>
                                    <FormControl
                                      size="small"
                                      sx={{ minWidth: 120 }}
                                    >
                                      <Select
                                        value={(() => {
                                          const pa = unit.primeAdvantages?.find(
                                            p =>
                                              p.advantageId ===
                                              'logistical-benefit'
                                          );
                                          return (
                                            pa?.slotModification?.roleId ||
                                            'troops'
                                          );
                                        })()}
                                        onClick={e => {
                                          e.stopPropagation();
                                        }}
                                        onChange={(e: any) => {
                                          const newRoleId = e.target.value;

                                          const updatedAdvantages =
                                            unit.primeAdvantages?.map(pa =>
                                              pa.advantageId ===
                                              'logistical-benefit'
                                                ? {
                                                    ...pa,
                                                    slotModification: {
                                                      ...pa.slotModification!,
                                                      roleId: newRoleId,
                                                    },
                                                  }
                                                : pa
                                            ) || [];

                                          const updatedUnit = {
                                            ...unit,
                                            primeAdvantages: updatedAdvantages,
                                          };
                                          onUnitUpdated(slotId, updatedUnit);
                                        }}
                                      >
                                        {DataLoader.getBattlefieldRoles().map(
                                          role => (
                                            <MenuItem
                                              key={role.id}
                                              value={role.id}
                                            >
                                              {role.name}
                                            </MenuItem>
                                          )
                                        )}
                                      </Select>
                                    </FormControl>
                                  </Box>
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}

                      {availableAdvantages.length === 0 && (
                        <Alert severity="info">
                          No prime advantages available for this unit type.
                        </Alert>
                      )}
                    </Stack>
                  );
                })()}
              </Box>
            )}

            {activeTab === 'detachments' && canTriggerDetachments && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Triggered Detachments
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  This unit can trigger {maxDetachments} detachment
                  {maxDetachments > 1 ? 's' : ''}.
                </Typography>

                {triggeredDetachments.length > 0 ? (
                  <Stack spacing={2}>
                    {triggeredDetachments.map(detachment => {
                      const detachmentData = DataLoader.getDetachmentById(
                        detachment.detachmentId
                      );
                      return (
                        <Card key={detachment.detachmentId}>
                          <CardContent>
                            <Typography variant="h6">
                              {detachmentData?.name || detachment.detachmentId}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {detachmentData?.description}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                label={`${detachment.units.length} units`}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() =>
                                handleRemoveDetachment(detachment.detachmentId)
                              }
                              sx={{ mt: 1 }}
                            >
                              Remove Detachment
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                ) : (
                  <Alert severity="info">
                    No detachments triggered by this unit.
                  </Alert>
                )}

                {currentDetachmentCount < maxDetachments && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAddDetachment}
                    >
                      Add Detachment
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {activeTab === 'custom' && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Custom Units
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Save this unit configuration as a custom unit for future use,
                  or manage your existing custom units.
                </Typography>

                {/* Current Unit Status */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Current Unit Configuration
                    </Typography>
                    <Stack spacing={2}>
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
                          {baseUnitData.name}
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
                          {DataLoader.getFactionById(faction)?.name || faction}
                        </Typography>
                      </Box>
                      {subfaction && (
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
                            {DataLoader.getFactionById(subfaction)?.name ||
                              subfaction}
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
                          Upgrades Applied:
                        </Typography>
                        <Chip
                          label={`${unit.upgrades.length} upgrades`}
                          size="small"
                          variant="outlined"
                          color={
                            unit.upgrades.length > 0 ? 'primary' : 'default'
                          }
                        />
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Total Points:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {totalUnitPoints}
                        </Typography>
                      </Box>
                    </Stack>

                    {customUnitData ? (
                      <Box sx={{ mt: 2 }}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            This is a custom unit:{' '}
                            <strong>{customUnitData.name}</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Last modified:{' '}
                            {new Date(
                              customUnitData.updatedAt
                            ).toLocaleDateString()}
                          </Typography>
                        </Alert>
                        <Stack spacing={2}>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Save />}
                            onClick={() => {
                              // Overwrite the existing custom unit
                              const updatedUnit = {
                                ...unit,
                                upgrades: selectedUpgrades,
                                models: effectiveModelCounts,
                              };
                              const customUnit =
                                CustomUnitStorage.getCustomUnit(
                                  customUnitData.id
                                );
                              if (customUnit) {
                                const updatedCustomUnit = {
                                  ...customUnit,
                                  upgrades: selectedUpgrades,
                                  modelInstanceWeaponChanges:
                                    updatedUnit.modelInstanceWeaponChanges,
                                  modelInstanceWargearChanges:
                                    updatedUnit.modelInstanceWargearChanges,
                                  updatedAt: new Date().toISOString(),
                                };
                                CustomUnitStorage.saveCustomUnit(
                                  updatedCustomUnit
                                );
                                // Update the army unit to reflect the changes
                                onUnitUpdated(slotId, updatedUnit);
                                // Show success message
                                setShowOverwriteSuccess(true);
                                setTimeout(
                                  () => setShowOverwriteSuccess(false),
                                  3000
                                );
                              }
                            }}
                            fullWidth
                          >
                            Overwrite Custom Unit
                          </Button>
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<Save />}
                            onClick={() => setShowSaveCustomUnitModal(true)}
                            fullWidth
                          >
                            Save as New Custom Unit
                          </Button>
                        </Stack>
                        {showOverwriteSuccess && (
                          <Alert severity="success" sx={{ mt: 2 }}>
                            Custom unit "{customUnitData.name}" has been updated
                            successfully!
                          </Alert>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<Save />}
                          onClick={() => setShowSaveCustomUnitModal(true)}
                          fullWidth
                        >
                          Save as Custom Unit
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: { xs: 2, sm: 3 },
            pt: { xs: 0, sm: 1 },
          }}
        >
          <Button
            onClick={onClose}
            size={isMobile ? 'large' : 'medium'}
            sx={{
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Custom Unit Modal */}
      <SaveCustomUnitModal
        isOpen={showSaveCustomUnitModal}
        unit={{
          ...unit,
          upgrades: selectedUpgrades, // Use the current selected upgrades
          models: effectiveModelCounts, // Use the current effective model counts
        }}
        faction={faction}
        subfaction={subfaction}
        onClose={() => setShowSaveCustomUnitModal(false)}
        onSaved={customUnitId => {
          console.log('Custom unit saved with ID:', customUnitId);
          setShowSaveCustomUnitModal(false);
        }}
      />
    </>
  );
};

export default UnitManagementModal;
