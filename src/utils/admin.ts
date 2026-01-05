import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../firebase";

export interface UserRole {
  isAdmin: boolean;
  email: string;
  displayName?: string;
  lastUpdated?: Date;
}

/**
 * Set admin status for a user
 * @param userId The ID of the user to update
 * @param isAdmin Whether the user should be an admin
 * @param email The user's email (for display purposes)
 * @param displayName Optional display name for the user
 */
export async function setAdminStatus(
  userId: string,
  isAdmin: boolean,
  email: string,
  displayName?: string
): Promise<void> {
  if (!auth.currentUser) {
    throw new Error("You must be logged in to modify admin status");
  }

  // Check if current user is admin
  const currentUserRef = doc(db, "users", auth.currentUser.uid);
  const currentUserDoc = await getDoc(currentUserRef);

  if (!currentUserDoc.exists() || !currentUserDoc.data()?.isAdmin) {
    throw new Error("Only administrators can modify user roles");
  }

  const userRef = doc(db, "users", userId);

  await setDoc(
    userRef,
    {
      email,
      // Global name field is ownerName
      ownerName: displayName || null,
      isAdmin,
      lastUpdated: serverTimestamp(),
      updatedBy: {
        userId: auth.currentUser.uid,
        email: auth.currentUser.email,
      },
    },
    { merge: true }
  );
}

/**
 * Find a user's UID by their email address.
 * Looks in `userProfiles` first (preferred), then falls back to `users` collection.
 */
export async function findUserByEmail(
  email: string
): Promise<{ userId: string; email: string; displayName?: string } | null> {
  const targetEmail = (email || "").trim();
  if (!targetEmail) return null;

  try {
    // 1) Try userProfiles where email == targetEmail
    const profilesRef = collection(db, "userProfiles");
    const q1 = query(profilesRef, where("email", "==", targetEmail));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const docSnap = snap1.docs[0];
      const data = docSnap.data() as { email?: string; displayName?: string };
      return {
        userId: docSnap.id,
        email: data.email || targetEmail,
        displayName: data.displayName,
      };
    }

    // 2) Fallback: try users where email == targetEmail
    const usersRef = collection(db, "users");
    const q2 = query(usersRef, where("email", "==", targetEmail));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const docSnap = snap2.docs[0];
      const data = docSnap.data() as { email?: string; displayName?: string };
      return {
        userId: docSnap.id,
        email: data.email || targetEmail,
        displayName: data.displayName,
      };
    }

    return null;
  } catch (error) {
    console.error("Error looking up user by email", {
      email: targetEmail,
      error,
    });
    return null;
  }
}

/**
 * Get the current user's role information
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return {
        isAdmin: false,
        email: user.email || "",
        displayName: user.displayName || undefined,
      };
    }

    const data = userDoc.data();
    return {
      isAdmin: !!data?.isAdmin,
      email: data?.email || user.email || "",
      // Prefer global ownerName, then legacy displayName, then auth displayName
      displayName:
        data?.ownerName || data?.displayName || user.displayName || undefined,
      lastUpdated: data?.lastUpdated?.toDate(),
    };
  } catch (error) {
    console.error("Error fetching user role:", error);
    return {
      isAdmin: false,
      email: user.email || "",
      displayName: user.displayName || undefined,
    };
  }
}
