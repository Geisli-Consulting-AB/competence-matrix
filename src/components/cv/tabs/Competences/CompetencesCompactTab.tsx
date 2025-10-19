import React, { useEffect, useMemo, useState } from 'react';
import { Paper, Typography, Chip, Tooltip, Box, CircularProgress, Divider } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { User } from 'firebase/auth';
import { subscribeToUserCompetences, saveUserCompetences, type CompetenceRow } from '../../../../firebase';

export interface CompetencesCompactTabProps {
  user: User | null;
}

const levelLabels: Record<number, string> = {
  2: 'Beginner',
  3: 'Proficient',
  4: 'Expert',
};

const order: number[] = [4, 3, 2];

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

  // Group competences by level (omit level 1), sort names within groups
  const grouped = useMemo(() => {
    const base = { 2: [] as CompetenceRow[], 3: [] as CompetenceRow[], 4: [] as CompetenceRow[] };
    const list = Array.isArray(rows) ? rows : [];
    list.forEach((r) => {
      const lvl = Number(r.level || 1);
      if (lvl >= 2 && lvl <= 4) {
        base[lvl as 2 | 3 | 4].push(r);
      }
    });
    ([2, 3, 4] as const).forEach((k) => {
      base[k].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    });
    return base;
  }, [rows]);

  const anyToShow = useMemo(() => order.some((lvl) => grouped[lvl as 2 | 3 | 4].length > 0), [grouped]);

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

      {!anyToShow ? (
        <Typography color="text.secondary">No competences found. Add competences in the main Competences tab first.</Typography>
      ) : (
        order.map((lvl, idx) => {
          const items = grouped[lvl as 2 | 3 | 4];
          if (!items || items.length === 0) return null;
          return (
            <Box key={lvl} sx={{ mb: 2 }}>
              {idx > 0 && <Divider sx={{ mb: 2 }} />}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                {levelLabels[lvl]}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {items.map((row) => {
                  const label = `${row.name || '(unnamed competence)'}`; // omit level on chip
                  const isSaving = savingId === row.id;
                  return (
                    <Tooltip key={row.id} title={isSaving ? 'Deleting…' : 'Delete competence'}>
                      <span>
                        <Chip
                          label={label}
                          onDelete={() => handleDelete(row.id)}
                          deleteIcon={<DeleteOutlineIcon />}
                          disabled={isSaving}
                          sx={{ '& .MuiChip-label': { px: 1 } }}
                          aria-label={`competence ${row.name} delete`}
                        />
                      </span>
                    </Tooltip>
                  );
                })}
              </Box>
            </Box>
          );
        })
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
