import { useState, useEffect } from 'react'
import './App.css'
import { auth, googleProvider } from './firebase'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { Button, Container, Stack, Typography, Box, TextField, Radio, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material'

function App() {
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          {user ? (
            <Stack spacing={1} direction="row" alignItems="center" justifyContent="space-between">
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

        <Paper elevation={1} sx={{ p: 2, width: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Competences
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Competence</TableCell>
                  <TableCell align="center">No knowledge</TableCell>
                  <TableCell align="center">Beginner</TableCell>
                  <TableCell align="center">Proficient</TableCell>
                  <TableCell align="center">Expert</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Input row for adding a new competence */}
                <TableRow hover>
                  <TableCell component="th" scope="row">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        label="Competence name"
                        size="small"
                        value={compName}
                        onChange={(e) => setCompName(e.target.value)}
                        fullWidth
                      />
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
                  </TableCell>
                  {[1,2,3,4].map((lvl) => (
                    <TableCell key={lvl} align="center">
                      <Radio
                        checked={compLevel === lvl}
                        onChange={() => setCompLevel(lvl)}
                        value={String(lvl)}
                        inputProps={{ 'aria-label': String(lvl) }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
                {competences.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">No competences yet</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  competences.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell component="th" scope="row">{c.name}</TableCell>
                      {[1,2,3,4].map((lvl) => (
                        <TableCell key={lvl} align="center">
                          {c.level === lvl ? <Chip size="small" color="primary" label="Selected" /> : null}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Stack>
    </Container>
  )
}

export default App
