import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from './ui';
import { CustomDetachmentStorage } from '../utils/customDetachmentStorage';
import { DataLoader } from '../utils/dataLoader';
import DetachmentEditorModal from './DetachmentEditorModal';
import type { CustomDetachment, CustomDetachmentMetadata } from '../types/army';
import styles from './CustomDetachmentsManager.module.css';

const CustomDetachmentsManager: React.FC = () => {
  const navigate = useNavigate();
  const [customDetachments, setCustomDetachments] = useState<CustomDetachmentMetadata[]>([]);
  const [renamingDetachment, setRenamingDetachment] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmDetachment, setDeleteConfirmDetachment] = useState<CustomDetachmentMetadata | null>(null);
  const [editingDetachment, setEditingDetachment] = useState<CustomDetachment | null>(null);
  const [showDetachmentEditorModal, setShowDetachmentEditorModal] = useState(false);

  // Load custom detachments on mount
  useEffect(() => {
    loadCustomDetachments();
  }, []);

  const loadCustomDetachments = () => {
    const detachments = CustomDetachmentStorage.getAllCustomDetachmentMetadata();
    setCustomDetachments(detachments);
  };

  const handleEditDetachment = (detachmentId: string) => {
    const customDetachment = CustomDetachmentStorage.getCustomDetachment(detachmentId);
    if (customDetachment) {
      setEditingDetachment(customDetachment);
      setShowDetachmentEditorModal(true);
    }
  };

  const handleDeleteDetachment = (detachment: CustomDetachmentMetadata) => {
    setDeleteConfirmDetachment(detachment);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmDetachment) {
      CustomDetachmentStorage.deleteCustomDetachment(deleteConfirmDetachment.id);
      setDeleteConfirmDetachment(null);
      loadCustomDetachments();
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmDetachment(null);
  };

  const handleDetachmentEditorClose = () => {
    setShowDetachmentEditorModal(false);
    setEditingDetachment(null);
  };

  const handleDetachmentEditorSave = (updatedDetachment: CustomDetachment) => {
    CustomDetachmentStorage.saveCustomDetachment(updatedDetachment);
    setShowDetachmentEditorModal(false);
    setEditingDetachment(null);
    loadCustomDetachments();
  };

  const handleStartRename = (detachment: CustomDetachmentMetadata) => {
    setRenamingDetachment({ id: detachment.id, name: detachment.name });
  };

  const handleSaveRename = () => {
    if (renamingDetachment) {
      const customDetachment = CustomDetachmentStorage.getCustomDetachment(renamingDetachment.id);
      if (customDetachment) {
        // Check if new name conflicts with existing detachments
        const existingDetachments = CustomDetachmentStorage.getAllCustomDetachmentMetadata();
        const nameExists = existingDetachments.some(
          cd => cd.name === renamingDetachment.name && cd.id !== renamingDetachment.id
        );
        
        if (nameExists) {
          alert('A custom detachment with this name already exists.');
          return;
        }

        // Update the custom detachment with new name
        const updatedDetachment: CustomDetachment = {
          ...customDetachment,
          name: renamingDetachment.name,
          updatedAt: new Date().toISOString()
        };

        // Save updated detachment
        CustomDetachmentStorage.saveCustomDetachment(updatedDetachment);
        
        setRenamingDetachment(null);
        loadCustomDetachments();
      }
    }
  };

  const handleCancelRename = () => {
    setRenamingDetachment(null);
  };

  const handleRenameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (renamingDetachment) {
      setRenamingDetachment({ ...renamingDetachment, name: e.target.value });
    }
  };

  const handleRenameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
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

  const getBaseDetachmentName = (baseDetachmentId: string) => {
    const detachment = DataLoader.getDetachmentById(baseDetachmentId);
    return detachment?.name || baseDetachmentId;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  const calculateDetachmentPoints = (units: any[]) => {
    return units.reduce((total, unit) => total + (unit.points || 0), 0);
  };

  return (
    <div className={styles['custom-detachments-manager-page']}>
      <div className={styles['custom-detachments-manager-header']}>
        <div className={styles['header-content']}>
          <h1>Custom Detachments Manager</h1>
                  <Button variant="secondary" onClick={() => navigate('/')}>
          ← Back to Menu
        </Button>
        </div>
      </div>

      <div className={styles['custom-detachments-manager-content']}>
        <div className={styles['custom-detachments-manager-body']}>
          {customDetachments.length === 0 ? (
            <Card variant="transparent" padding="lg" className={styles['no-custom-detachments']}>
              <p>No custom detachments saved yet.</p>
              <p>Create custom detachments by configuring detachments in your army lists and saving them.</p>
            </Card>
          ) : (
            <div className={styles['custom-detachments-list']}>
              {customDetachments.map((detachment) => {
                const fullDetachment = CustomDetachmentStorage.getCustomDetachment(detachment.id);
                const totalPoints = fullDetachment ? calculateDetachmentPoints(fullDetachment.units) : 0;
                
                return (
                  <Card key={detachment.id} variant="default" padding="lg" className={styles['custom-detachment-item']}>
                    <div className={styles['custom-detachment-info']}>
                      <div className={styles['custom-detachment-header']}>
                        {renamingDetachment?.id === detachment.id ? (
                          <div className={styles['rename-input-container']}>
                            <input
                              type="text"
                              value={renamingDetachment.name}
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
                          <div className={styles['detachment-name-section']}>
                            <h3 className={styles['detachment-name']}>{detachment.name}</h3>
                            <span className={styles['custom-badge']}>Custom</span>
                          </div>
                        )}
                      </div>

                      <div className={styles['detachment-details']}>
                        <div className={styles['detail-row']}>
                          <span className={styles['detail-label']}>Base Detachment:</span>
                          <span className={styles['detail-value']}>{getBaseDetachmentName(detachment.baseDetachmentId)}</span>
                        </div>
                        <div className={styles['detail-row']}>
                          <span className={styles['detail-label']}>Faction:</span>
                          <span className={styles['detail-value']}>{getFactionName(detachment.faction)}</span>
                        </div>
                        {detachment.subfaction && (
                          <div className={styles['detail-row']}>
                            <span className={styles['detail-label']}>Subfaction:</span>
                            <span className={styles['detail-value']}>{getSubfactionName(detachment.subfaction)}</span>
                          </div>
                        )}
                        <div className={styles['detail-row']}>
                          <span className={styles['detail-label']}>Units:</span>
                          <span className={styles['detail-value']}>{fullDetachment?.units.length || 0} units</span>
                        </div>
                        <div className={styles['detail-row']}>
                          <span className={styles['detail-label']}>Total Points:</span>
                          <span className={styles['detail-value']}>{totalPoints} pts</span>
                        </div>
                        <div className={styles['detail-row']}>
                          <span className={styles['detail-label']}>Created:</span>
                          <span className={styles['detail-value']}>{formatDate(detachment.createdAt)}</span>
                        </div>
                        <div className={styles['detail-row']}>
                          <span className={styles['detail-label']}>Updated:</span>
                          <span className={styles['detail-value']}>{formatDate(detachment.updatedAt)}</span>
                        </div>
                        {detachment.description && (
                          <div className={styles['detail-row']}>
                            <span className={styles['detail-label']}>Description:</span>
                            <span className={`${styles['detail-value']} ${styles.description}`}>{detachment.description}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles['custom-detachment-actions']}>
                      <Button 
                        variant="primary"
                        size="sm"
                        onClick={() => handleEditDetachment(detachment.id)}
                        title="Edit detachment configuration"
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="info"
                        size="sm"
                        onClick={() => handleStartRename(detachment)}
                        title="Rename detachment"
                      >
                        Rename
                      </Button>
                      <Button 
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteDetachment(detachment)}
                        title="Delete detachment"
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmDetachment && (
          <div className={styles['delete-confirm-overlay']} onClick={handleCancelDelete}>
            <div className={styles['delete-confirm-content']} onClick={(e) => e.stopPropagation()}>
              <h3>Delete Custom Detachment</h3>
              <p>Are you sure you want to delete "{deleteConfirmDetachment.name}"?</p>
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

        {/* Detachment Editor Modal */}
        {showDetachmentEditorModal && editingDetachment && (
          <DetachmentEditorModal
            isOpen={showDetachmentEditorModal}
            customDetachment={editingDetachment}
            onClose={handleDetachmentEditorClose}
            onSave={handleDetachmentEditorSave}
          />
        )}
      </div>
    </div>
  );
};

export default CustomDetachmentsManager; 