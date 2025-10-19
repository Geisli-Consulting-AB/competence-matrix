import React, { useState } from 'react';
import { Box, Button, Paper, TextField, Typography, IconButton, Collapse } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

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

const SelectedProjectsEditor: React.FC<SelectedProjectsEditorProps> = ({ projects, onChange }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => setExpanded((e) => !e);

  const handleProjectChange = (
    index: number,
    field: keyof ProjectItem,
    value: string,
  ) => {
    const updated = [...projects];
    if (!updated[index]) {
      updated[index] = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        customer: '', title: '', description: '' };
    }
    updated[index] = { ...updated[index], [field]: value } as ProjectItem;
    onChange(updated);
  };

  const addNewProject = () => {
    onChange([{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, customer: '', title: '', description: '' }, ...(projects || [])]);
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
          <Paper key={index} elevation={2} sx={{ p: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Customer"
              value={project.customer || ''}
              onChange={(e) => handleProjectChange(index, 'customer', e.target.value)}
              onBlur={(e) => handleProjectChange(index, 'customer', e.target.value)}
              margin="normal"
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Project Title"
              value={project.title || ''}
              onChange={(e) => handleProjectChange(index, 'title', e.target.value)}
              onBlur={(e) => handleProjectChange(index, 'title', e.target.value)}
              margin="normal"
              variant="outlined"
            />
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
          </Paper>
        ))}
      </Collapse>
    </Box>
  );
};

export default SelectedProjectsEditor;
