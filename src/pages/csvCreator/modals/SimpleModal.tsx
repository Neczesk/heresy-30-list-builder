import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
} from '@mui/material';

interface SimpleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: any, editingIndex?: number | null) => void;
  initialEntry?: any;
  editingIndex?: number | null;
  dataType: string;
  fields: string[];
}

export const SimpleModal: React.FC<SimpleModalProps> = ({
  open,
  onClose,
  onSave,
  initialEntry = {},
  editingIndex = null,
  dataType,
  fields,
}) => {
  const [entry, setEntry] = useState<any>({ id: '' });

  useEffect(() => {
    if (open) {
      setEntry(initialEntry || { id: '' });
    }
  }, [open, initialEntry]);

  const handleFieldChange = (field: string, value: any) => {
    setEntry((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(entry, editingIndex);
    onClose();
  };

  const getFieldType = (fieldName: string) => {
    // Determine if field should be multiline based on common patterns
    if (
      fieldName.toLowerCase().includes('description') ||
      fieldName.toLowerCase().includes('text') ||
      fieldName.toLowerCase().includes('long')
    ) {
      return 'multiline';
    }
    return 'text';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingIndex !== null ? `Edit ${dataType}` : `Add New ${dataType}`}
      </DialogTitle>
      <DialogContent sx={{ overflow: 'auto' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 2,
            mt: 1,
          }}
        >
          {fields.map(field => {
            const fieldType = getFieldType(field);
            const isRequired = field === 'id' || field === 'name';

            return (
              <TextField
                key={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                value={entry[field] || ''}
                onChange={e => handleFieldChange(field, e.target.value)}
                fullWidth
                required={isRequired}
                multiline={fieldType === 'multiline'}
                minRows={fieldType === 'multiline' ? 2 : 1}
              />
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {editingIndex !== null ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
