import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { auth, googleProvider } from './firebase'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { Button, Container, Stack, Typography, Box } from '@mui/material'

function App() {
  const [count, setCount] = useState(0)
  const [user, setUser] = useState<User | null>(null)

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
      </Stack>
    </Container>
  )
}

export default App
