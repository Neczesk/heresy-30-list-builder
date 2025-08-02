import React, { useState } from 'react';
import { Button } from './ui';
import { CustomDetachmentStorage } from '../utils/customDetachmentStorage';
import type { ArmyDetachment } from '../types/army';
import styles from './SaveCustomDetachmentModal.module.css';

interface SaveCustomDetachmentModalProps {
  isOpen: boolean;
  detachment: ArmyDetachment;
  faction: string;
  subfaction?: string;
  onClose: () => void;
  onSaved: (customDetachmentId: string) => void;
}

const SaveCustomDetachmentModal: React.FC<SaveCustomDetachmentModalProps> = ({
  isOpen,
  detachment,
  faction,
  subfaction,
  onClose,
  onSaved
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter a name for your custom detachment.');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description for your custom detachment.');
      return;
    }

    try {
      const customDetachment = CustomDetachmentStorage.createCustomDetachment(
        name.trim(),
        detachment.detachmentId,
        faction,
        subfaction,
        detachment.customName,
        description.trim(),
        detachment.units,
        detachment.primeAdvantages
      );

      CustomDetachmentStorage.saveCustomDetachment(customDetachment);
      onSaved(customDetachment.id);
    } catch (error) {
      console.error('Error saving custom detachment:', error);
      setError('Failed to save custom detachment. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className={styles['modal-overlay']} onClick={onClose}>
      <div className={`${styles['modal-content']} ${styles['save-custom-detachment-modal']}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles['modal-header']}>
          <h2>Save Custom Detachment</h2>
          <Button variant="secondary" size="sm" onClick={onClose}>×</Button>
        </div>

        <div className={styles['modal-body']}>
          <div className={styles['form-group']}>
            <label htmlFor="detachment-name">Detachment Name:</label>
            <input
              id="detachment-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a name for your custom detachment"
              maxLength={50}
            />
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="detachment-description">Description:</label>
            <textarea
              id="detachment-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your custom detachment configuration"
              rows={4}
              maxLength={500}
            />
          </div>

          {error && (
            <div className={styles['error-message']}>
              {error}
            </div>
          )}

          <div className={styles['detachment-preview']}>
            <h3>Detachment Preview</h3>
            <div className={styles['preview-details']}>
              <div className={styles['preview-item']}>
                <span className={styles.label}>Base Detachment:</span>
                <span className={styles.value}>{detachment.detachmentId}</span>
              </div>
              <div className={styles['preview-item']}>
                <span className={styles.label}>Faction:</span>
                <span className={styles.value}>{faction}</span>
              </div>
              {subfaction && (
                <div className={styles['preview-item']}>
                  <span className={styles.label}>Subfaction:</span>
                  <span className={styles.value}>{subfaction}</span>
                </div>
              )}
              <div className={styles['preview-item']}>
                <span className={styles.label}>Units:</span>
                <span className={styles.value}>{detachment.units.length}</span>
              </div>
              <div className={styles['preview-item']}>
                <span className={styles.label}>Prime Advantages:</span>
                <span className={styles.value}>{detachment.primeAdvantages.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles['modal-actions']}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSave}>
            Save Custom Detachment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SaveCustomDetachmentModal; 