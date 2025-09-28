import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  DeleteForever as TrashIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { saveUserCategories, subscribeToUserCategories } from "../firebase";
import type { User } from "firebase/auth";

interface Category {
  id: string;
  name: string;
  competences: string[];
  color: string;
}

interface CategoryManagementProps {
  user: User | null;
  competenceMatrix?: { [competenceName: string]: { [userId: string]: number } };
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({
  user,
  competenceMatrix = {},
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCompetenceName, setNewCompetenceName] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  // Subscribe to categories from database
  useEffect(() => {
    if (!user?.uid) {
      console.log("No user authenticated, skipping category subscription");
      return;
    }

    console.log("Subscribing to categories for user:", user.uid);
    const unsubscribe = subscribeToUserCategories(
      user.uid,
      (firebaseCategories) => {
        console.log("Received categories from database:", firebaseCategories);
        setCategories(firebaseCategories);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Save categories to database whenever they change
  const saveCategoriesToDB = async (updatedCategories: Category[]) => {
    if (!user?.uid) {
      console.log("No user authenticated, cannot save categories");
      return;
    }

    console.log("Saving categories to database:", updatedCategories);
    try {
      await saveUserCategories(user.uid, updatedCategories);
      console.log("Categories saved successfully");
    } catch (error) {
      console.error("Failed to save categories:", error);
    }
  };

  // Array of predefined colors for categories
  const categoryColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
    "#82E0AA",
    "#F1948A",
    "#85C1E9",
    "#D2B4DE",
  ];

  const getRandomColor = () => {
    return categoryColors[Math.floor(Math.random() * categoryColors.length)];
  };

  const isCompetenceUsedByUsers = (competenceName: string) => {
    const users = competenceMatrix[competenceName] || {};
    return Object.keys(users).length > 0;
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      competences: [],
      color: getRandomColor(),
    };

    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    setNewCategoryName("");
    await saveCategoriesToDB(updatedCategories);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const updatedCategories = categories.filter((cat) => cat.id !== categoryId);
    setCategories(updatedCategories);
    // Remove from expanded categories if it was expanded
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      newSet.delete(categoryId);
      return newSet;
    });
    await saveCategoriesToDB(updatedCategories);
  };

  const handleToggleExpanded = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleAddNewCompetence = async (categoryId: string) => {
    if (!newCompetenceName.trim()) return;

    const competenceName = newCompetenceName.trim();
    const updatedCategories = categories.map((cat) =>
      cat.id === categoryId
        ? {
            ...cat,
            competences: cat.competences.includes(competenceName)
              ? cat.competences
              : [...cat.competences, competenceName],
          }
        : cat,
    );
    setCategories(updatedCategories);
    setNewCompetenceName("");
    await saveCategoriesToDB(updatedCategories);
  };

  const handleRemoveCompetence = async (
    categoryId: string,
    competenceToRemove: string,
  ) => {
    const updatedCategories = categories.map((cat) =>
      cat.id === categoryId
        ? {
            ...cat,
            competences: cat.competences.filter(
              (comp) => comp !== competenceToRemove,
            ),
          }
        : cat,
    );
    setCategories(updatedCategories);
    await saveCategoriesToDB(updatedCategories);
  };

  return (
    <Box>
      {/* Create New Category Section */}
      <Paper elevation={1} sx={{ p: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <TextField
            label="Add new category"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onBlur={() => {
              if (newCategoryName.trim()) {
                handleCreateCategory();
              }
            }}
            size="small"
            sx={{ maxWidth: "40%", width: "40%" }}
            className="mobile-category-input"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreateCategory();
              }
            }}
          />
        </Box>
      </Paper>

      {/* Existing Categories Section */}
      <Paper elevation={1} sx={{ textAlign: "center" }}>
        {categories.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No categories created yet. Create your first category above.
          </Typography>
        ) : (
          <List
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {categories.map((category, index) => (
              <React.Fragment key={category.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{ position: "relative", textAlign: "center" }}
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          justifyContent: "center",
                        }}
                        className="mobile-category-header"
                      >
                        <Typography
                          variant="h6"
                          sx={{ color: category.color, fontWeight: "bold" }}
                          className="mobile-category-title"
                        >
                          {category.name} ({category.competences.length})
                        </Typography>
                        <Box className="mobile-category-actions">
                          <IconButton
                            size="small"
                            aria-label="expand"
                            onClick={() => handleToggleExpanded(category.id)}
                            sx={{
                              color: category.color,
                              p: 0.5,
                              "&:hover": {
                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                              },
                            }}
                          >
                            {expandedCategories.has(category.id) ? (
                              <ExpandLessIcon fontSize="small" />
                            ) : (
                              <ExpandMoreIcon fontSize="small" />
                            )}
                          </IconButton>
                          <Tooltip
                            title={
                              category.competences.length > 0
                                ? "Remove all competences before deleting this category"
                                : "Delete category"
                            }
                          >
                            <span>
                              <IconButton
                                size="small"
                                aria-label="delete"
                                onClick={() =>
                                  handleDeleteCategory(category.id)
                                }
                                disabled={category.competences.length > 0}
                                sx={{
                                  color:
                                    category.competences.length > 0
                                      ? "grey.500"
                                      : category.color,
                                  p: 0.5,
                                  "&:hover": {
                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                  },
                                  "&.Mui-disabled": {
                                    color: "grey.500",
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>

                {/* Competences management interface */}
                {expandedCategories.has(category.id) && (
                  <Box
                    sx={{ pl: 2, pr: 2, pb: 2, width: "40%", mx: "auto" }}
                    className="mobile-category-expanded"
                  >
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2,
                        backgroundColor: "grey.900",
                        border: "1px solid",
                        borderColor: "grey.700",
                        color: "white",
                      }}
                    >
                      {/* Add new competence input */}
                      <Box sx={{ mb: 2 }}>
                        <TextField
                          label="Add new Competence"
                          value={newCompetenceName}
                          onChange={(e) => setNewCompetenceName(e.target.value)}
                          onBlur={() => {
                            if (newCompetenceName.trim()) {
                              handleAddNewCompetence(category.id);
                            }
                          }}
                          size="small"
                          className="mobile-competence-input"
                          sx={{
                            maxWidth: "100%",
                            width: "100%",
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "grey.800",
                              color: "white",
                              "& fieldset": {
                                borderColor: "grey.600",
                              },
                              "&:hover fieldset": {
                                borderColor: "grey.500",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: category.color,
                              },
                            },
                            "& .MuiInputLabel-root": {
                              color: "grey.400",
                              "&.Mui-focused": {
                                color: category.color,
                              },
                            },
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleAddNewCompetence(category.id);
                            }
                          }}
                        />
                      </Box>

                      {/* Competences as labels with delete buttons */}
                      {category.competences.length > 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1,
                            mt: 1,
                          }}
                          className="mobile-competence-chips"
                        >
                          {category.competences.map((comp) => (
                            <Box
                              key={comp}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid",
                                borderColor: category.color,
                                borderRadius: 1,
                                px: 1,
                                py: 0.5,
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  color: category.color,
                                  fontSize: "0.875rem",
                                }}
                                className="mobile-competence-chip"
                              >
                                {comp}
                              </Typography>
                              <Tooltip
                                title={
                                  isCompetenceUsedByUsers(comp)
                                    ? "Cannot delete: competence is assigned to users"
                                    : "Remove competence from category"
                                }
                              >
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleRemoveCompetence(category.id, comp)
                                    }
                                    disabled={isCompetenceUsedByUsers(comp)}
                                    sx={{
                                      color: isCompetenceUsedByUsers(comp)
                                        ? "grey.500"
                                        : category.color,
                                      ml: 0.5,
                                      p: 0.25,
                                      "&:hover": {
                                        backgroundColor:
                                          "rgba(255, 255, 255, 0.1)",
                                      },
                                      "&.Mui-disabled": {
                                        color: "grey.500",
                                      },
                                    }}
                                  >
                                    <TrashIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Paper>
                  </Box>
                )}

                {index < categories.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default CategoryManagement;
