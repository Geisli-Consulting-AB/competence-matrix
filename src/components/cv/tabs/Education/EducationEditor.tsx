import React, { useState } from "react";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TranslatableTextField from "../../../TranslatableTextField";
import type { Education } from "../../CVManagement";

export interface EducationEditorProps {
  educations: Education[];
  onChange: (educations: Education[]) => void;
}

function newEducation(): Education {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startYear: "",
    endYear: "",
    school: "",
    title: "",
  };
}

const EducationEditor: React.FC<EducationEditorProps> = ({
  educations = [],
  onChange,
}) => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({});



  const addEducation = () => {
    const ne = newEducation();
    onChange([ne, ...(educations || [])]);
    setExpandedById((prev) => ({ ...prev, [ne.id]: true }));
  };

  const updateEducation = <K extends keyof Education>(
    index: number,
    field: K,
    value: Education[K]
  ) => {
    const updated = [...(educations || [])];
    const current = updated[index] || newEducation();
    updated[index] = { ...current, [field]: value } as Education;
    onChange(updated);
  };

  const removeEducation = (index: number) => {
    const updated = [...(educations || [])];
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
        /* ignore */
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
        /* ignore */
      }
      const to = index;
      setDragOverIndex(null);
      setDraggingIndex(null);
      if (from < 0 || from === to) return;
      const updated = [...(educations || [])];
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

  const headerTitle = (ed: Education) => {
    const school = ed.school?.trim() || "School/University";
    const title = ed.title?.trim() || "Title";
    return `${school} — ${title}`;
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
        <Typography variant="h5">Education</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addEducation}
          sx={{ ml: 2 }}
        >
          Add Education
        </Button>
      </Box>

      {(educations || []).map((ed, index) => (
        <Paper
          key={ed.id || index}
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
              {headerTitle(ed)}
            </Typography>

            <IconButton
              aria-label="remove education"
              onClick={() => removeEducation(index)}
              sx={{ ml: 1 }}
            >
              <DeleteOutlineIcon />
            </IconButton>
            <IconButton
              aria-label={
                expandedById[ed.id] ? "Collapse education" : "Expand education"
              }
              aria-expanded={!!expandedById[ed.id]}
              onClick={() => toggleExpanded(ed.id)}
              sx={{ ml: 1 }}
              size="small"
            >
              {expandedById[ed.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          {/* Collapsible content */}
          <Collapse in={!!expandedById[ed.id]} timeout="auto" unmountOnExit>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mt: 1, alignItems: "center", flexWrap: "wrap", ml: 0 }}
            >
              <TextField
                fullWidth
                label="Start Year"
                type="number"
                size="small"
                value={ed.startYear || ""}
                onChange={(e) =>
                  updateEducation(index, "startYear", e.target.value)
                }
                onBlur={(e) =>
                  updateEducation(index, "startYear", e.target.value)
                }
                placeholder="e.g., 2018"
                inputProps={{ min: 1900, max: 2100 }}
                sx={{ width: { xs: "100%", sm: 140 } }}
              />
              <TextField
                fullWidth
                label="End Year"
                type="number"
                size="small"
                value={ed.endYear || ""}
                onChange={(e) =>
                  updateEducation(index, "endYear", e.target.value)
                }
                onBlur={(e) =>
                  updateEducation(index, "endYear", e.target.value)
                }
                placeholder="e.g., 2022"
                inputProps={{ min: 1900, max: 2100 }}
                sx={{ width: { xs: "100%", sm: 140 } }}
              />
            </Stack>

            <Box sx={{ mt: 1, ml: 0 }}>
              <TranslatableTextField
                fullWidth
                label="School / University"
                size="small"
                value={ed.school || ""}
                onChange={(value) => updateEducation(index, "school", value)}
                onBlurValue={(value) => updateEducation(index, "school", value)}
                margin="normal"
                variant="outlined"
              />
            </Box>

            <Box sx={{ mt: 1, ml: 0 }}>
              <TranslatableTextField
                fullWidth
                label="Title"
                size="small"
                value={ed.title || ""}
                onChange={(value) => updateEducation(index, "title", value)}
                onBlurValue={(value) => updateEducation(index, "title", value)}
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

export default EducationEditor;
