import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import type { User } from 'firebase/auth';
import OverviewTab from './tabs/Overview/OverviewTab';
import PersonalInfoTab from './tabs/PersonalInfo/PersonalInfoTab';

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
}

export interface Project {
  id: string;
  customer: string;
  title: string;
  description: string;
}

export interface UserProfile {
  displayName: string;
  photoUrl?: string;
  email?: string;
  description?: string;
  roles?: string[];
  expertise?: string[];
  projects?: Project[];
}

const CVManagement: React.FC<CVManagementProps> = ({ user }) => {
  const [tabValue, setTabValue] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({ 
    displayName: user?.displayName || '',
    email: user?.email || '',
    photoUrl: user?.photoURL || undefined,
    description: '',
    roles: [],
    expertise: [],
    projects: []
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

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileChange = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({
      ...prev,
      ...updates
    }));
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="CV management tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" {...a11yProps(0)} />
          <Tab label="Personal Info" {...a11yProps(1)} />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <OverviewTab />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <PersonalInfoTab 
          user={user}
          profile={profile}
          onProfileChange={handleProfileChange}
        />
      </TabPanel>
      
    </Box>
  );
};

export default CVManagement;
