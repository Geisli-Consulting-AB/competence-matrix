import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  FieldValue,
  documentId,
  type Unsubscribe,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type UploadTaskSnapshot,
} from "firebase/storage";

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
export const storage = getStorage(app);

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

/**
 * Recursively sanitize data for Firestore by removing undefined values,
 * functions, and other non-serializable data.
 */
function sanitizeForFirestore(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (typeof obj === "function") {
    return null;
  }

  if (obj instanceof Date) {
    return obj;
  }

  if (obj instanceof File || obj instanceof Blob) {
    // Don't allow File or Blob objects in Firestore
    return null;
  }

  if (Array.isArray(obj)) {
    return obj
      .map((item) => sanitizeForFirestore(item))
      .filter((item) => item !== null && item !== undefined);
  }

  if (typeof obj === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const sanitized = sanitizeForFirestore(value);
      if (sanitized !== null && sanitized !== undefined) {
        cleaned[key] = sanitized;
      }
    }
    return cleaned;
  }

  // Primitive values (string, number, boolean)
  return obj;
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

  // Build the payload conservatively so we never overwrite existing fields unintentionally.
  // - Only set `name` and `language` if explicitly provided, or when creating a brand-new CV.
  // - For `data`, write into nested field paths (e.g., `data.title`) so we don't replace the whole map.
  const payload: Partial<CVDoc> & Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  // Handle name
  if (cv.name !== undefined) {
    payload.name = cv.name || "Untitled CV";
  } else if (isNew) {
    payload.name = "Untitled CV";
  }

  // Handle language
  if (cv.language !== undefined) {
    payload.language = cv.language || "en";
  } else if (isNew) {
    payload.language = "en";
  }

  // Handle data: build a nested map so Firestore can merge it properly.
  // Avoid using dotted paths with setDoc (which would create keys like "data.title").
  if (cv.data !== undefined && cv.data && typeof cv.data === "object") {
    // Sanitize the data to remove any non-serializable values
    const sanitized = sanitizeForFirestore(cv.data) as Record<string, unknown>;
    const dataMap: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(sanitized)) {
      if (v === undefined) continue; // skip undefined to avoid clearing
      dataMap[k] = v;
    }
    if (Object.keys(dataMap).length > 0) {
      (payload as Partial<CVDoc>).data = {
        ...((payload as Partial<CVDoc>).data as Record<string, unknown>),
        ...dataMap,
      } as unknown as CVDoc["data"];
    }
    // If caller passed an empty object, do nothing (no-op)
  }

  if (isNew) {
    payload.createdAt = serverTimestamp();
    // Ensure creator/owner email is captured at creation time if not provided
    try {
      const currentData = (payload as Partial<CVDoc>).data as
        | Record<string, unknown>
        | undefined;
      const hasEmail =
        typeof currentData?.email === "string" &&
        (currentData!.email as string).length > 0;
      if (!hasEmail) {
        const ownerEmail =
          (await getUserEmail(userId)) || getAuth().currentUser?.email || null;
        if (ownerEmail) {
          (payload as Partial<CVDoc>).data = {
            ...currentData,
            email: ownerEmail,
          } as unknown as CVDoc["data"];
        }
      }
    } catch (e) {
      console.warn(
        "Could not resolve email for new CV; proceeding without email",
        { userId, cvId: cv.id, error: e }
      );
    }
  }

  try {
    await setDoc(ref, payload, { merge: true });
  } catch (error) {
    console.error("Error saving CV to Firestore:", error);
    throw error;
  }

  // After saving the CV, optionally backfill the global profile documents with
  // displayName/email IF they are currently missing there. This is non-destructive
  // and will never overwrite existing non-empty values.
  try {
    const data = (payload as Partial<CVDoc>).data as
      | Record<string, unknown>
      | undefined;
    const displayNameFromCv = data?.displayName as string | undefined;
    const emailFromCv = data?.email as string | undefined;

    await ensureGlobalProfileNameEmail(userId, displayNameFromCv, emailFromCv);
  } catch (e) {
    console.warn("Non-fatal: failed to backfill global profile name/email", {
      userId,
      cvId: cv.id,
      error: e,
    });
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

// Check if current user is an admin
export async function isAdminUser(
  user: { uid: string } | null
): Promise<boolean> {
  if (!user) return false;

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    return userDoc.exists() && userDoc.data()?.isAdmin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

// Get all admin users
export interface AdminUser {
  userId: string;
  email: string;
  displayName?: string;
}

export async function getAllAdmins(): Promise<AdminUser[]> {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("isAdmin", "==", true));
    const snapshot = await getDocs(q);

    const admins: AdminUser[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isAdmin === true) {
        admins.push({
          userId: doc.id,
          email: data.email || "",
          displayName: data.ownerName || data.displayName,
        });
      }
    });

    // Sort by email for consistent display
    return admins.sort((a, b) => a.email.localeCompare(b.email));
  } catch (error) {
    console.error("Error fetching all admins:", error);
    return [];
  }
}

