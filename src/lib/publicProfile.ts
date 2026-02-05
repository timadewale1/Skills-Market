import { doc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type PublicTalentProfile = {
  uid: string
  fullName: string
  location?: string
  roleTitle?: string
  photoURL?: string
  hourlyRate?: number | null
  bio?: string
  skills?: string[]
  languages?: string[]
  education?: any[]
  certifications?: any[]
  employment?: any[]
  socials?: {
    linkedin?: string
    twitter?: string
    github?: string
    instagram?: string
    website?: string
  }
  portfolio?: {
    id: string
    title: string
    description?: string
    coverUrl?: string
    fileUrl?: string | null
    linkUrl?: string | null
  }[]
  rating?: { avg?: number; count?: number }
  verification?: { status?: "not_submitted" | "pending" | "verified" | "rejected" }
  sdgTags?: string[]
  slug?: string
  // Nested structures for details page
  talent?: {
    roleTitle?: string
    skills?: string[]
  }
  publicProfile?: {
    photoURL?: string
    hourlyRate?: number | null
    bio?: string
    portfolio?: any[]
    socials?: any
    education?: any[]
    certifications?: any[]
    employment?: any[]
    categories?: string[]
    languages?: string[]
  }
}

export async function fetchPublicTalent(uid: string): Promise<PublicTalentProfile | null> {
const snap = await getDoc(doc(db, "publicProfiles", uid))
  if (!snap.exists()) return null

  const d: any = snap.data()

  // ✅ Public fields only (do NOT leak KYC)
  const p = d?.publicProfile || {}
  const talent = d?.talent || {}


  return {
    uid,
    fullName: d?.fullName || "Unnamed Talent",
    location: d?.location || "",
    roleTitle: talent?.roleTitle || "",
    photoURL: p?.photoURL || "",
    hourlyRate: p?.hourlyRate ?? null,
    bio: p?.bio || "",
    skills: talent?.skills || [],
    languages: p?.languages || [],
    education: p?.education || [],
    certifications: p?.certifications || [],
    employment: p?.employment || [],
    socials: p?.socials || {},
    portfolio: p?.portfolio || [],
    rating: d?.rating || { avg: 0, count: 0 },
    verification: d?.verification || { status: "not_submitted" },
    sdgTags: d?.sdgTags || [],
    slug: d?.slug,
  }
}

export async function fetchPublicTalentBySlug(slugOrUid: string): Promise<PublicTalentProfile | null> {
  // Try by slug first
  const q1 = query(
    collection(db, "publicProfiles"),
    where("slug", "==", slugOrUid),
    limit(1)
  )
  const s1 = await getDocs(q1)
  if (!s1.empty) {
    const d: any = s1.docs[0].data()
    const p = d?.publicProfile || {}
    const talent = d?.talent || {}

    return {
      uid: d.uid,
      fullName: d?.fullName || "Unnamed Talent",
      location: d?.location || "",
      roleTitle: talent?.roleTitle || "",
      photoURL: p?.photoURL || "",
      hourlyRate: p?.hourlyRate ?? null,
      bio: p?.bio || "",
      skills: talent?.skills || [],
      languages: p?.languages || [],
      education: p?.education || [],
      certifications: p?.certifications || [],
      employment: p?.employment || [],
      socials: p?.socials || {},
      portfolio: p?.portfolio || [],
      rating: d?.rating || { avg: 0, count: 0 },
      verification: d?.verification || { status: "not_submitted" },
      sdgTags: d?.sdgTags || [],
      slug: d?.slug,
    }
  }

  // Fallback: allow old uid links
  const q2 = query(
    collection(db, "publicProfiles"),
    where("uid", "==", slugOrUid),
    limit(1)
  )
  const s2 = await getDocs(q2)
  if (!s2.empty) {
    const d: any = s2.docs[0].data()
    const p = d?.publicProfile || {}
    const talent = d?.talent || {}

    return {
      uid: d.uid,
      fullName: d?.fullName || "Unnamed Talent",
      location: d?.location || "",
      roleTitle: talent?.roleTitle || "",
      photoURL: p?.photoURL || "",
      hourlyRate: p?.hourlyRate ?? null,
      bio: p?.bio || "",
      skills: talent?.skills || [],
      languages: p?.languages || [],
      education: p?.education || [],
      certifications: p?.certifications || [],
      employment: p?.employment || [],
      socials: p?.socials || {},
      portfolio: p?.portfolio || [],
      rating: d?.rating || { avg: 0, count: 0 },
      verification: d?.verification || { status: "not_submitted" },
      sdgTags: d?.sdgTags || [],
      slug: d?.slug,
    }
  }

  return null
}
