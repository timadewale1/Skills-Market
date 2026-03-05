"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, useMemo } from "react"
import { useSearch } from "@/context/SearchContext"
import toast from "react-hot-toast"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  limit,
  startAfter,
  deleteDoc,
} from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import TalentCard, { TalentRow } from "@/components/talent/PaginatedList"
import TalentFilters, {
  TalentFilterState,
  Availability,
  WorkMode,
} from "@/components/talent/TalentFilters"

export default function SavedTalentsPage() {
  const { user } = useAuth()
  const { query: searchQuery } = useSearch()

  const [items, setItems] = useState<TalentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  const [lastDoc, setLastDoc] = useState<any | null>(null)
  const pageSize = 12
  const [hasMore, setHasMore] = useState(false)

  // filters (shared with search/browse page)
  const [filtersOpen, setFiltersOpen] = useState(false)
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
      if (!user?.uid) return
      setLoading(true)
      try {
        const q = query(
          collection(db, `users/${user.uid}/savedTalents`),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        )
        const snap = await getDocs(q)
        const rows: TalentRow[] = []
        for (const d of snap.docs) {
          const s: any = d.data()
          const row: TalentRow = {
            uid: s.talentUid,
            fullName: s.fullName || "",
            photoURL: s.photoURL || "",
            rating: { avg: 0, count: 0 },
          }
          try {
            const pp = await getDoc(doc(db, "publicProfiles", s.talentUid))
            if (pp.exists()) {
              const p: any = pp.data()
              row.rating = p.rating || { avg: 0, count: 0 }
              row.slug = p.slug
            }
          } catch {}
          rows.push(row)
        }
        setItems(rows)
        setLastDoc(snap.docs[snap.docs.length - 1] ?? null)
        setHasMore(snap.docs.length === pageSize)
      } catch (err) {
        console.error("Failed to load saved talents", err)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [user?.uid])

  const filteredItems = useMemo(() => {
    return items.filter((t) => {
      const needle = searchQuery.trim().toLowerCase()
      if (needle) {
        const hay = [
          t.fullName,
          t.roleTitle,
          t.location,
          (t.skills || []).join(" "),
          (((t as any).categories || []) as string[]).join(" "),
          (((t as any).sdgTags || []) as string[]).join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        if (!hay.includes(needle)) return false
      }

      if (onlyVerified && t.verification?.status !== "verified") return false

      if (selectedSDGs.length) {
        const s = new Set(((t as any).sdgTags || []) as string[])
        const ok = selectedSDGs.some((x) => s.has(x))
        if (!ok) return false
      }

      if (selectedCategories.length) {
        const s = new Set(((t as any).categories || []) as string[])
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
  }, [
    items,
    searchQuery,
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

  return (
    <RequireAuth>
      <AuthNavbar />
      <div className="min-h-[calc(100vh-64px)] bg-[var(--secondary)]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* header / mobile filter button */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-extrabold">Saved Talent</h1>
            <button
              onClick={() => setFiltersOpen(true)}
              className="md:hidden text-sm font-semibold text-[var(--primary)]"
            >
              Filters
            </button>
          </div>

          {loading ? (
            <Card className="rounded-2xl">
              <CardContent className="p-6 text-sm text-gray-600">
                Loading…
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-6 text-sm text-gray-600">
                You haven't saved any talent yet.
              </CardContent>
            </Card>
          ) : (
            <>
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

              {/* grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((t, i) => (
                  <div key={t.uid} className="relative">
                    <TalentCard t={t} idx={i} />
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={async () => {
                          if (!user?.uid) return
                          try {
                            await deleteDoc(doc(db, `users/${user.uid}/savedTalents/${t.uid}`))
                            setItems((cur) => cur.filter((x) => x.uid !== t.uid))
                            toast.success("Talent removed from saved")
                          } catch (e) {
                            console.error(e)
                            toast.error("Failed to unsave talent")
                          }
                        }}
                        className="rounded-2xl border bg-white px-3 py-1 text-sm font-extrabold hover:shadow-sm transition"
                      >
                        Unsave
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination / Load more */}
              <div className="pt-4">
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-500 font-semibold">
                    Loaded {items.length} talent{items.length === 1 ? "" : "s"}
                  </div>

                  {hasMore && (
                    <button
                      onClick={async () => {
                        if (!user?.uid || !lastDoc) return
                        setPageLoading(true)
                        try {
                          const q = query(
                            collection(db, `users/${user.uid}/savedTalents`),
                            orderBy("createdAt", "desc"),
                            startAfter(lastDoc),
                            limit(pageSize)
                          )
                          const snap = await getDocs(q)
                          const rows: TalentRow[] = []
                          for (const d of snap.docs) {
                            const s: any = d.data()
                            const row: TalentRow = {
                              uid: s.talentUid,
                              fullName: s.fullName || "",
                              photoURL: s.photoURL || "",
                              rating: { avg: 0, count: 0 },
                            }
                            try {
                              const pp = await getDoc(doc(db, "publicProfiles", s.talentUid))
                              if (pp.exists()) {
                                const p: any = pp.data()
                                row.rating = p.rating || { avg: 0, count: 0 }
                                row.slug = p.slug
                              }
                            } catch {}
                            rows.push(row)
                          }
                          setItems((cur) => [...cur, ...rows])
                          setLastDoc(snap.docs[snap.docs.length - 1] ?? null)
                          setHasMore(snap.docs.length === pageSize)
                        } catch (e) {
                          console.error(e)
                        } finally {
                          setPageLoading(false)
                        }
                      }}
                      disabled={pageLoading}
                      className="rounded-2xl bg-white border px-4 py-2 text-sm font-extrabold hover:shadow-sm transition disabled:opacity-60"
                    >
                      {pageLoading ? "Loading..." : `Load next ${pageSize}`}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </RequireAuth>
  )
}
