import React, { useState, useEffect } from 'react';
import { Button, TextField, Box, Typography, List, ListItem, ListItemText, Paper, Alert, CircularProgress } from '@mui/material';
import { setAdminStatus, getCurrentUserRole, findUserByEmail } from '../../utils/admin';
import type { UserRole } from '../../utils/admin';

export const AdminPanel: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load current user's role on mount
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const role = await getCurrentUserRole();
        setCurrentUserRole(role);
        if (!role?.isAdmin) {
          setError('You do not have admin privileges');
        }
      } catch {
        setError('Failed to load user role');
      }
    };

    loadUserRole();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Look up the user by email to resolve their UID
      const userRecord = await findUserByEmail(email);
      if (!userRecord) {
        setError(`No user found with email ${email}`);
        return;
      }

      await setAdminStatus(userRecord.userId, isAdmin, userRecord.email, userRecord.displayName || email);
      setSuccess(`Successfully ${isAdmin ? 'granted' : 'revoked'} admin access for ${userRecord.email}`);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update admin status');
    } finally {
      setLoading(false);
    }
  };

  if (currentUserRole === null) {
    return <CircularProgress />;
  }

  if (!currentUserRole.isAdmin) {
    return (
      <Box p={3}>
        <Alert severity="error">
          You do not have permission to access the admin panel.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3} maxWidth="600px" margin="0 auto">
      <Typography variant="h4" gutterBottom>Admin Panel</Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Manage Admin Access</Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="User Email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            type="email"
            disabled={loading}
          />
          
          <Box display="flex" alignItems="center" my={2}>
            <input
              type="checkbox"
              id="isAdmin"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              style={{ marginRight: '8px' }}
              disabled={loading}
            />
            <label htmlFor="isAdmin">Grant admin privileges</label>
          </Box>
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !email}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Updating...' : 'Update Admin Status'}
          </Button>
        </Box>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Current Admin</Typography>
        <List>
          <ListItem>
            <ListItemText
              primary={currentUserRole.email}
              secondary={`You (${currentUserRole.isAdmin ? 'Admin' : 'User'})`}
            />
          </ListItem>
          {/* In a real app, you would list all admin users here */}
        </List>
      </Paper>
    </Box>
  );
};

export default AdminPanel;
