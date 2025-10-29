import React, { useState } from 'react';
import { Box, Button, Paper, TextField, Typography, IconButton, Collapse, Tooltip, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

export type ProjectItem = {
  id: string;
  customer: string;
  title: string;
  description: string;
};

export interface SelectedProjectsEditorProps {
  projects: ProjectItem[];
  onChange: (projects: ProjectItem[]) => void;
}

const SelectedProjectsEditor: React.FC<SelectedProjectsEditorProps> = ({ projects = [], onChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const toggleExpanded = () => setExpanded((e) => !e);

  const handleProjectChange = (
    index: number,
    field: keyof ProjectItem,
    value: string,
  ) => {
    const updated = [...projects];
    if (!updated[index]) {
      updated[index] = { 
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        customer: '', 
        title: '', 
        description: '' 
      };
    }
    updated[index] = { ...updated[index], [field]: value } as ProjectItem;
    onChange(updated);
  };

  const addNewProject = () => {
    onChange([{ 
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, 
      customer: '', 
      title: '', 
      description: '' 
    }, ...(projects || [])]);
  };

  const removeProject = (index: number) => {
    const updated = [...projects];
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
    const updated = [...projects];
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
        <Typography variant="h5">Selected Projects</Typography>
        <IconButton
          aria-label={expanded ? 'Collapse selected projects section' : 'Expand selected projects section'}
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
          onClick={addNewProject}
          sx={{ mb: 2 }}
        >
          Add Project
        </Button>
        {(projects || []).map((project, index) => (
          <Paper 
            key={project.id || index} 
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
            <Stack direction="row" spacing={1} alignItems="flex-start">
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
                    mt: 2.5
                  }}
                  aria-label="Drag to reorder"
                >
                  <DragIndicatorIcon fontSize="small" />
                </Box>
              </Tooltip>
              <Box sx={{ flexGrow: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    fullWidth
                    label="Customer"
                    value={project.customer || ''}
                    onChange={(e) => handleProjectChange(index, 'customer', e.target.value)}
                    onBlur={(e) => handleProjectChange(index, 'customer', e.target.value)}
                    margin="normal"
                    variant="outlined"
                    sx={{ flex: 3 }}
                  />
                  <TextField
                    fullWidth
                    label="Project Title"
                    value={project.title || ''}
                    onChange={(e) => handleProjectChange(index, 'title', e.target.value)}
                    onBlur={(e) => handleProjectChange(index, 'title', e.target.value)}
                    margin="normal"
                    variant="outlined"
                    sx={{ flex: 2 }}
                  />
                  <IconButton 
                    aria-label="remove project" 
                    onClick={() => removeProject(index)} 
                    sx={{ mt: 1 }}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
                <TextField
                  fullWidth
                  label="Description"
                  value={project.description || ''}
                  onChange={(e) => handleProjectChange(index, 'description', e.target.value)}
                  onBlur={(e) => handleProjectChange(index, 'description', e.target.value)}
                  margin="normal"
                  variant="outlined"
                  multiline
                  rows={3}
                />
              </Box>
            </Stack>
          </Paper>
        ))}
      </Collapse>
    </Box>
  );
};

export default SelectedProjectsEditor;
