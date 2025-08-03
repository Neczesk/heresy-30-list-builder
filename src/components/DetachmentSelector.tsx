import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { DataLoader } from '../utils/dataLoader';
import type { Detachment, Faction, Allegiance } from '../types/army';
import AllegianceSelector from '../pages/listBuilder/AllegianceSelector';

interface DetachmentSelectorProps {
  onDetachmentSelected: (
    detachment: Detachment,
    faction: Faction,
    allegiance: Allegiance,
    subFaction?: Faction
  ) => void;
  onCancel: () => void;
}

const DetachmentSelector: React.FC<DetachmentSelectorProps> = ({
  onDetachmentSelected,
  onCancel,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [selectedAllegiance, setSelectedAllegiance] =
    useState<Allegiance>('Loyalist');
  const [step, setStep] = useState<'allegiance' | 'faction' | 'subFaction'>(
    'allegiance'
  );

  // Get main factions filtered by allegiance (including Universal)
  const mainFactions =
    DataLoader.getMainFactionsByAllegiance(selectedAllegiance);

  // Get legion sub-factions filtered by allegiance (including Universal)
  const legionSubFactions =
    DataLoader.getLegionSubFactionsByAllegiance(selectedAllegiance);

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
      onDetachmentSelected(
        crusadeDetachment,
        selectedFaction!,
        selectedAllegiance,
        subFaction
      );
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
    <Box>
      <Typography
        variant={isMobile ? 'h5' : 'h4'}
        component="h3"
        gutterBottom
        sx={{
          fontSize: { xs: '1.5rem', sm: '2rem' },
          textAlign: { xs: 'center', sm: 'left' },
        }}
      >
        Select Faction
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          mb: { xs: 3, sm: 4 },
          textAlign: { xs: 'center', sm: 'left' },
          fontSize: { xs: '0.875rem', sm: '1rem' },
        }}
      >
        Choose your army's faction.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: { xs: 2, sm: 3 },
          maxWidth: { xs: '100%', sm: 'auto' },
        }}
      >
        {mainFactions.map(faction => (
          <Box key={faction.id}>
            <Card
              variant={
                selectedFaction?.id === faction.id ? 'elevation' : 'outlined'
              }
              elevation={selectedFaction?.id === faction.id ? 4 : 1}
              sx={{
                cursor: 'pointer',
                height: '100%',
                minHeight: { xs: '120px', sm: 'auto' },
                ...(selectedFaction?.id === faction.id && {
                  borderColor: 'primary.main',
                }),
              }}
              onClick={() => handleFactionSelect(faction)}
            >
              <CardContent
                sx={{
                  p: { xs: 2, sm: 3 },
                  textAlign: { xs: 'center', sm: 'left' },
                }}
              >
                <Typography
                  variant={isMobile ? 'h6' : 'h6'}
                  component="h4"
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1.125rem', sm: '1.25rem' },
                    textAlign: { xs: 'center', sm: 'left' },
                  }}
                >
                  {faction.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    textAlign: { xs: 'center', sm: 'left' },
                  }}
                >
                  {faction.description}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: { xs: 'center', sm: 'flex-start' },
                  }}
                >
                  <Chip
                    label={faction.type}
                    color="primary"
                    size={isMobile ? 'small' : 'medium'}
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );

  const renderSubFactionStep = () => (
    <Box>
      <Typography
        variant={isMobile ? 'h5' : 'h4'}
        component="h3"
        gutterBottom
        sx={{
          fontSize: { xs: '1.5rem', sm: '2rem' },
          textAlign: { xs: 'center', sm: 'left' },
        }}
      >
        Select Legion
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          mb: { xs: 3, sm: 4 },
          textAlign: { xs: 'center', sm: 'left' },
          fontSize: { xs: '0.875rem', sm: '1rem' },
        }}
      >
        Choose your Space Marine Legion.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: { xs: 2, sm: 3 },
          maxWidth: { xs: '100%', sm: 'auto' },
        }}
      >
        {legionSubFactions.map(subFaction => (
          <Box key={subFaction.id}>
            <Card
              variant={
                selectedFaction?.id === subFaction.id ? 'elevation' : 'outlined'
              }
              elevation={selectedFaction?.id === subFaction.id ? 4 : 1}
              sx={{
                cursor: 'pointer',
                height: '100%',
                minHeight: { xs: '120px', sm: 'auto' },
                ...(selectedFaction?.id === subFaction.id && {
                  borderColor: 'primary.main',
                }),
              }}
              onClick={() => handleSubFactionSelect(subFaction)}
            >
              <CardContent
                sx={{
                  p: { xs: 2, sm: 3 },
                  textAlign: { xs: 'center', sm: 'left' },
                }}
              >
                <Typography
                  variant={isMobile ? 'h6' : 'h6'}
                  component="h4"
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1.125rem', sm: '1.25rem' },
                    textAlign: { xs: 'center', sm: 'left' },
                  }}
                >
                  {subFaction.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    textAlign: { xs: 'center', sm: 'left' },
                  }}
                >
                  {subFaction.description}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: { xs: 'center', sm: 'flex-start' },
                  }}
                >
                  <Chip
                    label={subFaction.type}
                    color="primary"
                    size={isMobile ? 'small' : 'medium'}
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
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
    <Box
      sx={{
        maxWidth: { xs: '100%', sm: 1200 },
        mx: 'auto',
        p: { xs: 2, sm: 4 },
        width: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: { xs: 3, sm: 4 },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Typography
          variant={isMobile ? 'h4' : 'h3'}
          component="h2"
          sx={{
            fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' },
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          {getCurrentStepTitle()}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          size={isMobile ? 'small' : 'medium'}
          onClick={handleBack}
        >
          Back
        </Button>
      </Box>

      <Box>
        {step === 'allegiance' && renderAllegianceStep()}
        {step === 'faction' && renderFactionStep()}
        {step === 'subFaction' && renderSubFactionStep()}
      </Box>
    </Box>
  );
};

export default DetachmentSelector;
