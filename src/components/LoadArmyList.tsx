import React, { useState, useEffect } from 'react';
import { ArmyListStorage } from '../utils/armyListStorage';
import type { ArmyListMetadata } from '../types/army';
import './LoadArmyList.css';

interface LoadArmyListProps {
  onBackToMenu: () => void;
  onLoadList: (armyList: any) => void;
}

const LoadArmyList: React.FC<LoadArmyListProps> = ({ 
  onBackToMenu, 
  onLoadList 
}) => {
  const [armyLists, setArmyLists] = useState<ArmyListMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicatingList, setDuplicatingList] = useState<ArmyListMetadata | null>(null);
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    // Load all army list metadata
    const loadLists = () => {
      try {
        const metadata = ArmyListStorage.getAllArmyListMetadata();
        setArmyLists(metadata);
      } catch (error) {
        console.error('Error loading army lists:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLists();
  }, []);

  const handleLoadList = (id: string) => {
    const armyList = ArmyListStorage.loadArmyList(id);
    if (armyList) {
      onLoadList(armyList);
    }
  };

  const handleDeleteList = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this army list?')) {
      ArmyListStorage.deleteArmyList(id);
      setArmyLists(prev => prev.filter(list => list.id !== id));
    }
  };

  const handleDuplicateList = (list: ArmyListMetadata, event: React.MouseEvent) => {
    event.stopPropagation();
    setDuplicatingList(list);
    setNewListName(`${list.name} (Copy)`);
    setShowDuplicateModal(true);
  };

  const handleConfirmDuplicate = () => {
    if (!duplicatingList || !newListName.trim()) return;

    try {
      // Load the original army list
      const originalList = ArmyListStorage.loadArmyList(duplicatingList.id);
      if (!originalList) {
        alert('Failed to load the original army list.');
        return;
      }

      // Create a new army list with the same data but new name and ID
      const duplicatedList = {
        ...originalList,
        id: `army-list-${Date.now()}`,
        name: newListName.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };



      // Save the duplicated list
      ArmyListStorage.saveArmyList(duplicatedList);

      // Refresh the list
      const metadata = ArmyListStorage.getAllArmyListMetadata();
      setArmyLists(metadata);

      // Close modal and reset state
      setShowDuplicateModal(false);
      setDuplicatingList(null);
      setNewListName('');

      alert('Army list duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating army list:', error);
      alert('Failed to duplicate army list. Please try again.');
    }
  };

  const handleCancelDuplicate = () => {
    setShowDuplicateModal(false);
    setDuplicatingList(null);
    setNewListName('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAllegianceDisplay = (allegiance: string | undefined) => {
    // Handle undefined allegiance (for backward compatibility)
    if (!allegiance) {
      return 'Mixed';
    }
    // For existing army lists that might have Universal allegiance
    if (allegiance === 'Universal') {
      return 'Mixed';
    }
    return allegiance;
  };

  if (isLoading) {
    return (
      <div className="load-army-list">
        <div className="loading">Loading army lists...</div>
      </div>
    );
  }

  return (
    <div className="load-army-list">
      <div className="load-header">
        <button className="back-button" onClick={onBackToMenu}>
          ← Back to Menu
        </button>
        <h2>Load Army List</h2>
      </div>

      <div className="load-content">
        {armyLists.length === 0 ? (
          <div className="empty-state">
            <h3>No Army Lists Found</h3>
            <p>You haven't created any army lists yet.</p>
            <p>Create a new army list to get started!</p>
          </div>
        ) : (
          <div className="army-lists-grid">
            {armyLists.map((list) => (
              <div 
                key={list.id} 
                className="army-list-card"
                onClick={() => handleLoadList(list.id)}
              >
                <div className="list-header">
                  <h3>{list.name}</h3>
                  <div className="list-actions">
                    <button 
                      className="duplicate-button"
                      onClick={(e) => handleDuplicateList(list, e)}
                      title="Duplicate army list"
                    >
                      📋
                    </button>
                    <button 
                      className="delete-button"
                      onClick={(e) => handleDeleteList(list.id, e)}
                      title="Delete army list"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="list-details">
                  <div className="detail">
                    <span className="label">Faction:</span>
                    <span className="value">{list.faction}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Allegiance:</span>
                    <span className={`value allegiance ${(list.allegiance || 'Universal').toLowerCase()}`}>
                      {getAllegianceDisplay(list.allegiance)}
                    </span>
                  </div>
                  <div className="detail">
                    <span className="label">Points:</span>
                    <span className="value">{list.totalPoints} / {list.pointsLimit}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Status:</span>
                    <span className={`value status ${list.isNamed ? 'named' : 'unnamed'}`}>
                      {list.isNamed ? 'Named' : 'Unnamed'}
                    </span>
                  </div>
                  <div className="detail">
                    <span className="label">Updated:</span>
                    <span className="value">{formatDate(list.updatedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Duplicate Modal */}
      {showDuplicateModal && duplicatingList && (
        <div className="duplicate-modal-overlay" onClick={handleCancelDuplicate}>
          <div className="duplicate-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="duplicate-modal-header">
              <h3>Duplicate Army List</h3>
              <button className="close-button" onClick={handleCancelDuplicate}>×</button>
            </div>
            
            <div className="duplicate-modal-body">
              <p>Enter a name for the duplicated army list:</p>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newListName.trim()) {
                    handleConfirmDuplicate();
                  }
                }}
                placeholder="Enter army list name..."
                className="name-input"
                autoFocus
              />
              
              <div className="duplicate-preview">
                <h4>Original List Details:</h4>
                <div className="preview-details">
                  <div className="preview-item">
                    <span className="label">Name:</span>
                    <span className="value">{duplicatingList.name}</span>
                  </div>
                  <div className="preview-item">
                    <span className="label">Faction:</span>
                    <span className="value">{duplicatingList.faction}</span>
                  </div>
                  <div className="preview-item">
                    <span className="label">Points:</span>
                    <span className="value">{duplicatingList.totalPoints} / {duplicatingList.pointsLimit}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="duplicate-modal-actions">
              <button 
                className="cancel-button"
                onClick={handleCancelDuplicate}
              >
                Cancel
              </button>
              <button 
                className="duplicate-button"
                onClick={handleConfirmDuplicate}
                disabled={!newListName.trim()}
              >
                Duplicate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadArmyList; 