import React from "react";
import {
  Box,
  Chip,
  useTheme,
  Autocomplete,
  TextField,
  useMediaQuery,
} from "@mui/material";
import type { Category } from "../firebase";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoriesChange: (categoryIds: string[]) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategories,
  onCategoriesChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (categories.length === 0) {
    return null;
  }

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter((id) => id !== categoryId));
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  if (isMobile) {
    // Mobile: Select box
    const selectedCategoryNames = selectedCategories
      .map((categoryId) => {
        const category = categories.find((cat) => cat.id === categoryId);
        return category ? category.name : "";
      })
      .filter(Boolean);

    return (
      <Autocomplete
        multiple
        options={categories.map((category) => category.name)}
        value={selectedCategoryNames}
        onChange={(_, newValue) => {
          const newCategoryIds = newValue
            .map((name) => {
              const category = categories.find((cat) => cat.name === name);
              return category ? category.id : "";
            })
            .filter(Boolean);
          onCategoriesChange(newCategoryIds);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Categories"
            size="small"
            sx={{ width: "100%" }}
          />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const category = categories.find((cat) => cat.name === option);
            return (
              <Chip
                label={option}
                size="small"
                {...getTagProps({ index })}
                sx={{
                  backgroundColor: category?.color || theme.palette.grey[700],
                  color: category
                    ? theme.palette.getContrastText(category.color)
                    : theme.palette.common.white,
                  "& .MuiChip-deleteIcon": {
                    color: category
                      ? theme.palette.getContrastText(category.color)
                      : theme.palette.common.white,
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
        Category
      </Box>
      {categories.map((category) => {
        const isSelected = selectedCategories.includes(category.id);
        return (
          <Chip
            key={category.id}
            label={category.name}
            size="small"
            clickable
            onClick={() => handleCategoryClick(category.id)}
            sx={{
              backgroundColor: isSelected ? category.color : "transparent",
              borderColor: category.color,
              color: isSelected
                ? theme.palette.getContrastText(category.color)
                : category.color,
              border: isSelected ? "2px solid white" : "none",
              "&:hover": {
                backgroundColor: category.color,
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
};

export default CategoryFilter;
