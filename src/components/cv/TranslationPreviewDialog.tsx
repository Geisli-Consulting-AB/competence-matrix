import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TranslateIcon from "@mui/icons-material/Translate";
import type {
  UserProfile,
  Experience,
  Education,
  CourseCert,
  EngagementPublication,
  Project,
} from "./CVManagement";

export interface TranslatedProfile {
  displayName?: string;
  title?: string;
  description?: string;
  roles?: string[];
  expertise?: string[];
  projects?: Project[];
  experiences?: Experience[];
  educations?: Education[];
  coursesCertifications?: CourseCert[];
  engagementsPublications?: EngagementPublication[];
}

interface TranslationPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (translatedData: TranslatedProfile, newCvName: string) => void;
  originalProfile: UserProfile;
  originalCvName: string;
  isTranslating: boolean;
  translatedProfile: TranslatedProfile | null;
  translationError: string | null;
}

interface FieldPairProps {
  label: string;
  originalValue: string;
  translatedValue: string;
  onTranslatedChange: (value: string) => void;
  multiline?: boolean;
}

const FieldPair: React.FC<FieldPairProps> = ({
  label,
  originalValue,
  translatedValue,
  onTranslatedChange,
  multiline = false,
}) => {
  if (!originalValue && !translatedValue) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Box
        sx={{
          bgcolor: "none",
          color: "white",
          p: 2,
          borderRadius: 1,
          mb: 1,
          border: "1px solid",
          borderColor: "grey.600",
        }}
      >
        <Typography
          variant="caption"
          sx={{ display: "block", mb: 0.5, fontWeight: 600, color: "white" }}
        >
          Svenska (Original)
        </Typography>
        <Typography
          variant="body2"
          sx={{ whiteSpace: "pre-wrap", color: "white" }}
        >
          {originalValue || "-"}
        </Typography>
      </Box>
      <TextField
        fullWidth
        size="small"
        label="English (Translation)"
        value={translatedValue}
        onChange={(e) => onTranslatedChange(e.target.value)}
        multiline={multiline}
        rows={multiline ? 3 : 1}
        variant="outlined"
      />
    </Box>
  );
};

interface ArrayFieldPairProps {
  label: string;
  originalValues: string[];
  translatedValues: string[];
  onTranslatedChange: (index: number, value: string) => void;
}

const ArrayFieldPair: React.FC<ArrayFieldPairProps> = ({
  label,
  originalValues,
  translatedValues,
  onTranslatedChange,
}) => {
  if (!originalValues?.length && !translatedValues?.length) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Box
        sx={{
          bgcolor: "none",
          color: "white",
          p: 2,
          borderRadius: 1,
          mb: 1,
          border: "1px solid",
          borderColor: "grey.600",
        }}
      >
        <Typography
          variant="caption"
          sx={{ display: "block", mb: 0.5, fontWeight: 600, color: "white" }}
        >
          Svenska (Original)
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {(originalValues || []).map((val, idx) => (
            <Chip
              key={idx}
              label={val}
              size="small"
              variant="outlined"
              sx={{
                borderColor: "white",
                color: "white",
                "& .MuiChip-label": { color: "white" },
              }}
            />
          ))}
        </Box>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          English (Translation) - Edit each item:
        </Typography>
        {(translatedValues || []).map((val, idx) => (
          <TextField
            key={idx}
            size="small"
            value={val}
            onChange={(e) => onTranslatedChange(idx, e.target.value)}
            variant="outlined"
            fullWidth
          />
        ))}
      </Box>
    </Box>
  );
};

