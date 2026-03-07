"use client"

export const dynamic = "force-dynamic"

import Link from "next/link"
import { useEffect, useMemo, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import PageShell from "@/components/marketing/PageShell"
import { allJobItems, unslugify } from "@/lib/navSlug"
import { Card, CardContent } from "@/components/ui/card"
import { Briefcase, Target, Lightbulb, ArrowRight, Loader2 } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import { SlidersHorizontal, X } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "@/context/AuthContext"
import { useUserRole } from "@/hooks/useUserRole"

type GigRow = {
  id: string
  title: string
  description?: string
  category?: { group?: string; item?: string }
  requiredSkills?: string[]
  workMode?: string
  budgetType?: string
  hourlyRate?: number
  fixedBudget?: number
  duration?: string
  experienceLevel?: string
  status?: string
  sdgTags?: string[]
  postedBy?: string
  createdAt?: any
}

export const dynamicParams = true

export default function JobRolePage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const { role } = useUserRole()
  const [gigs, setGigs] = useState<GigRow[]>([])
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Get category from slug (use client-safe hook)
  const allItems = allJobItems()
  const paramsHook = useParams()
  const slug = (paramsHook?.slug as string) || ""

  if (!slug) {
    return <PageShell title="" subtitle="" children={null} />
  }

  const found = allItems.find((x) => x.slug === slug)

  // Filters
  const [workMode, setWorkMode] = useState<string>("")
  const [experienceLevel, setExperienceLevel] = useState<string>("")
  const [budgetType, setBudgetType] = useState<string>("")

  // Fetch gigs for this category (once per slug)
  const fetchedRef = useRef(false)
  useEffect(() => {
    if (!slug || fetchedRef.current) {
      if (!slug) setLoading(false)
      return
    }
    fetchedRef.current = true

    if (!found) {
      setNotFound(true)
      setLoading(false)
      return
    }

    const run = async () => {
      setLoading(true)
      const qy = query(collection(db, "gigs"), where("status", "==", "open"))
      const snap = await getDocs(qy)

      const rows: GigRow[] = snap.docs
        .map((docx) => {
          const d: any = docx.data()
          return {
            id: docx.id,
            title: d.title || "Untitled Gig",
            description: d.description || "",
            category: d.category || {},
            requiredSkills: d.requiredSkills || [],
            workMode: d.workMode || "",
            budgetType: d.budgetType || "",
            hourlyRate: d.hourlyRate,
            fixedBudget: d.fixedBudget,
            duration: d.duration || "",
            experienceLevel: d.experienceLevel || "",
            status: d.status || "open",
            sdgTags: d.sdgTags || [],
            postedBy: d.postedBy || "",
            createdAt: d.createdAt,
          }
        })
        // Filter by category item matching job name (case-insensitive)
        .filter((g) => (g.category?.item || "").toLowerCase() === (found.item || "").toLowerCase())

      setGigs(rows)
      setLoading(false)
    }

    run()
  }, [slug])

  // Apply filters
  const filtered = useMemo(() => {
    return gigs.filter((g) => {
      if (workMode && g.workMode !== workMode) return false
      if (experienceLevel && g.experienceLevel !== experienceLevel) return false
      if (budgetType && g.budgetType !== budgetType) return false
      return true
    })
  }, [gigs, workMode, experienceLevel, budgetType])

  if (notFound) {
    return (
      <PageShell title="Category not found" subtitle="This job category doesn't exist.">
        <div className="rounded-2xl border bg-white p-6">
          <p className="text-gray-700 text-sm">Try browsing from the Find Work page instead.</p>
          <Link
            href="/jobs"
            className="inline-flex mt-4 rounded-2xl bg-[var(--primary)] text-white px-5 py-3 font-extrabold hover:opacity-90 transition"
          >
            Browse job categories
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

  const activeFilters = [workMode, experienceLevel, budgetType].filter(Boolean).length

  const clearFilters = () => {
    setWorkMode("")
    setExperienceLevel("")
    setBudgetType("")
  }

  return (
    <PageShell
      title={`Opportunities in ${found.item}`}
      subtitle={`${filtered.length} position${filtered.length !== 1 ? "s" : ""} available for ${found.item} professionals.`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* FILTERS SIDEBAR (Desktop) */}
        <div className="hidden lg:block">
          <Card className="rounded-2xl sticky top-20">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-extrabold">Filters</div>
                {activeFilters > 0 && (
                  <button onClick={clearFilters} className="text-xs font-bold text-[var(--primary)] hover:underline">
                    Clear
                  </button>
                )}
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
                        value={v === "All" ? "" : v}
                        checked={workMode === (v === "All" ? "" : v)}
                        onChange={(e) => setWorkMode(e.target.value)}
                      />
                      {v}
                    </label>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <div className="text-sm font-extrabold mb-2">Experience level</div>
                <div className="space-y-2">
                  {["All", "Entry", "Intermediate", "Expert"].map((v) => (
                    <label key={v} className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <input
                        type="radio"
                        name="experience"
                        value={v === "All" ? "" : v}
                        checked={experienceLevel === (v === "All" ? "" : v)}
                        onChange={(e) => setExperienceLevel(e.target.value)}
                      />
                      {v}
                    </label>
                  ))}
                </div>
              </div>

              {/* Budget Type */}
              <div>
                <div className="text-sm font-extrabold mb-2">Budget type</div>
                <div className="space-y-2">
                  {["All", "Hourly", "Fixed"].map((v) => (
                    <label key={v} className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <input
                        type="radio"
                        name="budget"
                        value={v === "All" ? "" : v.toLowerCase()}
                        checked={budgetType === (v === "All" ? "" : v.toLowerCase())}
                        onChange={(e) => setBudgetType(e.target.value)}
                      />
                      {v}
                    </label>
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

                {/* Work Mode */}
                <div>
                  <div className="text-sm font-extrabold mb-2">Work mode</div>
                  <div className="space-y-2">
                    {["All", "Remote", "Hybrid", "On-site"].map((v) => (
                      <label key={v} className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <input
                          type="radio"
                          name="workMode"
                          value={v === "All" ? "" : v}
                          checked={workMode === (v === "All" ? "" : v)}
                          onChange={(e) => setWorkMode(e.target.value)}
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <div className="text-sm font-extrabold mb-2">Experience level</div>
                  <div className="space-y-2">
                    {["All", "Entry", "Intermediate", "Expert"].map((v) => (
                      <label key={v} className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <input
                          type="radio"
                          name="experience"
                          value={v === "All" ? "" : v}
                          checked={experienceLevel === (v === "All" ? "" : v)}
                          onChange={(e) => setExperienceLevel(e.target.value)}
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Budget Type */}
                <div>
                  <div className="text-sm font-extrabold mb-2">Budget type</div>
                  <div className="space-y-2">
                    {["All", "Hourly", "Fixed"].map((v) => (
                      <label key={v} className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <input
                          type="radio"
                          name="budget"
                          value={v === "All" ? "" : v.toLowerCase()}
                          checked={budgetType === (v === "All" ? "" : v.toLowerCase())}
                          onChange={(e) => setBudgetType(e.target.value)}
                        />
                        {v}
                      </label>
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
              <div className="text-lg font-extrabold text-gray-900">No opportunities found</div>
              <p className="text-sm text-gray-600 mt-2">Try adjusting your filters or browse other categories.</p>
              <Link
                href="/jobs"
                className="inline-flex mt-4 rounded-2xl bg-[var(--primary)] text-white px-5 py-3 font-extrabold hover:opacity-90 transition"
              >
                Browse all categories
              </Link>
            </div>
          )}

          {/* Gigs List */}
          {!loading && filtered.length > 0 && (
            <div className="space-y-3">
              {filtered.map((gig) => (
                <div
                  key={gig.id}
                  className="block rounded-2xl border bg-white p-5 hover:shadow-md hover:border-[var(--primary)] transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => router.push(`/dashboard/find-work/${gig.id}`)}
                    >
                      <h3 className="font-extrabold text-gray-900 text-lg">{gig.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{gig.description}</p>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {gig.workMode && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                            {gig.workMode}
                          </span>
                        )}
                        {gig.experienceLevel && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                            {gig.experienceLevel}
                          </span>
                        )}
                        {gig.duration && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-xs font-semibold text-green-700">
                            {gig.duration}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 space-y-2">
                      <div>
                        {gig.budgetType === "hourly" && gig.hourlyRate && (
                          <div className="text-lg font-extrabold text-[var(--primary)]">${gig.hourlyRate}/hr</div>
                        )}
                        {gig.budgetType === "fixed" && gig.fixedBudget && (
                          <div className="text-lg font-extrabold text-[var(--primary)]">₦{gig.fixedBudget}</div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (!user || role !== "talent") {
                            router.push(`/login?next=${encodeURIComponent(`/dashboard/gigs/${gig.id}/proposals`)}`)
                            return
                          }
                          router.push(`/dashboard/gigs/${gig.id}/proposals`)
                        }}
                        className="block w-full text-xs font-bold text-white bg-[var(--primary)] px-3 py-2 rounded-lg hover:opacity-90 transition"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/find-work/${gig.id}`)}
                        className="block w-full text-xs font-semibold text-gray-500 hover:text-gray-700 transition"
                      >
                        View details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}

