import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  useTheme,
  useMediaQuery,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    <Box
      sx={{
        maxWidth: { xs: '100%', sm: 600 },
        mx: 'auto',
        p: { xs: 2, sm: 4 },
        width: '100%',
      }}
    >
      <Typography
        variant={isMobile ? 'h4' : 'h3'}
        component="h3"
        gutterBottom
        sx={{
          fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' },
          textAlign: { xs: 'center', sm: 'left' },
        }}
      >
        Select Allegiance
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
        Choose your army's allegiance in the Horus Heresy.
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 3 },
          maxWidth: { xs: '100%', sm: 600 },
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
                  minHeight: { xs: '120px', sm: 'auto' },
                  ...(isSelected && {
                    borderColor: `${allegiance.color}.main`,
                  }),
                }}
                onClick={() =>
                  !disabled && onAllegianceChange(allegiance.value)
                }
              >
                <CardContent
                  sx={{
                    p: { xs: 2, sm: 3 },
                    textAlign: { xs: 'center', sm: 'left' },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: { xs: 'center', sm: 'space-between' },
                      alignItems: 'center',
                      mb: 1,
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 1, sm: 0 },
                    }}
                  >
                    <Typography
                      variant={isMobile ? 'h6' : 'h5'}
                      component="h4"
                      sx={{
                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                        textAlign: { xs: 'center', sm: 'left' },
                      }}
                    >
                      {allegiance.label}
                    </Typography>

                    {isSelected && (
                      <Check
                        color={allegiance.color}
                        sx={{
                          fontSize: { xs: '1.5rem', sm: '2rem' },
                        }}
                      />
                    )}
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      textAlign: { xs: 'center', sm: 'left' },
                    }}
                  >
                    {allegiance.description}
                  </Typography>

                  {isSelected && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: { xs: 'center', sm: 'flex-start' },
                      }}
                    >
                      <Chip
                        label="Selected"
                        color={allegiance.color}
                        size={isMobile ? 'small' : 'medium'}
                        variant="outlined"
                      />
                    </Box>
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
