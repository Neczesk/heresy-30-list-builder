import React, { useState, useEffect } from 'react';
import { CustomDetachmentStorage } from '../utils/customDetachmentStorage';
import { DataLoader } from '../utils/dataLoader';
import DetachmentEditorModal from './DetachmentEditorModal';
import type { CustomDetachment, CustomDetachmentMetadata } from '../types/army';
import './CustomDetachmentsManager.css';

interface CustomDetachmentsManagerProps {
  onBackToMenu: () => void;
}

const CustomDetachmentsManager: React.FC<CustomDetachmentsManagerProps> = ({
  onBackToMenu
}) => {
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
    <div className="custom-detachments-manager-page">
      <div className="custom-detachments-manager-header">
        <div className="header-content">
          <h1>Custom Detachments Manager</h1>
          <button className="back-button" onClick={onBackToMenu}>
            ← Back to Menu
          </button>
        </div>
      </div>

      <div className="custom-detachments-manager-content">
        <div className="custom-detachments-manager-body">
          {customDetachments.length === 0 ? (
            <div className="no-custom-detachments">
              <p>No custom detachments saved yet.</p>
              <p>Create custom detachments by configuring detachments in your army lists and saving them.</p>
            </div>
          ) : (
            <div className="custom-detachments-list">
              {customDetachments.map((detachment) => {
                const fullDetachment = CustomDetachmentStorage.getCustomDetachment(detachment.id);
                const totalPoints = fullDetachment ? calculateDetachmentPoints(fullDetachment.units) : 0;
                
                return (
                  <div key={detachment.id} className="custom-detachment-item">
                    <div className="custom-detachment-info">
                      <div className="custom-detachment-header">
                        {renamingDetachment?.id === detachment.id ? (
                          <div className="rename-input-container">
                            <input
                              type="text"
                              value={renamingDetachment.name}
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
                          <div className="detachment-name-section">
                            <h3 className="detachment-name">{detachment.name}</h3>
                            <span className="custom-badge">Custom</span>
                          </div>
                        )}
                      </div>

                      <div className="detachment-details">
                        <div className="detail-row">
                          <span className="detail-label">Base Detachment:</span>
                          <span className="detail-value">{getBaseDetachmentName(detachment.baseDetachmentId)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Faction:</span>
                          <span className="detail-value">{getFactionName(detachment.faction)}</span>
                        </div>
                        {detachment.subfaction && (
                          <div className="detail-row">
                            <span className="detail-label">Subfaction:</span>
                            <span className="detail-value">{getSubfactionName(detachment.subfaction)}</span>
                          </div>
                        )}
                        <div className="detail-row">
                          <span className="detail-label">Units:</span>
                          <span className="detail-value">{fullDetachment?.units.length || 0} units</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Total Points:</span>
                          <span className="detail-value">{totalPoints} pts</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Created:</span>
                          <span className="detail-value">{formatDate(detachment.createdAt)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Updated:</span>
                          <span className="detail-value">{formatDate(detachment.updatedAt)}</span>
                        </div>
                        {detachment.description && (
                          <div className="detail-row">
                            <span className="detail-label">Description:</span>
                            <span className="detail-value description">{detachment.description}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="custom-detachment-actions">
                      <button 
                        className="edit-button"
                        onClick={() => handleEditDetachment(detachment.id)}
                        title="Edit detachment configuration"
                      >
                        Edit
                      </button>
                      <button 
                        className="rename-button"
                        onClick={() => handleStartRename(detachment)}
                        title="Rename detachment"
                      >
                        Rename
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteDetachment(detachment)}
                        title="Delete detachment"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmDetachment && (
          <div className="delete-confirm-overlay" onClick={handleCancelDelete}>
            <div className="delete-confirm-content" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Custom Detachment</h3>
              <p>Are you sure you want to delete "{deleteConfirmDetachment.name}"?</p>
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