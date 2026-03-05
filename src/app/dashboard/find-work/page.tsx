"use client"

import { useEffect, useMemo, useState } from "react"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import {
  collection,
  getCountFromServer,
  getDocs,
  getDoc,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  QueryDocumentSnapshot,
  Firestore,
} from "firebase/firestore"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Briefcase,
  MapPin,
  Wallet,
  Clock,
  Filter,
  ChevronDown,
  ChevronRight,
  Users,
} from "lucide-react"

type Gig = {
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
  clientOrgName?: string
  clientName?: string
  createdAt?: any // Firestore Timestamp
}

const WORK_MODE = ["Remote", "Hybrid", "On-site"] as const
const TIME_FILTERS = [
  { label: "Any time", value: "" as const },
  { label: "Last 1 hour", value: "1h" as const },
  { label: "Last 24 hours", value: "24h" as const },
  { label: "Last 7 days", value: "7d" as const },
  { label: "Last 30 days", value: "30d" as const },
] as const

const APPLICANTS_FILTERS = [
  { label: "Any applicants", value: "" as const },
  { label: "0 applicants", value: "0" as const },
  { label: "1–5 applicants", value: "1-5" as const },
  { label: "6–20 applicants", value: "6-20" as const },
  { label: "20+ applicants", value: "20+" as const },
] as const

function money(n?: number | null) {
  if (n === null || n === undefined) return "—"
  return `₦${Number(n).toLocaleString()}`
}

function budgetLabel(g: Gig) {
  if (g.budgetType === "hourly") return `${money(g.hourlyRate)}/hr`
  if (g.budgetType === "fixed") return `${money(g.fixedBudget)} fixed`
  return "—"
}

function toDate(ts: any): Date | null {
  if (!ts) return null
  if (typeof ts?.toDate === "function") return ts.toDate()
  // some people store ms numbers sometimes
  if (typeof ts === "number") return new Date(ts)
  return null
}

function timeAgo(ts: any) {
  const d = toDate(ts)
  if (!d) return "—"
  const diffMs = Date.now() - d.getTime()
  const sec = Math.floor(diffMs / 1000)
  if (sec < 10) return "just now"
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  const mo = Math.floor(day / 30)
  return `${mo}mo ago`
}

function withinTimeFilter(createdAt: any, filter: "" | "1h" | "24h" | "7d" | "30d") {
  if (!filter) return true
  const d = toDate(createdAt)
  if (!d) return true

  const now = Date.now()
  const ms = now - d.getTime()

  const hour = 60 * 60 * 1000
  const day = 24 * hour

  if (filter === "1h") return ms <= hour
  if (filter === "24h") return ms <= day
  if (filter === "7d") return ms <= 7 * day
  if (filter === "30d") return ms <= 30 * day
  return true
}

function matchApplicantsRange(count: number, range: "" | "0" | "1-5" | "6-20" | "20+") {
  if (!range) return true
  if (range === "0") return count === 0
  if (range === "1-5") return count >= 1 && count <= 5
  if (range === "6-20") return count >= 6 && count <= 20
  if (range === "20+") return count >= 20
  return true
}

