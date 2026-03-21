"use client"

export const dynamic = "force-dynamic"

import Link from "next/link"
import { useEffect, useMemo, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import PageShell from "@/components/marketing/PageShell"
import { allHireItems, unslugify } from "@/lib/navSlug"
import { Card, CardContent } from "@/components/ui/card"
import { Briefcase, Users, CheckCircle, ArrowRight, Loader2 } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import TalentCard from "@/components/talent/TalentCard"
import TalentFilters, { TalentFilterState, Availability, WorkMode } from "@/components/talent/TalentFilters"
import { SlidersHorizontal, X } from "lucide-react"


type TalentRow = {
  uid: string
  slug?: string
  fullName: string
  location?: string
  roleTitle?: string
  photoURL?: string
  hourlyRate?: number | null
  skills?: string[]
  rating?: { avg?: number; count?: number }
  verification?: { status?: string }
  availability?: string
  workMode?: string
  yearsExperience?: number | null
  categories?: string[]
  sdgTags?: string[]
}

export const dynamicParams = true

export default function FindTalentRolePage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  const [talents, setTalents] = useState<TalentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Get category from slug (use client-safe hook)
  const allItems = allHireItems()
  const paramsHook = useParams()
  const slug = (paramsHook?.slug as string) || ""
  const found = allItems.find((x) => x.slug === slug)

  // Filters
  const [onlyVerified, setOnlyVerified] = useState(false)
  const [selectedSDGs, setSelectedSDGs] = useState<string[]>([])
  const [availability, setAvailability] = useState<"all" | Availability>("all")
  const [workMode, setWorkMode] = useState<"all" | WorkMode>("all")

  // Read URL params
  useEffect(() => {
    try {
      setSearchParams(new URLSearchParams(window.location.search))
    } catch (e) {
      setSearchParams(null)
    }
  }, [])

  // Fetch talents for this category - depend on `slug` (primitive) and
  // avoid running twice under React strict mode.
  const fetchedRef = useRef(false)
  useEffect(() => {
    if (!slug || fetchedRef.current) return
    fetchedRef.current = true

    // reset notFound each time slug changes
    setNotFound(false)

    const run = async () => {
      setLoading(true)

      // find fresh `found` for current slug
      const curFound = allItems.find((x) => x.slug === slug)
      if (!curFound) {
        setTalents([])
        setNotFound(true)
        setLoading(false)
        return
      }

      const qy = query(collection(db, "publicProfiles"), where("role", "==", "talent"))
      const snap = await getDocs(qy)

      const rows: TalentRow[] = snap.docs
        .map((docx) => {
          const d: any = docx.data()
          return {
            uid: d.uid,
            slug: d.slug,
            fullName: d.fullName || "Unnamed Talent",
            location: d.location || "",
            roleTitle: d?.talent?.roleTitle || "",
            photoURL: d?.publicProfile?.photoURL || "",
            hourlyRate: d?.publicProfile?.hourlyRate ?? null,
            categories: d?.publicProfile?.categories || d?.categories || [],
            sdgTags: d?.sdgTags || [],
            skills: d?.talent?.skills || [],
            availability: d?.talent?.availability || "",
            workMode: d?.talent?.workMode || "",
            yearsExperience: typeof d?.talent?.yearsExperience === "number" ? d.talent.yearsExperience : null,
            rating: d?.rating || { avg: 0, count: 0 },
            verification: d?.verification || { status: "not_submitted" },
          }
        })
        // Filter by category (or roleTitle when categories are empty)
        .filter((t) => {
          const name = curFound.item.toLowerCase()
          const hasCategory = t.categories?.some((c: string) => c.toLowerCase() === name)
          const hasRole = t.roleTitle?.toLowerCase() === name
          return hasCategory || hasRole
        })

      setTalents(rows)
      setLoading(false)
    }

    run()
  }, [slug])

  // Apply filters
  const filtered = useMemo(() => {
    return talents.filter((t) => {
      if (onlyVerified && t.verification?.status !== "verified") return false
      if (selectedSDGs.length > 0) {
        const s = new Set(t.sdgTags || [])
        const ok = selectedSDGs.some((x) => s.has(x))
        if (!ok) return false
      }
      if (availability !== "all" && (t.availability || "") !== availability) return false
      if (workMode !== "all" && (t.workMode || "") !== workMode) return false
      return true
    })
  }, [talents, onlyVerified, selectedSDGs, availability, workMode])

  if (notFound) {
    return (
      <PageShell title="Role not found" subtitle="This category doesn't exist (or the link is outdated).">
        <div className="rounded-2xl border bg-white p-6">
          <p className="text-gray-700 text-sm">
            Try browsing from the Find Talent page instead.
          </p>
          <Link
            href="/dashboard/find-talent"
            className="inline-flex mt-4 rounded-2xl bg-[var(--primary)] text-white px-5 py-3 font-extrabold hover:opacity-90 transition"
          >
            Browse talent categories
          </Link>
        </div>
      </PageShell>
    )
  }

  if (!found) {
    return (
      <PageShell title="Loading..." subtitle="">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin" size={32} />
        </div>
      </PageShell>
    )
  }

  const categoryName = found.item
  const categoryGroup = found.group
  const activeFilters = [onlyVerified, selectedSDGs.length > 0, availability !== "all", workMode !== "all"].filter(Boolean).length

  const clearFilters = () => {
    setOnlyVerified(false)
    setSelectedSDGs([])
    setAvailability("all")
    setWorkMode("all")
  }

  return (
    <PageShell
      title={categoryName}
      subtitle={`Category: ${categoryGroup}. ${filtered.length} professional${filtered.length !== 1 ? "s" : ""} available.`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* FILTERS SIDEBAR (Desktop) */}
        <div className="hidden lg:block">
          <Card className="rounded-2xl sticky top-20">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-extrabold">Filters</div>
                {activeFilters > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-bold text-[var(--primary)] hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Verified */}
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <input type="checkbox" checked={onlyVerified} onChange={(e) => setOnlyVerified(e.target.checked)} />
                Verified only
              </label>

              {/* Availability */}
              <div>
                <div className="text-sm font-extrabold mb-2">Availability</div>
                <div className="space-y-2">
                  {["All", "Full-time", "Part-time", "Contract"].map((v) => (
                    <label key={v} className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <input
                        type="radio"
                        name="availability"
                        value={v === "All" ? "all" : v}
                        checked={availability === (v === "All" ? "all" : v)}
                        onChange={(e) => setAvailability(e.target.value as "all" | Availability)}
                      />
                      {v}
                    </label>
                  ))}
                </div>
              </div>

              {/* Work Mode */}
              <div>
                <div className="text-sm font-extrabold mb-2">Work mode</div>
                <div className="space-y-2">
                  {["All", "Remote", "Hybrid", "On-site"].map((v) => (
                    <label key={v} className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <input
                        type="radio"
                        name="workMode"
                        value={v === "All" ? "all" : v}
                        checked={workMode === (v === "All" ? "all" : v)}
                        onChange={(e) => setWorkMode(e.target.value as "all" | WorkMode)}
                      />
                      {v}
                    </label>
                  ))}
                </div>
              </div>

              {/* SDGs */}
              <div>
                <div className="text-sm font-extrabold mb-2">SDG focus</div>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-auto pr-1">
                  {["1. No Poverty", "2. Zero Hunger", "3. Good Health", "4. Quality Education", "5. Gender Equality", "6. Clean Water", "7. Affordable Energy", "8. Economic Growth", "9. Industry Innovation", "10. Reduced Inequality", "11. Sustainable Cities", "12. Responsible Consumption", "13. Climate Action"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSDGs((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                      className={`text-xs font-semibold px-3 py-1 rounded-full border transition ${
                        selectedSDGs.includes(s)
                          ? "border-[var(--primary)] text-[var(--primary)] bg-orange-50"
                          : "border-gray-200 text-gray-700 hover:border-[var(--primary)]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MAIN CONTENT */}
        <div className="lg:col-span-3 space-y-4">


          {/* Mobile Filter Button */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-2xl border hover:border-[var(--primary)] transition"
          >
            <SlidersHorizontal size={16} />
            <span className="font-semibold">Filters {activeFilters > 0 && `(${activeFilters})`}</span>
          </button>

          {/* Mobile Filter Panel */}
          {filtersOpen && (
            <Card className="lg:hidden rounded-2xl">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-extrabold">Filters</div>
                  <button onClick={() => setFiltersOpen(false)}>
                    <X size={18} />
                  </button>
                </div>

                {/* Verified */}
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <input type="checkbox" checked={onlyVerified} onChange={(e) => setOnlyVerified(e.target.checked)} />
                  Verified only
                </label>

                {/* Availability */}
                <div>
                  <div className="text-sm font-extrabold mb-2">Availability</div>
                  <div className="space-y-2">
                    {["All", "Full-time", "Part-time", "Contract"].map((v) => (
                      <label key={v} className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <input
                          type="radio"
                          name="availability"
                          value={v === "All" ? "all" : v}
                          checked={availability === (v === "All" ? "all" : v)}
                          onChange={(e) => setAvailability(e.target.value as "all" | Availability)}
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Work Mode */}
                <div>
                  <div className="text-sm font-extrabold mb-2">Work mode</div>
                  <div className="space-y-2">
                    {["All", "Remote", "Hybrid", "On-site"].map((v) => (
                      <label key={v} className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <input
                          type="radio"
                          name="workMode"
                          value={v === "All" ? "all" : v}
                          checked={workMode === (v === "All" ? "all" : v)}
                          onChange={(e) => setWorkMode(e.target.value as "all" | WorkMode)}
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </div>

                {/* SDGs */}
                <div>
                  <div className="text-sm font-extrabold mb-2">SDG focus</div>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-auto pr-1">
                    {["1. No Poverty", "2. Zero Hunger", "3. Good Health", "4. Quality Education", "5. Gender Equality", "6. Clean Water", "7. Affordable Energy", "8. Economic Growth", "9. Industry Innovation", "10. Reduced Inequality", "11. Sustainable Cities", "12. Responsible Consumption", "13. Climate Action"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSDGs((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                        className={`text-xs font-semibold px-3 py-1 rounded-full border transition ${
                          selectedSDGs.includes(s)
                            ? "border-[var(--primary)] text-[var(--primary)] bg-orange-50"
                            : "border-gray-200 text-gray-700 hover:border-[var(--primary)]"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {activeFilters > 0 && (
                  <button
                    onClick={clearFilters}
                    className="w-full text-sm font-bold text-[var(--primary)] py-2 border rounded-2xl hover:bg-orange-50 transition"
                  >
                    Clear filters
                  </button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12 rounded-2xl border bg-white">
              <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
            </div>
          )}

          {/* No results */}
          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl border bg-white p-8 text-center">
              <div className="text-lg font-extrabold text-gray-900">No talent found</div>
              <p className="text-sm text-gray-600 mt-2">
                Try adjusting your filters or browse other categories.
              </p>
              <Link
                href="/dashboard/find-talent"
                className="inline-flex mt-4 rounded-2xl bg-[var(--primary)] text-white px-5 py-3 font-extrabold hover:opacity-90 transition"
              >
                Browse all categories
              </Link>
            </div>
          )}

          {/* Talent List */}
          {!loading && filtered.length > 0 && (
            <div className="space-y-3">
              {filtered.map((t, idx) => (
                <TalentCard key={t.uid} t={t} idx={idx} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
