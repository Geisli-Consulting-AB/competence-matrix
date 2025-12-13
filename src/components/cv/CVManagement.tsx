import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import type { User } from "firebase/auth";
import OverviewTab from "./tabs/Overview/OverviewTab";
import PersonalInfoTab from "./tabs/PersonalInfo/PersonalInfoTab";
import ExperienceEditor from "./tabs/Experience/ExperienceEditor";
import EducationEditor from "./tabs/Education/EducationEditor";
import CoursesCertificationsEditor from "./tabs/Courses/CoursesCertificationsEditor";
import EngagementPublicationsEditor from "./tabs/EngagementPublications/EngagementPublicationsEditor";
import CompetencesCompactTab from "./tabs/Competences/CompetencesCompactTab";
import {
  subscribeToUserCVs,
  saveUserCV,
  deleteUserCV,
  subscribeToUserCompetences,
} from "../../firebase";
import { saveUserCompetences } from "../../firebase";
import { getUserCv } from "../../firebase";
import type { CompetenceRow } from "../../firebase";

// Define the CVOverviewItem type locally since it's not in ../../types
type CVOverviewItem = {
  id: string;
  name: string;
  language?: 'en' | 'sv';
  ownerName?: string;
  userId?: string;
  // When receiving from OverviewTab admin list, data may be unknown
  data?: unknown;
};

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
    "aria-controls": `cv-tabpanel-${index}`,
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
  language?: "en" | "sv";
  data?: Partial<Omit<UserProfile, "cvs">>;
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

