import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import type { Unsubscribe } from 'firebase/firestore'

// Vite environment variables must be prefixed with VITE_
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and provider
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)

// Shared types
export type CompetenceRow = { id: string; name: string; level: number }

// Subscribe to a single user document that contains the competences array
export function subscribeToUserCompetences(
  userId: string,
  onChange: (rows: CompetenceRow[]) => void,
): Unsubscribe {
  const userDocRef = doc(db, 'users', userId)
  return onSnapshot(userDocRef, (snap) => {
    const data = (snap.data() as any) || {}
    const rows: CompetenceRow[] = Array.isArray(data.competences)
      ? data.competences.map((r: any) => ({
          id: String(r.id || ''),
          name: String(r.name || ''),
          level: Number(r.level || 1),
        }))
      : []
    onChange(rows)
  })
}

// Persist entire competences array for a user. Filters out empty names.
export async function saveUserCompetences(
  userId: string,
  ownerName: string,
  rows: CompetenceRow[],
): Promise<void> {
  const cleaned = rows
    .filter((r) => r.name && r.name.trim().length > 0)
    .map((r) => ({ id: r.id, name: r.name.trim(), level: Math.min(4, Math.max(1, r.level)) }))

  const userDocRef = doc(db, 'users', userId)
  await setDoc(
    userDocRef,
    { ownerName, competences: cleaned, updatedAt: serverTimestamp() },
    { merge: true },
  )
}

// Fetch all users and their competences for overview
export async function getAllUsersCompetences(): Promise<{
  users: { userId: string; ownerName: string; competences: CompetenceRow[] }[]
  allCompetences: string[]
}> {
  const { collection, getDocs } = await import('firebase/firestore')
  
  const usersCollection = collection(db, 'users')
  const snapshot = await getDocs(usersCollection)
  
  const users: { userId: string; ownerName: string; competences: CompetenceRow[] }[] = []
  const competenceSet = new Set<string>()
  
  snapshot.forEach((doc) => {
    const data = doc.data()
    const competences: CompetenceRow[] = Array.isArray(data.competences)
      ? data.competences.map((r: any) => ({
          id: String(r.id || ''),
          name: String(r.name || ''),
          level: Number(r.level || 1),
        }))
      : []
    
    users.push({
      userId: doc.id,
      ownerName: data.ownerName || 'Unknown User',
      competences
    })
    
    // Collect all unique competence names
    competences.forEach(comp => {
      if (comp.name.trim()) {
        competenceSet.add(comp.name.trim())
      }
    })
  })
  
  const allCompetences = Array.from(competenceSet).sort()
  
  return { users, allCompetences }
}
