import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Radio, IconButton, Autocomplete } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import type { CompetenceRow } from '../firebase'

export type CompetenceTableProps = {
  competences: CompetenceRow[]
  onChange: (rows: CompetenceRow[]) => void
  onSave: (rows: CompetenceRow[]) => Promise<void>
  existingCompetences?: string[]
}

export default function CompetenceTable({ competences, onChange, onSave, existingCompetences = [] }: CompetenceTableProps) {
  const updateName = async (idx: number, name: string) => {
    const nextRows = competences.map((row, i) => (i === idx ? { ...row, name } : row))
    onChange(nextRows)
    await onSave(nextRows)
  }

  const updateLevel = async (idx: number, level: number) => {
    const nextRows = competences.map((row, i) => (i === idx ? { ...row, level } : row))
    onChange(nextRows)
    await onSave(nextRows)
  }

  const addRow = async () => {
    const nextRows: CompetenceRow[] = [
      ...competences,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: '', level: 1 },
    ]
    onChange(nextRows)
    await onSave(nextRows)
  }

  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 900 }}>
        <TableHead>
          <TableRow>
            <TableCell>Competence</TableCell>
            <TableCell align="center">Want to learn</TableCell>
            <TableCell align="center">Beginner</TableCell>
            <TableCell align="center">Proficient</TableCell>
            <TableCell align="center">Expert</TableCell>
            <TableCell align="center"></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {competences.map((c, idx) => (
            <TableRow key={c.id} hover>
              <TableCell component="th" scope="row" sx={{ minWidth: 300 }}>
                <Autocomplete
                  freeSolo
                  options={existingCompetences}
                  value={c.name}
                  onChange={async (_, newValue) => updateName(idx, newValue || '')}
                  onInputChange={async (_, newInputValue) => updateName(idx, newInputValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Competence name"
                      size="small"
                      fullWidth
                    />
                  )}
                />
              </TableCell>
              {[1, 2, 3, 4].map((lvl) => (
                <TableCell key={lvl} align="center">
                  <Radio
                    name={`level-${c.id}`}
                    checked={c.level === lvl}
                    onChange={async () => updateLevel(idx, lvl)}
                    value={String(lvl)}
                    inputProps={{ 'aria-label': String(lvl) }}
                  />
                </TableCell>
              ))}
              <TableCell align="center" sx={{ width: 80 }}>
                <IconButton
                  aria-label="delete competence"
                  color="error"
                  onClick={async () => {
                    const nextRows = competences.filter((_, i) => i !== idx)
                    onChange(nextRows)
                    await onSave(nextRows)
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={6} align="center">
              <IconButton color="primary" onClick={addRow} aria-label="add competence">
                <AddIcon />
              </IconButton>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  )
}
