import React, { useState, useEffect } from 'react';
import { Button } from './ui';
import { CustomUnitStorage } from '../utils/customUnitStorage';
import type { ArmyUnit } from '../types/army';
import './SaveCustomUnitModal.css';

interface SaveCustomUnitModalProps {
  isOpen: boolean;
  unit: ArmyUnit;
  faction: string;
  subfaction?: string;
  onClose: () => void;
  onSaved?: (customUnitId: string) => void;
}

const SaveCustomUnitModal: React.FC<SaveCustomUnitModalProps> = ({
  isOpen,
  unit,
  faction,
  subfaction,
  onClose,
  onSaved
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isNameTaken, setIsNameTaken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError('');
      setIsNameTaken(false);
    }
  }, [isOpen]);

  // Check if name is taken when name changes
  useEffect(() => {
    if (name.trim()) {
      const taken = CustomUnitStorage.isNameTaken(name.trim());
      setIsNameTaken(taken);
    } else {
      setIsNameTaken(false);
    }
  }, [name]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a name for your custom unit');
      return;
    }

    if (isNameTaken) {
      setError('A custom unit with this name already exists');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const customUnit = CustomUnitStorage.createCustomUnitFromArmyUnit(
        name.trim(),
        unit,
        faction,
        subfaction,
        description.trim() || undefined
      );

      CustomUnitStorage.saveCustomUnit(customUnit);
      
      if (onSaved) {
        onSaved(customUnit.id);
      }
      
      onClose();
    } catch (err) {
      setError('Failed to save custom unit. Please try again.');
      console.error('Error saving custom unit:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="save-custom-unit-overlay" onClick={handleCancel}>
      <div className="save-custom-unit-content" onClick={(e) => e.stopPropagation()}>
        <div className="save-custom-unit-header">
          <h3>Save Custom Unit</h3>
          <Button variant="secondary" size="sm" onClick={handleCancel}>×</Button>
        </div>
        
        <div className="save-custom-unit-body">
          <div className="form-group">
            <label htmlFor="unit-name">Unit Name *</label>
            <input
              id="unit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for your custom unit"
              className={isNameTaken ? 'error' : ''}
              disabled={isSaving}
            />
            {isNameTaken && (
              <div className="error-message">
                A custom unit with this name already exists
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="unit-description">Description (Optional)</label>
            <textarea
              id="unit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for your custom unit"
              rows={3}
              disabled={isSaving}
            />
          </div>

          <div className="unit-preview">
            <h4>Unit Preview</h4>
            <div className="preview-info">
              <div className="preview-item">
                <span className="label">Base Unit:</span>
                <span className="value">{unit.unitId}</span>
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
                <span className="label">Upgrades:</span>
                <span className="value">{unit.upgrades?.length || 0} applied</span>
              </div>
              {unit.primeAdvantages && unit.primeAdvantages.length > 0 && (
                <div className="preview-item">
                  <span className="label">Prime Advantages:</span>
                  <span className="value">{unit.primeAdvantages.length} applied</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        <div className="save-custom-unit-actions">
          <Button 
            variant="secondary"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            variant="success"
            onClick={handleSave}
            disabled={isSaving || !name.trim() || isNameTaken}
          >
            {isSaving ? 'Saving...' : 'Save Custom Unit'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SaveCustomUnitModal; 