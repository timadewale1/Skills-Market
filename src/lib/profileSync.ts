import { db } from "@/lib/firebase"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"

export function slugifyName(name: string) {
  return (name || "talent")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export async function syncPublicProfile(uid: string, patch: any) {
  // patch contains safe/public fields only
  await setDoc(
    doc(db, "publicProfiles", uid),
    {
      ...patch,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}
