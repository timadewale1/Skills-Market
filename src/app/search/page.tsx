"use client"

export const dynamic = "force-dynamic"

import { useSearchParams, useRouter } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { query, collection, getDocs, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

import TalentFilters, { TalentFilterState, Availability, WorkMode } from "@/components/talent/TalentFilters"
import PaginatedCard from "@/components/talent/PaginatedList"



export default function SearchPage() {
  const params = useSearchParams()
  const router = useRouter()

  const { user } = useAuth()

  const q = params.get("q") || ""
  const type = params.get("type") || "talent"

  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // filters (shared with Talent browse)
  const [onlyVerified, setOnlyVerified] = useState(false)
  const [selectedSDGs, setSelectedSDGs] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [availability, setAvailability] = useState<"all" | Availability>("all")
  const [workMode, setWorkMode] = useState<"all" | WorkMode>("all")

  const [minExp, setMinExp] = useState<string>("")
  const [maxExp, setMaxExp] = useState<string>("")
  const [minRate, setMinRate] = useState<string>("")
  const [maxRate, setMaxRate] = useState<string>("")

  useEffect(() => {
    async function fetchResults() {
      // inside fetchResults() in SearchPage

setLoading(true)

if (type === "talent") {
  const qy = query(collection(db, "publicProfiles"), where("role", "==", "talent"))
  const snap = await getDocs(qy)
  const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))

  // simple search filter (q)
  const needle = q.trim().toLowerCase()
  const filtered = !needle
    ? rows
    : rows.filter((r: any) => {
        const hay = [
          r.fullName,
          r.location,
          r?.talent?.roleTitle,
          (r?.talent?.skills || []).join(" "),
          (r?.publicProfile?.categories || r?.categories || []).join(" "),
          (r?.sdgTags || []).join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        return hay.includes(needle)
      })

  setResults(filtered)
} else {
  // jobs tab stays “coming soon” until we build gigs/jobs public collection
  setResults([])
}

setLoading(false)

    }

    fetchResults()
  }, [q, type])

  // normalize rows and apply same client-side filters as Browse page
  const rows = results.map((r: any) => {
    const d: any = r
    return {
      uid: d.uid || d.id,
      slug: d.slug,
      fullName: d.fullName || d.name || d.title || "Unnamed",
      location: d.location || "",
      roleTitle: d?.talent?.roleTitle || "",

      photoURL: d?.publicProfile?.photoURL || "",
      hourlyRate: d?.publicProfile?.hourlyRate ?? null,

      categories: d?.publicProfile?.categories || d?.categories || [],
      sdgTags: d?.sdgTags || [],
      skills: d?.talent?.skills || [],

      availability: d?.talent?.availability || "",
      workMode: d?.talent?.workMode || "",
      yearsExperience:
        typeof d?.talent?.yearsExperience === "number" ? d.talent.yearsExperience : null,

      rating: d?.rating || { avg: 0, count: 0 },
      verification: d?.verification || { status: "not_submitted" },
    }
  })

  const filtered = rows.filter((t: any) => {
    const needle = q.trim().toLowerCase()

    if (needle) {
      const hay = [
        t.fullName,
        t.roleTitle,
        t.location,
        (t.skills || []).join(" "),
        (t.categories || []).join(" "),
        (t.sdgTags || []).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      if (!hay.includes(needle)) return false
    }

    if (onlyVerified && t.verification?.status !== "verified") return false

    if (selectedSDGs.length) {
      const s = new Set(t.sdgTags || [])
      const ok = selectedSDGs.some((x) => s.has(x))
      if (!ok) return false
    }

    if (selectedCategories.length) {
      const s = new Set(t.categories || [])
      const ok = selectedCategories.some((x) => s.has(x))
      if (!ok) return false
    }

    if (availability !== "all" && (t.availability || "") !== availability) return false
    if (workMode !== "all" && (t.workMode || "") !== workMode) return false

    const minE = minExp.trim() ? Number(minExp) : null
    const maxE = maxExp.trim() ? Number(maxExp) : null
    if (minE != null) {
      const v = Number(t.yearsExperience ?? -1)
      if (v < minE) return false
    }
    if (maxE != null) {
      const v = Number(t.yearsExperience ?? 9999)
      if (v > maxE) return false
    }

    const minR = minRate.trim() ? Number(minRate) : null
    const maxR = maxRate.trim() ? Number(maxRate) : null
    const rate = t.hourlyRate == null ? null : Number(t.hourlyRate)
    if (minR != null) {
      if (rate == null || rate < minR) return false
    }
    if (maxR != null) {
      if (rate == null || rate > maxR) return false
    }

    return true
  })

  const TopNav = user ? <AuthNavbar /> : <Navbar />

  return (
    <>
      {TopNav}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex items-center justify-between border-b mb-6">
  <div className="flex gap-6">
    {["talent", "job"].map((t) => (
      <button
        key={t}
        onClick={() =>
          router.push(`/search?type=${t}&q=${q}`)
        }
        className={`pb-3 font-semibold ${
          type === t
            ? "border-b-2 border-[var(--primary)] text-black"
            : "text-gray-500"
        }`}
      >
        {t === "talent" ? "Talent" : "Jobs"}
      </button>
    ))}
  </div>

  {/* MOBILE FILTER BUTTON */}
  <button
    onClick={() => setFiltersOpen(true)}
    className="md:hidden text-sm font-semibold text-[var(--primary)]"
  >
    Filters
  </button>
</div>

{/* MOBILE FILTER PANEL */}
{filtersOpen && (
  <div className="fixed inset-0 z-50 bg-black/30 md:hidden">
    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-6 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Filters</h3>
        <button
          onClick={() => setFiltersOpen(false)}
          className="text-sm text-gray-600"
        >
          Close
        </button>
      </div>

      <div className="space-y-6">
        <TalentFilters
          value={{
            onlyVerified,
            selectedSDGs,
            selectedCategories,
            availability,
            workMode,
            minExp,
            maxExp,
            minRate,
            maxRate,
          }}
          onChange={(next: TalentFilterState) => {
            setOnlyVerified(next.onlyVerified)
            setSelectedSDGs(next.selectedSDGs)
            setSelectedCategories(next.selectedCategories)
            setAvailability(next.availability)
            setWorkMode(next.workMode)
            setMinExp(next.minExp)
            setMaxExp(next.maxExp)
            setMinRate(next.minRate)
            setMaxRate(next.maxRate)
          }}
          onClear={() => {
            setOnlyVerified(false)
            setSelectedSDGs([])
            setSelectedCategories([])
            setAvailability("all")
            setWorkMode("all")
            setMinExp("")
            setMaxExp("")
            setMinRate("")
            setMaxRate("")
          }}
        />
      </div>

      <div className="mt-6">
        <button
          onClick={() => setFiltersOpen(false)}
          className="w-full bg-[var(--primary)] text-white py-3 rounded-md font-semibold"
        >
          Apply Filters
        </button>
      </div>
    </div>
  </div>
)}


        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* FILTER SIDEBAR */}
          <aside className="hidden md:block space-y-6">
            <div className="rounded-2xl p-0">
              <TalentFilters
                value={{
                  onlyVerified,
                  selectedSDGs,
                  selectedCategories,
                  availability,
                  workMode,
                  minExp,
                  maxExp,
                  minRate,
                  maxRate,
                }}
                onChange={(next: TalentFilterState) => {
                  setOnlyVerified(next.onlyVerified)
                  setSelectedSDGs(next.selectedSDGs)
                  setSelectedCategories(next.selectedCategories)
                  setAvailability(next.availability)
                  setWorkMode(next.workMode)
                  setMinExp(next.minExp)
                  setMaxExp(next.maxExp)
                  setMinRate(next.minRate)
                  setMaxRate(next.maxRate)
                }}
                onClear={() => {
                  setOnlyVerified(false)
                  setSelectedSDGs([])
                  setSelectedCategories([])
                  setAvailability("all")
                  setWorkMode("all")
                  setMinExp("")
                  setMaxExp("")
                  setMinRate("")
                  setMaxRate("")
                }}
              />
            </div>
          </aside>

          {/* RESULTS */}
          <section className="md:col-span-3 space-y-4">
            {loading && <p>Loading results...</p>}

            {!loading && filtered.length === 0 && (
              <p className="text-gray-500">No results found.</p>
            )}

            {filtered.map((t: any, idx: number) => (
              <PaginatedCard key={t.uid} t={t} idx={idx} />
            ))}
          </section>
        </div>
      </div>
    </>
  )
}

// Filters and result card replaced by shared components

