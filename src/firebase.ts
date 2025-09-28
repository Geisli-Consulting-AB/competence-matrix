import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
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
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Add domain hint to encourage users to use their work email
googleProvider.setCustomParameters({
  hd: 'geisli.se', // Domain hint for Google Workspace
  prompt: 'select_account' // Always show account selection
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
  onChange: (rows: CompetenceRow[]) => void,
): Unsubscribe {
  const userDocRef = doc(db, "users", userId);
  return onSnapshot(userDocRef, (snap) => {
    const data = (snap.data() as any) || {};
    const rows: CompetenceRow[] = Array.isArray(data.competences)
      ? data.competences.map((r: any) => ({
          id: String(r.id || ""),
          name: String(r.name || ""),
          level: Number(r.level || 1),
        }))
      : [];
    onChange(rows);
  });
}

// Persist entire competences array for a user. Allows empty names for new competences.
export async function saveUserCompetences(
  userId: string,
  ownerName: string,
  rows: CompetenceRow[],
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
    { merge: true },
  );
}

// Fetch all users and their competences for overview
export async function getAllUsersCompetences(): Promise<{
  users: { userId: string; ownerName: string; competences: CompetenceRow[] }[];
  allCompetences: string[];
}> {
  const { collection, getDocs } = await import("firebase/firestore");

  const usersCollection = collection(db, "users");
  const snapshot = await getDocs(usersCollection);

  const users: {
    userId: string;
    ownerName: string;
    competences: CompetenceRow[];
  }[] = [];
  const competenceSet = new Set<string>();

  snapshot.forEach((doc) => {
    const data = doc.data();
    const competences: CompetenceRow[] = Array.isArray(data.competences)
      ? data.competences.map((r: any) => ({
          id: String(r.id || ""),
          name: String(r.name || ""),
          level: Number(r.level || 1),
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

// Category management functions
export async function saveUserCategories(
  userId: string,
  categories: Category[],
): Promise<void> {
  console.log("Firebase: Saving categories for user", userId, ":", categories);

  // Clean categories data
  const cleanedCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    competences: cat.competences,
    color: cat.color,
  }));

  const categoriesDocRef = doc(db, "categories", userId);
  await setDoc(
    categoriesDocRef,
    { categories: cleanedCategories, updatedAt: serverTimestamp() },
    { merge: true },
  );
  console.log("Firebase: Categories saved successfully");
}

export function subscribeToUserCategories(
  userId: string,
  onChange: (categories: Category[]) => void,
): Unsubscribe {
  console.log("Firebase: Subscribing to categories for user", userId);
  const categoriesDocRef = doc(db, "categories", userId);
  return onSnapshot(categoriesDocRef, (snap) => {
    console.log(
      "Firebase: Received snapshot for user",
      userId,
      ":",
      snap.data(),
    );
    const data = (snap.data() as any) || {};
    const categories: Category[] = Array.isArray(data.categories)
      ? data.categories.map((cat: any) => ({
          id: String(cat.id || ""),
          name: String(cat.name || ""),
          competences: Array.isArray(cat.competences)
            ? cat.competences.map((c: any) => String(c))
            : [],
          color: String(cat.color || "#FF6B6B"),
        }))
      : [];
    console.log("Firebase: Parsed categories:", categories);
    onChange(categories);
  });
}
