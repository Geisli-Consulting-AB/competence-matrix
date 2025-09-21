import { useState, useEffect, useRef } from 'react'
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
  useTheme
} from '@mui/material'
import LevelLegend from './LevelLegend'
import ScrollControls from './ScrollControls'
import CompetenceFilters from './CompetenceFilters'
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
  const [selectedLevels, setSelectedLevels] = useState<number[]>([])
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const tableContainerRef = useRef<HTMLDivElement>(null)

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

  // Apply level filtering by filtering out competences that don't have any users with selected levels
  const levelFilteredCompetences = selectedLevels.length > 0
    ? filteredCompetences.filter(competenceName => {
        const relevantUserIds = filteredUsers.map(u => u.userId)
        const levels = Object.entries(competenceMatrix[competenceName] || {})
          .filter(([userId]) => relevantUserIds.includes(userId))
          .map(([, level]) => level)
        return levels.some(level => selectedLevels.includes(level))
      })
    : filteredCompetences

  // For transposed view, also filter users based on selected levels
  const levelFilteredUsers = selectedLevels.length > 0
    ? filteredUsers.filter(user => {
        return filteredCompetences.some(competenceName => {
          const level = competenceMatrix[competenceName]?.[user.userId]
          return level && selectedLevels.includes(level)
        })
      })
    : filteredUsers

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
    setSelectedLevels([])
  }

  // Check scroll position and update scroll button states
  const updateScrollButtons = () => {
    if (tableContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  // Scroll functions
  const scrollLeft = () => {
    if (tableContainerRef.current) {
      const scrollAmount = tableContainerRef.current.clientWidth * 0.9
      tableContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
      setTimeout(updateScrollButtons, 100)
    }
  }

  const scrollRight = () => {
    if (tableContainerRef.current) {
      const scrollAmount = tableContainerRef.current.clientWidth * 0.9
      tableContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      setTimeout(updateScrollButtons, 100)
    }
  }

  // Update scroll buttons when data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      updateScrollButtons()
      setTimeout(updateScrollButtons, 500)
    }, 100)
    return () => clearTimeout(timer)
  }, [levelFilteredUsers, levelFilteredCompetences, isTransposed])

  // Also update on window resize
  useEffect(() => {
    const handleResize = () => updateScrollButtons()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])


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
      <CompetenceFilters 
        users={users}
        allCompetences={allCompetences}
        selectedUsers={selectedUsers}
        selectedCompetences={selectedCompetences}
        selectedLevels={selectedLevels}
        isTransposed={isTransposed}
        onUsersChange={setSelectedUsers}
        onCompetencesChange={setSelectedCompetences}
        onTransposeToggle={() => setIsTransposed(!isTransposed)}
        onClearFilters={clearFilters}
      />

      <LevelLegend 
        selectedLevels={selectedLevels}
        onLevelsChange={setSelectedLevels}
        scrollControls={
          <ScrollControls 
            canScrollLeft={canScrollLeft}
            canScrollRight={canScrollRight}
            onScrollLeft={scrollLeft}
            onScrollRight={scrollRight}
          />
        }
      />

      <TableContainer 
        component={Paper} 
        ref={tableContainerRef}
        onScroll={updateScrollButtons}
        sx={{ maxHeight: '70vh', overflow: 'auto' }}
      >
          <Table stickyHeader size="small">
          {!isTransposed ? (
            // Original layout: Competences on left, Users on top
            <>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      minWidth: 80, 
                      maxWidth: 120,
                      fontWeight: 'bold',
                      backgroundColor: theme.palette.grey[800],
                      color: theme.palette.common.white,
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                      fontSize: '0.7rem'
                    }}
                  >
                    Competence
                  </TableCell>
                  <TableCell 
                    align="center" 
                    sx={{ 
                      minWidth: 30,
                      maxWidth: 40,
                      fontWeight: 'bold',
                      backgroundColor: theme.palette.grey[800],
                      color: theme.palette.common.white,
                      fontSize: '0.7rem'
                    }}
                  >
                    Stats
                  </TableCell>
                  {levelFilteredUsers.map(user => (
                    <TableCell 
                      key={user.userId} 
                      align="center" 
                      sx={{ 
                        minWidth: 32,
                        maxWidth: 45,
                        fontWeight: 'bold',
                        backgroundColor: theme.palette.grey[800],
                        color: theme.palette.common.white,
                        writingMode: 'vertical-lr',
                        textOrientation: 'mixed',
                        fontSize: '0.65rem',
                        padding: '4px 1px'
                      }}
                    >
                      {user.ownerName}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {levelFilteredCompetences.map(competenceName => {
                  const stats = getCompetenceStats(competenceName)
                  return (
                    <TableRow key={competenceName} hover>
                      <TableCell 
                        component="th" 
                        scope="row"
                        onClick={() => {
                          if (selectedCompetences.includes(competenceName)) {
                            setSelectedCompetences(selectedCompetences.filter(c => c !== competenceName))
                          } else {
                            setSelectedCompetences([...selectedCompetences, competenceName])
                          }
                        }}
                        sx={{ 
                          fontWeight: 'medium',
                          backgroundColor: selectedCompetences.includes(competenceName) 
                            ? theme.palette.primary.dark 
                            : theme.palette.grey[900],
                          color: theme.palette.common.white,
                          position: 'sticky',
                          left: 0,
                          zIndex: 1,
                          borderRight: `1px solid ${theme.palette.divider}`,
                          fontSize: '0.7rem',
                          padding: '4px 6px',
                          maxWidth: 120,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: selectedCompetences.includes(competenceName)
                              ? theme.palette.primary.main
                              : theme.palette.grey[800]
                          }
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
                      {levelFilteredUsers.map(user => {
                        const level = competenceMatrix[competenceName]?.[user.userId]
                        const shouldShowLevel = selectedLevels.length === 0 || (level && selectedLevels.includes(level))
                        return (
                          <TableCell key={user.userId} align="center">
                            {level && shouldShowLevel ? (
                              <Tooltip title={
                                <Box>
                                  <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                                    {user.ownerName}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    {competenceName}
                                  </Typography>
                                  <Typography variant="caption" display="block" sx={{ color: LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] }}>
                                    {LEVEL_LABELS[level as keyof typeof LEVEL_LABELS]}
                                  </Typography>
                                </Box>
                              }>
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
                      minWidth: 80, 
                      maxWidth: 120,
                      fontWeight: 'bold',
                      backgroundColor: theme.palette.grey[800],
                      color: theme.palette.common.white,
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                      fontSize: '0.7rem'
                    }}
                  >
                    User
                  </TableCell>
                  <TableCell 
                    align="center" 
                    sx={{ 
                      minWidth: 30,
                      maxWidth: 40,
                      fontWeight: 'bold',
                      backgroundColor: theme.palette.grey[800],
                      color: theme.palette.common.white,
                      fontSize: '0.7rem'
                    }}
                  >
                    Stats
                  </TableCell>
                  {levelFilteredCompetences.map(competenceName => (
                    <TableCell 
                      key={competenceName} 
                      align="center" 
                      sx={{ 
                        minWidth: 32,
                        maxWidth: 45,
                        fontWeight: 'bold',
                        backgroundColor: theme.palette.grey[800],
                        color: theme.palette.common.white,
                        writingMode: 'vertical-lr',
                        textOrientation: 'mixed',
                        fontSize: '0.65rem',
                        padding: '4px 1px'
                      }}
                    >
                      {competenceName}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {levelFilteredUsers.map(user => {
                  const userCompetenceCount = user.competences.length
                  const userAvgLevel = userCompetenceCount > 0 
                    ? user.competences.reduce((sum, comp) => sum + comp.level, 0) / userCompetenceCount 
                    : 0
                  
                  return (
                    <TableRow key={user.userId} hover>
                      <TableCell 
                        component="th" 
                        scope="row"
                        onClick={() => {
                          if (selectedUsers.includes(user.ownerName)) {
                            setSelectedUsers(selectedUsers.filter(u => u !== user.ownerName))
                          } else {
                            setSelectedUsers([...selectedUsers, user.ownerName])
                          }
                        }}
                        sx={{ 
                          fontWeight: 'medium',
                          backgroundColor: selectedUsers.includes(user.ownerName) 
                            ? theme.palette.primary.dark 
                            : theme.palette.grey[900],
                          color: theme.palette.common.white,
                          position: 'sticky',
                          left: 0,
                          zIndex: 1,
                          borderRight: `1px solid ${theme.palette.divider}`,
                          fontSize: '0.7rem',
                          padding: '4px 6px',
                          maxWidth: 120,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: selectedUsers.includes(user.ownerName)
                              ? theme.palette.primary.main
                              : theme.palette.grey[800]
                          }
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
                      {levelFilteredCompetences.map(competenceName => {
                        const level = competenceMatrix[competenceName]?.[user.userId]
                        const shouldShowLevel = selectedLevels.length === 0 || (level && selectedLevels.includes(level))
                        return (
                          <TableCell key={competenceName} align="center">
                            {level && shouldShowLevel ? (
                              <Tooltip title={
                                <Box>
                                  <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                                    {user.ownerName}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    {competenceName}
                                  </Typography>
                                  <Typography variant="caption" display="block" sx={{ color: LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] }}>
                                    {LEVEL_LABELS[level as keyof typeof LEVEL_LABELS]}
                                  </Typography>
                                </Box>
                              }>
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
