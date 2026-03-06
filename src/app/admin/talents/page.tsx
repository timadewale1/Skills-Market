"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useState } from "react"
import RequireAdmin from "@/components/admin/RequireAdmin"
import AdminNavbar from "@/components/admin/AdminNavbar"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  SlidersHorizontal,
  ShieldCheck,
  X,
  Search as SearchIcon,
  Edit,
  Ban,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import TalentFilters, { TalentFilterState } from "@/components/talent/TalentFilters"
import Link from "next/link"
import toast from "react-hot-toast"

type Availability = "Full-time" | "Part-time" | "Contract"
type WorkMode = "Remote" | "Hybrid" | "On-site"

type TalentRow = {
  uid: string
  slug?: string
  fullName: string
  location?: string
  roleTitle?: string
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
  disabled?: boolean
}

export default function AdminTalentsPage() {
  const [items, setItems] = useState<TalentRow[]>([])
  const [loading, setLoading] = useState(true)

  // search
  const [search, setSearch] = useState("")

  // filters
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [onlyVerified, setOnlyVerified] = useState(false)
  const [selectedSDGs, setSelectedSDGs] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [availability, setAvailability] = useState<"all" | Availability>("all")
  const [workMode, setWorkMode] = useState<"all" | WorkMode>("all")
  const [verificationStatus, setVerificationStatus] = useState<"all" | "verified" | "pending" | "not_submitted">("all")

  const [minExp, setMinExp] = useState<string>("")
  const [maxExp, setMaxExp] = useState<string>("")
  const [minRate, setMinRate] = useState<string>("")
  const [maxRate, setMaxRate] = useState<string>("")

  useEffect(() => {
    const run = async () => {
      setLoading(true)

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
          yearsExperience: typeof d?.talent?.yearsExperience === "number" ? d.talent.yearsExperience : null,
          rating: d?.rating || { avg: 0, count: 0 },
          verification: d?.verification || { status: "not_submitted" },
          disabled: d?.disabled || false,
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
        const hay = [
          t.fullName,
          t.roleTitle,
          t.location,
          (t.skills || []).join(" "),
          (t.categories || []).join(" "),
          (t.sdgTags || []).join(" "),
        ].filter(Boolean).join(" ").toLowerCase()

        if (!hay.includes(q)) return false
      }

      // verified only
      if (onlyVerified && t.verification?.status !== "verified") return false

      // verification status
      if (verificationStatus !== "all" && t.verification?.status !== verificationStatus) return false

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
    verificationStatus,
    minExp,
    maxExp,
    minRate,
    maxRate,
  ])

  const clearFilters = () => {
    setOnlyVerified(false)
    setSelectedSDGs([])
    setSelectedCategories([])
    setAvailability("all")
    setWorkMode("all")
    setVerificationStatus("all")
    setMinExp("")
    setMaxExp("")
    setMinRate("")
    setMaxRate("")
  }

  const toggleArray = (arr: string[], value: string, setArr: (v: string[]) => void) => {
    setArr(arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value])
  }

  const filterValue: TalentFilterState & { verificationStatus: string } = {
    onlyVerified,
    selectedSDGs,
    selectedCategories,
    availability,
    workMode,
    minExp,
    maxExp,
    minRate,
    maxRate,
    verificationStatus,
  }

  const handleFiltersChange = (next: TalentFilterState & { verificationStatus?: string }) => {
    setOnlyVerified(next.onlyVerified)
    setSelectedSDGs(next.selectedSDGs)
    setSelectedCategories(next.selectedCategories)
    setAvailability(next.availability)
    setWorkMode(next.workMode)
    setMinExp(next.minExp)
    setMaxExp(next.maxExp)
    setMinRate(next.minRate)
    setMaxRate(next.maxRate)
    if (next.verificationStatus) setVerificationStatus(next.verificationStatus as any)
  }

  const FiltersUI = (
    <TalentFilters value={filterValue} onChange={handleFiltersChange} onClear={clearFilters} />
  )

  const handleAction = async (action: string, talent: TalentRow) => {
    try {
      const publicProfileRef = doc(db, "publicProfiles", talent.uid)
      const userRef = doc(db, "users", talent.uid)

      switch (action) {
        case "verify":
          await updateDoc(publicProfileRef, {
            "verification.status": "verified"
          })
          toast.success("Talent verified successfully")
          break
        case "reject":
          await updateDoc(publicProfileRef, {
            "verification.status": "rejected"
          })
          toast.success("Verification rejected")
          break
        case "disable":
          await updateDoc(publicProfileRef, { disabled: true })
          toast.success("Talent disabled")
          break
        case "enable":
          await updateDoc(publicProfileRef, { disabled: false })
          toast.success("Talent enabled")
          break
        case "delete":
          await deleteDoc(publicProfileRef)
          await deleteDoc(userRef)
          toast.success("Talent deleted")
          break
      }

      // Refresh data
      window.location.reload()
    } catch (error) {
      toast.error("Action failed")
      console.error(error)
    }
  }

  return (
    <RequireAdmin>
      <AdminNavbar />

      <div className="bg-[var(--secondary)] min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* HEADER */}
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold">Manage Talents</h1>
              <p className="text-gray-600 mt-1 text-sm">
                Search, filter, and manage talent profiles — verify, disable, or edit details.
              </p>
            </div>

            {/* Search (desktop only here) */}
            <div className="hidden md:block w-[420px]">
              <div className="relative">
                <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search talents..."
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
                    {onlyVerified || selectedSDGs.length || selectedCategories.length || availability !== "all" || workMode !== "all" || verificationStatus !== "all" || minExp || maxExp || minRate || maxRate
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
                placeholder="Search talents..."
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
                  <CardContent className="p-6 text-sm text-gray-600">Loading talents...</CardContent>
                </Card>
              ) : filtered.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="p-6 text-sm text-gray-600">No talents found.</CardContent>
                </Card>
              ) : (
                filtered.map((t) => (
                  <Card key={t.uid} className="rounded-2xl hover:shadow-md transition">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center font-extrabold text-[var(--primary)] overflow-hidden">
                            {t.photoURL ? (
                              <img src={t.photoURL} alt={t.fullName} className="h-full w-full object-cover" />
                            ) : (
                              (t.fullName || "T").slice(0, 1).toUpperCase()
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Link
                                href={`/admin/talents/${t.slug || t.uid}`}
                                className="font-extrabold text-gray-900 hover:text-[var(--primary)] transition"
                              >
                                {t.fullName}
                              </Link>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                t.verification?.status === "verified"
                                  ? "bg-green-100 text-green-700"
                                  : t.verification?.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}>
                                {t.verification?.status === "verified" ? "Verified" :
                                 t.verification?.status === "pending" ? "Pending" : "Not Submitted"}
                              </span>
                              {t.disabled && (
                                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                                  Disabled
                                </span>
                              )}
                            </div>

                            <div className="text-sm text-gray-700 font-semibold mb-1">
                              {t.roleTitle || "Role title not set"}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                              <span>{t.location || "Location not set"}</span>
                              {t.hourlyRate && <span>₦{Number(t.hourlyRate).toLocaleString()}/hr</span>}
                              {t.yearsExperience && <span>{t.yearsExperience} years exp</span>}
                            </div>

                            <div className="flex flex-wrap gap-1 mb-2">
                              {(t.skills || []).slice(0, 3).map((skill) => (
                                <span key={skill} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                                  {skill}
                                </span>
                              ))}
                              {(t.skills || []).length > 3 && (
                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                                  +{(t.skills || []).length - 3} more
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {(t.sdgTags || []).slice(0, 2).map((sdg) => (
                                <span key={sdg} className="text-xs px-2 py-1 rounded-full border text-gray-700">
                                  {sdg}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/admin/talents/${t.slug || t.uid}`}
                            className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:shadow-sm transition"
                          >
                            <Edit size={14} />
                            Edit
                          </Link>

                          <div className="flex flex-col gap-1">
                            {t.verification?.status !== "verified" && (
                              <button
                                onClick={() => handleAction("verify", t)}
                                className="inline-flex items-center gap-2 rounded-xl bg-green-600 text-white px-3 py-2 text-sm font-semibold hover:bg-green-700 transition"
                              >
                                <CheckCircle size={14} />
                                Verify
                              </button>
                            )}

                            {t.verification?.status === "pending" && (
                              <button
                                onClick={() => handleAction("reject", t)}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 text-white px-3 py-2 text-sm font-semibold hover:bg-red-700 transition"
                              >
                                <X size={14} />
                                Reject
                              </button>
                            )}

                            {!t.disabled ? (
                              <button
                                onClick={() => handleAction("disable", t)}
                                className="inline-flex items-center gap-2 rounded-xl bg-yellow-600 text-white px-3 py-2 text-sm font-semibold hover:bg-yellow-700 transition"
                              >
                                <Ban size={14} />
                                Disable
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction("enable", t)}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-3 py-2 text-sm font-semibold hover:bg-blue-700 transition"
                              >
                                <CheckCircle size={14} />
                                Enable
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
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
    </RequireAdmin>
  )
}