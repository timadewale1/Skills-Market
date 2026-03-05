"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { ensureThread } from "@/lib/chat"
import { Card, CardContent } from "@/components/ui/card"

export default function NewThreadPage() {
  const router = useRouter()
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  useEffect(() => {
    try {
      setSearchParams(new URLSearchParams(window.location.search))
    } catch (e) {
      setSearchParams(null)
    }
  }, [])
  const { user } = useAuth()

  useEffect(() => {
    const run = async () => {
      if (!user?.uid) return

      const gigId = searchParams?.get("gigId") || ""
      const talentUid = searchParams?.get("talentUid") || ""
      const clientUid = searchParams?.get("clientUid") || ""

      if (!gigId || (!talentUid && !clientUid)) return

      // gig
      const gigSnap = await getDoc(doc(db, "gigs", gigId))
      const gig = gigSnap.exists() ? (gigSnap.data() as any) : null
      if (!gig) return router.replace("/dashboard/messages")

      // viewer profile
      const viewerSnap = await getDoc(doc(db, "users", user.uid))
      const viewer = viewerSnap.exists() ? (viewerSnap.data() as any) : null
      const viewerRole = viewer?.role || "talent"

      let finalClientUid = clientUid
      let finalTalentUid = talentUid

      // if client opened, they pass talentUid; if talent opened, they pass clientUid
      if (viewerRole === "client") {
        finalClientUid = user.uid
        finalTalentUid = talentUid
      } else {
        finalTalentUid = user.uid
        finalClientUid = clientUid
      }

      // fetch publicProfiles for slugs/names
      const clientPP = await getDoc(doc(db, "publicProfiles", finalClientUid))
      const talentPP = await getDoc(doc(db, "publicProfiles", finalTalentUid))

      const clientName =
        (clientPP.exists() ? (clientPP.data() as any)?.fullName : "") ||
        viewer?.fullName ||
        "Client"

      const clientSlug = clientPP.exists() ? (clientPP.data() as any)?.slug : null

      const talentName =
        (talentPP.exists() ? (talentPP.data() as any)?.fullName : "") || "Talent"
      const talentSlug = talentPP.exists() ? (talentPP.data() as any)?.slug : null

      const threadId = await ensureThread({
        gigId,
        gigTitle: gig.title || "Gig",
        clientUid: finalClientUid,
        clientName,
        clientSlug: clientSlug || undefined,
        talentUid: finalTalentUid,
        talentName,
        talentSlug: talentSlug || undefined,
        initialProposalStatus: "submitted",
      })

      router.replace(`/dashboard/messages/${threadId}`)
    }

    run()
  }, [router, user?.uid, searchParams])

  return (
    <RequireAuth>
      <AuthNavbar />
      <div className="min-h-[calc(100vh-64px)] bg-[var(--secondary)]">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <Card className="rounded-2xl">
            <CardContent className="p-6 text-sm text-gray-600">
              Opening conversation…
            </CardContent>
          </Card>
        </div>
      </div>
    </RequireAuth>
  )
}
