import React, { useState } from 'react';
import { Button } from './ui';
import { DataLoader } from '../utils/dataLoader';
import { CustomUnitStorage } from '../utils/customUnitStorage';
import { UpgradeValidator } from '../utils/upgradeValidator';
import type { UpgradeValidationContext } from '../utils/upgradeValidator';
import { UnitViewer } from './UnitViewer';
import SaveCustomUnitModal from './SaveCustomUnitModal';
import type { Army, ArmyUnit, ArmyUpgrade } from '../types/army';
import './UnitManagementModal.css';

interface UnitManagementModalProps {
  isOpen: boolean;
  unit: ArmyUnit;
  slotId: string;
  detachmentId: string;
  armyList: Army;
  onClose: () => void;
  onUnitUpdated: (slotId: string, updatedUnit: ArmyUnit) => void;
  onDetachmentPrompt?: (roleId: string, slotIndex: number) => void;
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
  customUnitData
}) => {
  const [activeTab, setActiveTab] = useState<'unit' | 'upgrades' | 'detachments' | 'prime' | 'custom'>('unit');
  const [showSaveCustomUnitModal, setShowSaveCustomUnitModal] = useState(false);
  // Initialize selected upgrades from existing unit upgrades and weapon replacements
  const initializeSelectedUpgrades = () => {
    const upgrades: { upgradeId: string; optionId?: string; count: number; points: number }[] = [];
    
    // Add existing upgrades
    unit.upgrades.forEach(u => {
      upgrades.push({ 
        upgradeId: u.upgradeId, 
        optionId: u.optionId, 
        count: u.count,
        points: u.points
      });
    });
    
    return upgrades;
  };

  const [selectedUpgrades, setSelectedUpgrades] = useState<{ upgradeId: string; optionId?: string; count: number; points: number }[]>(
    initializeSelectedUpgrades()
  );
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [selectedPrimeAdvantages, setSelectedPrimeAdvantages] = useState<string[]>(() => {
    // Get prime advantages from the unit itself
    return unit.primeAdvantages?.map(pa => pa.advantageId) || [];
  });
  const [showSlotSelectionModal, setShowSlotSelectionModal] = useState(false);
  const [, setPendingLogisticalBenefit] = useState(false);
  const [selectedRoleForLogisticalBenefit, setSelectedRoleForLogisticalBenefit] = useState<string>(() => {
    // Get the selected role for logistical-benefit from the unit's prime advantages
    const logisticalBenefit = unit.primeAdvantages?.find(pa => pa.advantageId === 'logistical-benefit');
    return logisticalBenefit?.slotModification?.roleId || '';
  });

  if (!isOpen) return null;

  // Get base unit data for reference
  const baseUnitData = DataLoader.getUnitById(unit.unitId);
  if (!baseUnitData) return null;

  // Initialize collapsed state based on defaultCollapsed settings
  React.useEffect(() => {
    const collapsed = new Set<string>();
    
    // Make unit upgrades section collapsed by default
    collapsed.add('unit-upgrades');
    
    // Make model sections collapsed by default
    if (baseUnitData.modelUpgrades) {
      Object.keys(baseUnitData.modelUpgrades).forEach(modelId => {
        collapsed.add(`model-${modelId}`);
      });
      
      Object.entries(baseUnitData.modelUpgrades).forEach(([modelId, groupIds]) => {
        const model = DataLoader.getModelById(modelId);
        if (model && model.upgradeGroups) {
          model.upgradeGroups.forEach(group => {
            if (groupIds.includes(group.id) && group.defaultCollapsed) {
              collapsed.add(group.id);
            }
          });
        }
      });
    }
    
    setCollapsedGroups(collapsed);
  }, [baseUnitData.modelUpgrades]);

  // Helper function to calculate updated model composition
  const calculateUpdatedPreviewModels = (upgrades: ArmyUpgrade[]) => {
    const updatedModels = { ...baseUnitData.models };
    
    // Apply model-count upgrades first
    upgrades.forEach(upgrade => {
      const upgradeData = DataLoader.getUpgradeById(upgrade.upgradeId);
      
      if (upgradeData?.type === 'model-count' && upgradeData.targetModel) {
        // Handle model-count upgrades
        const currentCount = updatedModels[upgradeData.targetModel] || 0;
        updatedModels[upgradeData.targetModel] = currentCount + upgrade.count;
      } else if (upgradeData?.type === 'model-group-count' && upgradeData.targetModels) {
        // Handle model-group-count upgrades
        Object.entries(upgradeData.targetModels).forEach(([modelId, count]) => {
          const currentCount = updatedModels[modelId] || 0;
          updatedModels[modelId] = currentCount + ((count as number) * upgrade.count);
        });
      }
    });
    
    return updatedModels;
  };

  // Calculate updated model composition for preview
  const previewModels = calculateUpdatedPreviewModels(selectedUpgrades);
  
  // Create a temporary army unit instance for preview based on current selected upgrades
  const previewArmyUnit: ArmyUnit = {
    ...unit,
    models: previewModels,
    weapons: {},
    specialRules: unit.specialRules || [],
    specialRuleValues: unit.specialRuleValues || {},
    modelModifications: {},
    modelInstanceWeaponChanges: {},
    modelInstanceWargearChanges: {}
  };
  
  console.log('Preview models:', previewModels);
  console.log('Preview army unit models:', previewArmyUnit.models);

  // Apply weapon and wargear upgrades to the preview
  // We'll track which specific model instances have weapon and wargear changes
  const modelInstanceWeaponChanges: { [modelId: string]: { [instanceIndex: number]: { removed: Array<{ id: string; mount?: string; count?: number }>, added: Array<{ id: string; mount?: string; count?: number }> } } } = {};
  const modelInstanceWargearChanges: { [modelId: string]: { [instanceIndex: number]: { removed: string[], added: string[] } } } = {};
  
  // First, let's track which model instances have which upgrades
  const modelInstanceUpgrades: { [modelId: string]: { [instanceIndex: number]: string[] } } = {};
  
  selectedUpgrades.forEach(upgrade => {
    const upgradeData = DataLoader.getUpgradeById(upgrade.upgradeId);
    
    if (upgradeData?.type !== 'model-count' && upgrade.optionId) {
      // Handle weapon and wargear upgrades
      const option = upgradeData?.options?.find(opt => opt.id === upgrade.optionId);
      
      if (option) {
        // Get the target model type from the upgrade data
        const targetModelId = upgradeData?.targetModelType;
        
        // If we can't determine the target model, skip this upgrade
        if (!targetModelId || !previewModels[targetModelId]) {
          return;
        }
        
        // Initialize tracking for this model type
        if (!modelInstanceUpgrades[targetModelId]) {
          modelInstanceUpgrades[targetModelId] = {};
        }
        if (!modelInstanceWeaponChanges[targetModelId]) {
          modelInstanceWeaponChanges[targetModelId] = {};
        }
        if (!modelInstanceWargearChanges[targetModelId]) {
          modelInstanceWargearChanges[targetModelId] = {};
        }
        
        // For each upgrade count, apply to a specific model instance
        for (let i = 0; i < upgrade.count; i++) {
          // Use consecutive instance indices starting from 0
          const instanceIndex = i;
          
          // Track which upgrade this instance has
          if (!modelInstanceUpgrades[targetModelId]) {
            modelInstanceUpgrades[targetModelId] = {};
          }
          if (!modelInstanceUpgrades[targetModelId][instanceIndex]) {
            modelInstanceUpgrades[targetModelId][instanceIndex] = [];
          }
          modelInstanceUpgrades[targetModelId][instanceIndex].push(upgrade.upgradeId);
          
          // Handle weapon upgrades
          if (option.replaceWeapon || option.addWeapon || option.weaponReplacements) {
            // Initialize weapon changes for this instance
            if (!modelInstanceWeaponChanges[targetModelId][instanceIndex]) {
              modelInstanceWeaponChanges[targetModelId][instanceIndex] = { removed: [], added: [] };
            }
            
            // Handle single weapon replacement
            if (option.replaceWeapon && option.addWeapon) {
              // Find the original weapon entry to preserve mount and count information
              const baseModel = DataLoader.getModelById(targetModelId);
              let originalWeaponEntry: { id: string; mount?: string; count?: number } | undefined;
              
              if (baseModel && Array.isArray(baseModel.weapons) && baseModel.weapons.length > 0) {
                if (typeof baseModel.weapons[0] === 'object' && 'id' in baseModel.weapons[0]) {
                  // New structure: Array of { id: string, mount?: string, count?: number }
                  originalWeaponEntry = (baseModel.weapons as Array<{ id: string; mount?: string; count?: number }>)
                    .find(weapon => weapon.id === option.replaceWeapon);
                } else {
                  // Old structure: Array of strings
                  originalWeaponEntry = { id: option.replaceWeapon };
                }
              }
              
              // Remove the original weapon with its mount and count information
              if (originalWeaponEntry) {
                modelInstanceWeaponChanges[targetModelId][instanceIndex].removed.push(originalWeaponEntry);
              } else {
                modelInstanceWeaponChanges[targetModelId][instanceIndex].removed.push({ id: option.replaceWeapon });
              }
              
              // Add the new weapon with the same mount and count information as the original
              let newWeaponEntry: { id: string; mount?: string; count?: number };
              
              if (typeof option.addWeapon === 'string') {
                // Simple string weapon ID - use original mount and count
                newWeaponEntry = originalWeaponEntry ? 
                  { id: option.addWeapon, mount: originalWeaponEntry.mount, count: originalWeaponEntry.count } :
                  { id: option.addWeapon };
              } else {
                // Full weapon object - use provided mount and count, fall back to original if not specified
                newWeaponEntry = {
                  id: option.addWeapon.id,
                  mount: option.addWeapon.mount || originalWeaponEntry?.mount,
                  count: option.addWeapon.count || originalWeaponEntry?.count
                };
              }
              modelInstanceWeaponChanges[targetModelId][instanceIndex].added.push(newWeaponEntry);
            }
            
                          // Handle standalone weapon addition (no replacement)
              if (option.addWeapon && !option.replaceWeapon) {
                if (typeof option.addWeapon === 'string') {
                  modelInstanceWeaponChanges[targetModelId][instanceIndex].added.push({ id: option.addWeapon });
                } else {
                  modelInstanceWeaponChanges[targetModelId][instanceIndex].added.push(option.addWeapon);
                }
              }
            
            // Handle multiple weapon replacements
            if (option.weaponReplacements) {
              // Process each weapon replacement individually
              option.weaponReplacements.forEach(replacement => {
                // Find the original weapon entry to preserve mount and count information
                const baseModel = DataLoader.getModelById(targetModelId);
                let originalWeaponEntry: { id: string; mount?: string; count?: number } | undefined;
                
                if (baseModel && Array.isArray(baseModel.weapons) && baseModel.weapons.length > 0) {
                  if (typeof baseModel.weapons[0] === 'object' && 'id' in baseModel.weapons[0]) {
                    // New structure: Array of { id: string, mount?: string, count?: number }
                    const weapons = baseModel.weapons as Array<{ id: string; mount?: string; count?: number }>;
                    
                    if (replacement.replaceMount) {
                      // If replaceMount is specified, find weapon with matching ID and mount
                      originalWeaponEntry = weapons.find(weapon => 
                        weapon.id === replacement.replaceWeapon && weapon.mount === replacement.replaceMount
                      );
                    } else {
                      // Otherwise, find any weapon with matching ID
                      originalWeaponEntry = weapons.find(weapon => weapon.id === replacement.replaceWeapon);
                    }
                  } else {
                    // Old structure: Array of strings
                    originalWeaponEntry = { id: replacement.replaceWeapon };
                  }
                }
                
                // Remove the old weapon with its mount and count information
                if (originalWeaponEntry) {
                  modelInstanceWeaponChanges[targetModelId][instanceIndex].removed.push(originalWeaponEntry);
                } else {
                  modelInstanceWeaponChanges[targetModelId][instanceIndex].removed.push({ id: replacement.replaceWeapon });
                }
                
                // Add the new weapon
                let newWeaponEntry: { id: string; mount?: string; count?: number };
                
                if (typeof replacement.addWeapon === 'string') {
                  // Simple string weapon ID - use original mount and count
                  newWeaponEntry = originalWeaponEntry ? 
                    { id: replacement.addWeapon, mount: originalWeaponEntry.mount, count: originalWeaponEntry.count } :
                    { id: replacement.addWeapon };
                } else {
                  // Full weapon object - use provided mount and count, fall back to original if not specified
                  newWeaponEntry = {
                    id: replacement.addWeapon.id,
                    mount: replacement.addWeapon.mount || originalWeaponEntry?.mount,
                    count: replacement.addWeapon.count || originalWeaponEntry?.count
                  };
                }
                modelInstanceWeaponChanges[targetModelId][instanceIndex].added.push(newWeaponEntry);
              });
            }
          }
          
          // Handle wargear upgrades
          if (option.addWargear) {
            // Initialize wargear changes for this instance
            if (!modelInstanceWargearChanges[targetModelId][instanceIndex]) {
              modelInstanceWargearChanges[targetModelId][instanceIndex] = { removed: [], added: [] };
            }
            
            // Add wargear
            modelInstanceWargearChanges[targetModelId][instanceIndex].added.push(option.addWargear);
          }
        }
      }
    }
  });
  
  // Set the model instance changes
  previewArmyUnit.modelInstanceWeaponChanges = modelInstanceWeaponChanges;
  previewArmyUnit.modelInstanceWargearChanges = modelInstanceWargearChanges;


  // Parse slotId to get roleId and slotIndex
  const slotParts = slotId.split('-');
  const roleId = slotParts[slotParts.length - 2];
  const slotIndex = parseInt(slotParts[slotParts.length - 1]);
  
  // Check if this unit can trigger detachments
  const canTriggerDetachments = roleId === 'command' || roleId === 'high-command';
  
  // Check for "Officer of the Line" special rule and get its value
  const officerOfTheLineRule = baseUnitData.specialRules?.find(ruleId => 
    ruleId === 'officer-of-the-line'
  );
  const maxDetachments = officerOfTheLineRule 
    ? (baseUnitData.specialRuleValues?.['officer-of-the-line'] || 1)
    : 1;

  // Get detachments triggered by this unit
  const triggeredDetachments = armyList.detachments.filter(d => 
    d.triggeredBy && d.triggeredBy.unitId === unit.unitId && d.triggeredBy.slotId === slotId
  );
  const currentDetachmentCount = triggeredDetachments.length;

  // Get available upgrades for this unit
  const availableUpgrades = baseUnitData.upgrades.map(upgradeId => 
    DataLoader.getUpgradeById(upgradeId)
  ).filter(upgrade => upgrade !== undefined) as any[];

  // Get model-specific upgrade groups
  const modelUpgradeGroups: { [modelId: string]: any[] } = {};
  if (baseUnitData.modelUpgrades) {
    Object.entries(baseUnitData.modelUpgrades).forEach(([modelId, groupIds]) => {
      const model = DataLoader.getModelById(modelId);
      if (model && model.upgradeGroups) {
        modelUpgradeGroups[modelId] = model.upgradeGroups.filter(group => 
          groupIds.includes(group.id)
        );
      }
    });
  }

  // Helper function to get max count for an upgrade using the validator
  const getMaxCount = (upgrade: any) => {
    const updatedPreviewModels = calculateUpdatedPreviewModels(selectedUpgrades);

    const context: UpgradeValidationContext = {
      selectedUpgrades,
      previewModels: updatedPreviewModels,
      baseUnitData
    };
    return UpgradeValidator.getMaxCount(upgrade, context);
  };

  // Helper function to check if an upgrade is available using the validator
  const isUpgradeAvailable = (upgrade: any) => {
    const updatedPreviewModels = calculateUpdatedPreviewModels(selectedUpgrades);

    const context: UpgradeValidationContext = {
      selectedUpgrades,
      previewModels: updatedPreviewModels,
      baseUnitData
    };
    return UpgradeValidator.isUpgradeAvailable(upgrade, context);
  };

  const handleUpgradeCountChange = (upgradeId: string, optionId: string | undefined, newCount: number) => {
    setSelectedUpgrades(prev => {
      const existingIndex = prev.findIndex(u => u.upgradeId === upgradeId && u.optionId === optionId);
      
      // Handle mutually exclusive upgrades
      const conflictingUpgrades = UpgradeValidator.getConflictingUpgrades(upgradeId);
      if (conflictingUpgrades.length > 0 && newCount > 0) {
        // Remove any existing conflicting options when adding a new one
        const filtered = prev.filter(u => !conflictingUpgrades.includes(u.upgradeId) || u.optionId === optionId);
        
        if (existingIndex >= 0) {
          // Update existing option
          const updated = [...filtered];
          updated[existingIndex] = { ...updated[existingIndex], count: newCount };
          return updated;
        } else {
          // Add new option
          const upgrade = DataLoader.getUpgradeById(upgradeId);
          if (!upgrade) return prev;
          
          let points = 0;
          if (upgrade.options) {
            const option = upgrade.options.find(opt => opt.id === optionId);
            points = option?.points || 0;
          }
          
          // Validate the upgrade selection
          const context: UpgradeValidationContext = {
            selectedUpgrades: filtered,
            previewModels: calculateUpdatedPreviewModels(filtered),
            baseUnitData
          };
          const errors = UpgradeValidator.validateUpgradeSelection(upgradeId, newCount, context);
          
          if (errors.length > 0) {
            console.warn('Upgrade validation errors:', errors);
            return prev; // Don't add invalid upgrade
          }
          
          return [...filtered, { upgradeId, optionId, count: newCount, points }];
        }
      }
      
      if (existingIndex >= 0) {
        if (newCount <= 0) {
          // Remove upgrade if count is 0 or less
          return prev.filter((_, index) => index !== existingIndex);
        } else {
          // Update count
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], count: newCount };
          return updated;
        }
      } else {
        // Add new upgrade
        const upgrade = DataLoader.getUpgradeById(upgradeId);
        if (!upgrade) return prev;
        
        let points = 0;
        if (upgrade.options) {
          const option = upgrade.options.find(opt => opt.id === optionId);
          points = option?.points || 0;
        }
        
        // Validate the upgrade selection
        const context: UpgradeValidationContext = {
          selectedUpgrades: prev,
          previewModels: calculateUpdatedPreviewModels(prev),
          baseUnitData
        };
        const errors = UpgradeValidator.validateUpgradeSelection(upgradeId, newCount, context);
        
        if (errors.length > 0) {
          console.warn('Upgrade validation errors:', errors);
          return prev; // Don't add invalid upgrade
        }
        
        return [...prev, { upgradeId, optionId, count: newCount, points }];
      }
    });
  };

  const handleSaveUpgrades = () => {
    // Create model instance weapon changes from selected upgrades
    const modelInstanceWeaponChanges: { [modelId: string]: { [instanceIndex: number]: { removed: Array<{ id: string; mount?: string; count?: number }>, added: Array<{ id: string; mount?: string; count?: number }> } } } = {};
    
    // Create model instance wargear changes from selected upgrades
    const modelInstanceWargearChanges: { [modelId: string]: { [instanceIndex: number]: { removed: string[], added: string[] } } } = {};
    
    // Calculate updated model composition
    const updatedModels = { ...baseUnitData.models };
    
    // First, let's track which model instances have which upgrades
    const modelInstanceUpgrades: { [modelId: string]: { [instanceIndex: number]: string[] } } = {};
    
    selectedUpgrades.forEach(upgrade => {
      const upgradeData = DataLoader.getUpgradeById(upgrade.upgradeId);
      
      if (upgradeData?.type === 'model-count' && upgradeData.targetModel) {
        // Handle model-count upgrades
        const currentCount = updatedModels[upgradeData.targetModel] || 0;
        updatedModels[upgradeData.targetModel] = currentCount + upgrade.count;
      } else if (upgrade.optionId) {
        // Handle weapon and wargear upgrades
        const option = upgradeData?.options?.find(opt => opt.id === upgrade.optionId);
        
        if (option) {
          // Get the target model type from the upgrade data
          const targetModelId = upgradeData?.targetModelType;
          
          // If we can't determine the target model, skip this upgrade
          if (!targetModelId || !updatedModels[targetModelId]) {
            return;
          }
          
          // Initialize tracking for this model type
          if (!modelInstanceUpgrades[targetModelId]) {
            modelInstanceUpgrades[targetModelId] = {};
          }
          if (!modelInstanceWeaponChanges[targetModelId]) {
            modelInstanceWeaponChanges[targetModelId] = {};
          }
          if (!modelInstanceWargearChanges[targetModelId]) {
            modelInstanceWargearChanges[targetModelId] = {};
          }
          
          // For each upgrade count, apply to a specific model instance
          for (let i = 0; i < upgrade.count; i++) {
            // Use consecutive instance indices starting from 0
            const instanceIndex = i;
            
            // Track which upgrade this instance has
            if (!modelInstanceUpgrades[targetModelId][instanceIndex]) {
              modelInstanceUpgrades[targetModelId][instanceIndex] = [];
            }
            modelInstanceUpgrades[targetModelId][instanceIndex].push(upgrade.upgradeId);
            
            // Handle weapon upgrades
            if (option.replaceWeapon || option.addWeapon || option.weaponReplacements) {
              // Initialize weapon changes for this instance
              if (!modelInstanceWeaponChanges[targetModelId][instanceIndex]) {
                modelInstanceWeaponChanges[targetModelId][instanceIndex] = { removed: [], added: [] };
              }
              
              // Handle single weapon replacement
              if (option.replaceWeapon && option.addWeapon) {
                // Find the original weapon entry to preserve mount and count information
                const baseModel = DataLoader.getModelById(targetModelId);
                let originalWeaponEntry: { id: string; mount?: string; count?: number } | undefined;
                
                if (baseModel && Array.isArray(baseModel.weapons) && baseModel.weapons.length > 0) {
                  if (typeof baseModel.weapons[0] === 'object' && 'id' in baseModel.weapons[0]) {
                    // New structure: Array of { id: string, mount?: string, count?: number }
                    originalWeaponEntry = (baseModel.weapons as Array<{ id: string; mount?: string; count?: number }>)
                      .find(weapon => weapon.id === option.replaceWeapon);
                  } else {
                    // Old structure: Array of strings
                    originalWeaponEntry = { id: option.replaceWeapon };
                  }
                }
                
                // Remove the original weapon with its mount and count information
                if (originalWeaponEntry) {
                  modelInstanceWeaponChanges[targetModelId][instanceIndex].removed.push(originalWeaponEntry);
                } else {
                  modelInstanceWeaponChanges[targetModelId][instanceIndex].removed.push({ id: option.replaceWeapon });
                }
                
                // Add the new weapon with the same mount and count information as the original
                let newWeaponEntry: { id: string; mount?: string; count?: number };
                
                if (typeof option.addWeapon === 'string') {
                  // Simple string weapon ID - use original mount and count
                  newWeaponEntry = originalWeaponEntry ? 
                    { id: option.addWeapon, mount: originalWeaponEntry.mount, count: originalWeaponEntry.count } :
                    { id: option.addWeapon };
                } else {
                  // Full weapon object - use provided mount and count, fall back to original if not specified
                  newWeaponEntry = {
                    id: option.addWeapon.id,
                    mount: option.addWeapon.mount || originalWeaponEntry?.mount,
                    count: option.addWeapon.count || originalWeaponEntry?.count
                  };
                }
                modelInstanceWeaponChanges[targetModelId][instanceIndex].added.push(newWeaponEntry);
              }
              
              // Handle standalone weapon addition (no replacement)
              if (option.addWeapon && !option.replaceWeapon) {
                if (typeof option.addWeapon === 'string') {
                  modelInstanceWeaponChanges[targetModelId][instanceIndex].added.push({ id: option.addWeapon });
                } else {
                  modelInstanceWeaponChanges[targetModelId][instanceIndex].added.push(option.addWeapon);
                }
              }
              
              // Handle multiple weapon replacements
              if (option.weaponReplacements) {
                // Process each weapon replacement individually
                option.weaponReplacements.forEach(replacement => {
                  // Find the original weapon entry to preserve mount and count information
                  const baseModel = DataLoader.getModelById(targetModelId);
                  let originalWeaponEntry: { id: string; mount?: string; count?: number } | undefined;
                  
                  if (baseModel && Array.isArray(baseModel.weapons) && baseModel.weapons.length > 0) {
                    if (typeof baseModel.weapons[0] === 'object' && 'id' in baseModel.weapons[0]) {
                      // New structure: Array of { id: string, mount?: string, count?: number }
                      const weapons = baseModel.weapons as Array<{ id: string; mount?: string; count?: number }>;
                      
                      if (replacement.replaceMount) {
                        // If replaceMount is specified, find weapon with matching ID and mount
                        originalWeaponEntry = weapons.find(weapon => 
                          weapon.id === replacement.replaceWeapon && weapon.mount === replacement.replaceMount
                        );
                      } else {
                        // Otherwise, find any weapon with matching ID
                        originalWeaponEntry = weapons.find(weapon => weapon.id === replacement.replaceWeapon);
                      }
                    } else {
                      // Old structure: Array of strings
                      originalWeaponEntry = { id: replacement.replaceWeapon };
                    }
                  }
                  
                  // Remove the old weapon with its mount and count information
                  if (originalWeaponEntry) {
                    modelInstanceWeaponChanges[targetModelId][instanceIndex].removed.push(originalWeaponEntry);
                  } else {
                    modelInstanceWeaponChanges[targetModelId][instanceIndex].removed.push({ id: replacement.replaceWeapon });
                  }
                  
                  // Add the new weapon
                  let newWeaponEntry: { id: string; mount?: string; count?: number };
                  
                  if (typeof replacement.addWeapon === 'string') {
                    // Simple string weapon ID - use original mount and count
                    newWeaponEntry = originalWeaponEntry ? 
                      { id: replacement.addWeapon, mount: originalWeaponEntry.mount, count: originalWeaponEntry.count } :
                      { id: replacement.addWeapon };
                  } else {
                    // Full weapon object - use provided mount and count, fall back to original if not specified
                    newWeaponEntry = {
                      id: replacement.addWeapon.id,
                      mount: replacement.addWeapon.mount || originalWeaponEntry?.mount,
                      count: replacement.addWeapon.count || originalWeaponEntry?.count
                    };
                  }
                  modelInstanceWeaponChanges[targetModelId][instanceIndex].added.push(newWeaponEntry);
                });
              }
            }
            
            // Handle wargear upgrades
            if (option.addWargear) {
              // Initialize wargear changes for this instance
              if (!modelInstanceWargearChanges[targetModelId][instanceIndex]) {
                modelInstanceWargearChanges[targetModelId][instanceIndex] = { removed: [], added: [] };
              }
              
              // Add wargear
              modelInstanceWargearChanges[targetModelId][instanceIndex].added.push(option.addWargear);
            }
          }
        }
      }
    });

    const updatedUnit: ArmyUnit = {
      ...unit,
      models: updatedModels,
      upgrades: selectedUpgrades.map(upgrade => ({
        upgradeId: upgrade.upgradeId,
        optionId: upgrade.optionId,
        count: upgrade.count,
        points: upgrade.points
      })),
      points: baseUnitData.points + calculateUpgradePoints(), // Update points to reflect total
      modelInstanceWeaponChanges: Object.keys(modelInstanceWeaponChanges).length > 0 ? modelInstanceWeaponChanges : {},
      modelInstanceWargearChanges: Object.keys(modelInstanceWargearChanges).length > 0 ? modelInstanceWargearChanges : {}
    };
    
    // If editing a custom unit in CustomUnitsManager, auto-save to custom unit storage
    if (customUnitData) {
      const customUnit = {
        id: customUnitData.id,
        name: customUnitData.name,
        baseUnitId: unit.unitId,
        faction: customUnitData.faction,
        subfaction: customUnitData.subfaction,
        upgrades: updatedUnit.upgrades,
        primeAdvantages: updatedUnit.primeAdvantages,
        modelInstanceWeaponChanges: updatedUnit.modelInstanceWeaponChanges,
        modelInstanceWargearChanges: updatedUnit.modelInstanceWargearChanges,
        createdAt: customUnitData.createdAt,
        updatedAt: new Date().toISOString()
      };
      
      CustomUnitStorage.saveCustomUnit(customUnit);
      console.log('Custom unit updated:', customUnit);
    }
    
    // Note: If unit.originalCustomUnitId exists, we don't auto-save to preserve the original custom unit
    // User must explicitly choose to save as new or overwrite original
    
    onUnitUpdated(slotId, updatedUnit);
  };

  const handleAddDetachment = () => {
    if (onDetachmentPrompt && currentDetachmentCount < maxDetachments) {
      onDetachmentPrompt(roleId, slotIndex);
      onClose();
    }
  };

  const handleRemoveDetachment = (detachmentId: string) => {
    if (onDetachmentRemoved) {
      onDetachmentRemoved(detachmentId);
    }
  };

  const calculateUpgradePoints = () => {
    return selectedUpgrades.reduce((total, upgrade) => {
      return total + (upgrade.points * upgrade.count);
    }, 0);
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const isGroupCollapsed = (groupId: string) => {
    return collapsedGroups.has(groupId);
  };

  const totalUnitPoints = baseUnitData.points + calculateUpgradePoints();

  // Check if this unit is in a prime slot
  const isInPrimeSlot = () => {
    const detachment = armyList.detachments.find(d => d.detachmentId === detachmentId);
    if (!detachment) {
      console.log('isInPrimeSlot: Detachment not found for ID:', detachmentId);
      return false;
    }
    
    const detachmentData = DataLoader.getDetachmentById(detachmentId);
    if (!detachmentData) {
      console.log('isInPrimeSlot: Detachment data not found for ID:', detachmentId);
      return false;
    }
    
    console.log('isInPrimeSlot: slotId:', slotId);
    console.log('isInPrimeSlot: detachmentId:', detachmentId);
    
    // Try different slot ID formats
    let roleId: string;
    let slotIndex: number;
    
    // Check if slotId is actually the detachment ID (for triggered detachments)
    if (slotId === detachmentId) {
      // This is a triggered detachment, check the first slot
      const firstSlot = detachmentData.slots[0];
      if (firstSlot) {
        console.log('isInPrimeSlot: Triggered detachment, first slot:', firstSlot.roleId, 'isPrime:', firstSlot.isPrime);
        return firstSlot.isPrime;
      }
      return false;
    }
    
    // Format 1: detachmentId-roleId-slotIndex (e.g., "crusade-primary-troops-0")
    const format1Parts = slotId.split('-');
    if (format1Parts.length >= 3) {
      // Check if the first part matches the detachment ID
      if (format1Parts[0] === detachmentId || format1Parts.slice(0, -2).join('-') === detachmentId) {
        roleId = format1Parts[format1Parts.length - 2];
        slotIndex = parseInt(format1Parts[format1Parts.length - 1], 10);
        console.log('isInPrimeSlot: Using format 1 - roleId:', roleId, 'slotIndex:', slotIndex);
      } else {
        // Format 2: roleId-slotIndex (e.g., "troops-0")
        roleId = format1Parts[0];
        slotIndex = parseInt(format1Parts[1], 10);
        console.log('isInPrimeSlot: Using format 2 - roleId:', roleId, 'slotIndex:', slotIndex);
      }
    } else {
      // Format 3: just roleId (e.g., "tercio")
      roleId = slotId;
      slotIndex = 0; // Assume first slot of this role
      console.log('isInPrimeSlot: Using format 3 - roleId:', roleId, 'slotIndex:', slotIndex);
    }
    
    if (isNaN(slotIndex)) {
      console.log('isInPrimeSlot: Invalid slot index, defaulting to 0');
      slotIndex = 0;
    }
    
    console.log('isInPrimeSlot: Final roleId:', roleId, 'slotIndex:', slotIndex);
    console.log('isInPrimeSlot: detachment slots:', detachmentData.slots);
    
    // Find the slot in the detachment data
    let currentSlotIndex = 0;
    for (const slot of detachmentData.slots) {
      console.log('isInPrimeSlot: checking slot:', slot.roleId, 'count:', slot.count, 'isPrime:', slot.isPrime);
      if (slot.roleId === roleId) {
        for (let i = 0; i < slot.count; i++) {
          console.log('isInPrimeSlot: currentSlotIndex:', currentSlotIndex, 'target slotIndex:', slotIndex);
          if (currentSlotIndex === slotIndex) {
            console.log('isInPrimeSlot: Found slot! isPrime:', slot.isPrime);
            return slot.isPrime;
          }
          currentSlotIndex++;
        }
      } else {
        // Skip slots that don't match the role
        currentSlotIndex += slot.count;
      }
    }
    
    console.log('isInPrimeSlot: Slot not found, returning false');
    return false;
  };

  const availablePrimeAdvantages = DataLoader.getPrimeAdvantages().filter(advantage => {
    // Check restrictions
    if (advantage.restrictions) {
      for (const restriction of advantage.restrictions) {
        if (restriction.includes('Only available for Troops units')) {
          const unitData = DataLoader.getUnitById(unit.unitId);
          if (unitData?.battlefieldRole !== 'Troops') return false;
        }
        if (restriction.includes('Only available for Command units')) {
          const unitData = DataLoader.getUnitById(unit.unitId);
          if (unitData?.battlefieldRole !== 'Command') return false;
        }
        if (restriction.includes('Only available for High Command units')) {
          const unitData = DataLoader.getUnitById(unit.unitId);
          if (unitData?.battlefieldRole !== 'High Command') return false;
        }
      }
    }
    return true;
  });

  const handlePrimeAdvantageChange = (advantageId: string, checked: boolean) => {
    if (checked) {
      // Check if this is logistical-benefit
      if (advantageId === 'logistical-benefit') {
        setPendingLogisticalBenefit(true);
        setShowSlotSelectionModal(true);
        return;
      }
      
      setSelectedPrimeAdvantages([...selectedPrimeAdvantages, advantageId]);
    } else {
      setSelectedPrimeAdvantages(selectedPrimeAdvantages.filter(id => id !== advantageId));
    }
  };

  const handleSlotSelection = (roleId: string) => {
    // Store the selected role for logistical-benefit
    setSelectedRoleForLogisticalBenefit(roleId);
    // Add logistical-benefit with the selected role
    setSelectedPrimeAdvantages([...selectedPrimeAdvantages, 'logistical-benefit']);
    setShowSlotSelectionModal(false);
    setPendingLogisticalBenefit(false);
  };

  const handleCancelSlotSelection = () => {
    setShowSlotSelectionModal(false);
    setPendingLogisticalBenefit(false);
  };

  const handleOverwriteCustomUnit = () => {
    if (!unit.originalCustomUnitId) return;
    
    // Get the original custom unit
    const originalCustomUnit = CustomUnitStorage.getCustomUnit(unit.originalCustomUnitId);
    if (!originalCustomUnit) {
      console.error('Original custom unit not found:', unit.originalCustomUnitId);
      return;
    }
    
    // Create updated custom unit with current unit's configuration
    const updatedCustomUnit = {
      ...originalCustomUnit,
      upgrades: unit.upgrades,
      primeAdvantages: unit.primeAdvantages,
      modelInstanceWeaponChanges: unit.modelInstanceWeaponChanges,
      modelInstanceWargearChanges: unit.modelInstanceWargearChanges,
      updatedAt: new Date().toISOString()
    };
    
    // Save the updated custom unit
    CustomUnitStorage.saveCustomUnit(updatedCustomUnit);
    console.log('Original custom unit overwritten:', updatedCustomUnit);
    
    // Show success message or notification
    alert('Original custom unit has been updated with your changes.');
  };

  const handleSavePrimeAdvantages = () => {
    console.log('Saving prime advantages for unit:', unit.unitId);
    console.log('Selected advantages:', selectedPrimeAdvantages);
    console.log('Selected role for logistical-benefit:', selectedRoleForLogisticalBenefit);
    
    // Create new prime advantages for the unit
    const newPrimeAdvantages = selectedPrimeAdvantages.map(advantageId => {
      const advantage = DataLoader.getPrimeAdvantageById(advantageId);
      const primeAdvantage: any = {
        advantageId: advantageId,
        description: advantage?.description || '',
        effect: advantage?.effect || ''
      };
      
      // Add slot modification for logistical-benefit
      if (advantageId === 'logistical-benefit') {
        primeAdvantage.slotModification = {
          roleId: selectedRoleForLogisticalBenefit || 'support', // Use selected role or default
          count: 1
        };
      }
      
      return primeAdvantage;
    });
    
    console.log('New prime advantages:', newPrimeAdvantages);
    
    // Update the unit with new prime advantages
    const updatedUnit = {
      ...unit,
      primeAdvantages: newPrimeAdvantages
    };
    
    console.log('Updated unit:', updatedUnit);
    
    // If editing a custom unit in CustomUnitsManager, auto-save to custom unit storage
    if (customUnitData) {
      const customUnit = {
        id: customUnitData.id,
        name: customUnitData.name,
        baseUnitId: unit.unitId,
        faction: customUnitData.faction,
        subfaction: customUnitData.subfaction,
        upgrades: updatedUnit.upgrades,
        primeAdvantages: updatedUnit.primeAdvantages,
        modelInstanceWeaponChanges: updatedUnit.modelInstanceWeaponChanges,
        modelInstanceWargearChanges: updatedUnit.modelInstanceWargearChanges,
        createdAt: customUnitData.createdAt,
        updatedAt: new Date().toISOString()
      };
      
      CustomUnitStorage.saveCustomUnit(customUnit);
      console.log('Custom unit prime advantages updated:', customUnit);
    }
    
    // Note: If unit.originalCustomUnitId exists, we don't auto-save to preserve the original custom unit
    // User must explicitly choose to save as new or overwrite original
    
    // Update the unit - the detachment will recalculate its slots based on unit prime advantages
    onUnitUpdated(slotId, updatedUnit);
  };

  return (
    <div className="unit-management-overlay" onClick={onClose}>
      <div className="unit-management-content" onClick={(e) => e.stopPropagation()}>
        <div className="unit-management-header">
          <h3>
            {customUnitData ? `${customUnitData.name} (${baseUnitData.name})` : `${baseUnitData.name} Management`}
          </h3>
          <Button variant="secondary" size="sm" onClick={onClose}>×</Button>
        </div>
        
        <div className="unit-management-body">
          {/* Unit Info */}
          <div className="unit-info-section">
            <div className="unit-stats">
              <div className="stat-item">
                <span className="stat-label">Base Points:</span>
                <span className="stat-value">{baseUnitData.points}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Upgrade Points:</span>
                <span className="stat-value">{calculateUpgradePoints()}</span>
              </div>
              <div className="stat-item total">
                <span className="stat-label">Total Points:</span>
                <span className="stat-value">{totalUnitPoints}</span>
              </div>
            </div>
            
            {officerOfTheLineRule && (
              <div className="special-rule">
                <span className="rule-icon">⚡</span>
                <span className="rule-text">Officer of the Line - Can trigger up to {maxDetachments} detachment{maxDetachments > 1 ? 's' : ''}.</span>
              </div>
            )}
            
            {/* Custom Unit Info */}
            {customUnitData && (
              <div className="custom-unit-info">
                <div className="custom-unit-header">
                  <span className="custom-unit-icon">⚙️</span>
                  <span className="custom-unit-label">Custom Unit Details</span>
                </div>
                <div className="custom-unit-details">
                  <div className="custom-unit-field">
                    <span className="field-label">Name:</span>
                    <span className="field-value">{customUnitData.name}</span>
                  </div>
                  <div className="custom-unit-field">
                    <span className="field-label">Faction:</span>
                    <span className="field-value">{DataLoader.getFactionById(customUnitData.faction)?.name || customUnitData.faction}</span>
                  </div>
                  {customUnitData.subfaction && (
                    <div className="custom-unit-field">
                      <span className="field-label">Subfaction:</span>
                      <span className="field-value">{DataLoader.getFactionById(customUnitData.subfaction)?.name || customUnitData.subfaction}</span>
                    </div>
                  )}
                  <div className="custom-unit-field">
                    <span className="field-label">Created:</span>
                    <span className="field-value">{new Date(customUnitData.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="custom-unit-field">
                    <span className="field-label">Last Modified:</span>
                    <span className="field-value">{new Date(customUnitData.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="tab-navigation">
            <Button 
              variant={activeTab === 'unit' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('unit')}
            >
              Unit Details
            </Button>
            <Button 
              variant={activeTab === 'upgrades' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('upgrades')}
            >
              Upgrades
            </Button>
            {(() => {
              const inPrimeSlot = isInPrimeSlot();
              return inPrimeSlot ? (
                <Button 
                  variant={activeTab === 'prime' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveTab('prime')}
                >
                  Prime Advantages
                </Button>
              ) : null;
            })()}
            {canTriggerDetachments && (
              <Button 
                variant={activeTab === 'detachments' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveTab('detachments')}
              >
                Detachments ({currentDetachmentCount}/{maxDetachments})
              </Button>
            )}
            <Button 
              variant={activeTab === 'custom' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('custom')}
            >
              Custom Units
            </Button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'unit' && (
              <div className="unit-tab">
                <UnitViewer unit={baseUnitData} armyUnit={previewArmyUnit} />
              </div>
            )}
            
            {activeTab === 'upgrades' && (
              <div className="upgrades-tab">
                <div className="upgrades-list">
                  {/* Unit-level upgrades */}
                  {availableUpgrades.length > 0 && (
                    <div className="upgrade-section">
                      <div 
                        className="upgrade-group-header collapsible"
                        onClick={() => toggleGroupCollapse('unit-upgrades')}
                      >
                        <div className="group-info">
                          <div className="group-name">Unit Upgrades</div>
                          <div className="group-description">Upgrades that affect the entire unit</div>
                        </div>
                        <div className="collapse-icon">
                          {isGroupCollapsed('unit-upgrades') ? '▼' : '▲'}
                        </div>
                      </div>
                      
                      {!isGroupCollapsed('unit-upgrades') && (
                        <div className="upgrade-group-content">
                          {availableUpgrades.map((upgrade) => {
                            // Check if this upgrade has dependencies
                            const hasDependencies = upgrade.requiresUpgrade;
                            const isAvailable = !hasDependencies || isUpgradeAvailable(upgrade);

                            if (!isAvailable) return null;

                            return (
                              <div key={upgrade.id} className="upgrade-item">
                                <div className="upgrade-header">
                                  <div className="upgrade-name">{upgrade.name}</div>
                                  <div className="upgrade-description">{upgrade.description}</div>
                                </div>
                                
                                {upgrade.options && upgrade.options.length > 0 ? (
                                  <div className="upgrade-options">
                                    {upgrade.options.map((option: any) => {
                                      const maxInstances = getMaxCount(upgrade);
                                      const appliedCount = selectedUpgrades
                                        .filter(u => u.upgradeId === upgrade.id && u.optionId === option.id)
                                        .reduce((total, u) => total + u.count, 0);

                                      return (
                                        <div key={option.id} className="upgrade-option-container">
                                          <div className="upgrade-option-header">
                                            <div className="option-info">
                                              <div className="option-name">{option.name}</div>
                                              <div className="option-points">+{option.points} points</div>
                                            </div>
                                            {maxInstances > 1 && (
                                              <div className="option-count">
                                                {appliedCount}/{maxInstances} instances
                                              </div>
                                            )}
                                          </div>
                                          <div className="option-description">{option.description}</div>
                                          
                                          <div className="upgrade-option-controls">
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              onClick={() => handleUpgradeCountChange(upgrade.id, option.id, appliedCount + 1)}
                                              disabled={appliedCount >= maxInstances}
                                            >
                                              +
                                            </Button>
                                            <span className="count-display">{appliedCount}</span>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              onClick={() => handleUpgradeCountChange(upgrade.id, option.id, Math.max(0, appliedCount - 1))}
                                              disabled={appliedCount <= 0}
                                            >
                                              -
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div
                                    className={`upgrade-option ${selectedUpgrades.some(u => u.upgradeId === upgrade.id) ? 'selected' : ''}`}
                                    onClick={() => handleUpgradeCountChange(upgrade.id, undefined, 1)}
                                  >
                                    <div className="option-info">
                                      <div className="option-name">Apply Upgrade</div>
                                      <div className="option-points">+0 points</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Model-specific upgrade groups */}
                  {Object.entries(modelUpgradeGroups).map(([modelId, groups]) => {
                    const model = DataLoader.getModelById(modelId);
                    if (!model) return null;

                    return (
                      <div key={modelId} className="model-upgrade-section">
                        <div 
                          className="upgrade-group-header collapsible"
                          onClick={() => toggleGroupCollapse(`model-${modelId}`)}
                        >
                          <div className="group-info">
                            <div className="group-name">{model.name} Upgrades</div>
                            <div className="group-description">Upgrades specific to {model.name} models</div>
                          </div>
                          <div className="collapse-icon">
                            {isGroupCollapsed(`model-${modelId}`) ? '▼' : '▲'}
                          </div>
                        </div>
                        
                        {!isGroupCollapsed(`model-${modelId}`) && (
                          <div className="upgrade-group-content">
                            {groups.map((group) => {
                              const isCollapsed = isGroupCollapsed(group.id);
                              
                              return (
                                <div key={group.id} className="upgrade-group">
                                  <div 
                                    className={`upgrade-group-header ${group.collapsible ? 'collapsible' : ''}`}
                                    onClick={() => group.collapsible && toggleGroupCollapse(group.id)}
                                  >
                                    <div className="group-info">
                                      <div className="group-name">{group.name}</div>
                                      {group.description && (
                                        <div className="group-description">{group.description}</div>
                                      )}
                                    </div>
                                    {group.collapsible && (
                                      <div className="collapse-icon">
                                        {isCollapsed ? '▼' : '▲'}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {!isCollapsed && (
                                    <div className="upgrade-group-content">
                                      {group.upgrades.map((upgradeId: string) => {
                                        const upgrade = DataLoader.getUpgradeById(upgradeId);
                                        if (!upgrade) return null;

                                        return (
                                          <div key={upgrade.id} className="upgrade-item">
                                            <div className="upgrade-header">
                                              <div className="upgrade-name">{upgrade.name}</div>
                                              <div className="upgrade-description">{upgrade.description}</div>
                                            </div>
                                            
                                            {upgrade.options && upgrade.options.length > 0 ? (
                                              <div className="upgrade-options">
                                                {upgrade.options.map((option: any) => {
                                                  const maxInstances = getMaxCount(upgrade);
                                                  const appliedCount = selectedUpgrades
                                                    .filter(u => u.upgradeId === upgrade.id && u.optionId === option.id)
                                                    .reduce((total, u) => total + u.count, 0);

                                                  return (
                                                    <div key={option.id} className="upgrade-option-container">
                                                      <div className="upgrade-option-header">
                                                        <div className="option-info">
                                                          <div className="option-name">{option.name}</div>
                                                          <div className="option-points">+{option.points} points</div>
                                                        </div>
                                                        {maxInstances > 1 && (
                                                          <div className="option-count">
                                                            {appliedCount}/{maxInstances} instances
                                                          </div>
                                                        )}
                                                      </div>
                                                      <div className="option-description">{option.description}</div>
                                                      
                                                      <div className="upgrade-option-controls">
                                                        <Button
                                                          variant="secondary"
                                                          size="sm"
                                                          onClick={() => handleUpgradeCountChange(upgrade.id, option.id, appliedCount + 1)}
                                                          disabled={appliedCount >= maxInstances}
                                                        >
                                                          +
                                                        </Button>
                                                        <span className="count-display">{appliedCount}</span>
                                                        <Button
                                                          variant="secondary"
                                                          size="sm"
                                                          onClick={() => handleUpgradeCountChange(upgrade.id, option.id, Math.max(0, appliedCount - 1))}
                                                          disabled={appliedCount <= 0}
                                                        >
                                                          -
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            ) : (
                                              <div
                                                className={`upgrade-option ${selectedUpgrades.some(u => u.upgradeId === upgrade.id) ? 'selected' : ''}`}
                                                onClick={() => handleUpgradeCountChange(upgrade.id, undefined, 1)}
                                              >
                                                <div className="option-info">
                                                  <div className="option-name">Apply Upgrade</div>
                                                  <div className="option-points">+0 points</div>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {availableUpgrades.length === 0 && Object.keys(modelUpgradeGroups).length === 0 && (
                    <div className="no-upgrades">
                      <p>No upgrades available for this unit.</p>
                    </div>
                  )}
                </div>
                
                <div className="upgrades-actions">
                  <Button variant="success" onClick={handleSaveUpgrades}>
                    Save Upgrades
                  </Button>
                  <Button variant="success" onClick={() => {
                    handleSaveUpgrades();
                    onClose();
                  }}>
                    Save & Close
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'prime' && isInPrimeSlot() && (
              <div className="prime-tab">
                <div className="prime-info">
                  <p>This unit is in a prime slot and can be assigned prime advantages.</p>
                </div>
                
                <div className="prime-advantages-list">
                  {availablePrimeAdvantages.length > 0 ? (
                    availablePrimeAdvantages.map((advantage) => (
                      <div key={advantage.id} className="prime-advantage-item">
                        <div className="advantage-header">
                          <label className="advantage-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedPrimeAdvantages.includes(advantage.id)}
                              onChange={(e) => handlePrimeAdvantageChange(advantage.id, e.target.checked)}
                            />
                            <span className="advantage-name">{advantage.name}</span>
                          </label>
                        </div>
                        <div className="advantage-description">{advantage.description}</div>
                        <div className="advantage-effect">
                          <strong>Effect:</strong> {advantage.effect}
                        </div>
                        {advantage.restrictions && advantage.restrictions.length > 0 && (
                          <div className="advantage-restrictions">
                            <strong>Restrictions:</strong>
                            <ul>
                              {advantage.restrictions.map((restriction, index) => (
                                <li key={index}>{restriction}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="no-prime-advantages">
                      <p>No prime advantages available for this unit.</p>
                    </div>
                  )}
                </div>
                
                <div className="prime-actions">
                  <Button variant="success" onClick={handleSavePrimeAdvantages}>
                    Save Prime Advantages
                  </Button>
                  <Button variant="success" onClick={() => {
                    handleSavePrimeAdvantages();
                    onClose();
                  }}>
                    Save & Close
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'detachments' && canTriggerDetachments && (
              <div className="detachments-tab">
                <div className="detachments-info">
                  <p>This unit can trigger {maxDetachments} detachment{maxDetachments > 1 ? 's' : ''}.</p>
                  {officerOfTheLineRule && (
                    <p className="special-note">
                      <span className="note-icon">⚡</span>
                      Officer of the Line allows triggering up to {maxDetachments} detachment{maxDetachments > 1 ? 's' : ''}.
                    </p>
                  )}
                </div>

                <div className="detachments-list">
                  {triggeredDetachments.length > 0 ? (
                    triggeredDetachments.map((detachment) => {
                      const detachmentData = DataLoader.getDetachmentById(detachment.detachmentId);
                      return (
                        <div key={detachment.detachmentId} className="detachment-item">
                          <div className="detachment-info">
                            <div className="detachment-name">{detachmentData?.name || detachment.detachmentId}</div>
                            <div className="detachment-type">{detachmentData?.type}</div>
                          </div>
                          <div className="detachment-description">{detachmentData?.description}</div>
                          <div className="detachment-units">
                            <span className="units-count">{detachment.units.length} units</span>
                          </div>
                          <Button 
                            variant="danger"
                            onClick={() => handleRemoveDetachment(detachment.detachmentId)}
                          >
                            Remove Detachment
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-detachments">
                      <p>No detachments triggered by this unit.</p>
                    </div>
                  )}
                </div>

                {currentDetachmentCount < maxDetachments && (
                  <div className="add-detachment-section">
                    <Button variant="success" onClick={handleAddDetachment}>
                      Add Detachment
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'custom' && (
              <div className="custom-tab">
                <div className="custom-info">
                  <p>Save this unit configuration as a custom unit for future use.</p>
                  <p>Custom units can be loaded and used in new army lists without having to recreate the configuration.</p>
                </div>

                <div className="custom-actions">
                  {customUnitData ? (
                    // Editing a custom unit in CustomUnitsManager - auto-save
                    <div className="custom-unit-save-info">
                      <p>This custom unit is being automatically saved as you make changes.</p>
                      <Button 
                        variant="info"
                        disabled
                      >
                        Auto-Saving Enabled
                      </Button>
                    </div>
                  ) : unit.originalCustomUnitId ? (
                    // Editing a custom unit that was added to an army list - manual save
                    <div className="custom-unit-save-info">
                      <p>This unit was created from a custom unit. Changes will only affect this army list.</p>
                      <div className="save-options">
                        <Button 
                          variant="success"
                          onClick={() => setShowSaveCustomUnitModal(true)}
                        >
                          Save as New Custom Unit
                        </Button>
                        <Button 
                          variant="warning"
                          onClick={() => handleOverwriteCustomUnit()}
                        >
                          Overwrite Original Custom Unit
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Editing a regular unit - normal save
                    <Button 
                      variant="success"
                      onClick={() => setShowSaveCustomUnitModal(true)}
                    >
                      Save as Custom Unit
                    </Button>
                  )}
                </div>

                <div className="custom-unit-preview">
                  <h4>Current Unit Configuration</h4>
                  <div className="preview-details">
                    <div className="preview-item">
                      <span className="label">Base Unit:</span>
                      <span className="value">{baseUnitData.name}</span>
                    </div>
                    <div className="preview-item">
                      <span className="label">Faction:</span>
                      <span className="value">{faction}</span>
                    </div>
                    {subfaction && (
                      <div className="preview-item">
                        <span className="label">Subfaction:</span>
                        <span className="value">{subfaction}</span>
                      </div>
                    )}
                    <div className="preview-item">
                      <span className="label">Total Points:</span>
                      <span className="value">{totalUnitPoints}</span>
                    </div>
                    <div className="preview-item">
                      <span className="label">Upgrades Applied:</span>
                      <span className="value">{selectedUpgrades.length}</span>
                    </div>
                    {selectedPrimeAdvantages.length > 0 && (
                      <div className="preview-item">
                        <span className="label">Prime Advantages:</span>
                        <span className="value">{selectedPrimeAdvantages.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slot Selection Modal for Logistical Benefit */}
      {showSlotSelectionModal && (
        <div className="modal-overlay" onClick={handleCancelSlotSelection}>
          <div className="modal-content slot-selection-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Select Battlefield Role</h3>
            <p>Choose which battlefield role slot to add to your detachment:</p>
            
            <div className="role-selection-grid">
              {DataLoader.getBattlefieldRoles().map((role) => (
                <Button
                  key={role.id}
                  variant="primary"
                  onClick={() => handleSlotSelection(role.id)}
                >
                  <div className="role-name">{role.name}</div>
                  <div className="role-description">{role.description}</div>
                </Button>
              ))}
            </div>
            
            <div className="modal-actions">
              <Button variant="secondary" onClick={handleCancelSlotSelection}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Save Custom Unit Modal */}
      <SaveCustomUnitModal
        isOpen={showSaveCustomUnitModal}
        unit={unit}
        faction={faction}
        subfaction={subfaction}
        onClose={() => setShowSaveCustomUnitModal(false)}
        onSaved={(customUnitId) => {
          console.log('Custom unit saved with ID:', customUnitId);
          setShowSaveCustomUnitModal(false);
        }}
      />
    </div>
  );
};

export default UnitManagementModal;