import { useState, useEffect } from 'react'
import './App.css'
import { auth, googleProvider, db } from './firebase'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { Button, Container, Stack, Typography, Box, TextField, Radio, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import AddIcon from '@mui/icons-material/Add'

type CompetenceRow = { id: string; name: string; level: number }

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [competences, setCompetences] = useState<CompetenceRow[]>([])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!user) {
      setCompetences([])
      return
    }
    const userDocRef = doc(db, 'users', user.uid)
    const unsub = onSnapshot(userDocRef, (snap) => {
      const data = snap.data() as any || {}
      const rows: CompetenceRow[] = Array.isArray(data.competences)
        ? data.competences.map((r: any) => ({
            id: String(r.id || ''),
            name: String(r.name || ''),
            level: Number(r.level || 1),
          }))
        : []
      setCompetences(rows)
    })
    return () => unsub()
  }, [user])

  const persistAll = async (rows: CompetenceRow[]) => {
    if (!user) return
    const ownerName = user.displayName || user.email || 'unknown'
    const cleaned = rows
      .filter((r) => r.name && r.name.trim().length > 0)
      .map((r) => ({ id: r.id, name: r.name.trim(), level: Math.min(4, Math.max(1, r.level)) }))
    const userDocRef = doc(db, 'users', user.uid)
    await setDoc(
      userDocRef,
      { ownerName, competences: cleaned, updatedAt: serverTimestamp() },
      { merge: true },
    )
  }

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
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Competence</TableCell>
                  <TableCell align="center">Want to learn</TableCell>
                  <TableCell align="center">Beginner</TableCell>
                  <TableCell align="center">Proficient</TableCell>
                  <TableCell align="center">Expert</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {competences.map((c, idx) => (
                  <TableRow key={c.id} hover>
                    <TableCell component="th" scope="row" sx={{ minWidth: 300 }}>
                      <TextField
                        placeholder="Competence name"
                        size="small"
                        value={c.name}
                        onChange={async (e) => {
                          const name = e.target.value
                          const nextRows = competences.map((row, i) => (i === idx ? { ...row, name } : row))
                          setCompetences(nextRows)
                          await persistAll(nextRows)
                        }}
                        fullWidth
                      />
                    </TableCell>
                    {[1, 2, 3, 4].map((lvl) => (
                      <TableCell key={lvl} align="center">
                        <Radio
                          name={`level-${c.id}`}
                          checked={c.level === lvl}
                          onChange={async () => {
                            const nextRows = competences.map((row, i) => (i === idx ? { ...row, level: lvl } : row))
                            setCompetences(nextRows)
                            await persistAll(nextRows)
                          }}
                          value={String(lvl)}
                          inputProps={{ 'aria-label': String(lvl) }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <IconButton color="primary" onClick={async () => {
                      const nextRows = [
                        ...competences,
                        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: '', level: 1 },
                      ]
                      setCompetences(nextRows)
                      await persistAll(nextRows)
                    }} aria-label="add competence">
                      <AddIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Stack>
    </Container>
  )
}

export default App
