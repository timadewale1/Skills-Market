"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useState } from "react"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore"
import Link from "next/link"
import { motion } from "framer-motion"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, ArrowRight, Clock } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ProposalIndex = {
  gigId: string
  title?: string
  updatedAt?: any
}

type Proposal = {
  status?: "submitted" | "shortlisted" | "accepted" | "rejected" | "withdrawn"
  viewedAt?: any | null
  updatedAt?: any
}

type Row = {
  gigId: string
  title: string
  status: NonNullable<Proposal["status"]>
  updatedAt?: any
  viewedAt?: any | null
}

function toDate(v: any): Date | null {
  if (!v) return null
  if (v instanceof Date) return v
  if (v?.toDate) return v.toDate()
  if (v instanceof Timestamp) return v.toDate()
  return null
}

function timeAgo(d?: Date | null) {
  if (!d) return "-"
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 10) return "just now"
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  const wk = Math.floor(day / 7)
  if (wk < 5) return `${wk}w ago`
  const mo = Math.floor(day / 30)
  if (mo < 12) return `${mo}mo ago`
  const yr = Math.floor(day / 365)
  return `${yr}y ago`
}

function statusBadge(v: Row["status"]) {
  if (v === "accepted")
    return <Badge className="rounded-full bg-green-100 text-green-800 border border-green-200">accepted</Badge>
  if (v === "shortlisted")
    return <Badge className="rounded-full bg-blue-100 text-blue-800 border border-blue-200">shortlisted</Badge>
  if (v === "rejected")
    return <Badge className="rounded-full bg-red-100 text-red-800 border border-red-200">rejected</Badge>
  if (v === "withdrawn")
    return <Badge className="rounded-full bg-gray-100 text-gray-700 border border-gray-200">withdrawn</Badge>
  return <Badge className="rounded-full bg-orange-100 text-orange-900 border border-orange-200">submitted</Badge>
}

export default function TalentProposalsHubPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<Row[]>([])

  const [q, setQ] = useState("")
  const [status, setStatus] = useState<
    "all" | "submitted" | "shortlisted" | "accepted" | "rejected" | "withdrawn"
  >("all")

  useEffect(() => {
    const run = async () => {
      if (!user?.uid) return
      setLoading(true)

      // 1) index docs (fast list)
      const idxSnap = await getDocs(
        query(collection(db, "users", user.uid, "proposals"), orderBy("updatedAt", "desc"))
      )

      const idx = idxSnap.docs.map((d) => ({ gigId: d.id, ...(d.data() as any) })) as ProposalIndex[]

      // 2) hydrate from canonical proposal docs (accurate status)
      const hydrated = await Promise.all(
        idx.map(async (i) => {
          try {
            const pSnap = await getDoc(doc(db, "gigs", i.gigId, "proposals", user.uid))
            const p = (pSnap.exists() ? (pSnap.data() as Proposal) : null)

            const status = (p?.status || "submitted") as Row["status"]
            const updatedAt = p?.updatedAt || i.updatedAt
            const title = i.title || "Untitled gig"

            return {
              gigId: i.gigId,
              title,
              status,
              updatedAt,
              viewedAt: p?.viewedAt ?? null,
            } as Row
          } catch {
            // if something fails, still show the index row
            return {
              gigId: i.gigId,
              title: i.title || "Untitled gig",
              status: "submitted",
              updatedAt: i.updatedAt,
              viewedAt: null,
            } as Row
          }
        })
      )

      setRows(hydrated)
      setLoading(false)
    }

    run()
  }, [user?.uid])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false
      if (!s) return true
      const blob = `${r.title} ${r.status}`.toLowerCase()
      return blob.includes(s)
    })
  }, [rows, q, status])

  return (
    <RequireAuth>
      <AuthNavbar />

      <div className="min-h-[calc(100vh-64px)] bg-[var(--secondary)]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Your proposals</h1>
            <p className="text-sm text-gray-600 mt-1">
              Track proposals - edits lock once the client views your proposal.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by gig title or status…"
                className="rounded-2xl pl-9"
              />
            </div>

            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger className="rounded-2xl bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              {loading ? (
                <Card className="rounded-2xl"><CardContent className="p-6 text-sm text-gray-600">Loading…</CardContent></Card>
              ) : filtered.length === 0 ? (
                <Card className="rounded-2xl"><CardContent className="p-6 text-sm text-gray-600">No proposals found.</CardContent></Card>
              ) : (
                filtered.map((r, idx) => {
                  const updated = toDate(r.updatedAt)
                  return (
                    <motion.div
                      key={r.gigId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02, duration: 0.22 }}
                    >
                      <Link href={`/dashboard/proposals/${r.gigId}`} className="block">
                        <Card className="rounded-2xl hover:shadow-md transition bg-white">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="font-extrabold truncate">{r.title}</div>
                                  {statusBadge(r.status)}
                                </div>

                                <div className="mt-2 text-xs text-gray-500 font-semibold inline-flex items-center gap-2">
                                  <Clock size={14} className="text-[var(--primary)]" />
                                  Updated {timeAgo(updated)}
                                </div>
                              </div>

                              <div className="shrink-0 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--primary)]">
                                Open <ArrowRight size={16} />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  )
                })
              )}
            </div>

            <div className="hidden lg:block space-y-4">
              <Card className="rounded-2xl">
                <CardHeader><CardTitle className="text-base font-extrabold">Tip</CardTitle></CardHeader>
                <CardContent className="text-sm text-gray-600">
                  Status here is pulled from the live proposal doc, so “accepted” will match what the client sees.
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
