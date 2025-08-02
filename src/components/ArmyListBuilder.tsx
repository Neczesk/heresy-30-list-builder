import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui';
import { DataLoader } from '../utils/dataLoader';
import AddDetachmentModal from './AddDetachmentModal';
import DetachmentSlots from './DetachmentSlots';
import DetachmentSelector from './DetachmentSelector';
import UnitManagementModal from './UnitManagementModal';
import UnitSelectionModal from './UnitSelectionModal';
import DetachmentPromptModal from './DetachmentPromptModal';
import SaveCustomDetachmentModal from './SaveCustomDetachmentModal';
import LoadCustomDetachmentModal from './LoadCustomDetachmentModal';
import type { Army, ArmyDetachment, ArmyUnit, Detachment, Faction, Allegiance } from '../types/army';
import styles from './ArmyListBuilder.module.css';

interface ArmyListBuilderProps {
  initialArmyList?: Army | null;
}

const ArmyListBuilder: React.FC<ArmyListBuilderProps> = ({
  initialArmyList
}) => {
  const navigate = useNavigate();
  const [armyList, setArmyList] = useState<Army>(initialArmyList || {
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
    isNamed: false
  });

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
  } | null>(null);
  const [showSaveCustomDetachmentModal, setShowSaveCustomDetachmentModal] = useState(false);
  const [detachmentToSave, setDetachmentToSave] = useState<ArmyDetachment | null>(null);
  const [showLoadCustomDetachmentModal, setShowLoadCustomDetachmentModal] = useState(false);
  const [detachmentToLoad, setDetachmentToLoad] = useState<ArmyDetachment | null>(null);
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

  const primaryFaction = DataLoader.getFactionById(armyList.faction);
  const availableDetachments = DataLoader.getAvailableDetachments(armyList);

  // Update total points whenever detachments change
  useEffect(() => {
    const totalPoints = calculateTotalPoints(armyList);
    setArmyList(prev => ({ ...prev, totalPoints }));
  }, [armyList.detachments]);

  const handleNameArmyList = () => {
    if (tempName.trim()) {
      setArmyList(prev => ({
        ...prev,
        name: tempName.trim(),
        isNamed: true,
        updatedAt: new Date().toISOString()
      }));
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
        updatedAt: new Date().toISOString()
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
      return total + unit.points;
    }, 0);
  };



  const handleFactionSelectionComplete = (_detachment: Detachment, faction: Faction, allegiance: Allegiance, subFaction?: Faction) => {
    // Update army list with faction and allegiance
    setArmyList(prev => ({
      ...prev,
      faction: faction.id,
      allegiance: allegiance,
      subfaction: subFaction?.id,
      updatedAt: new Date().toISOString()
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
        units: []
      };
      setArmyList(prev => ({
        ...prev,
        detachments: [crusadeArmyDetachment]
      }));
    }
  };

  const handleDetachmentSelected = (detachment: Detachment, faction: Faction, allegiance: Allegiance, subFaction?: Faction) => {
    // Update army list with faction and allegiance if this is the first detachment
    if (armyList.detachments.length === 0) {
      setArmyList(prev => ({
        ...prev,
        faction: faction.id,
        allegiance: allegiance,
        subfaction: subFaction?.id,
        updatedAt: new Date().toISOString()
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
      units: []
    };

    setArmyList(prev => ({
      ...prev,
      detachments: [...prev.detachments, newArmyDetachment],
      updatedAt: new Date().toISOString()
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
        units: []
      };

      setArmyList(prev => ({
        ...prev,
        detachments: [...prev.detachments, newArmyDetachment],
        updatedAt: new Date().toISOString()
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
      updatedAt: new Date().toISOString()
    }));
  };

  const handleDetachmentPrompt = (roleId: string, slotIndex: number) => {
    // Find the detachment that has a unit in the specified slot
    let triggeringDetachmentId = '';
    console.log('handleDetachmentPrompt - searching for:', { roleId, slotIndex });
    
    for (const detachment of armyList.detachments) {
      const slotId = `${detachment.id}-${roleId}-${slotIndex}`;
      console.log('Checking detachment:', {
        detachmentId: detachment.id,
        constructedSlotId: slotId,
        units: detachment.units.map(u => ({ slotId: u.slotId, unitId: u.unitId }))
      });
      
      if (detachment.units.some(unit => unit.slotId === slotId)) {
        triggeringDetachmentId = detachment.id;
        console.log('Found matching detachment:', detachment.id);
        break;
      }
    }
    
    console.log('handleDetachmentPrompt result:', {
      roleId,
      slotIndex,
      triggeringDetachmentId,
      armyListDetachments: armyList.detachments.map(d => ({ 
        id: d.id, 
        detachmentId: d.detachmentId, 
        units: d.units.map(u => ({ slotId: u.slotId, unitId: u.unitId }))
      }))
    });
    
    setDetachmentPromptInfo({ roleId, slotIndex, triggeringDetachmentId });
    setShowDetachmentPrompt(true);
  };

  const handleDetachmentPromptSelected = (detachment: Detachment) => {
    if (!detachmentPromptInfo) return;

    // Create the slotId that triggered this detachment
    const triggeringSlotId = `${detachmentPromptInfo.triggeringDetachmentId}-${detachmentPromptInfo.roleId}-${detachmentPromptInfo.slotIndex}`;

    // Find the triggering unit to get its actual ID
    const triggeringDetachment = armyList.detachments.find(d => d.id === detachmentPromptInfo.triggeringDetachmentId);
    const triggeringUnit = triggeringDetachment?.units.find(unit => unit.slotId === triggeringSlotId);

    console.log('Creating detachment with triggeredBy:', {
      triggeringSlotId,
      triggeringUnitId: triggeringUnit?.id,
      triggeringUnit,
      detachmentPromptInfo
    });

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
        slotId: triggeringSlotId
      }
    };

    console.log('New detachment created:', newArmyDetachment);

    // Add the detachment to the army list
    setArmyList(prev => {
      const newList = {
        ...prev,
        detachments: [...prev.detachments, newArmyDetachment],
        updatedAt: new Date().toISOString()
      };
      console.log('Updated army list:', newList);
      return newList;
    });

    setShowDetachmentPrompt(false);
    setDetachmentPromptInfo(null);
  };

  const handleUnitSelected = (detachmentId: string, slotId: string, unitId: string, detachmentPromptInfo?: { roleId: string; slotIndex: number }) => {
    if (unitId === '') {
      // Remove unit from slot and any detachments it triggered
      setArmyList(prev => {
        // First, find the unit being removed to get its ID
        const detachmentWithUnit = prev.detachments.find(d => d.id === detachmentId);
        const unitBeingRemoved = detachmentWithUnit?.units.find(unit => unit.slotId === slotId);
        
        console.log('Removing unit:', {
          detachmentId,
          slotId,
          unitBeingRemoved,
          currentDetachments: prev.detachments
        });
        
        const filteredDetachments = prev.detachments.filter(detachment => {
          // Remove any detachments that were triggered by this unit
          if (detachment.triggeredBy && 
              (detachment.triggeredBy.slotId === slotId || 
               (unitBeingRemoved && detachment.triggeredBy.unitId === unitBeingRemoved.id))) {
            console.log('Removing triggered detachment:', detachment);
            return false;
          }
          return true;
        });
        
        console.log('Filtered detachments:', filteredDetachments);
        
        return {
          ...prev,
          detachments: filteredDetachments.map(detachment => {
            if (detachment.id === detachmentId) {
              return {
                ...detachment,
                units: detachment.units.filter(unit => unit.slotId !== slotId)
              };
            }
            return detachment;
          }),
          updatedAt: new Date().toISOString()
        };
      });
      return;
    }

    const unit = DataLoader.getUnitById(unitId);
    const faction = DataLoader.getFactionById(armyList.faction);
    
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
        modelInstanceWargearChanges: {}
      };

      setArmyList(prev => {
        const newList = {
          ...prev,
          detachments: prev.detachments.map(detachment => {
            if (detachment.id === detachmentId) {
              // Remove any existing unit in this slot
              const filteredUnits = detachment.units.filter(unit => unit.slotId !== slotId);
              
              return {
                ...detachment,
                units: [...filteredUnits, newArmyUnit]
              };
            }
            return detachment;
          }),
          updatedAt: new Date().toISOString()
        };
        
        // If detachment prompt info is provided, trigger it after the unit is added
        if (detachmentPromptInfo) {
          setTimeout(() => {
            handleDetachmentPrompt(detachmentPromptInfo.roleId, detachmentPromptInfo.slotIndex);
          }, 0);
        }
        
        return newList;
      });
    }
  };

  const recalculateDetachmentSlots = (detachment: ArmyDetachment): ArmyDetachment => {
    let modifiedSlots = [...detachment.baseSlots];
    
    // Check for logistical benefit prime advantages
    detachment.units.forEach(unit => {
      unit.primeAdvantages?.forEach(advantage => {
        if (advantage.advantageId === 'logistical-benefit' && advantage.slotModification) {
          modifiedSlots.push({
            roleId: advantage.slotModification.roleId,
            count: advantage.slotModification.count,
            isPrime: false,
            description: `Custom slot added by Logistical Benefit for unit ${unit.unitId}`
          });
        }
      });
    });
    
    return { ...detachment, modifiedSlots };
  };

  const handleUnitUpdated = (slotId: string, updatedUnit: ArmyUnit) => {
    setArmyList(prev => ({
      ...prev,
      detachments: prev.detachments.map(detachment => {
        const updatedUnits = detachment.units.map(unit => 
          unit.slotId === slotId ? updatedUnit : unit
        );
        
        const updatedDetachment = {
          ...detachment,
          units: updatedUnits
        };
        
        // Recalculate slots based on updated units
        return recalculateDetachmentSlots(updatedDetachment);
      }),
      updatedAt: new Date().toISOString()
    }));
  };

  const handleDetachmentRemoved = (detachmentId: string) => {
    handleRemoveDetachment(detachmentId);
  };

  const handleUnitManagementOpen = (unit: ArmyUnit, slotId: string, detachmentId: string) => {
    setUnitManagementInfo({ unit, slotId, detachmentId });
    setShowUnitManagementModal(true);
  };

  const handleUnitManagementClose = () => {
    setShowUnitManagementModal(false);
    setUnitManagementInfo(null);
  };

  const handleUnitSelectionOpen = (roleId: string, roleName: string, detachmentId: string, slotId: string, detachment: any) => {
    setUnitSelectionInfo({ roleId, roleName, detachmentId, slotId, detachment });
    setShowUnitSelectionModal(true);
  };

  const handleUnitSelectionClose = () => {
    setShowUnitSelectionModal(false);
    setUnitSelectionInfo(null);
  };

  const handleUnitSelectionComplete = (unitId: string) => {
    if (unitSelectionInfo) {
      const shouldTriggerDetachmentPrompt = (unitSelectionInfo.roleId === 'command' || unitSelectionInfo.roleId === 'high-command');
      const slotIndexMatch = unitSelectionInfo.slotId.match(/-(\d+)$/);
      const slotIndex = slotIndexMatch ? parseInt(slotIndexMatch[1], 10) : null;
      
      handleUnitSelected(unitSelectionInfo.detachmentId, unitSelectionInfo.slotId, unitId, shouldTriggerDetachmentPrompt ? {
        roleId: unitSelectionInfo.roleId,
        slotIndex: slotIndex!
      } : undefined);
      
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
          return {
            ...detachment,
            units: customDetachment.units,
            primeAdvantages: customDetachment.primeAdvantages || [],
            updatedAt: new Date().toISOString()
          };
        }
        return detachment;
      }),
      updatedAt: new Date().toISOString()
    }));

    setShowLoadCustomDetachmentModal(false);
    setDetachmentToLoad(null);
  };

  const handleDebugTest = () => {
    console.log('Current Army List:', armyList);
    console.log('Primary Faction:', primaryFaction);
    console.log('Available Detachments:', availableDetachments);
  };

  return (
    <div className={styles['army-list-builder']}>
      {/* Header */}
      <div className={styles['builder-header']}>
        <Button variant="secondary" onClick={() => navigate('/')}>
          ← Back to Menu
        </Button>
        <div className={styles['header-info']}>
          <h1>{armyList.name}</h1>
          <div className={styles['army-stats']}>
            <span className={styles.faction}>{primaryFaction?.name}</span>
            <span className={styles.points}>{armyList.totalPoints} / {armyList.pointsLimit} pts</span>
            <span className={styles.detachments}>{armyList.detachments.length} detachments</span>
          </div>
        </div>
        <div className={styles['header-actions']}>
          {!armyList.isNamed && (
            <Button 
              variant="info"
              onClick={() => setShowNameDialog(true)}
            >
              Name List
            </Button>
          )}
          <Button 
            variant="info"
            onClick={() => {
              setTempPointsLimit(armyList.pointsLimit.toString());
              setShowPointsLimitInput(true);
            }}
          >
            Set Points Limit
          </Button>
          {availableDetachments.length > 0 && (
            <Button 
              variant="success"
              onClick={() => setShowAddDetachmentModal(true)}
            >
              + Add Detachment
            </Button>
          )}
          <Button 
            variant="warning"
            onClick={handleDebugTest}
            size="sm"
          >
            Debug
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles['builder-content']}>
        {!showFactionSelection && (
          <div className={styles['detachments-section']}>
            <h2>Detachments</h2>
            {armyList.detachments.length === 0 ? (
              <div className={styles['empty-state']}>
                <p>No detachments added yet.</p>
              </div>
            ) : (
            <div className={styles['detachments-list']}>
              {armyList.detachments.map((armyDetachment, index) => {
                const detachment = DataLoader.getDetachmentById(armyDetachment.detachmentId);
                if (!detachment) return null;

                return (
                  <div key={index} className={styles['detachment-card']}>
                    <div className={styles['detachment-header']}>
                      <h3>{detachment.name}</h3>
                      <span className={styles['detachment-type']}>{detachment.type}</span>
                      <div className={styles['detachment-actions']}>
                        <Button 
                          variant="info"
                          size="sm"
                          onClick={() => handleLoadCustomDetachment(armyDetachment)}
                          title="Load Custom Detachment"
                        >
                          📂
                        </Button>
                        <Button 
                          variant="success"
                          size="sm"
                          onClick={() => handleSaveCustomDetachment(armyDetachment)}
                          title="Save as Custom Detachment"
                        >
                          💾
                        </Button>
                        {index > 0 && armyDetachment.detachmentId !== 'crusade-primary' && (
                          <Button 
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveDetachment(armyDetachment.id)}
                            title="Remove Detachment"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className={styles['detachment-description']}>{detachment.description}</p>
                    
                    {/* Visual Slot Display */}
                    <DetachmentSlots
                      detachment={detachment}
                      armyDetachment={armyDetachment}
                      armyList={armyList}
                      onUnitSelected={handleUnitSelected}
                      onDetachmentPrompt={handleDetachmentPrompt}
                      onUnitManagementOpen={handleUnitManagementOpen}
                      onUnitSelectionOpen={handleUnitSelectionOpen}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}
      </div>

      {/* Points Limit Input Modal */}
      {showPointsLimitInput && (
        <div className={styles['modal-overlay']} onClick={() => setShowPointsLimitInput(false)}>
          <div className={styles['modal-content']} onClick={e => e.stopPropagation()}>
            <h3>Set Points Limit</h3>
            <input
              type="number"
              value={tempPointsLimit}
              onChange={(e) => setTempPointsLimit(e.target.value)}
              placeholder="Enter points limit..."
              className={styles['points-input']}
              min="1"
              step="1"
            />
            <div className={styles['modal-actions']}>
              <Button variant="secondary" onClick={() => setShowPointsLimitInput(false)}>
                Cancel
              </Button>
              <Button 
                variant="success" 
                onClick={handlePointsLimitChange} 
                disabled={!tempPointsLimit.trim() || isNaN(parseInt(tempPointsLimit, 10)) || parseInt(tempPointsLimit, 10) <= 0}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Name Dialog */}
      {showNameDialog && (
        <div className={styles['modal-overlay']} onClick={() => setShowNameDialog(false)}>
          <div className={styles['modal-content']} onClick={e => e.stopPropagation()}>
            <h3>Name Your Army List</h3>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Enter army list name..."
              className={styles['name-input']}
            />
            <div className={styles['modal-actions']}>
              <Button variant="secondary" onClick={() => setShowNameDialog(false)}>
                Cancel
              </Button>
              <Button variant="success" onClick={handleNameArmyList} disabled={!tempName.trim()}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Detachment Modal */}
      {showAddDetachmentModal && armyList && (
        <AddDetachmentModal
          armyList={armyList}
          onAddDetachment={handleAddDetachment}
          onClose={() => setShowAddDetachmentModal(false)}
        />
      )}

      {/* Detachment Prompt Modal */}
      {showDetachmentPrompt && detachmentPromptInfo && armyList && (
        <DetachmentPromptModal
          isOpen={showDetachmentPrompt}
          roleId={detachmentPromptInfo.roleId}
          slotIndex={detachmentPromptInfo.slotIndex}
          armyList={armyList}
          triggeringDetachmentId={detachmentPromptInfo.triggeringDetachmentId}
          onClose={() => {
            setShowDetachmentPrompt(false);
            setDetachmentPromptInfo(null);
          }}
          onDetachmentSelected={handleDetachmentPromptSelected}
        />
      )}

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
      {showFactionSelection && (
        <div className={styles['modal-overlay']} onClick={() => setShowFactionSelection(false)}>
          <DetachmentSelector
            onDetachmentSelected={handleFactionSelectionComplete}
            onCancel={() => setShowFactionSelection(false)}
          />
        </div>
      )}

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

 

    </div>
  );
};

export default ArmyListBuilder; 