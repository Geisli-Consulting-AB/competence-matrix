import React, { useState } from 'react';
import { Box, Button, Paper, TextField, Typography, IconButton, Stack, Collapse } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export interface RolesEditorProps {
  roles: string[];
  onChange: (roles: string[]) => void;
}

const RolesEditor: React.FC<RolesEditorProps> = ({ roles, onChange }) => {
  const [expanded, setExpanded] = useState(true);

  const toggleExpanded = () => setExpanded((e) => !e);

  const addRole = () => {
    onChange(['', ...(roles || [])]);
  };

  const updateRole = (index: number, value: string) => {
    const updated = [...(roles || [])];
    updated[index] = value;
    onChange(updated);
  };

  const removeRole = (index: number) => {
    const updated = [...(roles || [])];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <Box>
      <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5">Roles</Typography>
        <IconButton
          aria-label={expanded ? 'Collapse roles section' : 'Expand roles section'}
          aria-expanded={expanded}
          onClick={toggleExpanded}
          size="small"
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addRole}
          sx={{ mb: 2 }}
        >
          Add Role
        </Button>
        {(roles || []).map((role, index) => (
          <Paper key={index} elevation={2} sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                fullWidth
                label="Role"
                value={role || ''}
                onChange={(e) => updateRole(index, e.target.value)}
                onBlur={(e) => updateRole(index, e.target.value)}
                margin="normal"
                variant="outlined"
                placeholder="e.g., Backend Developer, Scrum Master, Tech Lead"
              />
              <IconButton aria-label="remove role" onClick={() => removeRole(index)} sx={{ mt: 1 }}>
                <DeleteOutlineIcon />
              </IconButton>
            </Stack>
          </Paper>
        ))}
      </Collapse>
    </Box>
  );
};

export default RolesEditor;
