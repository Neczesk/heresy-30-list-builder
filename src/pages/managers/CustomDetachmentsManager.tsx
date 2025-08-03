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
  Alert,
  AppBar,
  Toolbar,
} from '@mui/material';
import { ArrowBack, Edit, Delete, Save, Close } from '@mui/icons-material';
import { CustomDetachmentStorage } from '../../utils/customDetachmentStorage';
import { DataLoader } from '../../utils/dataLoader';
import DetachmentEditorModal from '../../components/modals/DetachmentEditorModal';
import type { CustomDetachment, CustomDetachmentMetadata } from '../../types/army';

const CustomDetachmentsManager: React.FC = () => {
  const navigate = useNavigate();
  const [customDetachments, setCustomDetachments] = useState<
    CustomDetachmentMetadata[]
  >([]);
  const [renamingDetachment, setRenamingDetachment] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteConfirmDetachment, setDeleteConfirmDetachment] =
    useState<CustomDetachmentMetadata | null>(null);
  const [editingDetachment, setEditingDetachment] =
    useState<CustomDetachment | null>(null);
  const [showDetachmentEditorModal, setShowDetachmentEditorModal] =
    useState(false);

  // Load custom detachments on mount
  useEffect(() => {
    loadCustomDetachments();
  }, []);

  const loadCustomDetachments = () => {
    const detachments =
      CustomDetachmentStorage.getAllCustomDetachmentMetadata();
    setCustomDetachments(detachments);
  };

  const handleEditDetachment = (detachmentId: string) => {
    const customDetachment =
      CustomDetachmentStorage.getCustomDetachment(detachmentId);
    if (customDetachment) {
      setEditingDetachment(customDetachment);
      setShowDetachmentEditorModal(true);
    }
  };

  const handleDeleteDetachment = (detachment: CustomDetachmentMetadata) => {
    setDeleteConfirmDetachment(detachment);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmDetachment) {
      CustomDetachmentStorage.deleteCustomDetachment(
        deleteConfirmDetachment.id
      );
      setDeleteConfirmDetachment(null);
      loadCustomDetachments();
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmDetachment(null);
  };

  const handleDetachmentEditorClose = () => {
    setShowDetachmentEditorModal(false);
    setEditingDetachment(null);
  };

  const handleDetachmentEditorSave = (updatedDetachment: CustomDetachment) => {
    CustomDetachmentStorage.saveCustomDetachment(updatedDetachment);
    setShowDetachmentEditorModal(false);
    setEditingDetachment(null);
    loadCustomDetachments();
  };

  const handleStartRename = (detachment: CustomDetachmentMetadata) => {
    setRenamingDetachment({ id: detachment.id, name: detachment.name });
  };

  const handleSaveRename = () => {
    if (renamingDetachment) {
      const customDetachment = CustomDetachmentStorage.getCustomDetachment(
        renamingDetachment.id
      );
      if (customDetachment) {
        // Check if new name conflicts with existing detachments
        const existingDetachments =
          CustomDetachmentStorage.getAllCustomDetachmentMetadata();
        const nameExists = existingDetachments.some(
          cd =>
            cd.name === renamingDetachment.name &&
            cd.id !== renamingDetachment.id
        );

        if (nameExists) {
          alert('A custom detachment with this name already exists.');
          return;
        }

        // Update the custom detachment with new name
        const updatedDetachment: CustomDetachment = {
          ...customDetachment,
          name: renamingDetachment.name,
          updatedAt: new Date().toISOString(),
        };

        // Save updated detachment
        CustomDetachmentStorage.saveCustomDetachment(updatedDetachment);

        setRenamingDetachment(null);
        loadCustomDetachments();
      }
    }
  };

  const handleCancelRename = () => {
    setRenamingDetachment(null);
  };

  const handleRenameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (renamingDetachment) {
      setRenamingDetachment({ ...renamingDetachment, name: e.target.value });
    }
  };

  const handleRenameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  const getFactionName = (factionId: string) => {
    const faction = DataLoader.getFactionById(factionId);
    return faction?.name || factionId;
  };

  const getSubfactionName = (subfactionId: string) => {
    const faction = DataLoader.getFactionById(subfactionId);
    return faction?.name || subfactionId;
  };

  const getBaseDetachmentName = (baseDetachmentId: string) => {
    const detachment = DataLoader.getDetachmentById(baseDetachmentId);
    return detachment?.name || baseDetachmentId;
  };

  const formatDate = (dateString: string) => {
    return (
      new Date(dateString).toLocaleDateString() +
      ' ' +
      new Date(dateString).toLocaleTimeString()
    );
  };

  const calculateDetachmentPoints = (units: any[]) => {
    return units.reduce((total, unit) => total + (unit.points || 0), 0);
  };

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
            Custom Detachments Manager
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {customDetachments.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" sx={{ mb: 1 }}>
                No custom detachments saved yet.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create custom detachments by configuring detachments in your army lists and saving them.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {customDetachments.map(detachment => {
              const fullDetachment =
                CustomDetachmentStorage.getCustomDetachment(detachment.id);
              const totalPoints = fullDetachment
                ? calculateDetachmentPoints(fullDetachment.units)
                : 0;

              return (
                <Card key={detachment.id}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        {renamingDetachment?.id === detachment.id ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              value={renamingDetachment.name}
                              onChange={handleRenameInputChange}
                              onKeyDown={handleRenameKeyPress}
                              autoFocus
                              size="small"
                              sx={{ flex: 1 }}
                            />
                            <IconButton
                              color="success"
                              size="small"
                              onClick={handleSaveRename}
                            >
                              <Save />
                            </IconButton>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={handleCancelRename}
                            >
                              <Close />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" component="h3">
                              {detachment.name}
                            </Typography>
                            <Chip label="Custom" size="small" color="primary" variant="outlined" />
                          </Box>
                        )}
                      </Box>
                    </Box>

                    <Stack spacing={1} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Base Detachment:
                        </Typography>
                        <Typography variant="body2">
                          {getBaseDetachmentName(detachment.baseDetachmentId)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Faction:
                        </Typography>
                        <Typography variant="body2">
                          {getFactionName(detachment.faction)}
                        </Typography>
                      </Box>
                      {detachment.subfaction && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Subfaction:
                          </Typography>
                          <Typography variant="body2">
                            {getSubfactionName(detachment.subfaction)}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Units:
                        </Typography>
                        <Typography variant="body2">
                          {fullDetachment?.units.length || 0} units
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Points:
                        </Typography>
                        <Typography variant="body2">
                          {totalPoints} pts
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Created:
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(detachment.createdAt)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Updated:
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(detachment.updatedAt)}
                        </Typography>
                      </Box>
                      {detachment.description && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="body2" color="text.secondary">
                            Description:
                          </Typography>
                          <Typography variant="body2" sx={{ maxWidth: '60%', textAlign: 'right' }}>
                            {detachment.description}
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleEditDetachment(detachment.id)}
                        title="Edit detachment configuration"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleStartRename(detachment)}
                        title="Rename detachment"
                      >
                        Rename
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<Delete />}
                        onClick={() => handleDeleteDetachment(detachment)}
                        title="Delete detachment"
                      >
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </Container>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!deleteConfirmDetachment}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Custom Detachment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Are you sure you want to delete "{deleteConfirmDetachment?.name}"?
          </Typography>
          <Alert severity="warning">
            This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detachment Editor Modal */}
      {showDetachmentEditorModal && editingDetachment && (
        <DetachmentEditorModal
          isOpen={showDetachmentEditorModal}
          customDetachment={editingDetachment}
          onClose={handleDetachmentEditorClose}
          onSave={handleDetachmentEditorSave}
        />
      )}
    </Box>
  );
};

export default CustomDetachmentsManager;
