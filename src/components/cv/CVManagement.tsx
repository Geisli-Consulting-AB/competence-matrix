import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import type { User } from 'firebase/auth';
import OverviewTab from './tabs/Overview/OverviewTab';
import PersonalInfoTab from './tabs/PersonalInfo/PersonalInfoTab';
import ExperienceEditor from './tabs/Experience/ExperienceEditor';
import EducationEditor from './tabs/Education/EducationEditor';
import CoursesCertificationsEditor from './tabs/Courses/CoursesCertificationsEditor';
import EngagementPublicationsEditor from './tabs/EngagementPublications/EngagementPublicationsEditor';
import CompetencesCompactTab from './tabs/Competences/CompetencesCompactTab';
import { 
  subscribeToUserCVs, 
  saveUserCV, 
  deleteUserCV, 
  subscribeToUserCompetences,
  type CompetenceRow 
} from '../../firebase';
import { saveUserCompetences } from '../../firebase';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`cv-tabpanel-${index}`}
      aria-labelledby={`cv-tab-${index}`}
      {...other}
    >
      {children}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `cv-tab-${index}`,
    'aria-controls': `cv-tabpanel-${index}`,
  };
}

interface CVManagementProps {
  user: User | null;
  existingCompetences?: string[];
}

export interface Project {
  id: string;
  customer: string;
  title: string;
  description: string;
}

export interface Experience {
  id: string;
  startMonth?: string;
  startYear?: string;
  endMonth?: string;
  endYear?: string;
  ongoing?: boolean;
  employer: string;
  title: string;
  description: string;
  competences?: string[]; // list of competences
}

export interface Education {
  id: string;
  startYear?: string;
  endYear?: string;
  school?: string; // School/University
  title?: string; // Degree or program title
}

export interface CourseCert {
  id: string;
  year?: string;
  organization?: string;
  title?: string;
}

export interface EngagementPublication {
  id: string;
  year?: string;
  title?: string;
  locationOrPublication?: string;
  description?: string;
  url?: string;
}

export interface CVItem {
  id: string;
  name: string;
  language?: 'en' | 'sv';
  data?: Partial<Omit<UserProfile, 'cvs'>>;
}

export interface UserProfile {
  displayName: string;
  photoUrl?: string;
  email?: string;
  title?: string;
  description?: string;
  roles?: string[];
  languages?: string[];
  expertise?: string[];
  // Per-CV inclusion list of competences (by name)
  competences?: string[];
  projects?: Project[];
  experiences?: Experience[];
  educations?: Education[];
  coursesCertifications?: CourseCert[];
  engagementsPublications?: EngagementPublication[];
  cvs?: CVItem[];
}

