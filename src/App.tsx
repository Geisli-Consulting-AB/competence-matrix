import { useState, useEffect } from "react";
import "./App.css";
import "./mobile.css";
import {
  auth,
  googleProvider,
  subscribeToUserCompetences,
  saveUserCompetences,
  getAllUsersCompetences,
  getAllCompetencesForAutocomplete,
  subscribeToSharedCategories,
  type Category,
} from "./firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  getRedirectResult,
} from "firebase/auth";
import type { User } from "firebase/auth";
import {
  Button,
  Container,
  Stack,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CompetenceTable from "./components/CompetenceTable";
import CompetenceOverview from "./components/CompetenceOverview";
import CategoryManagement from "./components/CategoryManagement";
import CompetenceMapping from "./components/CompetenceMapping";
import CVManagement from "./components/cv/CVManagement";
import MatchCompetences from "./components/MatchCompetences";
import { AdminPanel } from "./components/admin/AdminPanel";
import { getCurrentUserRole } from "./utils/admin";

type CompetenceRow = { id: string; name: string; level: number };

function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [user, setUser] = useState<User | null>(null);
  const [competences, setCompetences] = useState<CompetenceRow[]>([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [existingCompetences, setExistingCompetences] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [competenceMatrix, setCompetenceMatrix] = useState<{
    [competenceName: string]: { [userId: string]: number };
  }>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Check if user's email domain is allowed
        const ALLOWED_DOMAIN = "geisli.se";
        const email = u.email || "";
        const verified = u.emailVerified;

        if (!verified) {
          alert(
            `Please verify your email address before accessing the application.`
          );
          await signOut(auth);
          return;
        }

        if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
          alert(
            `Access restricted to ${ALLOWED_DOMAIN} accounts only.\n\nPlease sign in with your company email address.`
          );
          await signOut(auth);
          return;
        }
      }
      setUser(u);
    });

    // Handle redirect result on app initialization
    getRedirectResult(auth)
      .then(() => null)
      .catch((error) => {
        console.error("Redirect result error:", error);
      });

    // Listen for custom tab switch events
    const handleTabSwitch = (event: CustomEvent) => {
      setCurrentTab(event.detail);
    };
    window.addEventListener("switchTab", handleTabSwitch as EventListener);

    return () => {
      unsub();
      window.removeEventListener("switchTab", handleTabSwitch as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setTimeout(() => {
        setCompetences([]);
        setExistingCompetences([]);
        setCategories([]);
      }, 0);
      return;
    }
    const unsubCompetences = subscribeToUserCompetences(user.uid, (rows) =>
      setCompetences(rows)
    );
    const unsubCategories = subscribeToSharedCategories((cats: Category[]) =>
      setCategories(cats)
    );
    return () => {
      unsubCompetences();
      unsubCategories();
    };
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch competences
        const competences = await getAllCompetencesForAutocomplete();
        setExistingCompetences(competences);

        // Check if current user is admin
        const userRole = await getCurrentUserRole();
        setIsAdmin(userRole?.isAdmin || false);

        // Fetch competence matrix
        const users = await getAllUsersCompetences();
        const matrix: { [key: string]: { [key: string]: number } } = {};
        users.users.forEach((userData) => {
          userData.competences.forEach((comp) => {
            if (!matrix[comp.name]) {
              matrix[comp.name] = {};
            }
            matrix[comp.name][userData.userId] = comp.level;
          });
        });
        setCompetenceMatrix(matrix);
      } catch {
        setExistingCompetences([]);
      }
    };

    fetchData();
  }, [user, categories]);

  const persistAll = async (rows: CompetenceRow[]) => {
    if (!user) return;
    try {
      const ownerName = user.displayName || user.email || "unknown";
      await saveUserCompetences(user.uid, ownerName, rows);
    } catch (_error) {
      console.error("Failed to save competences to database:", _error);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      // Log the initial popup error and fall back to redirect
      console.error("Popup login failed", err);
      try {
        // Fallback to redirect if popup fails
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectErr) {
        console.error("Login failed", redirectErr);
        alert("Login failed. Please try again.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed", err);
      alert("Logout failed. Check console for details.");
    }
  };

  return (
    <Container
      maxWidth={false}
      sx={{ py: isMobile ? "5px" : 4, px: isMobile ? "5px" : 2 }}
    >
      <Stack spacing={isMobile ? 1 : 3}>
        {!user ? (
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{ mb: 4 }}
              className="mobile-title"
            >
              Competence Matrix
            </Typography>
            <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
              <img
                src="/matrix.png"
                alt="Competence Matrix"
                className="mobile-image"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  maxHeight: "300px",
                  borderRadius: "8px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                }}
              />
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2, fontStyle: "italic" }}
              >
                Only verified @geisli.se accounts are allowed
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleLogin}
                className="mobile-login-button"
              >
                Login with Google
              </Button>
            </Box>
          </Box>
        ) : (
          <Paper elevation={1} sx={{ width: "100%" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: 1,
                borderColor: "divider",
              }}
              className="mobile-logout-container"
            >
              <Tabs
                value={currentTab}
                onChange={(_, newValue) => setCurrentTab(newValue)}
                className="mobile-tabs"
              >
                <Tab label={isMobile ? "Overview" : "Team Overview"} />
                <Tab label={isMobile ? "Manage" : "Manage Competences"} />
                <Tab label="My Competences" />
                <Tab label="CV" />
                <Tab label="Match Competences" />
                {isAdmin && <Tab label="Admin" />}
              </Tabs>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleLogout}
                sx={{ mr: 2 }}
                className="mobile-logout-button"
              >
                Logout
              </Button>
            </Box>

            <Box sx={{ p: 2 }} className="mobile-tab-panel">
              {currentTab === 0 && <CompetenceOverview />}
              {currentTab === 1 && (
                <Stack spacing={4}>
                  <CategoryManagement
                    user={user}
                    competenceMatrix={competenceMatrix}
                  />
                  <CompetenceMapping
                    existingCompetences={existingCompetences}
                    categories={categories}
                    user={user}
                  />
                </Stack>
              )}
              {currentTab === 2 && (
                <>
                  <CompetenceTable
                    competences={competences}
                    onChange={setCompetences}
                    onSave={persistAll}
                    existingCompetences={existingCompetences}
                  />
                </>
              )}
              {currentTab === 3 && (
                <CVManagement
                  user={user}
                  existingCompetences={existingCompetences}
                />
              )}
              {currentTab === 4 && (
                <MatchCompetences />
              )}
              {currentTab === 5 && isAdmin && <AdminPanel />}
            </Box>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}

export default App;
