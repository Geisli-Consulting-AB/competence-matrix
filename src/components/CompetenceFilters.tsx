import { 
  Box, 
  Autocomplete, 
  TextField, 
  Chip, 
  Tooltip, 
  IconButton, 
  useTheme,
  useMediaQuery 
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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const hasActiveFilters = selectedUsers.length > 0 || selectedCompetences.length > 0 || selectedLevels.length > 0

  return (
    <Box sx={{ mb: 3, mt: '5px' }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        width: '100%'
      }}>
        <Autocomplete
          multiple
          options={users.map(user => user.ownerName)}
          value={selectedUsers}
          onChange={(_, newValue) => onUsersChange(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={isMobile ? "Team" : "Filter Team Members"}
              placeholder="Select team members..."
              size="small"
              sx={{ width: isMobile ? 150 : 250 }}
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
              label={isMobile ? "Competences" : "Filter Competences"}
              placeholder="Select competences..."
              size="small"
              sx={{ width: isMobile ? 150 : 250 }}
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
        {/* Control buttons */}
        <Box sx={{ display: 'flex', gap: 0.5, marginLeft: 'auto' }}>
          <Tooltip title={isTransposed ? "Switch to show competences on left and users on top" : "Switch to show users on left and competences on top"}>
            <IconButton 
              onClick={onTransposeToggle}
              size="small"
              sx={{ 
                backgroundColor: theme.palette.grey[800],
                color: theme.palette.common.white,
                '&:hover': {
                  backgroundColor: theme.palette.grey[700]
                },
                minWidth: 'auto',
                width: isMobile ? 32 : 'auto',
                height: isMobile ? 32 : 'auto'
              }}
            >
              <SwapHorizIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {hasActiveFilters && (
            <Tooltip title="Clear all filters">
              <IconButton 
                onClick={onClearFilters}
                size="small"
                sx={{ 
                  backgroundColor: theme.palette.grey[800],
                  color: theme.palette.common.white,
                  '&:hover': {
                    backgroundColor: theme.palette.grey[700]
                  },
                  minWidth: 'auto',
                  width: isMobile ? 32 : 'auto',
                  height: isMobile ? 32 : 'auto'
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  )
}