// Fetch a user's email for creation metadata (used when creating CVs as admin for another user)
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    // Prefer profile.email if present
    const profileSnap = await getDoc(doc(db, "userProfiles", userId));
    const profileEmail = profileSnap.exists()
      ? (profileSnap.data() as { email?: string }).email
      : undefined;
    if (profileEmail) return profileEmail;

    // Fallback to users doc email if stored there
    const userSnap = await getDoc(doc(db, "users", userId));
    const userEmail = userSnap.exists()
      ? (userSnap.data() as { email?: string }).email
      : undefined;
    return userEmail ?? null;
  } catch (error) {
    console.error("Error fetching user email:", { userId, error });
    return null;
  }
}

// Ensure global profile docs contain displayName/email if they are missing.
// This will NOT overwrite existing non-empty values. Safe for both owner and admin.
export async function ensureGlobalProfileNameEmail(
  userId: string,
  displayName?: string,
  email?: string
): Promise<void> {
  // Normalize values
  const nameVal =
    typeof displayName === "string" && displayName.trim().length > 0
      ? displayName.trim()
      : undefined;
  const emailVal =
    typeof email === "string" && email.trim().length > 0
      ? email.trim()
      : undefined;

  if (!nameVal && !emailVal) return; // nothing to do

  // Helper to check empty string / missing
  const isMissing = (v: unknown) =>
    v == null || (typeof v === "string" && v.trim().length === 0);

  // Backfill userProfiles/{userId}
  try {
    const profileRef = doc(db, "userProfiles", userId);
    const profileSnap = await getDoc(profileRef);
    const pdata = profileSnap.exists()
      ? (profileSnap.data() as {
          ownerName?: string;
          displayName?: string;
          email?: string;
        })
      : {};
    const toSet: Record<string, unknown> = {};
    // Global field is ownerName; backfill it if missing regardless of displayName.
    if (nameVal && isMissing(pdata.ownerName)) toSet.ownerName = nameVal;
    if (emailVal && isMissing(pdata.email)) toSet.email = emailVal;
    if (Object.keys(toSet).length > 0) {
      await setDoc(profileRef, toSet, { merge: true });
    }
  } catch (e) {
    // Non-fatal; just log
    console.warn("Failed to backfill userProfiles with ownerName/email", {
      userId,
      error: e,
    });
  }

  // Backfill users/{userId}
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const udata = userSnap.exists()
      ? (userSnap.data() as {
          ownerName?: string;
          displayName?: string;
          email?: string;
        })
      : {};
    const toSet: Record<string, unknown> = {};
    // Global field is ownerName; backfill it if missing regardless of displayName.
    if (nameVal && isMissing(udata.ownerName)) toSet.ownerName = nameVal;
    if (emailVal && isMissing(udata.email)) toSet.email = emailVal;
    if (Object.keys(toSet).length > 0) {
      await setDoc(userRef, toSet, { merge: true });
    }
  } catch (e) {
    console.warn("Failed to backfill users doc with ownerName/email", {
      userId,
      error: e,
    });
  }
}

// ===== Profile Image Management (Firebase Storage) =====

/**
 * Upload a profile image to Firebase Storage and return the download URL.
 * Images are stored at: profile-images/{userId}/{timestamp}-{filename}
 */
export async function uploadProfileImage(
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Generate a unique filename with timestamp
  const timestamp = Date.now();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `profile-images/${userId}/${timestamp}-${safeFilename}`;

  const storageRef = ref(storage, storagePath);
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    cacheControl: "public, max-age=31536000", // Cache for 1 year
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        if (onProgress) {
          const { bytesTransferred, totalBytes } = snapshot;
          let progress = 0;

          if (totalBytes > 0) {
            progress = (bytesTransferred / totalBytes) * 100;
          }

          if (!Number.isFinite(progress) || Number.isNaN(progress)) {
            progress = 0;
          }

          onProgress(progress);
        }
      },
      (error) => {
        console.error("Error uploading profile image:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          console.error("Error getting download URL:", error);
          reject(error);
        }
      }
    );
  });
}

