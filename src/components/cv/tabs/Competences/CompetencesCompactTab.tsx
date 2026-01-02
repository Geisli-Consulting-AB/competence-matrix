import React, { useEffect, useMemo, useState } from "react";
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Divider,
  ToggleButton,
} from "@mui/material";
import type { User } from "firebase/auth";
import {
  subscribeToUserCompetences,
  type CompetenceRow,
} from "../../../../firebase";

export interface CompetencesCompactTabProps {
  user: User | null;
  // When provided, competences will be loaded for this user id (used in admin viewing another user's CV)
  competencesUserId?: string | null;
  // Names of competences included in the current CV. If undefined, all user competences are implicitly included until modified.
  includedCompetences?: string[];
  onChangeIncluded?: (list: string[]) => void;
}

const levelLabels: Record<number, string> = {
  2: "Beginner",
  3: "Proficient",
  4: "Expert",
};

const order: number[] = [4, 3, 2];

const CompetencesCompactTab: React.FC<CompetencesCompactTabProps> = ({
  user,
  competencesUserId,
  includedCompetences,
  onChangeIncluded,
}) => {
  const [rows, setRows] = useState<CompetenceRow[] | null>(null);

  useEffect(() => {
    const uid = competencesUserId || user?.uid || null;
    if (!uid) {
      setTimeout(() => setRows([]), 0);
      return;
    }
    const unsub = subscribeToUserCompetences(uid, (r) => setRows(r));
    return () => unsub();
  }, [user, competencesUserId]);

  // Helper: set of included names. If undefined, treat all user competences (levels 2-4) as included.
  const includedSet = useMemo(() => {
    if (Array.isArray(includedCompetences)) {
      return new Set(
        (includedCompetences || []).map((n) => (n || "").trim()).filter(Boolean)
      );
    }
    return null; // null means "include all"
  }, [includedCompetences]);

  // Group competences by level (omit level 1), sort names within groups. Always show all eligible.
  const grouped = useMemo(() => {
    const base = {
      2: [] as CompetenceRow[],
      3: [] as CompetenceRow[],
      4: [] as CompetenceRow[],
    };
    const list = Array.isArray(rows) ? rows : [];
    list.forEach((r) => {
      const name = (r.name || "").trim();
      const lvl = Number(r.level || 1);
      const isEligible = name && lvl >= 2 && lvl <= 4;
      if (isEligible) {
        base[lvl as 2 | 3 | 4].push(r);
      }
    });
    ([2, 3, 4] as const).forEach((k) => {
      base[k].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    });
    return base;
  }, [rows]);

  const anyToShow = useMemo(
    () => order.some((lvl) => grouped[lvl as 2 | 3 | 4].length > 0),
    [grouped]
  );

  const handleToggle = (name: string) => {
    const clean = (name || "").trim();
    if (!clean || !onChangeIncluded) return;

    // Build the current working set: if no explicit list, start from all eligible names
    let current: Set<string>;
    if (Array.isArray(includedCompetences)) {
      current = new Set(
        includedCompetences.map((n) => (n || "").trim()).filter(Boolean)
      );
    } else {
      const list = Array.isArray(rows) ? rows : [];
      const eligibleAll = list
        .filter(
          (r) =>
            (r.name || "").trim() &&
            Number(r.level || 1) >= 2 &&
            Number(r.level || 1) <= 4
        )
        .map((r) => (r.name || "").trim());
      current = new Set(eligibleAll);
    }

    if (current.has(clean)) {
      current.delete(clean); // toggle off
    } else {
      current.add(clean); // toggle on
    }
    onChangeIncluded(Array.from(current));
  };

  if (!rows) {
    return (
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          maxWidth: 600,
          mx: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 160,
        }}
      >
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          Loading competences…
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, maxWidth: 600, mx: "auto" }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ mb: 0 }}>
          Competences
        </Typography>
      </Box>

      {!anyToShow ? (
        <Typography color="text.secondary">
          No competences found. Add competences in the main Competences tab
          first.
        </Typography>
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
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {items.map((row) => {
                  const name = (row.name || "").trim();
                  const label = name || "(unnamed competence)";
                  const selected = includedSet ? includedSet.has(name) : true;
                  return (
                    <ToggleButton
                      key={row.id}
                      value={name}
                      selected={selected}
                      onChange={() => handleToggle(name)}
                      size="small"
                      sx={{
                        textTransform: "none",
                        "&.Mui-selected": {
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                        },
                      }}
                      aria-pressed={selected}
                      aria-label={`toggle competence ${name || "unnamed"}`}
                    >
                      {label}
                    </ToggleButton>
                  );
                })}
              </Box>
            </Box>
          );
        })
      )}

      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          To add more competences, go to My Competences tab.
        </Typography>
      </Box>
    </Paper>
  );
};

export default CompetencesCompactTab;
