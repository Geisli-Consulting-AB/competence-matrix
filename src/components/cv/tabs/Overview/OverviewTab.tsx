import React from 'react';
import { Box, Button, Paper, TextField, Typography, IconButton, Stack, Tooltip, ToggleButtonGroup, ToggleButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { generateCvPdf, downloadBlob, filenameFromUserName } from '../../../../pdf';

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
  ownerDescription?: string;
  ownerPhotoUrl?: string;
  ownerRoles?: string[];
  ownerLanguages?: string[];
  ownerExpertise?: string[];
}

function newCV(): CVOverviewItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: ''
  };
}


const OverviewTab: React.FC<OverviewTabProps> = ({ cvs = [], onChange, selectedId, onSelect, ownerName, ownerDescription, ownerPhotoUrl, ownerRoles, ownerLanguages, ownerExpertise }) => {
  const [cvLang, setCvLang] = React.useState<Record<string, 'en' | 'sv'>>({});
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={addCV}>Add CV</Button>
        </Box>
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
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      value={cvLang[cv.id] || 'en'}
                      onChange={(e, value) => {
                        e.stopPropagation();
                        if (!value) return; // ignore unselect
                        setCvLang(prev => ({ ...prev, [cv.id]: value }));
                      }}
                      aria-label="PDF language toggle"
                    >
                      <ToggleButton value="en" aria-label="English" sx={{ px: 1, textTransform: 'none' }}>EN</ToggleButton>
                      <ToggleButton value="sv" aria-label="Svenska" sx={{ px: 1, textTransform: 'none' }}>SV</ToggleButton>
                    </ToggleButtonGroup>
                    <Tooltip title="Create PDF">
                      <IconButton
                        aria-label="create pdf"
                        onClick={(e) => {
                          e.stopPropagation();
                          (async () => {
                            try {
                              console.group('[PDF] UI click');
                              console.debug('[PDF] Starting generation from UI with props', { 
                                ownerName, 
                                hasDescription: !!ownerDescription, 
                                hasPhoto: !!ownerPhotoUrl, 
                                rolesCount: ownerRoles?.length ?? 0,
                                expertiseCount: ownerExpertise?.length ?? 0 
                              });
                              const lang = (cvLang && cvLang[cv.id]) ? cvLang[cv.id] : 'en';
                              const blob = await generateCvPdf(
                                ownerName, 
                                ownerDescription, 
                                ownerPhotoUrl, 
                                ownerRoles, 
                                ownerLanguages, 
                                ownerExpertise, 
                                lang
                              );
                              downloadBlob(blob, filenameFromUserName(ownerName));
                              console.debug('[PDF] Download triggered successfully');
                            } catch (err) {
                              console.error('[PDF] UI: Failed to generate or download PDF', err);
                              alert('Failed to create PDF. See console for details.');
                            } finally {
                              console.groupEnd();
                            }
                          })();
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
