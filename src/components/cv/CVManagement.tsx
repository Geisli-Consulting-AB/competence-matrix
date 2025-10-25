import React, { useState, useEffect, useCallback } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import type { User } from 'firebase/auth';
import OverviewTab from './tabs/Overview/OverviewTab';
import PersonalInfoTab from './tabs/PersonalInfo/PersonalInfoTab';
import ExperienceEditor from './tabs/Experience/ExperienceEditor';
import EducationEditor from './tabs/Education/EducationEditor';
import CoursesCertificationsEditor from './tabs/Courses/CoursesCertificationsEditor';
import EngagementPublicationsEditor from './tabs/EngagementPublications/EngagementPublicationsEditor';
import CompetencesCompactTab from './tabs/Competences/CompetencesCompactTab';
import { subscribeToUserCVs, saveUserCV, deleteUserCV } from '../../firebase';

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
  data?: Partial<Omit<UserProfile, 'cvs'>>;
}

export interface UserProfile {
  displayName: string;
  photoUrl?: string;
  email?: string;
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
  const [tabValue, setTabValue] = useState(0);
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({ 
    displayName: user?.displayName || '',
    email: user?.email || '',
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
    cvs: []
  });

  // Update profile when user changes
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        displayName: user.displayName || '',
        email: user.email || '',
        photoUrl: user.photoURL || undefined
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
      setProfile(prev => ({
        ...prev,
        cvs: rows.map(r => ({ id: r.id, name: r.name, data: r.data as Partial<Omit<UserProfile, 'cvs'>> | undefined }))
      }));
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

  const handleProfileChange = (updates: Partial<UserProfile>) => {
    let toSave: { id: string; name: string; data: unknown } | null = null;
    setProfile(prev => {
      const next = { ...prev, ...updates };
      // If a CV is selected, persist updates into that CV's data snapshot
      if (selectedCvId && Array.isArray(next.cvs)) {
        const idx = next.cvs.findIndex(cv => cv.id === selectedCvId);
        if (idx >= 0) {
          const cv = next.cvs[idx];
          const currentData = cv.data || {};
          // Exclude cvs field from being embedded
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { cvs: _ignored, ...updatesWithoutCvs } = updates;
          const updatedCv = { ...cv, data: { ...currentData, ...updatesWithoutCvs } };
          next.cvs[idx] = updatedCv;
          toSave = { id: updatedCv.id, name: updatedCv.name, data: updatedCv.data };
        }
      }
      return next;
    });
    // Save the selected CV snapshot to Firestore on every change
    if (toSave && user) {
      saveUserCV(user.uid, toSave, false);
    }
  };

  // Helper to select a CV and load its data into the working profile
  const selectCvById = useCallback((id: string | null) => {
    if (!id) return;
    setSelectedCvId(id);
    const cv = (profile.cvs || []).find(c => c.id === id);
    const data = cv?.data ?? {};
    setProfile(prev => ({
      displayName: (data.displayName ?? (user?.displayName ?? '')),
      email: (data.email ?? (user?.email ?? '')),
      photoUrl: data.photoUrl ?? undefined,
      description: data.description ?? '',
      roles: data.roles ?? [],
      languages: data.languages ?? [],
      expertise: data.expertise ?? [],
      // If not set for this CV, it means all user competences are implicitly included until modified in the tab
      competences: data.competences,
      projects: data.projects ?? [],
      experiences: data.experiences ?? [],
      educations: data.educations ?? [],
      coursesCertifications: data.coursesCertifications ?? [],
      engagementsPublications: data.engagementsPublications ?? [],
      cvs: prev.cvs ?? [],
    }));
  }, [profile.cvs, user]);

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
            setProfile(prev => ({ ...prev, cvs }));
            if (user) {
              const nextIds = new Set((cvs || []).map(c => c.id));
              // deletions
              prevList.forEach(c => { if (!nextIds.has(c.id)) deleteUserCV(user.uid, c.id); });
              // upserts
              (cvs || []).forEach(c => {
                const existing = prevList.find(p => p.id === c.id);
                const isNew = !existing;
                saveUserCV(user.uid, { id: c.id, name: c.name || '', data: existing?.data || {} }, isNew);
              });
            }
          }}
          selectedId={selectedCvId}
          onSelect={(id) => {
            selectCvById(id);
          }}
          ownerName={profile.displayName}
          ownerDescription={profile.description}
          ownerPhotoUrl={profile.photoUrl}
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
