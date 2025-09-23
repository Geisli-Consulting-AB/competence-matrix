import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress
} from '@mui/material'
import { saveUserCategories } from '../firebase'
import type { User } from 'firebase/auth'

interface UnmappedCompetence {
  name: string
  usageCount: number
  users: string[]
}

interface Category {
  id: string
  name: string
  competences: string[]
  color: string
}

interface CompetenceMappingProps {
  existingCompetences: string[]
  categories: Category[]
  user: User | null
}

const CompetenceMapping: React.FC<CompetenceMappingProps> = ({ 
  existingCompetences, 
  categories,
  user
}) => {
  const [unmappedCompetences, setUnmappedCompetences] = useState<UnmappedCompetence[]>([])
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Get unmapped competences by filtering out those already in categories
  useEffect(() => {
    const getUnmappedCompetences = () => {
      setLoading(true)
      
      // Get all competences that are already mapped to categories
      const mappedCompetences = new Set<string>()
      categories.forEach(category => {
        category.competences.forEach(competence => {
          mappedCompetences.add(competence)
        })
      })
      
      // Filter out mapped competences from existing competences
      const unmapped = existingCompetences
        .filter(comp => !mappedCompetences.has(comp))
        .map((comp, index) => {
          const users = [`User ${index + 1}`, `User ${index + 2}`].slice(0, Math.floor(Math.random() * 2) + 1)
          return {
            name: comp,
            usageCount: Math.floor(Math.random() * 10) + 1,
            users: users.sort() // Sort usernames alphabetically
          }
        })
      
      setTimeout(() => {
        setUnmappedCompetences(unmapped)
        setLoading(false)
      }, 100)
    }

    if (existingCompetences.length > 0) {
      getUnmappedCompetences()
    }
  }, [existingCompetences, categories])

  const handleMappingChange = async (competenceName: string, categoryId: string) => {
    if (!user?.uid) return

    // Update the category to include this competence
    const updatedCategories = categories.map(category => {
      if (category.id === categoryId) {
        // Add competence if not already present
        if (!category.competences.includes(competenceName)) {
          return {
            ...category,
            competences: [...category.competences, competenceName]
          }
        }
      }
      return category
    })

    // Save to database
    try {
      await saveUserCategories(user.uid, updatedCategories)
      
      // Remove the competence from unmapped list
      setUnmappedCompetences(prev => 
        prev.filter(comp => comp.name !== competenceName)
      )
      
      // Clear the mapping
      setMappings(prev => {
        const newMappings = { ...prev }
        delete newMappings[competenceName]
        return newMappings
      })
    } catch (error) {
      console.error('Failed to save competence to category:', error)
    }
  }


  return (
    <Box>
      {/* Competences Table */}
      <Paper elevation={1}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Loading unmapped competences...
            </Typography>
            <LinearProgress />
          </Box>
        ) : unmappedCompetences.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No unmapped competences found. All competences are already assigned to categories!
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Unmapped Competence</TableCell>
                  <TableCell>Assign to Category</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unmappedCompetences.map((competence) => (
                  <TableRow key={competence.name}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {competence.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {categories.map((category) => (
                          <Chip
                            key={category.id}
                            label={category.name}
                            clickable
                            variant={mappings[competence.name] === category.id ? "filled" : "outlined"}
                            onClick={() => handleMappingChange(competence.name, category.id)}
                            sx={{
                              borderColor: category.color,
                              color: mappings[competence.name] === category.id ? 'white' : category.color,
                              backgroundColor: mappings[competence.name] === category.id ? category.color : 'transparent',
                              '&:hover': {
                                backgroundColor: mappings[competence.name] === category.id ? category.color : `${category.color}20`,
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}

export default CompetenceMapping
