import React, { useState } from 'react';
import { Box, Button, Paper, TextField, Typography, IconButton, Stack, Collapse, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

export interface ExpertiseEditorProps {
  expertise: string[];
  onChange: (expertise: string[]) => void;
}

const ExpertiseEditor: React.FC<ExpertiseEditorProps> = ({ expertise = [], onChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  const handleDragStart = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch {
      // no-op
    }
  };

  const handleDragOver = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDrop = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    let from = draggingIndex ?? -1;
    try {
      const data = e.dataTransfer.getData('text/plain');
      if (data !== '') from = Number(data);
    } catch {
      // ignore
    }
    const to = index;
    setDragOverIndex(null);
    setDraggingIndex(null);
    if (from < 0 || from === to) return;
    const updated = [...(expertise || [])];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onChange(updated);
  };

  const handleDragEnd = () => {
    setDragOverIndex(null);
    setDraggingIndex(null);
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
          <Paper 
            key={index} 
            elevation={2} 
            sx={{ 
              p: 2, 
              mb: 2,
              outline: dragOverIndex === index ? '2px dashed #1976d2' : 'none',
              opacity: draggingIndex === index ? 0.7 : 1,
              cursor: 'grab',
              '&:active': { cursor: 'grabbing' }
            }}
            draggable
            onDragStart={handleDragStart(index)}
            onDragOver={handleDragOver(index)}
            onDrop={handleDrop(index)}
            onDragEnd={handleDragEnd}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Drag to reorder" placement="top" arrow>
                <Box
                  sx={{
                    width: 32,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'text.secondary',
                    cursor: 'grab',
                    '&:active': { cursor: 'grabbing' },
                  }}
                  aria-label="Drag to reorder"
                >
                  <DragIndicatorIcon fontSize="small" />
                </Box>
              </Tooltip>
              <TextField
                fullWidth
                label="Expertise"
                value={item || ''}
                onChange={(e) => updateExpertise(index, e.target.value)}
                onBlur={(e) => updateExpertise(index, e.target.value)}
                margin="normal"
                variant="outlined"
                placeholder="e.g., React, Kubernetes, Domain-Driven Design"
                sx={{ flexGrow: 1 }}
              />
              <IconButton 
                aria-label="remove expertise" 
                onClick={() => removeExpertise(index)} 
                sx={{ mt: 1 }}
              >
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
