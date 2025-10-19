import React, { useEffect, useMemo, useState } from 'react';
import { Paper, Typography, List, ListItem, ListItemText, IconButton, Tooltip, Box, CircularProgress } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { User } from 'firebase/auth';
import { subscribeToUserCompetences, saveUserCompetences, type CompetenceRow } from '../../../../firebase';

export interface CompetencesCompactTabProps {
  user: User | null;
}

const CompetencesCompactTab: React.FC<CompetencesCompactTabProps> = ({ user }) => {
  const [rows, setRows] = useState<CompetenceRow[] | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setRows([]);
      return;
    }
    const unsub = subscribeToUserCompetences(user.uid, (r) => setRows(r));
    return () => unsub();
  }, [user]);

  const sorted = useMemo(() => {
    const list = Array.isArray(rows) ? rows.slice() : [];
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [rows]);

  const handleDelete = async (id: string) => {
    if (!user || !Array.isArray(rows)) return;
    setSavingId(id);
    const next = rows.filter((r) => r.id !== id);
    try {
      await saveUserCompetences(user.uid, user.displayName || '', next);
    } finally {
      setSavingId(null);
    }
  };

  if (!rows) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 3, maxWidth: 600, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>Loading competences…</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Competences
      </Typography>

      {sorted.length === 0 ? (
        <Typography color="text.secondary">No competences found. Add competences in the main Competences tab first.</Typography>
      ) : (
        <List dense>
          {sorted.map((row) => (
            <ListItem key={row.id} secondaryAction={
              <Tooltip title="Delete competence">
                <span>
                  <IconButton edge="end" aria-label={`delete ${row.name}`} onClick={() => handleDelete(row.id)} disabled={savingId === row.id}>
                    <DeleteOutlineIcon />
                  </IconButton>
                </span>
              </Tooltip>
            }>
              <ListItemText
                primary={row.name || '(unnamed competence)'}
                secondary={row.level ? `Level ${row.level}` : undefined}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          This list mirrors your saved competences. Deleting here removes the competence from your account.
        </Typography>
      </Box>
    </Paper>
  );
};

export default CompetencesCompactTab;
