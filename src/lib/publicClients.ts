// src/lib/publicClients.ts
import { db } from "@/lib/firebase"
import {
  collection,
  getDocs,
  getDoc,
  doc,
  limit,
  query,
  where,
} from "firebase/firestore"

export type ClientPortfolioItem = {
  id: string
  title?: string
  description?: string
  coverUrl?: string
  linkUrl?: string | null
  fileUrl?: string | null
  createdAt?: any
  updatedAt?: any
}

export type PublicClientProfile = {
  uid: string
  role: "client"
  slug: string

  fullName?: string
  location?: string
  sdgTags?: string[]
  categories?: string[]

  // client-specific fields in your publicProfiles
  orgProfile?: {
    about?: string
    categories?: string[]
    contactEmail?: string
    contactPhone?: string
    industries?: string[]
    portfolio?: ClientPortfolioItem[]
    socials?: {
      website?: string
      linkedin?: string
      instagram?: string
      twitter?: string
    }
  }

  rating?: { avg?: number; count?: number }
  verification?: { status?: string }

  // sometimes present but may be empty
  publicProfile?: {
    photoURL?: string
    portfolio?: ClientPortfolioItem[]
    socials?: {
      website?: string
      linkedin?: string
      instagram?: string
      twitter?: string
    }
    categories?: string[]
  }

  // fallback (often present in users but NOT in publicProfiles)
  photoUrl?: string
}

export function pickClientPhoto(p: any) {
  return (
    p?.photoUrl ||
    p?.publicProfile?.photoURL ||
    "" // keep empty, UI will fallback to initial
  )
}

export function pickClientAbout(p: any) {
  return (
    p?.orgProfile?.about ||
    "" // no about
  )
}

export function pickClientCategories(p: any): string[] {
  return (
    p?.orgProfile?.categories ||
    p?.categories ||
    p?.publicProfile?.categories ||
    []
  )
}

export function pickClientPortfolio(p: any): ClientPortfolioItem[] {
  return (
    p?.orgProfile?.portfolio ||
    p?.publicProfile?.portfolio ||
    []
  )
}

export function pickClientSocials(p: any) {
  return (
    p?.orgProfile?.socials ||
    p?.publicProfile?.socials ||
    {}
  )
}

export async function fetchPublicClientBySlug(slug: string) {
  const qy = query(
    collection(db, "publicProfiles"),
    where("role", "==", "client"),
    where("slug", "==", slug),
    limit(1)
  )
  const snap = await getDocs(qy)
  if (snap.empty) return null
  return snap.docs[0].data() as PublicClientProfile
}

export async function fetchPublicClientByUid(uid: string) {
  const snap = await getDoc(doc(db, "publicProfiles", uid))
  return snap.exists() ? (snap.data() as PublicClientProfile) : null
}
