import React, { useState } from 'react';
import { Button, Card } from '../../components/ui';
import { DataLoader } from '../../utils/dataLoader';
import type { Faction, Detachment } from '../../types/army';

interface AlliedFactionSelectorProps {
  primaryFactionId: string;
  onFactionSelected: (
    detachment: Detachment,
    faction: Faction,
    subFaction?: Faction
  ) => void;
  onCancel: () => void;
}

const AlliedFactionSelector: React.FC<AlliedFactionSelectorProps> = ({
  primaryFactionId,
  onFactionSelected,
  onCancel,
}) => {
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [step, setStep] = useState<'faction' | 'subFaction'>('faction');

  // Get main factions (excluding the primary faction)
  const mainFactions = DataLoader.getMainFactions().filter(
    faction => faction.id !== primaryFactionId
  );

  // Get legion sub-factions (for Legiones Astartes)
  const legionSubFactions = DataLoader.getLegionSubFactions();

  // Get the Allied detachment
  const alliedDetachment = DataLoader.getDetachmentById('allied-detachment');

  const handleFactionSelect = (faction: Faction) => {
    setSelectedFaction(faction);

    // If Legiones Astartes is selected, go to sub-faction selection
    if (faction.id === 'legiones-astartes') {
      setStep('subFaction');
    } else {
      // For other factions, immediately create the allied detachment
      if (alliedDetachment) {
        onFactionSelected(alliedDetachment, faction);
      }
    }
  };

  const handleSubFactionSelect = (subFaction: Faction) => {
    // Immediately create the allied detachment with the selected sub-faction
    if (alliedDetachment) {
      onFactionSelected(alliedDetachment, selectedFaction!, subFaction);
    }
  };

  const handleBack = () => {
    if (step === 'subFaction') {
      setStep('faction');
    } else {
      onCancel();
    }
  };

  const renderFactionStep = () => (
    <div >
      <h3>Select Allied Faction</h3>
      <p>
        Choose the faction for your Allied Detachment. This must be different
        from your primary faction.
      </p>

      <div >
        {mainFactions.map(faction => (
          <Card
            key={faction.id}
            variant="default"
            padding="lg"
            interactive

            onClick={() => handleFactionSelect(faction)}
          >
            <h4>{faction.name}</h4>
            <p >
              {faction.description}
            </p>
            <div >
              <span >Type:</span>
              <span >{faction.type}</span>
            </div>
            {faction.specialRules && (
              <div >
                <span >Special Rules:</span>
                <div >
                  {faction.specialRules.map((rule, index) => (
                    <span key={index} >
                      {rule}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {faction.id === 'legiones-astartes' && (
              <div >
                <span >
                  Note: You'll need to select a specific Legion
                </span>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSubFactionStep = () => (
    <div >
      <h3>Select Allied Legion</h3>
      <p>Choose your Allied Space Marine Legion.</p>

      <div >
        {legionSubFactions.map(legion => (
          <Card
            key={legion.id}
            variant="default"
            padding="lg"
            interactive

            onClick={() => handleSubFactionSelect(legion)}
          >
            <h4>{legion.name}</h4>
              <p >
              {legion.description}
            </p>
            <div >
              <span >Type:</span>
              <span >{legion.type}</span>
            </div>
            {legion.specialRules && (
              <div >
                <span >Special Rules:</span>
                <div >
                  {legion.specialRules.map((rule, index) => (
                    <span key={index} >
                      {rule}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );

  const getCurrentStepTitle = () => {
    switch (step) {
      case 'faction':
        return 'Select Allied Faction';
      case 'subFaction':
        return 'Select Allied Legion';
      default:
        return 'Allied Detachment Setup';
    }
  };

  return (
    <div >
      <div >
        <Button variant="secondary" size="sm" onClick={handleBack}>
          ← Back
        </Button>
        <h2>{getCurrentStepTitle()}</h2>
      </div>

      <div >
        {step === 'faction' && renderFactionStep()}
        {step === 'subFaction' && renderSubFactionStep()}
      </div>
    </div>
  );
};

export default AlliedFactionSelector;
