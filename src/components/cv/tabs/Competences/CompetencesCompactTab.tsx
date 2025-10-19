import React, { useEffect, useMemo, useState } from 'react';
import { Paper, Typography, Chip, Tooltip, Box, CircularProgress, Divider } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { User } from 'firebase/auth';
import { subscribeToUserCompetences, type CompetenceRow } from '../../../../firebase';

export interface CompetencesCompactTabProps {
  user: User | null;
  // Names of competences included in the current CV. If undefined, all user competences are implicitly included until modified.
  includedCompetences?: string[];
  onChangeIncluded?: (list: string[]) => void;
}

const levelLabels: Record<number, string> = {
  2: 'Beginner',
  3: 'Proficient',
  4: 'Expert',
};

const order: number[] = [4, 3, 2];

const CompetencesCompactTab: React.FC<CompetencesCompactTabProps> = ({ user, includedCompetences, onChangeIncluded }) => {
  const [rows, setRows] = useState<CompetenceRow[] | null>(null);

  useEffect(() => {
    if (!user) {
      setRows([]);
      return;
    }
    const unsub = subscribeToUserCompetences(user.uid, (r) => setRows(r));
    return () => unsub();
  }, [user]);

  // Helper: set of included names. If undefined, treat all user competences (levels 2-4) as included.
  const includedSet = useMemo(() => {
    if (Array.isArray(includedCompetences)) {
      return new Set((includedCompetences || []).map((n) => (n || '').trim()).filter(Boolean));
    }
    return null; // null means "include all"
  }, [includedCompetences]);

  // Group competences by level (omit level 1), sort names within groups, and filter by inclusion
  const grouped = useMemo(() => {
    const base = { 2: [] as CompetenceRow[], 3: [] as CompetenceRow[], 4: [] as CompetenceRow[] };
    const list = Array.isArray(rows) ? rows : [];
    list.forEach((r) => {
      const name = (r.name || '').trim();
      const lvl = Number(r.level || 1);
      const isEligible = name && lvl >= 2 && lvl <= 4;
      const isIncluded = includedSet ? includedSet.has(name) : true;
      if (isEligible && isIncluded) {
        base[lvl as 2 | 3 | 4].push(r);
      }
    });
    ([2, 3, 4] as const).forEach((k) => {
      base[k].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    });
    return base;
  }, [rows, includedSet]);

  const anyToShow = useMemo(() => order.some((lvl) => grouped[lvl as 2 | 3 | 4].length > 0), [grouped]);

  const handleDelete = (name: string) => {
    const clean = (name || '').trim();
    if (!clean || !onChangeIncluded) return;

    let current: string[];
    if (Array.isArray(includedCompetences)) {
      current = [...includedCompetences];
    } else {
      // If there was no explicit list, initialize from all available eligible names, then remove the one being deleted
      const list = Array.isArray(rows) ? rows : [];
      const eligibleAll = list
        .filter((r) => (r.name || '').trim() && Number(r.level || 1) >= 2 && Number(r.level || 1) <= 4)
        .map((r) => (r.name || '').trim());
      // Use a set to ensure uniqueness
      current = Array.from(new Set(eligibleAll));
    }
    const next = current.filter((n) => n.trim() !== clean);
    onChangeIncluded(next);
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
                  return (
                    <Tooltip key={row.id} title={'Exclude from this CV'}>
                      <span>
                        <Chip
                          label={label}
                          onDelete={() => handleDelete(row.name || '')}
                          deleteIcon={<DeleteOutlineIcon />}
                          sx={{ '& .MuiChip-label': { px: 1 } }}
                          aria-label={`exclude competence ${row.name} from CV`}
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
