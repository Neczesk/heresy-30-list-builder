import React, { useState } from 'react';
import { Button, Card } from './ui';
import { DataLoader } from '../utils/dataLoader';
import type { Detachment, Faction, Allegiance } from '../types/army';
import AllegianceSelector from './AllegianceSelector';
import './DetachmentSelector.css';

interface DetachmentSelectorProps {
  onDetachmentSelected: (detachment: Detachment, faction: Faction, allegiance: Allegiance, subFaction?: Faction) => void;
  onCancel: () => void;
}

const DetachmentSelector: React.FC<DetachmentSelectorProps> = ({
  onDetachmentSelected,
  onCancel
}) => {
  const [selectedDetachment, setSelectedDetachment] = useState<Detachment | null>(null);
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [selectedAllegiance, setSelectedAllegiance] = useState<Allegiance>('Loyalist');
  const [step, setStep] = useState<'allegiance' | 'detachment' | 'faction' | 'subFaction'>('allegiance');

  // Get available primary detachments
  const primaryDetachments = DataLoader.getDetachmentsByType('Primary');
  
  // Get main factions filtered by allegiance (including Universal)
  const mainFactions = DataLoader.getMainFactionsByAllegiance(selectedAllegiance);
  
  // Get legion sub-factions filtered by allegiance (including Universal)
  const legionSubFactions = DataLoader.getLegionSubFactionsByAllegiance(selectedAllegiance);

  const handleAllegianceSelect = (allegiance: Allegiance) => {
    setSelectedAllegiance(allegiance);
    setStep('detachment');
  };

  const handleDetachmentSelect = (detachment: Detachment) => {
    setSelectedDetachment(detachment);
    setStep('faction');
  };

  const handleFactionSelect = (faction: Faction) => {
    setSelectedFaction(faction);
    
    // If Legiones Astartes is selected, go to sub-faction selection
    if (faction.id === 'legiones-astartes') {
      setStep('subFaction');
    } else {
      // For other factions, immediately create the army list
      onDetachmentSelected(selectedDetachment!, faction, selectedAllegiance);
    }
  };

  const handleSubFactionSelect = (subFaction: Faction) => {
    // Immediately create the army list with the selected sub-faction
    onDetachmentSelected(selectedDetachment!, selectedFaction!, selectedAllegiance, subFaction);
  };

  const handleBack = () => {
    if (step === 'subFaction') {
      setStep('faction');
    } else if (step === 'faction') {
      setStep('detachment');
      setSelectedFaction(null);
    } else if (step === 'detachment') {
      setStep('allegiance');
      setSelectedDetachment(null);
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

  const renderDetachmentStep = () => (
    <div className="detachment-step">
      <h3>Select Primary Detachment</h3>
      <p>Choose the primary detachment for your {selectedAllegiance} army list.</p>
      
      <div className="detachments-grid">
        {primaryDetachments.map((detachment) => (
          <Card
            key={detachment.id}
            variant={selectedDetachment?.id === detachment.id ? 'elevated' : 'default'}
            padding="lg"
            interactive
            className={`detachment-card ${selectedDetachment?.id === detachment.id ? 'selected' : ''}`}
            onClick={() => handleDetachmentSelect(detachment)}
          >
            <h4>{detachment.name}</h4>
            <p className="detachment-description">{detachment.description}</p>
            <div className="detachment-slots">
              <span className="slots-label">Slots:</span>
              {detachment.slots.map((slot, index) => (
                <span key={index} className="slot">
                  {slot.count}x {DataLoader.getBattlefieldRoleById(slot.roleId)?.name}
                  {slot.isPrime && <span className="prime-indicator">★</span>}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderFactionStep = () => (
    <div className="faction-step">
      <h3>Select Faction</h3>
      <p>Choose the faction for your {selectedDetachment?.name}.</p>
      
      <div className="factions-grid">
        {mainFactions.map((faction) => (
          <Card
            key={faction.id}
            variant={selectedFaction?.id === faction.id ? 'elevated' : 'default'}
            padding="lg"
            interactive
            className={`faction-card ${selectedFaction?.id === faction.id ? 'selected' : ''}`}
            onClick={() => handleFactionSelect(faction)}
          >
            <h4>{faction.name}</h4>
            <p className="faction-description">{faction.description}</p>
            <div className="faction-type">{faction.type}</div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSubFactionStep = () => (
    <div className="subfaction-step">
      <h3>Select Legion</h3>
      <p>Choose your specific Legion for the {selectedFaction?.name}.</p>
      
      <div className="factions-grid">
        {legionSubFactions.map((subFaction) => (
          <Card
            key={subFaction.id}
            variant={selectedFaction?.id === subFaction.id ? 'elevated' : 'default'}
            padding="lg"
            interactive
            className={`faction-card ${selectedFaction?.id === subFaction.id ? 'selected' : ''}`}
            onClick={() => handleSubFactionSelect(subFaction)}
          >
            <h4>{subFaction.name}</h4>
            <p className="faction-description">{subFaction.description}</p>
            <div className="faction-type">{subFaction.type}</div>
          </Card>
        ))}
      </div>
    </div>
  );

  const getCurrentStepTitle = () => {
    switch (step) {
      case 'allegiance':
        return 'Select Allegiance';
      case 'detachment':
        return 'Select Detachment';
      case 'faction':
        return 'Select Faction';
      case 'subFaction':
        return 'Select Legion';
      default:
        return '';
    }
  };

  return (
    <div className="detachment-selector">
      <div className="detachment-selector-header">
        <h2>{getCurrentStepTitle()}</h2>
        <Button variant="secondary" size="sm" onClick={handleBack}>
          ← Back
        </Button>
      </div>

      {step === 'allegiance' && renderAllegianceStep()}
      {step === 'detachment' && renderDetachmentStep()}
      {step === 'faction' && renderFactionStep()}
      {step === 'subFaction' && renderSubFactionStep()}
    </div>
  );
};

export default DetachmentSelector; 