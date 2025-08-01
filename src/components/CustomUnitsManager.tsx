import React, { useState, useEffect } from 'react';
import { CustomUnitStorage } from '../utils/customUnitStorage';
import { DataLoader } from '../utils/dataLoader';
import UnitManagementModal from './UnitManagementModal';
import type { CustomUnit, CustomUnitMetadata, ArmyUnit } from '../types/army';
import './CustomUnitsManager.css';

interface CustomUnitsManagerProps {
  onBackToMenu: () => void;
}

const CustomUnitsManager: React.FC<CustomUnitsManagerProps> = ({
  onBackToMenu
}) => {
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
    <div className="custom-units-manager-page">
      <div className="custom-units-manager-header">
        <div className="header-content">
          <h1>Custom Units Manager</h1>
          <button className="back-button" onClick={onBackToMenu}>
            ← Back to Menu
          </button>
        </div>
      </div>

      <div className="custom-units-manager-content">
        <div className="custom-units-manager-body">
          {customUnits.length === 0 ? (
            <div className="no-custom-units">
              <p>No custom units saved yet.</p>
              <p>Create custom units by configuring units in your army lists and saving them.</p>
            </div>
          ) : (
            <div className="custom-units-list">
              {customUnits.map((unit) => (
                <div key={unit.id} className="custom-unit-item">
                  <div className="custom-unit-info">
                    <div className="custom-unit-header">
                      {renamingUnit?.id === unit.id ? (
                        <div className="rename-input-container">
                          <input
                            type="text"
                            value={renamingUnit.name}
                            onChange={handleRenameInputChange}
                            onKeyDown={handleRenameKeyPress}
                            className="rename-input"
                            autoFocus
                          />
                          <div className="rename-actions">
                            <button 
                              className="save-rename-button"
                              onClick={handleSaveRename}
                            >
                              ✓
                            </button>
                            <button 
                              className="cancel-rename-button"
                              onClick={handleCancelRename}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="unit-name-section">
                          <h3 className="unit-name">{unit.name}</h3>
                          <span className="custom-badge">Custom</span>
                        </div>
                      )}
                    </div>

                    <div className="unit-details">
                      <div className="detail-row">
                        <span className="detail-label">Base Unit:</span>
                        <span className="detail-value">{getBaseUnitName(unit.baseUnitId)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Faction:</span>
                        <span className="detail-value">{getFactionName(unit.faction)}</span>
                      </div>
                      {unit.subfaction && (
                        <div className="detail-row">
                          <span className="detail-label">Subfaction:</span>
                          <span className="detail-value">{getSubfactionName(unit.subfaction)}</span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="detail-label">Created:</span>
                        <span className="detail-value">{formatDate(unit.createdAt)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Updated:</span>
                        <span className="detail-value">{formatDate(unit.updatedAt)}</span>
                      </div>
                      {unit.description && (
                        <div className="detail-row">
                          <span className="detail-label">Description:</span>
                          <span className="detail-value description">{unit.description}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="custom-unit-actions">
                    <button 
                      className="edit-button"
                      onClick={() => handleEditUnit(unit.id)}
                      title="Edit unit configuration"
                    >
                      Edit
                    </button>
                    <button 
                      className="rename-button"
                      onClick={() => handleStartRename(unit)}
                      title="Rename unit"
                    >
                      Rename
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteUnit(unit)}
                      title="Delete unit"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmUnit && (
          <div className="delete-confirm-overlay" onClick={handleCancelDelete}>
            <div className="delete-confirm-content" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Custom Unit</h3>
              <p>Are you sure you want to delete "{deleteConfirmUnit.name}"?</p>
              <p className="warning">This action cannot be undone.</p>
              <div className="delete-confirm-actions">
                <button 
                  className="cancel-button"
                  onClick={handleCancelDelete}
                >
                  Cancel
                </button>
                <button 
                  className="delete-button"
                  onClick={handleConfirmDelete}
                >
                  Delete
                </button>
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