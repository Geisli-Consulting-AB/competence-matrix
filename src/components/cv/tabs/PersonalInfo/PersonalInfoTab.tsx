import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Typography, 
  Paper, 
  Avatar, 
  IconButton
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import type { User } from 'firebase/auth';
import SelectedProjectsEditor from './SelectedProjectsEditor';
import RolesEditor from './RolesEditor';
import ExpertiseEditor from './ExpertiseEditor';

export interface PersonalInfoTabProps {
  user: User | null;
  profile: {
    displayName: string;
    photoUrl?: string;
    email?: string;
    description?: string;
    roles?: string[];
    expertise?: string[];
    projects?: Array<{
      customer: string;
      title: string;
      description: string;
    }>;
  };
  onProfileChange: (updates: any) => void;
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ profile, onProfileChange }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      alert('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }
    
    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      onProfileChange({ photoUrl: reader.result as string });
      setIsUploading(false);
    };
    reader.onerror = () => {
      console.error('Error reading file');
      alert('Error reading file. Please try again.');
      setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
    event.target.value = '';
  };


  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Personal Information
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
        <Box sx={{ position: 'relative', mb: 2 }}>
          <Avatar
            src={profile.photoUrl}
            alt={profile.displayName}
            sx={{ width: 120, height: 120, fontSize: '3rem' }}
          >
            {profile.displayName?.charAt(0) || 'U'}
          </Avatar>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="profile-image-upload"
            type="file"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
          <label htmlFor="profile-image-upload">
            <IconButton 
              color="primary" 
              aria-label="upload picture" 
              component="span"
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: 'background.paper',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <PhotoCamera />
            </IconButton>
          </label>
        </Box>
        <Typography variant="caption" color="textSecondary" align="center">
          {isUploading ? 'Processing...' : 'Click the camera icon to upload a profile picture'}
        </Typography>
      </Box>

      <TextField
        fullWidth
        label="Full Name"
        value={profile.displayName || ''}
        onChange={(e) => onProfileChange({ displayName: e.target.value })}
        margin="normal"
        variant="outlined"
      />
      <TextField
        fullWidth
        label="Email"
        value={profile.email || ''}
        onChange={(e) => onProfileChange({ email: e.target.value })}
        margin="normal"
        variant="outlined"
        type="email"
      />
      <TextField
        fullWidth
        label="Professional Summary"
        value={profile.description || ''}
        onChange={(e) => onProfileChange({ description: e.target.value })}
        margin="normal"
        variant="outlined"
        multiline
        rows={4}
        placeholder="A brief summary of your professional background and skills..."
      />
      <RolesEditor
        roles={profile.roles || []}
        onChange={(roles) => onProfileChange({ roles })}
      />
      <ExpertiseEditor
        expertise={profile.expertise || []}
        onChange={(expertise) => onProfileChange({ expertise })}
      />
      <SelectedProjectsEditor
        projects={profile.projects || []}
        onChange={(projects) => onProfileChange({ projects })}
      />
    </Paper>
  );
};

export default PersonalInfoTab;
