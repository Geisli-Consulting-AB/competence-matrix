import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  useTheme,
  IconButton,
  TextField,
  Autocomplete,
  Stack
} from '@mui/material'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import ClearIcon from '@mui/icons-material/Clear'
import { getAllUsersCompetences, auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import type { CompetenceRow } from '../firebase'

type UserData = {
  userId: string
  ownerName: string
  competences: CompetenceRow[]
}

type CompetenceMatrix = {
  [competenceName: string]: {
    [userId: string]: number // skill level
  }
}

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

export default function CompetenceOverview() {
  const theme = useTheme()
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [allCompetences, setAllCompetences] = useState<string[]>([])
  const [competenceMatrix, setCompetenceMatrix] = useState<CompetenceMatrix>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTransposed, setIsTransposed] = useState(false) // false = competences on left, true = users on left
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedCompetences, setSelectedCompetences] = useState<string[]>([])

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (!currentUser) {
        // Clear data when user logs out
        setUsers([])
        setAllCompetences([])
        setCompetenceMatrix({})
        setLoading(false)
        setError(null)
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await getAllUsersCompetences()
        setUsers(data.users)
        setAllCompetences(data.allCompetences)
        
        // Build competence matrix
        const matrix: CompetenceMatrix = {}
        
        data.allCompetences.forEach(competenceName => {
          matrix[competenceName] = {}
          data.users.forEach(userData => {
            const userCompetence = userData.competences.find(c => c.name === competenceName)
            if (userCompetence) {
              matrix[competenceName][userData.userId] = userCompetence.level
            }
          })
        })
        
        setCompetenceMatrix(matrix)
      } catch (err) {
        console.error('Error fetching overview data:', err)
        setError('Failed to load competence overview')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Filter data based on selected filters
  const filteredUsers = selectedUsers.length > 0 
    ? users.filter(user => selectedUsers.includes(user.ownerName))
    : users
    
  const filteredCompetences = selectedCompetences.length > 0
    ? allCompetences.filter(comp => selectedCompetences.includes(comp))
    : allCompetences

  const getCompetenceStats = (competenceName: string) => {
    // Only count stats from filtered users
    const relevantUserIds = filteredUsers.map(u => u.userId)
    const levels = Object.entries(competenceMatrix[competenceName] || {})
      .filter(([userId]) => relevantUserIds.includes(userId))
      .map(([, level]) => level)
    
    const total = levels.length
    if (total === 0) return { total: 0, average: 0, distribution: {} }
    
    const sum = levels.reduce((acc, level) => acc + level, 0)
    const average = sum / total
    
    const distribution = levels.reduce((acc, level) => {
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as { [level: number]: number })
    
    return { total, average, distribution }
  }

  const clearFilters = () => {
    setSelectedUsers([])
    setSelectedCompetences([])
  }


  if (!user) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
        <Typography variant="h6" gutterBottom color="text.secondary">
          Please log in to view the team competence overview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You need to be authenticated to access team data.
        </Typography>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading competence overview...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      <Box>
        <Typography variant="h5" gutterBottom>
          Team Competence Overview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {filteredUsers.length} team members • {filteredCompetences.length} competences
          {(selectedUsers.length > 0 || selectedCompetences.length > 0) && (
            <span> (filtered from {users.length} • {allCompetences.length})</span>
          )}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <Tooltip title={isTransposed ? "Show competences on left" : "Show users on left"}>
          <IconButton 
            onClick={() => setIsTransposed(!isTransposed)}
            sx={{ 
              backgroundColor: theme.palette.grey[800],
              color: theme.palette.common.white,
              '&:hover': {
                backgroundColor: theme.palette.grey[700]
              }
            }}
          >
            <SwapHorizIcon />
          </IconButton>
        </Tooltip>
        {(selectedUsers.length > 0 || selectedCompetences.length > 0) && (
          <Tooltip title="Clear all filters">
            <IconButton 
              onClick={clearFilters}
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

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Autocomplete
            multiple
            options={users.map(user => user.ownerName)}
            value={selectedUsers}
            onChange={(_, newValue) => setSelectedUsers(newValue)}
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
            onChange={(_, newValue) => setSelectedCompetences(newValue)}
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
        </Stack>
      </Box>

      {/* Legend */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {Object.entries(LEVEL_LABELS).map(([level, label]) => (
          <Chip
            key={level}
            label={`${level}. ${label}`}
            size="small"
            sx={{
              backgroundColor: LEVEL_COLORS[parseInt(level) as keyof typeof LEVEL_COLORS],
              color: parseInt(level) === 1 ? 'black' : 'white'
            }}
          />
        ))}
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: '70vh', overflow: 'auto' }}>
        <Table stickyHeader size="small">
          {!isTransposed ? (
            // Original layout: Competences on left, Users on top
            <>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      minWidth: 120, 
                      maxWidth: 150,
                      fontWeight: 'bold',
                      backgroundColor: theme.palette.grey[800],
                      color: theme.palette.common.white,
                      position: 'sticky',
                      left: 0,
                      zIndex: 2,
                      fontSize: '0.875rem'
                    }}
                  >
                    Competence
                  </TableCell>
                  <TableCell 
                    align="center" 
                    sx={{ 
                      minWidth: 50,
                      maxWidth: 60,
                      fontWeight: 'bold',
                      backgroundColor: theme.palette.grey[800],
                      color: theme.palette.common.white,
                      fontSize: '0.875rem'
                    }}
                  >
                    Stats
                  </TableCell>
                  {filteredUsers.map(user => (
                    <TableCell 
                      key={user.userId} 
                      align="center" 
                      sx={{ 
                        minWidth: 60,
                        maxWidth: 80,
                        fontWeight: 'bold',
                        backgroundColor: theme.palette.grey[800],
                        color: theme.palette.common.white,
                        writingMode: 'vertical-lr',
                        textOrientation: 'mixed',
                        fontSize: '0.75rem',
                        padding: '8px 4px'
                      }}
                    >
                      {user.ownerName}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCompetences.map(competenceName => {
                  const stats = getCompetenceStats(competenceName)
                  return (
                    <TableRow key={competenceName} hover>
                      <TableCell 
                        component="th" 
                        scope="row"
                        sx={{ 
                          fontWeight: 'medium',
                          backgroundColor: theme.palette.grey[900],
                          color: theme.palette.common.white,
                          position: 'sticky',
                          left: 0,
                          zIndex: 1,
                          borderRight: `1px solid ${theme.palette.divider}`,
                          fontSize: '0.875rem',
                          padding: '8px 12px',
                          maxWidth: 150,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {competenceName}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={
                          <Box>
                            <Typography variant="caption" display="block">
                              {stats.total} team members
                            </Typography>
                            <Typography variant="caption" display="block">
                              Avg: {stats.average.toFixed(1)}
                            </Typography>
                            {Object.entries(stats.distribution).map(([level, count]) => (
                              <Typography key={level} variant="caption" display="block">
                                Level {level}: {count}
                              </Typography>
                            ))}
                          </Box>
                        }>
                          <Chip
                            label={`${stats.total}`}
                            size="small"
                            variant="outlined"
                            sx={{ minWidth: 40 }}
                          />
                        </Tooltip>
                      </TableCell>
                      {filteredUsers.map(user => {
                        const level = competenceMatrix[competenceName]?.[user.userId]
                        return (
                          <TableCell key={user.userId} align="center">
                            {level ? (
                              <Tooltip title={`${LEVEL_LABELS[level as keyof typeof LEVEL_LABELS]}`}>
                                <Box
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    backgroundColor: LEVEL_COLORS[level as keyof typeof LEVEL_COLORS],
                                    color: level === 1 ? 'black' : 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    margin: '0 auto',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {level}
                                </Box>
                              </Tooltip>
                            ) : (
                              <Box sx={{ width: 24, height: 24, margin: '0 auto' }} />
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
              </TableBody>
            </>
          ) : (
            // Transposed layout: Users on left, Competences on top
            <>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      minWidth: 120, 
                      maxWidth: 150,
                      fontWeight: 'bold',
                      backgroundColor: theme.palette.grey[800],
                      color: theme.palette.common.white,
                      position: 'sticky',
                      left: 0,
                      zIndex: 2,
                      fontSize: '0.875rem'
                    }}
                  >
                    User
                  </TableCell>
                  <TableCell 
                    align="center" 
                    sx={{ 
                      minWidth: 50,
                      maxWidth: 60,
                      fontWeight: 'bold',
                      backgroundColor: theme.palette.grey[800],
                      color: theme.palette.common.white,
                      fontSize: '0.875rem'
                    }}
                  >
                    Stats
                  </TableCell>
                  {filteredCompetences.map(competenceName => (
                    <TableCell 
                      key={competenceName} 
                      align="center" 
                      sx={{ 
                        minWidth: 60,
                        maxWidth: 80,
                        fontWeight: 'bold',
                        backgroundColor: theme.palette.grey[800],
                        color: theme.palette.common.white,
                        writingMode: 'vertical-lr',
                        textOrientation: 'mixed',
                        fontSize: '0.75rem',
                        padding: '8px 4px'
                      }}
                    >
                      {competenceName}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(user => {
                  const userCompetenceCount = user.competences.length
                  const userAvgLevel = userCompetenceCount > 0 
                    ? user.competences.reduce((sum, comp) => sum + comp.level, 0) / userCompetenceCount 
                    : 0
                  
                  return (
                    <TableRow key={user.userId} hover>
                      <TableCell 
                        component="th" 
                        scope="row"
                        sx={{ 
                          fontWeight: 'medium',
                          backgroundColor: theme.palette.grey[900],
                          color: theme.palette.common.white,
                          position: 'sticky',
                          left: 0,
                          zIndex: 1,
                          borderRight: `1px solid ${theme.palette.divider}`,
                          fontSize: '0.875rem',
                          padding: '8px 12px',
                          maxWidth: 150,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {user.ownerName}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={
                          <Box>
                            <Typography variant="caption" display="block">
                              {userCompetenceCount} competences
                            </Typography>
                            <Typography variant="caption" display="block">
                              Avg: {userAvgLevel.toFixed(1)}
                            </Typography>
                          </Box>
                        }>
                          <Chip
                            label={`${userCompetenceCount}`}
                            size="small"
                            variant="outlined"
                            sx={{ minWidth: 40 }}
                          />
                        </Tooltip>
                      </TableCell>
                      {allCompetences.map(competenceName => {
                        const level = competenceMatrix[competenceName]?.[user.userId]
                        return (
                          <TableCell key={competenceName} align="center">
                            {level ? (
                              <Tooltip title={`${LEVEL_LABELS[level as keyof typeof LEVEL_LABELS]}`}>
                                <Box
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    backgroundColor: LEVEL_COLORS[level as keyof typeof LEVEL_COLORS],
                                    color: level === 1 ? 'black' : 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    margin: '0 auto',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {level}
                                </Box>
                              </Tooltip>
                            ) : (
                              <Box sx={{ width: 24, height: 24, margin: '0 auto' }} />
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
              </TableBody>
            </>
          )}
        </Table>
      </TableContainer>
    </Box>
  )
}
