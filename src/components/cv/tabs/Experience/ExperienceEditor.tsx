import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  IconButton,
  Stack,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Tooltip,
  Autocomplete,
  Collapse,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TranslatableTextField from "../../../TranslatableTextField";
import type { Experience } from "../../CVManagement";

export interface ExperienceEditorProps {
  experiences: Experience[];
  onChange: (experiences: Experience[]) => void;
  existingCompetences?: string[];
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function newExperience(): Experience {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    ongoing: false,
    employer: "",
    title: "",
    description: "",
    competences: [],
  };
}

const ExperienceEditor: React.FC<ExperienceEditorProps> = ({
  experiences = [],
  onChange,
  existingCompetences = [],
}) => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({});

  // Ensure expanded state exists for all items; default collapsed
  useEffect(() => {
    setExpandedById((prev) => {
      const next: Record<string, boolean> = { ...prev };
      (experiences || []).forEach((exp) => {
        if (exp?.id && next[exp.id] === undefined) next[exp.id] = false;
      });
      // Clean up any ids that no longer exist
      Object.keys(next).forEach((id) => {
        if (!(experiences || []).some((e) => e.id === id)) delete next[id];
      });
      return next;
    });
  }, [experiences]);

  const addExperience = () => {
    const ne = newExperience();
    onChange([ne, ...(experiences || [])]);
    setExpandedById((prev) => ({ ...prev, [ne.id]: true }));
  };

  const updateExperience = <K extends keyof Experience>(
    index: number,
    field: K,
    value: Experience[K]
  ) => {
    const updated = [...(experiences || [])];
    const current = updated[index] || newExperience();
    updated[index] = { ...current, [field]: value } as Experience;
    onChange(updated);
  };

  const removeExperience = (index: number) => {
    const updated = [...(experiences || [])];
    const [removed] = updated.splice(index, 1);
    onChange(updated);
    if (removed?.id) {
      setExpandedById((prev) => {
        const copy = { ...prev };
        delete copy[removed.id];
        return copy;
      });
    }
  };

  const handleDragStart =
    (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
      setDraggingIndex(index);
      e.dataTransfer.effectAllowed = "move";
      try {
        e.dataTransfer.setData("text/plain", String(index));
      } catch {
        // no-op
      }
    };

  const handleDragOver =
    (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragOverIndex !== index) setDragOverIndex(index);
    };

  const handleDrop =
    (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      let from = draggingIndex ?? -1;
      try {
        const data = e.dataTransfer.getData("text/plain");
        if (data !== "") from = Number(data);
      } catch {
        // ignore
      }
      const to = index;
      setDragOverIndex(null);
      setDraggingIndex(null);
      if (from < 0 || from === to) return;
      const updated = [...(experiences || [])];
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
    setExpandedById((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const headerTitle = (exp: Experience) => {
    const employer = exp.employer?.trim() || "Employer";
    const title = exp.title?.trim() || "Title";
    return `${employer} — ${title}`;
  };

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
        <Typography variant="h5">Experience</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addExperience}
          sx={{ ml: 2 }}
        >
          Add Experience
        </Button>
      </Box>

      {(experiences || []).map((exp, index) => (
        <Paper
          key={exp.id || index}
          elevation={1}
          sx={{
            p: 2,
            mb: 2,
            outline: dragOverIndex === index ? "2px dashed #1976d2" : "none",
            opacity: draggingIndex === index ? 0.7 : 1,
            cursor: "grab",
          }}
          draggable
          onDragStart={handleDragStart(index)}
          onDragOver={handleDragOver(index)}
          onDrop={handleDrop(index)}
          onDragEnd={handleDragEnd}
        >
          {/* Header row with drag handle, title, delete and expand/collapse */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip title="Drag to reorder" placement="top" arrow>
              <Box
                sx={{
                  width: 32,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "text.secondary",
                  cursor: "grab",
                  "&:active": { cursor: "grabbing" },
                }}
                aria-label="Drag to reorder"
              >
                <DragIndicatorIcon fontSize="small" />
              </Box>
            </Tooltip>

            <Typography
              variant="subtitle1"
              sx={{ flexGrow: 1, ml: 1, fontWeight: 500 }}
            >
              {headerTitle(exp)}
            </Typography>

            <IconButton
              aria-label="remove experience"
              onClick={() => removeExperience(index)}
              sx={{ ml: 1 }}
            >
              <DeleteOutlineIcon />
            </IconButton>
            <IconButton
              aria-label={
                expandedById[exp.id]
                  ? "Collapse experience"
                  : "Expand experience"
              }
              aria-expanded={!!expandedById[exp.id]}
              onClick={() => toggleExpanded(exp.id)}
              sx={{ ml: 1 }}
              size="small"
            >
              {expandedById[exp.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          {/* Collapsible content */}
          <Collapse in={!!expandedById[exp.id]} timeout="auto" unmountOnExit>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mt: 1, alignItems: "center", flexWrap: "wrap", ml: 0 }}
            >
              <TextField
                select
                fullWidth
                label="Start Month"
                size="small"
                value={exp.startMonth || ""}
                onChange={(e) =>
                  updateExperience(index, "startMonth", e.target.value)
                }
                onBlur={(e) =>
                  updateExperience(index, "startMonth", e.target.value)
                }
                sx={{ width: { xs: "100%", sm: 200 } }}
              >
                <MenuItem value="">-</MenuItem>
                {months.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Start Year"
                type="number"
                size="small"
                value={exp.startYear || ""}
                onChange={(e) =>
                  updateExperience(index, "startYear", e.target.value)
                }
                onBlur={(e) =>
                  updateExperience(index, "startYear", e.target.value)
                }
                placeholder="e.g., 2021"
                inputProps={{ min: 1900, max: 2100 }}
                sx={{ width: { xs: "100%", sm: 140 } }}
              />
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mt: 1, alignItems: "center", flexWrap: "wrap", ml: 0 }}
            >
              <TextField
                select
                fullWidth
                label="End Month"
                size="small"
                value={exp.ongoing ? "" : exp.endMonth || ""}
                onChange={(e) =>
                  updateExperience(index, "endMonth", e.target.value)
                }
                onBlur={(e) =>
                  updateExperience(index, "endMonth", e.target.value)
                }
                disabled={!!exp.ongoing}
                sx={{ width: { xs: "100%", sm: 200 } }}
              >
                <MenuItem value="">-</MenuItem>
                {months.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="End Year"
                type="number"
                size="small"
                value={exp.ongoing ? "" : exp.endYear || ""}
                onChange={(e) =>
                  updateExperience(index, "endYear", e.target.value)
                }
                onBlur={(e) =>
                  updateExperience(index, "endYear", e.target.value)
                }
                disabled={!!exp.ongoing}
                placeholder="e.g., 2024"
                inputProps={{ min: 1900, max: 2100 }}
                sx={{ width: { xs: "100%", sm: 140 } }}
              />
              <FormControlLabel
                sx={{ ml: { xs: 0, sm: 1 }, mt: { xs: 1, sm: 0 } }}
                control={
                  <Checkbox
                    checked={!!exp.ongoing}
                    onChange={(e) =>
                      updateExperience(index, "ongoing", e.target.checked)
                    }
                  />
                }
                label="Ongoing"
              />
            </Stack>

            <Box sx={{ mt: 1, ml: 0 }}>
              <TranslatableTextField
                fullWidth
                label="Employer"
                size="small"
                value={exp.employer || ""}
                onChange={(value) => updateExperience(index, "employer", value)}
                onBlurValue={(value) =>
                  updateExperience(index, "employer", value)
                }
                margin="normal"
                variant="outlined"
              />
            </Box>

            <Box sx={{ mt: 1, ml: 0 }}>
              <TranslatableTextField
                fullWidth
                label="Title"
                size="small"
                value={exp.title || ""}
                onChange={(value) => updateExperience(index, "title", value)}
                onBlurValue={(value) => updateExperience(index, "title", value)}
                margin="normal"
                variant="outlined"
              />
            </Box>

            <Box sx={{ mt: 1, ml: 0 }}>
              <TranslatableTextField
                fullWidth
                label="Description"
                size="small"
                value={exp.description || ""}
                onChange={(value) =>
                  updateExperience(index, "description", value)
                }
                onBlurValue={(value) =>
                  updateExperience(index, "description", value)
                }
                margin="normal"
                variant="outlined"
                multiline
                rows={3}
              />
            </Box>

            <Box sx={{ mt: 1, ml: 0 }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle1">Competences</Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const current = Array.isArray(exp.competences)
                      ? exp.competences
                      : [];
                    const updatedList: string[] = ["", ...current];
                    updateExperience(index, "competences", updatedList);
                  }}
                >
                  Add Competence
                </Button>
              </Stack>

              {(Array.isArray(exp.competences) ? exp.competences : []).map(
                (c, cIdx) => (
                  <Paper key={cIdx} elevation={1} sx={{ p: 1, mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Autocomplete
                        freeSolo
                        options={existingCompetences}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Competence"
                            size="small"
                            margin="normal"
                            variant="outlined"
                            fullWidth
                          />
                        )}
                        value={c || ""}
                        onChange={(_, newValue) => {
                          const list: string[] = [
                            ...(Array.isArray(exp.competences)
                              ? exp.competences!
                              : []),
                          ];
                          list[cIdx] = (newValue as string) || "";
                          updateExperience(index, "competences", list);
                        }}
                        onInputChange={(_, newInputValue) => {
                          const list: string[] = [
                            ...(Array.isArray(exp.competences)
                              ? exp.competences!
                              : []),
                          ];
                          list[cIdx] = newInputValue || "";
                          updateExperience(index, "competences", list);
                        }}
                        fullWidth
                      />
                      <IconButton
                        aria-label="remove competence"
                        onClick={() => {
                          const list: string[] = [
                            ...(Array.isArray(exp.competences)
                              ? exp.competences!
                              : []),
                          ];
                          list.splice(cIdx, 1);
                          updateExperience(index, "competences", list);
                        }}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Stack>
                  </Paper>
                )
              )}
            </Box>
          </Collapse>
        </Paper>
      ))}
    </Paper>
  );
};

export default ExperienceEditor;
