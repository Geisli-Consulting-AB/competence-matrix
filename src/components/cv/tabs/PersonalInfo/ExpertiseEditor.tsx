import React, { useState } from 'react';
import { Box, Button, Paper, TextField, Typography, IconButton, Stack, Collapse } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export interface ExpertiseEditorProps {
  expertise: string[];
  onChange: (expertise: string[]) => void;
}

const ExpertiseEditor: React.FC<ExpertiseEditorProps> = ({ expertise, onChange }) => {
  const [expanded, setExpanded] = useState(true);

  const toggleExpanded = () => setExpanded((e) => !e);

  const addExpertise = () => {
    onChange(['', ...(expertise || [])]);
  };

  const updateExpertise = (index: number, value: string) => {
    const updated = [...(expertise || [])];
    updated[index] = value;
    onChange(updated);
  };

  const removeExpertise = (index: number) => {
    const updated = [...(expertise || [])];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <Box>
      <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5">Expertise</Typography>
        <IconButton
          aria-label={expanded ? 'Collapse expertise section' : 'Expand expertise section'}
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
          onClick={addExpertise}
          sx={{ mb: 2 }}
        >
          Add Expertise
        </Button>
        {(expertise || []).map((item, index) => (
          <Paper key={index} elevation={2} sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                fullWidth
                label="Expertise"
                value={item || ''}
                onChange={(e) => updateExpertise(index, e.target.value)}
                onBlur={(e) => updateExpertise(index, e.target.value)}
                margin="normal"
                variant="outlined"
                placeholder="e.g., React, Kubernetes, Domain-Driven Design"
              />
              <IconButton aria-label="remove expertise" onClick={() => removeExpertise(index)} sx={{ mt: 1 }}>
                <DeleteOutlineIcon />
              </IconButton>
            </Stack>
          </Paper>
        ))}
      </Collapse>
    </Box>
  );
};

export default ExpertiseEditor;
