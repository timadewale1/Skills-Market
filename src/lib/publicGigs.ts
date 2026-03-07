import { collection, getDocs, query, where, limit, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type PublicGig = {
  id: string
  title: string
  status: "open" | "closed"
  category?: { group?: string; item?: string }
  sdgTags?: string[]
  requiredSkills?: string[]
  workMode?: "Remote" | "Hybrid" | "On-site"
  location?: string
  budgetType?: "hourly" | "fixed"
  hourlyRate?: number | null
  fixedBudget?: number | null
  duration?: string
  experienceLevel?: string
  description?: string
  clientName?: string
  clientOrgName?: string
  clientUid?: string
  createdAt?: any
}

export async function fetchPublicGigs(limitCount: number = 20): Promise<PublicGig[]> {
  const q = query(
    collection(db, "gigs"),
    where("status", "==", "open"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as PublicGig))
}