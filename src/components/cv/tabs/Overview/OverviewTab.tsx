import React from 'react';
import { Box, Button, Paper, TextField, Typography, IconButton, Stack, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

export interface CVOverviewItem {
  id: string;
  name: string;
}

export interface OverviewTabProps {
  cvs: CVOverviewItem[];
  onChange: (cvs: CVOverviewItem[]) => void;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

function newCV(): CVOverviewItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: ''
  };
}

const OverviewTab: React.FC<OverviewTabProps> = ({ cvs = [], onChange, selectedId, onSelect }) => {
  const addCV = () => {
    const created = newCV();
    onChange([created, ...(cvs || [])]);
    if (onSelect) onSelect(created.id);
  };

  const updateCV = (index: number, field: keyof CVOverviewItem, value: string) => {
    const updated = [...(cvs || [])];
    const current = updated[index] || newCV();
    updated[index] = { ...current, [field]: value } as CVOverviewItem;
    onChange(updated);
  };

  const removeCV = (index: number) => {
    const updated = [...(cvs || [])];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5">CVs</Typography>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={addCV}>Add CV</Button>
      </Box>

      {(cvs || []).length === 0 ? (
        <Typography color="text.secondary">No CVs yet. Click "Add CV" to create your first one.</Typography>
      ) : (
        (cvs || []).map((cv, index) => {
          const isSelected = selectedId === cv.id;
          return (
            <Paper
              key={cv.id || index}
              elevation={isSelected ? 2 : 1}
              sx={{
                p: 2,
                mb: 2,
                border: '1px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                bgcolor: isSelected ? 'action.selected' : 'background.paper',
                cursor: 'pointer',
                transition: 'background-color 0.2s, border-color 0.2s',
              }}
              onClick={() => onSelect && onSelect(cv.id)}
            >
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {cv.name?.trim() || 'Untitled CV'}
                  </Typography>
                  <Tooltip title="Delete CV">
                    <IconButton aria-label="remove cv" onClick={(e) => { e.stopPropagation(); removeCV(index); }}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <TextField
                  fullWidth
                  label="Name"
                  size="small"
                  value={cv.name || ''}
                  onChange={(e) => updateCV(index, 'name', e.target.value)}
                  onBlur={(e) => updateCV(index, 'name', e.target.value)}
                  margin="normal"
                  variant="outlined"
                  onClick={(e) => e.stopPropagation()}
                />
              </Stack>
            </Paper>
          );
        })
      )}
      {(cvs || []).length > 0 && !selectedId && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Select a CV to see and manage it.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default OverviewTab;
