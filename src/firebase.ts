import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  doc,
  Timestamp,
  FieldValue,
  onSnapshot,
  setDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  documentId,
} from "firebase/firestore";
import type { Unsubscribe } from "firebase/firestore";

// Vite environment variables must be prefixed with VITE_
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env
    .VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Add domain hint to encourage users to use their work email
googleProvider.setCustomParameters({
  hd: "geisli.se", // Domain hint for Google Workspace
  prompt: "select_account", // Always show account selection
});

export const db = getFirestore(app);

// Shared types
export type CompetenceRow = { id: string; name: string; level: number };
export type Category = {
  id: string;
  name: string;
  competences: string[];
  color: string;
};

// Subscribe to a single user document that contains the competences array
export function subscribeToUserCompetences(
  userId: string,
  onChange: (rows: CompetenceRow[]) => void
): Unsubscribe {
  const userDocRef = doc(db, "users", userId);
  type RawCompetence = { id?: unknown; name?: unknown; level?: unknown };
  return onSnapshot(userDocRef, (snap) => {
    const data = (snap.data() || {}) as { competences?: RawCompetence[] };
    const rows: CompetenceRow[] = Array.isArray(data.competences)
      ? data.competences.map((r: RawCompetence) => ({
          id: String(r.id ?? ""),
          name: String(r.name ?? ""),
          level: Number(r.level ?? 1),
        }))
      : [];
    onChange(rows);
  });
}

