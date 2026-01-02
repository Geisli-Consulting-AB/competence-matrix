import {
  Box,
  Chip,
  useTheme,
  Autocomplete,
  TextField,
  useMediaQuery,
} from "@mui/material";

const LEVEL_COLORS = {
  1: "#ffeb3b", // Want to learn - Yellow
  2: "#ff9800", // Beginner - Orange
  3: "#4caf50", // Proficient - Green
  4: "#2196f3", // Expert - Blue
};

const LEVEL_LABELS = {
  1: "Want to learn",
  2: "Beginner",
  3: "Proficient",
  4: "Expert",
};

interface LevelLegendProps {
  selectedLevels: number[];
  onLevelsChange: (levels: number[]) => void;
}

export default function LevelLegend({
  selectedLevels,
  onLevelsChange,
}: LevelLegendProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleLevelToggle = (levelNum: number) => {
    if (selectedLevels.includes(levelNum)) {
      onLevelsChange(selectedLevels.filter((l) => l !== levelNum));
    } else {
      onLevelsChange([...selectedLevels, levelNum]);
    }
  };

  if (isMobile) {
    // Mobile: Select box
    const levelOptions = Object.entries(LEVEL_LABELS).map(([level, label]) => ({
      value: parseInt(level),
      label: `${level}. ${label}`,
    }));

    const selectedLevelLabels = selectedLevels
      .map(
        (level) =>
          levelOptions.find((option) => option.value === level)?.label || ""
      )
      .filter(Boolean);

    return (
      <Autocomplete
        multiple
        options={levelOptions.map((option) => option.label)}
        value={selectedLevelLabels}
        onChange={(_, newValue) => {
          const newLevels = newValue
            .map((label) => {
              const option = levelOptions.find((opt) => opt.label === label);
              return option ? option.value : 0;
            })
            .filter((level) => level > 0);
          onLevelsChange(newLevels);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Levels"
            size="small"
            sx={{ width: "100%" }}
          />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const levelNum =
              levelOptions.find((opt) => opt.label === option)?.value || 1;
            return (
              <Chip
                label={option}
                size="small"
                {...getTagProps({ index })}
                sx={{
                  backgroundColor:
                    LEVEL_COLORS[levelNum as keyof typeof LEVEL_COLORS],
                  color: theme.palette.getContrastText(
                    LEVEL_COLORS[levelNum as keyof typeof LEVEL_COLORS]
                  ),
                  "& .MuiChip-deleteIcon": {
                    color: theme.palette.getContrastText(
                      LEVEL_COLORS[levelNum as keyof typeof LEVEL_COLORS]
                    ),
                  },
                }}
              />
            );
          })
        }
      />
    );
  }

  // Desktop: Original chip-based design
  return (
    <Box
      component="fieldset"
      sx={{
        mb: 3,
        display: "flex",
        gap: 1,
        flexWrap: "wrap",
        alignItems: "center",
        p: 1,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        backgroundColor: "transparent",
      }}
    >
      <Box
        component="legend"
        sx={{
          fontSize: "0.875rem",
          color: "text.secondary",
          px: 1,
          mr: 1,
          textAlign: "left",
        }}
      >
        Level
      </Box>
      {Object.entries(LEVEL_LABELS).map(([level, label]) => {
        const levelNum = parseInt(level);
        const isSelected = selectedLevels.includes(levelNum);
        return (
          <Chip
            key={level}
            label={`${level}. ${label}`}
            size="small"
            clickable
            onClick={() => handleLevelToggle(levelNum)}
            sx={{
              backgroundColor: isSelected
                ? LEVEL_COLORS[levelNum as keyof typeof LEVEL_COLORS]
                : "transparent",
              borderColor: LEVEL_COLORS[levelNum as keyof typeof LEVEL_COLORS],
              color: isSelected
                ? theme.palette.getContrastText(
                    LEVEL_COLORS[levelNum as keyof typeof LEVEL_COLORS]
                  )
                : LEVEL_COLORS[levelNum as keyof typeof LEVEL_COLORS],
              border: isSelected ? "2px solid white" : "none",
              "&:hover": {
                backgroundColor:
                  LEVEL_COLORS[levelNum as keyof typeof LEVEL_COLORS],
                opacity: 1,
                transform: "scale(1.05)",
              },
              transition: "all 0.2s ease",
            }}
          />
        );
      })}
    </Box>
  );
}
