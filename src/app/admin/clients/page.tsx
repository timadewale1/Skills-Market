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
  Briefcase,
  Star,
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { pickClientCategories, pickClientPhoto } from "@/lib/publicClients"

type ClientRow = {
  uid: string
  slug?: string
  fullName: string
  location?: string
  companyName?: string
  photoURL?: string
  categories?: string[]
  sdgTags?: string[]
  rating?: { avg?: number; count?: number }
  verification?: { status?: string }
  disabled?: boolean
  openGigsCount?: number
}

export default function AdminClientsPage() {
  const [items, setItems] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)

  // search
  const [search, setSearch] = useState("")

  // filters
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<"all" | "verified" | "pending" | "not_submitted">("all")

  useEffect(() => {
    const run = async () => {
      setLoading(true)

      // clients
      const clientsSnap = await getDocs(
        query(collection(db, "publicProfiles"), where("role", "==", "client"))
      )
      const clients = clientsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))

      // open gigs (to compute counts per client)
      const gigsSnap = await getDocs(
        query(collection(db, "gigs"), where("status", "==", "open"))
      )
      const gigs = gigsSnap.docs.map((d) => d.data() as any)

      const countByUid = new Map<string, number>()
      for (const g of gigs) {
        const uid = g.clientUid
        if (!uid) continue
        countByUid.set(uid, (countByUid.get(uid) || 0) + 1)
      }

      const rows: ClientRow[] = clients.map((c: any) => {
        const uid = c.uid || c.id
        const orgName = c.client?.orgName || c.clientOrgName || c.fullName || "Unnamed Organization"
        const photoURL = pickClientPhoto(c)
        const categories = pickClientCategories(c)

        return {
          uid,
          slug: c.slug,
          fullName: orgName,
          location: c.location || "",
          companyName: c.client?.companyName || c.companyName,
          photoURL,
          categories,
          sdgTags: c.sdgTags || [],
          rating: c.rating || { avg: 0, count: 0 },
          verification: c.verification || { status: "not_submitted" },
          disabled: c.disabled || false,
          openGigsCount: countByUid.get(uid) || 0,
        }
      })

      setItems(rows)
      setLoading(false)
    }

    run()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return items.filter((c) => {
      // search text
      if (q) {
        const hay = [
          c.fullName,
          c.companyName,
          c.location,
          (c.categories || []).join(" "),
          (c.sdgTags || []).join(" "),
        ].filter(Boolean).join(" ").toLowerCase()

        if (!hay.includes(q)) return false
      }

      // verification status
      if (verificationStatus !== "all" && c.verification?.status !== verificationStatus) return false

      return true
    })
  }, [items, search, verificationStatus])

  const handleAction = async (action: string, client: ClientRow) => {
    try {
      const publicProfileRef = doc(db, "publicProfiles", client.uid)
      const userRef = doc(db, "users", client.uid)

      switch (action) {
        case "verify":
          await updateDoc(publicProfileRef, {
            "verification.status": "verified"
          })
          toast.success("Client verified successfully")
          break
        case "reject":
          await updateDoc(publicProfileRef, {
            "verification.status": "rejected"
          })
          toast.success("Verification rejected")
          break
        case "disable":
          await updateDoc(publicProfileRef, { disabled: true })
          toast.success("Client disabled")
          break
        case "enable":
          await updateDoc(publicProfileRef, { disabled: false })
          toast.success("Client enabled")
          break
        case "delete":
          await deleteDoc(publicProfileRef)
          await deleteDoc(userRef)
          toast.success("Client deleted")
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
              <h1 className="text-2xl md:text-3xl font-extrabold">Manage Clients</h1>
              <p className="text-gray-600 mt-1 text-sm">
                Search, filter, and manage client profiles — verify, disable, or edit details.
              </p>
            </div>

            {/* Search (desktop only here) */}
            <div className="hidden md:block w-[420px]">
              <div className="relative">
                <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients..."
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
                Search by <span className="font-bold">company name</span>, <span className="font-bold">location</span>, or{" "}
                <span className="font-bold">industry</span> for best matches.
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-extrabold">Filters</div>
                  <div className="text-xs text-gray-600">
                    {verificationStatus !== "all" ? "Active filters applied" : "No filters applied"}
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
                placeholder="Search clients..."
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
                  <CardContent className="p-6 text-sm text-gray-600">Loading clients...</CardContent>
                </Card>
              ) : filtered.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="p-6 text-sm text-gray-600">No clients found.</CardContent>
                </Card>
              ) : (
                filtered.map((c) => (
                  <Card key={c.uid} className="rounded-2xl hover:shadow-md transition">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center font-extrabold text-[var(--primary)] overflow-hidden">
                            {c.photoURL ? (
                              <img src={c.photoURL} alt={c.fullName} className="h-full w-full object-cover" />
                            ) : (
                              (c.fullName || "C").slice(0, 1).toUpperCase()
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Link
                                href={`/admin/clients/${c.slug || c.uid}`}
                                className="font-extrabold text-gray-900 hover:text-[var(--primary)] transition"
                              >
                                {c.fullName}
                              </Link>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                c.verification?.status === "verified"
                                  ? "bg-green-100 text-green-700"
                                  : c.verification?.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}>
                                {c.verification?.status === "verified" ? "Verified" :
                                 c.verification?.status === "pending" ? "Pending" : "Not Submitted"}
                              </span>
                              {c.disabled && (
                                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                                  Disabled
                                </span>
                              )}
                            </div>

                            <div className="text-sm text-gray-700 font-semibold mb-1">
                              {c.companyName || "Company not specified"}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                              <span>{c.location || "Location not set"}</span>
                              <span>{c.openGigsCount || 0} open gigs</span>
                            </div>

                            <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                              {c.rating?.count ? (
                                <>
                                  <Star size={12} className="text-yellow-500 fill-current" />
                                  {c.rating.avg?.toFixed(1)} ({c.rating.count} reviews)
                                </>
                              ) : (
                                "No reviews yet"
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1 mb-2">
                              {(c.categories || []).slice(0, 3).map((category) => (
                                <span key={category} className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                  {category}
                                </span>
                              ))}
                              {(c.categories || []).length > 3 && (
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                  +{(c.categories || []).length - 3} more
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {(c.sdgTags || []).slice(0, 2).map((sdg) => (
                                <span key={sdg} className="text-xs px-2 py-1 rounded-full border text-gray-700">
                                  {sdg}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/admin/clients/${c.slug || c.uid}`}
                            className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:shadow-sm transition"
                          >
                            <Edit size={14} />
                            Edit
                          </Link>

                          <div className="flex flex-col gap-1">
                            {c.verification?.status !== "verified" && (
                              <button
                                onClick={() => handleAction("verify", c)}
                                className="inline-flex items-center gap-2 rounded-xl bg-green-600 text-white px-3 py-2 text-sm font-semibold hover:bg-green-700 transition"
                              >
                                <CheckCircle size={14} />
                                Verify
                              </button>
                            )}

                            {c.verification?.status === "pending" && (
                              <button
                                onClick={() => handleAction("reject", c)}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 text-white px-3 py-2 text-sm font-semibold hover:bg-red-700 transition"
                              >
                                <X size={14} />
                                Reject
                              </button>
                            )}

                            {!c.disabled ? (
                              <button
                                onClick={() => handleAction("disable", c)}
                                className="inline-flex items-center gap-2 rounded-xl bg-yellow-600 text-white px-3 py-2 text-sm font-semibold hover:bg-yellow-700 transition"
                              >
                                <Ban size={14} />
                                Disable
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction("enable", c)}
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
                  Use company names, locations, or industries for best matches.
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[var(--primary)]" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Verification Status</label>
                    <select
                      value={verificationStatus}
                      onChange={(e) => setVerificationStatus(e.target.value as any)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="all">All Statuses</option>
                      <option value="verified">Verified</option>
                      <option value="pending">Pending</option>
                      <option value="not_submitted">Not Submitted</option>
                    </select>
                  </div>
                </CardContent>
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

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Verification Status</label>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value as any)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="not_submitted">Not Submitted</option>
                </select>
              </div>
            </div>

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