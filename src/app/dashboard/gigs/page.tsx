// src/app/dashboard/gigs/page.tsx
"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Button from "@/components/ui/Button"
import { motion } from "framer-motion"
import {
  Briefcase,
  PlusCircle,
  Search,
  Paperclip,
  Calendar,
  MapPin,
  ArrowRight,
  Filter,
  X,
} from "lucide-react"

type GigStatus = "open" | "closed" | "draft"

type GigRow = {
  id: string
  title: string
  description?: string
  status?: GigStatus
  budgetType?: "fixed" | "hourly"
  hourlyRate?: number | null
  fixedBudget?: number | null
  location?: string
  createdAt?: any
  sdgTags?: string[]
  attachments?: { name: string; url: string; type?: string; size?: number }[]
  clientUid?: string
  categories?: string[]
  categoryGroup?: string
}


const PAGE_SIZE = 10

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 * i, duration: 0.3 },
  }),
}

const floaty = {
  animate: { y: [0, -4, 0] },
  transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const },
}

function formatNaira(n?: number | null) {
  if (!n && n !== 0) return "-"
  return `₦${Number(n).toLocaleString()}`
}

function formatDate(ts: any) {
  try {
    const d = ts?.toDate?.() ? ts.toDate() : ts
    if (!d) return "-"
    return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(d)
  } catch {
    return "-"
  }
}

function StatusBadge({ status }: { status?: GigStatus }) {
  const s = status || "open"
  const cls =
    s === "open"
      ? "bg-emerald-600 text-white"
      : s === "closed"
      ? "bg-gray-700 text-white"
      : "bg-orange-100 text-orange-700"
  const label = s === "open" ? "Open" : s === "closed" ? "Closed" : "Draft"
  return <Badge className={`rounded-full ${cls}`}>{label}</Badge>
}

