"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { MapPin, Star, Briefcase } from "lucide-react"
import { pickClientCategories, pickClientPhoto } from "@/lib/publicClients"

type ClientRow = {
  uid: string
  slug: string
  name: string
  location?: string
  photoURL?: string
  ratingAvg: number
  ratingCount: number
  verification?: { status?: string }
  categories: string[]
  openGigsCount: number
}

const PAGE_SIZE = 10

export default function ClientsBrowsePage() {
  const { user } = useAuth()
  const TopNav = user ? <AuthNavbar /> : <Navbar />

  const [items, setItems] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

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
        const ratingAvg = Number(c?.rating?.avg || 0)
        const ratingCount = Number(c?.rating?.count || 0)

        return {
          uid,
          slug: c.slug,
          name: orgName,
          location: c.location || "",
          photoURL,
          ratingAvg,
          ratingCount,
          verification: c.verification || { status: "not_submitted" },
          categories,
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
    if (!q) return items
    return items.filter((c) => {
      const hay = [
        c.name,
        c.location || "",
        (c.categories || []).join(" "),
      ]
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [items, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  useEffect(() => {
    setPage(1)
  }, [search])

  return (
    <div className="min-h-screen bg-[var(--secondary)]">
      {TopNav}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Browse Clients</h1>
            <p className="text-gray-600 mt-1 text-sm">
              View organizations, their hiring focus, and open gigs.
            </p>
          </div>

          <div className="w-full md:w-[420px]">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by org, categories, location..."
              className="rounded-2xl"
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {loading ? (
            <Card className="rounded-2xl">
              <CardContent className="p-6 text-sm text-gray-600">Loading clients...</CardContent>
            </Card>
          ) : pageItems.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-6 text-sm text-gray-600">No clients found.</CardContent>
            </Card>
          ) : (
            pageItems.map((c, idx) => {
              const verified = c.verification?.status === "verified"
              return (
                <motion.div
                  key={c.uid}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.25 }}
                >
                  <Link href={`/clients/${c.slug}`} className="block">
                    <Card className="rounded-2xl hover:shadow-md transition bg-white">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center font-extrabold text-[var(--primary)] overflow-hidden">
                            {c.photoURL ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.photoURL} alt={c.name} className="h-full w-full object-cover" />
                            ) : (
                              c.name.slice(0, 1).toUpperCase()
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="font-extrabold text-gray-900 truncate">{c.name}</div>
                              <Badge className={`rounded-full ${verified ? "bg-[var(--primary)] text-white" : "bg-gray-200 text-gray-700"}`}>
                                {verified ? "Verified" : "Not verified"}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mt-2">
                              <span className="inline-flex items-center gap-2 font-semibold">
                                <MapPin size={14} />
                                {c.location || "Location not set"}
                              </span>

                              <span className="inline-flex items-center gap-2 font-semibold">
                                <Star size={14} className="text-[var(--primary)]" />
                                {c.ratingAvg ? c.ratingAvg.toFixed(1) : "-"} ({c.ratingCount || 0})
                              </span>

                              <span className="inline-flex items-center gap-2 font-semibold">
                                <Briefcase size={14} className="text-[var(--primary)]" />
                                {c.openGigsCount} open gig{c.openGigsCount === 1 ? "" : "s"}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-3">
                              {(c.categories || []).slice(0, 8).map((t) => (
                                <span
                                  key={t}
                                  className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
                                >
                                  {t}
                                </span>
                              ))}
                              {!c.categories?.length && <span className="text-xs text-gray-500">(No categories yet)</span>}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-gray-500 font-semibold">View</div>
                            <div className="text-sm font-extrabold text-[var(--primary)]">Profile →</div>
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

        {!loading && filtered.length > PAGE_SIZE && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              className="px-4 py-2 rounded-2xl border bg-white font-extrabold disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>

            <div className="text-sm font-extrabold">
              Page {page} / {totalPages}
            </div>

            <button
              className="px-4 py-2 rounded-2xl border bg-white font-extrabold disabled:opacity-40"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
