import React, { useState, useEffect } from 'react';
import { Button } from './ui';
import { CustomUnitStorage } from '../utils/customUnitStorage';
import type { ArmyUnit } from '../types/army';
import styles from './SaveCustomUnitModal.module.css';

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
    <div className={styles.saveCustomUnitOverlay} onClick={handleCancel}>
      <div className={styles.saveCustomUnitContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.saveCustomUnitHeader}>
          <h3>Save Custom Unit</h3>
          <Button variant="secondary" size="sm" onClick={handleCancel}>×</Button>
        </div>
        
        <div className={styles.saveCustomUnitBody}>
          <div className={styles.formGroup}>
            <label htmlFor="unit-name">Unit Name *</label>
            <input
              id="unit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for your custom unit"
              className={isNameTaken ? styles.error : ''}
              disabled={isSaving}
            />
            {isNameTaken && (
              <div className={styles.errorMessage}>
                A custom unit with this name already exists
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
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

          <div className={styles.unitPreview}>
            <h4>Unit Preview</h4>
            <div className={styles.previewInfo}>
              <div className={styles.previewItem}>
                <span className={styles.label}>Base Unit:</span>
                <span className={styles.value}>{unit.unitId}</span>
              </div>
              <div className={styles.previewItem}>
                <span className={styles.label}>Faction:</span>
                <span className={styles.value}>{faction}</span>
              </div>
              {subfaction && (
                <div className={styles.previewItem}>
                  <span className={styles.label}>Subfaction:</span>
                  <span className={styles.value}>{subfaction}</span>
                </div>
              )}
              <div className={styles.previewItem}>
                <span className={styles.label}>Upgrades:</span>
                <span className={styles.value}>{unit.upgrades?.length || 0} applied</span>
              </div>
              {unit.primeAdvantages && unit.primeAdvantages.length > 0 && (
                <div className={styles.previewItem}>
                  <span className={styles.label}>Prime Advantages:</span>
                  <span className={styles.value}>{unit.primeAdvantages.length} applied</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
        </div>

        <div className={styles.saveCustomUnitActions}>
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