export default function FindWorkPage() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Gig[]>([])
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<any> | null>(null)
  const [hasMore, setHasMore] = useState(true)

  // derived maps
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({})
  const [appliedMap, setAppliedMap] = useState<Record<string, boolean>>({})

  // UI filters
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [workMode, setWorkMode] = useState<"" | (typeof WORK_MODE)[number]>("")
  const [experienceLevel, setExperienceLevel] = useState<"" | "Entry" | "Intermediate" | "Expert">("")
  const [budgetType, setBudgetType] = useState<"" | "hourly" | "fixed">("")
  const [duration, setDuration] = useState<"" | "Less than 1 month" | "1–3 months" | "3–6 months" | "6+ months">("")
  const [timePosted, setTimePosted] = useState<"" | "1h" | "24h" | "7d" | "30d">("")
  const [sdg, setSdg] = useState<string>("")
  const [categoryItem, setCategoryItem] = useState<string>("")
  const [applicantsRange, setApplicantsRange] = useState<"" | "0" | "1-5" | "6-20" | "20+">("")

  const PAGE_SIZE = 10

  const hydrateCountsAndApplied = async (rows: Gig[]) => {
    if (!rows.length) return

    // Applicants count: count proposals subcollection per gig (only for rows)
    const countsEntries = await Promise.all(
      rows.map(async (g) => {
        try {
          const snap = await getDocs(
  collection(db, "gigs", g.id, "proposals")
)

return [g.id, snap.size] as const
        } catch {
          return [g.id, 0] as const
        }
      })
    )

    setApplicantCounts((prev) => {
      const next = { ...prev }
      for (const [id, count] of countsEntries) next[id] = count
      return next
    })

    // Applied: if proposal doc exists at gigs/{gigId}/proposals/{talentUid}
    if (user?.uid) {
      const appliedEntries = await Promise.all(
        rows.map(async (g) => {
          try {
            const snap = await getDoc(doc(db, "gigs", g.id, "proposals", user.uid))
            return [g.id, snap.exists()] as const
          } catch {
            return [g.id, false] as const
          }
        })
      )

      setAppliedMap((prev) => {
        const next = { ...prev }
        for (const [id, yes] of appliedEntries) next[id] = yes
        return next
      })
    }
  }

  const fetchPage = async (mode: "initial" | "next") => {
    setLoading(true)

    let qy: any = query(
      collection(db, "gigs"),
      where("status", "==", "open"),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE)
    )

    if (mode === "next" && cursor) {
      qy = query(
        collection(db, "gigs"),
        where("status", "==", "open"),
        orderBy("createdAt", "desc"),
        startAfter(cursor),
        limit(PAGE_SIZE)
      )
    }

    const snap = await getDocs(qy)
    const rows = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) })) as Gig[]

    // extra safety: never show closed
    const openRows = rows.filter((r) => r.status === "open")

    const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null
    setCursor(nextCursor)
    setHasMore(snap.docs.length === PAGE_SIZE)

    setItems((prev) => (mode === "initial" ? openRows : [...prev, ...openRows]))

    // hydrate maps (for just this page)
    await hydrateCountsAndApplied(openRows)

    setLoading(false)
  }

  useEffect(() => {
    fetchPage("initial")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sdgOptions = useMemo(() => {
    const set = new Set<string>()
    for (const g of items) for (const t of g.sdgTags || []) set.add(t)
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [items])

  const categoryOptions = useMemo(() => {
    const set = new Set<string>()
    for (const g of items) {
      const item = g.category?.item
      if (item) set.add(item)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [items])

  // Client-side filtered view
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return items.filter((g) => {
      if (g.status !== "open") return false

      if (workMode && g.workMode !== workMode) return false
      if (experienceLevel && (g.experienceLevel || "") !== experienceLevel) return false
      if (budgetType && (g.budgetType || "") !== budgetType) return false
      if (duration && (g.duration || "") !== duration) return false

      if (sdg && !(g.sdgTags || []).includes(sdg)) return false
      if (categoryItem && (g.category?.item || "") !== categoryItem) return false

      if (!withinTimeFilter(g.createdAt, timePosted)) return false

      const count = applicantCounts[g.id] ?? 0
      if (!matchApplicantsRange(count, applicantsRange)) return false

      if (!q) return true
      const blob = [
        g.title,
        g.category?.group,
        g.category?.item,
        g.location,
        g.workMode,
        (g.requiredSkills || []).join(" "),
        (g.sdgTags || []).join(" "),
        g.clientOrgName,
        g.clientName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return blob.includes(q)
    })
  }, [
    items,
    search,
    workMode,
    experienceLevel,
    budgetType,
    duration,
    timePosted,
    sdg,
    categoryItem,
    applicantsRange,
    applicantCounts,
  ])

  const swipeHint = (
    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
      <span className="font-semibold">Swipe/scroll to explore</span>
      <motion.div
        className="flex items-center gap-1"
        animate={{ x: [0, 6, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="font-semibold">More</span>
        <ChevronRight size={14} />
      </motion.div>
    </div>
  )

  const clearAll = () => {
    setWorkMode("")
    setExperienceLevel("")
    setBudgetType("")
    setDuration("")
    setTimePosted("")
    setSdg("")
    setCategoryItem("")
    setApplicantsRange("")
    setSearch("")
  }

  const FiltersPanel = (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base font-extrabold">Filters</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Select value={workMode || "__any"} onValueChange={(v) => setWorkMode(v === "__any" ? "" : (v as any))}>
          <SelectTrigger className="rounded-2xl bg-white">
            <SelectValue placeholder="Work mode (any)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any">Work mode (any)</SelectItem>
            {WORK_MODE.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={experienceLevel || "__any"} onValueChange={(v) => setExperienceLevel(v === "__any" ? "" : (v as any))}>
          <SelectTrigger className="rounded-2xl bg-white">
            <SelectValue placeholder="Experience (any)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any">Experience (any)</SelectItem>
            {["Entry", "Intermediate", "Expert"].map((x) => (
              <SelectItem key={x} value={x}>
                {x}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={budgetType || "__any"} onValueChange={(v) => setBudgetType(v === "__any" ? "" : (v as any))}>
          <SelectTrigger className="rounded-2xl bg-white">
            <SelectValue placeholder="Budget type (any)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any">Budget type (any)</SelectItem>
            <SelectItem value="hourly">Hourly</SelectItem>
            <SelectItem value="fixed">Fixed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={duration || "__any"} onValueChange={(v) => setDuration(v === "__any" ? "" : (v as any))}>
          <SelectTrigger className="rounded-2xl bg-white">
            <SelectValue placeholder="Duration (any)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any">Duration (any)</SelectItem>
            <SelectItem value="Less than 1 month">Less than 1 month</SelectItem>
            <SelectItem value="1–3 months">1–3 months</SelectItem>
            <SelectItem value="3–6 months">3–6 months</SelectItem>
            <SelectItem value="6+ months">6+ months</SelectItem>
          </SelectContent>
        </Select>

        <Select value={timePosted || "__any"} onValueChange={(v) => setTimePosted(v === "__any" ? "" : (v as any))}>
          <SelectTrigger className="rounded-2xl bg-white">
            <SelectValue placeholder="Time posted" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any">Any time</SelectItem>
            {TIME_FILTERS.filter((t) => t.value).map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sdg || "__any"} onValueChange={(v) => setSdg(v === "__any" ? "" : v)}>
          <SelectTrigger className="rounded-2xl bg-white">
            <SelectValue placeholder="SDG (any)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any">SDG (any)</SelectItem>
            {sdgOptions.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryItem || "__any"} onValueChange={(v) => setCategoryItem(v === "__any" ? "" : v)}>
          <SelectTrigger className="rounded-2xl bg-white">
            <SelectValue placeholder="Category (any)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any">Category (any)</SelectItem>
            {categoryOptions.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={applicantsRange || "__any"}
          onValueChange={(v) => setApplicantsRange(v === "__any" ? "" : (v as any))}
        >
          <SelectTrigger className="rounded-2xl bg-white">
            <SelectValue placeholder="Applicants" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any">Any applicants</SelectItem>
            {APPLICANTS_FILTERS.filter((x) => x.value).map((x) => (
              <SelectItem key={x.value} value={x.value}>
                {x.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="md:col-span-4 flex items-center gap-2">
          <button
            onClick={clearAll}
            className="rounded-2xl border bg-white px-4 py-2 text-sm font-extrabold hover:shadow-sm transition"
          >
            Clear
          </button>

          <div className="text-xs text-gray-500 font-semibold">
            Feed shows only <span className="font-extrabold">open</span> gigs.
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <RequireAuth>
      <AuthNavbar />

      <div className="min-h-[calc(100vh-64px)] bg-[var(--secondary)]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold">Find work</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Explore open gigs and send proposals.
                </p>
              </div>

              {/* Desktop filter toggle */}
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                className="hidden md:inline-flex items-center gap-2 text-sm font-extrabold rounded-2xl border bg-white px-4 py-2 hover:shadow-sm transition"
              >
                <Filter size={16} className="text-[var(--primary)]" />
                Filters
                <ChevronDown size={16} className={`transition ${filtersOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Mobile */}
            <div className="md:hidden grid grid-cols-1 gap-3">
              <Card className="rounded-2xl">
                <CardContent className="p-4 text-sm text-gray-700">
                  Tip: search by skill + location (e.g. “design Abuja”)
                </CardContent>
              </Card>

              <button
                onClick={() => setFiltersOpen(true)}
                className="w-full rounded-2xl border bg-white px-4 py-3 text-sm font-extrabold flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Filter size={16} className="text-[var(--primary)]" />
                  Filters
                </span>
                <ChevronRight size={16} />
              </button>

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search gigs by title, skill, SDG..."
                className="rounded-2xl"
              />
            </div>

            {/* Desktop search */}
            <div className="hidden md:block">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search gigs by title, skill, SDG..."
                className="rounded-2xl"
              />
            </div>

            {/* Desktop filters */}
            {filtersOpen && <div className="hidden md:block">{FiltersPanel}</div>}
          </div>

          {/* Mobile filter sheet */}
          {filtersOpen && (
            <div className="fixed inset-0 z-50 bg-black/30 md:hidden">
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-extrabold text-lg">Filters</div>
                  <button onClick={() => setFiltersOpen(false)} className="text-sm font-semibold text-gray-600">
                    Close
                  </button>
                </div>

                {FiltersPanel}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      clearAll()
                      setFiltersOpen(false)
                    }}
                    className="flex-1 rounded-2xl border bg-white px-4 py-3 text-sm font-extrabold"
                  >
                    Clear
                  </button>

                  <button
                    onClick={() => setFiltersOpen(false)}
                    className="flex-1 rounded-2xl bg-[var(--primary)] text-white px-4 py-3 text-sm font-extrabold"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              {loading && items.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="p-6 text-sm text-gray-600">Loading gigs...</CardContent>
                </Card>
              ) : filtered.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="p-6 text-sm text-gray-600">No gigs found.</CardContent>
                </Card>
              ) : (
                <>
                  {filtered.map((g, idx) => {
                    const applied = !!appliedMap[g.id]
                    const applicants = applicantCounts[g.id] ?? 0
                    return (
                      <motion.div
                        key={g.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02, duration: 0.25 }}
                      >
                        <Link href={`/dashboard/find-work/${g.id}`} className="block">
                          <Card className="rounded-2xl hover:shadow-md transition bg-white">
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {applied && (
                                      <Badge className="rounded-full bg-orange-100 text-orange-900 border border-orange-200">
                                        Applied
                                      </Badge>
                                    )}
                                    <div className="font-extrabold text-gray-900 truncate">{g.title}</div>
                                    <Badge className="rounded-full bg-[var(--primary)] text-white">Open</Badge>
                                  </div>

                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-700">
                                    <span className="inline-flex items-center gap-2 font-semibold">
                                      <Briefcase size={16} className="text-[var(--primary)]" />
                                      {g.category?.item || "Category"}
                                    </span>

                                    <span className="text-gray-400">•</span>

                                    <span className="inline-flex items-center gap-2 font-semibold">
                                      <MapPin size={16} className="text-[var(--primary)]" />
                                      {g.workMode === "Remote" ? "Remote" : g.location || "—"}
                                    </span>

                                    <span className="text-gray-400">•</span>

                                    <span className="inline-flex items-center gap-2 font-semibold">
                                      <Clock size={16} className="text-[var(--primary)]" />
                                      {timeAgo(g.createdAt)}
                                    </span>

                                    <span className="text-gray-400">•</span>

                                    <span className="inline-flex items-center gap-2 font-semibold">
                                      <Users size={16} className="text-[var(--primary)]" />
                                      {applicants} applicant{applicants === 1 ? "" : "s"}
                                    </span>
                                  </div>

                                  {!!g.requiredSkills?.length && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {g.requiredSkills.slice(0, 6).map((s) => (
                                        <span
                                          key={s}
                                          className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
                                        >
                                          {s}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {!!g.sdgTags?.length && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {g.sdgTags.slice(0, 4).map((t) => (
                                        <span
                                          key={t}
                                          className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
                                        >
                                          {t}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="text-right">
                                  <div className="text-sm text-gray-500 font-semibold">Budget</div>
                                  <div className="text-xl font-extrabold inline-flex items-center gap-2 justify-end">
                                    <Wallet size={16} className="text-[var(--primary)]" />
                                    {budgetLabel(g)}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    )
                  })}

                  {/* Pagination / Load more */}
                  <div className="pt-2">
                    {swipeHint}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-gray-500 font-semibold">
                        Loaded {items.length} gig{items.length === 1 ? "" : "s"}
                      </div>

                      {hasMore && (
                        <button
                          onClick={() => fetchPage("next")}
                          disabled={loading}
                          className="rounded-2xl bg-white border px-4 py-2 text-sm font-extrabold hover:shadow-sm transition disabled:opacity-60"
                        >
                          {loading ? "Loading..." : "Load next 10"}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right rail */}
            <div className="space-y-4 hidden lg:block">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold">Tip</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  Apply early and tailor your cover letter to the gig’s skills + SDGs.
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
function doc(db: Firestore, arg1: string, id: string, arg3: string, uid: string): import("@firebase/firestore").DocumentReference<unknown, import("@firebase/firestore").DocumentData> {
    throw new Error("Function not implemented.")
}

