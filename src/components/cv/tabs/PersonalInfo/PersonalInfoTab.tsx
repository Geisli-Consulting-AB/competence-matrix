import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Paper,
  Avatar,
  IconButton,
} from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import type { User } from "firebase/auth";
import { useTranslation } from "react-i18next";
import TranslatableTextField from "../../../TranslatableTextField";
import SelectedProjectsEditor from "./SelectedProjectsEditor";
import RolesEditor from "./RolesEditor";
import ExpertiseEditor from "./ExpertiseEditor";
import LanguagesEditor from "./LanguagesEditor";
import type { UserProfile } from "../../CVManagement";

export interface PersonalInfoTabProps {
  user: User | null;
  profile: UserProfile;
  onProfileChange: (updates: Partial<UserProfile>) => void;
  language?: "en" | "sv";
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  profile,
  onProfileChange,
}) => {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      alert("Please select an image file (JPEG, PNG, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      onProfileChange({ photoUrl: reader.result as string });
      setIsUploading(false);
    };
    reader.onerror = () => {
      console.error("Error reading file");
      alert("Error reading file. Please try again.");
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        Personal Information
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box sx={{ position: "relative", mb: 2 }}>
          <Avatar
            src={profile.photoUrl}
            alt={profile.displayName}
            sx={{ width: 120, height: 120, fontSize: "3rem" }}
          >
            {profile.displayName?.charAt(0) || "U"}
          </Avatar>
          <input
            accept="image/*"
            style={{ display: "none" }}
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
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: "background.paper",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <PhotoCamera />
            </IconButton>
          </label>
        </Box>
        <Typography variant="caption" color="textSecondary" align="center">
          {isUploading
            ? "Processing..."
            : "Click the camera icon to upload a profile picture"}
        </Typography>
      </Box>

      <TranslatableTextField
        fullWidth
        label="Full Name"
        value={profile.displayName || ""}
        onChange={(value) => onProfileChange({ displayName: value })}
        onBlurValue={(value) => onProfileChange({ displayName: value })}
        margin="normal"
        variant="outlined"
      />
      <TextField
        fullWidth
        label="Email"
        value={profile.email || ""}
        onChange={(e) => onProfileChange({ email: e.target.value })}
        margin="normal"
        variant="outlined"
        type="email"
      />
      <TranslatableTextField
        fullWidth
        label="Title"
        value={profile.title || ""}
        onChange={(value) => onProfileChange({ title: value })}
        onBlurValue={(value) => onProfileChange({ title: value })}
        margin="normal"
        variant="outlined"
        placeholder="e.g., Senior Software Engineer"
      />
      <TranslatableTextField
        fullWidth
        label={t("professionalSummary")}
        value={profile.description || ""}
        onChange={(value) => onProfileChange({ description: value })}
        onBlurValue={(value) => onProfileChange({ description: value })}
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
      <LanguagesEditor
        languages={profile.languages || []}
        onChange={(languages) => onProfileChange({ languages })}
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
