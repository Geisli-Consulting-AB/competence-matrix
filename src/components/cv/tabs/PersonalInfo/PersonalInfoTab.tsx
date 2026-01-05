import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Paper,
  Avatar,
  IconButton,
  LinearProgress,
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
import { uploadProfileImage, deleteProfileImage } from "../../../../firebase";

export interface PersonalInfoTabProps {
  user: User | null;
  profile: UserProfile;
  onProfileChange: (updates: Partial<UserProfile>) => void;
  language?: "en" | "sv";
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  user,
  profile,
  onProfileChange,
}) => {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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

    if (file.size === 0) {
      alert(
        "The selected file is empty. Please choose a different image file."
      );
      return;
    }

    if (!user) {
      alert("You must be logged in to upload a profile picture.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Delete old profile image if it exists and is a Storage URL
      if (
        profile.photoUrl &&
        profile.photoUrl.includes("firebasestorage.googleapis.com")
      ) {
        await deleteProfileImage(profile.photoUrl);
      }

      // Upload new image to Firebase Storage
      const downloadURL = await uploadProfileImage(user.uid, file, (progress) =>
        setUploadProgress(progress)
      );

      // Update profile with the new download URL
      onProfileChange({ photoUrl: downloadURL });
      setIsUploading(false);
      setUploadProgress(0);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
    }

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
        {isUploading && (
          <Box sx={{ width: "100%", mt: 1 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="caption" color="textSecondary" align="center">
              Uploading... {Math.round(uploadProgress)}%
            </Typography>
          </Box>
        )}
        {!isUploading && (
          <Typography variant="caption" color="textSecondary" align="center">
            Click the camera icon to upload a profile picture
          </Typography>
        )}
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
