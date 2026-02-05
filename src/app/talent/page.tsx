"use client"

import { useEffect, useMemo, useState } from "react"
// import Link from "next/link"
import AuthNavbar from "@/components/layout/AuthNavbar"
import Navbar from "@/components/layout/Navbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  SlidersHorizontal,
  ShieldCheck,
  X,
  Search as SearchIcon,
} from "lucide-react"

import TalentFilters, { TalentFilterState } from "@/components/talent/TalentFilters"
import PaginatedCard from "@/components/talent/PaginatedList"

type Availability = "Full-time" | "Part-time" | "Contract"
type WorkMode = "Remote" | "Hybrid" | "On-site"


type TalentRow = {
  uid: string
  slug?: string
  fullName: string
  location?: string
  roleTitle?: string

  // read from publicProfiles doc
  hourlyRate?: number | null
  photoURL?: string
  categories?: string[]
  sdgTags?: string[]
  skills?: string[]
  availability?: Availability | string
  workMode?: WorkMode | string
  yearsExperience?: number | null

  rating?: { avg?: number; count?: number }
  verification?: { status?: string }
}

// category items provided inside TalentFilters

export default function TalentBrowsePage() {
  const { user } = useAuth()
  const [items, setItems] = useState<TalentRow[]>([])
  const [loading, setLoading] = useState(true)

  // search
  const [search, setSearch] = useState("")

  // filters
  const [filtersOpen, setFiltersOpen] = useState(false) // mobile drawer
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
    const run = async () => {
      setLoading(true)

      // ✅ correct collection
      const qy = query(collection(db, "publicProfiles"), where("role", "==", "talent"))
      const snap = await getDocs(qy)

      const rows: TalentRow[] = snap.docs.map((docx) => {
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
          yearsExperience:
            typeof d?.talent?.yearsExperience === "number" ? d.talent.yearsExperience : null,

          rating: d?.rating || { avg: 0, count: 0 },
          verification: d?.verification || { status: "not_submitted" },
        }
      })

      setItems(rows)
      setLoading(false)
    }

    run()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    const minE = minExp.trim() ? Number(minExp) : null
    const maxE = maxExp.trim() ? Number(maxExp) : null
    const minR = minRate.trim() ? Number(minRate) : null
    const maxR = maxRate.trim() ? Number(maxRate) : null

    return items.filter((t) => {
      // search text
      if (q) {
        const hay =
          [
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

        if (!hay.includes(q)) return false
      }

      // verified only
      if (onlyVerified && t.verification?.status !== "verified") return false

      // sdgs multi
      if (selectedSDGs.length) {
        const s = new Set(t.sdgTags || [])
        const ok = selectedSDGs.some((x) => s.has(x))
        if (!ok) return false
      }

      // categories multi
      if (selectedCategories.length) {
        const s = new Set(t.categories || [])
        const ok = selectedCategories.some((x) => s.has(x))
        if (!ok) return false
      }

      // availability
      if (availability !== "all" && (t.availability || "") !== availability) return false

      // work mode
      if (workMode !== "all" && (t.workMode || "") !== workMode) return false

      // experience range
      if (minE != null) {
        const v = Number(t.yearsExperience ?? -1)
        if (v < minE) return false
      }
      if (maxE != null) {
        const v = Number(t.yearsExperience ?? 9999)
        if (v > maxE) return false
      }

      // rate range
      const rate = t.hourlyRate == null ? null : Number(t.hourlyRate)
      if (minR != null) {
        if (rate == null || rate < minR) return false
      }
      if (maxR != null) {
        if (rate == null || rate > maxR) return false
      }

      return true
    })
  }, [
    items,
    search,
    onlyVerified,
    selectedSDGs,
    selectedCategories,
    availability,
    workMode,
    minExp,
    maxExp,
    minRate,
    maxRate,
  ])

  const TopNav = user ? <AuthNavbar /> : <Navbar />

  const clearFilters = () => {
    setOnlyVerified(false)
    setSelectedSDGs([])
    setSelectedCategories([])
    setAvailability("all")
    setWorkMode("all")
    setMinExp("")
    setMaxExp("")
    setMinRate("")
    setMaxRate("")
  }

  const toggleArray = (arr: string[], value: string, setArr: (v: string[]) => void) => {
    setArr(arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value])
  }

  const filterValue: TalentFilterState = {
    onlyVerified,
    selectedSDGs,
    selectedCategories,
    availability,
    workMode,
    minExp,
    maxExp,
    minRate,
    maxRate,
  }

  const handleFiltersChange = (next: TalentFilterState) => {
    setOnlyVerified(next.onlyVerified)
    setSelectedSDGs(next.selectedSDGs)
    setSelectedCategories(next.selectedCategories)
    setAvailability(next.availability)
    setWorkMode(next.workMode)
    setMinExp(next.minExp)
    setMaxExp(next.maxExp)
    setMinRate(next.minRate)
    setMaxRate(next.maxRate)
  }

  const FiltersUI = (
    <TalentFilters value={filterValue} onChange={handleFiltersChange} onClear={clearFilters} />
  )

  return (
    <div className="min-h-screen bg-[var(--secondary)]">
      {TopNav}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* HEADER */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Browse Talent</h1>
            <p className="text-gray-600 mt-1 text-sm">
              Search by name, role, skills, SDGs, or categories — then filter down.
            </p>
          </div>

          {/* Search (desktop only here) */}
          <div className="hidden md:block w-[420px]">
            <div className="relative">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search talent..."
                className="rounded-2xl pl-9"
              />
            </div>
          </div>
        </div>

        {/* MOBILE: Tip + Filters BEFORE search */}
        <div className="mt-4 md:hidden grid grid-cols-1 gap-3">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-extrabold">Tip</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              Combine <span className="font-bold">skills</span> + <span className="font-bold">location</span> +{" "}
              <span className="font-bold">category</span> keywords for fast matches.
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="font-extrabold">Filters</div>
                <div className="text-xs text-gray-600">
                  {onlyVerified || selectedSDGs.length || selectedCategories.length || availability !== "all" || workMode !== "all" || minExp || maxExp || minRate || maxRate
                    ? "Active filters applied"
                    : "No filters applied"}
                </div>
              </div>
              <button
                onClick={() => setFiltersOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-extrabold hover:shadow-sm transition"
              >
                <SlidersHorizontal size={16} />
                Open
              </button>
            </CardContent>
          </Card>

          <div className="relative">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search talent..."
              className="rounded-2xl pl-9"
            />
          </div>
        </div>

        {/* DESKTOP LAYOUT */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LIST */}
          <div className="lg:col-span-2 space-y-3">
            {loading ? (
              <Card className="rounded-2xl">
                <CardContent className="p-6 text-sm text-gray-600">Loading talent...</CardContent>
              </Card>
            ) : filtered.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="p-6 text-sm text-gray-600">No talent found.</CardContent>
              </Card>
            ) : (
              filtered.map((t, idx) => <PaginatedCard key={t.uid} t={t} idx={idx} />)
            )}
          </div>

          {/* DESKTOP: Tip + Filters */}
          <div className="hidden lg:block space-y-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base font-extrabold">Tip</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Use skills + location + categories for best matches quickly.
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[var(--primary)]" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>{FiltersUI}</CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* MOBILE FILTER DRAWER */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="font-extrabold text-lg">Filters</div>
              <button onClick={() => setFiltersOpen(false)} className="p-2 rounded-xl border">
                <X size={18} />
              </button>
            </div>

            {FiltersUI}

            <div className="mt-6">
              <button
                onClick={() => setFiltersOpen(false)}
                className="w-full rounded-2xl bg-[var(--primary)] text-white font-extrabold py-3 hover:opacity-90 transition"
              >
                Apply filters ({filtered.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// local Chip removed; TalentFilters provides its own chip UI
