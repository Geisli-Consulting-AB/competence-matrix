import { Box, Typography, Chip, useTheme } from '@mui/material'

const LEVEL_COLORS = {
  1: '#ffeb3b', // Want to learn - Yellow
  2: '#ff9800', // Beginner - Orange
  3: '#4caf50', // Proficient - Green
  4: '#2196f3'  // Expert - Blue
}

const LEVEL_LABELS = {
  1: 'Want to learn',
  2: 'Beginner',
  3: 'Proficient',
  4: 'Expert'
}

interface LevelLegendProps {
  selectedLevels: number[]
  onLevelsChange: (levels: number[]) => void
  scrollControls?: React.ReactNode
}

export default function LevelLegend({ selectedLevels, onLevelsChange, scrollControls }: LevelLegendProps) {
  const theme = useTheme()

  const handleLevelToggle = (levelNum: number) => {
    if (selectedLevels.includes(levelNum)) {
      onLevelsChange(selectedLevels.filter(l => l !== levelNum))
    } else {
      onLevelsChange([...selectedLevels, levelNum])
    }
  }

  return (
    <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}>
          Filter by level:
        </Typography>
        {Object.entries(LEVEL_LABELS).map(([level, label]) => {
          const levelNum = parseInt(level)
          const isSelected = selectedLevels.includes(levelNum)
          return (
            <Chip
              key={level}
              label={`${level}. ${label}`}
              size="small"
              clickable
              onClick={() => handleLevelToggle(levelNum)}
              sx={{
                backgroundColor: isSelected ? LEVEL_COLORS[levelNum as keyof typeof LEVEL_COLORS] : 'transparent',
                borderColor: LEVEL_COLORS[levelNum as keyof typeof LEVEL_COLORS],
                color: isSelected 
                  ? theme.palette.getContrastText(LEVEL_COLORS[levelNum as keyof typeof LEVEL_COLORS]) 
                  : LEVEL_COLORS[levelNum as keyof typeof LEVEL_COLORS],
                border: isSelected ? '2px solid white' : 'none',
                '&:hover': {
                  backgroundColor: LEVEL_COLORS[levelNum as keyof typeof LEVEL_COLORS],
                  opacity: 1,
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            />
          )
        })}
      </Box>
      
      {scrollControls}
    </Box>
  )
}
