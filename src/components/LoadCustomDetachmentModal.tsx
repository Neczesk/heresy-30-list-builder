import React, { useState, useEffect } from 'react';
import { Button, Card } from './ui';
import { CustomDetachmentStorage } from '../utils/customDetachmentStorage';
import type { CustomDetachmentMetadata, ArmyDetachment } from '../types/army';
import styles from './LoadCustomDetachmentModal.module.css';

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
    <div className={styles['modal-overlay']} onClick={onClose}>
      <div className={`${styles['modal-content']} ${styles['load-custom-detachment-modal']}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles['modal-header']}>
          <h2>Load Custom Detachment</h2>
          <Button variant="secondary" size="sm" onClick={onClose}>×</Button>
        </div>

        <div className={styles['modal-body']}>
          <div className={styles['current-detachment-info']}>
            <h3>Current Detachment</h3>
            <p>Loading a custom detachment will overwrite the current configuration.</p>
            <div className={styles['current-detachment-details']}>
              <div className={styles['detail-item']}>
                <span className={styles.label}>Base Detachment:</span>
                <span className={styles.value}>{baseDetachmentId}</span>
              </div>
              <div className={styles['detail-item']}>
                <span className={styles.label}>Current Units:</span>
                <span className={styles.value}>{currentDetachment.units.length}</span>
              </div>
              <div className={styles['detail-item']}>
                <span className={styles.label}>Current Points:</span>
                <span className={styles.value}>{currentDetachment.units.reduce((total, unit) => total + unit.points, 0)} pts</span>
              </div>
            </div>
          </div>

          {customDetachments.length === 0 ? (
            <Card variant="transparent" padding="lg" className={styles['no-custom-detachments']}>
              <p>No custom detachments found for this base detachment.</p>
              <p className={styles.hint}>Save a custom detachment first to load it here.</p>
            </Card>
          ) : (
            <div className={styles['custom-detachments-list']}>
              <h3>Available Custom Detachments ({customDetachments.length})</h3>
              <div className={styles['detachments-grid']}>
                {customDetachments.map((detachment) => (
                  <Card
                    key={detachment.id}
                    variant={selectedDetachment === detachment.id ? 'elevated' : 'default'}
                    padding="lg"
                    interactive
                    className={`${styles['detachment-option']} ${selectedDetachment === detachment.id ? styles.selected : ''}`}
                    onClick={() => handleDetachmentSelect(detachment.id)}
                  >
                    <div className={styles['detachment-header']}>
                      <h4>{detachment.name}</h4>
                      <span className={styles['detachment-date']}>
                        {new Date(detachment.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={styles['detachment-description']}>{detachment.description}</p>
                    <div className={styles['detachment-meta']}>
                      <span className={styles.faction}>{detachment.faction}</span>
                      {detachment.subfaction && (
                        <span className={styles.subfaction}>{detachment.subfaction}</span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className={styles['error-message']}>
              {error}
            </div>
          )}
        </div>

        <div className={styles['modal-actions']}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {customDetachments.length > 0 && (
            <Button 
              variant="info"
              onClick={handleLoad}
              disabled={!selectedDetachment}
            >
              Load Custom Detachment
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadCustomDetachmentModal; 