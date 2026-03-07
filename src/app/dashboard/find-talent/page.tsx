"use client"

import Link from "next/link"
import PageShell from "@/components/marketing/PageShell"
import { hireCategories } from "@/data/navCategories"
import { slugify } from "@/lib/navSlug"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import TalentCard, { TalentRow } from "@/components/talent/TalentCard"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { matchTalentsToClient } from "@/lib/matching"
import { fetchPublicTalents } from "@/lib/publicProfile"

export default function FindTalentPage() {
  const { user } = useAuth()
  const [suggestedTalents, setSuggestedTalents] = useState<TalentRow[]>([])
  const [suggestedLoading, setSuggestedLoading] = useState(false)

  useEffect(() => {
    if (!user?.uid) return
    ;(async () => {
      setSuggestedLoading(true)
      try {
        const clientSnap = await getDocs(
          query(collection(db, "publicProfiles"), where("uid", "==", user.uid), where("role","==","client"),)
        )
        if (!clientSnap.empty) {
          const clientData: any = clientSnap.docs[0].data()
          const clientCriteria = {
            skills: clientData?.orgProfile?.categories || clientData?.categories || [],
            categories: clientData?.orgProfile?.categories || clientData?.categories || [],
            sdgTags: clientData?.sdgTags || [],
            workMode: clientData?.workMode || "",
            location: clientData?.location || "",
          }
          const allTalents = await fetchPublicTalents(50)
          const matched = matchTalentsToClient(allTalents, clientCriteria)
          const talentRows: TalentRow[] = matched.slice(0, 6).map((t, idx) => ({
            uid: t.uid,
            slug: t.slug,
            fullName: t.fullName,
            location: t.location,
            roleTitle: t.roleTitle,
            photoURL: t.photoURL,
            hourlyRate: t.hourlyRate,
            skills: t.skills,
            rating: t.rating,
            verification: t.verification,
            workMode: t.workMode,
          }))
          setSuggestedTalents(talentRows)
        }
      } catch (e) {
        console.error('Failed to load suggestions', e)
      } finally {
        setSuggestedLoading(false)
      }
    })()
  }, [user?.uid])

  return (
    <PageShell
      title="Find Talent"
      subtitle="Browse and hire skilled professionals by category."
    >
      <div className="space-y-6">
        {/* suggestions */}
        {suggestedLoading ? (
          <div className="text-sm text-gray-600">Loading suggestions...</div>
        ) : suggestedTalents.length > 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="overflow-x-auto scroll-snap-x snap-mandatory">
                <div className="flex gap-4">
                  {suggestedTalents.map((t, idx) => (
                    <div key={t.uid} className="w-full flex-shrink-0 scroll-snap-start">
                      <TalentCard t={t} idx={idx} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 text-center">
                <Link
                  href="/dashboard/find-talent"
                  className="text-sm font-extrabold text-[var(--primary)] hover:underline"
                >
                  Browse all categories →
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : null}
        <div className="space-y-4">
          <div className="text-sm font-extrabold text-gray-600">Browse by category</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hireCategories.map((cat) => (
              <div
                key={cat.title}
                className="rounded-2xl border bg-white p-6 hover:shadow-lg transition"
              >
                <h2 className="font-extrabold text-lg text-gray-900 mb-2">{cat.title}</h2>
                <p className="text-sm text-gray-600 mb-4">
                  {cat.items.length} specialist roles
                </p>
                <div className="flex flex-col gap-2">
                  {cat.items.map((item) => (
                    <Link
                      key={item}
                      href={`/dashboard/find-talent/${slugify(item)}`}
                      className="text-sm font-bold text-gray-800 hover:text-[var(--primary)] transition"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
