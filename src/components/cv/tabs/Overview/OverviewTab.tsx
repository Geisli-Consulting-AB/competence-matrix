import React, { useCallback, useEffect } from "react";
import { Box, Button, Paper, Typography, IconButton, FormControlLabel, Checkbox, Alert, Snackbar, Stack, ToggleButton, ToggleButtonGroup, Tooltip, TextField, MenuItem } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import type { User } from "firebase/auth";
import { getAllCVs, isAdminUser, saveUserCV, deleteUserCV } from "../../../../firebase";
import { generateCvPdf } from "../../../../pdf";
import { downloadBlob, filenameFromUserName } from "../../../../pdf/shared";

type PdfLang = 'en' | 'sv';

export interface CVOverviewItem {
  id: string;
  name: string;
  language?: PdfLang;
  ownerName?: string;
  userId?: string;
  // Optional full CV data payload (used when admin selects from all users)
  data?: unknown;
}

export interface ProjectItem {
  id: string;
  customer: string;
  title: string;
  description: string;
}


interface OverviewTabProps {
  cvs: CVOverviewItem[];
  onChange: (cvs: CVOverviewItem[]) => void;
  selectedId?: string | null;
  onSelect?: (id: string | null, cvData?: CVOverviewItem) => void;
  user: User | null;
  ownerName?: string;
  ownerTitle?: string;
  ownerDescription?: string;
  ownerPhotoUrl?: string;
  ownerRoles?: string[];
  ownerLanguages?: string[];
  ownerExpertise?: string[];
  ownerSelectedProjects?: Array<{
    id: string;
    customer: string;
    title: string;
    description: string;
  }>;
  ownerExperiences?: Array<{
    id: string;
    title: string;
    employer: string;
    description: string;
    startYear?: string;
    endYear?: string;
  }>;
  ownerEducations?: Array<{
    id: string;
    school?: string;
    title?: string;
    startYear?: string;
    endYear?: string;
  }>;
  ownerCoursesCertifications?: Array<{
    id: string;
    year?: string;
    organization?: string;
    title?: string;
  }>;
  ownerEngagements?: Array<{
    id: string;
    title?: string;
    organization?: string;
    year?: string;
    description?: string;
  }>;
  ownerCompetences?: Array<{
    id: string;
    name: string;
    level: number;
  }>;
}

