import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Container,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ArrowBack, Add, Save, Edit } from '@mui/icons-material';
import { DataLoader } from '../../utils/dataLoader';
import { removeDetachmentsTriggeredByUnit } from '../../utils/detachmentUtils';
import AddDetachmentModal from '../../components/modals/AddDetachmentModal';
import UnitManagementModal from './UnitManagementModal';
import UnitSelectionModal from '../../components/modals/UnitSelectionModal';
import DetachmentPromptModal from '../../components/modals/DetachmentPromptModal';
import SaveCustomDetachmentModal from '../../components/modals/SaveCustomDetachmentModal';
import LoadCustomDetachmentModal from '../../components/modals/LoadCustomDetachmentModal';
import DetachmentCard from '../../components/cards/DetachmentCard';
import FactionSelectionModal from '../../components/modals/FactionSelectionModal';
import type {
  Army,
  ArmyDetachment,
  ArmyUnit,
  Detachment,
  Faction,
  Allegiance,
  Unit,
  CustomUnit,
} from '../../types/army';
import { CustomUnitStorage } from '../../utils/customUnitStorage';
import { ArmyListStorage } from '../../utils/armyListStorage';

interface ArmyListBuilderProps {
  initialArmyList?: Army | null;
}

const ArmyListBuilder: React.FC<ArmyListBuilderProps> = ({
  initialArmyList,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [armyList, setArmyList] = useState<Army>(
    initialArmyList || {
      id: `army-${Date.now()}`,
      name: 'New Army List',
      allegiance: 'Universal',
      faction: '',
      pointsLimit: 3000,
      totalPoints: 0,
      detachments: [],
      validationErrors: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isNamed: false,
    }
  );

  const [showAddDetachmentModal, setShowAddDetachmentModal] = useState(false);
  const [showFactionSelection, setShowFactionSelection] = useState(false);

  // Show faction selection for new army lists
  useEffect(() => {
    if (!initialArmyList && !armyList.faction && !showFactionSelection) {
      setShowFactionSelection(true);
    }
  }, [initialArmyList, armyList.faction, showFactionSelection]);

  const [showDetachmentPrompt, setShowDetachmentPrompt] = useState(false);
  const [detachmentPromptInfo, setDetachmentPromptInfo] = useState<{
    roleId: string;
    slotIndex: number;
    triggeringDetachmentId: string;
  } | null>(null);
  const [showUnitManagementModal, setShowUnitManagementModal] = useState(false);
  const [unitManagementInfo, setUnitManagementInfo] = useState<{
    unit: ArmyUnit;
    slotId: string;
    detachmentId: string;
    customUnitData?: {
      id: string;
      name: string;
      baseUnitId: string;
      faction: string;
      subfaction?: string;
      createdAt: string;
      updatedAt: string;
    };
  } | null>(null);
  const [showSaveCustomDetachmentModal, setShowSaveCustomDetachmentModal] =
    useState(false);
  const [detachmentToSave, setDetachmentToSave] =
    useState<ArmyDetachment | null>(null);
  const [showLoadCustomDetachmentModal, setShowLoadCustomDetachmentModal] =
    useState(false);
  const [detachmentToLoad, setDetachmentToLoad] =
    useState<ArmyDetachment | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [tempName, setTempName] = useState('');
  const [showPointsLimitInput, setShowPointsLimitInput] = useState(false);
  const [tempPointsLimit, setTempPointsLimit] = useState('');
  const [showUnitSelectionModal, setShowUnitSelectionModal] = useState(false);
  const [unitSelectionInfo, setUnitSelectionInfo] = useState<{
    roleId: string;
    roleName: string;
    detachmentId: string;
    slotId: string;
    detachment: any; // Add the detachment data
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const primaryFaction = DataLoader.getFactionById(armyList.faction);
  const availableDetachments = DataLoader.getAvailableDetachments(armyList);

  // Update total points whenever detachments change
  useEffect(() => {
    const totalPoints = calculateTotalPoints(armyList);
    setArmyList(prev => ({ ...prev, totalPoints }));
  }, [armyList.detachments]);

  // Autosave named army lists whenever they change
  useEffect(() => {
    if (armyList.isNamed && hasInitialized) {
      setIsSaving(true);
      ArmyListStorage.saveArmyList(armyList);
      // Clear saving indicator after a short delay
      setTimeout(() => setIsSaving(false), 1000);
    }
  }, [
    armyList.id,
    armyList.name,
    armyList.faction,
    armyList.allegiance,
    armyList.pointsLimit,
    armyList.totalPoints,
    armyList.detachments,
    armyList.updatedAt,
    hasInitialized,
  ]);

  // Mark as initialized after first render
  useEffect(() => {
    setHasInitialized(true);
  }, []);

  const handleNameArmyList = () => {
    if (tempName.trim()) {
      const updatedArmyList = {
        ...armyList,
        name: tempName.trim(),
        isNamed: true,
        updatedAt: new Date().toISOString(),
      };

      setArmyList(updatedArmyList);

      // Save the named army list to local storage
      ArmyListStorage.saveArmyList(updatedArmyList);

      setShowNameDialog(false);
      setTempName('');
    }
  };

  const handlePointsLimitChange = () => {
    const points = parseInt(tempPointsLimit, 10);
    if (points > 0) {
      setArmyList(prev => ({
        ...prev,
        pointsLimit: points,
        updatedAt: new Date().toISOString(),
      }));
      setShowPointsLimitInput(false);
      setTempPointsLimit('');
    }
  };

  const calculateTotalPoints = (list: Army): number => {
    return list.detachments.reduce((total, detachment) => {
      return total + calculateDetachmentPoints(detachment);
    }, 0);
  };

  const calculateDetachmentPoints = (detachment: ArmyDetachment): number => {
    return detachment.units.reduce((total, unit) => {
      // unit.points already includes upgrade points from handleUnitUpdated
      return total + unit.points;
    }, 0);
  };

  const handleFactionSelectionComplete = (
    _detachment: Detachment,
    faction: Faction,
    allegiance: Allegiance,
    subFaction?: Faction
  ) => {
    // Update army list with faction and allegiance
    setArmyList(prev => ({
      ...prev,
      faction: faction.id,
      allegiance: allegiance,
      subfaction: subFaction?.id,
      updatedAt: new Date().toISOString(),
    }));

    // Close faction selection modal
    setShowFactionSelection(false);

    // Auto-add Crusade Primary Detachment with the selected faction
    const crusadeDetachment = DataLoader.getDetachmentById('crusade-primary');
    if (crusadeDetachment) {
      const crusadeArmyDetachment: ArmyDetachment = {
        id: `crusade-primary-${Date.now()}`,
        detachmentId: 'crusade-primary',
        customName: undefined,
        points: 0,
        baseSlots: crusadeDetachment.slots,
        modifiedSlots: crusadeDetachment.slots,
        primeAdvantages: [],
        units: [],
      };
      setArmyList(prev => ({
        ...prev,
        detachments: [crusadeArmyDetachment],
      }));
    }
  };

  const handleDetachmentSelected = (
    detachment: Detachment,
    faction: Faction,
    allegiance: Allegiance,
    subFaction?: Faction
  ) => {
    // Update army list with faction and allegiance if this is the first detachment
    if (armyList.detachments.length === 0) {
      setArmyList(prev => ({
        ...prev,
        faction: faction.id,
        allegiance: allegiance,
        subfaction: subFaction?.id,
        updatedAt: new Date().toISOString(),
      }));
    }

    // Create new army detachment
    const newArmyDetachment: ArmyDetachment = {
      id: `detachment-${Date.now()}`,
      detachmentId: detachment.id,
      points: 0,
      baseSlots: detachment.slots,
      modifiedSlots: detachment.slots,
      primeAdvantages: [],
      units: [],
    };

    setArmyList(prev => ({
      ...prev,
      detachments: [...prev.detachments, newArmyDetachment],
      updatedAt: new Date().toISOString(),
    }));

    setShowAddDetachmentModal(false);
  };

  const handleAddDetachment = (detachment: Detachment) => {
    // If this is the first detachment, we need to get faction info
    if (armyList.detachments.length === 0) {
      // This should be handled by the modal, but as a fallback
      const faction = DataLoader.getFactionById(detachment.faction);
      if (faction) {
        handleDetachmentSelected(detachment, faction, faction.allegiance);
      }
    } else {
      // For subsequent detachments, we can add directly
      const newArmyDetachment: ArmyDetachment = {
        id: `detachment-${Date.now()}`,
        detachmentId: detachment.id,
        points: 0,
        baseSlots: detachment.slots,
        modifiedSlots: detachment.slots,
        primeAdvantages: [],
        units: [],
      };

      setArmyList(prev => ({
        ...prev,
        detachments: [...prev.detachments, newArmyDetachment],
        updatedAt: new Date().toISOString(),
      }));
    }

    setShowAddDetachmentModal(false);
  };

  const handleRemoveDetachment = (detachmentId: string) => {
    // Prevent removal of Crusade Primary Detachment
    const detachment = armyList.detachments.find(d => d.id === detachmentId);
    if (detachment?.detachmentId === 'crusade-primary') {
      return; // Don't allow removal of the primary detachment
    }

    setArmyList(prev => ({
      ...prev,
      detachments: prev.detachments.filter(d => d.id !== detachmentId),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleDetachmentPrompt = (
    roleId: string,
    slotIndex: number,
    knownDetachmentId?: string
  ) => {
    // Find the detachment that has a unit in the specified slot
    let triggeringDetachmentId = knownDetachmentId || '';

    // If we don't have a known detachment ID, search for it
    if (!knownDetachmentId) {
      for (const detachment of armyList.detachments) {
        const slotId = `${detachment.id}-${roleId}-${slotIndex}`;
        if (detachment.units.some(unit => unit.slotId === slotId)) {
          triggeringDetachmentId = detachment.id;
          break;
        }
      }
    }

    setDetachmentPromptInfo({ roleId, slotIndex, triggeringDetachmentId });
    setShowDetachmentPrompt(true);
  };

  const handleDetachmentPromptSelected = (detachment: Detachment) => {
    if (!detachmentPromptInfo) return;

    // Create the slotId that triggered this detachment
    const triggeringSlotId = `${detachmentPromptInfo.triggeringDetachmentId}-${detachmentPromptInfo.roleId}-${detachmentPromptInfo.slotIndex}`;

    // Find the triggering unit to get its actual ID
    const triggeringDetachment = armyList.detachments.find(
      d => d.id === detachmentPromptInfo.triggeringDetachmentId
    );
    const triggeringUnit = triggeringDetachment?.units.find(
      unit => unit.slotId === triggeringSlotId
    );

    // Create new army detachment
    const newArmyDetachment: ArmyDetachment = {
      id: `detachment-${Date.now()}`,
      detachmentId: detachment.id,
      customName: undefined,
      points: 0,
      baseSlots: detachment.slots,
      modifiedSlots: detachment.slots,
      primeAdvantages: [],
      units: [],
      triggeredBy: {
        unitId: triggeringUnit?.id || triggeringSlotId, // Use the actual unit ID if found
        slotId: triggeringSlotId,
        detachmentId: detachmentPromptInfo.triggeringDetachmentId,
        unitInstanceId: triggeringUnit?.id || triggeringSlotId, // Use unit instance ID for precise tracking
      },
    };

    // Add the detachment to the army list
    setArmyList(prev => ({
      ...prev,
      detachments: [...prev.detachments, newArmyDetachment],
      updatedAt: new Date().toISOString(),
    }));

    setShowDetachmentPrompt(false);
    setDetachmentPromptInfo(null);
  };

  const handleUnitSelected = (
    detachmentId: string,
    slotId: string,
    unitId: string,
    detachmentPromptInfo?: { roleId: string; slotIndex: number }
  ) => {
    if (unitId === '') {
      // Remove unit from slot and any detachments it triggered
      setArmyList(prev => {
        // First, find the unit being removed to get its ID
        const detachmentWithUnit = prev.detachments.find(
          d => d.id === detachmentId
        );
        const unitBeingRemoved = detachmentWithUnit?.units.find(
          unit => unit.slotId === slotId
        );

        // Remove the unit from its detachment
        const updatedDetachments = prev.detachments.map(detachment => {
          if (detachment.id === detachmentId) {
            return {
              ...detachment,
              units: detachment.units.filter(unit => unit.slotId !== slotId),
            };
          }
          return detachment;
        });

        // Remove any detachments triggered by this unit
        let finalDetachments = updatedDetachments;
        if (unitBeingRemoved) {
          const updatedArmy = { ...prev, detachments: updatedDetachments };
          finalDetachments = removeDetachmentsTriggeredByUnit(
            updatedArmy,
            unitBeingRemoved.id
          ).detachments;
        }

        return {
          ...prev,
          detachments: finalDetachments,
          updatedAt: new Date().toISOString(),
        };
      });
      return;
    }

    // Check if this is a custom unit
    const isCustomUnit = unitId.startsWith('custom:');
    let unit: Unit | null = null;
    let customUnit: CustomUnit | null = null;

    if (isCustomUnit) {
      // Load custom unit data
      const customUnitId = unitId.replace('custom:', '');
      customUnit = CustomUnitStorage.getCustomUnit(customUnitId);
      if (customUnit) {
        unit = DataLoader.getUnitById(customUnit.baseUnitId) || null;
      }
    } else {
      // Load base unit data
      unit = DataLoader.getUnitById(unitId) || null;
    }

    const faction = DataLoader.getFactionById(armyList.faction);

    if (unit && faction) {
      const newArmyUnit: ArmyUnit = {
        id: `${unitId}-${Date.now()}`,
        unitId: isCustomUnit ? customUnit!.baseUnitId : unitId,
        customName: isCustomUnit ? customUnit!.name : undefined,
        size: 1,
        points: isCustomUnit
          ? unit.points +
            customUnit!.upgrades.reduce(
              (total, upgrade) => total + upgrade.points * upgrade.count,
              0
            )
          : unit.points || 0,
        slotId: slotId,
        models: { ...unit.models }, // Copy the models from the base unit
        wargear: [],
        weapons: {},
        upgrades: isCustomUnit ? customUnit!.upgrades : [],
        primeAdvantages: isCustomUnit ? customUnit!.primeAdvantages : [],
        specialRules: [],
        specialRuleValues: {},
        modelModifications: {},
        modelInstanceWeaponChanges: isCustomUnit
          ? customUnit!.modelInstanceWeaponChanges
          : {},
        modelInstanceWargearChanges: isCustomUnit
          ? customUnit!.modelInstanceWargearChanges
          : {},
        originalCustomUnitId: isCustomUnit ? customUnit!.id : undefined,
      };

      setArmyList(prev => {
        const newList = {
          ...prev,
          detachments: prev.detachments.map(detachment => {
            if (detachment.id === detachmentId) {
              // Remove any existing unit in this slot
              const filteredUnits = detachment.units.filter(
                unit => unit.slotId !== slotId
              );

              return {
                ...detachment,
                units: [...filteredUnits, newArmyUnit],
              };
            }
            return detachment;
          }),
          updatedAt: new Date().toISOString(),
        };

        // If detachment prompt info is provided, trigger it after the unit is added
        if (detachmentPromptInfo) {
          setTimeout(() => {
            // Pass the detachment ID directly since we know which detachment the unit was added to
            handleDetachmentPrompt(
              detachmentPromptInfo.roleId,
              detachmentPromptInfo.slotIndex,
              detachmentId
            );
          }, 0);
        }

        return newList;
      });
    }
  };

  const recalculateDetachmentSlots = (
    detachment: ArmyDetachment
  ): ArmyDetachment => {
    const modifiedSlots = [...detachment.baseSlots];

    // Check for logistical benefit prime advantages
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

  const handleUnitUpdated = (slotId: string, updatedUnit: ArmyUnit) => {
    setArmyList(prev => {
      const updatedArmyList = {
        ...prev,
        detachments: prev.detachments.map(detachment => {
          const updatedUnits = detachment.units.map(unit => {
            if (unit.slotId === slotId) {
              // Calculate total points including upgrades
              const upgradePoints = updatedUnit.upgrades.reduce(
                (total, upgrade) => {
                  return total + upgrade.points * upgrade.count;
                },
                0
              );

              const baseUnit = DataLoader.getUnitById(updatedUnit.unitId);
              const basePoints = baseUnit?.points || 0;
              const totalPoints = basePoints + upgradePoints;

              return {
                ...updatedUnit,
                slotId, // Ensure slotId is preserved
                points: totalPoints, // Update points to include upgrades
              };
            }
            return unit;
          });

          const updatedDetachment = {
            ...detachment,
            units: updatedUnits,
          };

          // Recalculate slots based on updated units (including the newly updated unit)
          return recalculateDetachmentSlots(updatedDetachment);
        }),
        updatedAt: new Date().toISOString(),
      };

      return updatedArmyList;
    });

    // Update unitManagementInfo if this is the unit currently being managed
    setUnitManagementInfo(prev => {
      if (prev && prev.slotId === slotId) {
        return {
          ...prev,
          unit: updatedUnit,
        };
      }
      return prev;
    });
  };

  const handleDetachmentRemoved = (detachmentId: string) => {
    handleRemoveDetachment(detachmentId);
  };

  const handleUnitManagementOpen = (
    unit: ArmyUnit,
    slotId: string,
    detachmentId: string
  ) => {
    // Load custom unit data if this unit was created from a custom unit
    let customUnitData = undefined;
    if (unit.originalCustomUnitId) {
      const customUnit = CustomUnitStorage.getCustomUnit(
        unit.originalCustomUnitId
      );
      if (customUnit) {
        customUnitData = {
          id: customUnit.id,
          name: customUnit.name,
          baseUnitId: customUnit.baseUnitId,
          faction: customUnit.faction,
          subfaction: customUnit.subfaction,
          createdAt: customUnit.createdAt,
          updatedAt: customUnit.updatedAt,
        };
      }
    }

    setUnitManagementInfo({ unit, slotId, detachmentId, customUnitData });
    setShowUnitManagementModal(true);
  };

  const handleUnitManagementClose = () => {
    setShowUnitManagementModal(false);
    setUnitManagementInfo(null);
  };

  const handleUnitSelectionOpen = (
    roleId: string,
    roleName: string,
    detachmentId: string,
    slotId: string,
    detachment: any
  ) => {
    setUnitSelectionInfo({
      roleId,
      roleName,
      detachmentId,
      slotId,
      detachment,
    });
    setShowUnitSelectionModal(true);
  };

  const handleUnitSelectionClose = () => {
    setShowUnitSelectionModal(false);
    setUnitSelectionInfo(null);
  };

  const handleUnitSelectionComplete = (unitId: string) => {
    if (unitSelectionInfo) {
      const shouldTriggerDetachmentPrompt =
        unitSelectionInfo.roleId === 'command' ||
        unitSelectionInfo.roleId === 'high-command';
      const slotIndexMatch = unitSelectionInfo.slotId.match(/-(\d+)$/);
      const slotIndex = slotIndexMatch ? parseInt(slotIndexMatch[1], 10) : null;

      handleUnitSelected(
        unitSelectionInfo.detachmentId,
        unitSelectionInfo.slotId,
        unitId,
        shouldTriggerDetachmentPrompt
          ? {
              roleId: unitSelectionInfo.roleId,
              slotIndex: slotIndex!,
            }
          : undefined
      );

      setShowUnitSelectionModal(false);
      setUnitSelectionInfo(null);
    }
  };

  const handleSaveCustomDetachment = (armyDetachment: ArmyDetachment) => {
    setDetachmentToSave(armyDetachment);
    setShowSaveCustomDetachmentModal(true);
  };

  const handleCustomDetachmentSaved = (_customDetachmentId: string) => {
    setShowSaveCustomDetachmentModal(false);
    setDetachmentToSave(null);
  };

  const handleLoadCustomDetachment = (armyDetachment: ArmyDetachment) => {
    setDetachmentToLoad(armyDetachment);
    setShowLoadCustomDetachmentModal(true);
  };

  const handleCustomDetachmentLoaded = (customDetachment: any) => {
    if (!detachmentToLoad) return;

    // Update the detachment with custom detachment data
    setArmyList(prev => ({
      ...prev,
      detachments: prev.detachments.map(detachment => {
        if (detachment.id === detachmentToLoad.id) {
          // Update the slotId for each unit to match the current detachment
          const updatedUnits = customDetachment.units.map((unit: any) => {
            // Extract the role and slot index from the original slotId
            const slotIdParts = unit.slotId.split('-');
            const roleId = slotIdParts[slotIdParts.length - 2];
            const slotIndex = slotIdParts[slotIdParts.length - 1];

            // Create new slotId for the current detachment
            const newSlotId = `${detachment.id}-${roleId}-${slotIndex}`;

            return {
              ...unit,
              slotId: newSlotId,
            };
          });

          return {
            ...detachment,
            units: updatedUnits,
            primeAdvantages: customDetachment.primeAdvantages || [],
            updatedAt: new Date().toISOString(),
          };
        }
        return detachment;
      }),
      updatedAt: new Date().toISOString(),
    }));

    setShowLoadCustomDetachmentModal(false);
    setDetachmentToLoad(null);
  };

  return (
    <Box>
      {/* Header */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar
          sx={{
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: { xs: 1, sm: 0 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'space-between', sm: 'flex-start' },
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => navigate('/')}
              sx={{ mr: { xs: 0, sm: 2 } }}
            >
              <ArrowBack />
            </IconButton>
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 2 },
              }}
            >
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                component="h1"
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
                }}
              >
                {armyList.name}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 1, sm: 2 },
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Chip
                  label={primaryFaction?.name || 'Unknown'}
                  color="primary"
                  size={isMobile ? 'small' : 'medium'}
                />
                <Typography
                  variant="body2"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  {armyList.totalPoints} / {armyList.pointsLimit} pts
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  {armyList.detachments.length} detachments
                </Typography>
                {armyList.isNamed && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isSaving ? (
                      <Chip
                        icon={<Save />}
                        label="Saving..."
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        icon={<Save />}
                        label="Auto-saved"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 0.5, sm: 1 },
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', sm: 'flex-end' },
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            {!armyList.isNamed ? (
              <Button
                variant="outlined"
                color="info"
                size={isMobile ? 'small' : 'medium'}
                onClick={() => setShowNameDialog(true)}
              >
                {isSmallMobile ? 'Name' : 'Name List'}
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="info"
                size={isMobile ? 'small' : 'medium'}
                startIcon={<Edit />}
                onClick={() => setShowNameDialog(true)}
              >
                {isSmallMobile ? 'Rename' : 'Rename List'}
              </Button>
            )}
            <Button
              variant="outlined"
              color="info"
              size={isMobile ? 'small' : 'medium'}
              onClick={() => {
                setTempPointsLimit(armyList.pointsLimit.toString());
                setShowPointsLimitInput(true);
              }}
            >
              {isSmallMobile ? 'Points' : 'Set Points Limit'}
            </Button>
            {availableDetachments.length > 0 && (
              <Button
                variant="contained"
                color="success"
                startIcon={<Add />}
                size={isMobile ? 'small' : 'medium'}
                onClick={() => setShowAddDetachmentModal(true)}
              >
                {isSmallMobile ? 'Add' : 'Add Detachment'}
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container
        maxWidth={isMobile ? false : 'lg'}
        sx={{
          py: { xs: 2, sm: 3 },
          px: { xs: 0, sm: 3 },
          width: { xs: '100%', sm: 'auto' },
        }}
      >
        {!showFactionSelection && (
          <Box>
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              component="h2"
              gutterBottom
              sx={{ mb: { xs: 2, sm: 3 } }}
            >
              Detachments
            </Typography>
            {armyList.detachments.length === 0 ? (
              <Card>
                <CardContent>
                  <Typography variant="body1" color="text.secondary">
                    No detachments added yet.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: { xs: 2, sm: 3 },
                  width: '100%',
                }}
              >
                {armyList.detachments.map((armyDetachment, index) => (
                  <DetachmentCard
                    key={index}
                    armyDetachment={armyDetachment}
                    armyList={armyList}
                    index={index}
                    onLoadCustomDetachment={handleLoadCustomDetachment}
                    onSaveCustomDetachment={handleSaveCustomDetachment}
                    onRemoveDetachment={handleRemoveDetachment}
                    onUnitSelected={handleUnitSelected}
                    onDetachmentPrompt={handleDetachmentPrompt}
                    onUnitManagementOpen={handleUnitManagementOpen}
                    onUnitSelectionOpen={handleUnitSelectionOpen}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}
      </Container>

      {/* Points Limit Input Modal */}
      <Dialog
        open={showPointsLimitInput}
        onClose={() => setShowPointsLimitInput(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Set Points Limit</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Points Limit"
            type="number"
            fullWidth
            variant="outlined"
            value={tempPointsLimit}
            onChange={e => setTempPointsLimit(e.target.value)}
            placeholder="Enter points limit..."
            inputProps={{ min: 1, step: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setShowPointsLimitInput(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handlePointsLimitChange}
            disabled={
              !tempPointsLimit.trim() ||
              isNaN(parseInt(tempPointsLimit, 10)) ||
              parseInt(tempPointsLimit, 10) <= 0
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Name Dialog */}
      <Dialog
        open={showNameDialog}
        onClose={() => setShowNameDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Name Your Army List</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Army List Name"
            type="text"
            fullWidth
            variant="outlined"
            value={tempName}
            onChange={e => setTempName(e.target.value)}
            placeholder="Enter army list name..."
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setShowNameDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleNameArmyList}
            disabled={!tempName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Detachment Modal */}
      <AddDetachmentModal
        isOpen={showAddDetachmentModal}
        armyList={armyList}
        onAddDetachment={handleAddDetachment}
        onClose={() => setShowAddDetachmentModal(false)}
      />

      {/* Detachment Prompt Modal */}
      <DetachmentPromptModal
        isOpen={showDetachmentPrompt}
        roleId={detachmentPromptInfo?.roleId || ''}
        slotIndex={detachmentPromptInfo?.slotIndex || 0}
        armyList={armyList}
        triggeringDetachmentId={
          detachmentPromptInfo?.triggeringDetachmentId || ''
        }
        onClose={() => {
          setShowDetachmentPrompt(false);
          setDetachmentPromptInfo(null);
        }}
        onDetachmentSelected={handleDetachmentPromptSelected}
      />

      {/* Unit Management Modal */}
      {showUnitManagementModal && unitManagementInfo && armyList && (
        <UnitManagementModal
          isOpen={showUnitManagementModal}
          unit={unitManagementInfo.unit}
          slotId={unitManagementInfo.slotId}
          detachmentId={unitManagementInfo.detachmentId}
          armyList={armyList}
          onClose={handleUnitManagementClose}
          onUnitUpdated={handleUnitUpdated}
          onDetachmentPrompt={handleDetachmentPrompt}
          onDetachmentRemoved={handleDetachmentRemoved}
          faction={armyList.faction}
          customUnitData={unitManagementInfo.customUnitData}
        />
      )}

      {/* Save Custom Detachment Modal */}
      {showSaveCustomDetachmentModal && detachmentToSave && armyList && (
        <SaveCustomDetachmentModal
          isOpen={showSaveCustomDetachmentModal}
          detachment={detachmentToSave}
          faction={armyList.faction}
          subfaction={armyList.subfaction}
          onClose={() => {
            setShowSaveCustomDetachmentModal(false);
            setDetachmentToSave(null);
          }}
          onSaved={handleCustomDetachmentSaved}
        />
      )}

      {/* Load Custom Detachment Modal */}
      {showLoadCustomDetachmentModal && detachmentToLoad && armyList && (
        <LoadCustomDetachmentModal
          isOpen={showLoadCustomDetachmentModal}
          baseDetachmentId={detachmentToLoad.detachmentId}
          currentDetachment={detachmentToLoad}
          onClose={() => {
            setShowLoadCustomDetachmentModal(false);
            setDetachmentToLoad(null);
          }}
          onLoad={handleCustomDetachmentLoaded}
        />
      )}

      {/* Faction Selection Modal */}
      <FactionSelectionModal
        isOpen={showFactionSelection}
        onDetachmentSelected={handleFactionSelectionComplete}
        onCancel={() => {
          setShowFactionSelection(false);
          navigate('/');
        }}
      />

      {/* Unit Selection Modal */}
      {showUnitSelectionModal && unitSelectionInfo && armyList && (
        <UnitSelectionModal
          isOpen={showUnitSelectionModal}
          roleId={unitSelectionInfo.roleId}
          roleName={unitSelectionInfo.roleName}
          armyList={armyList}
          detachment={unitSelectionInfo.detachment}
          onUnitSelected={handleUnitSelectionComplete}
          onClose={handleUnitSelectionClose}
        />
      )}
    </Box>
  );
};

export default ArmyListBuilder;