const CVManagement: React.FC<CVManagementProps> = ({
  user,
  existingCompetences,
}) => {
  // State declarations at the top
  const [tabValue, setTabValue] = useState(0);
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedCvLabel, setSelectedCvLabel] = useState<string>("");
  const [userCompetences, setUserCompetences] = useState<CompetenceRow[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    displayName: user?.displayName || "",
    email: user?.email || "",
    title: "",
    photoUrl: user?.photoURL || undefined,
    description: "",
    roles: [],
    languages: [],
    expertise: [],
    projects: [],
    experiences: [],
    educations: [],
    coursesCertifications: [],
    engagementsPublications: [],
    competences: [],
    cvs: [],
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
  const competencesToUse = useMemo<CompetenceRow[]>(() => {
    const isForeignSelection = !!selectedUserId && selectedUserId !== user?.uid;

    // When viewing another user's CV (admin foreign selection), use the CV's own competences
    if (isForeignSelection) {
      if (profile.competences && profile.competences.length > 0) {
        return (profile.competences as unknown as CompetenceRow[]).map((comp) => ({
          id: comp.id || '',
          name: comp.name || '',
          level: comp.level || 0,
        }));
      }
      return [];
    }

    // Otherwise (own CV), prefer live userCompetences; fall back to CV's competences
    if (userCompetences && userCompetences.length > 0) {
      return userCompetences;
    }

    if (profile.competences && profile.competences.length > 0) {
      return (profile.competences as unknown as CompetenceRow[]).map((comp) => ({
        id: comp.id || '',
        name: comp.name || '',
        level: comp.level || 0,
      }));
    }

    return [];
  }, [userCompetences, profile.competences, selectedUserId, user?.uid]);

  // Helper to select a CV and load its data into the working profile
  const selectCvById = useCallback(
    (id: string | null, cvData?: CVOverviewItem) => {
      if (!id) return;

      // Set the selected CV ID first
      setSelectedCvId(id);

      // If we have the CV data passed in (from admin view or another user's CV), prefer fetching the latest from Firestore
      if (cvData) {
        const ownerUid = cvData.userId || null;
        setSelectedUserId(ownerUid);
        setSelectedCvLabel(cvData.name || "");

        const hydrate = (payload: Partial<UserProfile>) => {
          const data = payload || {};
          const updatedProfile: UserProfile = {
            displayName: data.displayName || cvData.ownerName || "",
            email: data.email || "",
            title: data.title || "",
            photoUrl: data.photoUrl || undefined,
            description: data.description || "",
            roles: Array.isArray(data.roles) ? [...data.roles] : [],
            languages: Array.isArray(data.languages) ? [...data.languages] : [],
            expertise: Array.isArray(data.expertise) ? [...data.expertise] : [],
            competences: Array.isArray(data.competences) ? [...data.competences] : [],
            projects: Array.isArray(data.projects)
              ? (data.projects as Project[]).map((p) => ({ ...p }))
              : [],
            experiences: Array.isArray(data.experiences)
              ? (data.experiences as Experience[]).map((e) => ({ ...e }))
              : [],
            educations: Array.isArray(data.educations)
              ? (data.educations as Education[]).map((ed) => ({ ...ed }))
              : [],
            coursesCertifications: Array.isArray(data.coursesCertifications)
              ? (data.coursesCertifications as CourseCert[]).map((cc) => ({ ...cc }))
              : [],
            engagementsPublications: Array.isArray(data.engagementsPublications)
              ? (data.engagementsPublications as EngagementPublication[]).map((ep) => ({ ...ep }))
              : [],
            cvs: [...(profile.cvs || [])],
          };

          setProfile((prev) => ({
            ...prev,
            ...updatedProfile,
            cvs: prev.cvs || [],
          }));
          setSelectedCvId(id);
        };

        // If we have an owner user id, fetch the latest CV to avoid hydrating with stale admin list data
        if (ownerUid) {
          getUserCv(ownerUid, id)
            .then((fresh) => {
              if (fresh && fresh.data && typeof fresh.data === 'object') {
                hydrate(fresh.data as Partial<UserProfile>);
              } else {
                // Fallback to provided cvData if no fresh data
                hydrate((cvData.data || {}) as Partial<UserProfile>);
              }
            })
            .catch(() => {
              hydrate((cvData.data || {}) as Partial<UserProfile>);
            });
        } else {
          hydrate((cvData.data || {}) as Partial<UserProfile>);
        }
      } else if (profile.cvs) {
        // If no cvData is provided, try to find the CV in the current user's CVs
        const selectedCv = profile.cvs.find(cv => cv.id === id);
        if (selectedCv) {
          setSelectedUserId(user?.uid || null);
          setSelectedCvLabel(selectedCv.name || "");
          const data = (selectedCv.data || {}) as Partial<UserProfile>;
          setProfile(prev => ({
            ...prev, // Keep existing state
            ...data, // Override with CV data
            cvs: prev.cvs || [] // Make sure we keep the existing CVs array
          }));

          // Update the selected CV ID again to ensure it's set after the profile update
          setSelectedCvId(id);
        }
      }
    },
    [profile.cvs, user?.uid]
  );

  // Update profile when user changes
  useEffect(() => {
    if (user) {
      setTimeout(() => {
        setProfile((prev) => ({
          ...prev,
          displayName: user.displayName || "",
          email: user.email || "",
          photoUrl: user.photoURL || undefined,
        }));
      }, 0);
    } else {
      setTimeout(() => {
        setProfile((prev) => ({
          ...prev,
          displayName: "",
          email: "",
          title: "",
          photoUrl: undefined,
          description: "",
          roles: [],
          languages: [],
          expertise: [],
          projects: [],
          experiences: [],
          educations: [],
          coursesCertifications: [],
          engagementsPublications: [],
          cvs: [],
        }));
      }, 0);
    }
  }, [user?.uid]);

  // Subscribe to user's CVs in Firestore to populate Overview list
  useEffect(() => {
    if (!user) {
      setTimeout(() => setProfile((prev) => ({ ...prev, cvs: [] })), 0);
      return;
    }
    const unsub = subscribeToUserCVs(user.uid, (rows) => {
      setProfile((prev) => {
        const updatedCVs = rows.map((r) => ({
          id: r.id,
          name: r.name,
          language: r.language || "en", // Ensure we have a default language
          data: {
            ...((r.data as Partial<Omit<UserProfile, "cvs">>) || {}),
            // Ensure language is also in data for backward compatibility
            language: r.language || "en",
          },
        }));
        return {
          ...prev,
          cvs: updatedCVs,
        };
      });
    });
    return () => unsub();
  }, [user?.uid]);

  // Clear selection if the selected CV no longer exists
  useEffect(() => {
    if (!selectedCvId) return;
    // If we're viewing another user's CV in admin mode, do NOT clear selection
    // Admin-selected CVs won't exist in the current user's `profile.cvs` list
    const isForeignSelection = !!selectedUserId && selectedUserId !== user?.uid;
    if (isForeignSelection) return;

    const exists = (profile.cvs || []).some((cv) => cv.id === selectedCvId);
    if (!exists) {
      setTimeout(() => setSelectedCvId(null), 0);
    }
  }, [profile.cvs, selectedCvId, selectedUserId, user?.uid]);

  // If no CV selected, ensure we are on Overview tab
  useEffect(() => {
    if (!selectedCvId && tabValue !== 0) {
      setTimeout(() => setTabValue(0), 0);
    }
  }, [selectedCvId, tabValue]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileChange = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user || !selectedCvId) return;

      setProfile((prev) => {
        const newProfile = {
          ...prev,
          ...updates,
        };

        // Save competences separately if they are updated
        if (updates.competences) {
          const targetUid = selectedUserId || user.uid;
          const ownerName = (newProfile.displayName || prev.displayName || "User");
          saveUserCompetences(
            targetUid,
            ownerName,
            updates.competences.map((name) => ({
              id: `comp-${name.toLowerCase().replace(/\s+/g, "-")}`,
              name,
              level: 3, // Default level
            }))
          ).catch((error) => {
            console.error("Failed to save competences:", error);
          }); // Silent fail for competences
        }

        // Save the updated CV data to Firestore
        const currentCv = (newProfile.cvs || []).find(
          (cv) => cv.id === selectedCvId
        );
        if (currentCv) {
          // Create a clean updates object without the cvs array and undefined values
          const cleanUpdates = Object.entries(updates).reduce<
            Partial<UserProfile>
          >((acc, [key, value]) => {
            if (key !== "cvs" && value !== undefined) {
              (acc as Record<string, unknown>)[key] = value;
            }
            return acc;
          }, {});

          const updatedCv = {
            ...currentCv,
            data: {
              ...currentCv.data,
              ...cleanUpdates,
            },
          };

          // Clean up the data object
          const cleanedData = { ...updatedCv.data };
          (Object.keys(cleanedData) as Array<keyof typeof cleanedData>).forEach(
            (key) => {
              if (cleanedData[key] === undefined) {
                delete cleanedData[key];
              }
            }
          );

          const finalCv = {
            ...updatedCv,
            data: cleanedData,
          };

          // Update local state
          const updatedCvs = (newProfile.cvs || []).map((cv) =>
            cv.id === selectedCvId ? finalCv : cv
          );

          // Save to Firestore
          const toSave = finalCv;
          const targetUid = selectedUserId || user.uid;
          if (toSave && targetUid) {
            saveUserCV(targetUid, toSave, false).catch((error) => {
              console.error("Failed to save CV profile changes:", error);
            });
          }

          return {
            ...newProfile,
            ...cleanUpdates,
            cvs: updatedCvs,
          };
        }

        // Foreign CV (not in current user's cvs list) — still persist to the selected user's CV
        const cleanUpdates = Object.entries(updates).reduce<
          Partial<UserProfile>
        >((acc, [key, value]) => {
          if (key !== "cvs" && value !== undefined) {
            (acc as Record<string, unknown>)[key] = value;
          }
          return acc;
        }, {});

        const targetUid = selectedUserId || user.uid;
        if (targetUid) {
          // When editing a foreign CV (admin editing someone else's CV), avoid overwriting
          // the CV's top-level name accidentally with the owner's display name.
          // Only include `name` when we actually know the current CV name.
          const existingForeignCv = (prev.cvs || []).find((cv) => cv.id === selectedCvId);
          const knownName = existingForeignCv?.name; // may be undefined for foreign CVs not in local list
          const explicitLang = (cleanUpdates as unknown as { language?: 'en' | 'sv' }).language;

          const toSave = {
            id: selectedCvId,
            // include name only if we know it; otherwise let saveUserCV skip it to preserve stored value
            ...(knownName ? { name: knownName } : {}),
            language: existingForeignCv?.language || (explicitLang ?? 'en'),
            data: {
              ...(cleanUpdates as Record<string, unknown>),
            },
          };
          saveUserCV(targetUid, toSave, false).catch((error) => {
            console.error("Failed to save foreign CV profile changes:", error);
          });
        }

        // Update local working profile so UI reflects changes immediately
        return {
          ...newProfile,
          ...cleanUpdates,
        };
      });
    },
    [user, selectedCvId, selectedUserId]
  );

  // Auto-select first CV if none selected and we have CVs
  useEffect(() => {
    // Only auto-select from the current user's list when we're not viewing
    // another user's CV (admin mode foreign selection)
    const isForeignSelection = !!selectedUserId && selectedUserId !== user?.uid;
    if (isForeignSelection) return;

    if (profile.cvs && profile.cvs.length > 0 && !selectedCvId) {
      const firstId = profile.cvs[0]?.id;
      if (firstId) {
        setTimeout(() => selectCvById(firstId), 0);
      }
    }
  }, [profile.cvs, selectCvById, selectedCvId, selectedUserId, user?.uid]);

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", px: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="CV management tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Overview" {...a11yProps(0)} />
            <Tab
              label="Personal Info"
              {...a11yProps(1)}
              disabled={!selectedCvId}
            />
            <Tab
              label="Experience"
              {...a11yProps(2)}
              disabled={!selectedCvId}
            />
            <Tab label="Education" {...a11yProps(3)} disabled={!selectedCvId} />
            <Tab
              label="Courses & Certifications"
              {...a11yProps(4)}
              disabled={!selectedCvId}
            />
            <Tab
              label="Engagement & Publications"
              {...a11yProps(5)}
              disabled={!selectedCvId}
            />
            <Tab
              label="Competences"
              {...a11yProps(6)}
              disabled={!selectedCvId}
            />
          </Tabs>
          {selectedCvId && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                ml: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: { xs: 160, sm: 240, md: 320 },
              }}
              title={selectedCvLabel || (profile.cvs || []).find((cv) => cv.id === selectedCvId)?.name || ""}
            >
              {selectedCvLabel || (profile.cvs || []).find((cv) => cv.id === selectedCvId)?.name || ""}
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
            setProfile((prev) => ({
              ...prev,
              // Map OverviewTab CVs into our CVItem shape
              cvs: cvs.map((cv) => ({
                id: cv.id,
                name: cv.name,
                language: cv.language || 'en',
                data: (cv.data as Partial<Omit<UserProfile, 'cvs'>> | undefined),
              })),
            }));

            // Persist to Firestore if user is logged in
            if (user) {
              // Save all CVs
              cvs.forEach((cv) => {
                if (cv.name.trim()) {
                  // Only save if CV has a name
                  saveUserCV(user.uid, cv, false).catch((error) =>
                    console.error("Error saving CV:", error)
                  );
                }
              });

              // Delete any CVs that were removed
              const deletedCVs = prevList.filter(
                (oldCV) => !cvs.some((newCV) => newCV.id === oldCV.id)
              );

              deletedCVs.forEach((cv) => {
                deleteUserCV(user.uid, cv.id).catch((error) =>
                  console.error("Error deleting CV:", error)
                );
              });
            }
          }}
          selectedId={selectedCvId}
          onSelect={selectCvById}
          user={user}
          ownerName={profile.displayName}
          ownerTitle={profile.title}
          ownerDescription={profile.description}
          ownerPhotoUrl={profile.photoUrl}
          ownerRoles={profile.roles}
          ownerLanguages={profile.languages}
          ownerExpertise={profile.expertise}
          ownerSelectedProjects={
            profile.projects?.map((project) => ({
              id: project.id,
              customer: project.customer,
              title: project.title,
              description: project.description || "",
            })) || []
          }
          ownerExperiences={
            profile.experiences?.map((exp) => ({
              id: exp.id,
              title: exp.title,
              employer: exp.employer,
              description: exp.description,
              startYear: exp.startYear,
              endYear: exp.endYear,
            })) || []
          }
          ownerEducations={
            profile.educations?.map((edu) => ({
              id: edu.id,
              school: edu.school,
              title: edu.title,
              startYear: edu.startYear,
              endYear: edu.endYear,
            })) || []
          }
          ownerCoursesCertifications={
            profile.coursesCertifications?.map((course) => ({
              id: course.id,
              title: course.title,
              organization: course.organization,
              year: course.year,
            })) || []
          }
          ownerEngagements={
            profile.engagementsPublications?.map((engagement) => ({
              id: engagement.id,
              title: engagement.title,
              organization: engagement.locationOrPublication,
              year: engagement.year,
              description: engagement.description,
            })) || []
          }
          ownerCompetences={competencesToUse}
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
          onChange={(items) =>
            handleProfileChange({ coursesCertifications: items })
          }
        />
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <EngagementPublicationsEditor
          items={profile.engagementsPublications || []}
          onChange={(items) =>
            handleProfileChange({ engagementsPublications: items })
          }
        />
      </TabPanel>

      <TabPanel value={tabValue} index={6}>
        <CompetencesCompactTab
          user={user}
          competencesUserId={selectedUserId || user?.uid || null}
          includedCompetences={profile.competences}
          onChangeIncluded={(list) => handleProfileChange({ competences: list })}
        />
      </TabPanel>
    </Box>
  );
};

export default CVManagement;
