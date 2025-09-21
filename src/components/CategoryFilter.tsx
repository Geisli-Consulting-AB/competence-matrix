import React from 'react'
import {
  Box,
  Typography,
  Chip,
  useTheme
} from '@mui/material'
import type { Category } from '../firebase'

interface CategoryFilterProps {
  categories: Category[]
  selectedCategories: string[]
  onCategoriesChange: (categoryIds: string[]) => void
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategories,
  onCategoriesChange
}) => {
  const theme = useTheme()

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter(id => id !== categoryId))
    } else {
      onCategoriesChange([...selectedCategories, categoryId])
    }
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <Box sx={{ 
      mb: 3, 
      display: 'flex', 
      gap: 1, 
      flexWrap: 'wrap', 
      alignItems: 'center',
      p: 1,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 1,
      backgroundColor: 'transparent'
    }}>
      <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}>
        Filter by category:
      </Typography>
      {categories.map((category) => {
        const isSelected = selectedCategories.includes(category.id)
        return (
          <Chip
            key={category.id}
            label={category.name}
            size="small"
            clickable
            onClick={() => handleCategoryClick(category.id)}
            sx={{
              backgroundColor: isSelected ? category.color : 'transparent',
              borderColor: category.color,
              color: isSelected 
                ? theme.palette.getContrastText(category.color)
                : category.color,
              border: isSelected ? '2px solid white' : 'none',
              '&:hover': {
                backgroundColor: category.color,
                opacity: 1,
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease'
            }}
          />
        )
      })}
    </Box>
  )
}

export default CategoryFilter
