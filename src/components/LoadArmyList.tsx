import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from './ui';
import { ArmyListStorage } from '../utils/armyListStorage';
import type { ArmyListMetadata, Army } from '../types/army';
import styles from './LoadArmyList.module.css';

interface LoadArmyListProps {
  onLoadList: (armyList: Army) => void;
}

const LoadArmyList: React.FC<LoadArmyListProps> = ({ 
  onLoadList 
}) => {
  const navigate = useNavigate();
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
      <div className={styles['load-army-list']}>
        <div className={styles.loading}>Loading army lists...</div>
      </div>
    );
  }

  return (
    <div className={styles['load-army-list']}>
      <div className={styles['load-header']}>
        <Button variant="secondary" onClick={() => navigate('/')}>
          ← Back to Menu
        </Button>
        <h2>Load Army List</h2>
      </div>

      <div className={styles['load-content']}>
        {armyLists.length === 0 ? (
          <Card variant="transparent" padding="lg" className={styles['empty-state']}>
            <h3>No Army Lists Found</h3>
            <p>You haven't created any army lists yet.</p>
            <p>Create a new army list to get started!</p>
          </Card>
        ) : (
          <div className={styles['army-lists-grid']}>
            {armyLists.map((list) => (
              <Card 
                key={list.id} 
                variant="default"
                padding="lg"
                interactive
                className={styles['army-list-card']}
                onClick={() => handleLoadList(list.id)}
              >
                <div className={styles['list-header']}>
                  <h3>{list.name}</h3>
                  <div className={styles['list-actions']}>
                    <Button 
                      variant="info"
                      size="sm"
                      onClick={(e) => e && handleDuplicateList(list, e)}
                      title="Duplicate army list"
                    >
                      📋
                    </Button>
                    <Button 
                      variant="danger"
                      size="sm"
                      onClick={(e) => e && handleDeleteList(list.id, e)}
                      title="Delete army list"
                    >
                      ×
                    </Button>
                  </div>
                </div>
                
                <div className={styles['list-details']}>
                  <div className={styles.detail}>
                    <span className={styles.label}>Faction:</span>
                    <span className={styles.value}>{list.faction}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>Allegiance:</span>
                    <span className={`${styles.value} ${styles.allegiance} ${styles[(list.allegiance || 'Universal').toLowerCase()]}`}>
                      {getAllegianceDisplay(list.allegiance)}
                    </span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>Points:</span>
                    <span className={styles.value}>{list.totalPoints} / {list.pointsLimit}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>Status:</span>
                    <span className={`${styles.value} ${styles.status} ${styles[list.isNamed ? 'named' : 'unnamed']}`}>
                      {list.isNamed ? 'Named' : 'Unnamed'}
                    </span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>Updated:</span>
                    <span className={styles.value}>{formatDate(list.updatedAt)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Duplicate Modal */}
      {showDuplicateModal && duplicatingList && (
        <div className={styles['duplicate-modal-overlay']} onClick={handleCancelDuplicate}>
          <div className={styles['duplicate-modal-content']} onClick={(e) => e.stopPropagation()}>
            <div className={styles['duplicate-modal-header']}>
              <h3>Duplicate Army List</h3>
              <Button variant="secondary" size="sm" onClick={handleCancelDuplicate}>×</Button>
            </div>
            
            <div className={styles['duplicate-modal-body']}>
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
                className={styles['name-input']}
                autoFocus
              />
              
              <div className={styles['duplicate-preview']}>
                <h4>Original List Details:</h4>
                <div className={styles['preview-details']}>
                  <div className={styles['preview-item']}>
                    <span className={styles.label}>Name:</span>
                    <span className={styles.value}>{duplicatingList.name}</span>
                  </div>
                  <div className={styles['preview-item']}>
                    <span className={styles.label}>Faction:</span>
                    <span className={styles.value}>{duplicatingList.faction}</span>
                  </div>
                  <div className={styles['preview-item']}>
                    <span className={styles.label}>Points:</span>
                    <span className={styles.value}>{duplicatingList.totalPoints} / {duplicatingList.pointsLimit}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles['duplicate-modal-actions']}>
              <Button 
                variant="secondary"
                onClick={handleCancelDuplicate}
              >
                Cancel
              </Button>
              <Button 
                variant="warning"
                onClick={handleConfirmDuplicate}
                disabled={!newListName.trim()}
              >
                Duplicate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadArmyList; 