// Persist entire competences array for a user. Allows empty names for new competences.
export async function saveUserCompetences(
  userId: string,
  ownerName: string,
  rows: CompetenceRow[]
): Promise<void> {
  const cleaned = rows.map((r) => ({
    id: r.id,
    name: r.name.trim(),
    level: Math.min(4, Math.max(1, r.level)),
  }));

  const userDocRef = doc(db, "users", userId);
  await setDoc(
    userDocRef,
    { ownerName, competences: cleaned, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// Fetch all users and their competences for overview
export async function getAllUsersCompetences(): Promise<{
  users: { userId: string; ownerName: string; competences: CompetenceRow[] }[];
  allCompetences: string[];
}> {
  const usersCollection = collection(db, "users");
  const snapshot = await getDocs(usersCollection);

  const users: {
    userId: string;
    ownerName: string;
    competences: CompetenceRow[];
  }[] = [];
  const competenceSet = new Set<string>();

  type RawCompetence = { id?: unknown; name?: unknown; level?: unknown };
  snapshot.forEach((doc) => {
    const data = doc.data() as {
      ownerName?: string;
      competences?: RawCompetence[];
    };
    const competences: CompetenceRow[] = Array.isArray(data.competences)
      ? data.competences.map((r: RawCompetence) => ({
          id: String(r.id ?? ""),
          name: String(r.name ?? ""),
          level: Number(r.level ?? 1),
        }))
      : [];

    // Sort competences alphabetically by name
    competences.sort((a, b) => a.name.localeCompare(b.name));

    users.push({
      userId: doc.id,
      ownerName: data.ownerName || "Unknown User",
      competences,
    });

    // Collect all unique competence names (excluding empty names)
    competences.forEach((comp) => {
      if (comp.name && comp.name.trim()) {
        competenceSet.add(comp.name.trim());
      }
    });
  });

  const allCompetences = Array.from(competenceSet).sort();

  // Sort users alphabetically by ownerName
  users.sort((a, b) => a.ownerName.localeCompare(b.ownerName));

  return { users, allCompetences };
}

// Get all competences from users and shared categories
export async function getAllCompetencesForAutocomplete(): Promise<string[]> {
  const competenceSet = new Set<string>();

  try {
    // 1. Get competences from users collection
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);

    type RawCompetence = { id?: unknown; name?: unknown; level?: unknown };
    usersSnapshot.forEach((doc) => {
      const data = doc.data() as { competences?: RawCompetence[] };
      const competences: CompetenceRow[] = Array.isArray(data.competences)
        ? data.competences.map((r: RawCompetence) => ({
            id: String(r.id ?? ""),
            name: String(r.name ?? ""),
            level: Number(r.level ?? 1),
          }))
        : [];

      // Add user competences to set
      competences.forEach((comp) => {
        if (comp.name && comp.name.trim()) {
          competenceSet.add(comp.name.trim());
        }
      });
    });
  } catch (error) {
    console.error("Error fetching from users collection:", error);
  }

  try {
    // 2. Get competences from shared categories collection
    const sharedCategoriesCollection = collection(db, "sharedCategories");
    const sharedCategoriesSnapshot = await getDocs(sharedCategoriesCollection);

    sharedCategoriesSnapshot.forEach((doc) => {
      const data = doc.data();
      if (Array.isArray(data.competences)) {
        data.competences.forEach((competenceName: string) => {
          if (competenceName && competenceName.trim()) {
            competenceSet.add(competenceName.trim());
          }
        });
      }
    });
  } catch (error) {
    console.error("Error fetching from shared categories collection:", error);
  }

  return Array.from(competenceSet).sort();
}

// Shared category management functions
export async function saveSharedCategory(category: Category): Promise<void> {
  // Clean category data
  const cleanedCategory = {
    id: category.id,
    name: category.name,
    competences: category.competences,
    color: category.color,
    updatedAt: serverTimestamp(),
  };

  const categoryDocRef = doc(db, "sharedCategories", category.id);
  await setDoc(categoryDocRef, cleanedCategory);
}

export async function deleteSharedCategory(categoryId: string): Promise<void> {
  const categoryDocRef = doc(db, "sharedCategories", categoryId);
  await deleteDoc(categoryDocRef);
}

export function subscribeToSharedCategories(
  onChange: (categories: Category[]) => void
): Unsubscribe {
  const categoriesCollection = collection(db, "sharedCategories");
  const categoriesQuery = query(categoriesCollection, orderBy("name"));

  return onSnapshot(
    categoriesQuery,
    (snapshot) => {
      const categories: Category[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as {
          id?: unknown;
          name?: unknown;
          competences?: unknown[];
          color?: unknown;
        };
        categories.push({
          id: String((data.id ?? doc.id) as string),
          name: String(data.name ?? ""),
          competences: Array.isArray(data.competences)
            ? data.competences.map((c) => String(c))
            : [],
          color: String(data.color ?? "#FF6B6B"),
        });
      });
      onChange(categories);
    },
    (error) => {
      console.error("Error in subscribeToSharedCategories:", error);
      // Return empty array on error to prevent app crashes
      onChange([]);
    }
  );
}

// ===== CV management (users/{userId}/cvs subcollection) =====
export interface CVDoc {
  id: string;
  name: string;
  language?: "en" | "sv";
  data?: unknown; // CV data structure defined in the CV editor
  createdAt?: Timestamp | FieldValue; // Can be either Timestamp (when reading) or FieldValue (when writing)
  updatedAt?: Timestamp | FieldValue; // Can be either Timestamp (when reading) or FieldValue (when writing)
}

// Realtime subscribe to a user's CVs
export function subscribeToUserCVs(
  userId: string,
  onChange: (rows: CVDoc[]) => void
): Unsubscribe {
  const colRef = collection(db, "users", userId, "cvs");
  // Order CVs by creation time, then by document ID for a stable tiebreaker.
  // Using document ID prevents reordering when the CV name changes.
  const qRef = query(
    colRef,
    orderBy("createdAt", "asc"),
    orderBy(documentId(), "asc")
  );
  return onSnapshot(qRef, (snap) => {
    const rows: CVDoc[] = snap.docs.map((d) => {
      const data = d.data() as {
        name?: unknown;
        data?: unknown;
        language?: unknown;
      };
      return {
        id: d.id,
        name: String(data?.name ?? ""),
        language: data?.language as "en" | "sv" | undefined,
        data: (data?.data as unknown) ?? undefined,
      };
    });
    onChange(rows);
  });
}

// Create or update a CV document immediately
export async function saveUserCV(
  userId: string,
  cv: { id: string; name?: string; language?: "en" | "sv"; data?: unknown },
  isNew?: boolean
): Promise<void> {
  const ref = doc(db, "users", userId, "cvs", cv.id);
  const payload: Partial<CVDoc> = {
    name: cv.name || "Untitled CV",
    language: cv.language || "en",
    data: cv.data || {},
    updatedAt: serverTimestamp(),
  };

  if (isNew) {
    payload.createdAt = serverTimestamp();
  }

  try {
    await setDoc(ref, payload, { merge: true });
  } catch (error) {
    console.error("Error saving CV to Firestore:", error);
    throw error;
  }
}

// Delete a CV document
export async function deleteUserCV(
  userId: string,
  cvId: string
): Promise<void> {
  const ref = doc(db, "users", userId, "cvs", cvId);
  await deleteDoc(ref);
}
