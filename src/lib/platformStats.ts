"use client"

import { collection, doc, getDoc, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type PlatformStats = {
  freelancers: number
  clients: number
  projects: number
  satisfaction: number
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  let freelancersCount = 0
  let clientsCount = 0
  let projectsCount = 0

  try {
    const statsDoc = await getDoc(doc(db, "publicStats", "platform"))
    if (statsDoc.exists()) {
      const statsData = statsDoc.data() as any
      freelancersCount = statsData.freelancers || 0
      clientsCount = statsData.clients || 0
      projectsCount = statsData.gigs || 0
    } else {
      const publicProfilesSnap = await getDocs(collection(db, "publicProfiles"))
      freelancersCount = publicProfilesSnap.docs.filter((snap) => snap.data().role === "talent").length
      clientsCount = publicProfilesSnap.docs.filter((snap) => snap.data().role === "client").length
    }
  } catch (error) {
    console.error("platform stats lookup failed", error)
  }

  try {
    const gigsSnap = await getDocs(collection(db, "gigs"))
    projectsCount = gigsSnap.size
  } catch (error) {
    console.error("gigs count failed", error)
  }

  return {
    freelancers: freelancersCount,
    clients: clientsCount,
    projects: projectsCount,
    satisfaction: 98,
  }
}
