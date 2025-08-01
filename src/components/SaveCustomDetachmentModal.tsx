import React, { useState } from 'react';
import { Button } from './ui';
import { CustomDetachmentStorage } from '../utils/customDetachmentStorage';
import type { ArmyDetachment } from '../types/army';
import './SaveCustomDetachmentModal.css';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content save-custom-detachment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Save Custom Detachment</h2>
          <Button variant="secondary" size="sm" onClick={onClose}>×</Button>
        </div>

        <div className="modal-body">
          <div className="form-group">
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

          <div className="form-group">
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
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="detachment-preview">
            <h3>Detachment Preview</h3>
            <div className="preview-details">
              <div className="preview-item">
                <span className="label">Base Detachment:</span>
                <span className="value">{detachment.detachmentId}</span>
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
                <span className="label">Units:</span>
                <span className="value">{detachment.units.length}</span>
              </div>
              <div className="preview-item">
                <span className="label">Prime Advantages:</span>
                <span className="value">{detachment.primeAdvantages.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
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