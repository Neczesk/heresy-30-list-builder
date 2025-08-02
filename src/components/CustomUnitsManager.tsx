import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from './ui';
import { CustomUnitStorage } from '../utils/customUnitStorage';
import { DataLoader } from '../utils/dataLoader';
import UnitManagementModal from './UnitManagementModal';
import type { CustomUnit, CustomUnitMetadata, ArmyUnit } from '../types/army';
import styles from './CustomUnitsManager.module.css';

const CustomUnitsManager: React.FC = () => {
  const navigate = useNavigate();
  const [customUnits, setCustomUnits] = useState<CustomUnitMetadata[]>([]);
  const [editingUnit, setEditingUnit] = useState<CustomUnit | null>(null);
  const [showUnitManagementModal, setShowUnitManagementModal] = useState(false);
  const [renamingUnit, setRenamingUnit] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmUnit, setDeleteConfirmUnit] = useState<CustomUnitMetadata | null>(null);

  // Load custom units on mount
  useEffect(() => {
    loadCustomUnits();
  }, []);

  const loadCustomUnits = () => {
    const units = CustomUnitStorage.getAllCustomUnitMetadata();
    setCustomUnits(units);
  };

  const handleEditUnit = (unitId: string) => {
    const customUnit = CustomUnitStorage.getCustomUnit(unitId);
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
      CustomUnitStorage.deleteCustomUnit(deleteConfirmUnit.id);
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
      const customUnit = CustomUnitStorage.getCustomUnit(renamingUnit.id);
      if (customUnit) {
        // Check if new name conflicts with existing units
        if (CustomUnitStorage.isNameTaken(renamingUnit.name, renamingUnit.id)) {
          alert('A custom unit with this name already exists.');
          return;
        }

        // Update the custom unit with new name and ID
        const newId = CustomUnitStorage.generateId(renamingUnit.name);
        const updatedUnit: CustomUnit = {
          ...customUnit,
          id: newId,
          name: renamingUnit.name,
          updatedAt: new Date().toISOString()
        };

        // Delete old unit and save new one
        CustomUnitStorage.deleteCustomUnit(renamingUnit.id);
        CustomUnitStorage.saveCustomUnit(updatedUnit);
        
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
        updatedAt: new Date().toISOString()
      };

      CustomUnitStorage.saveCustomUnit(updatedCustomUnit);
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
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className={styles['custom-units-manager-page']}>
      <div className={styles['custom-units-manager-header']}>
        <div className={styles['header-content']}>
          <h1>Custom Units Manager</h1>
                  <Button variant="secondary" onClick={() => navigate('/')}>
          ← Back to Menu
        </Button>
        </div>
      </div>

      <div className={styles['custom-units-manager-content']}>
        <div className={styles['custom-units-manager-body']}>
          {customUnits.length === 0 ? (
            <Card variant="transparent" padding="lg" className={styles['no-custom-units']}>
              <p>No custom units saved yet.</p>
              <p>Create custom units by configuring units in your army lists and saving them.</p>
            </Card>
          ) : (
            <div className={styles['custom-units-list']}>
              {customUnits.map((unit) => (
                <Card key={unit.id} variant="default" padding="lg" className={styles['custom-unit-item']}>
                  <div className={styles['custom-unit-info']}>
                    <div className={styles['custom-unit-header']}>
                      {renamingUnit?.id === unit.id ? (
                        <div className={styles['rename-input-container']}>
                          <input
                            type="text"
                            value={renamingUnit.name}
                            onChange={handleRenameInputChange}
                            onKeyDown={handleRenameKeyPress}
                            className={styles['rename-input']}
                            autoFocus
                          />
                          <div className={styles['rename-actions']}>
                            <Button 
                              variant="success"
                              size="sm"
                              onClick={handleSaveRename}
                            >
                              ✓
                            </Button>
                            <Button 
                              variant="danger"
                              size="sm"
                              onClick={handleCancelRename}
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className={styles['unit-name-section']}>
                          <h3 className={styles['unit-name']}>{unit.name}</h3>
                          <span className={styles['custom-badge']}>Custom</span>
                        </div>
                      )}
                    </div>

                    <div className={styles['unit-details']}>
                      <div className={styles['detail-row']}>
                        <span className={styles['detail-label']}>Base Unit:</span>
                        <span className={styles['detail-value']}>{getBaseUnitName(unit.baseUnitId)}</span>
                      </div>
                      <div className={styles['detail-row']}>
                        <span className={styles['detail-label']}>Faction:</span>
                        <span className={styles['detail-value']}>{getFactionName(unit.faction)}</span>
                      </div>
                      {unit.subfaction && (
                        <div className={styles['detail-row']}>
                          <span className={styles['detail-label']}>Subfaction:</span>
                          <span className={styles['detail-value']}>{getSubfactionName(unit.subfaction)}</span>
                        </div>
                      )}
                      <div className={styles['detail-row']}>
                        <span className={styles['detail-label']}>Created:</span>
                        <span className={styles['detail-value']}>{formatDate(unit.createdAt)}</span>
                      </div>
                      <div className={styles['detail-row']}>
                        <span className={styles['detail-label']}>Updated:</span>
                        <span className={styles['detail-value']}>{formatDate(unit.updatedAt)}</span>
                      </div>
                      {unit.description && (
                        <div className={styles['detail-row']}>
                          <span className={styles['detail-label']}>Description:</span>
                          <span className={`${styles['detail-value']} ${styles.description}`}>{unit.description}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles['custom-unit-actions']}>
                    <Button 
                      variant="primary"
                      size="sm"
                      onClick={() => handleEditUnit(unit.id)}
                      title="Edit unit configuration"
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="info"
                      size="sm"
                      onClick={() => handleStartRename(unit)}
                      title="Rename unit"
                    >
                      Rename
                    </Button>
                    <Button 
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteUnit(unit)}
                      title="Delete unit"
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmUnit && (
          <div className={styles['delete-confirm-overlay']} onClick={handleCancelDelete}>
            <div className={styles['delete-confirm-content']} onClick={(e) => e.stopPropagation()}>
              <h3>Delete Custom Unit</h3>
              <p>Are you sure you want to delete "{deleteConfirmUnit.name}"?</p>
              <p className={styles.warning}>This action cannot be undone.</p>
              <div className={styles['delete-confirm-actions']}>
                <Button 
                  variant="secondary"
                  onClick={handleCancelDelete}
                >
                  Cancel
                </Button>
                <Button 
                  variant="danger"
                  onClick={handleConfirmDelete}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}

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
              modelInstanceWargearChanges: editingUnit.modelInstanceWargearChanges
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
              isNamed: true
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
              updatedAt: editingUnit.updatedAt
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CustomUnitsManager; 