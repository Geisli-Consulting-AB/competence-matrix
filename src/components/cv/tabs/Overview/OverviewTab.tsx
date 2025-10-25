import React from 'react';
import { Box, Button, Paper, TextField, Typography, IconButton, Stack, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

export interface CVOverviewItem {
  id: string;
  name: string;
}

export interface OverviewTabProps {
  cvs: CVOverviewItem[];
  onChange: (cvs: CVOverviewItem[]) => void;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  ownerName?: string;
}

function newCV(): CVOverviewItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: ''
  };
}

// Minimal blank PDF (one empty page) as base64. Dependency-free.
const EMPTY_PDF_BASE64 =
  'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9Db3VudCAxCi9LaWRzIFszIDAgUl0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA1OTUgODQyXQo+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDQxIDAwMDAwIG4gCjAwMDAwMDAwOTYgMDAwMDAgbiAKMDAwMDAwMDE1MSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDQKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjIwNQolJUVPRgo=';

function createEmptyPdfBlob(): Blob {
  const byteChars = atob(EMPTY_PDF_BASE64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  return new Blob([bytes], { type: 'application/pdf' });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function filenameFromUserName(name?: string) {
  const clean = (name || '').trim();
  if (!clean) return 'CV.pdf';
  // Allow letters, numbers, space, dot, underscore, and hyphen. Collapse multiple spaces.
  const safe = clean.replace(/[^A-Za-z0-9 ._-]+/g, '').replace(/\s+/g, ' ').trim();
  return `${safe} - CV.pdf`;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ cvs = [], onChange, selectedId, onSelect, ownerName }) => {
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
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Tooltip title="Create PDF">
                      <IconButton
                        aria-label="create pdf"
                        onClick={(e) => {
                          e.stopPropagation();
                          const blob = createEmptyPdfBlob();
                          downloadBlob(blob, filenameFromUserName(ownerName));
                        }}
                        size="small"
                      >
                        <PictureAsPdfIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete CV">
                      <IconButton aria-label="remove cv" onClick={(e) => { e.stopPropagation(); removeCV(index); }}>
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
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
    </Paper>
  );
};

export default OverviewTab;
