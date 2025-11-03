import React from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  IconButton,
  Stack,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import {
  generateCvPdf,
  downloadBlob,
  filenameFromUserName,
  type PdfLang,
} from "../../../../pdf";

export interface CVOverviewItem {
  id: string;
  name: string;
  language?: PdfLang;
}

export interface ProjectItem {
  id: string;
  customer: string;
  title: string;
  description: string;
}

export interface OverviewTabProps {
  cvs: CVOverviewItem[];
  onChange: (cvs: CVOverviewItem[]) => void;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
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
  const addCV = () => {
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

  // Async PDF generation with race condition prevention and error handling
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
      } catch (error) {
        console.error("[PDF] UI: Failed to generate or download PDF", error);
        alert("Failed to create PDF. See console for details.");
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
      <Box
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h5">CVs</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={addCV}>
            Add CV
          </Button>
        </Box>
      </Box>

      {(cvs || []).length === 0 ? (
        <Typography color="text.secondary">
          No CVs yet. Click "Add CV" to create your first one.
        </Typography>
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
                border: "1px solid",
                borderColor: isSelected ? "primary.main" : "divider",
                bgcolor: isSelected ? "action.selected" : "background.paper",
                cursor: "pointer",
                transition: "background-color 0.2s, border-color 0.2s",
              }}
              onClick={() => onSelect && onSelect(cv.id)}
            >
              <Stack spacing={1}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {cv.name?.trim() || "Untitled CV"}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      value={cv.language || cvLang[cv.id] || "en"}
                      onChange={(e, value) => {
                        e.stopPropagation();
                        if (!value) return; // ignore unselect
                        updateCV(
                          cvs.findIndex((c) => c.id === cv.id),
                          "language",
                          value
                        );
                      }}
                      aria-label="PDF language toggle"
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
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCV(index);
                        }}
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
                  onChange={(e) => updateCV(index, "name", e.target.value)}
                  onBlur={(e) => updateCV(index, "name", e.target.value)}
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