function newCV(): CVOverviewItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    language: "en", // Default to English
  };
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  cvs = [],
  onChange,
  selectedId,
  onSelect,
  user,
  ownerName,
  ownerTitle,
  ownerDescription,
  ownerPhotoUrl,
  ownerRoles,
  ownerLanguages,
  ownerExpertise,
  ownerSelectedProjects = [],
  ownerExperiences = [],
  ownerEducations = [],
  ownerCoursesCertifications = [],
  ownerEngagements = [],
  ownerCompetences = [],
}: OverviewTabProps) => {
  // Initialize cvLang state from the CV items
  const [cvLang, setCvLang] = React.useState<Record<string, PdfLang>>(
    cvs.reduce((acc, cv) => {
      if (cv.language) {
        acc[cv.id] = cv.language;
      }
      return acc;
    }, {} as Record<string, PdfLang>)
  );

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [showAllCVs, setShowAllCVs] = React.useState(false);
  const [allCVs, setAllCVs] = React.useState<Array<CVOverviewItem & { userId?: string; ownerName?: string }>>([]);
  const [selectedCV, setSelectedCV] = React.useState<(CVOverviewItem & { userId?: string; ownerName?: string }) | null>(null);
  // Local selection mirror to ensure immediate visual feedback in admin view
  const [localSelectedId, setLocalSelectedId] = React.useState<string | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // Admin user filter (when viewing all CVs)
  const [selectedUserFilter, setSelectedUserFilter] = React.useState<string | null>(null);

  // Build unique user options from allCVs for the filter dropdown
  const userOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    (allCVs || []).forEach((cv) => {
      if (cv.userId) {
        const name = (cv.ownerName || "User").trim() || "User";
        if (!map.has(cv.userId)) map.set(cv.userId, name);
      }
    });
    // Sort options by display name
    return Array.from(map.entries())
      .map(([userId, name]) => ({ userId, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allCVs]);

  // Keep localSelectedId aligned when toggling admin view
  useEffect(() => {
    // When switching modes, prefer to keep whatever upstream says is selected
    if (!showAllCVs) {
      setLocalSelectedId(selectedId ?? null);
    }
  }, [showAllCVs]);

  // Check if user is admin on mount and when user changes
  React.useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const adminStatus = await isAdminUser(user);
          setIsAdmin(adminStatus);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]); // Only re-run if user changes

  // Fetch all CVs when showAllCVs changes
  React.useEffect(() => {
    const fetchAllCVs = async () => {
      if (showAllCVs) {
        setLoading(true);
        setError(null);
        try {
          const allCVs = await getAllCVs();
          setAllCVs(allCVs);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to load CVs');
        } finally {
          setLoading(false);
        }
      } else {
        setAllCVs([]);
        setSelectedUserFilter(null);
      }
    };

    fetchAllCVs();
  }, [showAllCVs]);

  // Update the selected CV when the selectedId prop changes
  useEffect(() => {
    if (selectedId) {
      console.log('selectedId changed:', selectedId);
      const selected = cvs.find(cv => cv.id === selectedId);
      console.log('Found selected CV:', selected);
      if (selected) {
        setSelectedCV(selected);
      } else if (allCVs.length > 0) {
        // If not found in cvs, try allCVs (for admin view)
        const selectedFromAll = allCVs.find(cv => cv.id === selectedId);
        if (selectedFromAll) {
          setSelectedCV(selectedFromAll);
        }
      }
      // keep local mirror in sync with upstream selection if admin list hasn't chosen something different
      if (localSelectedId == null || localSelectedId === selectedId) {
        setLocalSelectedId(selectedId);
      }
    }
  }, [selectedId, cvs, allCVs, localSelectedId]);

  const addCV = async () => {
    // In admin mode with all CVs visible, add to the selected owner's list
    if (showAllCVs && isAdmin) {
      // Prefer the currently selected CV's owner, then the filter selection
      const targetUserId = selectedCV?.userId || selectedUserFilter || null;
      if (!targetUserId) {
        alert('Please select a user in the filter or click a CV to choose an owner before adding.');
        return; // require a selected owner to add a CV for
      }
      const created = newCV();
      const toSave: { id: string; name: string; language: PdfLang; data: Record<string, unknown> } = { id: created.id, name: created.name, language: created.language as PdfLang, data: {} };
      try {
        await saveUserCV(targetUserId, toSave, true);
        // Optimistically update local list
        const ownerName = selectedCV?.ownerName || userOptions.find((u) => u.userId === targetUserId)?.name || "User";
        setAllCVs((prev) => [
          { id: created.id, name: created.name, language: created.language, userId: targetUserId, ownerName, data: {} },
          ...prev,
        ]);
        setLocalSelectedId(created.id);
        // Notify upstream selection with user context so the rest of UI hydrates
        onSelect?.(created.id, { id: created.id, name: created.name, language: created.language as PdfLang, userId: targetUserId, ownerName, data: {} });
      } catch {
        alert('Failed to create CV for selected user');
      }
      return;
    }

    // Normal (non-admin) flow: add to current user's list
    const created = newCV();
    onChange([created, ...(cvs || [])]);
    if (onSelect) onSelect(created.id);
  };

  const updateCV = (
    index: number,
    field: keyof CVOverviewItem,
    value: string | PdfLang
  ) => {
    const updated = [...(cvs || [])];
    const current = updated[index] || newCV();

    // Create a new CV with the updated field
    const updatedCv: CVOverviewItem = {
      ...current,
      [field]: field === "language" ? (value as PdfLang) : value,
    };

    // Update the local state for language if needed
    if (field === "language") {
      setCvLang((prev) => ({
        ...prev,
        [current.id]: value as PdfLang,
      }));
    }

    // Update the CV in the array
    updated[index] = updatedCv;

    // Trigger the parent's onChange with the updated CVs
    onChange(updated);
  };

  const removeCV = (index: number) => {
    const updated = [...(cvs || [])];
    updated.splice(index, 1);
    onChange(updated);
  };

  // Memoized mappings for PDF data to avoid heavy work in click handlers
  const selectedProjectsMapped = React.useMemo(
    () =>
      (ownerSelectedProjects || []).map((p) => ({
        customer: p.customer || "",
        title: p.title || "",
        description: p.description || "",
      })),
    [ownerSelectedProjects]
  );

  const educationsMapped = React.useMemo(
    () =>
      (ownerEducations || []).map((edu) => ({
        school: edu.school || "",
        degree: edu.title || "",
        startYear: edu.startYear || "",
        endYear: edu.endYear || "",
      })),
    [ownerEducations]
  );

  const coursesMapped = React.useMemo(
    () =>
      (ownerCoursesCertifications || []).map((course) => ({
        name: course.title || "",
        issuer: course.organization,
        year: course.year,
      })),
    [ownerCoursesCertifications]
  );

  const engagementsMapped = React.useMemo(
    () =>
      (ownerEngagements || []).map((eng) => ({
        type: "engagement" as const,
        title: eng.title || "",
        year: eng.year,
        locationOrPublication: eng.organization || "",
        description: eng.description,
        url: "",
      })),
    [ownerEngagements]
  );

  const competencesMapped = React.useMemo(() => {
    const byLevel: Record<
      2 | 3 | 4,
      { name: string; items: { name: string; level: number }[] }
    > = {
      2: { name: "Beginner", items: [] },
      3: { name: "Proficient", items: [] },
      4: { name: "Expert", items: [] },
    };
    (ownerCompetences || []).forEach((comp) => {
      if (comp.level >= 2 && comp.level <= 4) {
        byLevel[comp.level as 2 | 3 | 4].items.push({
          name: comp.name,
          level: comp.level,
        });
      }
    });
    return Object.values(byLevel)
      .filter((g) => g.items.length > 0)
      .map((g) => ({ category: g.name, items: g.items }));
  }, [ownerCompetences]);

  // Handle CV selection
  const handleCVSelect = useCallback((cv: CVOverviewItem & { userId?: string; ownerName?: string }) => {
    // Update local selection immediately for visual feedback (works in both modes)
    setLocalSelectedId(cv.id);
    if (onSelect) {
      onSelect(cv.id, cv);
    }
  }, [onSelect]);
  
  // Update local selectedCV when selectedId changes
  useEffect(() => {
    if (selectedId) {
      // Try to find in cvs (personal view) first
      const cvInCvs = cvs.find(cv => cv.id === selectedId);
      if (cvInCvs) {
        setSelectedCV(cvInCvs);
        return;
      }
      
      // If not found in cvs, try allCVs (admin view)
      const cvInAllCVs = allCVs.find(cv => cv.id === selectedId);
      if (cvInAllCVs) {
        setSelectedCV(cvInAllCVs);
        return;
      }
      
      // If not found in either, clear the selection
      setSelectedCV(null);
    } else {
      setSelectedCV(null);
    }
  }, [selectedId, cvs, allCVs]);

  const handleCreatePdf = React.useCallback(
    (cv: CVOverviewItem) => async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (isGenerating) return;
      setIsGenerating(true);
      try {
        const lang = (cv.language || cvLang[cv.id] || "en") as PdfLang;
        const blob = await generateCvPdf(
          ownerName,
          ownerDescription,
          ownerPhotoUrl,
          ownerRoles,
          ownerLanguages,
          ownerExpertise,
          selectedProjectsMapped,
          lang,
          ownerTitle,
          ownerExperiences,
          educationsMapped,
          coursesMapped,
          competencesMapped,
          engagementsMapped
        );
        downloadBlob(blob, filenameFromUserName(ownerName));
      } catch {
        alert("Failed to create PDF.");
      } finally {
        setIsGenerating(false);
      }
    },
    [
      isGenerating,
      ownerName,
      ownerDescription,
      ownerPhotoUrl,
      ownerRoles,
      ownerLanguages,
      ownerExpertise,
      ownerTitle,
      ownerExperiences,
      selectedProjectsMapped,
      educationsMapped,
      coursesMapped,
      competencesMapped,
      engagementsMapped,
      cvLang,
    ]
  );

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, maxWidth: 600, mx: "auto" }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          {isAdmin && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={showAllCVs}
                  onChange={(e) => setShowAllCVs(e.target.checked)}
                  disabled={loading}
                />
              }
              label={loading ? 'Loading...' : 'Show All CVs (Admin)'}
            />
          )}
        </Box>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={addCV} disabled={showAllCVs}>
          Add CV
        </Button>
      </Box>

      {isAdmin && showAllCVs && (
        <Box sx={{ mb: 2 }}>
          <TextField
            select
            fullWidth
            label="Filter by user"
            size="small"
            value={selectedUserFilter || ''}
            onChange={(e) => setSelectedUserFilter(e.target.value || null)}
            helperText="Select a user to filter CVs"
          >
            <MenuItem value="">All users</MenuItem>
            {userOptions.map((u) => (
              <MenuItem key={u.userId} value={u.userId}>{u.name}</MenuItem>
            ))}
          </TextField>
        </Box>
      )}

      {loading && (
        <Box sx={{ textAlign: 'center', my: 2 }}>
          <Typography>Loading CVs...</Typography>
        </Box>
      )}
      
      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      )}
      
      {(((showAllCVs ? allCVs : cvs) || []).filter((cv) => !showAllCVs || !selectedUserFilter || cv.userId === selectedUserFilter)).length === 0 ? (
        <Typography color="text.secondary">
          {showAllCVs ? 'No CVs found' : 'No CVs yet. Click "Add CV" to create your first one.'}
        </Typography>
      ) : (
        ((showAllCVs ? allCVs : cvs)
          .filter((cv) => !showAllCVs || !selectedUserFilter || cv.userId === selectedUserFilter)
        ).map((cv, index) => {
          // Use localSelectedId when available to ensure immediate visual feedback
          const effectiveSelectedId = localSelectedId ?? selectedId ?? null;
          const isSelected = effectiveSelectedId === cv.id;
          return (
            <Paper
              key={cv.id || index}
              elevation={isSelected ? 2 : 1}
              sx={{
                p: 2,
                mb: 2,
                border: "1px solid",
                borderColor: isSelected ? "primary.main" : "divider",
                bgcolor: isSelected ? "action.selected" : "background.paper",
                '&:hover': {
                  borderColor: isSelected ? "primary.main" : "text.secondary",
                },
                cursor: "pointer",
                transition: "background-color 0.2s, border-color 0.2s",
              }}
              onClick={() => handleCVSelect(cv)}
            >
              <Stack spacing={1}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {cv.name?.trim() || "Untitled CV"}
                    </Typography>
                    {cv.ownerName && (
                      <Typography variant="caption" color="text.secondary">
                        Owner: {cv.ownerName}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      value={cv.language || cvLang[cv.id] || "en"}
                      onChange={async (_e, value) => {
                        // event is intentionally unused
                        // In admin view allow changing language for any CV, saving to that CV's owner
                        if (showAllCVs) {
                          if (!value) return;
                          try {
                            if (!cv.userId) return;
                            await saveUserCV(cv.userId, { id: cv.id, name: cv.name, language: value, data: (cv as unknown as { data?: Record<string, unknown> }).data || {} }, false);
                            // Update local state so UI reflects change
                            setAllCVs((prev) => prev.map((c) => c.id === cv.id ? { ...c, language: value } : c));
                          } catch (err) {
                            console.error('Failed to update language as admin:', err);
                            alert('Failed to update language');
                          }
                          return;
                        }
                        if (!value) return; // ignore unselect
                        const idx = cvs.findIndex((c) => c.id === cv.id);
                        if (idx >= 0) {
                          updateCV(
                            idx,
                            "language",
                            value
                          );
                        }
                      }}
                      aria-label="PDF language toggle"
                      disabled={showAllCVs && !isAdmin}
                    >
                      <ToggleButton
                        value="en"
                        aria-label="English"
                        sx={{ px: 1, textTransform: "none" }}
                      >
                        EN
                      </ToggleButton>
                      <ToggleButton
                        value="sv"
                        aria-label="Svenska"
                        sx={{ px: 1, textTransform: "none" }}
                      >
                        SV
                      </ToggleButton>
                    </ToggleButtonGroup>
                    <Tooltip
                      title={isGenerating ? "Generating PDF..." : "Create PDF"}
                    >
                      <IconButton
                        aria-label="create pdf"
                        onClick={handleCreatePdf(cv)}
                        disabled={isGenerating}
                        size="small"
                      >
                        <PictureAsPdfIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete CV">
                      <IconButton
                        aria-label="remove cv"
                        onClick={async () => {
                          if (showAllCVs) {
                            if (!isAdmin) return;
                            if (!cv.userId) return;
                            const ok = confirm(`Delete CV "${cv.name || 'Untitled CV'}" for ${cv.ownerName || 'user'}?`);
                            if (!ok) return;
                            try {
                              await deleteUserCV(cv.userId, cv.id);
                              setAllCVs((prev) => prev.filter((c) => c.id !== cv.id));
                              if (localSelectedId === cv.id) {
                                setLocalSelectedId(null);
                                onSelect?.(null, undefined);
                              }
                            } catch (err) {
                              console.error('Failed to delete CV as admin:', err);
                              alert('Failed to delete CV');
                            }
                            return;
                          }
                          removeCV(index);
                        }}
                        disabled={showAllCVs && !isAdmin}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
                <TextField
                  fullWidth
                  label="Name"
                  size="small"
                  value={cv.name || ""}
                  onChange={(e) => {
                    if (showAllCVs) {
                      if (!isAdmin) return;
                      // Update local display name immediately
                      setAllCVs((prev) => prev.map((c) => c.id === cv.id ? { ...c, name: e.target.value } : c));
                      return;
                    }
                    updateCV(index, "name", e.target.value);
                  }}
                  onBlur={async (e) => {
                    if (showAllCVs) {
                      if (!isAdmin) return;
                      try {
                        if (!cv.userId) return;
                        const lang = (cv.language || (cvLang as Record<string, PdfLang>)[cv.id] || 'en') as PdfLang;
                        const data = (cv as unknown as { data?: Record<string, unknown> }).data || {};
                        await saveUserCV(cv.userId, { id: cv.id, name: e.target.value, language: lang, data }, false);
                      } catch (err) {
                        console.error('Failed to rename CV as admin:', err);
                        alert('Failed to save name');
                      }
                      return;
                    }
                    updateCV(index, "name", e.target.value);
                  }}
                  margin="normal"
                  variant="outlined"
                  onClick={(e) => e.stopPropagation()}
                  disabled={showAllCVs && !isAdmin}
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
