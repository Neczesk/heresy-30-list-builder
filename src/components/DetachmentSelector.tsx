import React, { useState } from 'react';
import { Button, Card } from './ui';
import { DataLoader } from '../utils/dataLoader';
import type { Detachment, Faction, Allegiance } from '../types/army';
import AllegianceSelector from './AllegianceSelector';
import styles from './DetachmentSelector.module.css';

interface DetachmentSelectorProps {
  onDetachmentSelected: (detachment: Detachment, faction: Faction, allegiance: Allegiance, subFaction?: Faction) => void;
  onCancel: () => void;
}

const DetachmentSelector: React.FC<DetachmentSelectorProps> = ({
  onDetachmentSelected,
  onCancel
}) => {
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [selectedAllegiance, setSelectedAllegiance] = useState<Allegiance>('Loyalist');
  const [step, setStep] = useState<'allegiance' | 'faction' | 'subFaction'>('allegiance');

  // Get main factions filtered by allegiance (including Universal)
  const mainFactions = DataLoader.getMainFactionsByAllegiance(selectedAllegiance);
  
  // Get legion sub-factions filtered by allegiance (including Universal)
  const legionSubFactions = DataLoader.getLegionSubFactionsByAllegiance(selectedAllegiance);

  const handleAllegianceSelect = (allegiance: Allegiance) => {
    setSelectedAllegiance(allegiance);
    setStep('faction');
  };

  const handleFactionSelect = (faction: Faction) => {
    setSelectedFaction(faction);
    
    // If Legiones Astartes is selected, go to sub-faction selection
    if (faction.id === 'legiones-astartes') {
      setStep('subFaction');
    } else {
      // For other factions, immediately create the army list with Crusade Primary Detachment
      const crusadeDetachment = DataLoader.getDetachmentById('crusade-primary');
      if (crusadeDetachment) {
        onDetachmentSelected(crusadeDetachment, faction, selectedAllegiance);
      }
    }
  };

  const handleSubFactionSelect = (subFaction: Faction) => {
    // Immediately create the army list with the selected sub-faction and Crusade Primary Detachment
    const crusadeDetachment = DataLoader.getDetachmentById('crusade-primary');
    if (crusadeDetachment) {
      onDetachmentSelected(crusadeDetachment, selectedFaction!, selectedAllegiance, subFaction);
    }
  };

  const handleBack = () => {
    if (step === 'subFaction') {
      setStep('faction');
    } else if (step === 'faction') {
      setStep('allegiance');
      setSelectedFaction(null);
    } else {
      onCancel();
    }
  };

  const renderAllegianceStep = () => (
    <AllegianceSelector
      selectedAllegiance={selectedAllegiance}
      onAllegianceChange={handleAllegianceSelect}
    />
  );

  const renderFactionStep = () => (
    <div className={styles['faction-step']}>
      <div className={styles['factions-grid']}>
        {mainFactions.map((faction) => (
          <Card
            key={faction.id}
            variant="dark"
            padding="lg"
            interactive
            className={`${styles['faction-card']} ${selectedFaction?.id === faction.id ? styles.selected : ''}`}
            onClick={() => handleFactionSelect(faction)}
          >
            <h4>{faction.name}</h4>
            <p className={styles['faction-description']}>{faction.description}</p>
            <div className={styles['faction-type']}>{faction.type}</div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSubFactionStep = () => (
    <div className={styles['subfaction-step']}>
      <div className={styles['factions-grid']}>
        {legionSubFactions.map((subFaction) => (
          <Card
            key={subFaction.id}
            variant="dark"
            padding="lg"
            interactive
            className={`${styles['faction-card']} ${selectedFaction?.id === subFaction.id ? styles.selected : ''}`}
            onClick={() => handleSubFactionSelect(subFaction)}
          >
            <h4>{subFaction.name}</h4>
            <p className={styles['faction-description']}>{subFaction.description}</p>
            <div className={styles['faction-type']}>{subFaction.type}</div>
          </Card>
        ))}
      </div>
    </div>
  );

  const getCurrentStepTitle = () => {
    switch (step) {
      case 'allegiance':
        return 'Select Allegiance';
      case 'faction':
        return 'Select Faction';
      case 'subFaction':
        return 'Select Legion';
      default:
        return '';
    }
  };

  return (
    <div className={styles['detachment-selector']}>
      <div className={styles['selector-header']}>
        <h2>{getCurrentStepTitle()}</h2>
        <Button variant="secondary" size="sm" onClick={handleBack}>
          ← Back
        </Button>
      </div>

      <div className={styles['selector-content']}>
        {step === 'allegiance' && renderAllegianceStep()}
        {step === 'faction' && renderFactionStep()}
        {step === 'subFaction' && renderSubFactionStep()}
      </div>
    </div>
  );
};

export default DetachmentSelector; 