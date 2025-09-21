import { useState, useEffect } from 'react'
import './App.css'
import { auth, googleProvider, subscribeToUserCompetences, saveUserCompetences, getAllUsersCompetences } from './firebase'
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, getRedirectResult } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { Button, Container, Stack, Typography, Box, Paper, Tabs, Tab } from '@mui/material'
import CompetenceTable from './components/CompetenceTable'
import CompetenceOverview from './components/CompetenceOverview'

type CompetenceRow = { id: string; name: string; level: number }

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [competences, setCompetences] = useState<CompetenceRow[]>([])
  const [currentTab, setCurrentTab] = useState(0)
  const [existingCompetences, setExistingCompetences] = useState<string[]>([])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    
    // Handle redirect result on app initialization
    getRedirectResult(auth).then((result) => {
      if (result) {
        console.log('Redirect login successful:', result.user)
      }
    }).catch((error) => {
      console.error('Redirect result error:', error)
    })
    
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!user) {
      setCompetences([])
      setExistingCompetences([])
      return
    }
    const unsub = subscribeToUserCompetences(user.uid, (rows) => setCompetences(rows))
    return () => unsub()
  }, [user])

  // Fetch existing competences for autocomplete suggestions
  useEffect(() => {
    if (!user) return
    
    const fetchExistingCompetences = async () => {
      try {
        const data = await getAllUsersCompetences()
        setExistingCompetences(data.allCompetences)
      } catch (error) {
        console.error('Failed to fetch existing competences:', error)
      }
    }
    
    fetchExistingCompetences()
  }, [user])

  const persistAll = async (rows: CompetenceRow[]) => {
    if (!user) return
    const ownerName = user.displayName || user.email || 'unknown'
    await saveUserCompetences(user.uid, ownerName, rows)
  }

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error('Popup login failed, trying redirect...', err)
      try {
        // Fallback to redirect if popup fails
        await signInWithRedirect(auth, googleProvider)
      } catch (redirectErr) {
        console.error('Login failed', redirectErr)
        alert('Login failed. Check console for details.')
      }
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Logout failed', err)
      alert('Logout failed. Check console for details.')
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {!user ? (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
              Competence Matrix
            </Typography>
            <Button variant="contained" color="primary" onClick={handleLogin}>
              Login with Google
            </Button>
          </Box>
        ) : (
          <Paper elevation={1} sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={currentTab} 
                onChange={(_, newValue) => setCurrentTab(newValue)}
              >
                <Tab label="Team Overview" />
                <Tab label="My Competences" />
              </Tabs>
              <Button variant="outlined" color="primary" onClick={handleLogout} sx={{ mr: 2 }}>
                Logout
              </Button>
            </Box>
            
            <Box sx={{ p: 2 }}>
              {currentTab === 0 && (
                <CompetenceOverview />
              )}
              {currentTab === 1 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    My Competences
                  </Typography>
                  <CompetenceTable
                    competences={competences}
                    onChange={setCompetences}
                    onSave={persistAll}
                    existingCompetences={existingCompetences}
                  />
                </>
              )}
            </Box>
          </Paper>
        )}
      </Stack>
    </Container>
  )
}

export default App