const TranslationPreviewDialog: React.FC<TranslationPreviewDialogProps> = ({
  open,
  onClose,
  onSave,
  originalProfile,
  originalCvName,
  isTranslating,
  translatedProfile,
  translationError,
}) => {
  const [editedTranslation, setEditedTranslation] = useState<TranslatedProfile>(
    {}
  );
  const [newCvName, setNewCvName] = useState("");

  // Initialize edited translation when translatedProfile changes
  useEffect(() => {
    if (translatedProfile) {
      queueMicrotask(() => {
        setEditedTranslation({ ...translatedProfile });
      });
    }
  }, [translatedProfile]);

  // Set default CV name when dialog opens
  useEffect(() => {
    if (open && originalCvName) {
      // Create a name for the English copy
      const baseName = originalCvName.replace(/\s*\(SV\)\s*$/i, "").trim();
      queueMicrotask(() => {
        setNewCvName(`${baseName} (EN)`);
      });
    }
  }, [open, originalCvName]);

  const handleFieldChange = useCallback(
    (field: keyof TranslatedProfile, value: string) => {
      setEditedTranslation((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleArrayFieldChange = useCallback(
    (field: "roles" | "expertise", index: number, value: string) => {
      setEditedTranslation((prev) => {
        const arr = [...(prev[field] || [])];
        arr[index] = value;
        return { ...prev, [field]: arr };
      });
    },
    []
  );

  const handleExperienceChange = useCallback(
    (index: number, field: keyof Experience, value: string) => {
      setEditedTranslation((prev) => {
        const experiences = [...(prev.experiences || [])];
        if (experiences[index]) {
          experiences[index] = { ...experiences[index], [field]: value };
        }
        return { ...prev, experiences };
      });
    },
    []
  );

  const handleEducationChange = useCallback(
    (index: number, field: keyof Education, value: string) => {
      setEditedTranslation((prev) => {
        const educations = [...(prev.educations || [])];
        if (educations[index]) {
          educations[index] = { ...educations[index], [field]: value };
        }
        return { ...prev, educations };
      });
    },
    []
  );

  const handleCourseChange = useCallback(
    (index: number, field: keyof CourseCert, value: string) => {
      setEditedTranslation((prev) => {
        const coursesCertifications = [...(prev.coursesCertifications || [])];
        if (coursesCertifications[index]) {
          coursesCertifications[index] = {
            ...coursesCertifications[index],
            [field]: value,
          };
        }
        return { ...prev, coursesCertifications };
      });
    },
    []
  );

  const handleEngagementChange = useCallback(
    (index: number, field: keyof EngagementPublication, value: string) => {
      setEditedTranslation((prev) => {
        const engagementsPublications = [
          ...(prev.engagementsPublications || []),
        ];
        if (engagementsPublications[index]) {
          engagementsPublications[index] = {
            ...engagementsPublications[index],
            [field]: value,
          };
        }
        return { ...prev, engagementsPublications };
      });
    },
    []
  );

  const handleProjectChange = useCallback(
    (index: number, field: keyof Project, value: string) => {
      setEditedTranslation((prev) => {
        const projects = [...(prev.projects || [])];
        if (projects[index]) {
          projects[index] = { ...projects[index], [field]: value };
        }
        return { ...prev, projects };
      });
    },
    []
  );

  const handleSave = () => {
    onSave(editedTranslation, newCvName);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <TranslateIcon color="primary" />
        Create English Translation
      </DialogTitle>
      <DialogContent dividers>
        {isTranslating && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 4,
            }}
          >
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Translating your CV to English...
            </Typography>
            <Typography variant="caption" color="text.secondary">
              This may take a moment
            </Typography>
          </Box>
        )}

        {translationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {translationError}
          </Alert>
        )}

        {!isTranslating && translatedProfile && (
          <>
            {/* CV Name */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                New CV Name
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={newCvName}
                onChange={(e) => setNewCvName(e.target.value)}
                variant="outlined"
                helperText="Name for the translated CV copy"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Personal Information */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Personal Information</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FieldPair
                  label="Full Name"
                  originalValue={originalProfile.displayName || ""}
                  translatedValue={editedTranslation.displayName || ""}
                  onTranslatedChange={(v) =>
                    handleFieldChange("displayName", v)
                  }
                />
                <FieldPair
                  label="Title"
                  originalValue={originalProfile.title || ""}
                  translatedValue={editedTranslation.title || ""}
                  onTranslatedChange={(v) => handleFieldChange("title", v)}
                />
                <FieldPair
                  label="Professional Summary"
                  originalValue={originalProfile.description || ""}
                  translatedValue={editedTranslation.description || ""}
                  onTranslatedChange={(v) =>
                    handleFieldChange("description", v)
                  }
                  multiline
                />
                <ArrayFieldPair
                  label="Roles"
                  originalValues={originalProfile.roles || []}
                  translatedValues={editedTranslation.roles || []}
                  onTranslatedChange={(idx, v) =>
                    handleArrayFieldChange("roles", idx, v)
                  }
                />
                <ArrayFieldPair
                  label="Expertise"
                  originalValues={originalProfile.expertise || []}
                  translatedValues={editedTranslation.expertise || []}
                  onTranslatedChange={(idx, v) =>
                    handleArrayFieldChange("expertise", idx, v)
                  }
                />
              </AccordionDetails>
            </Accordion>

            {/* Experience */}
            {(originalProfile.experiences?.length || 0) > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    Experience ({originalProfile.experiences?.length || 0})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {(originalProfile.experiences || []).map((exp, idx) => (
                    <Box
                      key={exp.id || idx}
                      sx={{ mb: 3, p: 2, bgcolor: "none", borderRadius: 1 }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ mb: 2, fontWeight: 600 }}
                      >
                        {exp.employer} — {exp.title}
                      </Typography>
                      <FieldPair
                        label="Employer"
                        originalValue={exp.employer || ""}
                        translatedValue={
                          editedTranslation.experiences?.[idx]?.employer || ""
                        }
                        onTranslatedChange={(v) =>
                          handleExperienceChange(idx, "employer", v)
                        }
                      />
                      <FieldPair
                        label="Title"
                        originalValue={exp.title || ""}
                        translatedValue={
                          editedTranslation.experiences?.[idx]?.title || ""
                        }
                        onTranslatedChange={(v) =>
                          handleExperienceChange(idx, "title", v)
                        }
                      />
                      <FieldPair
                        label="Description"
                        originalValue={exp.description || ""}
                        translatedValue={
                          editedTranslation.experiences?.[idx]?.description ||
                          ""
                        }
                        onTranslatedChange={(v) =>
                          handleExperienceChange(idx, "description", v)
                        }
                        multiline
                      />
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            )}

            {/* Education */}
            {(originalProfile.educations?.length || 0) > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    Education ({originalProfile.educations?.length || 0})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {(originalProfile.educations || []).map((edu, idx) => (
                    <Box
                      key={edu.id || idx}
                      sx={{ mb: 3, p: 2, bgcolor: "none", borderRadius: 1 }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ mb: 2, fontWeight: 600 }}
                      >
                        {edu.school} — {edu.title}
                      </Typography>
                      <FieldPair
                        label="School / University"
                        originalValue={edu.school || ""}
                        translatedValue={
                          editedTranslation.educations?.[idx]?.school || ""
                        }
                        onTranslatedChange={(v) =>
                          handleEducationChange(idx, "school", v)
                        }
                      />
                      <FieldPair
                        label="Degree / Program"
                        originalValue={edu.title || ""}
                        translatedValue={
                          editedTranslation.educations?.[idx]?.title || ""
                        }
                        onTranslatedChange={(v) =>
                          handleEducationChange(idx, "title", v)
                        }
                      />
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            )}

            {/* Courses & Certifications */}
            {(originalProfile.coursesCertifications?.length || 0) > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    Courses & Certifications (
                    {originalProfile.coursesCertifications?.length || 0})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {(originalProfile.coursesCertifications || []).map(
                    (course, idx) => (
                      <Box
                        key={course.id || idx}
                        sx={{
                          mb: 3,
                          p: 2,
                          bgcolor: "none",
                          borderRadius: 1,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ mb: 2, fontWeight: 600 }}
                        >
                          {course.title} — {course.organization}
                        </Typography>
                        <FieldPair
                          label="Title"
                          originalValue={course.title || ""}
                          translatedValue={
                            editedTranslation.coursesCertifications?.[idx]
                              ?.title || ""
                          }
                          onTranslatedChange={(v) =>
                            handleCourseChange(idx, "title", v)
                          }
                        />
                        <FieldPair
                          label="Organization"
                          originalValue={course.organization || ""}
                          translatedValue={
                            editedTranslation.coursesCertifications?.[idx]
                              ?.organization || ""
                          }
                          onTranslatedChange={(v) =>
                            handleCourseChange(idx, "organization", v)
                          }
                        />
                      </Box>
                    )
                  )}
                </AccordionDetails>
              </Accordion>
            )}

            {/* Engagements & Publications */}
            {(originalProfile.engagementsPublications?.length || 0) > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    Engagements & Publications (
                    {originalProfile.engagementsPublications?.length || 0})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {(originalProfile.engagementsPublications || []).map(
                    (eng, idx) => (
                      <Box
                        key={eng.id || idx}
                        sx={{
                          mb: 3,
                          p: 2,
                          bgcolor: "none",
                          borderRadius: 1,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ mb: 2, fontWeight: 600 }}
                        >
                          {eng.title}
                        </Typography>
                        <FieldPair
                          label="Title"
                          originalValue={eng.title || ""}
                          translatedValue={
                            editedTranslation.engagementsPublications?.[idx]
                              ?.title || ""
                          }
                          onTranslatedChange={(v) =>
                            handleEngagementChange(idx, "title", v)
                          }
                        />
                        <FieldPair
                          label="Location / Publication"
                          originalValue={eng.locationOrPublication || ""}
                          translatedValue={
                            editedTranslation.engagementsPublications?.[idx]
                              ?.locationOrPublication || ""
                          }
                          onTranslatedChange={(v) =>
                            handleEngagementChange(
                              idx,
                              "locationOrPublication",
                              v
                            )
                          }
                        />
                        <FieldPair
                          label="Description"
                          originalValue={eng.description || ""}
                          translatedValue={
                            editedTranslation.engagementsPublications?.[idx]
                              ?.description || ""
                          }
                          onTranslatedChange={(v) =>
                            handleEngagementChange(idx, "description", v)
                          }
                          multiline
                        />
                      </Box>
                    )
                  )}
                </AccordionDetails>
              </Accordion>
            )}

            {/* Projects */}
            {(originalProfile.projects?.length || 0) > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    Projects ({originalProfile.projects?.length || 0})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {(originalProfile.projects || []).map((project, idx) => (
                    <Box
                      key={project.id || idx}
                      sx={{ mb: 3, p: 2, bgcolor: "none", borderRadius: 1 }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ mb: 2, fontWeight: 600 }}
                      >
                        {project.customer} — {project.title}
                      </Typography>
                      <FieldPair
                        label="Customer"
                        originalValue={project.customer || ""}
                        translatedValue={
                          editedTranslation.projects?.[idx]?.customer || ""
                        }
                        onTranslatedChange={(v) =>
                          handleProjectChange(idx, "customer", v)
                        }
                      />
                      <FieldPair
                        label="Title"
                        originalValue={project.title || ""}
                        translatedValue={
                          editedTranslation.projects?.[idx]?.title || ""
                        }
                        onTranslatedChange={(v) =>
                          handleProjectChange(idx, "title", v)
                        }
                      />
                      <FieldPair
                        label="Description"
                        originalValue={project.description || ""}
                        translatedValue={
                          editedTranslation.projects?.[idx]?.description || ""
                        }
                        onTranslatedChange={(v) =>
                          handleProjectChange(idx, "description", v)
                        }
                        multiline
                      />
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={isTranslating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isTranslating || !translatedProfile || !newCvName.trim()}
          startIcon={<TranslateIcon />}
        >
          Create Translated Copy
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TranslationPreviewDialog;
