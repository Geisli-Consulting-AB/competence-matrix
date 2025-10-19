import React, { useState } from 'react';
import { Box, Button, Paper, TextField, Typography, IconButton, Stack, Collapse } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export interface LanguagesEditorProps {
  languages: string[];
  onChange: (languages: string[]) => void;
}

const LanguagesEditor: React.FC<LanguagesEditorProps> = ({ languages, onChange }) => {
  const [expanded, setExpanded] = useState(true);

  const toggleExpanded = () => setExpanded((e) => !e);

  const addLanguage = () => {
    onChange(['', ...(languages || [])]);
  };

  const updateLanguage = (index: number, value: string) => {
    const updated = [...(languages || [])];
    updated[index] = value;
    onChange(updated);
  };

  const removeLanguage = (index: number) => {
    const updated = [...(languages || [])];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <Box>
      <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5">Languages</Typography>
        <IconButton
          aria-label={expanded ? 'Collapse languages section' : 'Expand languages section'}
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
          onClick={addLanguage}
          sx={{ mb: 2 }}
        >
          Add Language
        </Button>
        {(languages || []).map((lang, index) => (
          <Paper key={index} elevation={2} sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                fullWidth
                label="Language"
                value={lang || ''}
                onChange={(e) => updateLanguage(index, e.target.value)}
                onBlur={(e) => updateLanguage(index, e.target.value)}
                margin="normal"
                variant="outlined"
                placeholder="e.g., English (native), Swedish (fluent), German (basic)"
              />
              <IconButton aria-label="remove language" onClick={() => removeLanguage(index)} sx={{ mt: 1 }}>
                <DeleteOutlineIcon />
              </IconButton>
            </Stack>
          </Paper>
        ))}
      </Collapse>
    </Box>
  );
};

export default LanguagesEditor;
