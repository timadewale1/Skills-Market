import { db } from "@/lib/firebase"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"

export function slugifyName(name: string, uid?: string) {
  const base = (name || "talent")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  // A name is display data, not an identifier. Keep readable URLs while making new slugs unique.
  return uid ? `${base || "profile"}-${uid.slice(-8)}` : base
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
