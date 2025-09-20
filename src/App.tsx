import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { auth, googleProvider } from './firebase'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { Button, Container, Stack, Typography, Box, TextField, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Paper, List, ListItem, ListItemText, Divider } from '@mui/material'

function App() {
  const [count, setCount] = useState(0)
  const [user, setUser] = useState<User | null>(null)
  const [compName, setCompName] = useState('')
  const [compLevel, setCompLevel] = useState<number>(1)
  const [competences, setCompetences] = useState<Array<{ id: string; name: string; level: number }>>([])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error('Login failed', err)
      alert('Login failed. Check console for details.')
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
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3} alignItems="center">
        <Stack direction="row" spacing={2} alignItems="center">
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </Stack>
        <Typography variant="h4" component="h1">Vite + React</Typography>

        <Box>
          {user ? (
            <Stack spacing={1} alignItems="center">
              <Typography variant="body1">
                Signed in as {user.displayName || user.email}
              </Typography>
              <Button variant="outlined" color="primary" onClick={handleLogout}>
                Logout
              </Button>
            </Stack>
          ) : (
            <Button variant="contained" color="primary" onClick={handleLogin}>
              Login with Google
            </Button>
          )}
        </Box>

        <Stack spacing={2} alignItems="center">
          <Button variant="contained" onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </Button>
          <Typography variant="body2">
            Edit <code>src/App.tsx</code> and save to test HMR
          </Typography>
        </Stack>

        <Typography variant="caption" className="read-the-docs" align="center">
          Click on the Vite and React logos to learn more
        </Typography>

        <Paper elevation={3} sx={{ p: 2, width: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Add Competence
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              label="Competence name"
              value={compName}
              onChange={(e) => setCompName(e.target.value)}
              fullWidth
            />
            <FormControl>
              <FormLabel id="level-label">Level</FormLabel>
              <RadioGroup
                row
                aria-labelledby="level-label"
                name="competence-level"
                value={String(compLevel)}
                onChange={(e) => setCompLevel(Number(e.target.value))}
              >
                {[1, 2, 3, 4].map((lvl) => (
                  <FormControlLabel key={lvl} value={String(lvl)} control={<Radio />} label={String(lvl)} />
                ))}
              </RadioGroup>
            </FormControl>
            <Button
              variant="contained"
              onClick={() => {
                const name = compName.trim()
                const level = Math.min(4, Math.max(1, compLevel))
                if (!name) return
                setCompetences((prev) => [
                  { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, level },
                  ...prev,
                ])
                setCompName('')
                setCompLevel(1)
              }}
            >
              Add
            </Button>
          </Stack>
        </Paper>

        <Paper elevation={1} sx={{ p: 2, width: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Competences
          </Typography>
          {competences.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No competences yet</Typography>
          ) : (
            <List>
              {competences.map((c, idx) => (
                <Box key={c.id}>
                  <ListItem>
                    <ListItemText primary={c.name} secondary={`Level ${c.level}`} />
                  </ListItem>
                  {idx < competences.length - 1 && <Divider component="li" />}
                </Box>
              ))}
            </List>
          )}
        </Paper>
      </Stack>
    </Container>
  )
}

export default App
