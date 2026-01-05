import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  TextField,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  setAdminStatus,
  getCurrentUserRole,
  findUserByEmail,
} from "../../utils/admin";
import type { UserRole } from "../../utils/admin";
import { getAllAdmins, type AdminUser } from "../../firebase";
import { getAuth } from "firebase/auth";

export const AdminPanel: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [allAdmins, setAllAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load current user's role and all admins on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const role = await getCurrentUserRole();
        setCurrentUserRole(role);
        if (!role?.isAdmin) {
          setError("You do not have admin privileges");
          return;
        }

        // Fetch all admins
        setLoadingAdmins(true);
        const admins = await getAllAdmins();
        setAllAdmins(admins);
      } catch {
        setError("Failed to load user role");
      } finally {
        setLoadingAdmins(false);
      }
    };

    loadData();
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

      await setAdminStatus(
        userRecord.userId,
        isAdmin,
        userRecord.email,
        userRecord.displayName || email
      );
      setSuccess(
        `Successfully ${isAdmin ? "granted" : "revoked"} admin access for ${
          userRecord.email
        }`
      );
      setEmail("");

      // Refresh admin list after update
      const admins = await getAllAdmins();
      setAllAdmins(admins);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update admin status"
      );
    } finally {
      setLoading(false);
    }
  };

  // Get current user ID for highlighting
  const currentUserId = useMemo(() => getAuth().currentUser?.uid || null, []);

  // Memoized admin list with current user highlighted
  const adminListItems = useMemo(() => {
    if (allAdmins.length === 0 && !loadingAdmins) {
      return (
        <ListItem>
          <ListItemText
            primary="No admins found"
            secondary="Add an admin using the form above"
          />
        </ListItem>
      );
    }

    return allAdmins.map((admin) => {
      const isCurrentUser = admin.userId === currentUserId;
      return (
        <ListItem
          key={admin.userId}
          sx={{
            bgcolor: isCurrentUser ? "action.selected" : "transparent",
            borderRadius: 1,
            mb: 0.5,
          }}
        >
          <ListItemText
            primary={admin.email}
            secondary={
              isCurrentUser ? "You (Admin)" : admin.displayName || "Admin"
            }
          />
        </ListItem>
      );
    });
  }, [allAdmins, currentUserId, loadingAdmins]);

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
      <Typography variant="h4" gutterBottom>
        Admin Panel
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Manage Admin Access
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

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
              style={{ marginRight: "8px" }}
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
            {loading ? "Updating..." : "Update Admin Status"}
          </Button>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          All Admins ({allAdmins.length})
        </Typography>
        {loadingAdmins ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List>{adminListItems}</List>
        )}
      </Paper>
    </Box>
  );
};

export default AdminPanel;
