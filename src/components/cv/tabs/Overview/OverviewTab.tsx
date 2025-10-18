import React from 'react';
import { Typography, Paper } from '@mui/material';

const OverviewTab: React.FC = () => {
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        CV Builder
      </Typography>
      <Typography variant="body1" paragraph>
        Welcome to your CV builder. Use the tabs above to navigate through different sections of your CV.
      </Typography>
      <Typography variant="body1" paragraph>
        <strong>Next steps:</strong>
      </Typography>
      <ul>
        <li>Add your personal information</li>
        <li>List your work experience</li>
        <li>Add your education history</li>
        <li>Highlight your skills</li>
      </ul>
    </Paper>
  );
};

export default OverviewTab;