/**
 * Delete a profile image from Firebase Storage given its download URL.
 * Extracts the storage path from the URL and deletes the file.
 */
export async function deleteProfileImage(downloadUrl: string): Promise<void> {
  try {
    // Extract the storage path from the download URL
    // Firebase Storage URLs format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?...
    const url = new URL(downloadUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)/);

    if (!pathMatch || !pathMatch[1]) {
      console.warn("Could not extract storage path from URL:", downloadUrl);
      return;
    }

    // Decode the path (Firebase encodes slashes as %2F)
    const storagePath = decodeURIComponent(pathMatch[1]);

    // Only delete if it's in the profile-images directory
    if (!storagePath.startsWith("profile-images/")) {
      console.warn(
        "Refusing to delete file outside profile-images directory:",
        storagePath
      );
      return;
    }

    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    console.log("Successfully deleted profile image:", storagePath);
  } catch (error) {
    // Don't throw on delete errors - the file might already be deleted
    console.warn("Error deleting profile image:", error);
  }
}

// Get all CVs from all users (admin only)
export async function getAllCVs(): Promise<
  Array<{
    id: string;
    name: string;
    language?: "en" | "sv";
    userId: string;
    ownerName: string;
    // Include the full CV data so admin selection can hydrate the UI
    data?: unknown;
  }>
> {
  const currentUser = getAuth().currentUser;
  if (!currentUser) {
    throw new Error("Authentication required");
  }

  const isAdmin = await isAdminUser(currentUser);
  if (!isAdmin) {
    throw new Error("Admin access required");
  }

  try {
    // Get all users (admin can query users collection)
    const usersSnapshot = await getDocs(collection(db, "users"));

    // Process users in parallel
    const cvPromises = usersSnapshot.docs.map(async (userDoc) => {
      const userId = userDoc.id;
      const userData = userDoc.data();

      try {
        // Get user's profile for display name
        const profileDoc = await getDoc(doc(db, "userProfiles", userId));
        const profileData = profileDoc.data() || {};

        // Get CVs for this user
        const cvsSnapshot = await getDocs(
          collection(db, "users", userId, "cvs")
        );
        return cvsSnapshot.docs.map((cvDoc) => {
          // Try to get the owner name from different possible fields
          const ownerName =
            userData.ownerName || // First try ownerName in user document
            profileData.ownerName || // Then try ownerName in profile
            profileData.displayName || // Then try displayName in profile
            userData.displayName || // Then try displayName in user document
            userData.email?.split("@")[0] || // Then use email prefix
            "User"; // Fallback

          return {
            id: cvDoc.id,
            name: cvDoc.data().name || "Untitled CV",
            language: cvDoc.data().language || "en",
            userId,
            ownerName,
            // Pass through the stored CV payload so the consumer can render that user's data
            data: cvDoc.data().data ?? {},
          };
        });
      } catch (error) {
        console.error(`Error processing CVs for user ${userId}:`, error);
        return [];
      }
    });

    // Wait for all CVs to be fetched and flatten the array
    const results = await Promise.all(cvPromises);
    return results.flat();
  } catch (error) {
    console.error("Error fetching CVs:", error);
    throw error;
  }
}

// Fetch a single CV document for a specific user (admin or owner)
export async function getUserCv(
  userId: string,
  cvId: string
): Promise<{
  id: string;
  name: string;
  language?: "en" | "sv";
  userId: string;
  data?: unknown;
} | null> {
  try {
    const ref = doc(db, "users", userId, "cvs", cvId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const d = snap.data() as
      | { name?: string; language?: "en" | "sv"; data?: unknown }
      | undefined;
    return {
      id: cvId,
      name: (d?.name || "Untitled CV") as string,
      language: (d?.language || "en") as "en" | "sv",
      userId,
      data: (d?.data as unknown) ?? {},
    };
  } catch (error) {
    console.error("Error fetching user CV:", { userId, cvId, error });
    return null;
  }
}
