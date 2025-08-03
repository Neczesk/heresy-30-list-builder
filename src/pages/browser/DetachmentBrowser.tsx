import React, { useState, useMemo } from 'react';
import {
  Typography,
  Box,
  Container,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Paper,
  Card,
  CardContent,
  CardActionArea,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
} from '@mui/material';
import { Search, Clear, Star } from '@mui/icons-material';
import { DataLoader } from '../../utils/dataLoader';
import type { Detachment, BattlefieldRole } from '../../types/army';

interface DetachmentWithRoles extends Detachment {
  slotsWithRoles: Array<{
    role: BattlefieldRole;
    count: number;
    isPrime: boolean;
    description?: string;
  }>;
}

const DetachmentBrowser: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const detachments = useMemo(() => {
    const allDetachments = DataLoader.getDetachments();
    return allDetachments.map(detachment => {
      const slotsWithRoles = detachment.slots.map(slot => {
        const role = DataLoader.getBattlefieldRoleById(slot.roleId);
        return {
          role: role!,
          count: slot.count,
          isPrime: slot.isPrime,
          description: slot.description,
        };
      });
      return { ...detachment, slotsWithRoles };
    });
  }, []);

  const filteredDetachments = useMemo(() => {
    let filtered = detachments;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        detachment =>
          detachment.name.toLowerCase().includes(searchLower) ||
          detachment.description.toLowerCase().includes(searchLower) ||
          detachment.type.toLowerCase().includes(searchLower)
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(
        detachment => detachment.type === selectedType
      );
    }

    return filtered;
  }, [detachments, searchTerm, selectedType]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleTypeChange = (e: any) => {
    setSelectedType(e.target.value);
  };

  const getDetachmentTypeColor = (type: string) => {
    switch (type) {
      case 'Primary':
        return '#4CAF50'; // Green
      case 'Auxiliary':
        return '#FF9800'; // Orange
      case 'Apex':
        return '#9C27B0'; // Purple
      case 'Warlord':
        return '#F44336'; // Red
      case 'Allied':
        return '#2196F3'; // Blue
      case 'Universal':
        return '#607D8B'; // Blue Grey
      default:
        return '#757575'; // Grey
    }
  };

  const getDetachmentTypeIcon = (type: string) => {
    switch (type) {
      case 'Primary':
        return '⚔️';
      case 'Auxiliary':
        return '🛡️';
      case 'Apex':
        return '👑';
      case 'Warlord':
        return '⚜️';
      case 'Allied':
        return '🤝';
      case 'Universal':
        return '🌐';
      default:
        return '📋';
    }
  };

  const renderDetachmentCard = (detachment: DetachmentWithRoles) => (
    <Box key={detachment.id} sx={{ width: '100%' }}>
      <Card
        sx={{
          height: '100%',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          },
        }}
      >
        <CardActionArea sx={{ height: '100%' }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 2,
              }}
            >
              <Typography variant="h6" component="h4" sx={{ flex: 1 }}>
                {detachment.name}
              </Typography>
              <Chip
                label={detachment.type}
                size="small"
                sx={{
                  backgroundColor: getDetachmentTypeColor(detachment.type),
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {detachment.description}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Slots:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {detachment.slotsWithRoles.map((slot, index) => (
                  <Chip
                    key={index}
                    label={`${slot.role.name} (${slot.count})`}
                    size="small"
                    variant="outlined"
                    icon={slot.isPrime ? <Star fontSize="small" /> : undefined}
                    sx={{
                      backgroundColor: slot.isPrime
                        ? 'primary.light'
                        : 'transparent',
                      color: slot.isPrime ? 'primary.contrastText' : 'inherit',
                    }}
                  />
                ))}
              </Box>
            </Box>

            {detachment.requirements && detachment.requirements.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Requirements:
                </Typography>
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
                >
                  {detachment.requirements.map((req, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      color="text.secondary"
                    >
                      • {req.description || `${req.type}: ${req.value}`}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </CardActionArea>
      </Card>
    </Box>
  );

  const getDetachmentTypes = () => {
    const types = Array.from(new Set(detachments.map(d => d.type)));
    return types.sort();
  };

  const getDetachmentsByType = (type: string) => {
    return filteredDetachments.filter(detachment =>
      type === 'all' ? true : detachment.type === type
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Search and Filter Section */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search detachments..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={clearSearch} edge="end">
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="type-select-label">Filter by Type</InputLabel>
          <Select
            labelId="type-select-label"
            id="type-select"
            value={selectedType}
            label="Filter by Type"
            onChange={handleTypeChange}
          >
            <MenuItem value="all">All Types</MenuItem>
            {getDetachmentTypes().map(type => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {searchTerm && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${filteredDetachments.length} of ${detachments.length} detachments found`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        )}
      </Box>

      {/* Content Section */}
      {filteredDetachments.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No detachments found matching your search criteria.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {getDetachmentTypes().map((type, index) => {
            const typeDetachments = getDetachmentsByType(type);
            if (typeDetachments.length === 0) return null;

            return (
              <Box key={type} sx={{ mb: 4 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 3,
                    pb: 1,
                    borderBottom: `3px solid ${getDetachmentTypeColor(type)}`,
                  }}
                >
                  <Typography variant="h4" component="h3">
                    {getDetachmentTypeIcon(type)}
                  </Typography>
                  <Typography variant="h5" component="h3">
                    {type} Detachments ({typeDetachments.length})
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  {typeDetachments.map(renderDetachmentCard)}
                </Grid>

                {index < getDetachmentTypes().length - 1 && (
                  <Divider sx={{ mt: 4 }} />
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Container>
  );
};

export default DetachmentBrowser;
