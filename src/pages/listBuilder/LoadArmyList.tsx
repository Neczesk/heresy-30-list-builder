import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Container,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Stack,
  CircularProgress,
  AppBar,
  Toolbar,
} from '@mui/material';
import { ArrowBack, ContentCopy, Delete, Close } from '@mui/icons-material';
import { ArmyListStorage } from '../../utils/armyListStorage';
import type { ArmyListMetadata, Army } from '../../types/army';

interface LoadArmyListProps {
  onLoadList: (armyList: Army) => void;
}

const LoadArmyList: React.FC<LoadArmyListProps> = ({ onLoadList }) => {
  const navigate = useNavigate();
  const [armyLists, setArmyLists] = useState<ArmyListMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicatingList, setDuplicatingList] =
    useState<ArmyListMetadata | null>(null);
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
      navigate('/army-builder');
    }
  };

  const handleDeleteList = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this army list?')) {
      ArmyListStorage.deleteArmyList(id);
      setArmyLists(prev => prev.filter(list => list.id !== id));
    }
  };

  const handleDuplicateList = (
    list: ArmyListMetadata,
    event: React.MouseEvent
  ) => {
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
        updatedAt: new Date().toISOString(),
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
    return (
      new Date(dateString).toLocaleDateString() +
      ' ' +
      new Date(dateString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
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

  const getAllegianceColor = (allegiance: string | undefined) => {
    if (!allegiance || allegiance === 'Universal') {
      return 'default';
    }
    switch (allegiance.toLowerCase()) {
      case 'loyalist':
        return 'success';
      case 'traitor':
        return 'error';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading army lists...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
            Load Army List
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {armyLists.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                No Army Lists Found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                You haven't created any army lists yet.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create a new army list to get started!
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 3
          }}>
            {armyLists.map(list => (
              <Card
                key={list.id}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleLoadList(list.id)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h3" sx={{ flex: 1 }}>
                      {list.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleDuplicateList(list, e)}
                        title="Duplicate army list"
                        sx={{ color: 'info.main' }}
                      >
                        <ContentCopy />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => handleDeleteList(list.id, e)}
                        title="Delete army list"
                        sx={{ color: 'error.main' }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>

                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Faction:
                      </Typography>
                      <Typography variant="body2">
                        {list.faction}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Allegiance:
                      </Typography>
                      <Chip
                        label={getAllegianceDisplay(list.allegiance)}
                        size="small"
                        color={getAllegianceColor(list.allegiance) as any}
                        variant="outlined"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Points:
                      </Typography>
                      <Typography variant="body2">
                        {list.totalPoints} / {list.pointsLimit}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Status:
                      </Typography>
                      <Chip
                        label={list.isNamed ? 'Named' : 'Unnamed'}
                        size="small"
                        color={list.isNamed ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Updated:
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(list.updatedAt)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>

      {/* Duplicate Modal */}
      <Dialog
        open={showDuplicateModal}
        onClose={handleCancelDuplicate}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Duplicate Army List
            </Typography>
            <IconButton onClick={handleCancelDuplicate} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Enter a name for the duplicated army list:
          </Typography>
          <TextField
            fullWidth
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newListName.trim()) {
                handleConfirmDuplicate();
              }
            }}
            placeholder="Enter army list name..."
            autoFocus
            sx={{ mb: 3 }}
          />

          {duplicatingList && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Original List Details:
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Name:
                    </Typography>
                    <Typography variant="body2">
                      {duplicatingList.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Faction:
                    </Typography>
                    <Typography variant="body2">
                      {duplicatingList.faction}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Points:
                    </Typography>
                    <Typography variant="body2">
                      {duplicatingList.totalPoints} / {duplicatingList.pointsLimit}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDuplicate}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleConfirmDuplicate}
            disabled={!newListName.trim()}
          >
            Duplicate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoadArmyList;