export default function MyGigsPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [role, setRole] = useState<"client" | "talent" | null>(null)
  const [loading, setLoading] = useState(true)

  // data + pagination
  const [items, setItems] = useState<GigRow[]>([])
  const [pageSnaps, setPageSnaps] = useState<QueryDocumentSnapshot<DocumentData>[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // filters/search
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<GigStatus | "all">("all")
  const [filtersOpen, setFiltersOpen] = useState(false)

  // swipe hint
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollHints = () => {
    const el = sliderRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    updateScrollHints()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length])

  useEffect(() => {
    const el = sliderRef.current
    if (!el) return
    const onScroll = () => updateScrollHints()
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  const baseQuery = () => {
    if (!user?.uid) return null
    const col = collection(db, "gigs")
    return query(
      col,
      where("clientUid", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE)
    )
  }

  const runFetch = async (mode: "first" | "next") => {
    if (!user?.uid) return

    setLoading(true)
    try {
      // role guard (client only)
      // (We’re reading role from users/{uid} lightly by checking a cached value if you already have it elsewhere.
      // If you prefer, wire role from your existing auth context profile doc.)
      if (!role) {
        // minimal role fetch from users doc
        const { doc, getDoc } = await import("firebase/firestore")
        const snap = await getDoc(doc(db, "users", user.uid))
        const r = (snap.data() as any)?.role as "client" | "talent" | undefined
        setRole(r || "talent")
      }

      const bq = baseQuery()
      if (!bq) return

      let qy = bq
      if (mode === "next" && pageSnaps[pageSnaps.length - 1]) {
        qy = query(
          collection(db, "gigs"),
          where("clientUid", "==", user.uid),
          orderBy("createdAt", "desc"),
          startAfter(pageSnaps[pageSnaps.length - 1]),
          limit(PAGE_SIZE)
        )
      }

      const snap = await getDocs(qy)

      const rows: GigRow[] = snap.docs.map((d) => {
        const x: any = d.data()
        return {
          id: d.id,
          title: x.title || "Untitled gig",
          description: x.description || "",
          status: (x.status as GigStatus) || "open",
          budgetType: x.budgetType || "fixed",
          hourlyRate: x.hourlyRate ?? null,
          fixedBudget: x.fixedBudget ?? null,
          location: x.location || "",
          createdAt: x.createdAt,
          categories: x?.category ? [x.category.item] : [],
          categoryGroup: x?.category?.group || "",
          sdgTags: x.sdgTags || [],
          attachments: x.attachments || [],
          clientUid: x.clientUid,
        }
      })

      if (mode === "first") {
        setItems(rows)
        setPage(1)
        setPageSnaps(snap.docs.length ? [snap.docs[snap.docs.length - 1]] : [])
      } else {
        setItems(rows)
        setPage((p) => p + 1)
        setPageSnaps((prev) => [...prev, snap.docs[snap.docs.length - 1]].filter(Boolean) as any)
      }

      setHasMore(snap.docs.length === PAGE_SIZE)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    if (!user?.uid) return
    runFetch("first")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  // Client-side filtering/search (fast MVP)
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return items.filter((g) => {
      const okStatus = status === "all" ? true : (g.status || "open") === status
      if (!okStatus) return false
      if (!qq) return true
      const blob = [
        g.title,
        g.location,
        (g.categories || []).join(" "),
        (g.sdgTags || []).join(" "),
        g.description || "",
      ]
        .join(" ")
        .toLowerCase()
      return blob.includes(qq)
    })
  }, [items, q, status])

  // role gate
  useEffect(() => {
    if (role && role !== "client") {
      router.replace("/dashboard")
    }
  }, [role, router])

  const empty = !loading && filtered.length === 0

  return (
    <RequireAuth>
      <AuthNavbar />

      <div className="bg-[var(--secondary)] min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0} className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">My gigs</h1>
              <p className="text-gray-600 mt-2">
                Manage your posted gigs, attachments, and hiring pipeline (coming next).
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setFiltersOpen(true)}
                className="md:hidden"
              >
                <div className="flex items-center gap-2">
                  <Filter size={16} />
                  Filters
                </div>
              </Button>

              <Link href="/dashboard/post-gig">
                <Button>
                  <div className="flex items-center gap-2">
                    <PlusCircle size={16} />
                    Post a gig
                  </div>
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Desktop controls (collapsible) */}
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={1} className="mt-6">
            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search gigs by title, category, SDGs, location..."
                        className="rounded-2xl pl-9"
                      />
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-2">
                    <Button variant={status === "all" ? "primary" : "outline"} onClick={() => setStatus("all")}>
                      All
                    </Button>
                    <Button variant={status === "open" ? "primary" : "outline"} onClick={() => setStatus("open")}>
                      Open
                    </Button>
                    <Button variant={status === "closed" ? "primary" : "outline"} onClick={() => setStatus("closed")}>
                      Closed
                    </Button>
                    <Button variant={status === "draft" ? "primary" : "outline"} onClick={() => setStatus("draft")}>
                      Draft
                    </Button>
                  </div>
                </div>

                {/* Swipe hint (for the list area below) */}
                <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="h-8 w-8 rounded-xl bg-orange-50 flex items-center justify-center"
                      {...floaty}
                    >
                      <Briefcase className="text-[var(--primary)]" size={16} />
                    </motion.div>
                    <span className="font-semibold">Tip:</span> On mobile, swipe horizontally on gig cards for quick peek.
                  </div>

                  <div className="hidden md:block text-xs font-semibold text-gray-500">
                    Showing {filtered.length} of {items.length} loaded
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Mobile Filters Sheet */}
          {filtersOpen && (
            <div className="fixed inset-0 z-50 bg-black/30 md:hidden">
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-lg">Filters</div>
                  <button onClick={() => setFiltersOpen(false)} className="text-gray-600">
                    <X />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="text-sm font-extrabold">Status</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(["all", "open", "closed", "draft"] as const).map((s) => (
                      <Button
                        key={s}
                        variant={status === s ? "primary" : "outline"}
                        onClick={() => setStatus(s)}
                      >
                        {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
                      </Button>
                    ))}
                  </div>

                  <div className="text-sm font-extrabold mt-4">Search</div>
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search gigs..."
                    className="rounded-2xl"
                  />

                  <div className="pt-2">
                    <Button
                      onClick={() => setFiltersOpen(false)}
                      className="w-full"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="mt-6">
            {loading ? (
              <Card className="rounded-2xl">
                <CardContent className="p-6 text-sm text-gray-600">Loading your gigs…</CardContent>
              </Card>
            ) : empty ? (
              <Card className="rounded-2xl">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center">
                      <Briefcase className="text-[var(--primary)]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-extrabold">No gigs found</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Try adjusting filters or post your first gig.
                      </div>

                      <div className="mt-4">
                        <Link href="/dashboard/post-gig">
                          <Button>
                            <div className="flex items-center gap-2">
                              <PlusCircle size={16} />
                              Post a gig
                            </div>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Card row container with subtle swipe affordance */}
                <div className="relative">
                  {/* swipe indicators */}
                  {canScrollLeft && (
                    <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[var(--secondary)] to-transparent" />
                  )}
                  {canScrollRight && (
                    <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[var(--secondary)] to-transparent" />
                  )}

                  <div
                    ref={sliderRef}
                    className="space-y-3"
                  >
                    {filtered.map((g, idx) => {
                      const attachCount = (g.attachments || []).length
                      const budgetLabel =
  g.budgetType === "hourly"
    ? g.hourlyRate
      ? `₦${Number(g.hourlyRate).toLocaleString()}/hr`
      : "-"
    : g.fixedBudget
    ? `₦${Number(g.fixedBudget).toLocaleString()}`
    : "-"


                      return (
                        <motion.div
                          key={g.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03, duration: 0.25 }}
                        >
                          <Link href={`/dashboard/gigs/${g.id}`} className="block">
                            <Card className="rounded-2xl hover:shadow-md transition bg-white">
                              <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <div className="font-extrabold text-gray-900 truncate">
                                        {g.title}
                                      </div>
                                      <StatusBadge status={g.status} />
                                      {!!attachCount && (
                                        <Badge className="rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                                          <span className="inline-flex items-center gap-1">
                                            <Paperclip size={14} />
                                            {attachCount}
                                          </span>
                                        </Badge>
                                      )}
                                    </div>

                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600">
                                      <span className="inline-flex items-center gap-1">
                                        <Calendar size={14} />
                                        {formatDate(g.createdAt)}
                                      </span>
                                      <span className="inline-flex items-center gap-1">
                                        <MapPin size={14} />
                                        {g.location || "Remote / Not set"}
                                      </span>
                                      <span className="font-semibold text-gray-800">
                                        {budgetLabel}
                                      </span>
                                    </div>

                                    {!!(g.categoryGroup || g.categories?.length || g.sdgTags?.length) && (
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {!!g.categoryGroup && (
                                          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                            {g.categoryGroup}
                                          </span>
                                        )}
                                        {(g.categories || []).slice(0, 3).map((c) => (
                                          <span
                                            key={c}
                                            className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
                                          >
                                            {c}
                                          </span>
                                        ))}
                                        {(g.sdgTags || []).slice(0, 2).map((t) => (
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

                                  <div className="shrink-0 flex items-center gap-2">
                                    <div className="hidden md:block text-sm font-extrabold text-[var(--primary)]">
                                      View
                                    </div>
                                    <ArrowRight className="text-gray-400" size={18} />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* Pagination controls */}
                <div className="mt-5 flex items-center justify-between">
                  <div className="text-xs font-semibold text-gray-600">
                    Page {page} • {items.length} loaded
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => {
                        // MVP: easiest “Prev” is refetch from scratch and cache pages later.
                        // For now, we’ll just reload first page.
                        // If you want true Prev paging, we can store page snapshots and re-query by startAfter(previousPageStart).
                        runFetch("first")
                      }}
                    >
                      Prev
                    </Button>
                    <Button
                      disabled={!hasMore}
                      onClick={() => runFetch("next")}
                    >
                      Next
                    </Button>
                  </div>
                </div>

                {/* Swipe micro-indicator */}
                <div className="mt-4 flex justify-center">
                  <div className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400" />
                    <span>Swipe on mobile to browse more comfortably</span>
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
