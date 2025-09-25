import { 
  Box, 
  Autocomplete, 
  TextField, 
  Chip, 
  useTheme,
  useMediaQuery 
} from '@mui/material'

interface CompetenceFiltersProps {
  // Filter data
  users: Array<{ userId: string; ownerName: string }>
  allCompetences: string[]
  
  // Filter state
  selectedUsers: string[]
  selectedCompetences: string[]
  selectedLevels: number[]
  
  // Filter handlers
  onUsersChange: (users: string[]) => void
  onCompetencesChange: (competences: string[]) => void
}

export default function CompetenceFilters({
  users,
  allCompetences,
  selectedUsers,
  selectedCompetences,
  selectedLevels: _selectedLevels,
  onUsersChange,
  onCompetencesChange
}: CompetenceFiltersProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Box sx={{ mb: 3, mt: '5px' }} className="mobile-filter-wrapper-upper">
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        width: '100%'
      }} className="mobile-filter-row">
        <Autocomplete
          multiple
          options={users.map(user => user.ownerName)}
          value={selectedUsers}
          onChange={(_, newValue) => onUsersChange(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={isMobile ? "Team" : "Filter Team Members"}
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
        {/* Control buttons removed as per request */}
      </Box>
    </Box>
  )
}
