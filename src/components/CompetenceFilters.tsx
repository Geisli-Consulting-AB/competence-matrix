import { 
  Box, 
  Stack, 
  Autocomplete, 
  TextField, 
  Chip, 
  Button, 
  Tooltip, 
  IconButton, 
  useTheme 
} from '@mui/material'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import ClearIcon from '@mui/icons-material/Clear'

interface CompetenceFiltersProps {
  // Filter data
  users: Array<{ userId: string; ownerName: string }>
  allCompetences: string[]
  
  // Filter state
  selectedUsers: string[]
  selectedCompetences: string[]
  selectedLevels: number[]
  isTransposed: boolean
  
  // Filter handlers
  onUsersChange: (users: string[]) => void
  onCompetencesChange: (competences: string[]) => void
  onTransposeToggle: () => void
  onClearFilters: () => void
}

export default function CompetenceFilters({
  users,
  allCompetences,
  selectedUsers,
  selectedCompetences,
  selectedLevels,
  isTransposed,
  onUsersChange,
  onCompetencesChange,
  onTransposeToggle,
  onClearFilters
}: CompetenceFiltersProps) {
  const theme = useTheme()
  
  const hasActiveFilters = selectedUsers.length > 0 || selectedCompetences.length > 0 || selectedLevels.length > 0

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
        <Autocomplete
          multiple
          options={users.map(user => user.ownerName)}
          value={selectedUsers}
          onChange={(_, newValue) => onUsersChange(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter Team Members"
              placeholder="Select team members..."
              size="small"
              sx={{ minWidth: 250 }}
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={option}
                size="small"
                {...getTagProps({ index })}
                sx={{
                  backgroundColor: theme.palette.grey[700],
                  color: theme.palette.common.white,
                  '& .MuiChip-deleteIcon': {
                    color: theme.palette.common.white
                  }
                }}
              />
            ))
          }
        />
        <Autocomplete
          multiple
          options={allCompetences}
          value={selectedCompetences}
          onChange={(_, newValue) => onCompetencesChange(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter Competences"
              placeholder="Select competences..."
              size="small"
              sx={{ minWidth: 250 }}
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={option}
                size="small"
                {...getTagProps({ index })}
                sx={{
                  backgroundColor: theme.palette.grey[700],
                  color: theme.palette.common.white,
                  '& .MuiChip-deleteIcon': {
                    color: theme.palette.common.white
                  }
                }}
              />
            ))
          }
        />
        {/* Control buttons on the right */}
        <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
          <Tooltip title={isTransposed ? "Switch to show competences on left and users on top" : "Switch to show users on left and competences on top"}>
            <Button 
              onClick={onTransposeToggle}
              startIcon={<SwapHorizIcon />}
              size="small"
              sx={{ 
                backgroundColor: theme.palette.grey[800],
                color: theme.palette.common.white,
                '&:hover': {
                  backgroundColor: theme.palette.grey[700]
                },
                textTransform: 'none'
              }}
            >
              Transpose
            </Button>
          </Tooltip>
          {hasActiveFilters && (
            <Tooltip title="Clear all filters">
              <IconButton 
                onClick={onClearFilters}
                sx={{ 
                  backgroundColor: theme.palette.grey[800],
                  color: theme.palette.common.white,
                  '&:hover': {
                    backgroundColor: theme.palette.grey[700]
                  }
                }}
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>
    </Box>
  )
}
