import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  IconButton,
  Stack,
  Tooltip,
  Collapse,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export interface CourseCert {
  id: string;
  year?: string;
  organization?: string;
  title?: string;
}

export interface CoursesCertificationsEditorProps {
  items: CourseCert[];
  onChange: (items: CourseCert[]) => void;
}

function newItem(): CourseCert {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    year: '',
    organization: '',
    title: '',
  };
}

const CoursesCertificationsEditor: React.FC<CoursesCertificationsEditorProps> = ({ items = [], onChange }) => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExpandedById(prev => {
      const next: Record<string, boolean> = { ...prev };
      (items || []).forEach(it => {
        if (it?.id && next[it.id] === undefined) next[it.id] = false;
      });
      Object.keys(next).forEach(id => {
        if (!(items || []).some(e => e.id === id)) delete next[id];
      });
      return next;
    });
  }, [items]);

  const addItem = () => {
    const ni = newItem();
    onChange([ni, ...(items || [])]);
    setExpandedById(prev => ({ ...prev, [ni.id]: true }));
  };

  const updateItem = <K extends keyof CourseCert>(index: number, field: K, value: CourseCert[K]) => {
    const updated = [...(items || [])];
    const current = updated[index] || newItem();
    updated[index] = { ...current, [field]: value } as CourseCert;
    onChange(updated);
  };

  const removeItem = (index: number) => {
    const updated = [...(items || [])];
    const [removed] = updated.splice(index, 1);
    onChange(updated);
    if (removed?.id) {
      setExpandedById(prev => {
        const copy = { ...prev };
        delete copy[removed.id];
        return copy;
      });
    }
  };

  const handleDragStart = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch (err) {
      console.warn('Drag start setData failed', err);
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
    } catch (err) {
      console.warn('Drag drop getData failed', err);
    }
    const to = index;
    setDragOverIndex(null);
    setDraggingIndex(null);
    if (from < 0 || from === to) return;
    const updated = [...(items || [])];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onChange(updated);
  };

  const handleDragEnd = () => {
    setDragOverIndex(null);
    setDraggingIndex(null);
  };

  const toggleExpanded = (id?: string) => {
    if (!id) return;
    setExpandedById(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const headerTitle = (it: CourseCert) => {
    const organization = it.organization?.trim() || 'Organization';
    const title = it.title?.trim() || 'Title';
    return `${organization} — ${title}`;
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5">Courses & Certifications</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addItem}
          sx={{ ml: 2 }}
        >
          Add Item
        </Button>
      </Box>

      {(items || []).map((it, index) => (
        <Paper
          key={it.id || index}
          elevation={1}
          sx={{
            p: 2,
            mb: 2,
            outline: dragOverIndex === index ? '2px dashed #1976d2' : 'none',
            opacity: draggingIndex === index ? 0.7 : 1,
            cursor: 'grab'
          }}
          draggable
          onDragStart={handleDragStart(index)}
          onDragOver={handleDragOver(index)}
          onDrop={handleDrop(index)}
          onDragEnd={handleDragEnd}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
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

            <Typography variant="subtitle1" sx={{ flexGrow: 1, ml: 1, fontWeight: 500 }}>
              {headerTitle(it)}
            </Typography>

            <IconButton aria-label="remove item" onClick={() => removeItem(index)} sx={{ ml: 1 }}>
              <DeleteOutlineIcon />
            </IconButton>
            <IconButton
              aria-label={expandedById[it.id] ? 'Collapse item' : 'Expand item'}
              aria-expanded={!!expandedById[it.id]}
              onClick={() => toggleExpanded(it.id)}
              sx={{ ml: 1 }}
              size="small"
            >
              {expandedById[it.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={!!expandedById[it.id]} timeout="auto" unmountOnExit>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap', ml: 0 }}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                size="small"
                value={it.year || ''}
                onChange={(e) => updateItem(index, 'year', e.target.value)}
                onBlur={(e) => updateItem(index, 'year', e.target.value)}
                placeholder="e.g., 2023"
                inputProps={{ min: 1900, max: 2100 }}
                sx={{ width: { xs: '100%', sm: 140 } }}
              />
            </Stack>

            <Box sx={{ mt: 1, ml: 0 }}>
              <TextField
                fullWidth
                label="Organization"
                size="small"
                value={it.organization || ''}
                onChange={(e) => updateItem(index, 'organization', e.target.value)}
                onBlur={(e) => updateItem(index, 'organization', e.target.value)}
                margin="normal"
                variant="outlined"
              />
            </Box>

            <Box sx={{ mt: 1, ml: 0 }}>
              <TextField
                fullWidth
                label="Title"
                size="small"
                value={it.title || ''}
                onChange={(e) => updateItem(index, 'title', e.target.value)}
                onBlur={(e) => updateItem(index, 'title', e.target.value)}
                margin="normal"
                variant="outlined"
              />
            </Box>
          </Collapse>
        </Paper>
      ))}
    </Paper>
  );
};

export default CoursesCertificationsEditor;
