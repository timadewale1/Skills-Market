"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { ensureThread } from "@/lib/chat"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore"
import Link from "next/link"
import toast from "react-hot-toast"
import { motion } from "framer-motion"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

import {
  ArrowLeft,
  Sparkles,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Star,
  Download,
  ExternalLink,
  Mail,
  Lock,
} from "lucide-react"

type Gig = {
  id: string
  title: string
  clientUid?: string
  status: "open" | "closed"
  budgetType?: "hourly" | "fixed"
  hourlyRate?: number | null
  fixedBudget?: number | null
  duration?: string | null
  hiresNeeded?: number | null
}

type ProposalStatus = "submitted" | "shortlisted" | "accepted" | "rejected" | "withdrawn"

type Proposal = {
  gigId: string
  talentUid: string
  talentName?: string
  talentEmail?: string
  talentSlug?: string // ✅ preferred
  coverLetter: string
  proposedRate?: number | null
  proposedDuration?: string | null
  attachments?: { name: string; url: string; size?: number; contentType?: string }[]
  status: ProposalStatus
  createdAt?: any
  updatedAt?: any
  viewedAt?: any | null
}

const TABS: Array<{ key: "all" | ProposalStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "submitted", label: "Submitted" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
]

function money(n?: number | null) {
  if (n === null || n === undefined) return "—"
  return `₦${Number(n).toLocaleString()}`
}

function gigBudgetLabel(g?: Gig | null) {
  if (!g) return "—"
  if (g.budgetType === "hourly") return `${money(g.hourlyRate)}/hr`
  if (g.budgetType === "fixed") return `${money(g.fixedBudget)} fixed`
  return "—"
}

