import React, { useState, useEffect } from 'react';
import { CustomDetachmentStorage } from '../utils/customDetachmentStorage';
import type { CustomDetachmentMetadata, ArmyDetachment } from '../types/army';
import './LoadCustomDetachmentModal.css';

interface LoadCustomDetachmentModalProps {
  isOpen: boolean;
  baseDetachmentId: string;
  currentDetachment: ArmyDetachment;
  onClose: () => void;
  onLoad: (customDetachment: any) => void;
}

const LoadCustomDetachmentModal: React.FC<LoadCustomDetachmentModalProps> = ({
  isOpen,
  baseDetachmentId,
  currentDetachment,
  onClose,
  onLoad
}) => {
  const [customDetachments, setCustomDetachments] = useState<CustomDetachmentMetadata[]>([]);
  const [selectedDetachment, setSelectedDetachment] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Load custom detachments with the same base detachment ID
      const allCustomDetachments = CustomDetachmentStorage.getAllCustomDetachmentMetadata();
      const matchingDetachments = allCustomDetachments.filter(
        cd => cd.baseDetachmentId === baseDetachmentId
      );
      setCustomDetachments(matchingDetachments);
      setSelectedDetachment(null);
      setError('');
    }
  }, [isOpen, baseDetachmentId]);

  const handleLoad = () => {
    if (!selectedDetachment) {
      setError('Please select a custom detachment to load.');
      return;
    }

    try {
      const customDetachment = CustomDetachmentStorage.getCustomDetachment(selectedDetachment);
      if (!customDetachment) {
        setError('Selected custom detachment not found.');
        return;
      }

      onLoad(customDetachment);
    } catch (error) {
      console.error('Error loading custom detachment:', error);
      setError('Failed to load custom detachment. Please try again.');
    }
  };

  const handleDetachmentSelect = (detachmentId: string) => {
    setSelectedDetachment(detachmentId);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content load-custom-detachment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Load Custom Detachment</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="current-detachment-info">
            <h3>Current Detachment</h3>
            <p>Loading a custom detachment will overwrite the current configuration.</p>
            <div className="current-detachment-details">
              <div className="detail-item">
                <span className="label">Base Detachment:</span>
                <span className="value">{baseDetachmentId}</span>
              </div>
              <div className="detail-item">
                <span className="label">Current Units:</span>
                <span className="value">{currentDetachment.units.length}</span>
              </div>
              <div className="detail-item">
                <span className="label">Current Points:</span>
                <span className="value">{currentDetachment.units.reduce((total, unit) => total + unit.points, 0)} pts</span>
              </div>
            </div>
          </div>

          {customDetachments.length === 0 ? (
            <div className="no-custom-detachments">
              <p>No custom detachments found for this base detachment.</p>
              <p className="hint">Save a custom detachment first to load it here.</p>
            </div>
          ) : (
            <div className="custom-detachments-list">
              <h3>Available Custom Detachments ({customDetachments.length})</h3>
              <div className="detachments-grid">
                {customDetachments.map((detachment) => (
                  <div
                    key={detachment.id}
                    className={`detachment-option ${selectedDetachment === detachment.id ? 'selected' : ''}`}
                    onClick={() => handleDetachmentSelect(detachment.id)}
                  >
                    <div className="detachment-header">
                      <h4>{detachment.name}</h4>
                      <span className="detachment-date">
                        {new Date(detachment.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="detachment-description">{detachment.description}</p>
                    <div className="detachment-meta">
                      <span className="faction">{detachment.faction}</span>
                      {detachment.subfaction && (
                        <span className="subfaction">{detachment.subfaction}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          {customDetachments.length > 0 && (
            <button 
              className="load-button" 
              onClick={handleLoad}
              disabled={!selectedDetachment}
            >
              Load Custom Detachment
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadCustomDetachmentModal; 