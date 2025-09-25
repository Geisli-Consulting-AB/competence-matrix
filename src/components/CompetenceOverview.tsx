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
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import LevelLegend from './LevelLegend'
import ScrollControls from './ScrollControls'
import CompetenceFilters from './CompetenceFilters'
import CategoryFilter from './CategoryFilter'
import { getAllUsersCompetences, auth, subscribeToUserCategories } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import type { CompetenceRow, Category } from '../firebase'

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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [allCompetences, setAllCompetences] = useState<string[]>([])
  const [competenceMatrix, setCompetenceMatrix] = useState<CompetenceMatrix>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTransposed, setIsTransposed] = useState(false) // false = competences on left, true = users on left
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedCompetences, setSelectedCompetences] = useState<string[]>([])
  const [selectedLevels, setSelectedLevels] = useState<number[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
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
        setCategories([])
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

  // Subscribe to categories
  useEffect(() => {
    if (!user?.uid) {
      setCategories([])
      return
    }

    const unsubscribe = subscribeToUserCategories(user.uid, (cats) => {
      setCategories(cats)
    })

    return () => unsubscribe()
  }, [user?.uid])

  // Filter data based on selected filters
  const filteredUsers = selectedUsers.length > 0 
    ? users.filter(user => selectedUsers.includes(user.ownerName))
    : users

  // Apply category filtering first
  const categoryFilteredCompetences = selectedCategories.length > 0
    ? allCompetences.filter(competenceName => {
        return selectedCategories.some(categoryId => {
          const category = categories.find(cat => cat.id === categoryId)
          return category?.competences.includes(competenceName)
        })
      })
    : allCompetences
    
  const filteredCompetences = selectedCompetences.length > 0
    ? categoryFilteredCompetences.filter(comp => selectedCompetences.includes(comp))
    : categoryFilteredCompetences

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


  // Clear button removed from UI; keep individual setters for external triggers if needed.

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
        onUsersChange={setSelectedUsers}
        onCompetencesChange={setSelectedCompetences}
      />

      <Box sx={{ mb: 0, mt: '0px' }} className="mobile-filter-wrapper-lower">
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          width: '100%'
        }} className="mobile-filter-row">
          <LevelLegend 
            selectedLevels={selectedLevels}
            onLevelsChange={setSelectedLevels}
          />
          <CategoryFilter
            categories={categories}
            selectedCategories={selectedCategories}
            onCategoriesChange={setSelectedCategories}
          />
        </Box>
        {!isMobile && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <ScrollControls 
              canScrollLeft={canScrollLeft}
              canScrollRight={canScrollRight}
              onScrollLeft={scrollLeft}
              onScrollRight={scrollRight}
            />
          </Box>
        )}
      </Box>

      {/* Mobile custom layout */}
      {isMobile ? (
        <Box sx={{ 
          backgroundColor: '#121212', 
          borderRadius: 1, 
          overflowX: 'auto',
          overflowY: 'hidden',
          width: '100%',
          maxWidth: '100vw'
        }}>
          <Box sx={{
            width: !isTransposed 
              ? `${80 + (levelFilteredUsers.length * 40)}px`
              : `${80 + (levelFilteredCompetences.length * 40)}px`,
            minWidth: '100%'
          }}>
            {/* Mobile header row */}
            <Box sx={{ 
              display: 'flex', 
              backgroundColor: '#121212',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              minHeight: '120px'
            }}>
              {/* Corner cell */}
              <Box sx={{ 
                width: '80px', 
                minWidth: '80px',
                backgroundColor: '#121212',
                borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px'
              }}>
                <Tooltip title={isTransposed ? "Switch to show competences on left and users on top" : "Switch to show users on left and competences on top"}>
                  <IconButton 
                    onClick={() => setIsTransposed(!isTransposed)}
                    size="small"
                    sx={{ 
                      backgroundColor: theme.palette.grey[800],
                      color: theme.palette.common.white,
                      '&:hover': {
                        backgroundColor: theme.palette.grey[700]
                      },
                      width: 32,
                      height: 32
                    }}
                  >
                    <SwapHorizIcon sx={{ fontSize: '18px' }} />
                  </IconButton>
                </Tooltip>
              </Box>
              
              {/* User headers */}
            {!isTransposed ? (
              levelFilteredUsers.map(user => (
                <Box 
                  key={user.userId}
                  sx={{ 
                    width: '40px', 
                    minWidth: '40px',
                    backgroundColor: '#121212',
                    borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    padding: '8px 4px',
                    writingMode: 'vertical-lr',
                    textOrientation: 'mixed'
                  }}
                >
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: theme.palette.common.white,
                      fontWeight: 'bold',
                      fontSize: '0.7rem',
                      writingMode: 'vertical-lr',
                      textOrientation: 'mixed',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {user.ownerName}
                  </Typography>
                </Box>
              ))
            ) : (
              levelFilteredCompetences.map(competenceName => (
                <Box 
                  key={competenceName}
                  sx={{ 
                    width: '40px', 
                    minWidth: '40px',
                    backgroundColor: '#121212',
                    borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    padding: '8px 4px',
                    writingMode: 'vertical-lr',
                    textOrientation: 'mixed'
                  }}
                >
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: theme.palette.common.white,
                      fontWeight: 'bold',
                      fontSize: '0.7rem',
                      writingMode: 'vertical-lr',
                      textOrientation: 'mixed',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {competenceName}
                  </Typography>
                </Box>
              ))
            )}
            </Box>
            
            {/* Mobile data rows */}
            <Box sx={{ 
              maxHeight: '60vh', 
              overflowY: 'auto'
            }}>
            {!isTransposed ? (
              levelFilteredCompetences.map(competenceName => (
                <Box key={competenceName} sx={{ 
                  display: 'flex',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.04)' }
                }}>
                  {/* Row header */}
                  <Box 
                    onClick={() => {
                      if (selectedCompetences.includes(competenceName)) {
                        setSelectedCompetences(selectedCompetences.filter(c => c !== competenceName))
                      } else {
                        setSelectedCompetences([...selectedCompetences, competenceName])
                      }
                    }}
                    sx={{ 
                      width: '80px',
                      minWidth: '80px',
                      backgroundColor: selectedCompetences.includes(competenceName) 
                        ? theme.palette.primary.dark 
                        : theme.palette.grey[900],
                      borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: selectedCompetences.includes(competenceName)
                          ? theme.palette.primary.main
                          : theme.palette.grey[800]
                      }
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: theme.palette.common.white,
                        fontSize: '0.7rem',
                        fontWeight: 'medium',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {competenceName}
                    </Typography>
                  </Box>
                  
                  {/* Data cells */}
                  {levelFilteredUsers.map(user => {
                    const level = competenceMatrix[competenceName]?.[user.userId]
                    const shouldShowLevel = selectedLevels.length === 0 || (level && selectedLevels.includes(level))
                    return (
                      <Box 
                        key={user.userId}
                        sx={{ 
                          width: '40px',
                          minWidth: '40px',
                          height: '40px',
                          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
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
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                backgroundColor: LEVEL_COLORS[level as keyof typeof LEVEL_COLORS],
                                color: level === 1 ? 'black' : 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              {level}
                            </Box>
                          </Tooltip>
                        ) : (
                          <Box sx={{ width: 20, height: 20 }} />
                        )}
                      </Box>
                    )
                  })}
                </Box>
              ))
            ) : (
              levelFilteredUsers.map(user => (
                <Box key={user.userId} sx={{ 
                  display: 'flex',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.04)' }
                }}>
                  {/* Row header */}
                  <Box 
                    onClick={() => {
                      if (selectedUsers.includes(user.ownerName)) {
                        setSelectedUsers(selectedUsers.filter(u => u !== user.ownerName))
                      } else {
                        setSelectedUsers([...selectedUsers, user.ownerName])
                      }
                    }}
                    sx={{ 
                      width: '80px',
                      minWidth: '80px',
                      backgroundColor: selectedUsers.includes(user.ownerName) 
                        ? theme.palette.primary.dark 
                        : theme.palette.grey[900],
                      borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: selectedUsers.includes(user.ownerName)
                          ? theme.palette.primary.main
                          : theme.palette.grey[800]
                      }
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: theme.palette.common.white,
                        fontSize: '0.7rem',
                        fontWeight: 'medium',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {user.ownerName}
                    </Typography>
                  </Box>
                  
                  {/* Data cells */}
                  {levelFilteredCompetences.map(competenceName => {
                    const level = competenceMatrix[competenceName]?.[user.userId]
                    const shouldShowLevel = selectedLevels.length === 0 || (level && selectedLevels.includes(level))
                    return (
                      <Box 
                        key={competenceName}
                        sx={{ 
                          width: '40px',
                          minWidth: '40px',
                          height: '40px',
                          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
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
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                backgroundColor: LEVEL_COLORS[level as keyof typeof LEVEL_COLORS],
                                color: level === 1 ? 'black' : 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              {level}
                            </Box>
                          </Tooltip>
                        ) : (
                          <Box sx={{ width: 20, height: 20 }} />
                        )}
                      </Box>
                    )
                  })}
                </Box>
              ))
            )}
            </Box>
          </Box>
        </Box>
      ) : (
        <TableContainer 
          component={Paper} 
          ref={tableContainerRef}
          onScroll={updateScrollButtons}
          sx={{ maxHeight: '70vh', overflow: 'auto', backgroundColor: '#121212' }}
        >
          <Table size="small">
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
                      backgroundColor: '#121212',
                      color: theme.palette.common.white,
                      position: 'sticky',
                      left: 0,
                      top: 0,
                      zIndex: 10,
                      fontSize: '0.7rem',
                      verticalAlign: 'middle',
                      paddingLeft: '5px'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Tooltip title={isTransposed ? "Switch to show competences on left and users on top" : "Switch to show users on left and competences on top"}>
                        <IconButton 
                          onClick={() => setIsTransposed(!isTransposed)}
                          size="small"
                          sx={{ 
                            backgroundColor: theme.palette.grey[800],
                            color: theme.palette.common.white,
                            '&:hover': {
                              backgroundColor: theme.palette.grey[700]
                            },
                            minWidth: 'auto',
                            width: isMobile ? 32 : 28,
                            height: isMobile ? 32 : 28
                          }}
                        >
                          <SwapHorizIcon sx={{ fontSize: isMobile ? '18px' : '16px' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  {levelFilteredUsers.map(user => (
                    <TableCell 
                      key={user.userId} 
                      align="left"
                      className="vertical-header-cell"
                      sx={{ 
                        minWidth: 40,
                        maxWidth: 40,
                        width: 40,
                        fontWeight: 'bold',
                        backgroundColor: '#121212',
                        color: theme.palette.common.white,
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        writingMode: 'vertical-lr',
                        WebkitWritingMode: 'vertical-lr',
                        textOrientation: 'mixed',
                        WebkitTextOrientation: 'mixed',
                        fontSize: '0.7rem',
                        padding: '2px 1px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        '& > *': {
                          verticalAlign: 'middle'
                        },
                        // iOS specific fixes - let CSS handle the vertical text
                        '@media (max-width: 768px)': {
                          writingMode: 'vertical-lr !important',
                          WebkitWritingMode: 'vertical-lr !important',
                          textOrientation: 'mixed !important',
                          WebkitTextOrientation: 'mixed !important'
                        }
                      }}
                    >
                      {user.ownerName}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {levelFilteredCompetences.map(competenceName => {
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
                          maxWidth: 100,
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
                      {levelFilteredUsers.map(user => {
                        const level = competenceMatrix[competenceName]?.[user.userId]
                        const shouldShowLevel = selectedLevels.length === 0 || (level && selectedLevels.includes(level))
                        return (
                          <TableCell key={user.userId} align="center" sx={{ padding: '2px 1px' }}>
                            {level && shouldShowLevel ? (
                              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    backgroundColor: LEVEL_COLORS[level as keyof typeof LEVEL_COLORS],
                                    color: level === 1 ? 'black' : 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {level}
                                </Box>
                              </Tooltip>
                              </Box>
                            ) : (
                              <Box sx={{ width: 20, height: 20, margin: '0 auto' }} />
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
                      backgroundColor: '#121212',
                      color: theme.palette.common.white,
                      position: 'sticky',
                      left: 0,
                      top: 0,
                      zIndex: 10,
                      fontSize: '0.7rem',
                      verticalAlign: 'middle',
                      paddingLeft: '5px'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Tooltip title={isTransposed ? "Switch to show competences on left and users on top" : "Switch to show users on left and competences on top"}>
                        <IconButton 
                          onClick={() => setIsTransposed(!isTransposed)}
                          size="small"
                          sx={{ 
                            backgroundColor: theme.palette.grey[800],
                            color: theme.palette.common.white,
                            '&:hover': {
                              backgroundColor: theme.palette.grey[700]
                            },
                            minWidth: 'auto',
                            width: isMobile ? 32 : 28,
                            height: isMobile ? 32 : 28
                          }}
                        >
                          <SwapHorizIcon sx={{ fontSize: isMobile ? '18px' : '16px' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  {levelFilteredCompetences.map(competenceName => (
                    <TableCell 
                      key={competenceName} 
                      align="left"
                      className="vertical-header-cell"
                      sx={{ 
                        minWidth: 40,
                        maxWidth: 40,
                        width: 40,
                        fontWeight: 'bold',
                        backgroundColor: '#121212',
                        color: theme.palette.common.white,
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        writingMode: 'vertical-lr',
                        WebkitWritingMode: 'vertical-lr',
                        textOrientation: 'mixed',
                        WebkitTextOrientation: 'mixed',
                        fontSize: '0.7rem',
                        padding: '2px 1px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        '& > *': {
                          verticalAlign: 'middle'
                        },
                        // iOS specific fixes - let CSS handle the vertical text
                        '@media (max-width: 768px)': {
                          writingMode: 'vertical-lr !important',
                          WebkitWritingMode: 'vertical-lr !important',
                          textOrientation: 'mixed !important',
                          WebkitTextOrientation: 'mixed !important'
                        }
                      }}
                    >
                      {competenceName}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {levelFilteredUsers.map(user => {
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
                          maxWidth: 100,
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
                      {levelFilteredCompetences.map(competenceName => {
                        const level = competenceMatrix[competenceName]?.[user.userId]
                        const shouldShowLevel = selectedLevels.length === 0 || (level && selectedLevels.includes(level))
                        return (
                          <TableCell key={competenceName} align="center" sx={{ padding: '2px 1px' }}>
                            {level && shouldShowLevel ? (
                              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    backgroundColor: LEVEL_COLORS[level as keyof typeof LEVEL_COLORS],
                                    color: level === 1 ? 'black' : 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {level}
                                </Box>
                              </Tooltip>
                              </Box>
                            ) : (
                              <Box sx={{ width: 20, height: 20, margin: '0 auto' }} />
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
      )}
    </Box>
  )
}