export default function GigProposalsPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const router = useRouter()
  const { user } = useAuth()

  const [gig, setGig] = useState<Gig | null>(null)
  const [loading, setLoading] = useState(true)

  const [items, setItems] = useState<Proposal[]>([])
  const [tab, setTab] = useState<"all" | ProposalStatus>("all")
  const [q, setQ] = useState("")

  const [open, setOpen] = useState<Proposal | null>(null)
  const [mutating, setMutating] = useState(false)

  // cache talent publicProfiles for slug/name fallback
  const [talentMap, setTalentMap] = useState<Record<string, { slug?: string; fullName?: string; email?: string }>>({})

  const isOwner = useMemo(() => {
    if (!user?.uid || !gig?.clientUid) return false
    return user.uid === gig.clientUid
  }, [user?.uid, gig?.clientUid])

  const acceptedCount = useMemo(() => items.filter((x) => x.status === "accepted").length, [items])

  useEffect(() => {
    const run = async () => {
      if (!id) return
      setLoading(true)

      const g = await getDoc(doc(db, "gigs", id))
      const gigData = g.exists() ? ({ id: g.id, ...(g.data() as any) } as Gig) : null
      setGig(gigData)

      if (!gigData) {
        setItems([])
        setLoading(false)
        return
      }

      const qs = query(collection(db, "gigs", id, "proposals"), orderBy("createdAt", "desc"))
      const snap = await getDocs(qs)
      const rows = snap.docs.map((d) => d.data() as Proposal)
      setItems(rows)

      setLoading(false)
    }

    run()
  }, [id])

  // fetch missing talent slugs/names as fallback (only when needed)
  useEffect(() => {
    const run = async () => {
      if (!id) return
      const missing = Array.from(
        new Set(
          items
            .filter((p) => !p.talentSlug)
            .map((p) => p.talentUid)
            .filter((uid) => uid && !talentMap[uid])
        )
      )

      if (!missing.length) return

      const next: typeof talentMap = { ...talentMap }
      for (const uid of missing) {
        try {
          const ps = await getDoc(doc(db, "publicProfiles", uid))
          if (ps.exists()) {
            const data = ps.data() as any
            next[uid] = {
              slug: data.slug,
              fullName: data.fullName || data.publicProfile?.fullName,
              email: data.contactEmail,
            }
          } else {
            next[uid] = {}
          }
        } catch {
          next[uid] = {}
        }
      }
      setTalentMap(next)
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length }
    for (const t of TABS) {
      if (t.key === "all") continue
      c[t.key] = items.filter((x) => x.status === t.key).length
    }
    return c
  }, [items])

  const filtered = useMemo(() => {
    const queryText = q.trim().toLowerCase()
    return items.filter((p) => {
      if (tab !== "all" && p.status !== tab) return false
      if (!queryText) return true
      const blob = `${p.talentName || ""} ${p.talentEmail || ""} ${p.coverLetter || ""}`.toLowerCase()
      return blob.includes(queryText)
    })
  }, [items, tab, q])

  const getTalentName = (p: Proposal) =>
    p.talentName || talentMap[p.talentUid]?.fullName || "Talent"

  const getTalentSlug = (p: Proposal) =>
    p.talentSlug || talentMap[p.talentUid]?.slug

  const getTalentEmail = (p: Proposal) =>
    p.talentEmail || talentMap[p.talentUid]?.email || ""

  const maybeAutoCloseOrReopen = async (nextAcceptedCount: number, nextHiresNeeded: number, currentStatus: "open" | "closed") => {
    if (!id) return
    // close when filled
    if (nextAcceptedCount >= nextHiresNeeded && currentStatus === "open") {
      await updateDoc(doc(db, "gigs", id), {
        status: "closed",
        updatedAt: serverTimestamp(),
      })
      setGig((g) => (g ? { ...g, status: "closed" } : g))
      toast.success("Hiring slots filled — gig closed automatically")
      return
    }

    // reopen if hires increased beyond accepted
    if (nextAcceptedCount < nextHiresNeeded && currentStatus === "closed") {
      await updateDoc(doc(db, "gigs", id), {
        status: "open",
        updatedAt: serverTimestamp(),
      })
      setGig((g) => (g ? { ...g, status: "open" } : g))
      toast.success("Hires increased — gig reopened")
    }
  }

  const openProposal = async (p: Proposal) => {
    setOpen(p)
    if (!id) return

    // mark viewedAt for lock (owner)
    try {
      if (!p.viewedAt) {
        await updateDoc(doc(db, "gigs", id, "proposals", p.talentUid), {
          viewedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        setItems((prev) =>
          prev.map((x) =>
            x.talentUid === p.talentUid ? { ...x, viewedAt: true } : x
          )
        )
        setOpen((cur) => (cur && cur.talentUid === p.talentUid ? { ...cur, viewedAt: true } : cur))
      }
    } catch (e: any) {
      console.error(e)
      // if this fails, it’s rules. With the rules fix above, it will work.
    }
  }

  const setStatus = async (p: Proposal, next: ProposalStatus) => {
    if (!id || !gig) return
    setMutating(true)
    try {
      // update proposal doc
      await updateDoc(doc(db, "gigs", id, "proposals", p.talentUid), {
        status: next,
        updatedAt: serverTimestamp(),
      })

      // update user index too
      await updateDoc(doc(db, "users", p.talentUid, "proposals", id), {
        status: next,
        updatedAt: serverTimestamp(),
      })

      const nextItems = items.map((x) => (x.talentUid === p.talentUid ? { ...x, status: next } : x))
      setItems(nextItems)
      setOpen((cur) => (cur && cur.talentUid === p.talentUid ? { ...cur, status: next } : cur))

      // auto-close logic when accepting
      if (next === "accepted") {
        const nextAcceptedCount = nextItems.filter((x) => x.status === "accepted").length
        const hiresNeeded = Math.max(1, Number(gig.hiresNeeded || 1))
        await maybeAutoCloseOrReopen(nextAcceptedCount, hiresNeeded, gig.status)

        // Send acceptance notification to talent via API
        try {
          if (user?.uid) {
            const token = await user.getIdToken()
            await fetch("/api/proposals/accepted", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                gigId: id,
                gigTitle: gig.title,
                talentUid: p.talentUid,
              }),
            })
          }
        } catch (err) {
          console.error("Failed to send notification:", err)
        }
      }

      // send rejection notification when proposal is rejected
      if (next === "rejected") {
        try {
          if (user?.uid) {
            const token = await user.getIdToken()
            await fetch("/api/proposals/rejected", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                gigId: id,
                gigTitle: gig.title,
                talentUid: p.talentUid,
              }),
            })
          }
        } catch (err) {
          console.error("Failed to send rejection notification:", err)
        }
      }

      toast.success(
        next === "shortlisted" ? "Shortlisted" : next === "accepted" ? "Accepted" : "Rejected"
      )
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to update proposal (check Firestore rules)")
    } finally {
      setMutating(false)
    }
  }

  const saveHiresNeeded = async (val: number) => {
    if (!id || !gig) return
    const next = Math.max(1, Number.isFinite(val) ? val : 1)
    try {
      await updateDoc(doc(db, "gigs", id), {
        hiresNeeded: next,
        updatedAt: serverTimestamp(),
      })
      setGig((g) => (g ? { ...g, hiresNeeded: next } : g))

      // if gig was closed but you increased slots, reopen as needed
      await maybeAutoCloseOrReopen(acceptedCount, next, gig.status)
      toast.success("Hiring slots updated")
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to update hiring slots")
    }
  }

  if (loading) {
    return (
      <RequireAuth>
        <AuthNavbar />
        <div className="min-h-[calc(100vh-64px)] bg-[var(--secondary)]">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Card className="rounded-2xl">
              <CardContent className="p-6 text-sm text-gray-600">Loading proposals...</CardContent>
            </Card>
          </div>
        </div>
      </RequireAuth>
    )
  }

  if (!gig) {
    return (
      <RequireAuth>
        <AuthNavbar />
        <div className="min-h-[calc(100vh-64px)] bg-[var(--secondary)]">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Card className="rounded-2xl">
              <CardContent className="p-6 text-sm text-gray-600">Gig not found.</CardContent>
            </Card>
          </div>
        </div>
      </RequireAuth>
    )
  }

  if (!isOwner) {
    return (
      <RequireAuth>
        <AuthNavbar />
        <div className="min-h-[calc(100vh-64px)] bg-[var(--secondary)]">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Card className="rounded-2xl">
              <CardContent className="p-6 text-sm text-gray-700">
                <div className="font-extrabold">You don’t have access to this page.</div>
                <div className="mt-2 text-gray-600">Only the gig owner can view proposals.</div>
                <div className="mt-4">
                  <Link
                    href={`/dashboard/gigs/${gig.id}`}
                    className="text-sm font-extrabold text-[var(--primary)] hover:underline"
                  >
                    Back to gig →
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </RequireAuth>
    )
  }

  const hiresNeeded = Math.max(1, Number(gig.hiresNeeded || 1))
  const budgetFallback = gigBudgetLabel(gig)

  return (
    <RequireAuth>
      <AuthNavbar />

      <div className="min-h-[calc(100vh-64px)] bg-[var(--secondary)]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-sm font-extrabold text-gray-700 hover:text-[var(--primary)] transition"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <div className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border bg-white">
                <Sparkles size={16} className="text-[var(--primary)]" />
                <span className="text-gray-700">Proposals</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-extrabold truncate">{gig.title}</h1>
                <div className="mt-1 text-sm text-gray-600 font-semibold inline-flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2">
                    <Users size={14} className="text-[var(--primary)]" />
                    {items.length} proposal{items.length === 1 ? "" : "s"}
                  </span>

                  <span className="text-gray-300">•</span>

                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[var(--primary)]" />
                    {acceptedCount}/{hiresNeeded} accepted
                  </span>

                  {gig.status === "closed" && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="inline-flex items-center gap-2 text-gray-700">
                        <Lock size={14} className="text-[var(--primary)]" />
                        Gig closed
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="rounded-2xl border bg-white px-3 py-2 flex items-center gap-2">
                  <span className="text-xs font-extrabold text-gray-600">Hires</span>
                  <input
                    type="number"
                    min={1}
                    defaultValue={hiresNeeded}
                    onBlur={(e) => saveHiresNeeded(Number(e.target.value))}
                    className="w-20 rounded-xl border bg-white px-3 py-2 text-sm font-extrabold outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  <span className="text-xs text-gray-500 font-semibold">set and blur</span>
                </div>

                <div className="relative w-full md:w-[320px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search proposals…"
                    className="rounded-2xl pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mt-2">
              {TABS.map((t) => {
                const active = tab === t.key
                const count = t.key === "all" ? counts.all : counts[t.key] || 0
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`rounded-full px-4 py-2 text-sm font-extrabold border transition ${
                      active
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "bg-white text-gray-700 hover:shadow-sm"
                    }`}
                  >
                    {t.label}{" "}
                    <span className={`ml-1 ${active ? "text-white/90" : "text-gray-500"}`}>
                      ({count})
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* List */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              {filtered.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="p-6 text-sm text-gray-600">No proposals found.</CardContent>
                </Card>
              ) : (
                filtered.map((p, idx) => {
                  const name = getTalentName(p)
                  const displayRate = p.proposedRate ? `${money(p.proposedRate)}/hr` : budgetFallback
                  const displayDuration = p.proposedDuration || gig.duration || "—"

                  return (
                    <motion.button
                      key={p.talentUid}
                      onClick={() => openProposal(p)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02, duration: 0.22 }}
                      className="w-full text-left"
                    >
                      <Card className="rounded-2xl hover:shadow-md transition bg-white">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="font-extrabold text-gray-900 truncate">{name}</div>

                                <Badge
                                  className={`rounded-full ${
                                    p.status === "submitted"
                                      ? "bg-orange-100 text-orange-900 border border-orange-200"
                                      : p.status === "shortlisted"
                                      ? "bg-blue-100 text-blue-900 border border-blue-200"
                                      : p.status === "accepted"
                                      ? "bg-green-100 text-green-900 border border-green-200"
                                      : p.status === "rejected"
                                      ? "bg-red-100 text-red-900 border border-red-200"
                                      : "bg-gray-100 text-gray-700 border border-gray-200"
                                  }`}
                                >
                                  {p.status}
                                </Badge>

                                {p.viewedAt ? (
                                  <Badge className="rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                                    Viewed
                                  </Badge>
                                ) : (
                                  <Badge className="rounded-full bg-[var(--primary)] text-white">New</Badge>
                                )}
                              </div>

                              <div className="text-xs text-gray-500 font-semibold mt-1 truncate">
                                {getTalentEmail(p)}
                              </div>

                              <div className="mt-3 text-sm text-gray-700 line-clamp-2 whitespace-pre-wrap">
                                {p.coverLetter}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-xs text-gray-500 font-semibold">Rate</div>
                              <div className="text-lg font-extrabold">{displayRate}</div>
                              <div className="text-xs text-gray-500 font-semibold mt-2">Duration</div>
                              <div className="text-sm font-extrabold">{displayDuration}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.button>
                  )
                })
              )}
            </div>

            {/* Right rail */}
            <div className="space-y-4 hidden lg:block">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold">Hiring rule</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  When <span className="font-semibold">accepted</span> reaches your hires number, the gig closes automatically.
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold">Tip</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  Opening a proposal sets <span className="font-semibold">viewedAt</span> and locks talent edits.
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Drawer / Modal */}
          {open && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full md:max-w-3xl bg-white rounded-t-2xl md:rounded-2xl overflow-hidden"
              >
                <div className="p-5 border-b flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-lg font-extrabold truncate">{getTalentName(open)}</div>
                    <div className="text-xs text-gray-500 font-semibold mt-1 truncate">{getTalentEmail(open)}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge className="rounded-full bg-white border text-gray-700">{open.status}</Badge>
                      {open.viewedAt ? (
                        <Badge className="rounded-full bg-gray-100 text-gray-700 border border-gray-200">Viewed</Badge>
                      ) : (
                        <Badge className="rounded-full bg-[var(--primary)] text-white">New</Badge>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setOpen(null)}
                    className="h-10 w-10 rounded-xl border bg-white flex items-center justify-center hover:shadow-sm transition"
                    aria-label="Close"
                  >
                    <XCircle size={18} />
                  </button>
                </div>

                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                  <Card className="rounded-2xl">
                    <CardContent className="p-4 text-sm text-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="rounded-2xl border bg-white p-4">
                          <div className="text-xs text-gray-500 font-semibold">Rate</div>
                          <div className="text-lg font-extrabold mt-1">
                            {open.proposedRate ? `${money(open.proposedRate)}/hr` : budgetFallback}
                          </div>
                          {!open.proposedRate && (
                            <div className="text-xs text-gray-500 font-semibold mt-1">
                              (Using gig budget)
                            </div>
                          )}
                        </div>

                        <div className="rounded-2xl border bg-white p-4">
                          <div className="text-xs text-gray-500 font-semibold">Duration</div>
                          <div className="text-lg font-extrabold mt-1">
                            {open.proposedDuration || gig.duration || "—"}
                          </div>
                          {!open.proposedDuration && (
                            <div className="text-xs text-gray-500 font-semibold mt-1">
                              (Using gig duration)
                            </div>
                          )}
                        </div>

                        <div className="rounded-2xl border bg-white p-4">
                          <div className="text-xs text-gray-500 font-semibold">Talent profile</div>
                          {getTalentSlug(open) ? (
                            <Link
                              href={`/talent/${getTalentSlug(open)}`}
                              className="mt-1 inline-flex items-center gap-2 text-[var(--primary)] font-extrabold hover:underline"
                            >
                              <ExternalLink size={16} />
                              View
                            </Link>
                          ) : (
                            <div className="mt-2 text-xs text-gray-500 font-semibold">
                              Slug not found yet (add talentSlug on submit)
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="text-sm font-extrabold">Cover letter</div>
                      <div className="mt-2 whitespace-pre-wrap rounded-2xl border bg-white p-4">{open.coverLetter}</div>

                      {!!open.attachments?.length && (
                        <>
                          <Separator className="my-4" />
                          <div className="text-sm font-extrabold">Attachments</div>
                          <div className="mt-2 space-y-2">
                            {open.attachments.map((a, idx) => (
                              <a
                                key={a.url + idx}
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3 hover:shadow-sm transition"
                              >
                                <div className="min-w-0">
                                  <div className="font-extrabold text-sm truncate">{a.name}</div>
                                  <div className="text-xs text-gray-500 font-semibold">{a.contentType || "file"}</div>
                                </div>
                                <span className="inline-flex items-center gap-2 text-sm font-extrabold text-[var(--primary)]">
                                  <Download size={16} />
                                  Open
                                </span>
                              </a>
                            ))}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Actions */}
                <div className="p-5 border-t flex flex-col md:flex-row gap-2">
                  <button
                    disabled={mutating || open.status === "shortlisted" || open.status === "accepted"}
                    onClick={() => setStatus(open, "shortlisted")}
                    className="w-full md:flex-1 rounded-2xl border bg-white px-5 py-2 text-sm font-extrabold hover:shadow-sm transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    <Star size={16} className="text-[var(--primary)]" />
                    Shortlist
                  </button>

                  <button
                    disabled={mutating || open.status === "accepted" || (open.status === "submitted" && acceptedCount >= hiresNeeded)}
                    onClick={() => setStatus(open, "accepted")}
                    className="w-full md:flex-1 rounded-2xl bg-[var(--primary)] text-white px-5 py-2 text-sm font-extrabold hover:opacity-90 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    Accept
                  </button>

<button
  disabled={mutating || open.status === "rejected" || open.status === "accepted"}
  onClick={() => setStatus(open, "rejected")}
  className="w-full md:flex-1 rounded-2xl border bg-white px-5 py-2 text-sm font-extrabold hover:shadow-sm transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
>
  <XCircle size={16} />
  Reject
</button>

{/* Message talent shows only after shortlisted or accepted */}
{(open.status === "shortlisted" || open.status === "accepted") && (
  <button
    onClick={async () => {
      // Step C: Hard guard for required UIDs
      if (!gig?.id || !gig.clientUid || !open?.talentUid) {
        toast.error("Missing participant data. Refresh and try again.")
        return
      }

      // Verify user is the gig owner
      if (!user?.uid || user.uid !== gig.clientUid) {
        toast.error("You must be the gig owner to message talent.")
        return
      }

      try {
        const threadId = await ensureThread({
          gigId: gig.id,
          gigTitle: gig.title,
          clientUid: user.uid,
          clientName: user?.displayName || "Client",
          talentUid: open.talentUid,
          talentName: getTalentName(open),
        })

        // Save threadId to proposal
        await updateDoc(doc(db, "gigs", gig.id, "proposals", open.talentUid), {
          threadId,
          updatedAt: serverTimestamp(),
        })

        router.push(`/dashboard/messages/${threadId}`)
      } catch (e: any) {
        console.error("ensureThread failed with error:", {
          code: e?.code,
          message: e?.message,
          fullError: e,
        })
        const errorMsg = e?.code === "permission-denied" 
          ? "Permission denied. Check Firestore rules for /threads/{threadId}. Rule must allow: request.auth.uid in participants"
          : e?.message || "Failed to start chat"
        toast.error(errorMsg)
      }
    }}
    className="w-full md:w-auto rounded-2xl border bg-white px-5 py-2 text-sm font-extrabold hover:shadow-sm transition inline-flex items-center justify-center gap-2"
  >
    <Mail size={16} />
    Message talent
  </button>
)}
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  )
}
