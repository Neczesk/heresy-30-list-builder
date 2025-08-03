import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { Check } from '@mui/icons-material';
import type { Allegiance } from '../../types/army';

interface AllegianceSelectorProps {
  selectedAllegiance: Allegiance;
  onAllegianceChange: (allegiance: Allegiance) => void;
  disabled?: boolean;
}

const AllegianceSelector: React.FC<AllegianceSelectorProps> = ({
  selectedAllegiance,
  onAllegianceChange,
  disabled = false,
}) => {
  const allegiances: {
    value: Allegiance;
    label: string;
    description: string;
    color: 'success' | 'error' | 'warning';
  }[] = [
    {
      value: 'Loyalist',
      label: 'Loyalist',
      description: 'Remain faithful to the Emperor',
      color: 'success',
    },
    {
      value: 'Traitor',
      label: 'Traitor',
      description: 'Follow the Warmaster into heresy',
      color: 'error',
    },
  ];

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 4 }}>
      <Typography variant="h3" component="h3" gutterBottom>
        Select Allegiance
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Choose your army's allegiance in the Horus Heresy.
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 3,
          maxWidth: 600,
          mx: 'auto',
        }}
      >
        {allegiances.map(allegiance => {
          const isSelected = selectedAllegiance === allegiance.value;

          return (
            <Box key={allegiance.value} sx={{ flex: 1 }}>
              <Card
                variant={isSelected ? 'elevation' : 'outlined'}
                elevation={isSelected ? 4 : 1}
                sx={{
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.6 : 1,
                  height: '100%',
                  ...(isSelected && {
                    borderColor: `${allegiance.color}.main`,
                  }),
                }}
                onClick={() => !disabled && onAllegianceChange(allegiance.value)}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography variant="h5" component="h4">
                      {allegiance.label}
                    </Typography>

                    {isSelected && (
                      <Check color={allegiance.color} />
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {allegiance.description}
                  </Typography>

                  {isSelected && (
                    <Chip
                      label="Selected"
                      color={allegiance.color}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </CardContent>
              </Card>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default AllegianceSelector;
