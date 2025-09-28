import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Radio, IconButton, Autocomplete, Box, Card, CardContent, RadioGroup, FormControlLabel } from '@mui/material'
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
    try {
      await onSave(nextRows)
    } catch (error) {
      console.error('Failed to save competence:', error)
      // Keep the state change even if save fails
    }
  }

  const levelLabels = {
    1: 'Want to learn',
    2: 'Beginner', 
    3: 'Proficient',
    4: 'Expert'
  }

  return (
    <Box>
      {/* Desktop Table View */}
      <TableContainer sx={{ overflowX: 'auto' }} className="mobile-hide-table">
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

      {/* Mobile Card View */}
      <Box className="mobile-show-cards">
        {competences.map((c, idx) => (
          <Card key={c.id} className="mobile-competence-card" elevation={2}>
            <CardContent className="mobile-competence-card-content">
              {/* First Line: Competence Input */}
              <Box className="mobile-competence-input-row">
                <Autocomplete
                  freeSolo
                  options={existingCompetences}
                  value={c.name}
                  onChange={async (_, newValue) => updateName(idx, newValue || '')}
                  onInputChange={async (_, newInputValue) => updateName(idx, newInputValue)}
                  className="mobile-competence-autocomplete"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Competence name"
                      size="small"
                      fullWidth
                      className="mobile-competence-input"
                    />
                  )}
                />
                <IconButton
                  aria-label="delete competence"
                  color="error"
                  size="small"
                  className="mobile-competence-delete"
                  onClick={async () => {
                    const nextRows = competences.filter((_, i) => i !== idx)
                    onChange(nextRows)
                    await onSave(nextRows)
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
              
              {/* Second Line: Level Selection */}
              <Box className="mobile-competence-level-row">
                <RadioGroup
                  row
                  value={String(c.level)}
                  onChange={async (e) => updateLevel(idx, parseInt(e.target.value))}
                  className="mobile-level-radio-group"
                >
                  {[1, 2, 3, 4].map((lvl) => (
                    <FormControlLabel
                      key={lvl}
                      value={String(lvl)}
                      control={<Radio size="small" />}
                      label={levelLabels[lvl as keyof typeof levelLabels]}
                      className="mobile-level-option"
                    />
                  ))}
                </RadioGroup>
              </Box>
            </CardContent>
          </Card>
        ))}
        
        {/* Add Button for Mobile */}
        <Box className="mobile-add-competence">
          <IconButton 
            color="primary" 
            onClick={addRow} 
            aria-label="add competence"
            size="large"
            className="mobile-add-button"
          >
            <AddIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  )
}