const CVManagement: React.FC<CVManagementProps> = ({ user, existingCompetences }) => {
  // State declarations at the top
  const [tabValue, setTabValue] = useState(0);
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const [userCompetences, setUserCompetences] = useState<CompetenceRow[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ 
    displayName: user?.displayName || '',
    email: user?.email || '',
    title: '',
    photoUrl: user?.photoURL || undefined,
    description: '',
    roles: [],
    languages: [],
    expertise: [],
    projects: [],
    experiences: [],
    educations: [],
    coursesCertifications: [],
    engagementsPublications: [],
    competences: [],
    cvs: []
  });

  // Fetch user competences
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = subscribeToUserCompetences(user.uid, (competences) => {
      setUserCompetences(competences);
    });
    
    return () => unsubscribe();
  }, [user]);
  
  // Map competences to the format expected by the PDF generator
  const mappedCompetences = useMemo(() => {
    // If profile.competences is empty, use all userCompetences
    const competencesToUse = (!profile.competences || profile.competences.length === 0) 
      ? userCompetences 
      : userCompetences.filter(comp => profile.competences?.includes(comp.name));
    
    return competencesToUse.map(comp => ({
      id: comp.id,
      name: comp.name,
      level: comp.level
    }));
  }, [userCompetences, profile.competences]);

  // Helper to select a CV and load its data into the working profile
  const selectCvById = useCallback((id: string | null) => {
    if (!id) return;
    setSelectedCvId(id);
    const cv = (profile.cvs || []).find(c => c.id === id);
    const data = cv?.data ?? {};
    setProfile(prev => ({
      ...prev,
      displayName: (data.displayName ?? (user?.displayName ?? '')),
      email: (data.email ?? (user?.email ?? '')),
      title: data.title ?? '',
      description: data.description ?? '',
      roles: data.roles ?? [],
      languages: data.languages ?? [],
      expertise: data.expertise ?? [],
      projects: data.projects ?? [],
      experiences: data.experiences ?? [],
      educations: data.educations ?? [],
      coursesCertifications: data.coursesCertifications ?? [],
      engagementsPublications: data.engagementsPublications ?? []
    }));
  }, [profile.cvs, user]);

  // Update profile when user changes
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        displayName: user.displayName || '',
        email: user.email || '',
        photoUrl: user.photoURL || undefined
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        displayName: '',
        email: '',
        title: '',
        photoUrl: undefined,
        description: '',
        roles: [],
        languages: [],
        expertise: [],
        projects: [],
        experiences: [],
        educations: [],
        coursesCertifications: [],
        engagementsPublications: [],
        cvs: []
      }));
    }
  }, [user]);

  // Subscribe to user's CVs in Firestore to populate Overview list
  useEffect(() => {
    if (!user) {
      setProfile(prev => ({ ...prev, cvs: [] }));
      return;
    }
    const unsub = subscribeToUserCVs(user.uid, (rows) => {
      setProfile(prev => {
        const updatedCVs = rows.map(r => ({
          id: r.id, 
          name: r.name, 
          language: r.language || 'en', // Ensure we have a default language
          data: {
            ...(r.data as Partial<Omit<UserProfile, 'cvs'>> || {}),
            // Ensure language is also in data for backward compatibility
            language: r.language || 'en'
          }
        }));
        return {
          ...prev,
          cvs: updatedCVs
        };
      });
    });
    return () => unsub();
  }, [user]);

  // Clear selection if the selected CV no longer exists
  useEffect(() => {
    if (!selectedCvId) return;
    const exists = (profile.cvs || []).some(cv => cv.id === selectedCvId);
    if (!exists) {
      setSelectedCvId(null);
    }
  }, [profile.cvs, selectedCvId]);

  // If no CV selected, ensure we are on Overview tab
  useEffect(() => {
    if (!selectedCvId && tabValue !== 0) {
      setTabValue(0);
    }
  }, [selectedCvId, tabValue]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileChange = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user || !selectedCvId) return;
    
    setProfile(prev => {
      const newProfile = {
        ...prev,
        ...updates
      };
      
      // Save competences separately if they are updated
      if (updates.competences) {
        saveUserCompetences(
          user.uid, 
          user.displayName || 'User', 
          updates.competences.map(name => ({
            id: `comp-${name.toLowerCase().replace(/\s+/g, '-')}`,
            name,
            level: 3 // Default level
          }))
        ).catch(() => {}); // Silent fail for competences
      }

      // Save the updated CV data to Firestore
      const currentCv = (newProfile.cvs || []).find(cv => cv.id === selectedCvId);
      if (currentCv) {
        // Create a clean updates object without the cvs array and undefined values
        const cleanUpdates = Object.entries(updates).reduce<Partial<UserProfile>>(
          (acc, [key, value]) => {
            if (key !== 'cvs' && value !== undefined) {
              (acc as Record<string, unknown>)[key] = value;
            }
            return acc;
          }, 
          {}
        );
        
        const updatedCv = {
          ...currentCv,
          data: {
            ...currentCv.data,
            ...cleanUpdates
          }
        };
        
        // Clean up the data object
        const cleanedData = { ...updatedCv.data };
        (Object.keys(cleanedData) as Array<keyof typeof cleanedData>).forEach(key => {
          if (cleanedData[key] === undefined) {
            delete cleanedData[key];
          }
        });

        const finalCv = {
          ...updatedCv,
          data: cleanedData
        };
        
        // Update local state
        const updatedCvs = (newProfile.cvs || []).map(cv => 
          cv.id === selectedCvId ? finalCv : cv
        );
        
        // Save to Firestore
        saveUserCV(user.uid, finalCv, false).catch(() => {});
        
        return {
          ...newProfile,
          ...cleanUpdates,
          cvs: updatedCvs
        };
      }
      
      return newProfile;
    });
  }, [user, selectedCvId]);

  // Auto-select the first CV when entering the page (or when list loads) if none is selected
  useEffect(() => {
    if (!selectedCvId) {
      const firstId = (profile.cvs && profile.cvs[0]?.id) || null;
      if (firstId) {
        selectCvById(firstId);
      }
    }
  }, [profile.cvs, selectedCvId, selectCvById]);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="CV management tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Overview" {...a11yProps(0)} />
            <Tab label="Personal Info" {...a11yProps(1)} disabled={!selectedCvId} />
            <Tab label="Experience" {...a11yProps(2)} disabled={!selectedCvId} />
            <Tab label="Education" {...a11yProps(3)} disabled={!selectedCvId} />
            <Tab label="Courses & Certifications" {...a11yProps(4)} disabled={!selectedCvId} />
            <Tab label="Engagement & Publications" {...a11yProps(5)} disabled={!selectedCvId} />
            <Tab label="Competences" {...a11yProps(6)} disabled={!selectedCvId} />
          </Tabs>
          {selectedCvId && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                ml: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: { xs: 160, sm: 240, md: 320 },
              }}
              title={(profile.cvs || []).find(cv => cv.id === selectedCvId)?.name || ''}
            >
              {(profile.cvs || []).find(cv => cv.id === selectedCvId)?.name || ''}
            </Typography>
          )}
        </Box>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <OverviewTab 
          cvs={profile.cvs || []}
          onChange={(cvs) => {
            // Persist to Firestore: upsert all, delete removed
            const prevList = profile.cvs || [];
            
            // Update local state
            setProfile(prev => ({
              ...prev,
              cvs: [...cvs]
            }));
            
            // Persist to Firestore if user is logged in
            if (user) {
              // Save all CVs
              cvs.forEach(cv => {
                if (cv.name.trim()) { // Only save if CV has a name
                  saveUserCV(user.uid, cv, false).catch(error => 
                    console.error('Error saving CV:', error)
                  );
                }
              });
              
              // Delete any CVs that were removed
              const deletedCVs = prevList.filter(oldCV => 
                !cvs.some(newCV => newCV.id === oldCV.id)
              );
              
              deletedCVs.forEach(cv => {
                deleteUserCV(user.uid, cv.id).catch(error =>
                  console.error('Error deleting CV:', error)
                );
              });
            }
          }}
          selectedId={selectedCvId}
          onSelect={selectCvById}
          ownerName={profile.displayName}
          ownerTitle={profile.title}
          ownerDescription={profile.description}
          ownerPhotoUrl={profile.photoUrl}
          ownerRoles={profile.roles}
          ownerLanguages={profile.languages}
          ownerExpertise={profile.expertise}
          ownerSelectedProjects={profile.projects?.map(project => ({
            id: project.id,
            customer: project.customer,
            title: project.title,
            description: project.description || ''
          })) || []}
          ownerExperiences={profile.experiences?.map(exp => ({
            id: exp.id,
            title: exp.title,
            employer: exp.employer,
            description: exp.description,
            startYear: exp.startYear,
            endYear: exp.endYear
          })) || []}
          ownerEducations={profile.educations?.map(edu => ({
            id: edu.id,
            school: edu.school,
            title: edu.title,
            startYear: edu.startYear,
            endYear: edu.endYear
          })) || []}
          ownerCoursesCertifications={profile.coursesCertifications?.map(course => ({
            id: course.id,
            title: course.title,
            organization: course.organization,
            year: course.year
          })) || []}
          ownerEngagements={profile.engagementsPublications?.map(engagement => ({
            id: engagement.id,
            title: engagement.title,
            organization: engagement.locationOrPublication,
            year: engagement.year,
            description: engagement.description
          })) || []}
          ownerCompetences={mappedCompetences}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <PersonalInfoTab 
          user={user}
          profile={profile}
          onProfileChange={handleProfileChange}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <ExperienceEditor
          experiences={profile.experiences || []}
          onChange={(experiences) => handleProfileChange({ experiences })}
          existingCompetences={existingCompetences}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <EducationEditor
          educations={profile.educations || []}
          onChange={(educations) => handleProfileChange({ educations })}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <CoursesCertificationsEditor
          items={profile.coursesCertifications || []}
          onChange={(items) => handleProfileChange({ coursesCertifications: items })}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <EngagementPublicationsEditor
          items={profile.engagementsPublications || []}
          onChange={(items) => handleProfileChange({ engagementsPublications: items })}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={6}>
        <CompetencesCompactTab 
          user={user}
          includedCompetences={profile.competences}
          onChangeIncluded={(list) => handleProfileChange({ competences: list })}
        />
      </TabPanel>
      
    </Box>
  );
};

export default CVManagement;
